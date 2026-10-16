// Firebase Web SDK (modular, loaded from CDN). Used for FCM web push.
// Exposes window.masalaFirebase.getToken() for app.js.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

const cfg = window.APP_CONFIG || {};
const app = initializeApp(cfg.FIREBASE_CONFIG);

window.masalaFirebase = {
  app,

  // Call only after Notification.permission === "granted".
  // Reuses the root-scope service worker (clevertap_sw.js) so the two don't clash.
  async getToken() {
    if (!(await isSupported())) throw new Error("FCM is not supported in this browser");
    if (!cfg.FIREBASE_VAPID_KEY || cfg.FIREBASE_VAPID_KEY.startsWith("PASTE_")) {
      throw new Error("Set FIREBASE_VAPID_KEY in config.js");
    }
    const registration = await navigator.serviceWorker.register(
      cfg.SERVICE_WORKER_PATH || "/clevertap_sw.js"
    );
    await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    return getToken(messaging, {
      vapidKey: cfg.FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
  },

  // Foreground messages (page is open).
  onMessage(cb) {
    return onMessage(getMessaging(app), cb);
  }
};

window.dispatchEvent(new Event("firebase-ready"));
