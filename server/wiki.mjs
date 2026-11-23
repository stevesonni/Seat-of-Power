/* The public guide at /wiki on our site (owner, 23 Nov 2026: "see how they did their how to play… build all").
   The same content as the in-game guide (game/systems/guide.js), as plain pages that can be linked, shared and
   found: /wiki, /wiki/<topic>, /wiki/how-to, /wiki/glossary and /wiki/search?q=. "Was this helpful?" posts to
   /api/guide-vote. */
import { QUICK, TOPICS, HOWTO, glossaryList, searchGuide, topicById, GUIDE_UPDATED } from "../game/systems/guide.js";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const CSS = `:root{--ink:#13261c;--sub:#4f5d55;--line:#e3dccd;--bg:#f6f2ea;--card:#fff;--green:#0f3d2a;--accent:#1f7a46;--gold:#c9a227}
@media (prefers-color-scheme:dark){:root{--ink:#eef2ee;--sub:#b8c4bc;--line:#2b3a32;--bg:#0e1612;--card:#16211b;--green:#0b2e1f;--accent:#5fd08f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}header{background:var(--green);color:#fff}header .in{max-width:900px;margin:0 auto;padding:14px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
header a.brand{color:#fff;text-decoration:none;font-weight:800;font-size:18px;flex:1;min-width:180px}header a.play{background:var(--gold);color:#141a33;text-decoration:none;font-weight:800;border-radius:999px;padding:8px 18px}
form.s{max-width:900px;margin:0 auto;padding:0 16px 14px}form.s input{width:100%;min-height:46px;border-radius:999px;border:0;padding:0 18px;font-size:16px}
main{max-width:900px;margin:0 auto;padding:20px 16px 40px}h1{font-size:30px;line-height:1.2;margin:0 0 6px}h2{font-size:22px;margin:26px 0 10px}h3{font-size:19px;margin:18px 0 4px}
.lead{color:var(--sub);margin:0 0 18px}.steps{list-style:none;padding:0;margin:0 0 12px;display:grid;gap:8px}.steps li{display:flex;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px}
.n{min-width:32px;height:32px;border-radius:16px;background:var(--green);color:#fff;display:grid;place-items:center;font-weight:800}.steps b{display:block}.steps span{color:var(--sub);font-size:15px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;text-decoration:none;color:var(--ink)}
.card b{display:block;font-size:18px}.card span{color:var(--sub);font-size:15px}p,li{color:var(--sub)}ul{padding-left:22px}
details{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 16px;margin-bottom:8px}summary{font-weight:800;cursor:pointer;color:var(--ink)}
.g{padding:10px 0;border-bottom:1px solid var(--line)}.g b{color:var(--ink)}.g small{color:var(--sub)}.crumb{font-size:15px;margin-bottom:10px;display:block}
.help{text-align:center;border-top:1px solid var(--line);margin-top:28px;padding-top:16px}.help button{min-height:42px;padding:6px 18px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-weight:700;font-size:15px;margin:4px;cursor:pointer}
footer{max-width:900px;margin:0 auto;padding:0 16px 40px;color:var(--sub);font-size:14px}footer nav a{margin-right:14px}`;

const layout = (title, desc, body, page) => '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '">'
  + '<link rel="icon" href="/art/icons/icon-office-governor.webp"><style>' + CSS + '</style></head><body>'
  + '<header><div class="in"><a class="brand" href="/wiki">📘 Seat of Power · The guide</a><a class="play" href="/play">Play</a></div>'
  + '<form class="s" action="/wiki/search" method="get" role="search"><input name="q" placeholder="🔎 Search the guide" aria-label="Search the guide"></form></header>'
  + '<main>' + body
  + '<div class="help" data-page="' + esc(page) + '"><div>Was this helpful?</div><button data-yes="1">👍🏾 Yes</button><button data-yes="0">👎🏾 Not really</button>'
  + '<div style="font-size:14px;margin-top:10px">Last updated ' + esc(GUIDE_UPDATED) + '</div></div></main>'
  + '<footer><nav>' + TOPICS.map(t => '<a href="/wiki/' + t.id + '">' + esc(t.t) + '</a>').join("") + '<a href="/wiki/how-to">How to…</a><a href="/wiki/glossary">Glossary</a></nav>'
  + '<p>Seat of Power, a game by Steve Sunny Emmanuel. Based on the 1999 Constitution (as amended). People and parties are fictional; Nigerian states and institutions are real. Game money can\'t be cashed out.</p></footer>'
  + '<script>document.querySelectorAll(".help button").forEach(function(b){b.onclick=function(){var h=b.parentNode;fetch("/api/guide-vote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:h.getAttribute("data-page"),yes:b.getAttribute("data-yes")==="1"})}).catch(function(){});h.innerHTML="<div>Thank you. We read every vote.</div>";};});</script>'
  + '</body></html>';

