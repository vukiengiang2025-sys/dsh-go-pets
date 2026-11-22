package io.github.vukiengiang.petstudio;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Shader;
import android.os.Handler;
import android.os.Looper;
import android.service.wallpaper.WallpaperService;
import android.util.Log;
import android.view.SurfaceHolder;

import org.json.JSONObject;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Hình nền động: pet + giờ trên nền tối. */
public class PetWallpaperService extends WallpaperService {
    private static final String TAG = "PetWallpaper";

    @Override
    public Engine onCreateEngine() {
        return new PetEngine();
    }

    private class PetEngine extends Engine {
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private Bitmap sheet;
        private int frameW = 64;
        private int frameH = 64;
        private int cols = 1;
        private int frame = 0;
        private long started = System.currentTimeMillis();
        private boolean visible;
        private final Runnable draw = new Runnable() {
            @Override
            public void run() {
                drawFrame();
                handler.postDelayed(this, 120);
            }
        };

        PetEngine() {
            loadPet();
        }

        private void loadPet() {
            try {
                InputStream meta = getAssets().open("www/app/assets/pets/may/pack.json");
                byte[] buf = new byte[meta.available()];
                meta.read(buf);
                meta.close();
                JSONObject json = new JSONObject(new String(buf, "UTF-8"));
                JSONObject idle = json.getJSONObject("animations").getJSONObject("idle");
                frameW = idle.getInt("frameW");
                frameH = idle.getInt("frameH");
                cols = idle.getInt("cols");
                sheet = BitmapFactory.decodeStream(getAssets().open("www/app/assets/pets/may/" + idle.getString("sheet")));
                Log.d(TAG, "pet " + frameW + "x" + frameH + " cols " + cols);
            } catch (Exception err) {
                Log.e(TAG, "load pet failed", err);
            }
        }

        @Override
        public void onVisibilityChanged(boolean visible) {
            this.visible = visible;
            handler.removeCallbacks(draw);
            if (visible) handler.post(draw);
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            visible = false;
            handler.removeCallbacks(draw);
        }

        private void drawFrame() {
            if (!visible) return;
            SurfaceHolder holder = getSurfaceHolder();
            Canvas canvas = null;
            try {
                canvas = holder.lockCanvas();
                if (canvas != null) render(canvas);
            } finally {
                if (canvas != null) holder.unlockCanvasAndPost(canvas);
            }
        }

        private void render(Canvas canvas) {
            int w = canvas.getWidth();
            int h = canvas.getHeight();
            paint.setShader(new LinearGradient(0, 0, 0, h,
                    new int[]{0xFF0E1420, 0xFF1A2336}, null, Shader.TileMode.CLAMP));
            canvas.drawRect(0, 0, w, h, paint);
            paint.setShader(null);

            if (sheet != null) {
                int total = Math.max(1, sheet.getWidth() / frameW);
                if ((System.currentTimeMillis() / 180) % total != frame) {
                    frame = (int) ((System.currentTimeMillis() / 180) % total);
                }
                int sx = Math.min(total - 1, frame) * frameW;
                int size = Math.min(w, h) / 3;
                float bob = (float) Math.sin((System.currentTimeMillis() - started) / 900.0) * 8f;
                int left = (w - size) / 2;
                int top = (int) (h * 0.52f + bob);
                Rect src = new Rect(sx, 0, sx + frameW, frameH);
                Rect dst = new Rect(left, top, left + size, top + size * frameH / frameW);
                canvas.drawBitmap(sheet, src, dst, paint);
            }

            String time = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
            paint.setColor(0xFFE9EEF7);
            paint.setTextSize(w * 0.13f);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas.drawText(time, w / 2f, h * 0.24f, paint);

            paint.setColor(0xFF93A0B5);
            paint.setTextSize(w * 0.035f);
            String date = new SimpleDateFormat("EEEE, dd/MM", new Locale("vi", "VN")).format(new Date());
            canvas.drawText(date, w / 2f, h * 0.30f, paint);
        }
    }
}
