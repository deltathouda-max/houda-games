import { useEffect, useRef, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import { fetchArticle, isArticleLink, titleFromHref, normalizeTitle } from './wikiApi.js'
import { drawPair } from './topics.js'
import './wiki-article.css'

export default function WikipediaGolf({ code, playerId, room, players, isHost }) {
  const round = room.round
  const [startInput, setStartInput] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [setupError, setSetupError] = useState('')
  const [busy, setBusy] = useState(false)

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [clicks, setClicks] = useState(0)
  const clicksRef = useRef(0)
  const scoredRef = useRef(false)

  const myState = round?.players?.[playerId]
  const finished = Boolean(myState?.finished)

  useEffect(() => {
    if (!round) return
    let cancelled = false
    clicksRef.current = 0
    setClicks(0)
    scoredRef.current = false
    setLoading(true)
    setLoadError('')
    fetchArticle(round.startTitle)
      .then((a) => { if (!cancelled) { setArticle(a); setLoading(false) } })
      .catch(() => { if (!cancelled) { setLoadError('記事の取得に失敗しました'); setLoading(false) } })
    return () => { cancelled = true }
  }, [round?.index])

  useEffect(() => {
    if (round?.phase === 'finished' && round.winnerId === playerId && !scoredRef.current) {
      scoredRef.current = true
      addScore(code, playerId, 1)
    }
  }, [round?.phase, round?.winnerId, playerId, code])

  async function startRound() {
    if (!startInput.trim() || !goalInput.trim()) return
    setBusy(true); setSetupError('')
    try {
      const [startArticle, goalArticle] = await Promise.all([
        fetchArticle(startInput.trim()),
        fetchArticle(goalInput.trim()),
      ])
      const initialPlayers = {}
      players.forEach((p) => { initialPlayers[p.id] = { clicks: 0, currentTitle: startArticle.title, finished: false, finishedAt: null } })
      await updateRoom(code, {
        round: {
          index: (round?.index ?? -1) + 1,
          startTitle: startArticle.title,
          goalTitle: goalArticle.title,
          phase: 'racing',
          winnerId: null,
          players: initialPlayers,
        },
      })
    } catch (e) {
      setSetupError(e.message || 'お題の設定に失敗しました。記事名を確認してください')
    } finally {
      setBusy(false)
    }
  }

  function useRandomPair() {
    const pair = drawPair()
    setStartInput(pair.start)
    setGoalInput(pair.goal)
  }

  async function backToSetup() {
    await updateRoom(code, { round: null })
  }

  async function goToArticle(rawTitle) {
    if (!round || round.phase !== 'racing' || finished) return
    setLoading(true); setLoadError('')
    try {
      const a = await fetchArticle(rawTitle)
      setArticle(a)
      setLoading(false)
      const newClicks = clicksRef.current + 1
      clicksRef.current = newClicks
      setClicks(newClicks)
      await updateRoom(code, {
        [`round.players.${playerId}.clicks`]: newClicks,
        [`round.players.${playerId}.currentTitle`]: a.title,
      })
      if (normalizeTitle(a.title) === normalizeTitle(round.goalTitle)) {
        await guardedUpdate(code, (data) => data.round?.phase === 'racing', {
          'round.phase': 'finished',
          'round.winnerId': playerId,
          [`round.players.${playerId}.finished`]: true,
          [`round.players.${playerId}.finishedAt`]: Date.now(),
        })
      }
    } catch (e) {
      setLoading(false)
      setLoadError('記事の取得に失敗しました。もう一度リンクを押してください')
    }
  }

  function handleArticleClick(e) {
    const a = e.target.closest('a')
    if (!a) return
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#')) return
    e.preventDefault()
    if (!isArticleLink(href)) return
    goToArticle(titleFromHref(href))
  }

  if (!round) {
    return (
      <div className="card">
        <div className="eyebrow">Wikipediaゴルフ</div>
        <div className="title">スタートとゴールの記事を決める</div>
        <p className="subtitle">スタートの記事からリンクを辿って、ゴールの記事に一番早くたどり着いた人の勝ち。</p>
        {isHost ? (
          <>
            <input className="input" style={{ marginBottom: 8 }} value={startInput}
              onChange={(e) => setStartInput(e.target.value)} placeholder="スタートの記事名(例: 猫)" />
            <input className="input" style={{ marginBottom: 8 }} value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)} placeholder="ゴールの記事名(例: 宇宙)" />
            <button className="btn btn-ghost" style={{ marginBottom: 12, width: '100%' }} onClick={useRandomPair} disabled={busy}>
              ランダムお題
            </button>
            {setupError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{setupError}</p>}
            <button className="btn btn-amber" style={{ width: '100%' }} onClick={startRound} disabled={busy}>
              {busy ? '準備中…' : 'スタート'}
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-mid)' }}>ホストがお題を決めるのを待っています…</p>
        )}
      </div>
    )
  }

  const leaderboard = players
    .map((p) => ({ player: p, state: round.players?.[p.id] }))
    .sort((a, b) => {
      const af = a.state?.finished ? 0 : 1
      const bf = b.state?.finished ? 0 : 1
      if (af !== bf) return af - bf
      if (a.state?.finished && b.state?.finished) return (a.state.finishedAt ?? 0) - (b.state.finishedAt ?? 0)
      return (a.state?.clicks ?? 0) - (b.state?.clicks ?? 0)
    })

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="eyebrow">Wikipediaゴルフ ・ 第{round.index + 1}回</div>
      <div className="title">ゴール: {round.goalTitle}</div>
      <p className="subtitle">
        {round.phase === 'racing'
          ? `現在地: ${article?.displayTitle ?? article?.title ?? round.startTitle} ・ クリック数 ${clicks}`
          : `${players.find((p) => p.id === round.winnerId)?.name ?? '?'} さんがゴール!`}
      </p>

      {leaderboard.map(({ player, state }) => (
        <div className="player-row" key={player.id}>
          <span>{player.name}{round.winnerId === player.id && ' 🏆'}</span>
          <span style={{ color: 'var(--text-mid)', fontSize: 13 }}>
            {state?.finished ? 'ゴール!' : `${state?.clicks ?? 0}クリック`}
          </span>
        </div>
      ))}

      {round.phase === 'racing' && (
        <>
          {loading && <p style={{ color: 'var(--text-mid)' }}>読み込み中…</p>}
          {loadError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError}</p>}
          {article && (
            <div className="wiki-article" onClick={handleArticleClick}
              dangerouslySetInnerHTML={{ __html: article.html }} />
          )}
          {isHost && (
            <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={backToSetup}>
              この回を中断してお題を選び直す
            </button>
          )}
        </>
      )}

      {round.phase === 'finished' && isHost && (
        <button className="btn btn-amber" style={{ marginTop: 12, width: '100%' }} onClick={backToSetup}>
          次のお題へ
        </button>
      )}
    </div>
  )
}
