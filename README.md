# Masala Hour: CleverTap web push sample

A small tea shop that shows the full CleverTap web push flow: SDK setup, service worker, a soft permission prompt after a meaningful action, user identification, and events.

## Files

| File | Purpose |
|---|---|
| `config.js` | Your CleverTap Account ID and region. **Edit this first.** |
| `clevertap-init.js` | Web SDK snippet (queues calls, loads `clevertap.min.js`). |
| `clevertap_sw.js` | Push service worker. Must stay in the site root with this name. |
| `manifest.json`, `icon-512x512.png` | Required for web push on iOS / iPadOS. |
| `index.html`, `styles.css`, `app.js` | The shop, plus a live push-setup checklist and event log. |

## 1. Set up CleverTap (one time)

1. **Generate VAPID keys** (one-time):
   ```
   npx web-push generate-vapid-keys
   ```
   You can also generate a key pair in the Firebase console under Project Settings > Cloud Messaging > Web Configuration.
2. In the CleverTap dashboard go to **Settings > Engage > Channels > Web Push**.
3. For each browser you want (Chrome, Firefox, Safari), paste the public and private key, enable it, and click **Save**.
4. Copy your **Account ID** (Settings > Project) and note your **region**.
5. Put both in `config.js`.

## 2. Run it

From this folder:

```
python3 -m http.server 8000
```

Open <http://localhost:8000>. Browsers treat `localhost` as a secure context, so push can work there. If the prompt never appears, serve the folder over HTTPS instead (for example with an HTTPS tunnel or any static host).

## 3. Test the flow

1. Check the **Push setup** section. Everything except "Service worker registered" and "Permission" should say Done.
2. Press **Sign in** and enter a name and email. This calls `clevertap.onUserLogin.push` so the profile has an identity.
3. Add a blend to the basket and press **Place order**. This sends a `Charged` event and, after a moment, shows CleverTap's soft prompt.
4. Click **Yes, notify me**, then allow notifications in the browser dialog.
5. In the dashboard create a **Web Push** campaign, target your user (or use the "Test" option with your profile), and send.

## Things worth knowing

- **Ask at the right moment.** The sample asks after an order, not on page load. CleverTap also suppresses the soft prompt for a week after a visitor rejects it.
- **Soft prompt vs native prompt.** `askForPush()` in `app.js` shows CleverTap's soft prompt. Add `skipDialog: true` to go straight to the browser's own prompt.
- **Dashboard soft prompt (card popup).** If you enable the Soft Prompt card popup in Settings > Channels > Web Push, it must be configured there first, and a custom VAPID key with it needs Web SDK v2.7.1 or later.
- **Existing service worker?** Add this as the first line of your own worker instead of using `clevertap_sw.js`:
  ```js
  importScripts('https://s3-eu-west-1.amazonaws.com/static.wizrocket.com/js/sw_webpush.js');
  ```
- **Official worker file.** The `clevertap_sw.js` here uses the documented `importScripts` approach. You can replace it with the file CleverTap provides in its Web Push docs.
- **Where web push does not work:** plain HTTP (outside localhost), private/incognito windows, in-app browsers (Instagram, Facebook), and Android WebViews.
- **iOS / iPadOS:** the visitor must Add to Home Screen first (Safari 16.4+), and the permission request must follow a direct tap.
- **If you see "Ensure that web push notifications are fully enabled and integrated"**, the VAPID keys are missing or not enabled for that browser in the dashboard.

## Going live

Before launching, walk through CleverTap's Developer Go Live Checklist. Replace the demo `Charged` event with your real checkout, and wire `onUserLogin` into your actual sign-in.

Docs: https://developer.clevertap.com/docs/web-push and https://developer.clevertap.com/docs/web-quickstart-guide
