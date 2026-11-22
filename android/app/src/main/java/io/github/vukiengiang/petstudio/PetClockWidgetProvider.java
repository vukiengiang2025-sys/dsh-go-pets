package io.github.vukiengiang.petstudio;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget đôi: pet + đồng hồ, tự cập nhật mỗi phút. */
public class PetClockWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "PetClock";
    private static final String ACTION_TICK = "io.github.vukiengiang.petstudio.CLOCK_TICK";
    private static final long INTERVAL_MS = 60_000L;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
        schedule(context);
    }

    @Override
    public void onEnabled(Context context) {
        schedule(context);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm != null) alarm.cancel(tickIntent(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || !ACTION_TICK.equals(intent.getAction())) return;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(
                new android.content.ComponentName(context, PetClockWidgetProvider.class));
        Log.d(TAG, "tick " + ids.length + " widget(s)");
        for (int id : ids) render(context, manager, id);
        schedule(context);
    }

    private void schedule(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm == null) return;
        long next = System.currentTimeMillis() + INTERVAL_MS;
        alarm.setInexactRepeating(AlarmManager.RTC, next, INTERVAL_MS, tickIntent(context));
    }

    private PendingIntent tickIntent(Context context) {
        Intent intent = new Intent(context, PetClockWidgetProvider.class);
        intent.setAction(ACTION_TICK);
        intent.setData(Uri.parse("petclock://tick"));
        return PendingIntent.getBroadcast(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void render(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_clock);
        Date now = new Date();
        views.setTextViewText(R.id.clock_time,
                new SimpleDateFormat("HH:mm", Locale.getDefault()).format(now));
        views.setTextViewText(R.id.clock_date,
                new SimpleDateFormat("EEE, dd/MM", new Locale("vi", "VN")).format(now));
        Intent open = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.clock_root, pi);
        manager.updateAppWidget(id, views);
    }
}
