package io.github.vukiengiang.petstudio;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageView;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;

/** Cửa sổ pet nổi ngoài app (cần quyền hiển thị trên ứng dụng khác). */
public class PetOverlayService extends Service {
    private static final String TAG = "PetOverlay";
    private static final String DOMAIN = "appassets.androidplatform.net";
    private static final String CHANNEL = "pet-overlay";

    private WindowManager windowManager;
    private FrameLayout root;
    private WebView webView;
    private WindowManager.LayoutParams params;
    private float dragX;
    private float dragY;
    private int startX;
    private int startY;
    private int baseX;
    private int baseY;
    private boolean dragging;
    private final Handler floatHandler = new Handler(Looper.getMainLooper());
    private long lastFloatLog;
    private final Runnable floatTick = new Runnable() {
        @Override
        public void run() {
            floatStep();
            floatHandler.postDelayed(this, 40);
        }
    };

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        startAsForeground();
        int dp = getSharedPreferences("petstudio-prefs", MODE_PRIVATE).getInt("overlay_size", 150);
        int size = Math.round(Math.max(100, Math.min(260, dp)) * getResources().getDisplayMetrics().density);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.TRANSPARENT);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.setWebViewClient(new WebViewClient() {
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return new WebViewAssetLoader.Builder()
                        .setDomain(DOMAIN)
                        .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(PetOverlayService.this))
                        .build()
                        .shouldInterceptRequest(request.getUrl());
            }
        });
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void openApp() {
                Intent open = new Intent(PetOverlayService.this, MainActivity.class);
                open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(open);
            }
        }, "AndroidOverlay");

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        ImageView handle = new ImageView(this);
        handle.setBackgroundResource(R.drawable.overlay_handle);
        handle.setAlpha(0.6f);
        handle.setOnTouchListener((v, event) -> {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    dragging = true;
                    dragX = event.getRawX();
                    dragY = event.getRawY();
                    startX = params.x;
                    startY = params.y;
                    return true;
                case MotionEvent.ACTION_MOVE:
                    params.x = startX + Math.round(event.getRawX() - dragX);
                    params.y = startY + Math.round(event.getRawY() - dragY);
                    if (windowManager != null && root != null) {
                        windowManager.updateViewLayout(root, params);
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    dragging = false;
                    baseX = params.x;
                    baseY = params.y;
                    getSharedPreferences("petstudio-prefs", MODE_PRIVATE).edit()
                            .putInt("overlay_x", baseX)
                            .putInt("overlay_y", baseY)
                            .apply();
                    return true;
                default:
                    return true;
            }
        });
        FrameLayout.LayoutParams handleParams = new FrameLayout.LayoutParams(
                Math.round(18 * getResources().getDisplayMetrics().density),
                Math.round(18 * getResources().getDisplayMetrics().density));
        handleParams.gravity = Gravity.BOTTOM | Gravity.END;
        handleParams.setMargins(0, 0, Math.round(6 * getResources().getDisplayMetrics().density),
                Math.round(6 * getResources().getDisplayMetrics().density));
        root.addView(handle, handleParams);

        params = new WindowManager.LayoutParams(
                size, size,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        : WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = getSharedPreferences("petstudio-prefs", MODE_PRIVATE).getInt("overlay_x", 24);
        params.y = getSharedPreferences("petstudio-prefs", MODE_PRIVATE)
                .getInt("overlay_y", Math.round(200 * getResources().getDisplayMetrics().density));
        baseX = params.x;
        baseY = params.y;

        try {
            windowManager.addView(root, params);
        } catch (Exception err) {
            Log.e(TAG, "addView failed", err);
            stopSelf();
            return;
        }

        String url = "https://" + DOMAIN + "/www/pet-studio/index.html?v=" + BuildConfig.VERSION_NAME + "&overlay=1";
        webView.loadUrl(url);
        floatHandler.post(floatTick);
        Log.d(TAG, "overlay shown size=" + dp + " x=" + params.x + " y=" + params.y);
    }

    private void floatStep() {
        if (params == null || root == null || windowManager == null) return;
        boolean enabled = getSharedPreferences("petstudio-prefs", MODE_PRIVATE)
                .getBoolean("overlay_float", true);
        if (!enabled || dragging) return;
        float t = SystemClock.uptimeMillis() / 1000f;
        int rangeX = Math.round(14 * getResources().getDisplayMetrics().density);
        int rangeY = Math.round(10 * getResources().getDisplayMetrics().density);
        params.x = baseX + Math.round((float) Math.sin(t * 0.9f) * rangeX);
        params.y = baseY + Math.round((float) Math.sin(t * 1.3f + 1f) * rangeY);
        try {
            windowManager.updateViewLayout(root, params);
        } catch (Exception ignored) {
        }
        long now = SystemClock.uptimeMillis();
        if (now - lastFloatLog > 2000) {
            lastFloatLog = now;
            Log.d(TAG, "float x=" + params.x + " y=" + params.y);
        }
    }

    private void startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL, "Floating pet", NotificationManager.IMPORTANCE_LOW);
                manager.createNotificationChannel(channel);
            }
        }
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL)
                : new Notification.Builder(this);
        Notification notification = builder
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Pet Studio")
                .setContentText("Pet is floating on your screen")
                .setContentIntent(pi)
                .build();
        startForeground(7, notification);
    }

    @Override
    public void onDestroy() {
        floatHandler.removeCallbacks(floatTick);
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        if (root != null && windowManager != null) {
            try {
                windowManager.removeView(root);
            } catch (Exception ignored) {
            }
            root = null;
        }
        super.onDestroy();
    }
}
