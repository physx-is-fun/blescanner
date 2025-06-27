// CarScreen.js
import { Buffer } from 'buffer';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const RSSI_AT_ONE_METER = -59;
const PATH_LOSS_EXPONENT = 2.0;

const CarScreen = () => {
  const [devices, setDevices] = useState(new Map());
  const devicesRef = useRef(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [manager] = useState(() => new BleManager());

  useEffect(() => {
    requestPermissions();

    const stateSub = manager.onStateChange((state) => {
      if (state === 'PoweredOn' && !isScanning) {
        startScan();
      }
    }, true);

    const appSub = AppState.addEventListener('change', handleAppStateChange);

    const refreshInterval = setInterval(() => {
      setDevices(new Map(devicesRef.current));
    }, 100);

    return () => {
      stateSub.remove();
      appSub.remove();
      clearInterval(refreshInterval);
      stopScan();
      manager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        Object.entries(granted).forEach(([perm, status]) => {
          console.log(`[Permission] ${perm}: ${status}`);
        });
      } catch (err) {
        console.error('[Permission] Error requesting permissions:', err.message);
        Alert.alert('Permission Error', err.message);
      }
    }
  };

  const handleAppStateChange = (nextState) => {
    if (nextState === 'active' && !isScanning) {
      startScan();
    } else if (nextState !== 'active' && isScanning) {
      stopScan();
    }
  };

  const calculateDistance = (rssi) => {
    if (!rssi || rssi === 0) return -1;
    return Math.pow(10, (RSSI_AT_ONE_METER - rssi) / (10 * PATH_LOSS_EXPONENT));
  };

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    console.log('📡 Starting scan');

    manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        console.error('Scan error:', error.message);
        return;
      }

      if (device && device.manufacturerData) {
        try {
          const buffer = Buffer.from(device.manufacturerData, 'base64');
          const idString = buffer.toString('utf-8');
          if (idString.startsWith('Scooter-')) {
            const distance = calculateDistance(device.rssi);

            const isNew = !devicesRef.current.has(device.id);
            if (isNew) {
              Vibration.vibrate(300);
            }

            devicesRef.current.set(device.id, {
              id: device.id,
              name: device.name || 'unknown',
              rssi: device.rssi,
              distance,
              scooterId: idString,
            });
          }
        } catch (err) {
          console.warn('Failed to parse beacon data:', err.message);
        }
      }
    });
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
    devicesRef.current.clear();
    setDevices(new Map());
    console.log('🛑 Stopped scan and cleared list');
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceItem}>
      <Text>Name: {item.name}</Text>
      <Text>ID: {item.id}</Text>
      <Text>Scooter ID: {item.scooterId || 'N/A'}</Text>
      <Text>RSSI: {item.rssi} dBm</Text>
      <Text>
        Distance: {item.distance > 0 ? `${item.distance.toFixed(2)} m` : 'Unknown'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚗 Car Scanner</Text>

      {!isScanning ? (
        <Button title="Start Scan" onPress={startScan} />
      ) : (
        <Button title="Stop Scan" onPress={stopScan} color="#d9534f" />
      )}

      <FlatList
        style={styles.listContainer}
        data={Array.from(devices.values())}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  listContainer: {
    maxHeight: 450,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  deviceItem: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
  },
});

export default CarScreen;
