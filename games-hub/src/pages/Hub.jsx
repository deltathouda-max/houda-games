import { useState } from 'react'
import { GAMES } from '../games/registry.js'
import { createRoom, joinRoom } from '../lib/room.js'
import { getSavedName, saveName } from '../lib/storage.js'
import Typewriter from '../components/Typewriter.jsx'

export default function Hub({ onEnterRoom, prefillCode }) {
  const [mode, setMode] = useState(prefillCode ? 'join' : null) // null | 'create' | 'join'
  const [selectedGame, setSelectedGame] = useState(null)
  const [name, setName] = useState(getSavedName)
  const [code, setCode] = useState(prefillCode ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !selectedGame) return
    setBusy(true); setError('')
    try {
      saveName(name.trim())
      const { code: newCode, playerId } = await createRoom({ gameId: selectedGame.id, hostName: name.trim() })
      onEnterRoom({ code: newCode, playerId, gameId: selectedGame.id })
    } catch (e) {
      setError(e.message)
    } finally { setBusy(false) }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return
    setBusy(true); setError('')
    try {
      saveName(name.trim())
      const { code: joinedCode, playerId } = await joinRoom({ code: code.trim(), name: name.trim() })
      onEnterRoom({ code: joinedCode, playerId })
    } catch (e) {
      setError(e.message)
    } finally { setBusy(false) }
  }

  if (mode === null) {
    return (
      <div className="card">
        <div className="eyebrow">ほうだのゲーム集</div>
        <div className="title"><Typewriter text="遊ぶゲームを選ぶ" /></div>
        <p className="subtitle">友達を招待して、みんなのスマホから一緒に遊べます。</p>
        <div className="game-list">
          {GAMES.map((g) => (
            <button
              key={g.id}
              className="game-item"
              disabled={!g.available}
              onClick={() => { setSelectedGame(g); setMode('create') }}
            >
              {g.icon && <span className="game-item-icon">{g.icon}</span>}
              <div style={{ flex: 1 }}>
                <div className="game-item-name">{g.name}</div>
                <div className="game-item-desc">{g.description}</div>
              </div>
              {!g.available && <span className="badge">準備中</span>}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setMode('join')}>合言葉で参加する →</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="eyebrow">{mode === 'create' ? selectedGame.name : '参加する'}</div>
      <div className="title">{mode === 'create' ? '部屋を作る' : '合言葉を入力'}</div>
      {mode === 'join' && (
        <input
          className="input"
          style={{ marginBottom: 12 }}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="部屋の合言葉 (例: 482)"
          inputMode="numeric"
          maxLength={3}
        />
      )}
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="あなたの名前"
        maxLength={12}
        style={{ marginBottom: 12 }}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" onClick={() => setMode(null)} disabled={busy}>戻る</button>
        <button
          className="btn btn-amber"
          style={{ flex: 1 }}
          disabled={busy || !name.trim() || (mode === 'join' && !code.trim())}
          onClick={mode === 'create' ? handleCreate : handleJoin}
        >
          {busy ? '処理中…' : mode === 'create' ? '部屋を作る' : '参加する'}
        </button>
      </div>
    </div>
  )
}
