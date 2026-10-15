package com.radioapp.stream

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    companion object {
        private const val START_URL = "https://www.poema.co.uk/"
        private const val HOST = "poema.co.uk"

        // true  = la app muestra SOLO la sección de la radio (id="radio")
        // false = muestra la página completa
        private const val RADIO_ONLY = true

        // Deja visible solo el elemento #radio: oculta todo lo demás de la página
        // (cabecera, menú, catálogo, generadores, pie), sin tocar ventanas flotantes
        // (position fixed/absolute) como el chat o el reproductor emergente.
        private const val ISOLATE_JS = """
(function(){
  var r = document.getElementById('radio');
  if (!r) return false;
  var skip = {SCRIPT:1, STYLE:1, LINK:1, META:1, NOSCRIPT:1};
  var n = r;
  while (n && n !== document.body) {
    var p = n.parentNode;
    Array.prototype.forEach.call(p.children, function(c){
      if (c === n || skip[c.tagName]) return;
      var pos = window.getComputedStyle(c).position;
      if (pos === 'fixed' || pos === 'absolute') return;
      c.style.setProperty('display', 'none', 'important');
    });
    n = p;
  }
  r.style.setProperty('display', 'block', 'important');
  r.style.setProperty('min-height', '100vh', 'important');
  r.style.setProperty('margin', '0', 'important');
  document.body.style.setProperty('margin', '0', 'important');
  window.scrollTo(0, 0);
  return true;
})();
"""
    }

    private lateinit var webView: WebView
    private val handler = Handler(Looper.getMainLooper())

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#F7F3EC"))
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val host = request.url.host ?: return false
                    return if (host.endsWith(HOST)) {
                        false
                    } else {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(request.url.toString())))
                        true
                    }
                }

                override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                    if (RADIO_ONLY && isHome(url)) view.visibility = View.INVISIBLE
                }

                override fun onPageFinished(view: WebView, url: String?) {
                    if (isHome(url)) processRadio(view, 0) else view.visibility = View.VISIBLE
                }
            }
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }
        }
        setContentView(webView)

        if (savedInstanceState == null) webView.loadUrl(START_URL) else webView.restoreState(savedInstanceState)
    }

    private fun isHome(url: String?): Boolean {
        val u = Uri.parse(url ?: return false)
        val path = u.path ?: ""
        return (u.host ?: "").endsWith(HOST) && (path.isEmpty() || path == "/")
    }

    private val enhanceJs: String by lazy {
        assets.open("enhance.js").bufferedReader().use { it.readText() }
    }

    // Aísla la radio (si RADIO_ONLY), aplica el diseño con visualizador y muestra la vista.
    // Reintenta unas veces por si la página termina de armarse después de cargar.
    private fun processRadio(view: WebView, attempt: Int) {
        val step1 = if (RADIO_ONLY) ISOLATE_JS
        else "(function(){return !!document.getElementById('radio');})();"
        view.evaluateJavascript(step1) { result ->
            if (result == "true") {
                view.evaluateJavascript(enhanceJs, null)
                view.visibility = View.VISIBLE
            } else if (attempt >= 12) {
                view.visibility = View.VISIBLE
            } else {
                handler.postDelayed({ processRadio(view, attempt + 1) }, 400)
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    // No se llama a webView.onPause() para que la radio siga sonando en segundo plano.
    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        webView.destroy()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else moveTaskToBack(true)
    }
}
