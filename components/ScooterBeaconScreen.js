// components/ScooterBeaconScreen.js

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

const COMPANY_ID = 0x004C; // Apple company ID

const ScooterBeaconScreen = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [payloadHex, setPayloadHex] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [clockError, setClockError] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    requestPermissions()
      .then(() => {
        BleAdvertiser.setCompanyId(COMPANY_ID);
        syncClock();
      })
      .catch((err) => {
        Alert.alert('Permissions Error', err.message);
      });

    return () => {
      stopBeacon();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(result).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) throw new Error('Required permissions not granted');
    }
  };

  const syncClock = async () => {
    setIsSyncing(true);
    setClockError(null);
    try {
      const res = await fetch(
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json.dateTime) throw new Error('Invalid response format: missing dateTime');

      const internetDate = new Date(json.dateTime + 'Z');
      const internetTimeMs = internetDate.getTime();
      const localTimeMs = Date.now();
      const offset = internetTimeMs - localTimeMs;

      setTimeOffset(offset);
      setIsSynced(true);

      const randomHex = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0')
        .toUpperCase();
      setDeviceId(`Scooter-${randomHex}`); // 👈 Updated prefix

      generatePayload(offset);
    } catch (err) {
      setClockError(err.message || 'Unknown error');
      setIsSynced(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const generatePayload = (offsetMs) => {
    try {
      const timestamp = Buffer.alloc(6);
      const now = Date.now() + offsetMs;
      timestamp.writeUIntBE(now, 0, 6); // Only timestamp, no 'Scooter' prefix
      setPayloadHex(timestamp.toString('hex'));
      Vibration.vibrate(100);
      return timestamp;
    } catch (err) {
      console.error('Payload generation error:', err);
      setError(err.message);
      return null;
    }
  };

  const startBeacon = async () => {
    if (!isSynced) {
      Alert.alert('Sync Required', 'Please sync the clock before advertising.');
      return;
    }

    const payloadBuffer = generatePayload(timeOffset);
    if (!payloadBuffer) return;

    try {
      const base64Payload = payloadBuffer.toString('base64');

      await BleAdvertiser.broadcast(
        '00000000-0000-1000-8000-00805F9B34FB',
        [1, 0],
        {
          includeDeviceName: false,
          includeTxPowerLevel: true,
          manufacturerData: base64Payload,
        }
      );

      setIsBroadcasting(true);
      console.log('[BLE] Beacon started with payload:', payloadHex);
    } catch (err) {
      console.error('[BLE] Start failed:', err.message);
      setError(err.message);
    }
  };

  const stopBeacon = async () => {
    try {
      await BleAdvertiser.stopBroadcast();
      setIsBroadcasting(false);
      console.log('[BLE] Beacon stopped');
    } catch (err) {
      console.error('[BLE] Stop failed:', err.message);
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛴 Scooter Beacon</Text>

      {!isSynced ? (
        <>
          <Text style={styles.status}>
            {isSyncing ? '🔄 Syncing time…' : '⚠️ Clock not synced.'}
          </Text>
          {clockError && <Text style={styles.error}>{clockError}</Text>}
          {!isSyncing && (
            <Button title="Retry Sync" onPress={syncClock} color="#007BFF" />
          )}
        </>
      ) : (
        <>
          <Text style={styles.status}>✅ Clock Synced</Text>

          <Text style={styles.label}>Device ID:</Text>
          <Text selectable style={styles.mono}>{deviceId}</Text>

          <Text style={styles.label}>Payload (hex):</Text>
          <Text selectable style={styles.mono}>{payloadHex}</Text>

          {!isBroadcasting ? (
            <Button title="Start Beacon" onPress={startBeacon} />
          ) : (
            <Button title="Stop Beacon" onPress={stopBeacon} color="#d9534f" />
          )}
        </>
      )}

      {error && <Text style={styles.error}>❌ {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  mono: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    fontSize: 14,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ScooterBeaconScreen;
