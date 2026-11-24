import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// En Android se usa performAndroidHapticsAsync: la doc de SDK 57 desaconseja
// la API Vibrator (impactAsync/notificationAsync) en esa plataforma.
const esAndroid = Platform.OS === 'android';

// Un dispositivo sin motor háptico (o en modo ahorro en iOS) rechaza la
// promesa: no es un error que el usuario deba ver.
const ignorar = () => {};

/** Retroalimentación táctil única para toda la app. */
export const haptics = {
  tap() {
    (esAndroid
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ).catch(ignorar);
  },
  exito() {
    (esAndroid
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ).catch(ignorar);
  },
  error() {
    (esAndroid
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    ).catch(ignorar);
  },
  advertencia() {
    (esAndroid
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    ).catch(ignorar);
  },
};
