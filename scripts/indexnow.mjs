// Tells Bing (and the other IndexNow search engines: Yandex, Naver, Seznam, Yep) that pages have
// changed, so they recrawl them soon instead of whenever they next get round to it.
// Google and Safari don't use IndexNow.
//
//   node scripts/indexnow.mjs                      every site's home page (see SITES)
//   node scripts/indexnow.mjs <url> [<url> ...]    just these pages
//   node scripts/indexnow.mjs --dry-run [...]      show what would be sent, send nothing
//
// Only submit pages that actually changed: resubmitting unchanged pages gets ignored and can get
// the site's submissions throttled.
//
// IndexNow takes one host per request, so URLs are grouped by host. Each host serves the key at
// /<KEY>.txt (a file in each site's public folder; the prairietycoon proxy Worker answers it in
// code). The key is public on purpose: it only proves the URLs are on a site we control.
// To change it: make a new key, replace every <KEY>.txt file and the KEY below, then deploy.

const KEY = "c75ce44647b970c654a57892aa7e12b2";
const ENDPOINT = "https://api.indexnow.org/indexnow";

// Every site that serves the key file.
const SITES = [
  "https://dreamteamhub.ca/",
  "https://plaza.dreamteamhub.ca/",
  "https://leaderboard.dreamteamhub.ca/",
  "https://profile.dreamteamhub.ca/",
  "https://bomberman.dreamteamhub.ca/",
  "https://canyourpet.dreamteamhub.ca/",
  "https://tanks.dreamteamhub.ca/",
  "https://tsumego.dreamteamhub.ca/",
  "https://flappyduel.dreamteamhub.ca/",
  "https://mahjongmania.dreamteamhub.ca/",
  "https://blobsoccer.dreamteamhub.ca/",
  "https://mineduel.dreamteamhub.ca/",
  "https://prairietycoon.dreamteamhub.ca/",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const urls = args.filter((a) => a !== "--dry-run");

const byHost = new Map();
for (const raw of urls.length ? urls : SITES) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    console.error(`Not a URL: ${raw}`);
    process.exit(1);
  }
  if (url.protocol !== "https:" || !(url.hostname === "dreamteamhub.ca" || url.hostname.endsWith(".dreamteamhub.ca"))) {
    console.error(`Not one of our sites: ${raw}`);
    process.exit(1);
  }
  if (!byHost.has(url.hostname)) byHost.set(url.hostname, []);
  byHost.get(url.hostname).push(url.href);
}

let failed = false;
for (const [host, urlList] of byHost) {
  const keyLocation = `https://${host}/${KEY}.txt`;
  if (dryRun) {
    console.log(`${host}: would submit ${urlList.length} URL(s)`, urlList);
    continue;
  }
  // Check the key file is live first: without it the submission is refused (403).
  const check = await fetch(keyLocation).then((r) => r.text().then((t) => r.ok && t.trim() === KEY)).catch(() => false);
  if (!check) {
    console.error(`${host}: key file isn't live at ${keyLocation} (deploy or push that site first); skipped`);
    failed = true;
    continue;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
  });
  // 200 OK and 202 Accepted both mean it was taken (202: key still being checked).
  const ok = res.status === 200 || res.status === 202;
  console.log(`${host}: ${res.status} ${ok ? "accepted" : await res.text()} (${urlList.length} URL(s))`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
