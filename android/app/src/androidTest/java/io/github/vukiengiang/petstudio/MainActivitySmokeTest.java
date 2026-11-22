package io.github.vukiengiang.petstudio;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Kiểm thử khói: app mở được và WebView tải xong Pet Studio. */
@RunWith(AndroidJUnit4.class)
public class MainActivitySmokeTest {

    @Test
    public void webViewLoadsPetStudio() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            final AtomicReference<WebView> webView = new AtomicReference<>();
            scenario.onActivity(activity -> webView.set(activity.findViewById(R.id.webview)));
            assertNotNull("WebView phải có trong layout", webView.get());

            String title = null;
            for (int attempt = 0; attempt < 40; attempt++) {
                final CountDownLatch latch = new CountDownLatch(1);
                final AtomicReference<String> value = new AtomicReference<>();
                scenario.onActivity(activity -> {
                    WebView view = activity.findViewById(R.id.webview);
                    if (view != null) {
                        view.evaluateJavascript("document.title", result -> {
                            value.set(result);
                            latch.countDown();
                        });
                    } else {
                        latch.countDown();
                    }
                });
                latch.await(1, TimeUnit.SECONDS);
                title = value.get();
                if (title != null && title.contains("Pet Studio")) break;
                Thread.sleep(500);
            }
            assertTrue("Tiêu đề WebView phải là Pet Studio, nhận: " + title,
                    title != null && title.contains("Pet Studio"));
        }
    }
}
