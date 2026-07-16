(function () {
  "use scrict";

  // 1. Locate the script + resolve app_id
  var me = document.currentScript;
  if (!me) {
    var ss = document.getElementsByTagName("script");
    me = ss[ss.length - 1];
  }
  var src = new URL(me.src);
  var base = src.origin; // Next Js App Domain (iframe + proxy) lives.
  var frameOrigin = base;

  var settings = window.MyChatSettings || {};
  var appId =
    src.searchParams.get("app_id") ||
    me.getAttribute("data-app-id") ||
    settings.app_id;

  if (!appId) {
    console.error(
      "[MyChat] app_id is misisng - pass it via ?app_id=.. on the script src, " +
        `a data-app-id=".." attribute, or window.MyChatSettings.app_id`,
    );
    return;
  }

  if (window._myChatLoaded) return;
  window._myChatLoaded = true;
  // Mirror convex widget defaults; Used until config resolves
  var cfg = {
    buttonColor: "#4F46E5",
    cornerRadius: 16,
    title: "Chat with us",
    logoUrl: null,
    position: "bottom-right",
    bottomMargin: 20,
    sideMargin: 20,
    notificationSound: true,
  };

  var open = false;
  var userGestured = false; // autoplay gate - sound only after a real gesture.
  var unread = 0;
  var proactiveTimer = null;

  // Create a Shadow Root Tree to style separately from the Host-Page CSS
  var host = document.createElement("div");
  host.setAttribute("data-mychat", "");
  host.style.cssText = "all:initial";
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  // Styling to live inside the shadow element - We will add styles further ahead
  var styleEl = document.createElement("style");
  root.appendChild(styleEl);

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open Chat");
  bubble.type = "button";
  bubble.innerHTML =
    `<span class="mc-ico">` +
    chatIconSvg() +
    "</span>" +
    `<span class="mc-badge" hidden>0</span>`;

  // Injecting HTML Web Page to the frame
  // The shadow frame is controlled by the state of "open"
  // If false: Will not show || If true: Will display
  var frame = document.createElement("iframe");
  frame.title = "Chat";
  frame.setAttribute("allow", "autoplay; clipboard-write");
  frame.src = base + "/widget?app_id=" + encodeURIComponent(appId);

  root.appendChild(frame);
  root.appendChild(bubble);

  // Audio notifications

  paint();
  fetch(base + "/widget-config?app_id=" + encodeURIComponent(appId), {
    credentials: "omit",
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data && typeof data === "object") {
        cfg.buttonColor = data.buttonColor || cfg.buttonColor;
        cfg.cornerRadius =
          typeof data.cornerRadius === "number"
            ? data.cornerRadius
            : cfg.cornerRadius;
        cfg.title = data.title || cfg.title;
        cfg.logoUrl = data.logoUrl || null;
        cfg.position = data.position || cfg.position;
        cfg.bottomMargin =
          typeof data.bottomMargin === "number"
            ? data.bottomMargin
            : cfg.bottomMargin;
        cfg.sideMargin =
          typeof data.sideMargin === "number"
            ? data.sideMargin
            : cfg.sideMargin;
        cfg.notificationSound = data.notificationSound !== false;
      }
      paint();
    })
    .catch(function () {
      /* cosmetic only — keep defaults */
    });

  function paint() {
    var sideProp = cfg.position === "bottom-left" ? "left" : "right";
    var otherSide = cfg.position === "bottom-left" ? "right" : "left";
    var bubbleSize = 56;
    var gap = 16;

    // If a logo is configured, show it inside the launcher when collapsed.
    if (cfg.logoUrl && !open) {
      bubble.querySelector(".mc-ico").innerHTML =
        '<img src="' + escapeAttr(cfg.logoUrl) + '" alt="" />';
    }

    styleEl.textContent =
      ":host{ all: initial; }" +
      ".mc-launcher,iframe{ position: fixed; z-index: 2147483000; }" +
      "button{ box-sizing: border-box; }" +
      // launcher bubble
      ".mc-launcher{}" +
      "button[aria-label]{" +
      "  position: fixed;" +
      "  bottom: " +
      cfg.bottomMargin +
      "px;" +
      "  " +
      sideProp +
      ": " +
      cfg.sideMargin +
      "px;" +
      "  " +
      otherSide +
      ": auto;" +
      "  width: " +
      bubbleSize +
      "px; height: " +
      bubbleSize +
      "px;" +
      "  border: none; border-radius: 9999px; cursor: pointer;" +
      "  background: " +
      cfg.buttonColor +
      "; color: #fff;" +
      "  display: flex; align-items: center; justify-content: center;" +
      "  box-shadow: 0 6px 20px rgba(0,0,0,.18); z-index: 2147483000;" +
      "  transition: transform .15s ease, box-shadow .15s ease;" +
      "  font-family: ui-sans-serif, system-ui, sans-serif;" +
      "}" +
      "button[aria-label]:hover{ transform: scale(1.05); box-shadow: 0 8px 26px rgba(0,0,0,.24); }" +
      ".mc-ico{ display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; }" +
      ".mc-ico svg{ width: 26px; height: 26px; }" +
      ".mc-ico img{ width: 30px; height: 30px; border-radius: 8px; object-fit: cover; }" +
      // unread badge
      ".mc-badge{" +
      "  position: absolute; top: -2px; " +
      sideProp +
      ": -2px;" +
      "  min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9999px;" +
      "  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;" +
      "  line-height: 18px; text-align: center; border: 2px solid #fff;" +
      "  font-family: ui-sans-serif, system-ui, sans-serif;" +
      "}" +
      // iframe panel
      "iframe{" +
      "  bottom: " +
      (cfg.bottomMargin + bubbleSize + gap) +
      "px;" +
      "  " +
      sideProp +
      ": " +
      cfg.sideMargin +
      "px;" +
      "  " +
      otherSide +
      ": auto;" +
      "  width: 440px; height: 720px;" +
      "  max-width: calc(100vw - " +
      cfg.sideMargin * 2 +
      "px);" +
      "  max-height: calc(100vh - " +
      (cfg.bottomMargin + bubbleSize + gap + 24) +
      "px);" +
      "  border: none; border-radius: " +
      Math.max(cfg.cornerRadius, 12) +
      "px;" +
      "  box-shadow: 0 12px 48px rgba(0,0,0,.22); background: #fff;" +
      "  display: " +
      (open ? "block" : "none") +
      ";" +
      "  overflow: hidden;" +
      "}" +
      "@media (max-width: 480px){" +
      "  iframe{ width: calc(100vw - 24px); height: calc(100dvh - 24px);" +
      "    bottom: 12px; " +
      sideProp +
      ": 12px; max-height: none; }" +
      "}";

    // Toggle launcher icon between logo/chat (collapsed) and close (expanded).
    bubble.querySelector(".mc-ico").innerHTML = open
      ? closeIconSvg()
      : cfg.logoUrl
        ? '<img src="' + escapeAttr(cfg.logoUrl) + '" alt="" />'
        : chatIconSvg();
  }

  function setOpen(v) {
    open = v;
    bubble.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    if (open) {
      undread = 0;
      renderBadge();
      // Cancel proactive nudge once visitor engages
      if (proactiveTimer) {
        clearTimeout(proactiveTimer);
        proactiveTimer = null;
      }
    }
    // Paint observes the "Open" variable to make changes to the styling
    // This re-renders on every click
    paint();
  }

  bubble.addEventListener("click", function () {
    userGestured = true;
    setOpen(!open);
  });

  // Any first gesture anywhere on the host page also unlocks audio
  window.addEventListener(
    "pointerdown",
    function () {
      userGestured = true;
    },
    { once: true, capture: true },
  );

  function renderBadge() {
    var badge = bubble.querySelector(".mc-badge");
    if (unread > 0) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function mount() {
    document.body.appendChild(host);
  }

  if (document.body) mount();

  function chatIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }
  function closeIconSvg() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }
  function escapeAttr(s) {
    ``;
    return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
})();
