package com.barcodeapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class HoneywellBarcodeReceiver extends BroadcastReceiver {
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if ("com.honeywell.aidc.action.ACTION_BARCODE".equals(action) ||
            "com.honeywell.decode.intent.action.SCAN".equals(action)) {
            
            String barcodeData = intent.getStringExtra("data");
            String symbology = intent.getStringExtra("symbology");
            
            // Launch the app with barcode data
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("barcodeData", barcodeData);
            launchIntent.putExtra("symbology", symbology);
            launchIntent.putExtra("fromBackgroundScan", true);
            
            context.startActivity(launchIntent);
        }
    }
}