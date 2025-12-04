import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useDebouncedCallback } from 'use-debounce'
import Segment from './Segment'
import { highlightIt, escapeHTML } from '../lib/highlight'

export default function SlideView({ segments, lang = 'fa', terms = [], highlight = true }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(
      segments.filter((s) => (s?.it || s?.fa || s?.en || '').toString().trim().length)
    )
  }, [segments])

  const debouncedSetSearch = useDebouncedCallback((value) => setSearch(value), 300)

  return (
    <div className="slide-view">
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => debouncedSetSearch(e.target.value)}
        className="search-input"
      />
      <ul className={`mt-4 list-disc ${lang === 'fa' ? 'pr-6' : 'pl-6'}`}>
        {items.map((seg, i) => (
          seg?.kind === 'li' ? (
            <li key={`li-${i}`}>
              <Segment
                seg={seg}
                lang={lang}
                terms={terms}
                highlight={highlight}
              />
            </li>
          ) : (
            <Segment
              key={`seg-${i}`}
              seg={seg}
              lang={lang}
              terms={terms}
              highlight={highlight}
            />
          )
        ))}
      </ul>
    </div>
  )
}