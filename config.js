// ---------------------------------------------------------------
// Edit these two values, then reload the page.
//
// Account ID: CleverTap dashboard > Settings > Project (Account ID).
// Region:     the data center of your CleverTap account.
//             in1 = India, sg1 = Singapore, us1 = United States,
//             aps3 = Indonesia, eu1 = Europe (default).
// ---------------------------------------------------------------
window.APP_CONFIG = {
  CLEVERTAP_ACCOUNT_ID: "8R9-W6R-7R7Z",
  CLEVERTAP_REGION: "in1",

  // Firebase web app config (Firebase console > Project settings > Your apps).
  // These values are safe to expose in client code.
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyBQIV9v-4WBk6CE89qGFMSkwEEFYZHq7pc",
    authDomain: "webpush-4b121.firebaseapp.com",
    projectId: "webpush-4b121",
    storageBucket: "webpush-4b121.firebasestorage.app",
    messagingSenderId: "1049712746166",
    appId: "1:1049712746166:web:8e3b3ea6de0ec60eb91017",
    measurementId: "G-ZD999F7R7Q"
  },

  // Firebase console > Project settings > Cloud Messaging > Web Push certificates
  // > "Generate key pair" (or reuse the one pasted into CleverTap). Public key only.
  FIREBASE_VAPID_KEY: "BMvZw3-2yIujpa-uBUEm7jqYXgG6DWzPt0GPFirG46AZQHmUwFDR7bihbv0ymTB2b6nXUkd90OwMOOUPjLXOfgE",

  // Path where clevertap_sw.js is served. Keep it in the site root.
  SERVICE_WORKER_PATH: "sachin.github.io/clevertap_sw.js"
};
