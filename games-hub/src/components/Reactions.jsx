import { useEffect, useRef, useState } from 'react'
import { sendReaction, subscribeReactions } from '../lib/room.js'

const EMOJIS = ['😂', '👍', '😮', '🔥', '😢', '🎉']

export function ReactionBar({ code, playerId }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="btn btn-ghost"
          style={{ padding: '8px 12px', fontSize: 18 }}
          onClick={() => sendReaction(code, playerId, emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export function ReactionOverlay({ code }) {
  const [floaters, setFloaters] = useState([])
  const nextIdRef = useRef(0)

  useEffect(() => {
    const unsub = subscribeReactions(code, (reaction) => {
      const id = nextIdRef.current++
      const left = 10 + Math.random() * 80
      setFloaters((prev) => [...prev, { id, emoji: reaction.emoji, left }])
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id))
      }, 1800)
    })
    return unsub
  }, [code])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      {floaters.map((f) => (
        <span
          key={f.id}
          className="reaction-floater"
          style={{ left: `${f.left}%` }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  )
}
