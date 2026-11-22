package io.github.vukiengiang.petstudio;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.RemoteViews;

/** Widget màn hình chính: ảnh pet + trạng thái gần nhất, chạm để mở app. */
public class PetWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "PetWidget";
    private static final String PREFS = "petstudio-widget";
    private static final String KEY_STATE = "state";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        String state = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_STATE, null);
        for (int id : ids) render(context, manager, id, state);
    }

    static void updateAll(Context context, String state) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_STATE, state).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName name = new ComponentName(context, PetWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(name);
        Log.d(TAG, "update " + ids.length + " widget(s) -> " + state);
        for (int id : ids) render(context, manager, id, state);
    }

    private static void render(Context context, AppWidgetManager manager, int id, String state) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pet);
        views.setTextViewText(R.id.widget_state,
                state == null || state.isEmpty() ? context.getString(R.string.widget_name) : state);
        Intent open = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
        manager.updateAppWidget(id, views);
    }
}
