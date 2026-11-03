/*
 * Optional sign-in, top right of the header.
 *
 * Accounts live at account.dreamteamhub.ca (the `account` Worker). Its login cookie is set on
 * .dreamteamhub.ca, so this page, and every game, sees the same signed-in player. Guests can do
 * everything except appear on leaderboards.
 */
(function () {
  "use strict";

  var API = "https://account.dreamteamhub.ca";

  // Guest identity shared with the plaza (io.dreamteamhub.ca): a random name and colour in the
  // dth_guest cookie on .dreamteamhub.ca, made on whichever site a visitor reaches first and kept
  // until they change it in the plaza. Format "<prefix>.<suffix>.<rrggbb>": the numbers pick words
  // from the plaza's name lists (it wraps them to the list lengths). Signed-in players use their
  // profile's name and skin colour instead.
  if (!/(?:^|;\s*)dth_guest=/.test(document.cookie)) {
    var hue = Math.floor(Math.random() * 360), s = 0.7, l = 0.58;
    var f = function (n) {
      var k = (n + hue / 30) % 12;
      return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    var hex = [f(0), f(8), f(4)].map(function (v) { return ("0" + Math.round(v * 255).toString(16)).slice(-2); }).join("");
    var domain = /(^|\.)dreamteamhub\.ca$/.test(location.hostname) ? "; Domain=dreamteamhub.ca" : "";
    document.cookie = "dth_guest=" + Math.floor(Math.random() * 20) + "." + Math.floor(Math.random() * 20) + "." + hex +
      "; Path=/; Max-Age=31536000; SameSite=Lax" + domain + (location.protocol === "https:" ? "; Secure" : "");
  }

  var root = document.getElementById("account");
  if (!root) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function api(path, options) {
    options = options || {};
    options.credentials = "include";
    return fetch(API + path, options).then(function (res) {
      return res.json();
    });
  }

  function renderGuest() {
    var link = el("a", "account__signin", "Sign in");
    // Google sends the player back to this exact page afterwards.
    link.href = API + "/login?return=" + encodeURIComponent(location.href);
    link.title = "Sign in with Google to appear on leaderboards";
    root.replaceChildren(link);
  }

  function renderUser(user) {
    var button = el("button", "account__name", user.name);
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");

    var panel = el("div", "account__panel");
    panel.hidden = true;
    panel.appendChild(el("p", "account__label", "Signed in as"));
    // Hover (or tap/focus) shows the account number, same as on the leaderboard: its place in
    // sign-up order, so #0 is the first account ever (account ids start at 1).
    var tip = "Player #" + (user.id - 1);
    var current = el("span", "tip", user.name);
    current.tabIndex = 0;
    current.setAttribute("data-tip", tip);
    var currentRow = el("p", "account__current");
    currentRow.append(current, el("span", "visually-hidden", " (" + tip + ")"));
    panel.appendChild(currentRow);

    // Your page on profile.dreamteamhub.ca, addressed by the same number as above. Renaming lives
    // there now.
    var profile = el("a", "account__profile", "View profile");
    profile.href = "https://profile.dreamteamhub.ca/" + (user.id - 1);
    panel.appendChild(profile);

    // A plain form, so signing out works even if the request can't be read back.
    var logout = el("form", "account__logout");
    logout.method = "post";
    logout.action = API + "/logout?return=" + encodeURIComponent(location.href);
    var out = el("button", "account__signout", "Sign out");
    out.type = "submit";
    logout.appendChild(out);
    panel.appendChild(logout);

    function setOpen(open) {
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    }

    button.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        setOpen(false);
        button.focus();
      }
    });

    root.replaceChildren(button, panel);
  }

  api("/me")
    .then(function (data) {
      if (data.user) renderUser(data.user);
      else renderGuest();
    })
    .catch(renderGuest); // account service unreachable: still offer sign-in
})();
