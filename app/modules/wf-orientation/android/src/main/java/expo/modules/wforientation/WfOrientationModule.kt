package expo.modules.wforientation

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Sends "where the back camera points" as a unit vector (east, north, up),
// using Android's fused rotation-vector sensor (gyroscope + accelerometer + compass).
// Heading is corrected from magnetic north to true north for the user's place.
class WfOrientationModule : Module(), SensorEventListener {
  private var manager: SensorManager? = null
  private val rot = FloatArray(9)
  private var lastSent = 0L
  private var declRad = 0.0

  override fun definition() = ModuleDefinition {
    Name("WfOrientation")

    Events("onDir")

    Function("start") {
      val ctx = appContext.reactContext
      if (ctx == null) {
        ""
      } else {
        val sm = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val sensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        if (sensor == null) {
          ""
        } else {
          sm.unregisterListener(this@WfOrientationModule)
          sm.registerListener(this@WfOrientationModule, sensor, SensorManager.SENSOR_DELAY_GAME)
          // the magnetometer is only listened to for its calibration state (accuracy)
          acc = -1
          sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)?.let { sm.registerListener(this@WfOrientationModule, it, SensorManager.SENSOR_DELAY_NORMAL) }
          manager = sm
          "rv"
        }
      }
    }

    Function("stop") {
      manager?.unregisterListener(this@WfOrientationModule)
      manager = null
    }

    Function("setPlace") { lat: Double, lon: Double ->
      val f = GeomagneticField(lat.toFloat(), lon.toFloat(), 0f, System.currentTimeMillis())
      declRad = Math.toRadians(f.declination.toDouble())
      f.declination.toDouble()
    }

    OnDestroy {
      manager?.unregisterListener(this@WfOrientationModule)
      manager = null
    }
  }

  // accuracy of the compass part (0 unreliable .. 3 high), from Android
  private var acc = -1

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_ROTATION_VECTOR) return
    val now = System.currentTimeMillis()
    if (now - lastSent < 16) return
    lastSent = now
    SensorManager.getRotationMatrixFromVector(rot, event.values)
    val c = Math.cos(declRad)
    val s = Math.sin(declRad)
    // back camera (device -Z) and top of the screen (device +Y), in east/north/up
    val e = -rot[2].toDouble(); val n = -rot[5].toDouble(); val u = -rot[8].toDouble()
    val te = rot[1].toDouble(); val tn = rot[4].toDouble(); val tu = rot[7].toDouble()
    // estimated heading error in degrees (Android 4.3+, -1 when the phone does not say)
    val headErr = if (event.values.size > 4 && event.values[4] >= 0f) Math.toDegrees(event.values[4].toDouble()) else -1.0
    sendEvent("onDir", Bundle().apply {
      putDouble("x", e * c + n * s)
      putDouble("y", n * c - e * s)
      putDouble("z", u)
      putDouble("tx", te * c + tn * s)
      putDouble("ty", tn * c - te * s)
      putDouble("tz", tu)
      putInt("acc", acc)
      putDouble("herr", headErr)
    })
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    if (sensor?.type == Sensor.TYPE_MAGNETIC_FIELD) acc = accuracy
  }
}
