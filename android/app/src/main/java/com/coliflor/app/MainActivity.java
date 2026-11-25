package com.coliflor.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StreakWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        handleWidgetRouteIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetRouteIntent(intent);
    }

    private void handleWidgetRouteIntent(Intent intent) {
        if (intent == null) return;
        final String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty()) return;

        // Clear extra so it does not re-trigger on configuration change
        intent.removeExtra("route");

        // Dispatch navigation event to WebView once Capacitor bridge is ready
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                String safeRoute = route.replace("'", "");
                String js = "window.dispatchEvent(new CustomEvent('coliflor:navigate', { detail: '" + safeRoute + "' }));";
                getBridge().getWebView().evaluateJavascript(js, null);
            }
        }, 450);
    }
}
