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
 * Coliflor Native Android Home Screen Widget (Duolingo-style)
 * Displays live streak counter and countdown until midnight on the phone's desktop.
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
        String partnerName = prefs.getString(KEY_PARTNER_NAME, "Tu pareja");

        String todayStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        // If a new day has arrived, reset completedToday
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

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);

            String daysLabel = streakCount == 1 ? "1 día de racha" : streakCount + " días de racha";

            if (completedToday) {
                views.setTextViewText(R.id.widget_streak_title, "🔥 " + daysLabel);
                views.setTextViewText(R.id.widget_streak_subtitle, "✓ ¡Racha activada hoy!");
                views.setTextColor(R.id.widget_streak_subtitle, Color.parseColor("#4ADE80"));
                views.setTextViewText(R.id.widget_btn_action, "VER");
                views.setInt(R.id.widget_btn_action, "setBackgroundResource", R.drawable.widget_btn_done_bg);
            } else {
                views.setTextViewText(R.id.widget_streak_title, "🔥 " + daysLabel);
                String timeLeftText = "⏳ Quedan " + hoursLeft + "h " + minutesLeft + "m hoy";
                views.setTextViewText(R.id.widget_streak_subtitle, timeLeftText);
                if (hoursLeft < 4) {
                    views.setTextColor(R.id.widget_streak_subtitle, Color.parseColor("#EF4444"));
                } else {
                    views.setTextColor(R.id.widget_streak_subtitle, Color.parseColor("#E5C573"));
                }
                views.setTextViewText(R.id.widget_btn_action, "SUBIR");
                views.setInt(R.id.widget_btn_action, "setBackgroundResource", R.drawable.widget_btn_action_bg);
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

            views.setOnClickPendingIntent(R.id.widget_btn_action, pendingIntent);
            views.setOnClickPendingIntent(R.id.widget_info_container, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    /**
     * Helper to update widget data from anywhere (Capacitor plugin or background worker).
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
