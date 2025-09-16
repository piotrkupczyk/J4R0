// update-builder.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".."); // J4R0/
const REACT_DIST = path.resolve("dist", "assets");
const FRONTEND = path.join(ROOT, "frontend");
const TARGET_ASSETS = path.join(FRONTEND, "react-dist", "assets");
const BUILDER_HTML = path.join(FRONTEND, "builder.html");

// helpers
async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }
async function copyFile(src, dst){
  await ensureDir(path.dirname(dst));
  await fs.copyFile(src, dst);
}

function pickLatest(files, ext){
  // preferuje pliki index-<hash>.<ext>; jak jest kilka, bierze najnowszy alfabet.
  const re = new RegExp(`^index-.*\\.${ext}$`, "i");
  const candidates = files.filter(f => re.test(f)).sort();
  if (!candidates.length) throw new Error(`Nie znaleziono index-*.${ext} w dist/assets`);
  return candidates[candidates.length - 1];
}

(async function main(){
  // 1) wczytaj listę plików z react/dist/assets
  const files = await fs.readdir(REACT_DIST);

  // 2) wybierz najnowsze index-*.css i index-*.js
  const cssName = pickLatest(files, "css");
  const jsName  = pickLatest(files, "js");

  // 3) skopiuj wszystkie assety do frontend/react-dist/assets
  await ensureDir(TARGET_ASSETS);
  await Promise.all(
    files.map(async f => {
      await copyFile(path.join(REACT_DIST, f), path.join(TARGET_ASSETS, f));
    })
  );

  // 4) podmień linki w builder.html (tworząc backup)
  let html = await fs.readFile(BUILDER_HTML, "utf8");

  // zrób backup jednorazowo (nadpisze jeśli istnieje)
  await fs.writeFile(`${BUILDER_HTML}.bak`, html, "utf8");

  // usuń stare linki do react-dist/assets/index-*.css/js i wstaw aktualne
  const cssRe = /react-dist\/assets\/index-[A-Za-z0-9_-]+\.css/g;
  const jsRe  = /react-dist\/assets\/index-[A-Za-z0-9_-]+\.js/g;

  if (!cssRe.test(html) || !jsRe.test(html)) {
    // jeśli nie ma placeholderów – wstrzyknij pod koniec <body>
    html = html.replace(
      /<\/body>\s*<\/html>\s*$/i,
      [
        `  <link rel="stylesheet" href="react-dist/assets/${cssName}">`,
        `  <script type="module" src="react-dist/assets/${jsName}"></script>`,
        `</body></html>`
      ].join("\n")
    );
  } else {
    html = html
      .replace(cssRe, `react-dist/assets/${cssName}`)
      .replace(jsRe,  `react-dist/assets/${jsName}`);
  }

  await fs.writeFile(BUILDER_HTML, html, "utf8");

  console.log(`✔ Zaktualizowano builder.html -> ${cssName}, ${jsName}`);
  console.log(`✔ Skopiowano assets do: ${TARGET_ASSETS}`);
})().catch(err => {
  console.error("❌ update-builder failed:", err);
  process.exit(1);
});