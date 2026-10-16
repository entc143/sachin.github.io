// CleverTap Web SDK bootstrap.
// Loads before app.js. It queues calls until the SDK script has downloaded,
// so app.js can call clevertap.event.push(...) etc. at any time.

var clevertap = {
  event: [],
  profile: [],
  account: [],
  onUserLogin: [],
  notifications: [],
  privacy: []
};

// Account ID + region come from config.js
clevertap.account.push(
  { id: window.APP_CONFIG.CLEVERTAP_ACCOUNT_ID },
  window.APP_CONFIG.CLEVERTAP_REGION
);

// Privacy flags: set optOut to true if the visitor declines data collection.
clevertap.privacy.push({ optOut: false });
clevertap.privacy.push({ useIP: false });

(function () {
  var wzrk = document.createElement("script");
  wzrk.type = "text/javascript";
  wzrk.async = true;
  wzrk.src =
    ("https:" == document.location.protocol
      ? "https://d2r1yp2w7bby2u.cloudfront.net"
      : "http://static.clevertap.com") + "/js/clevertap.min.js";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(wzrk, s);
})();
