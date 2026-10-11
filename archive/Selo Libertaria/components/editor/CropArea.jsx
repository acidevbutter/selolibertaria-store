import React from 'react';

/**
 * Editor · área de recorte com seleção arrastável.
 * A moldura de papel é o recorte: arraste o meio para mover, os quatro cantos para redimensionar.
 * A parte fora da seleção fica escurecida — a pessoa vê o que sai, não só o que fica.
 */
export function CropArea({ src, ratio = 3 / 4, selection = { x: 8, y: 12, w: 84, h: 62 }, onChange, width = 260, style, ...rest }) {
  const box = React.useRef(null);
  const drag = React.useRef(null);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function start(mode, corner) {
    return (e) => {
      e.preventDefault();
      const r = box.current.getBoundingClientRect();
      drag.current = { mode, corner, r, sx: e.clientX, sy: e.clientY, sel: selection };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
    };
  }
  function move(e) {
    const d = drag.current;
    if (!d || !onChange) return;
    const dx = ((e.clientX - d.sx) / d.r.width) * 100;
    const dy = ((e.clientY - d.sy) / d.r.height) * 100;
    const s = d.sel;
    if (d.mode === 'move') {
      onChange({ ...s, x: clamp(s.x + dx, 0, 100 - s.w), y: clamp(s.y + dy, 0, 100 - s.h) });
      return;
    }
    const right = d.corner.includes('e'), bottom = d.corner.includes('s');
    let { x, y, w, h } = s;
    if (right) w = clamp(w + dx, 12, 100 - x); else { const nx = clamp(x + dx, 0, x + w - 12); w = w + (x - nx); x = nx; }
    if (bottom) h = clamp(h + dy, 12, 100 - y); else { const ny = clamp(y + dy, 0, y + h - 12); h = h + (y - ny); y = ny; }
    onChange({ x, y, w, h });
  }
  function end() {
    drag.current = null;
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', end);
  }

  const handle = (corner, pos) => (
    <span key={corner} onMouseDown={start('resize', corner)} style={{
      position: 'absolute', width: 14, height: 14, background: 'var(--ad-paper)', border: '1px solid var(--ad-ink)',
      cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize', ...pos,
    }} />
  );

  const s = selection;
  return (
    <div ref={box} style={{
      position: 'relative', width, aspectRatio: String(ratio), userSelect: 'none',
      background: src ? '#1F1A16' : 'repeating-linear-gradient(135deg,#2A2522 0 10px,#1F1A16 10px 20px)',
      overflow: 'hidden', ...style,
    }} {...rest}>
      {src && <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <span style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,11,.55)' }} />
      <div onMouseDown={start('move')} style={{
        position: 'absolute', left: s.x + '%', top: s.y + '%', width: s.w + '%', height: s.h + '%',
        border: '2px solid var(--ad-paper)', cursor: 'move',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0)', overflow: 'visible',
      }}>
        {src && <img src={src} alt="" style={{
          position: 'absolute', left: (-s.x / s.w) * 100 + '%', top: (-s.y / s.h) * 100 + '%',
          width: (100 / s.w) * 100 + '%', height: (100 / s.h) * 100 + '%', objectFit: 'cover',
        }} />}
        <span style={{ position: 'absolute', inset: 0, border: '1px solid rgba(11,11,11,.35)' }} />
        {handle('nw', { left: -8, top: -8 })}
        {handle('ne', { right: -8, top: -8 })}
        {handle('sw', { left: -8, bottom: -8 })}
        {handle('se', { right: -8, bottom: -8 })}
        <span style={{
          position: 'absolute', bottom: 6, left: 6, background: 'var(--ad-wine)', color: 'var(--ad-on-shell)',
          fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-mono-label)',
          letterSpacing: 'var(--ad-track-badge)', textTransform: 'uppercase', padding: '3px 7px', whiteSpace: 'nowrap',
        }}>Área visível</span>
      </div>
    </div>
  );
}
