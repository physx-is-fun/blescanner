import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import BleAdvertiser from 'react-native-ble-advertiser';

const COMPANY_ID = 0x004C; // Apple

const ScooterBeaconScreen = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await requestPermissions();
        BleAdvertiser.setCompanyId(COMPANY_ID);

        const randomHex = Math.floor(Math.random() * 0xffff)
          .toString(16)
          .padStart(4, '0')
          .toUpperCase();
        setDeviceId(`Scooter-${randomHex}`);
      } catch (err) {
        Alert.alert('Permission Error', err.message);
      }
    })();

    return () => {
      stopBeacon();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
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

  const generatePayload = () => {
    try {
      return Buffer.from(deviceId, 'utf-8');
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const startBeacon = async () => {
    const payloadBuffer = generatePayload();
    if (!payloadBuffer) return;

    try {
      const base64Payload = payloadBuffer.toString('base64');

      await BleAdvertiser.broadcast(
        '00000000-0000-1000-8000-00805F9B34FB',
        [1, 0],
        {
          includeDeviceName: true,
          includeTxPowerLevel: false,
          manufacturerData: base64Payload,
          advertiseMode: BleAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
          txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_HIGH,
        }
      );

      setIsBroadcasting(true);
      Vibration.vibrate(100);
      console.log('[BLE] Beacon started with payload:', deviceId);
    } catch (err) {
      setError(err.message);
      console.error('[BLE] Start failed:', err.message);
    }
  };

  const stopBeacon = async () => {
    try {
      await BleAdvertiser.stopBroadcast();
      setIsBroadcasting(false);
      console.log('[BLE] Beacon stopped');
    } catch (err) {
      setError(err.message);
      console.error('[BLE] Stop failed:', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛴 Scooter Beacon</Text>

      <Text style={styles.label}>Device ID:</Text>
      <Text selectable style={styles.mono}>{deviceId}</Text>

      {!isBroadcasting ? (
        <Button title="Start Beacon" onPress={startBeacon} />
      ) : (
        <Button title="Stop Beacon" onPress={stopBeacon} color="#d9534f" />
      )}

      {error && <Text style={styles.error}>❌ {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFF' },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  mono: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    fontSize: 14,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});

export default ScooterBeaconScreen;
