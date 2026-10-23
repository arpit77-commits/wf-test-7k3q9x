// Android's own fused orientation sensor (gyroscope + accelerometer + compass),
// exposed to the app. Returns null when this native part is not present.
import { requireOptionalNativeModule } from 'expo';
export default requireOptionalNativeModule('WfOrientation');
