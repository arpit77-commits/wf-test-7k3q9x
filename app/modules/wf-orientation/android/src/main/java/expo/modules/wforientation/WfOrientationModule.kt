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

  override fun onSensorChanged(event: SensorEvent) {
    val now = System.currentTimeMillis()
    if (now - lastSent < 16) return
    lastSent = now
    SensorManager.getRotationMatrixFromVector(rot, event.values)
    val e = -rot[2].toDouble()
    val n = -rot[5].toDouble()
    val u = -rot[8].toDouble()
    val c = Math.cos(declRad)
    val s = Math.sin(declRad)
    sendEvent("onDir", Bundle().apply {
      putDouble("x", e * c + n * s)
      putDouble("y", n * c - e * s)
      putDouble("z", u)
    })
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
