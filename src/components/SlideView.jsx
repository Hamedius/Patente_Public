import React, { useMemo, useState, useEffect } from 'react';

/**
 * SlideView (نمایش محتوای یک اسلاید)
 * فقط صفحه «اسلایدها» را تحت‌تأثیر می‌گذارد.
 *
 * slide = {
 *   title_it?, title_fa?,
 *   highlight_terms_it?: string[],
 *   segments?: Array<{ it: string, fa?: string, en?: string }>
 * }
 *
 * props:
 *  - lang: 'fa' | 'en' (زبان ترجمه)
 *  - highlight: boolean
 *  - showTranslation: boolean
 *  - hideHeader?: boolean
 */
// --- robust image source resolver with fallback (prefer folder → then src → then dataurl)
const buildImageCandidates = (s) => {
  const list = [];
  if (!s) return list;

  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? String(import.meta.env.BASE_URL) : '/';

  const rawId = s.id && String(s.id).trim();
  if (rawId) {
    const ids = Array.from(new Set([
      rawId,
      rawId.toUpperCase(),
      rawId.toLowerCase(),
    ]));
    // Priority: jpg, jpeg, png, webp, avif (lowercase first)
    const exts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'JPG', 'JPEG', 'PNG', 'WEBP', 'AVIF'];
    for (const id of ids) {
      for (const ext of exts) {
        // relative to site root
        list.push(`/images/${id}.${ext}`);
        // respect vite base if set
        list.push(`${base.replace(/\/+$/,'')}/images/${id}.${ext}`);
      }
    }
  }

  // then explicit src if present
  const x = s.sign_image_src && String(s.sign_image_src).trim();
  if (x) list.push(x);

  // finally embedded dataurl
  const d = s.sign_image_dataurl && String(s.sign_image_dataurl).trim();
  if (d) list.push(d);

  // dedupe while preserving order
  const seen = new Set(); const out = [];
  for (const u of list) { const k = String(u); if (seen.has(k)) continue; seen.add(k); out.push(k); }
  return out;
};

export default function SlideView({
  slide = {},
  lang = 'fa',
  highlight = true,
  showTranslation = false,
  hideHeader = false,
}) {
  const title = slide.title_it || '';
  const subFa = slide.title_fa || '';
  const terms = Array.isArray(slide.highlight_terms_it) ? slide.highlight_terms_it : [];
  const segments = Array.isArray(slide.segments) ? slide.segments : [];

  const items = segments.filter((s) => (s?.it || s?.fa || s?.en || '').toString().trim().length);

  const imageCandidates = useMemo(() => buildImageCandidates(slide), [slide]);
  const [imgIdx, setImgIdx] = useState(0);
  const imageSrc = imageCandidates[imgIdx] || null;
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    // reset image fallback state when slide changes
    setImgIdx(0);
    setImgFailed(false);
  }, [slide]);

  // Always start each slide from top when it opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [slide && (slide.id || slide.title_it || slide.title_en || slide.title_fa)]);


