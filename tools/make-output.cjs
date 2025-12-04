// tools/make-output.cjs (CJS)
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("public/data_filled");
const OUT = path.join(SRC, "output.json");

const files = fs.readdirSync(SRC).filter(f => f.endsWith(".json") && f !== "output.json" && f !== "qa_issues.json");

const slidesAll = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const slides = Array.isArray(j.slides) ? j.slides : (Array.isArray(j) ? j : []);
  slidesAll.push(...slides);
}

fs.writeFileSync(OUT, JSON.stringify({ slides: slidesAll }, null, 2), "utf8");
console.log(`Built output.json → ${OUT} (slides: ${slidesAll.length})`);