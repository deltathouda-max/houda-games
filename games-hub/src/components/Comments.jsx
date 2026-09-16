import { useEffect, useRef, useState } from 'react'
import { sendComment, subscribeComments } from '../lib/room.js'

const LANES = 7

export function CommentInput({ code, playerId, playerName }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (busy || !text.trim()) return
    setBusy(true)
    try {
      await sendComment(code, playerId, playerName, text)
      setText('')
    } finally {
      // 連投で画面が埋まりすぎないよう、送信後に少し間を空ける
      setTimeout(() => setBusy(false), 800)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        className="input"
        style={{ flex: 1, minWidth: 0 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        placeholder="コメントを流す…"
        maxLength={30}
      />
      <button className="btn btn-ghost" style={{ flexShrink: 0, whiteSpace: 'nowrap' }} disabled={busy || !text.trim()} onClick={submit}>送信</button>
    </div>
  )
}

export function CommentOverlay({ code }) {
  const [comments, setComments] = useState([])
  const nextIdRef = useRef(0)
  const laneRef = useRef(0)

  useEffect(() => {
    const unsub = subscribeComments(code, (c) => {
      const id = nextIdRef.current++
      const lane = laneRef.current % LANES
      laneRef.current += 1
      const top = 6 + lane * (86 / LANES)
      setComments((prev) => [...prev, { id, text: c.text, playerName: c.playerName, top }])
      setTimeout(() => {
        setComments((prev) => prev.filter((x) => x.id !== id))
      }, 7500)
    })
    return unsub
  }, [code])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 55 }}>
      {comments.map((c) => (
        <div key={c.id} className="comment-flow" style={{ top: `${c.top}%` }}>
          <span className="comment-flow-name">{c.playerName}</span>
          {c.text}
        </div>
      ))}
    </div>
  )
}
