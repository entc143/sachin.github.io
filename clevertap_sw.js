// Combined service worker: CleverTap web push + Firebase Cloud Messaging.
// Must be served from the site root. Only one worker can own the root scope,
// so both SDKs live here instead of a separate firebase-messaging-sw.js.

// CleverTap's hosted worker (handles CleverTap pushes).
importScripts('https://s3-eu-west-1.amazonaws.com/static.wizrocket.com/js/sw_webpush.js');

// Firebase (compat build is required inside service workers).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBQIV9v-4WBk6CE89qGFMSkwEEFYZHq7pc",
  authDomain: "webpush-4b121.firebaseapp.com",
  projectId: "webpush-4b121",
  storageBucket: "webpush-4b121.firebasestorage.app",
  messagingSenderId: "1049712746166",
  appId: "1:1049712746166:web:8e3b3ea6de0ec60eb91017",
  measurementId: "G-ZD999F7R7Q"
});

// Registers FCM's background handling. Messages with a "notification" payload
// are shown automatically by the SDK.
firebase.messaging();
