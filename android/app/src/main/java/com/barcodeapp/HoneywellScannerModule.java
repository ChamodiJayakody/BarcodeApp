// filepath: e:\BarcodeApp\android\app\src\main\java\com\barcodeapp\HoneywellScannerModule.java
package com.barcodeapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.honeywell.aidc.*;

public class HoneywellScannerModule extends ReactContextBaseJavaModule implements BarcodeReader.BarcodeListener {
    
    private static final String MODULE_NAME = "HoneywellScanner";
    private AidcManager manager;
    private BarcodeReader reader;
    private ReactApplicationContext reactContext;

    public HoneywellScannerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void initializeScanner(Promise promise) {
        try {
            AidcManager.create(reactContext, new AidcManager.CreatedCallback() {
                @Override
                public void onCreated(AidcManager aidcManager) {
                    manager = aidcManager;
                    try {
                        reader = manager.createBarcodeReader();
                        if (reader != null) {
                            reader.addBarcodeListener(HoneywellScannerModule.this);
                            try {
                                reader.claim();
                                promise.resolve("Scanner initialized successfully");
                            } catch (ScannerUnavailableException e) {
                                promise.reject("SCANNER_UNAVAILABLE", e.getMessage());
                            }
                        } else {
                            promise.reject("SCANNER_ERROR", "Failed to create barcode reader");
                        }
                    } catch (InvalidScannerNameException e) {
                        promise.reject("INVALID_SCANNER", e.getMessage());
                    }
                }
            });
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void enableScanner(Promise promise) {
        try {
            if (reader != null) {
                reader.setProperty(BarcodeReader.PROPERTY_TRIGGER_CONTROL_MODE, 
                                 BarcodeReader.TRIGGER_CONTROL_MODE_AUTO_CONTROL);
                promise.resolve("Scanner enabled");
            } else {
                promise.reject("SCANNER_ERROR", "Scanner not initialized");
            }
        } catch (Exception e) {
            promise.reject("ENABLE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disableScanner(Promise promise) {
        try {
            if (reader != null) {
                reader.release();
                promise.resolve("Scanner disabled");
            } else {
                promise.reject("SCANNER_ERROR", "Scanner not initialized");
            }
        } catch (Exception e) {
            promise.reject("DISABLE_ERROR", e.getMessage());
        }
    }

    @Override
    public void onBarcodeEvent(BarcodeReadEvent barcodeReadEvent) {
        WritableMap params = Arguments.createMap();
        params.putString("data", barcodeReadEvent.getBarcodeData());
        params.putString("symbology", barcodeReadEvent.getCodeId());
        params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
        
        sendEvent("onBarcodeScanned", params);
    }

    @Override
    public void onFailureEvent(BarcodeFailureEvent barcodeFailureEvent) {
        WritableMap params = Arguments.createMap();
        params.putString("error", "Scan failed");
        sendEvent("onBarcodeScanFailed", params);
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}