(() => {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const rupees = (n) => "₹" + n.toLocaleString("en-IN");

  // ------------------------------------------------------------
  // Catalogue
  // ------------------------------------------------------------
  const PRODUCTS = [
    { id: "assam",   name: "Kadak Assam",       notes: "Malty and strong. Made for milk and a long pour.", price: 320, color: "#7A2E1B", tag: "CTC" },
    { id: "elaichi", name: "Elaichi Chai",      notes: "Green cardamom folded into a bright black tea.",   price: 360, color: "#F6B21A", tag: "Elaichi" },
    { id: "kahwa",   name: "Kashmiri Kahwa",    notes: "Saffron, almond and green tea. Brew without milk.", price: 540, color: "#6B2D5C", tag: "Kahwa" },
    { id: "masala",  name: "Masala Mix",        notes: "Ginger, clove, pepper and cinnamon. Cold-weather tea.", price: 340, color: "#D6402C", tag: "Masala" },
    { id: "darj",    name: "Darjeeling Flush",  notes: "Light and floral. A first-flush tea for mornings.",  price: 690, color: "#3E7CB1", tag: "Darjeeling" },
    { id: "tulsi",   name: "Tulsi Ginger",      notes: "Holy basil and dried ginger. Caffeine free.",        price: 290, color: "#1F6B52", tag: "Tulsi" }
  ];

  const cart = new Map(); // product id -> quantity
  let currentUser = null;

  // ------------------------------------------------------------
  // CleverTap helpers
  // ------------------------------------------------------------
  function track(name, props) {
    try {
      if (props) clevertap.event.push(name, props);
      else clevertap.event.push(name);
    } catch (err) {
      console.warn("CleverTap event failed", err);
    }
    logEvent(name, props);
  }

  // Soft prompt: shown BEFORE the browser's own permission dialog.
  // CleverTap only shows it if the visitor has not rejected it within the last week.
  function askForPush() {
    try {
      clevertap.notifications.push({
        titleText: "Get order and restock updates?",
        bodyText: "We only message you about your orders and blends coming back in stock.",
        okButtonText: "Yes, notify me",
        rejectButtonText: "Not now",
        okButtonColor: "#F6B21A",
        askAgainTimeInSeconds: 5,
        serviceWorkerPath: cfg.SERVICE_WORKER_PATH || "sachin.github.io/clevertap_sw.js"
        // To skip the soft prompt and show the browser's native prompt directly:
        // skipDialog: true
      });
      logEvent("notifications.push (soft prompt requested)");
    } catch (err) {
      toast("Could not start the push prompt. Check the setup list below.");
      console.warn(err);
    }
  }

  // ------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------
  function renderProducts() {
    $("#products").innerHTML = PRODUCTS.map((p) => `
      <article class="product">
        <div class="tin" style="--c:${p.color}" aria-hidden="true"><span>${p.tag}</span></div>
        <div>
          <h3>${p.name}</h3>
          <p>${p.notes}</p>
          <div class="row">
            <span class="price">${rupees(p.price)} / 250 g</span>
            <button class="btn" type="button" data-add="${p.id}">Add to basket</button>
          </div>
        </div>
      </article>`).join("");
  }

  function renderCart() {
    const body = $("#basketBody");
    const count = [...cart.values()].reduce((a, b) => a + b, 0);
    $("#cartCount").textContent = count;

    if (!cart.size) {
      body.innerHTML = '<p class="basket-empty">Your basket is empty. Add a blend to try the order flow.</p>';
    } else {
      body.innerHTML = '<ul class="basket-list">' + [...cart].map(([id, qty]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        return `<li>
          <span>${p.name}</span>
          <span class="qty">
            <button class="step" type="button" data-dec="${id}" aria-label="Remove one ${p.name}">−</button>
            <span aria-label="quantity">${qty}</span>
            <button class="step" type="button" data-inc="${id}" aria-label="Add one ${p.name}">+</button>
          </span>
          <span>${rupees(p.price * qty)}</span>
        </li>`;
      }).join("") + "</ul>";
    }

    $("#basketTotal").textContent = "Total " + rupees(cartTotal());
    $("#orderBtn").disabled = !cart.size;
  }

  function cartTotal() {
    let sum = 0;
    cart.forEach((qty, id) => { sum += PRODUCTS.find((p) => p.id === id).price * qty; });
    return sum;
  }

  // ------------------------------------------------------------
  // Cart + order actions
  // ------------------------------------------------------------
  function addToCart(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    track("Added to Cart", { "Product name": p.name, "Product ID": p.id, "Price": p.price });
    toast(p.name + " added to your basket.");
  }

  function changeQty(id, delta) {
    const next = (cart.get(id) || 0) + delta;
    if (next <= 0) cart.delete(id); else cart.set(id, next);
    renderCart();
  }

  function placeOrder() {
    if (!cart.size) return;
    const orderId = "MH-" + Date.now().toString(36).toUpperCase();
    const items = [...cart].map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      return { "Product name": p.name, "Category": "Tea", "Quantity": qty, "Price": p.price };
    });

    // "Charged" is CleverTap's standard purchase event.
    track("Charged", {
      "Amount": cartTotal(),
      "Payment mode": "Demo",
      "Charged ID": orderId,
      "Items": items
    });

    cart.clear();
    renderCart();
    toast("Order " + orderId + " placed.");

    // Ask for push after a meaningful action, not on page load.
    setTimeout(askForPush, 900);
  }

  // ------------------------------------------------------------
  // Sign in (identifies the user in CleverTap)
  // ------------------------------------------------------------
  function setupLogin() {
    const dlg = $("#loginDialog");
    $("#loginBtn").addEventListener("click", () => {
      if (typeof dlg.showModal === "function") dlg.showModal();
    });
    $("#loginCancel").addEventListener("click", () => dlg.close());

    $("#loginForm").addEventListener("submit", (e) => {
      const data = new FormData(e.target);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const phone = String(data.get("phone") || "").trim();

      const profile = { Name: name, Email: email, Identity: email };
      if (/^\+[0-9]{8,15}$/.test(phone)) profile.Phone = phone;

      try {
        clevertap.onUserLogin.push({ Site: profile });
      } catch (err) { console.warn(err); }

      currentUser = profile;
      $("#loginBtn").textContent = "Hi, " + name.split(" ")[0];
      logEvent("onUserLogin", profile);
      toast("Signed in as " + name + ".");
    });
  }

  // ------------------------------------------------------------
  // Event log + toast
  // ------------------------------------------------------------
  function logEvent(name, props) {
    const list = $("#log");
    const empty = list.querySelector(".empty");
    if (empty) empty.remove();

    const li = document.createElement("li");
    const t = document.createElement("span");
    t.className = "t";
    t.textContent = new Date().toLocaleTimeString("en-IN", { hour12: false });
    const ev = document.createElement("span");
    ev.className = "ev";
    ev.textContent = name;
    li.append(t, ev);

    if (props) {
      const pre = document.createElement("pre");
      pre.textContent = JSON.stringify(props, null, 2);
      li.append(pre);
    }
    list.prepend(li);
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  // ------------------------------------------------------------
  // Push setup checklist (live)
  // ------------------------------------------------------------
  async function checkStatus() {
    const rows = [];
    const add = (state, name, detail) => rows.push({ state, name, detail });

    // Account configured?
    const idOk = cfg.CLEVERTAP_ACCOUNT_ID && !/^YOUR/i.test(cfg.CLEVERTAP_ACCOUNT_ID);
    add(idOk ? "ok" : "bad", "Account ID",
      idOk ? "Using account " + cfg.CLEVERTAP_ACCOUNT_ID + " in region " + cfg.CLEVERTAP_REGION + "."
           : "Open config.js and set CLEVERTAP_ACCOUNT_ID and CLEVERTAP_REGION.");

    // Secure context
    const secure = window.isSecureContext;
    add(secure ? "ok" : "bad", "Secure page",
      secure ? (location.protocol === "https:" ? "Served over HTTPS." : "Served from localhost, which browsers treat as secure.")
             : "Web push needs HTTPS. Serve this site over HTTPS or from localhost.");

    // Browser support
    const supported = "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
    add(supported ? "ok" : "bad", "Browser support",
      supported ? "This browser supports web push."
                : "Service workers or push are unavailable. Try Chrome, Firefox or Safari, outside private mode and in-app browsers.");

    // SDK loaded
    const sdkLoaded = typeof clevertap.getSDKVersion === "function";
    add(sdkLoaded ? "ok" : "wait", "CleverTap SDK",
      sdkLoaded ? "Loaded, version " + clevertap.getSDKVersion() + "."
                : "Not loaded yet. If this stays pending, check your network and ad blockers.");

    // Service worker file reachable
    let swReachable = false;
    try {
      const res = await fetch(cfg.SERVICE_WORKER_PATH || "sachin.github.io/clevertap_sw.js", { method: "HEAD", cache: "no-store" });
      swReachable = res.ok;
    } catch (_) { /* ignore */ }
    add(swReachable ? "ok" : "bad", "Service worker file",
      swReachable ? "clevertap_sw.js is reachable at the site root."
                  : "clevertap_sw.js was not found at the site root. Serve the folder with a web server, not file://.");

    // Service worker registered
    let swRegistered = false;
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        swRegistered = regs.some((r) => [r.active, r.waiting, r.installing]
          .some((w) => w && sachin.github.io/clevertap_sw/.test(w.scriptURL)));
      } catch (_) { /* ignore */ }
    }
    add(swRegistered ? "ok" : "wait", "Service worker registered",
      swRegistered ? "CleverTap's worker is active."
                   : "Registers after a visitor allows notifications.");

    // Permission
    const perm = "Notification" in window ? Notification.permission : "unsupported";
    if (perm === "granted") add("ok", "Permission", "Notifications are allowed for this site.");
    else if (perm === "denied") add("bad", "Permission", "Blocked in browser settings. Reset the site's notification permission to ask again.");
    else add("wait", "Permission", "Not asked yet. Press Ask for notifications.");

    const labels = { ok: "Done", wait: "Pending", bad: "Blocked" };
    $("#status").innerHTML = rows.map((r) => `
      <li>
        <span class="badge ${r.state}">${labels[r.state]}</span>
        <span class="name">${r.name}</span>
        <span class="detail">${r.detail}</span>
      </li>`).join("");
  }

  function iosHint() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    $("#iosNote").hidden = !(ios && !standalone);
  }

  // ------------------------------------------------------------
  // Wire up
  // ------------------------------------------------------------
  function init() {
    renderProducts();
    renderCart();
    setupLogin();
    iosHint();

    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add]");
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      if (add) addToCart(add.dataset.add);
      if (inc) changeQty(inc.dataset.inc, 1);
      if (dec) changeQty(dec.dataset.dec, -1);
    });

    $("#orderBtn").addEventListener("click", placeOrder);
    $("#askBtn").addEventListener("click", askForPush);
    $("#eventBtn").addEventListener("click", () => {
      track("Test Event", { Source: "Push setup panel" });
      toast("Test event sent.");
    });

    // Initial page view event
    track("Page Viewed", { Page: "Home" });

    checkStatus();
    setInterval(checkStatus, 2000);
    watchFcmToken();
  }

  // Once notifications are allowed, fetch the FCM token. It is logged to the
  // console so you can send a test message from the Firebase console.
  let fcmDone = false;
  function watchFcmToken() {
    setInterval(async () => {
      if (fcmDone || !window.masalaFirebase || Notification.permission !== "granted") return;
      fcmDone = true;
      try {
        const token = await window.masalaFirebase.getToken();
        console.log("FCM token:", token);
        logEvent("FCM token received", { token: token.slice(0, 12) + "…" });
        window.masalaFirebase.onMessage((m) => toast(m.notification?.title || "New message"));
      } catch (err) {
        fcmDone = false;
        console.warn("FCM token failed", err);
      }
    }, 3000);
  }

  init();
})();
