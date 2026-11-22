package io.github.vukiengiang.petstudio;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
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

    private WindowManager windowManager;
    private FrameLayout root;
    private WebView webView;

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
        int size = Math.round(140 * getResources().getDisplayMetrics().density);

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

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                size, size,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        : WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 24;
        params.y = Math.round(200 * getResources().getDisplayMetrics().density);

        try {
            windowManager.addView(root, params);
        } catch (Exception err) {
            Log.e(TAG, "addView failed", err);
            stopSelf();
            return;
        }

        String url = "https://" + DOMAIN + "/www/pet-studio/index.html?v=" + BuildConfig.VERSION_NAME + "&overlay=1";
        webView.loadUrl(url);
        Log.d(TAG, "overlay shown");
    }

    @Override
    public void onDestroy() {
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
