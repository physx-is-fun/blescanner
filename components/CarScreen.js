import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, PermissionsAndroid, StyleSheet, Text, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Constants for RSSI calculation
const RSSI_0 = -59; // Reference RSSI value at 1 meter
const N = 2; // Path loss exponent (ideal free space environment)

const CarScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]); // State to store discovered devices
  const [manager, setManager] = useState(null); // State to store BleManager instance

  // Request Bluetooth and Location permissions at runtime
  const requestPermissions = async () => {
    try {
      // Request ACCESS_FINE_LOCATION permission
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location to scan for Bluetooth devices.",
        }
      );

      if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "We need location access to scan for Bluetooth devices.");
        return;
      }

      // Request BLUETOOTH_SCAN permission
      const bluetoothScanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: "Bluetooth Scan Permission",
          message: "This app needs Bluetooth access to scan for nearby devices.",
        }
      );

      if (bluetoothScanPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "We need Bluetooth access to scan for devices.");
        return;
      }

      // Request BLUETOOTH_CONNECT permission (required for Android 12 and above)
      const bluetoothConnectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: "Bluetooth Connect Permission",
          message: "This app needs permission to connect to Bluetooth devices.",
        }
      );

      if (bluetoothConnectPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "We need Bluetooth connect access to interact with devices.");
        return;
      }

      console.log("All permissions granted!");
    } catch (err) {
      console.warn("Error requesting permissions:", err);
    }
  };

  // Initialize BleManager and request permissions when component mounts
  useEffect(() => {
    requestPermissions();
    const bleManager = new BleManager();
    setManager(bleManager);  // Store BleManager instance

    // Listen for Bluetooth state changes
    const subscription = bleManager.onStateChange((state) => {
      console.log("Bluetooth State:", state);
      if (state === 'PoweredOn') {
        console.log("Bluetooth is ready to use");
      } else {
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to use the app.');
      }
    }, true);

    // Cleanup on unmount
    return () => {
      subscription.remove();
      bleManager.destroy();
    };
  }, []);

  // Function to estimate distance from RSSI value
  const calculateDistance = (rssi) => {
    if (rssi === 0) return -1.0; // If RSSI is 0, return an invalid distance
    const ratio = rssi * 1.0 / RSSI_0;
    if (ratio < 1.0) {
      return Math.pow(ratio, N);
    } else {
      return 0.89976 * Math.pow(ratio, 7.7095) + 0.111; // Using a more accurate formula for larger distances
    }
  };

  // Start scanning for devices
  const handleStartScan = async () => {
    if (manager) {
      if (isScanning) {
        console.log("Scan already running.");
        return; // Prevent starting scan if it's already in progress
      }

      console.log("Starting scan...");
      setIsScanning(true);

      // Start scanning
      manager.startDeviceScan([], null, (error, device) => {
        if (error) {
          console.error("Scan error:", error);
          return;
        }

        if (device) {
          console.log(`Found device: ${device.name}`);

          // Filter out devices with no valid name and avoid duplicates
          if (device.name && device.name !== 'Unnamed Device') {
            setDevices((prevDevices) => {
              const updatedDevices = [
                ...prevDevices.filter((dev) => dev.id !== device.id),  // Remove device if it already exists
                { ...device, rssi: device.rssi },  // Add updated device with new RSSI value
              ];
              return updatedDevices;  // Return the updated list
            });
          }

          if (device.name && device.name.includes('Scooter')) {
            Alert.alert('Scooter Detected!', `Scooter found: ${device.name}`);
          }
        }
      });
    } else {
      console.error("BleManager is null, cannot start scan.");
    }
  };

  // Stop scanning for devices
  const handleStopScan = () => {
    if (manager) {
      console.log("Stopping scan...");
      manager.stopDeviceScan();
      setIsScanning(false);

      // Reset the devices list when scanning stops
      setDevices([]);  // This will clear the list of devices
    } else {
      console.error("BleManager is null, cannot stop scan.");
    }
  };

  // Render device item
  const renderDeviceItem = ({ item }) => {
    const distance = calculateDistance(item.rssi);  // Calculate distance from RSSI value
    return (
      <View style={styles.deviceItem}>
        <Text>Name: {item.name || 'Unnamed Device'}</Text>
        <Text>ID: {item.id}</Text>
        <Text>RSSI: {item.rssi} dBm</Text>
        <Text>Distance: {distance >= 0 ? `${distance.toFixed(2)} meters` : 'Unknown'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Car's Bluetooth Scanner</Text>
      <Button 
        title={isScanning ? "Stop Scanning" : "Start Scanning"}
        onPress={isScanning ? handleStopScan : handleStartScan}
      />
      
      <Text style={styles.deviceListHeader}>Nearby Devices:</Text>
      
      {devices.length === 0 ? (
        <Text>No devices detected.</Text>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  deviceListHeader: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  deviceItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
});

export default CarScreen;
