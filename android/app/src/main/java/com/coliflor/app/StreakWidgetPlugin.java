package com.coliflor.app;

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
}
