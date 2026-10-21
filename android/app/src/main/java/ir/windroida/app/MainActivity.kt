package ir.windroida.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import java.io.File
import android.provider.Settings
import android.text.InputType
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection

object App { @Volatile var foreground = false }

/** The Windroida web UI in a WebView + a background service for notifications. The server certificate is trusted by SHA-256 fingerprint (confirmed once), not through the phone's certificate store. */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private var pendingPerm: PermissionRequest? = null
    private var pendingChat = 0
    private var pageReady = false
    private val shareLock = Any()
    private var shareJson: String? = null                 // waiting for the page to pick it up
    private val shareFiles = ArrayList<Pair<File, String>>()   // file + mime, served at /__wd/share/<index>

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MediaCache.init(this)
        web = WebView(this)
        setContentView(web)
        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.allowFileAccess = false
        s.cacheMode = WebSettings.LOAD_DEFAULT
        s.userAgentString = s.userAgentString + " WindroidaApp/1"
        web.addJavascriptInterface(Bridge(), "WD")

        web.webViewClient = object : WebViewClient() {
            override fun onReceivedSslError(v: WebView, h: SslErrorHandler, e: SslError) {
                val cert = if (Build.VERSION.SDK_INT >= 29) e.certificate.x509Certificate else null
                if (cert == null) { h.cancel(); return }
                val fp = Trust.sha256(cert)
                val pin = Prefs.pin(this@MainActivity)
                when {
                    pin == fp -> h.proceed()
                    pin.isEmpty() -> askTrust(fp, h)
                    else -> {
                        h.cancel()
                        Toast.makeText(this@MainActivity, "گواهی سرور عوض شده! اگه خودت عوضش نکردی، وصل نشو. (اطلاعات برنامه رو پاک کن تا دوباره تأیید کنی)", Toast.LENGTH_LONG).show()
                    }
                }
            }
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
                val u = r.url.toString()
                if (u.startsWith(Prefs.server(this@MainActivity))) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, r.url)) } catch (_: Exception) {}
                return true
            }
            override fun onReceivedError(v: WebView, r: WebResourceRequest, e: WebResourceError) {
                if (r.isForMainFrame) {                       // server unreachable / IP changed: offer to change the address
                    AlertDialog.Builder(this@MainActivity).setTitle("به سرور وصل نشد")
                        .setMessage("آدرس فعلی: " + Prefs.server(this@MainActivity) + "\n\nاگه آی‌پی سرور عوض شده، آدرس جدید رو وارد کن.")
                        .setPositiveButton("تغییر آدرس سرور") { _, _ -> askServer(true) }
                        .setNeutralButton("تلاش دوباره") { _, _ -> web.loadUrl(Prefs.server(this@MainActivity)) }
                        .setNegativeButton("بستن", null).show()
                }
            }
            /** app pages + opened media live inside the app (works with no internet); files shared INTO the app are served to the page from here */
            override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? {
                try {
                    if (!r.method.equals("GET", true)) return null
                    val server = Prefs.server(this@MainActivity)
                    val u = r.url
                    if (server.isEmpty() || !u.toString().startsWith("$server/") && u.toString() != server) return null
                    if (server.startsWith("https://") && Prefs.pin(this@MainActivity).isEmpty()) return null   // certificate not confirmed yet
                    val path = u.path ?: "/"
                    if (path.startsWith("/__wd/share/")) {
                        val i = path.substringAfterLast('/').toIntOrNull() ?: return null
                        val e = synchronized(shareLock) { shareFiles.getOrNull(i) } ?: return null
                        return WebResourceResponse(e.second, null, 200, "OK", mapOf("Cache-Control" to "no-store"), e.first.inputStream())
                    }
                    return when (MediaCache.kind(path)) {
                        "media" -> MediaCache.media(u.toString(), path, u.query, r.requestHeaders["Range"])
                        "shell" -> MediaCache.shell(u.toString(), path, u.query)
                        else -> null
                    }
                } catch (_: Exception) { return null }
            }
            override fun onPageStarted(v: WebView, url: String, f: android.graphics.Bitmap?) { pageReady = false }
            override fun onPageFinished(v: WebView, url: String) {
                pageReady = true
                deliverShare()
                if (pendingChat != 0) {
                    v.evaluateJavascript("try{openChat($pendingChat)}catch(e){}", null)
                    pendingChat = 0
                }
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(r: PermissionRequest) { runOnUiThread { handlePermission(r) } }
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: WebChromeClient.FileChooserParams): Boolean {
                fileCb?.onReceiveValue(null)
                fileCb = cb
                // the full system file manager (all folders, any file type, apk included), not only the "recent" list
                val types = p.acceptTypes.map { it.trim() }.filter { it.contains("/") }
                val open = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (types.size == 1) types[0] else "*/*"
                    if (types.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, types.toTypedArray())
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, p.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE)
                }
                return try { startActivityForResult(open, 77); true } catch (_: Exception) {
                    try { startActivityForResult(p.createIntent(), 77); true } catch (_: Exception) { fileCb = null; false }
                }
            }
        }

        web.setDownloadListener { url, _, cd, mime, _ -> download(url, cd, mime) }

        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 79)

        pendingChat = intent.getIntExtra("chat", 0)
        handleShare(intent)
        if (Prefs.server(this).isEmpty()) askServer() else web.loadUrl(Prefs.server(this))
        NotifyService.start(this)
    }

    override fun onNewIntent(i: Intent) {
        super.onNewIntent(i)
        handleShare(i)
        val chat = i.getIntExtra("chat", 0)
        if (chat != 0) web.evaluateJavascript("try{openChat($chat)}catch(e){}", null)
    }

    override fun onResume() { super.onResume(); App.foreground = true }
    override fun onPause() { App.foreground = false; super.onPause() }

    /** back = close the top-most thing in the page (dialog, chat…); when nothing is left, minimise like Telegram */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("(function(){try{return window.wdBack?window.wdBack():false}catch(e){return false}})()") { r ->
            if (r != "true") moveTaskToBack(true)
        }
    }

    /** first run, or "change server": a new address needs its certificate confirmed again, and the old login belongs to the old server */
    private fun askServer(cancelable: Boolean = false) {
        val et = EditText(this)
        et.hint = "https://IP-SERVER:8087"
        et.setText(Prefs.server(this).ifEmpty { "https://" })
        et.inputType = InputType.TYPE_TEXT_VARIATION_URI
        val b = AlertDialog.Builder(this).setTitle("آدرس سرور Windroida").setView(et).setCancelable(cancelable)
            .setPositiveButton("ذخیره") { _, _ ->
                val v = et.text.toString().trim().trimEnd('/')
                if (v.startsWith("http://") || v.startsWith("https://")) {
                    if (v != Prefs.server(this)) { Prefs.setPin(this, ""); Prefs.setToken(this, ""); NotifyService.stop(this); MediaCache.clearAll() }
                    Prefs.setServer(this, v)
                    web.clearCache(true)
                    web.loadUrl(v)
                } else { Toast.makeText(this, "آدرس باید با https:// یا http:// شروع بشه", Toast.LENGTH_SHORT).show(); askServer(cancelable) }
            }
        if (cancelable) b.setNegativeButton("لغو", null)
        b.show()
    }

    private fun askTrust(fp: String, h: SslErrorHandler) {
        AlertDialog.Builder(this).setTitle("تأیید گواهی سرور").setCancelable(false)
            .setMessage("اثر انگشت (SHA-256) گواهی این سرور:\n\n$fp\n\nفقط اگه دقیقاً با اثری که تو پنجره سرور (start.bat) نوشته شده یکیه، اعتماد کن.")
            .setPositiveButton("اعتماد می‌کنم") { _, _ -> Prefs.setPin(this, fp); h.proceed(); NotifyService.start(this) }
            .setNegativeButton("لغو") { _, _ -> h.cancel() }.show()
    }

    private fun handlePermission(r: PermissionRequest) {
        if (!r.origin.toString().startsWith(Prefs.server(this))) { r.deny(); return }
        val need = ArrayList<String>()
        for (res in r.resources) {
            if (res == PermissionRequest.RESOURCE_AUDIO_CAPTURE) need.add(Manifest.permission.RECORD_AUDIO)
            if (res == PermissionRequest.RESOURCE_VIDEO_CAPTURE) need.add(Manifest.permission.CAMERA)
        }
        val missing = need.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isEmpty()) r.grant(r.resources)
        else { pendingPerm?.deny(); pendingPerm = r; requestPermissions(missing.toTypedArray(), 78) }
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(code, perms, res)
        if (code == 78) {
            val p = pendingPerm
            pendingPerm = null
            if (p != null) { if (res.isNotEmpty() && res.all { it == PackageManager.PERMISSION_GRANTED }) p.grant(p.resources) else p.deny() }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (req == 77) {
            fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data))
            fileCb = null
        }
    }

    /** "save to phone" from the page: the page knows the REAL file name (the address only has a number), so apk stays apk.
     *  Only files of OUR server are accepted, the name is cleaned, and the file shows up in Downloads/Windroida only when complete. */
    private fun saveFile(url: String, rawName: String) {
        val server = Prefs.server(this)
        val u = Uri.parse(url)
        if (server.isEmpty() || !url.startsWith("$server/media/") || u.path?.matches(Regex("/media/\\d+")) != true) {
            Toast.makeText(this, "این دانلود مجاز نیست", Toast.LENGTH_SHORT).show(); return
        }
        var name = rawName.replace(Regex("[\\\\/:*?\"<>|\\u0000-\\u001f]"), "_").trim().trim('.').take(120)
        if (name.isEmpty()) name = "file"
        val ext = name.substringAfterLast('.', "").lowercase()
        val mime = (if (ext.isNotEmpty()) MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) else null)
            ?: (if (ext == "apk") "application/vnd.android.package-archive" else "application/octet-stream")
        Thread {
            var uri: Uri? = null
            try {
                val values = ContentValues()
                values.put(MediaStore.Downloads.DISPLAY_NAME, name)
                values.put(MediaStore.Downloads.MIME_TYPE, mime)
                values.put(MediaStore.Downloads.RELATIVE_PATH, "Download/Windroida")
                values.put(MediaStore.Downloads.IS_PENDING, 1)
                uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)!!
                val saved = u.path?.let { MediaCache.cachedFile(it) }
                val key = u.path?.substringAfterLast('/') ?: "0"
                var lastTick = 0L
                // progress line in the page: wdDl(id, bytesSoFar, total, state)  state 0 = running, 1 = done, 2 = failed
                fun tell(got: Long, total: Long, state: Int) {
                    val now = System.currentTimeMillis()
                    if (state == 0 && now - lastTick < 300) return
                    lastTick = now
                    runOnUiThread { try { web.evaluateJavascript("try{window.wdDl&&wdDl('$key',$got,$total,$state)}catch(e){}", null) } catch (_: Exception) {} }
                }
                fun copy(ins: java.io.InputStream, out: java.io.OutputStream, total: Long) {
                    val buf = ByteArray(64 * 1024)
                    var got = 0L
                    tell(0, total, 0)
                    while (true) {
                        val r = ins.read(buf)
                        if (r < 0) break
                        out.write(buf, 0, r)
                        got += r
                        tell(got, total, 0)
                    }
                    tell(got, total, 0)
                }
                contentResolver.openOutputStream(uri)!!.use { out ->
                    if (saved != null) saved.inputStream().use { copy(it, out, saved.length()) }
                    else {
                        val c = URL(url).openConnection() as HttpURLConnection
                        if (c is HttpsURLConnection) {
                            c.sslSocketFactory = Trust.pinnedContext(Prefs.pin(this)).socketFactory
                            c.hostnameVerifier = HostnameVerifier { _, _ -> true }
                        }
                        c.connectTimeout = 10000
                        c.readTimeout = 30000
                        if (c.responseCode != 200) throw RuntimeException("http " + c.responseCode)
                        val total = c.contentLengthLong
                        c.inputStream.use { copy(it, out, total) }
                    }
                }
                tell(0, 0, 1)
                val done = ContentValues()
                done.put(MediaStore.Downloads.IS_PENDING, 0)
                contentResolver.update(uri, done, null, null)
                runOnUiThread { Toast.makeText(this, "ذخیره شد: Download/Windroida/$name", Toast.LENGTH_LONG).show() }
            } catch (e: Exception) {
                try { if (uri != null) contentResolver.delete(uri, null, null) } catch (_: Exception) {}
                val k = u.path?.substringAfterLast('/') ?: "0"
                runOnUiThread {
                    try { web.evaluateJavascript("try{window.wdDl&&wdDl('$k',0,0,2)}catch(e){}", null) } catch (_: Exception) {}
                    Toast.makeText(this, "دانلود نشد", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    /** open the native full-screen video player (only for videos of OUR server) */
    private fun playVideo(url: String, title: String) {
        val server = Prefs.server(this)
        val u = Uri.parse(url)
        if (server.isEmpty() || !url.startsWith("$server/media/") || u.path?.matches(Regex("/media/\\d+")) != true) {
            Toast.makeText(this, "این ویدیو مجاز نیست", Toast.LENGTH_SHORT).show(); return
        }
        startActivity(Intent(this, PlayerActivity::class.java).putExtra("url", url).putExtra("title", title))
    }

    /** the system DownloadManager can't talk to a self-signed server, so we download with the pinned certificate ourselves */
    private fun download(url: String, cd: String?, mime: String?) {
        if (url.startsWith("blob:") || url.startsWith("data:")) {
            Toast.makeText(this, "این نوع دانلود تو برنامه پشتیبانی نمی‌شه", Toast.LENGTH_SHORT).show(); return
        }
        Thread {
            try {
                val c = URL(url).openConnection() as HttpURLConnection
                if (c is HttpsURLConnection) {
                    c.sslSocketFactory = Trust.pinnedContext(Prefs.pin(this)).socketFactory
                    c.hostnameVerifier = HostnameVerifier { _, _ -> true }
                }
                val name = URLUtil.guessFileName(url, cd, mime)
                val values = ContentValues()
                values.put(MediaStore.Downloads.DISPLAY_NAME, name)
                values.put(MediaStore.Downloads.MIME_TYPE, mime ?: "application/octet-stream")
                val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)!!
                contentResolver.openOutputStream(uri)!!.use { out -> c.inputStream.use { it.copyTo(out) } }
                runOnUiThread { Toast.makeText(this, "تو پوشه Downloads ذخیره شد: $name", Toast.LENGTH_LONG).show() }
            } catch (e: Exception) {
                runOnUiThread { Toast.makeText(this, "دانلود نشد", Toast.LENGTH_LONG).show() }
            }
        }.start()
    }

    inner class Bridge {
        /** status/navigation bar colour follows the page theme */
        @JavascriptInterface
        fun setBar(color: String, dark: Boolean) {
            runOnUiThread {
                try {
                    val c = Color.parseColor(color)
                    window.statusBarColor = c
                    window.navigationBarColor = c
                    if (Build.VERSION.SDK_INT >= 23) {
                        var f = window.decorView.systemUiVisibility
                        f = if (dark) f and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv() else f or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                        if (Build.VERSION.SDK_INT >= 26) f = if (dark) f and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv() else f or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                        window.decorView.systemUiVisibility = f
                    }
                } catch (_: Exception) {}
            }
        }

        /** files / text another app shared to Windroida (returned once; the page then asks which chat) */
        @JavascriptInterface
        fun takeShare(): String { synchronized(shareLock) { val j = shareJson ?: ""; shareJson = null; return j } }

        @JavascriptInterface
        fun playVideo(url: String, title: String) { runOnUiThread { this@MainActivity.playVideo(url, title) } }

        @JavascriptInterface
        fun saveFile(url: String, name: String) { runOnUiThread { this@MainActivity.saveFile(url, name) } }

        @JavascriptInterface
        fun cacheInfo(): String = MediaCache.info()

        @JavascriptInterface
        fun cacheClear() { MediaCache.clearMedia() }

        @JavascriptInterface
        fun cacheLimit(mb: Int) { MediaCache.setLimitMb(mb) }

        @JavascriptInterface
        fun changeServer() { runOnUiThread { askServer(true) } }

        @JavascriptInterface
        fun setToken(t: String) {
            Prefs.setToken(this@MainActivity, t)
            if (t.isEmpty()) { NotifyService.stop(this@MainActivity); MediaCache.clearAll() } else {
                NotifyService.start(this@MainActivity)
                runOnUiThread { askBattery() }
            }
        }
    }

    /** another app shared files/text to us: copy them into the app's private folder first (the other app's permission ends soon) */
    private fun handleShare(i: Intent?) {
        if (i == null) return
        if (i.action != Intent.ACTION_SEND && i.action != Intent.ACTION_SEND_MULTIPLE) return
        val uris = ArrayList<Uri>()
        try {
            if (i.action == Intent.ACTION_SEND) {
                (if (Build.VERSION.SDK_INT >= 33) i.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java) else @Suppress("DEPRECATION") i.getParcelableExtra<Uri>(Intent.EXTRA_STREAM))?.let { uris.add(it) }
            } else {
                (if (Build.VERSION.SDK_INT >= 33) i.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java) else @Suppress("DEPRECATION") i.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM))?.let { uris.addAll(it) }
            }
        } catch (_: Exception) {}
        val text = i.getStringExtra(Intent.EXTRA_TEXT) ?: ""
        if (uris.isEmpty() && text.isEmpty()) return
        if (uris.size > 20) uris.subList(20, uris.size).clear()
        Thread {
            val dir = File(cacheDir, "share")
            dir.deleteRecursively()
            dir.mkdirs()
            val list = ArrayList<Pair<File, String>>()
            val meta = StringBuilder()
            for ((n, u) in uris.withIndex()) {
                try {
                    var name = "file"
                    contentResolver.query(u, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                        if (c.moveToFirst()) name = c.getString(0) ?: name
                    }
                    name = name.replace(Regex("[\\\\/:*?\"<>|\\u0000-\\u001f]"), "_").take(120).ifEmpty { "file" }
                    val mime = contentResolver.getType(u) ?: "application/octet-stream"
                    val f = File(dir, "$n.bin")
                    contentResolver.openInputStream(u)!!.use { ins -> f.outputStream().use { ins.copyTo(it) } }
                    list.add(Pair(f, mime))
                    if (meta.isNotEmpty()) meta.append(",")
                    meta.append("{\"i\":${list.size - 1},\"name\":${org.json.JSONObject.quote(name)},\"mime\":${org.json.JSONObject.quote(mime)},\"size\":${f.length()}}")
                } catch (_: Exception) {}
            }
            if (list.isEmpty() && text.isEmpty()) return@Thread
            synchronized(shareLock) {
                shareFiles.clear()
                shareFiles.addAll(list)
                shareJson = "{\"files\":[$meta],\"text\":${org.json.JSONObject.quote(text)}}"
            }
            runOnUiThread { deliverShare() }
        }.start()
    }

    private fun deliverShare() {
        if (!pageReady) return
        val has = synchronized(shareLock) { shareJson != null }
        if (has) web.evaluateJavascript("try{window.wdShare&&wdShare()}catch(e){}", null)
    }

    /** once: let the notification service keep running while the phone sleeps */
    private fun askBattery() {
        val sp = getSharedPreferences("wd", MODE_PRIVATE)
        if (sp.getBoolean("battery_asked", false)) return
        sp.edit().putBoolean("battery_asked", true).apply()
        val pm = getSystemService(PowerManager::class.java)
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try { startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))) } catch (_: Exception) {}
        }
    }
}
