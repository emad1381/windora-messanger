package ir.windroida.app

import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.Toast
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Full-screen video player (Media3 / ExoPlayer). The video is streamed from YOUR server with the pinned certificate
 * (seeking works, no freezing); a copy is saved in the app in the background, and when a saved copy exists it plays from it (works offline).
 */
class PlayerActivity : Activity() {
    private var player: ExoPlayer? = null
    private var pos = 0L
    private var playing = true

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val url = intent.getStringExtra("url") ?: return finish()
        val path = Uri.parse(url).path ?: return finish()
        MediaCache.init(this)
        pos = b?.getLong("pos") ?: 0L
        playing = b?.getBoolean("playing") ?: true

        val view = PlayerView(this)
        view.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING)
        view.setBackgroundColor(0xFF000000.toInt())
        view.layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        setContentView(view)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION

        val pin = Prefs.pin(this)
        val client = OkHttpClient.Builder()
            .sslSocketFactory(Trust.pinnedContext(pin).socketFactory, Trust.pinnedTm(pin))
            .hostnameVerifier { _, _ -> true }
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        val factory = DefaultDataSource.Factory(this, OkHttpDataSource.Factory(client))
        val p = ExoPlayer.Builder(this).setMediaSourceFactory(DefaultMediaSourceFactory(factory)).build()
        player = p
        view.player = p

        val saved = MediaCache.cachedFile(path)
        if (saved != null) p.setMediaItem(MediaItem.fromUri(Uri.fromFile(saved)))
        else {
            p.setMediaItem(MediaItem.fromUri(url))
            MediaCache.prefetch(url, path)
        }
        p.addListener(object : Player.Listener {
            override fun onPlayerError(e: PlaybackException) {
                Toast.makeText(this@PlayerActivity, "ویدیو پخش نشد", Toast.LENGTH_LONG).show()
            }
        })
        p.prepare()
        if (pos > 0) p.seekTo(pos)
        p.playWhenReady = playing
    }

    override fun onSaveInstanceState(o: Bundle) {
        super.onSaveInstanceState(o)
        player?.let { o.putLong("pos", it.currentPosition); o.putBoolean("playing", it.playWhenReady) }
    }

    override fun onPause() { super.onPause(); player?.pause() }

    override fun onDestroy() {
        player?.release()
        player = null
        super.onDestroy()
    }
}