const section = (x) => '<h3>' + esc(x.h) + '</h3>' + (x.p ? '<p>' + esc(x.p) + '</p>' : '') + (x.l ? '<ul>' + x.l.map(y => '<li>' + esc(y) + '</li>').join("") + '</ul>' : '');

const home = () => layout("Seat of Power: how to play", "The official guide to Seat of Power, the Nigerian politics game: win the election, pass the budget, govern, and run for President.",
  '<h1>Govern a Nigerian state</h1><p class="lead">The official guide to Seat of Power: how everything works, from your first campaign to Aso Rock.</p>'
  + '<h2>How to play in 5 minutes</h2><ol class="steps">' + QUICK.map((x, i) => '<li><div class="n">' + (i + 1) + '</div><div><b>' + x.icon + ' ' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></div></li>').join("") + '</ol>'
  + '<p>Stuck on something? <a href="/wiki/how-to">How to… ' + HOWTO.length + ' quick answers</a>, from winning the election to the Supreme Court.</p>'
  + '<h2>Explore the guide</h2><div class="grid">' + TOPICS.map(t => '<a class="card" href="/wiki/' + t.id + '"><b>' + t.icon + ' ' + esc(t.t) + '</b><span>' + esc(t.d) + '</span></a>').join("")
  + '<a class="card" href="/wiki/glossary"><b>📖 Glossary</b><span>Government words and Nigerian words, in plain English.</span></a></div>', "home");

const topic = (T) => layout(T.t + " · Seat of Power guide", T.d,
  '<a class="crumb" href="/wiki">← The guide</a><h1>' + T.icon + ' ' + esc(T.t) + '</h1><p class="lead">' + esc(T.d) + '</p>' + T.s.map(section).join("")
  + (() => { const qs = HOWTO.filter(h => h.topic === T.id); return qs.length ? '<h2>Quick answers</h2>' + qs.map(h => '<details><summary>' + esc(h.q) + '</summary><p>' + esc(h.a) + '</p></details>').join("") : ""; })(), T.id);

const howto = () => layout("How to… " + HOWTO.length + " quick answers · Seat of Power guide", "Quick answers to the questions players ask most in Seat of Power.",
  '<a class="crumb" href="/wiki">← The guide</a><h1>🙋🏾 How to… ' + HOWTO.length + ' quick answers</h1><p class="lead">From winning the election to the Supreme Court.</p>'
  + HOWTO.map(h => '<details><summary>' + esc(h.q) + '</summary><p>' + esc(h.a) + (h.topic !== "glossary" ? ' <a href="/wiki/' + h.topic + '">More in ' + esc((topicById(h.topic) || {}).t) + ' →</a>' : ' <a href="/wiki/glossary">Open the glossary →</a>') + '</p></details>').join(""), "howto");

const glossary = () => layout("Glossary · Seat of Power guide", "Nigerian government words, in plain English: FAAC, IGR, the Appropriation Bill, impeachment and more.",
  '<a class="crumb" href="/wiki">← The guide</a><h1>📖 Glossary</h1><p class="lead">Government words and Nigerian words, in plain English.</p>'
  + glossaryList().map(g => '<div class="g"><b>' + esc(g.w) + '</b> <small>· ' + esc(g.full) + '</small><div>' + esc(g.mean) + '</div></div>').join(""), "glossary");

const search = (q) => { const R = searchGuide(q);
  return layout("Search: " + q + " · Seat of Power guide", "Search the Seat of Power guide.",
    '<a class="crumb" href="/wiki">← The guide</a><h1>Search</h1><p class="lead">' + (q.trim() ? (R.length ? R.length + " result" + (R.length > 1 ? "s" : "") + " for “" + esc(q) + "”" : "Nothing found for “" + esc(q) + "”. Try a shorter word.") : "Type a word: budget, FAAC, impeachment, stalled…") + '</p>'
    + R.map(r => '<a class="card" style="margin-bottom:8px" href="' + (r.kind === "glossary" ? "/wiki/glossary" : r.kind === "howto" ? "/wiki/how-to" : "/wiki/" + r.topic) + '"><b>' + esc(r.title) + '</b><span>' + esc(r.text.length > 160 ? r.text.slice(0, 158) + "…" : r.text) + '</span></a>').join(""), "search"); };

/* The page for a path, or null when it is not a guide page. */
export const wikiPage = (pathname, searchParams) => {
  const p = String(pathname).replace(/\/+$/, "") || "/";
  if (p === "/wiki") return home();
  if (p === "/wiki/how-to") return howto();
  if (p === "/wiki/glossary") return glossary();
  if (p === "/wiki/search") return search(String((searchParams && searchParams.get("q")) || "").slice(0, 80));
  const m = p.match(/^\/wiki\/([a-z-]{2,30})$/); if (m) { const T = topicById(m[1]); return T ? topic(T) : null; }
  return null;
};
export const WIKI_PAGES = ["home", "howto", "glossary", "search", ...TOPICS.map(t => t.id)];
