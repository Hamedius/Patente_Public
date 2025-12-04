import React from 'react';

export default function TopBar({
  view,
  onBack,

  topicTitle,
  topicFaTitle,

  slideTitleIt,
  slideTitleFa,

  // highlight
  showHighlightBtn = false,
  highlightOn = true,
  onToggleHighlight = () => {},

  // translate
  showTranslateBtn = false,
  translateOn = false,
  onToggleTranslate = () => {},
  transLang = 'fa',               // 'fa' | 'en'
  onCycleTransLang = () => {},

}) {
  // عنوان بالای صفحه
  let line1 = '';
  let line2 = '';

  if (view === 'topics') {
    line1 = 'انتخاب موضوع';
    line2 = '';
  } else if (view === 'slides') {
    line1 = topicTitle || '';
    line2 = topicFaTitle || '';
  } else if (view === 'slide') {
    line1 = slideTitleIt || '';
    line2 = slideTitleFa || '';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">

          {/* عناوین مرکز */}
          <div className="flex-1 text-center">
            {line1 ? <div className="font-extrabold tracking-wide text-2xl leading-none">{line1}</div> : null}
            {line2 ? <div className="text-base opacity-90 mt-1 font-vazir">{line2}</div> : null}
          </div>

          {/* دکمه‌ها (سمت راست هدر) */}
          <div className="flex items-center gap-3">

            {/* دکمه هایلایت (آیکون ماژیک) */}
            {showHighlightBtn && (
              <button
                onClick={onToggleHighlight}
                className={`h-11 w-11 rounded-xl bg-white/90 hover:bg-white transition border ${highlightOn ? 'ring-2 ring-blue-300' : 'border-transparent'}`}
                title="هایلایت ایتالیایی"
              >
                <img
                  src="/highlight.png"
                  alt="highlight"
                  className="h-6 w-6 mx-auto"
                />
              </button>
            )}

            {/* دکمه نمایش/عدم‌نمایش ترجمه (آیکون ترنسلیت) */}
            {showTranslateBtn && (
              <button
                onClick={onToggleTranslate}
                className={`h-11 w-11 rounded-xl bg-white/90 hover:bg-white transition border ${translateOn ? 'ring-2 ring-blue-300' : 'border-transparent'}`}
                title="نمایش/عدم‌نمایش ترجمه"
              >
                <img
                  src="/translate.jpg"
                  alt="translate"
                  className="h-6 w-6 mx-auto"
                />
              </button>
            )}

            {/* دکمه انتخاب زبان ترجمه (FA/EN) */}
            {showTranslateBtn && (
              <button
                onClick={onCycleTransLang}
                className="h-11 min-w-[52px] px-3 rounded-xl bg-white/90 hover:bg-white text-blue-700 font-bold"
                title="تغییر زبان ترجمه"
              >
                {transLang === 'fa' ? 'EN' : 'فا'}
              </button>
            )}

            {/* دکمه بازگشت (سمت راست) */}
            {view !== 'topics' && (
              <button
                onClick={onBack}
                className="h-11 px-4 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50"
                title="بازگشت"
              >
                بازگشت
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}