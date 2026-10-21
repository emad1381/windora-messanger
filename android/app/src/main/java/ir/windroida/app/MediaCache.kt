package ir.windroida.app

import android.content.Context
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLSocketFactory

/**
 * Keeps everything the app downloads INSIDE the app (private folder, other apps can't see it):
 *  - media/  photos, videos, voices, songs, files that were opened once (limit you choose, oldest removed first)
 *  - shell/  the app pages themselves (html/js/css) so the app opens and shows the saved chats with no internet
 * Requests go through the pinned certificate, never through the phone's certificate store.
 */
object MediaCache {
    // no limit per file: only the total you choose in "مدیریت حافظه" counts (a file bigger than that total is simply not kept)
    private const val SHELL_MAX = 6 * 1024 * 1024
    private lateinit var app: Context
    private val busy = ConcurrentHashMap.newKeySet<String>()
    private val pool = Executors.newFixedThreadPool(2)
    private var sslPin = ""
    private var sslFactory: SSLSocketFactory? = null

    fun init(c: Context) { app = c.applicationContext }

    private fun dir(name: String): File = File(app.filesDir, name).also { it.mkdirs() }
    private fun sp() = app.getSharedPreferences("wd", Context.MODE_PRIVATE)
    fun limitMb(): Int = sp().getInt("cache_mb", 1024)               // 0 = no limit
    fun setLimitMb(v: Int) { sp().edit().putInt("cache_mb", v.coerceIn(0, 100000)).apply(); trim() }

    /** is there any network at all? (if the permission is missing or anything fails we say "yes": then nothing changes) */
    private fun online(): Boolean = try {
        val cm = app.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val n = cm.activeNetwork
        n != null && cm.getNetworkCapabilities(n) != null
    } catch (_: Exception) { true }

