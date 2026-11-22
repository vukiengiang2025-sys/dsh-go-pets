package io.github.vukiengiang.petstudio;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.util.Rational;
import android.view.View;
import android.view.Window;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebResourceErrorCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/**
 * Vỏ Android cho Pet Studio: WebView nạp tài nguyên đóng gói trong APK
 * qua WebViewAssetLoader (https://appassets.androidplatform.net), không cần
 * mạng, không mở link ra ngoài.
 */
public class MainActivity extends Activity {
    private static final String TAG = "PetStudio";
    private static final String DOMAIN = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + DOMAIN + "/www/pet-studio/index.html?v=" + BuildConfig.VERSION_NAME;
    private static final String ERROR_URL = "https://" + DOMAIN + "/error.html";

    private static final int REQ_FILE = 1001;

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean pipOnLoad;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#10141C"));
        window.setNavigationBarColor(Color.parseColor("#10141C"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        webView = findViewById(R.id.webview);
        webView.setBackgroundColor(Color.parseColor("#10141C"));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setLongClickable(false);
        webView.setHapticFeedbackEnabled(true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(DOMAIN)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        pipOnLoad = getIntent() != null && getIntent().getBooleanExtra("pip", false);
        webView.addJavascriptInterface(new PipBridge(), "AndroidPet");

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public void onPageFinished(@NonNull WebView view, String url) {
                super.onPageFinished(view, url);
                if (pipOnLoad) {
                    pipOnLoad = false;
                    view.postDelayed(MainActivity.this::enterPip, 900);
                }
            }
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(@NonNull WebView view,
                                                             @NonNull WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(@NonNull WebView view,
                                                    @NonNull WebResourceRequest request) {
                // Mọi thứ nằm trong APK; không mở trình duyệt ngoài.
                return true;
            }

            @Override
            public void onReceivedError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                        @NonNull WebResourceErrorCompat error) {
                if (request.isForMainFrame()) {
                    Log.e(TAG, "load error " + error.getErrorCode() + ": " + error.getDescription());
                    view.loadUrl(ERROR_URL);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(@NonNull ConsoleMessage message) {
                Log.d(TAG, message.message() + " @" + message.lineNumber());
                return true;
            }

            @Override
            public boolean onShowFileChooser(@NonNull WebView view,
                                             @NonNull ValueCallback<Uri[]> callback,
                                             @NonNull FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent, REQ_FILE);
                    return true;
                } catch (Exception err) {
                    Log.e(TAG, "file chooser failed", err);
                    filePathCallback = null;
                    return false;
                }
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(startUrl(packOf(getIntent()), fxOf(getIntent()), chatOf(getIntent()), pipOnLoad));
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private static String packOf(@Nullable Intent intent) {
        return intent != null ? intent.getStringExtra("pack") : null;
    }

    private static String startUrl(@Nullable String pack, @Nullable String fx, @Nullable String chat, boolean pip) {
        String url = START_URL;
        if (pack != null && pack.matches("[a-z0-9-]{1,32}")) {
            url += "&pack=" + pack;
        }
        if (fx != null && fx.matches("(hearts|zzz|throw)")) {
            url += "&fx=" + fx;
        }
        if ("demo".equals(chat)) {
            url += "&chat=demo";
        }
        if (pip) {
            url += "&pip=1";
        }
        return url;
    }

    private static String fxOf(@Nullable Intent intent) {
        return intent != null ? intent.getStringExtra("fx") : null;
    }

    private static String chatOf(@Nullable Intent intent) {
        return intent != null ? intent.getStringExtra("chat") : null;
    }

    @Override
    protected void onNewIntent(@NonNull Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (webView != null) {
            webView.loadUrl(startUrl(packOf(intent), fxOf(intent), chatOf(intent), false));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (requestCode == REQ_FILE) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    public class PipBridge {
        @JavascriptInterface
        public boolean isPipSupported() {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
        }

        @JavascriptInterface
        public void enterPip() {
            runOnUiThread(MainActivity.this::enterPip);
        }
    }

    private void enterPip() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (!getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) return;
        try {
            PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(1, 1));
            enterPictureInPictureMode(builder.build());
        } catch (Exception err) {
            Log.e(TAG, "enterPip failed", err);
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean inPip, @NonNull Configuration config) {
        super.onPictureInPictureModeChanged(inPip, config);
        if (webView != null) {
            webView.evaluateJavascript(
                    "(window.__setPip ? window.__setPip(" + inPip + ") : "
                            + "document.body.classList.toggle('pip', " + inPip + "));", null);
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
