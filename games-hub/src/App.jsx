import { useEffect, useState } from 'react'
import Hub from './pages/Hub.jsx'
import Room from './pages/Room.jsx'

function readRoomFromUrl() {
  return new URLSearchParams(window.location.search).get('room')
}

export default function App() {
  const [session, setSession] = useState(null) // { code, playerId }
  const [prefillCode] = useState(readRoomFromUrl)

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
