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
 * Coliflor Native Android Home Screen Widget (4x2 Horizontal Cozy Card)
 * Uses custom vector icons (zero system emojis) and Pokémon-style Picaflor art.
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

        Calendar now = Calendar.getInstance();
        Calendar midnight = Calendar.getInstance();
        midnight.set(Calendar.HOUR_OF_DAY, 24);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 0);
        long diffMs = midnight.getTimeInMillis() - now.getTimeInMillis();
        long hoursLeft = Math.max(0, diffMs / (1000 * 60 * 60));
        long minutesLeft = Math.max(0, (diffMs % (1000 * 60 * 60)) / (1000 * 60));
        int dayProgress = completedToday
                ? 100
                : Math.max(8, Math.min(95, (int) ((diffMs * 100L) / (24L * 60L * 60L * 1000L))));
        boolean isUrgent = !completedToday && hoursLeft < 4;

        String daysText = streakCount == 1 ? "1 día" : streakCount + " días";
        String nextDayText = "Próximo día: Día " + (streakCount + 1);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);

            views.setTextViewText(R.id.widget_streak_number, daysText);
            views.setTextViewText(R.id.widget_next_day, nextDayText);
            views.setProgressBar(R.id.widget_progress, 100, dayProgress, false);

            if (completedToday) {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_card_active);
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_active);
                views.setImageViewResource(R.id.widget_status_icon, R.drawable.ic_widget_check);
                views.setTextColor(R.id.widget_eyebrow, Color.parseColor("#A7F3D0"));
                views.setTextViewText(R.id.widget_status_pill, "Activa");
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#BBF7D0"));
                views.setInt(R.id.widget_status_pill_bg, "setBackgroundResource", R.drawable.widget_pill_active);
                views.setInt(R.id.widget_btn_world, "setBackgroundResource", R.drawable.widget_pill_active);
                views.setTextColor(R.id.widget_btn_world_text, Color.parseColor("#D1FAE5"));
                views.setTextViewText(R.id.widget_tagline, "¡Otro día juntos!");
                views.setTextColor(R.id.widget_tagline, Color.parseColor("#A7F3D0"));
            } else if (isUrgent) {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_card_urgent);
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_urgent);
                views.setImageViewResource(R.id.widget_status_icon, R.drawable.ic_widget_alert);
                views.setTextColor(R.id.widget_eyebrow, Color.parseColor("#FECACA"));
                String timeText = hoursLeft > 0
                        ? "Urgente · " + hoursLeft + "h " + minutesLeft + "m"
                        : "Urgente · " + minutesLeft + "m";
                views.setTextViewText(R.id.widget_status_pill, timeText);
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#FECACA"));
                views.setInt(R.id.widget_status_pill_bg, "setBackgroundResource", R.drawable.widget_pill_urgent);
                views.setInt(R.id.widget_btn_world, "setBackgroundResource", R.drawable.widget_pill_urgent);
                views.setTextColor(R.id.widget_btn_world_text, Color.parseColor("#FECACA"));
                views.setTextViewText(R.id.widget_tagline, "¡Todavía estamos a tiempo!");
                views.setTextColor(R.id.widget_tagline, Color.parseColor("#FCA5A5"));
            } else {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_card_pending);
                views.setImageViewResource(R.id.widget_bg_art, R.drawable.widget_coliflor_pending);
                views.setImageViewResource(R.id.widget_status_icon, R.drawable.ic_widget_clock);
                views.setTextColor(R.id.widget_eyebrow, Color.parseColor("#DDD6FE"));
                views.setTextViewText(R.id.widget_status_pill, "Pendiente · " + hoursLeft + "h " + minutesLeft + "m");
                views.setTextColor(R.id.widget_status_pill, Color.parseColor("#EDE9FE"));
                views.setInt(R.id.widget_status_pill_bg, "setBackgroundResource", R.drawable.widget_pill_pending);
                views.setInt(R.id.widget_btn_world, "setBackgroundResource", R.drawable.widget_pill_pending);
                views.setTextColor(R.id.widget_btn_world_text, Color.parseColor("#EDE9FE"));
                views.setTextViewText(R.id.widget_tagline, "¿Volvemos a volar?");
                views.setTextColor(R.id.widget_tagline, Color.parseColor("#C4B5FD"));
            }

            Intent streakIntent = new Intent(context, MainActivity.class);
            streakIntent.putExtra("route", "/streak");
            streakIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent streakPending = PendingIntent.getActivity(
                    context, 0, streakIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, streakPending);

            Intent worldIntent = new Intent(context, MainActivity.class);
            worldIntent.putExtra("route", "/world");
            worldIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent worldPending = PendingIntent.getActivity(
                    context, 1, worldIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_btn_world, worldPending);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

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
