// extract.js
const fs = require("fs");

// مسیر فایل JSON رو درست بده
const p = "public/data/1 - Definizioni generali e doveri nell'uso della strada.json";

const j = JSON.parse(fs.readFileSync(p, "utf8"));

const s = (j.slides || []).find(
  (x) => x.title_it && x.title_it.includes("ESEMPIO DI USO DI CORSIE E CARREGGIATE: STRADA A 3 CARREGGIATE E 8 CORSIE")
);

if (!s) {
  console.error("Slide not found");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      title_it: s.title_it,
      segments: s.segments.map((o, i) => ({
        i,
        kind: o.kind,
        it: o.it,
        en: o.en,
        fa: o.fa,
      })),
    },
    null,
    2
  )
);