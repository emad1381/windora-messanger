package ir.windroida.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/** Long-polls the Windroida server (POST /notify) and shows a notification for every new message while the app is in the background. No Google services needed. */
class NotifyService : Service() {
    @Volatile private var running = false
    private var worker: Thread? = null

    companion object {
        const val CH_SVC = "svc"
        const val CH_MSG = "msg"
        fun start(c: Context) {
            if (Prefs.token(c).isEmpty() || Prefs.server(c).isEmpty()) return
            ContextCompat.startForegroundService(c, Intent(c, NotifyService::class.java))
        }
        fun stop(c: Context) { c.stopService(Intent(c, NotifyService::class.java)) }
    }

    override fun onBind(i: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CH_SVC, "اتصال Windroida", NotificationManager.IMPORTANCE_MIN))
        nm.createNotificationChannel(NotificationChannel(CH_MSG, "پیام‌ها", NotificationManager.IMPORTANCE_HIGH))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val n: Notification = NotificationCompat.Builder(this, CH_SVC)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle("Windroida")
            .setContentText("متصل برای دریافت پیام‌ها")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE) else startForeground(1, n)
        if (!running) {
            running = true
            worker = Thread { loop() }.also { it.isDaemon = true; it.start() }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        running = false
        worker?.interrupt()
        super.onDestroy()
    }

    private fun loop() {
        var since = -1L
        var backoff = 2000L
        while (running) {
            val server = Prefs.server(this)
            val token = Prefs.token(this)
            val pin = Prefs.pin(this)
            if (server.isEmpty() || token.isEmpty() || (server.startsWith("https") && pin.isEmpty())) {
                sleep(5000); continue
            }
            try {
                val res = post("$server/notify", JSONObject().put("token", token).put("since", since).toString(), pin)
                val seq = res.optLong("seq", since)
                if (since >= 0) {
                    val items = res.optJSONArray("items")
                    if (items != null) for (i in 0 until items.length()) show(items.getJSONObject(i))
                }
                since = seq
                backoff = 2000L
            } catch (e: AuthException) {
                sleep(60000)                       // session ended (logged out / expired): check again in a minute
            } catch (e: Exception) {
                if (!running) return
                sleep(backoff)
                backoff = minOf(backoff * 2, 60000L)
            }
        }
    }

    private class AuthException : Exception()

    private fun post(url: String, body: String, pin: String): JSONObject {
        val c = URL(url).openConnection() as HttpURLConnection
        try {
            if (c is HttpsURLConnection) {
                c.sslSocketFactory = Trust.pinnedContext(pin).socketFactory
                c.hostnameVerifier = javax.net.ssl.HostnameVerifier { _, _ -> true }   // the pinned fingerprint is what we trust
            }
            c.requestMethod = "POST"
            c.connectTimeout = 10000
            c.readTimeout = 45000
            c.doOutput = true
            c.setRequestProperty("Content-Type", "application/json")
            c.outputStream.use { it.write(body.toByteArray()) }
            val code = c.responseCode
            if (code == 403) throw AuthException()
            if (code != 200) throw Exception("http $code")
            return JSONObject(c.inputStream.bufferedReader().readText())
        } finally {
            c.disconnect()
        }
    }

    private fun sleep(ms: Long) { try { Thread.sleep(ms) } catch (_: InterruptedException) {} }

    private fun show(o: JSONObject) {
        if (App.foreground) return                  // you are looking at the app: it plays its own sound
        val chat = o.optInt("chat_id")
        val open = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra("chat", chat)
        val pi = PendingIntent.getActivity(this, chat, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(this, CH_MSG)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(o.optString("title"))
            .setContentText(o.optString("text"))
            .setStyle(NotificationCompat.BigTextStyle().bigText(o.optString("text")))
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .build()
        try { getSystemService(NotificationManager::class.java).notify(2000 + chat, n) } catch (_: SecurityException) {}
    }
}
