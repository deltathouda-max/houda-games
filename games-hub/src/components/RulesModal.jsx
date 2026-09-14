import { useState } from 'react'

export default function RulesModal({ title, rules }) {
  const [open, setOpen] = useState(false)
  if (!rules) return null

  return (
    <>
      <button
        className="btn btn-ghost"
        style={{ padding: '6px 12px', fontSize: 13 }}
        onClick={() => setOpen(true)}
      >
        ？遊び方
      </button>
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, zIndex: 100,
          }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">遊び方</div>
            <div className="title" style={{ fontSize: 18 }}>{title}</div>
            <p className="subtitle" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-hi)' }}>{rules}</p>
            <button className="btn btn-amber" style={{ width: '100%' }} onClick={() => setOpen(false)}>閉じる</button>
          </div>
        </div>
      )}
    </>
  )
}
