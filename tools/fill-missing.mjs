// tools/fill-missing.mjs (ESM)
import fs from "fs";
import path from "path";
import process from "process";

const SRC_DIR = path.resolve("public/data_normalized");   // ورودی: نرمال‌شده‌ها
const OUT_DIR = path.resolve("public/data_filled");       // خروجی: پرشده‌ها
const CACHE_FILE = path.resolve("tools/.cache/tx-cache.json");
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY; // ست کن

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(CACHE_FILE))) fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });

let CACHE = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};

const DOT_SAFE = "\u2024";
const ABBR_REGEX = /\b(e\.g\.|i\.e\.|es\.)/gi;
const splitSents = (txt) => {
  if (!txt) return [];
  let s = String(txt);
  s = s.replace(ABBR_REGEX, (m) => m.replaceAll(".", DOT_SAFE));
  return s.split(/(?<=[\.!\?؛;؟])\s+/u)
    .map((t) => t.replaceAll(DOT_SAFE, ".").trim())
    .filter(Boolean);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_SIZE = 40;
const SLEEP_MS = 120;

function key(src, from, to) {
  return `${from}::${to}::${src}`;
}

async function translateBatchGoogle(texts, source, target) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
  const body = JSON.stringify({
    q: texts.filter(Boolean),
    source,
    target,
    format: "text",
  });
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    throw new Error(`Translate network error: ${e.message}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google HTTP ${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json?.data?.translations || []).map((x) => (x?.translatedText || "").trim());
}

function postProcessFa(s) {
  let t = s;
  // ترمینولوژی پایه
  t = t.replace(/carreggiata/gi, "باند")
       .replace(/corsia/gi, "خط عبور")
       .replace(/sorpasso/gi, "سبقت")
       .replace(/retromarcia/gi, "دنده عقب");
  return t.replace(/\s+/g, " ").trim();
}

async function ensureTranslate(text, from, to) {
  if (!text) return "";
  const k = key(text, from, to);
  if (CACHE[k]) return CACHE[k];
  const [out] = await translateBatchGoogle([text], from, to);
  const v = to === "fa" ? postProcessFa(out || "") : (out || "");
  CACHE[k] = v;
  return v;
}

async function fillFile(file) {
  const srcPath = path.join(SRC_DIR, file);
  const dstPath = path.join(OUT_DIR, file);
  const raw = fs.readFileSync(srcPath, "utf8");
  const j = JSON.parse(raw);
  const slides = Array.isArray(j.slides) ? j.slides : (Array.isArray(j) ? j : []);

  if (!slides || !slides.length) {
    fs.writeFileSync(dstPath, raw, "utf8");
    return { file, slides: 0, filledFa: 0, filledEn: 0 };
  }

  // جمع‌آوری متون یکتا برای ترجمه‌ی انبوه
  const needFa_it = new Set(), needFa_en = new Set(), needEn_it = new Set();
  for (const s of slides) {
    for (const seg of (s.segments || [])) {
      const it = (seg.it || "").trim();
      const en = (seg.en || "").trim();
      const fa = (seg.fa || "").trim();
      if (it && !en) needEn_it.add(it);
      if (!fa && it) needFa_it.add(it);
      if (!fa && !it && en) needFa_en.add(en); // ایمنی
    }
  }

  async function runBatches(set, from, to, postFa = false) {
    const arr = Array.from(set);
    for (let i = 0; i < arr.length; i += BATCH_SIZE) {
      const chunk = arr.slice(i, i + BATCH_SIZE);
      const uncached = chunk.filter((t) => !CACHE[key(t, from, to)]);
      if (uncached.length) {
        const outs = await translateBatchGoogle(uncached, from, to);
        outs.forEach((v, idx) => {
          const src = uncached[idx];
          CACHE[key(src, from, to)] = postFa && to === "fa" ? postProcessFa(v || "") : (v || "");
        });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE, null, 2), "utf8");
        await sleep(SLEEP_MS);
      }
    }
  }

  // EN و FA خالی را پر کن (IT → EN/FA) و در صورت نبود IT، EN → FA
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_TRANSLATE_API_KEY missing");
  await runBatches(needEn_it, "it", "en");
  await runBatches(needFa_it, "it", "fa", true);
  await runBatches(needFa_en, "en", "fa", true);

  let filledFa = 0, filledEn = 0;

  for (const s of slides) {
    for (const seg of (s.segments || [])) {
      const it = (seg.it || "").trim();
      const en = (seg.en || "").trim();
      let fa = (seg.fa || "").trim();

      if (!en && it) {
        seg.en = await ensureTranslate(it, "it", "en");
        if (seg.en) filledEn++;
      }
      if (!fa) {
        if (it) fa = await ensureTranslate(it, "it", "fa");
        else if (en) fa = await ensureTranslate(en, "en", "fa");
        seg.fa = fa;
        if (fa) filledFa++;
      }
    }
  }

  const out = Array.isArray(j.slides) ? { ...j, slides } : slides;
  fs.writeFileSync(dstPath, JSON.stringify(out, null, 2), "utf8");
  return { file, slides: slides.length, filledFa, filledEn };
}

(async () => {
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".json"));
  let totalFa = 0, totalEn = 0, totalSlides = 0;
  for (const f of files) {
    const r = await fillFile(f);
    totalFa += r.filledFa; totalEn += r.filledEn; totalSlides += r.slides;
    console.log(`✔ ${f} — slides:${r.slides} | +FA:${r.filledFa} +EN:${r.filledEn}`);
  }
  console.log(`\n✅ Done → ${OUT_DIR}\nFilled totals: FA=${totalFa}, EN=${totalEn} (slides=${totalSlides})`);
})();