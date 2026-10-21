plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "ir.windroida.app"
    compileSdk = 34
    defaultConfig {
        applicationId = "ir.windroida.app"
        minSdk = 29
        targetSdk = 34
        versionCode = 2
        versionName = "1.1"
    }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    // native video player (plays videos of the chat; uses the pinned certificate through OkHttp)
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-ui:1.4.1")
    implementation("androidx.media3:media3-datasource-okhttp:1.4.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
