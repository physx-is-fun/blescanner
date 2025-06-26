# BLE scanner application

This reposatory shows an example Android application for a bluetooth low energy scanner written is react native, using expo. Step by step I will guide you how to develop and deploy into production this application. The goal is to scan the nearby smartphones with enabled bluetooth (with different IDs) and estimate it's relative distance for each source. Nowadays the electric rollers (scooters) are great risk to car traffic. The aim is to alarm the smartphone users (cars), to prepare the nearby scooter traffic. Therefore I implemented a separate mode for cars (scan) and another mode for scooters (beacon) in the same application.

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

## 7. Install Java Development Kit (JDK) 20 on your computer

https://www.oracle.com/java/technologies/javase/jdk20-archive-downloads.html

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

## 17. Revoke USB debugging authorization, then disable USB debugging, and finally enable USB debugging on your smartphone

## 18. Starting the application in the development framework

```
npx expo run:android
```

This process will take sime time for the first run.

## 19. Have a look to the application

## 20. Install react-native-ble-plx

```
npx expo install react-native-ble-plx
```

## 21. Update your eas.json file

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

## 22. Install expo device

```
npx expo install expo-device
```

## 23. Add plugins to your app.json file

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

## 24. Install eas-cli

```
npx npm install eas-cli
```

## 25 Install expo-dev-client

```
npx expo install expo-dev-client
```

## 26 Install react-native-background-timer

```
npm install react-native-background-timer
```

## 27 Install react-native-ble-advertiser

```
npm install react-native-ble-advertiser
```

## 28. Do the software development

## 29. Create prebuild

```
npx expo prebuild
```

## 30. Update your AndroidManifest.xml

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
<!-- Permissions for Bluetooth advertising -->
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE"/>
<!-- Permissions for Internet -->
<uses-permission android:name="android.permission.INTERNET" />
```

## 30. Update your build.gradle

Locate and update your build.gradle from ```<project_name>\node_modules\react-native-ble-advertiser\android\build.gradle```

```
apply plugin: 'com.android.library'

android {
    compileSdkVersion 30
    buildToolsVersion "30.0.3"

    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 30
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
```

## 31. Starting the application in the development framework

```
npx expo run:android
```

At this point we finished doing the development and this reposatory contains every necessary files, except the node_modules and android folders because it's size.  Now let's turn this into production. In production you will have unique credentials, therefore I do not want to include them.

## 32. Login to your expo dev profile

```
eas login
```

## 33. EAS build configuration

```
eas build:configure
```

## 34. Replace your eas.json file

```JSON
{
  "cli": {
    "version": ">= 3.9.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {},
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

## 35. EAS preview built

```
eas build -p android --profile preview
```

## 36. Build locally your .aab file (optional)

https://docs.expo.dev/guides/local-app-production/

## 37. Convert locally your .apk file from .aab file (optional)

https://stackoverflow.com/questions/53040047/generate-an-apk-file-from-an-aab-file-android-app-bundle

## 38. Copy and paste your .apk file to your Android smartphone and install it