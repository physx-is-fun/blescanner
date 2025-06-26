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

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [clockSynced, setClockSynced] = useState(false);

  const [manager] = useState(() => new BleManager());

  useEffect(() => {
    requestPermissions();
    const stateSub = manager.onStateChange((state) => {
      if (state === 'PoweredOn' && !isScanning && clockSynced) {
        startScan();
      }
    }, true);

    const appSub = AppState.addEventListener('change', handleAppStateChange);

    const refreshInterval = setInterval(() => {
      setDevices(new Map(devicesRef.current));
    }, 100);

    syncClock();

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
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      } catch (err) {
        Alert.alert('Permission Error', err.message);
      }
    }
  };

  const handleAppStateChange = (nextState) => {
    if (nextState === 'active' && !isScanning && clockSynced) {
      startScan();
    } else if (nextState !== 'active' && isScanning) {
      stopScan();
    }
  };

  const syncClock = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (!json.dateTime) {
        throw new Error('Invalid response format: missing dateTime');
      }

      const internetDate = new Date(json.dateTime + 'Z');
      const internetTime = internetDate.getTime();
      const localTime = Date.now();
      const offset = internetTime - localTime;

      console.log(`[ClockSync] Offset: ${offset} ms`);
      setTimeOffset(offset);
      setClockSynced(true);
    } catch (err) {
      console.error('[ClockSync] Failed:', err.message);
      setSyncError(err.message || 'Unknown error');
      setClockSynced(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateDistance = (rssi) => {
    if (!rssi || rssi === 0) return -1;
    return Math.pow(10, (RSSI_AT_ONE_METER - rssi) / (10 * PATH_LOSS_EXPONENT));
  };

  const startScan = () => {
    if (isScanning || !clockSynced) return;
    setIsScanning(true);
    console.log('📡 Starting scan');

    manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        console.error('Scan error:', error.message);
        return;
      }

      if (device && device.id.includes('Scooter')) {
        let latency = null;
        let distance = calculateDistance(device.rssi);

        if (device.manufacturerData) {
          try {
            const buffer = Buffer.from(device.manufacturerData, 'base64');
            const tsBytes = buffer.slice(-6); // last 6 bytes = timestamp
            const beaconTime = tsBytes.readUIntBE(0, 6);
            const now = Date.now() + timeOffset;
            latency = now - beaconTime;
          } catch {
            latency = null;
          }
        }

        const isNew = !devicesRef.current.has(device.id);
        if (isNew) {
          Vibration.vibrate(300);
        }

        devicesRef.current.set(device.id, {
          id: device.id,
          name: device.name || 'unknown',
          rssi: device.rssi,
          distance,
          latency,
        });
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
      <Text>RSSI: {item.rssi} dBm</Text>
      <Text>
        Distance: {item.distance > 0 ? `${item.distance.toFixed(2)} m` : 'Unknown'}
      </Text>
      <Text>
        Latency:{' '}
        {item.latency !== null && item.latency >= 0
          ? `${item.latency} ms`
          : 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚗 Car Scanner</Text>

      {!clockSynced && (
        <>
          <Text style={styles.status}>
            {isSyncing ? '🔄 Syncing time…' : '⚠️ Clock not synced.'}
          </Text>
          {syncError && <Text style={styles.errorText}>{syncError}</Text>}
          {!isSyncing && (
            <Button title="Retry Sync" onPress={syncClock} color="#007BFF" />
          )}
        </>
      )}

      {clockSynced && (
        <>
          <Text style={styles.status}>✅ Clock Synced</Text>

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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
    color: 'red',
    textAlign: 'center',
  },
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
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    paddingVertical: 20,
  },
});

export default CarScreen;