    private fun hash(s: String): String =
        MessageDigest.getInstance("SHA-256").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }.take(40)

    private fun open(url: String, range: String? = null, timeout: Int = 8000): HttpURLConnection {
        val c = URL(url).openConnection() as HttpURLConnection
        if (c is HttpsURLConnection) {
            val pin = Prefs.pin(app)
            if (sslFactory == null || pin != sslPin) { sslFactory = Trust.pinnedContext(pin).socketFactory; sslPin = pin }
            c.sslSocketFactory = sslFactory
            c.hostnameVerifier = HostnameVerifier { _, _ -> true }
        }
        c.connectTimeout = timeout
        c.readTimeout = 20000
        if (range != null) c.setRequestProperty("Range", range)
        return c
    }

    private fun split(ct: String?): Pair<String, String?> {
        val t = (ct ?: "application/octet-stream").split(";")
        val cs = t.drop(1).map { it.trim() }.firstOrNull { it.startsWith("charset=", true) }?.substringAfter("=")
        return Pair(t[0].trim().ifEmpty { "application/octet-stream" }, cs)
    }

    /** what kind of request is it?  "media" (opened files, thumbnails), "shell" (app pages) or null (not ours) */
    fun kind(path: String): String? = when {
        path.startsWith("/media/") || path.startsWith("/thumb/") || path.startsWith("/avatar/") || path.startsWith("/wall/") || path == "/userwall" -> "media"
        path == "/" || path.startsWith("/static/") || path == "/manifest.webmanifest" -> "shell"
        else -> null
    }

    // ------------------------------------------------------------------ app pages: network first, saved copy when offline
    fun shell(url: String, path: String, query: String?): WebResourceResponse? {
        val key = hash(if (path == "/") "/" else path + "?" + (query ?: ""))
        val d = File(dir("shell"), "$key.d")
        val m = File(dir("shell"), "$key.m")
        try {
            val c = open(url, null, 5000)
            if (c.responseCode == 200) {
                val ct = c.contentType
                val csp = c.getHeaderField("Content-Security-Policy")
                val bytes = c.inputStream.use { it.readBytes() }
                if (bytes.size <= SHELL_MAX) {
                    val tmp = File(d.path + ".tmp")
                    tmp.writeBytes(bytes)
                    tmp.renameTo(d)
                    m.writeText((ct ?: "") + "\n" + (csp ?: ""))
                }
                val (mime, cs) = split(ct)
                val h = HashMap<String, String>()
                if (csp != null) h["Content-Security-Policy"] = csp
                h["Cache-Control"] = "no-store"
                return WebResourceResponse(mime, cs, 200, "OK", h, ByteArrayInputStream(bytes))
            }
            c.disconnect()
        } catch (_: Exception) {}
        return savedShell(d, m)
    }

    private fun savedShell(d: File, m: File): WebResourceResponse? {
        if (!d.exists() || !m.exists()) return null
        return try {
            val l = m.readText().split("\n")
            val (mime, cs) = split(l.getOrNull(0))
            val h = HashMap<String, String>()
            if (!l.getOrNull(1).isNullOrEmpty()) h["Content-Security-Policy"] = l[1]
            WebResourceResponse(mime, cs, 200, "OK", h, ByteArrayInputStream(d.readBytes()))
        } catch (_: Exception) { null }
    }

    // ------------------------------------------------------------------ media: saved copy first, otherwise download in the background
    fun media(url: String, path: String, query: String?, range: String?): WebResourceResponse? {
        // /media and /thumb never change for one message id; avatars and wallpapers carry their version in the address
        val stable = path.startsWith("/media/") || path.startsWith("/thumb/")
        val q = if (stable || query == null) "" else query.split("&").filter { !it.startsWith("k=") }.sorted().joinToString("&")
        val key = hash("$path?$q")
        val d = File(dir("media"), "$key.d")
        val m = File(dir("media"), "$key.m")
        val have = d.exists() && m.exists()
        if (have) {
            // video/audio that the phone itself streams from the server keeps streaming from the server while there is a network:
            // switching to the saved copy in the middle of playing froze videos after the first seconds. Offline → saved copy.
            val streaming = try { val t = m.readText().trim().lowercase(); t.startsWith("video/") || t.startsWith("audio/") } catch (_: Exception) { false }
            if (!streaming || !online()) {
                try { return serve(d, m, range) } catch (_: Exception) {}
            }
        } else if (busy.add(key)) {
            pool.execute { try { download(url, d, m) } finally { busy.remove(key) } }
        }
        return null                                                   // the page loads it from the network as usual
    }

    /** the native player streams a video: at the same time keep a saved copy (for offline), unless we already have one */
    fun prefetch(url: String, path: String) {
        val key = hash("$path?")
        val d = File(dir("media"), "$key.d")
        val m = File(dir("media"), "$key.m")
        if (!(d.exists() && m.exists()) && busy.add(key)) pool.execute { try { download(url, d, m) } finally { busy.remove(key) } }
    }

    private fun download(url: String, d: File, m: File) {
        val tmp = File(d.path + ".tmp")
        try {
            val c = open(url, null, 10000)
            if (c.responseCode != 200) { c.disconnect(); return }
            val len = c.contentLengthLong
            val lim = limitMb().toLong() * 1024 * 1024
            if (lim > 0 && len > lim) { c.disconnect(); return }
            var n = 0L
            c.inputStream.use { ins -> tmp.outputStream().use { out ->
                val buf = ByteArray(64 * 1024)
                while (true) {
                    val r = ins.read(buf)
                    if (r < 0) break
                    n += r
                    if (lim > 0 && n > lim) throw RuntimeException("too big")
                    out.write(buf, 0, r)
                }
            } }
            if (len >= 0 && n != len) { tmp.delete(); return }       // cut off in the middle: don't keep half a file
            m.writeText(c.contentType ?: "application/octet-stream")
            if (!tmp.renameTo(d)) tmp.delete()
            trim()
        } catch (_: Exception) { tmp.delete() }
    }

    private class Lim(val s: InputStream, var left: Long) : InputStream() {
        override fun read(): Int { if (left <= 0) return -1; val r = s.read(); if (r >= 0) left--; return r }
        override fun read(b: ByteArray, o: Int, l: Int): Int {
            if (left <= 0) return -1
            val r = s.read(b, o, minOf(l.toLong(), left).toInt())
            if (r > 0) left -= r
            return r
        }
        override fun close() { s.close() }
    }

    private fun serve(d: File, m: File, range: String?): WebResourceResponse {
        val (mime, _) = split(m.readText())
        val len = d.length()
        var start = 0L
        var end = len - 1
        var status = 200
        if (range != null) {
            val g = Regex("bytes=(\\d*)-(\\d*)").matchEntire(range.trim())
            if (g != null) {
                val a = g.groupValues[1]
                val b = g.groupValues[2]
                if (a.isEmpty() && b.isNotEmpty()) { start = maxOf(0L, len - b.toLong()) }
                else if (a.isNotEmpty()) { start = a.toLong(); if (b.isNotEmpty()) end = minOf(end, b.toLong()) }
                if (start > end || start >= len) {
                    return WebResourceResponse(mime, null, 416, "Range Not Satisfiable",
                        mapOf("Content-Range" to "bytes */$len"), ByteArrayInputStream(ByteArray(0)))
                }
                status = 206
            }
        }
        d.setLastModified(System.currentTimeMillis())                // used recently → removed last
        val f = FileInputStream(d)
        if (start > 0) { var s = start; while (s > 0) { val k = f.skip(s); if (k <= 0) break; s -= k } }
        val h = HashMap<String, String>()
        h["Accept-Ranges"] = "bytes"
        h["Content-Length"] = (end - start + 1).toString()
        h["Cache-Control"] = "no-store"
        if (status == 206) h["Content-Range"] = "bytes $start-$end/$len"
        return WebResourceResponse(mime, null, status, if (status == 206) "Partial Content" else "OK", h, Lim(f, end - start + 1))
    }

    /** the saved copy of a /media/<id> file (opened before), or null */
    fun cachedFile(path: String): File? {
        val key = hash("$path?")
        val d = File(dir("media"), "$key.d")
        return if (d.exists() && File(dir("media"), "$key.m").exists()) d else null
    }

    // ------------------------------------------------------------------ management
    private fun files(): List<File> = (dir("media").listFiles { f -> f.name.endsWith(".d") } ?: arrayOf()).toList()

    fun info(): String {
        val fs = files()
        val total = fs.sumOf { it.length() }
        return "{\"bytes\":$total,\"count\":${fs.size},\"limit_mb\":${limitMb()}}"
    }

    /** oldest-used files go first until we are at 90 % of the limit */
    fun trim() {
        val lim = limitMb().toLong() * 1024 * 1024
        if (lim <= 0) return
        val fs = files().sortedBy { it.lastModified() }
        var total = fs.sumOf { it.length() }
        if (total <= lim) return
        for (f in fs) {
            if (total <= lim * 9 / 10) break
            total -= f.length()
            f.delete()
            File(f.path.removeSuffix(".d") + ".m").delete()
        }
    }

    fun clearMedia() { dir("media").listFiles()?.forEach { it.delete() } }

    /** logout / other server: nothing of the old account stays on the phone */
    fun clearAll() {
        clearMedia()
        dir("shell").listFiles()?.forEach { it.delete() }
    }
}
