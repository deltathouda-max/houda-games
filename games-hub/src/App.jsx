import { useEffect, useState } from 'react'
import Hub from './pages/Hub.jsx'
import Room from './pages/Room.jsx'
import { playDecide } from './lib/sound.js'

function readRoomFromUrl() {
  return new URLSearchParams(window.location.search).get('room')
}

export default function App() {
  const [session, setSession] = useState(null) // { code, playerId }
  const [prefillCode] = useState(readRoomFromUrl)

  // ボタン全般に決定音を鳴らす。各ゲームを個別に触らなくて良いようcaptureで一括対応する
  useEffect(() => {
    function handleClick(e) {
      if (e.target.closest?.('.btn')) playDecide()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

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
