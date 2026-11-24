package com.coliflor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Coliflor Native Android Home Screen Widget (Duolingo-style Illustrated Mascot)
 * Swaps 3D Coliflor mascot artwork based on streak state (Active, Pending, Urgent).
 */
public class StreakWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "ColiflorWidgetPrefs";
    public static final String KEY_STREAK_COUNT = "streak_count";
    public static final String KEY_COMPLETED_TODAY = "completed_today";
    public static final String KEY_LAST_UPDATE_DATE = "last_update_date";
    public static final String KEY_PARTNER_NAME = "partner_name";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        int streakCount = prefs.getInt(KEY_STREAK_COUNT, 0);
        boolean completedToday = prefs.getBoolean(KEY_COMPLETED_TODAY, false);
        String lastDate = prefs.getString(KEY_LAST_UPDATE_DATE, "");

        String todayStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        if (!todayStr.equals(lastDate)) {
            completedToday = false;
        }

        // Calculate hours and minutes remaining until midnight
        Calendar now = Calendar.getInstance();
        Calendar midnight = Calendar.getInstance();
        midnight.set(Calendar.HOUR_OF_DAY, 24);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 0);
        long diffMs = midnight.getTimeInMillis() - now.getTimeInMillis();
        long hoursLeft = Math.max(0, diffMs / (1000 * 60 * 60));
        long minutesLeft = Math.max(0, (diffMs % (1000 * 60 * 60)) / (1000 * 60));
        boolean isUrgent = !completedToday && hoursLeft < 4;

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);

            views.setTextViewText(R.id.widget_streak_number, String.valueOf(streakCount));
            views.setTextViewText(R.id.widget_streak_label, streakCount == 1 ? "DÍA" : "DÍAS");

            if (completedToday) {
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_active);
                views.setTextViewText(R.id.widget_status_pill, "✓ ACTIVA");
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#BBF7D0"));
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.widget_pill_active);
            } else if (isUrgent) {
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_urgent);
                String timeText = hoursLeft > 0
                        ? "🚨 " + hoursLeft + "h " + minutesLeft + "m"
                        : "🚨 " + minutesLeft + "m";
                views.setTextViewText(R.id.widget_status_pill, timeText);
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#FECACA"));
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.widget_pill_urgent);
            } else {
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_pending);
                views.setTextViewText(R.id.widget_status_pill, "⏳ " + hoursLeft + "h " + minutesLeft + "m");
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#FDE68A"));
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.widget_pill_pending);
            }

            // PendingIntent to launch app directly on click
            Intent intent = new Intent(context, MainActivity.class);
            intent.putExtra("route", "/streak");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    /**
     * Helper to update widget data from Capacitor plugin.
     */
    public static void updateData(Context context, int streakCount, boolean completedToday, String partnerName) {
        String todayStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putInt(KEY_STREAK_COUNT, streakCount)
                .putBoolean(KEY_COMPLETED_TODAY, completedToday)
                .putString(KEY_LAST_UPDATE_DATE, todayStr)
                .putString(KEY_PARTNER_NAME, partnerName)
                .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, StreakWidgetProvider.class);
        int[] appWidgetIds = manager.getAppWidgetIds(componentName);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            Intent intent = new Intent(context, StreakWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds);
            context.sendBroadcast(intent);
        }
    }
}
