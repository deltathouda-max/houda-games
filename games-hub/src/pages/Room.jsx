import { useEffect, useState } from 'react'
import { subscribeRoom, subscribePlayers, leaveRoom, updateSettings, startGame, backToLobby } from '../lib/room.js'
import { getGame } from '../games/registry.js'

const TIMER_OPTIONS = [
  { value: 0, label: 'なし' },
  { value: 30, label: '30秒' },
  { value: 60, label: '60秒' },
  { value: 90, label: '90秒' },
]

export default function Room({ code, playerId, onLeave }) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const unsubRoom = subscribeRoom(code, (r) => {
      if (r === null) setNotFound(true)
      setRoom(r)
    })
    const unsubPlayers = subscribePlayers(code, setPlayers)
    return () => { unsubRoom(); unsubPlayers() }
  }, [code])

  if (notFound) {
    return (
      <div className="card">
        <div className="title">部屋が見つかりませんでした</div>
        <button className="btn btn-amber" onClick={onLeave}>戻る</button>
      </div>
    )
  }

  if (!room) {
    return <div className="card"><p className="subtitle">読み込み中…</p></div>
  }

  const isHost = room.hostId === playerId
  const me = players.find((p) => p.id === playerId)
  const game = getGame(room.gameId)
  const canStart = players.length >= (game?.minPlayers ?? 1)

  async function handleLeave() {
    await leaveRoom({ code, playerId })
    onLeave()
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">{game?.name ?? room.gameId}</div>
          <div className="room-code">{code}</div>
        </div>
        <button className="btn btn-ghost" onClick={handleLeave}>退出</button>
      </div>

      {room.status === 'lobby' && (
        <div className="card">
          <div className="title" style={{ fontSize: 16 }}>参加者 ({players.length}人)</div>
          {players.map((p) => (
            <div key={p.id} className="player-row">
              <span>{p.name}{p.isHost && <span className="badge" style={{ marginLeft: 8 }}>ホスト</span>}</span>
              {p.id === playerId && <span style={{ color: 'var(--text-lo)', fontSize: 12 }}>あなた</span>}
            </div>
          ))}

          {isHost && (
            <>
              <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>回答の制限時間</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="btn btn-ghost"
                    style={room.settings?.timerSeconds === opt.value ? { borderColor: 'var(--amber-500)', color: 'var(--amber-400)' } : {}}
                    onClick={() => updateSettings(code, { timerSeconds: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-amber"
                style={{ width: '100%', marginTop: 20 }}
                disabled={!canStart}
                onClick={() => startGame(code)}
              >
                {canStart ? 'ゲーム開始' : `あと${(game?.minPlayers ?? 1) - players.length}人必要です`}
              </button>
            </>
          )}
          {!isHost && <p className="subtitle" style={{ marginTop: 16 }}>ホストが開始するのを待っています…</p>}
        </div>
      )}

      {room.status === 'playing' && game?.component && (
        <>
          <game.component code={code} playerId={playerId} room={room} players={players} isHost={isHost} />
          <div className="card">
            <div className="title" style={{ fontSize: 14 }}>スコア</div>
            {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => (
              <div key={p.id} className="player-row">
                <span>{p.name}{p.isHost && <span className="badge" style={{ marginLeft: 8 }}>ホスト</span>}</span>
                <strong>{p.score || 0}</strong>
              </div>
            ))}
            {isHost && (
              <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => backToLobby(code)}>
                ロビーに戻る
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
