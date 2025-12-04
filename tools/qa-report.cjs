// tools/qa-report.cjs (CJS)
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("public/data_filled");
const files = fs.readdirSync(SRC).filter(f => f.endsWith(".json"));

let totalSegs = 0, missFA = 0, missEN = 0;
const issues = [];

for (const f of files) {
  const p = path.join(SRC, f);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const slides = Array.isArray(j.slides) ? j.slides : (Array.isArray(j) ? j : []);
  for (const s of slides) {
    for (const seg of (s.segments || [])) {
      totalSegs++;
      const it = (seg.it || "").trim();
      const en = (seg.en || "").trim();
      const fa = (seg.fa || "").trim();
      if (!en) { missEN++; issues.push({ file: f, title: s.title_it || s.title, it }); }
      if (!fa) { missFA++; issues.push({ file: f, title: s.title_it || s.title, it }); }
    }
  }
}

console.log(`Segments: ${totalSegs}`);
console.log(`Missing EN: ${missEN}`);
console.log(`Missing FA: ${missFA}`);
console.log(`Coverage EN: ${(((totalSegs - missEN)/Math.max(totalSegs,1))*100).toFixed(2)}% | FA: ${(((totalSegs - missFA)/Math.max(totalSegs,1))*100).toFixed(2)}%`);

fs.writeFileSync(path.join(SRC, "qa_issues.json"), JSON.stringify(issues, null, 2), "utf8");
console.log(`QA written → ${path.join(SRC, "qa_issues.json")}`);