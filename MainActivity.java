package com.coachcoinche.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Permet l'inspection via chrome://inspect/#devices
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