// Always start each slide from top when it opens
useEffect(() => {
  if (typeof window !== 'undefined') {
    // jump to top without animation
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}, [slide && (slide.id || slide.title_it || slide.title_en || slide.title_fa)]);

  // sentence splitter (shared) — پشتیبانی از «.) ␠» هم اضافه شد
  // در دو موقعیت می‌بُرد: (1) بعد از . ! ? ؛ ; ؟ و فاصله، (2) بعد از . ! ? ؛ ; ؟ + ) و بعدش فاصله
  const SEP_SENT = /(?:(?<=[\.!\?؛;؟]\))(?=\s+)|(?<=[\.!\?؛;؟])(?=\s+))/u; // صفر-طول؛ چیزی حذف نمی‌کند
  const splitSents = (txt) => {
    if (!txt) return [];
    let s = String(txt);
    // از مخفف‌ها محافظت کن تا اشتباه شکسته نشوند (e.g., i.e., es.)
    s = s.replace(/\b(e\.g\.|i\.e\.|es\.)/gi, (m) => m.replaceAll('.', '\u2024'));
    return s
      .split(SEP_SENT)
      .map((x) => x.replaceAll('\u2024', '.').trim())
      .filter(Boolean);
  };

  // bullet detector usable before render map
  const isBulletIdx = (idx) => {
    const it = (items[idx]?.it || '').trim();
    const prevColon = idx > 0 && typeof items[idx - 1]?.it === 'string' && items[idx - 1].it.trim().endsWith(':');
    return (
      items[idx]?.kind === 'li' ||
      items[idx]?.kind === 'bullet' ||
      /^[\-\u2022\u00B7]/.test(it) ||
      prevColon
    );
  };

  // --- Borrow EN-only trailing bullet parts into the previous bullet ---
  // For JSONs where a long Italian bullet is split, the extra EN sentences may
  // be put in following "bullet" items with empty `it`. We attach those EN parts
  // to the nearest previous bullet that *does* have Italian text.
  const extraEnFor = Array.from({ length: items.length }, () => []);
  const consumedEn = Array.from({ length: items.length }, () => false);

  for (let i = 0; i < items.length; i++) {
    const itHasText = typeof items[i]?.it === 'string' && items[i].it.trim().length > 0;
    const isBulletHere = isBulletIdx(i);

    if (!itHasText) continue;             // only start from an item that *has* Italian
    if (!isBulletHere) continue;          // only do this for bullets

    // Walk forward and collect EN-only bullet rows until we hit the next bullet with Italian text.
    let j = i + 1;
    while (j < items.length) {
      const nxt = items[j] || {};
      const nxtIt = (nxt.it || '').trim();
      const nxtIsBullet = isBulletIdx(j);

      if (!nxtIsBullet) break;            // stop at a non-bullet row
      if (nxtIt) break;                   // stop when we reach the next bullet that has Italian

      // This is an EN-only bullet row – collect its EN sentences and mark consumed.
      const enStr = (nxt.en || nxt.en_us || nxt.english || nxt.en_text || '').trim();
      if (enStr) {
        const parts = splitSents(enStr);
        if (parts.length) extraEnFor[i].push(...parts);
      }
      consumedEn[j] = true;               // prevent rendering this row on its own
      j++;
    }
  }

  // --- Borrow EN-only trailing paragraph parts into the previous paragraph (non-bullet) ---
  // Some slides pack Italian into a long paragraph and place its EN parts in following rows with empty `it`.
  // Attach those EN parts to the nearest previous non-bullet item that *does* have Italian text.
  const extraEnParaFor = Array.from({ length: items.length }, () => []);
  for (let i = 0; i < items.length; i++) {
    const itHasText = typeof items[i]?.it === 'string' && items[i].it.trim().length > 0;
    if (!itHasText) continue;
    if (isBulletIdx(i)) continue; // only paragraphs here

    let j = i + 1;
    while (j < items.length) {
      const nxt = items[j] || {};
      const nxtIt = (nxt.it || '').trim();
      if (nxtIt) break;              // stop when we reach next item with Italian text
      if (isBulletIdx(j)) break;     // stop when bullets begin

      const enStr = (nxt.en || nxt.en_us || nxt.english || nxt.en_text || '').trim();
      if (enStr) {
        const parts = splitSents(enStr);
        if (parts.length) extraEnParaFor[i].push(...parts);
      }
      consumedEn[j] = true;          // suppress rendering of this EN-only row
      j++;
    }
  }

  // هر آیتم فقط ترجمهٔ EN خودش را استفاده می‌کند (borrow لغو شد)
  const borrowEN = {};
  // `consumedEn` is now created above during EN borrowing for bullets.

  // اگر ترجمه فارسی یکجا آمده و آیتم‌های بعدی fa خالی دارند، جمله‌ها را توزیع می‌کنیم (greedy)
  const distFa = Array.from({ length: items.length }, () => '');
  if (lang === 'fa' && showTranslation) {
    // fa فعلی هر آیتم (trim شده)
    const faInit = items.map((s) => (s?.fa || '').trim());

    // helper: تشخیص نوع بولت برای هر آیتم (مطابق منطق رندر)
    const isBulletAt = (idx) => {
      const it = (items[idx]?.it || '').trim();
      const prevColon = idx > 0 && typeof items[idx - 1]?.it === 'string' && items[idx - 1].it.trim().endsWith(':');
      return (
        items[idx]?.kind === 'li' ||
        items[idx]?.kind === 'bullet' ||
        /^[\-\u2022\u00B7]/.test(it) ||
        prevColon
      );
    };

    // همهٔ آیتم‌هایی که fa چند جمله‌ای دارند را پیدا و توزیع کن (multi-pack)
    const packedIndices = [];
    // از همون منطق مشترک استفاده کن تا «.) ␠» هم درست قطع شود
    const splitFaAt = (txt) => splitSents(txt);
    for (let i = 0; i < faInit.length; i++) {
      const parts = splitFaAt(faInit[i]);
      if (parts.length > 1) packedIndices.push([i, parts]);
    }

    // ابتدا مقادیر fa موجود را که تک‌جمله‌ای هستند کپی کن
    for (let i = 0; i < faInit.length; i++) {
      if (!distFa[i] && faInit[i]) {
        const one = splitFaAt(faInit[i]);
        if (one.length <= 1) distFa[i] = faInit[i];
      }
    }

    // برای هر آیتم چند جمله‌ای، جمله‌ها را روی اسلات‌های هم‌نوع و خالی پخش کن
    for (const [iPacked, parts] of packedIndices) {
      // جملهٔ اول در خود iPacked
      distFa[iPacked] = parts[0];

      const packedKindIsBullet = isBulletAt(iPacked);
      let j = iPacked + 1;
      let lastAssigned = iPacked;
      for (let p = 1; p < parts.length; p++) {
        // بگرد تا اسلاتی که هم خالی باشد (distFa و faInit هر دو خالی) و هم هم‌نوع
        while (
          j < faInit.length && (
            distFa[j] || faInit[j] || isBulletAt(j) !== packedKindIsBullet
          )
        ) j++;

        if (j >= faInit.length) {
          // جا نداریم؛ به آخرین اسلات تخصیص‌داده‌شده بچسبان
          distFa[lastAssigned] = (distFa[lastAssigned] ? distFa[lastAssigned] + ' ' : '') + parts[p];
          continue;
        }
        distFa[j] = parts[p];
        lastAssigned = j;
        j++;
      }
    }

    // در نهایت هرجا distFa هنوز خالی است و faInit یک‌جمله‌ای داریم، همان را کپی کن
    for (let i = 0; i < faInit.length; i++) {
      if (!distFa[i] && faInit[i]) {
        const one = splitFaAt(faInit[i]);
        if (one.length <= 1) distFa[i] = faInit[i];
      }
    }
  }
  // هایلایت واژه‌ها روی متن ایتالیایی
  const htmlIt = (txt) => {
    const safe = escapeHTML(txt || '');
    if (!highlight || !terms.length) return safe;
    const sorted = [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
    let out = safe;
    for (const raw of sorted) {
      const t = raw.trim();
      if (!t) continue;
      const re = new RegExp(escapeRegExp(t), 'gi');
      out = out.replace(re, (m) => `<span class="hl-it">${m}</span>`);
    }
    return out;
  };

  if (typeof window !== 'undefined' && imageSrc) {
    // Lightweight debug to help verify which src is used
    console.debug('[SlideView] image candidates:', { id: slide?.id, using: imageSrc, count: imageCandidates.length });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!hideHeader && (
        <>
          {title ? <h2 className="text-2xl font-semibold text-center mt-6 mb-1">{title}</h2> : null}
          {subFa ? <div className="text-center text-gray-500 mb-6">{subFa}</div> : null}
        </>
      )}

      {!imgFailed && imageCandidates.length > 0 && imageSrc && (
        <div className="max-w-3xl mx-auto my-4">
          <img
            src={imageSrc}
            alt={slide.title_it || slide.title_en || slide.title_fa || slide.id || 'slide image'}
            className="h-auto rounded-md border border-gray-200"
            style={{ width: '30%', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (imgIdx + 1 < imageCandidates.length) {
                console.warn('Image failed, trying next candidate:', imageSrc);
                setImgIdx(imgIdx + 1);
              } else {
                console.warn('All image candidates failed for slide id:', slide?.id, imageCandidates);
                setImgFailed(true); // hide image block entirely for slides without a valid image
              }
            }}
          />
        </div>
      )}

      {/* هر آیتم: متن ایتالیایی، سپس ترجمه همان آیتم زیرش */}
      <div className="space-y-4">
        {items.map((seg, i) => {
          const itText = seg.it || '';
          const trimmed = itText.trim();
          const hasIt = trimmed.length > 0;
          if (!hasIt && consumedEn[i]) {
            // This row's EN was attached to a previous bullet – do not render it.
            return null;
          }

          // sentence splitter (Italian/FA/EN)
          // const splitSents = (txt) => (txt ? txt.split(/(?<=[\.!\?؟؛])\s+/u).map(s => s.trim()).filter(Boolean) : []);
          const itSentsArr = splitSents(trimmed.replace(/^[\-\u2022\u00B7]\s*/, ''));
          const faSentsArr = splitSents(pickNonEmpty(seg.fa, seg.fa_ir, seg.faIR, seg.persian, seg.fa_text));
          const enSentsArr = splitSents(pickNonEmpty(seg.en, seg.en_us, seg.english, seg.en_text));

          // آیا آیتم قبلی با دو‌نقطه تمام شده؟ (مثل "Comprende:")
          const prevEndsWithColon =
            i > 0 && typeof items[i - 1]?.it === 'string' && items[i - 1].it.trim().endsWith(':');

          // تشخیص بولت (li | bullet | شروع با '-', '•', '·' | بعد از آیتمی که با ':' ختم شده)
          const detectedBullet =
            seg.kind === 'li' ||
            seg.kind === 'bullet' ||
            /^[\-\u2022\u00B7]/.test(trimmed) ||
            prevEndsWithColon;

          // فقط وقتی بولت بکش که متن ایتالیایی واقعاً وجود داشته باشد
          const isBullet = detectedBullet && hasIt;

          return (
            <div key={`row-${i}`} className="mb-2">
              {/* ایتالیایی؛ فقط اگر متن دارد */}
              {hasIt && (
                isBullet ? (
                  (() => {
                    // interleave Italian sentence + its translation card
                    const arrFA = faSentsArr;
                    const arrEN = enSentsArr.concat(extraEnFor[i] || []);

                    const itArray = itSentsArr.length
                      ? itSentsArr
                      : [trimmed.replace(/^[\-\u2022\u00B7]\s*/, '')];

                    return (
                      <>
                        <ul className="it-text list-disc pl-6">
                          <li>
                            {itArray.map((s, idx) => (
                              <div
                                key={`it-${i}-${idx}`}
                                className={idx === 0 ? '' : 'mt-1'}
                                dangerouslySetInnerHTML={{ __html: htmlIt(s) }}
                              />
                            ))}
                          </li>
                        </ul>

                        {showTranslation && (() => {
                          const rawFa = (pickNonEmpty(seg.fa, seg.fa_ir, seg.faIR, seg.persian, seg.fa_text) || '').trim();
                          const rawEn = (pickNonEmpty(seg.en, seg.en_us, seg.english, seg.en_text) || '').trim();

                          // یک کارت واحد با چسباندن جمله‌ها؛ همراه با ENهای قرض‌گرفته‌شده
                          const faJoined = faSentsArr.length ? faSentsArr.join(' ') : '';
                          const enJoined = (() => {
                            const arrENAll = enSentsArr.concat(extraEnFor[i] || []);
                            const dedup = Array.from(new Set(arrENAll.map(t => (t || '').trim()).filter(Boolean)));
                            return dedup.join(' ');
                          })();

                          const text = (lang === 'fa')
                            ? (rawFa || faJoined)
                            : (rawEn || enJoined);

                          if (!text || text === '—') return null;
                          return (
                            <div className={`mt-2 tr-card ${lang === 'fa' ? 'fa-text' : 'it-text'} text-[15px]`}>
                              {text}
                            </div>
                          );
                        })()}
                      </>
                    );

                  })()
                ) : (
                  <p
                    className="it-text text-[17px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: htmlIt(itText) }}
                  />
                )
              )}

              {/* ترجمه همان آیتم */}
              {showTranslation && (() => {
                
                if (isBullet) return null; // bullets handled above

                /* یک کارت واحد برای پاراگراف (بدون split per sentence) */
                const rawFa = (pickNonEmpty(seg.fa, seg.fa_ir, seg.faIR, seg.persian, seg.fa_text) || '').trim();
                const rawEn = (pickNonEmpty(seg.en, seg.en_us, seg.english, seg.en_text) || '').trim();

                // برای فارسی، اگر توزیع شده بود از distFa استفاده کن؛ وگرنه متن خام
                const faOne = (distFa[i] && String(distFa[i]).trim()) || rawFa;

                // برای انگلیسی، جمله‌ها + tails قرضی را یکجا join کن (dedup)
                const arrENparaRaw = enSentsArr.concat(extraEnParaFor[i] || []);
                const enOne = rawEn || (Array.from(new Set(arrENparaRaw.map(t => (t || '').trim()).filter(Boolean))).join(' '));

                const text = (lang === 'fa') ? faOne : enOne;
                const ok = typeof text === 'string' && text.trim().length && text.trim() !== '—';
                return ok ? (
                  <div className={`mt-2 tr-card ${lang === 'fa' ? 'fa-text' : 'it-text'} text-[15px]`}>{text}</div>
                ) : null;




              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pickNonEmpty(...candidates) {
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim().length) return v;
  }
  return '';
}

// انتخاب ترجمهٔ هر آیتم با fallback منطقی
function getSegTranslation(seg = {}, lang = 'fa') {
  const fa = pickNonEmpty(seg.fa, seg.fa_ir, seg.faIR, seg.persian, seg.fa_text);
  const en = pickNonEmpty(seg.en, seg.en_us, seg.english, seg.en_text);
  if (lang === 'fa') return fa || '—';
  return en || '—';
}

/* utils */
function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}