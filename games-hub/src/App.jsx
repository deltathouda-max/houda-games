import { useEffect, useState } from 'react'
import Hub from './pages/Hub.jsx'
import Room from './pages/Room.jsx'
import { playDecide } from './lib/sound.js'
import { authReady } from './firebase.js'
import { findExistingPlayer } from './lib/room.js'

function readRoomFromUrl() {
  return new URLSearchParams(window.location.search).get('room')
}

export default function App() {
  const [session, setSession] = useState(null) // { code, playerId }
  const [prefillCode] = useState(readRoomFromUrl)
  const [checkingReconnect, setCheckingReconnect] = useState(Boolean(readRoomFromUrl()))

  // ボタン全般に決定音を鳴らす。各ゲームを個別に触らなくて良いようcaptureで一括対応する
  useEffect(() => {
    function handleClick(e) {
      if (e.target.closest?.('.btn')) playDecide()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  // URLに部屋コードが残った状態で開いた場合(スマホのロック復帰・タブの再読み込み等)、
  // 既に参加済みのプレイヤーなら合言葉の再入力なしで自動的に部屋へ戻す
  useEffect(() => {
    if (!prefillCode) return
    let cancelled = false
    authReady.then(async (uid) => {
      const existing = await findExistingPlayer(prefillCode, uid)
      if (cancelled) return
      if (existing) setSession(existing)
      setCheckingReconnect(false)
    })
    return () => { cancelled = true }
  }, [prefillCode])

  useEffect(() => {
    if (session) {
      const url = new URL(window.location.href)
      url.searchParams.set('room', session.code)
      window.history.replaceState({}, '', url)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('room')
      window.history.replaceState({}, '', url)
    }
  }, [session])

  if (checkingReconnect) {
    return <div className="app-shell"><div className="card"><p className="subtitle">読み込み中…</p></div></div>
  }

  return (
    <div className="app-shell">
      {session ? (
        <Room code={session.code} playerId={session.playerId} onLeave={() => setSession(null)} />
      ) : (
        <Hub prefillCode={prefillCode} onEnterRoom={({ code, playerId }) => setSession({ code, playerId })} />
      )}
    </div>
  )
}
