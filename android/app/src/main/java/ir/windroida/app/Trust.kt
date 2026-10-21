package ir.windroida.app

import android.content.Context
import java.security.MessageDigest
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

/** Saved settings: server address, pinned certificate fingerprint, session token. */
object Prefs {
    private fun sp(c: Context) = c.getSharedPreferences("wd", Context.MODE_PRIVATE)
    fun server(c: Context): String = sp(c).getString("server", "") ?: ""
    fun pin(c: Context): String = sp(c).getString("pin", "") ?: ""
    fun token(c: Context): String = sp(c).getString("token", "") ?: ""
    fun setServer(c: Context, v: String) = sp(c).edit().putString("server", v.trim().trimEnd('/')).apply()
    fun setPin(c: Context, v: String) = sp(c).edit().putString("pin", v).apply()
    fun setToken(c: Context, v: String) = sp(c).edit().putString("token", v).apply()
}

/** Trust ONLY the server certificate whose SHA-256 fingerprint you confirmed (no system certificate store needed). */
object Trust {
    fun sha256(cert: X509Certificate): String =
        MessageDigest.getInstance("SHA-256").digest(cert.encoded).joinToString(":") { "%02X".format(it) }

    fun pinnedTm(pin: String): X509TrustManager = object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
        override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
            if (chain.isEmpty() || sha256(chain[0]) != pin) throw CertificateException("certificate does not match the pinned fingerprint")
        }
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    }

    fun pinnedContext(pin: String): SSLContext {
        val tm = pinnedTm(pin)
        val ctx = SSLContext.getInstance("TLS")
        ctx.init(null, arrayOf<TrustManager>(tm), null)
        return ctx
    }
}
