package io.github.vukiengiang.petstudio;

import android.content.SharedPreferences;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

import androidx.annotation.RequiresApi;

/** Ô Quick Settings: bật/tắt im lặng của pet. */
@RequiresApi(api = Build.VERSION_CODES.N)
public class PetQuietTileService extends TileService {
    static final String PREFS = "petstudio-prefs";
    static final String KEY_QUIET = "quiet";

    private boolean isQuiet() {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        return prefs.getBoolean(KEY_QUIET, false);
    }

    private void render(Tile tile) {
        if (tile == null) return;
        boolean quiet = isQuiet();
        tile.setState(quiet ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        tile.setLabel(quiet ? "Pet im lặng" : "Pet Studio");
        tile.updateTile();
    }

    @Override
    public void onStartListening() {
        super.onStartListening();
        render(getQsTile());
    }

    @Override
    public void onClick() {
        super.onClick();
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_QUIET, !isQuiet()).apply();
        render(getQsTile());
    }
}
