package com.coliflor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreakWidget")
public class StreakWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        int streakCount = call.getInt("streakCount", 0);
        boolean completedToday = call.getBoolean("completedToday", false);
        String partnerName = call.getString("partnerName", "Tu pareja");

        StreakWidgetProvider.updateData(getContext(), streakCount, completedToday, partnerName);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPinWidget(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("Context is null");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager appWidgetManager = context.getSystemService(AppWidgetManager.class);
            if (appWidgetManager != null && appWidgetManager.isRequestPinAppWidgetSupported()) {
                ComponentName myProvider = new ComponentName(context, StreakWidgetProvider.class);
                Intent pinnedWidgetCallbackIntent = new Intent(context, StreakWidgetProvider.class);
                PendingIntent successCallback = PendingIntent.getBroadcast(
                        context,
                        0,
                        pinnedWidgetCallbackIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                boolean requested = appWidgetManager.requestPinAppWidget(myProvider, null, successCallback);
                JSObject ret = new JSObject();
                ret.put("supported", true);
                ret.put("requested", requested);
                call.resolve(ret);
                return;
            }
        }

        JSObject ret = new JSObject();
        ret.put("supported", false);
        ret.put("requested", false);
        call.resolve(ret);
    }
}
