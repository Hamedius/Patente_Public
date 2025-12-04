import React from 'react'

// لیست اسلایدها (همان استایل کارتِ موضوعات) — شماره‌ها بدون صفر قبل
export default function SlideList({ slides = [], onPick }) {
  // مدیریت اسکرول در App.jsx انجام می‌شود؛ اینجا نیازی به اثر نیست.

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="space-y-3">
        {slides.map((s, i) => {
          const it = s?.title || s?.title_it || `Slide ${i + 1}`
          const fa = s?.title_fa || s?.titleFa || null
          const num = (i + 1).toString() // بدون padStart
          const label = `${num} - ${it}`
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              className="w-full text-left rounded-lg border border-blue-200 bg-white hover:bg-blue-50 px-4 py-3"
              style={{ direction: 'ltr', textAlign: 'left', whiteSpace: 'normal' }}
              title={label}
            >
              <div className="text-blue-700 font-medium break-words">{label}</div>
              {fa ? (
                <div className="text-sm text-gray-700 mt-2 text-right leading-6" dir="rtl">
                  {fa}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}