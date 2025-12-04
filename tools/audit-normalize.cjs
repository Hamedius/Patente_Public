import React, { useEffect, useState } from 'react';

function App() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    (async () => {
      const tryPaths = [
        '/data_normalized/output.json',
        '/data/output.json',
      ];
      for (const p of tryPaths) {
        try {
          const r = await fetch(p, { cache: 'no-store' });
          if (!r.ok) continue;
          const json = await r.json();
          const arr = Array.isArray(json?.slides) ? json.slides : (Array.isArray(json) ? json : []);
          if (arr && arr.length) {
            console.info('Loaded slides from', p);
            setSlides(arr);
            return;
          }
        } catch (_) { /* ignore and try next */ }
      }
      console.warn('No slides loaded from either normalized or original data.');
    })();
  }, []);

  return (
    <div>
      {/* Render slides or other UI */}
    </div>
  );
}

export default App;