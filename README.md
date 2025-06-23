# BLE scanner application

This reposatory shows an example Android application for a bluetooth low energy scanner written is react native, using expo. Step by step I will guide you how to develop and deploy into production this application. The goal is to scan the nearby smartphones with enabled bluetooth (with different IDs) and estimate it's relative distance for each source. Nowadays the electric rollers (scooters) are great risk to car traffic. The aim is to alarm the smartphone users (cars), to prepare the nearby scooter traffic. The drawback of this application is that it can identify any kind of ble devices, like smartwatches. Therefore it would be a cool to implement a separate mode for cars (scan) and another mode for scooters (beacon) in the same application.

## 1. Install Expo go on your Android smartphone

https://play.google.com/store/apps/details?id=host.exp.exponent

## 2. Enable Developer mode on your Android smartphone

https://developer.android.com/studio/debug/dev-options

## 3. Connect your Android smartphone to your computer via USB cable

## 4. Install Node.js on your computer

https://nodejs.org/en

Set the necessary environmental variables.

## 5. Install GIT in your computer

Make you sure to choose that option during the installation which command line interface supports git commands.

https://git-scm.com

## 6. Install Android Studio on your computer

https://developer.android.com/studio/install

Set the necessary environmental variables.

## 7. Install Java Development Kit (JDK) 21 on your computer

https://www.oracle.com/java/technologies/downloads/#jdk21-windows

Set the necessary environmental variables.

## 8. Make an account on Expo dev

https://expo.dev

## 9. Project setup using Expo

```
npx create-expo-app@latest
```

## 10. Install the react native react-native-ble-manager library

```
cd <project_name>
```

```
npx expo install react-native-ble-manager
```

## 11. In your app.json file extend the plugin config to enable the package work.

```JSON
"plugins": [
      "expo-router",
      [
        "react-native-ble-manager",
        {
          "isBleRequired": true,
          "neverForLocation": true,
          "companionDeviceEnabled": false,
          "bluetoothAlwaysPermission": "Allow BLE DEMO APP to connect to bluetooth devices"
        }
      ]
]
```

## 12 Create your eas.json file

```JSON
{
  "cli": {
    "version": ">= 3.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "channel": "development"
    }
  }
}
```

## 13 Create prebuild

```
npx expo prebuild
```

## 14. Unplug device

## 15. Restart adb and remove adbkey

```
adb kill-server
```

Remove adbkey file from ```c:/Users/<Username>/.android```

```
adb start-server
```

## 16. Plug device

## 17. Starting the application in the development framework

```
npx expo run:android
```

This process will take sime time for the first run.

## 18. Have a look to the application

## 19. Install react-native-ble-plx

```
npx expo install react-native-ble-plx
```

## 20. Update your eas.json file

```JSON
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 21. Install expo device

```
npx expo install expo-device
```

## 22. Add plugins to your app.json file

```JSON
 "plugins": [
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": true,
          "modes": ["peripheral", "central"],
          "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to bluetooth devices"
        }
      ]
    ]
```

## 23. Install eas-cli

```
npx npm install eas-cli
```

## 24 Install expo-dev-client

```
npx expo install expo-dev-client
```

## 25. Do the software development

## 26. Create prebuild

```
npx expo prebuild
```

## 27. Update your AndroidManifest.xml

Locate and update your AndroidManifest.xml from ```<project_name>\android\app\src\main\AndroidManifest.xml```

```xml
<uses-permission-sdk-23 android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission-sdk-23 android:name="android.permission.ACCESS_FINE_LOCATION"/>
<!-- Permissions for Bluetooth scanning and connection -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<!-- Location permissions for Bluetooth scanning -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-feature android:name="android.hardware.bluetooth_le" android:required="true"/>
```

## 28. Starting the application in the development framework

```
npx expo run:android
```

At this point we finished doing the development and this reposatory contains every necessary files, except the node_modules and android folders because it's size.  Now let's turn this into production. In production you will have unique credentials, therefore I do not want to include them.

