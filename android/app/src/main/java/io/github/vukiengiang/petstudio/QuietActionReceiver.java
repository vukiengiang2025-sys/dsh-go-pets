package io.github.vukiengiang.petstudio;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Nút "Im lặng" trên notification. */
public class QuietActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null) return;
        boolean quiet = context.getSharedPreferences(PetQuietTileService.PREFS, Context.MODE_PRIVATE)
                .getBoolean(PetQuietTileService.KEY_QUIET, false);
        context.getSharedPreferences(PetQuietTileService.PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(PetQuietTileService.KEY_QUIET, !quiet).apply();
    }
}
