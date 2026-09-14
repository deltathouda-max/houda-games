import { Suspense, useEffect, useRef, useState } from 'react'
import { subscribeRoom, subscribePlayers, leaveRoom, startGame, backToLobby, rematch } from '../lib/room.js'
import { getGame } from '../games/registry.js'
import { playFanfare } from '../lib/sound.js'
import { vibrateSuccess } from '../lib/haptics.js'
import Typewriter from '../components/Typewriter.jsx'
import InviteBlock from '../components/InviteBlock.jsx'
import { ReactionBar, ReactionOverlay } from '../components/Reactions.jsx'
import RulesModal from '../components/RulesModal.jsx'
import LoadingFlavor from '../components/LoadingFlavor.jsx'

export default function Room({ code, playerId, onLeave }) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [notFound, setNotFound] = useState(false)
  const prevScoreRef = useRef(null)

  useEffect(() => {
    const unsubRoom = subscribeRoom(code, (r) => {
      if (r === null) setNotFound(true)
      setRoom(r)
    })
    const unsubPlayers = subscribePlayers(code, setPlayers)
    return () => { unsubRoom(); unsubPlayers() }
  }, [code])

  // 自分のスコアが増えた瞬間にファンファーレ+振動。ゲームごとに個別実装しなくて済むよう共通化
  useEffect(() => {
    const me = players.find((p) => p.id === playerId)
    if (!me) return
    if (prevScoreRef.current !== null && me.score > prevScoreRef.current) {
      playFanfare()
      vibrateSuccess()
    }
    prevScoreRef.current = me.score
  }, [players, playerId])

  if (notFound) {
    return (
      <div className="card">
        <div className="title">部屋が見つかりませんでした</div>
        <button className="btn btn-amber" onClick={onLeave}>戻る</button>
      </div>
    )
  }

  if (!room) {
    return <div className="card"><LoadingFlavor /></div>
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
      <ReactionOverlay code={code} />
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow"><Typewriter text={game?.name ?? room.gameId} /></div>
          <div className="room-code">{code}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={handleLeave}>退出</button>
          {game && <RulesModal title={game.name} rules={game.rules} />}
        </div>
      </div>

      <ReactionBar code={code} playerId={playerId} />

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
              {game?.lobbySettings && (
                <Suspense fallback={null}>
                  <game.lobbySettings code={code} room={room} />
                </Suspense>
              )}
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

          <InviteBlock code={code} />
        </div>
      )}

      {room.status === 'playing' && game?.component && (
        <>
          <Suspense fallback={<div className="card"><LoadingFlavor /></div>}>
            <game.component code={code} playerId={playerId} room={room} players={players} isHost={isHost} />
          </Suspense>
          <div className="card">
            <div className="title" style={{ fontSize: 14 }}>スコア</div>
            {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => (
              <div key={p.id} className="player-row">
                <span>{p.name}{p.isHost && <span className="badge" style={{ marginLeft: 8 }}>ホスト</span>}</span>
                <strong>{p.score || 0}</strong>
              </div>
            ))}
            {isHost && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-amber" style={{ flex: 1 }} onClick={() => rematch(code)}>
                  もう一度
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => backToLobby(code)}>
                  ロビーに戻る
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
