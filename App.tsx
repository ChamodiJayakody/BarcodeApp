import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
  Alert,
  StatusBar,
  useColorScheme,
  ScrollView,
} from 'react-native';

const { HoneywellScanner } = NativeModules;

interface BarcodeData {
  data: string;
  symbology: string;
  timestamp: string;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [scannedData, setScannedData] = useState<BarcodeData | null>(null);
  const [scanHistory, setScanHistory] = useState<BarcodeData[]>([]);
  const [scannerStatus, setScannerStatus] = useState<string>('Initializing...');

  useEffect(() => {
    initializeScanner();

    const barcodeListener = DeviceEventEmitter.addListener(
      'onBarcodeScanned',
      handleBarcodeScanned,
    );

    const failureListener = DeviceEventEmitter.addListener(
      'onBarcodeScanFailed',
      handleScanFailure,
    );

    return () => {
      barcodeListener.remove();
      failureListener.remove();
      HoneywellScanner?.disableScanner().catch((error: any) =>
        console.log('Error disabling scanner:', error),
      );
    };
  }, []);

  const initializeScanner = async () => {
    try {
      setScannerStatus('Initializing...');
      await HoneywellScanner.initializeScanner();
      await HoneywellScanner.enableScanner();
      setScannerStatus('Scanner Ready - Pull trigger to scan');
      console.log('Scanner initialized successfully');
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setScannerStatus('Scanner Error - Check device');
      Alert.alert(
        'Scanner Error',
        `Failed to initialize barcode scanner: ${error}`,
        [{ text: 'Retry', onPress: initializeScanner }, { text: 'OK' }],
      );
    }
  };

  const handleBarcodeScanned = (barcodeData: BarcodeData) => {
    console.log('Barcode scanned successfully:', barcodeData);
    setScannedData(barcodeData);
    setScanHistory(prev => [barcodeData, ...prev.slice(0, 9)]);

    Alert.alert(
      'Barcode Scanned Successfully',
      `Data: ${barcodeData.data}\nType: ${barcodeData.symbology}`,
      [{ text: 'OK' }],
    );
  };

  const handleScanFailure = (error: any) => {
    console.log('Scan failed:', error);
    setScannerStatus('Scan Failed - Try again');

    setTimeout(() => {
      setScannerStatus('Scanner Ready - Pull trigger to scan');
    }, 2000);
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
  };

  const textStyle = {
    color: isDarkMode ? '#FFFFFF' : '#000000',
  };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={[styles.title, textStyle]}>Honeywell CK65 Scanner</Text>
        <Text style={[styles.status, textStyle]}>Status: {scannerStatus}</Text>
      </View>
      <ScrollView>
        {scannedData ? (
          <View style={styles.scanResult}>
            <Text style={[styles.sectionTitle, textStyle]}>Last Scanned:</Text>
            <View style={styles.dataContainer}>
              <Text style={[styles.dataLabel, textStyle]}>Data:</Text>
              <Text style={[styles.dataValue, textStyle]}>
                {scannedData.data}
              </Text>

              <Text style={[styles.dataLabel, textStyle]}>Symbology:</Text>
              <Text style={[styles.dataValue, textStyle]}>
                {scannedData.symbology}
              </Text>

              <Text style={[styles.dataLabel, textStyle]}>Timestamp:</Text>
              <Text style={[styles.dataValue, textStyle]}>
                {new Date(parseInt(scannedData.timestamp)).toLocaleString()}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noData}>
            <Text style={[styles.noDataText, textStyle]}>
              No barcode scanned yet. Pull the trigger to scan.
            </Text>
          </View>
        )}

        {scanHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, textStyle]}>Scan History:</Text>
            <ScrollView style={styles.historyList}>
              {scanHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={[styles.historyData, textStyle]}>
                    {item.data}
                  </Text>
                  <Text style={[styles.historyTime, textStyle]}>
                    {new Date(parseInt(item.timestamp)).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanResult: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataContainer: {
    marginLeft: 10,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  dataValue: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  noData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historySection: {
    flex: 1,
    marginTop: 20,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  historyData: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default App;
