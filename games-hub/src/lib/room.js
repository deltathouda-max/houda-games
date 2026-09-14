import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  collection, serverTimestamp, deleteField, runTransaction,
} from 'firebase/firestore'
import { db, auth, authReady } from '../firebase.js'
import { generateRoomCode } from './id.js'

const roomRef = (code) => doc(db, 'rooms', code)
const playerRef = (code, playerId) => doc(db, 'rooms', code, 'players', playerId)
const playersColRef = (code) => collection(db, 'rooms', code, 'players')
const reactionsColRef = (code) => collection(db, 'rooms', code, 'reactions')

// 部屋を作成し、作成者を最初のプレイヤー(ホスト)として登録する
export async function createRoom({ gameId, hostName }) {
  const uid = await authReady
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode()
    const ref = roomRef(code)
    const existing = await getDoc(ref)
    if (existing.exists()) continue
    await setDoc(ref, {
      gameId,
      hostId: uid,
      status: 'lobby',
      settings: { timerSeconds: 0 },
      round: null,
      createdAt: serverTimestamp(),
    })
    await setDoc(playerRef(code, uid), {
      name: hostName,
      score: 0,
      isHost: true,
      joinedAt: serverTimestamp(),
    })
    return { code, playerId: uid }
  }
  throw new Error('部屋コードの発行に失敗しました。もう一度お試しください')
}

export async function joinRoom({ code, name }) {
  const uid = await authReady
  const ref = roomRef(code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('その合言葉の部屋は見つかりませんでした')
  // 既に参加済み(再接続)の場合はスコアや参加順を巻き戻さないよう名前だけ更新する
  const existing = await getDoc(playerRef(code, uid))
  if (existing.exists()) {
    await setDoc(playerRef(code, uid), { name }, { merge: true })
  } else {
    await setDoc(playerRef(code, uid), {
      name,
      score: 0,
      isHost: false,
      joinedAt: serverTimestamp(),
    })
  }
  return { code, playerId: uid }
}

// 部屋の再読み込み時に「既にそのプレイヤーとして参加済みか」を確認するための問い合わせ
export async function findExistingPlayer(code, playerId) {
  const [roomSnap, playerSnap] = await Promise.all([
    getDoc(roomRef(code)),
    getDoc(playerRef(code, playerId)),
  ])
  if (!roomSnap.exists() || !playerSnap.exists()) return null
  return { code, playerId }
}

export async function leaveRoom({ code, playerId }) {
  await deleteDoc(playerRef(code, playerId))
}

export function subscribeRoom(code, cb) {
  return onSnapshot(roomRef(code), (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null))
}

export function subscribePlayers(code, cb) {
  return onSnapshot(playersColRef(code), (snap) => {
    const players = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.joinedAt?.toMillis?.() ?? 0) - (b.joinedAt?.toMillis?.() ?? 0))
    cb(players)
  })
}

export async function updateRoom(code, patch) {
  await updateDoc(roomRef(code), patch)
}

// 「誰でも押せるが最初の1回だけ処理したい」ボタン用。predicateが現在のルーム内容を見て
// falseを返したら何もしない(=既に他の人の操作で状態が進んでいた)ので、複数人が同時に
// 押しても二重に進行しない。
export async function guardedUpdate(code, predicate, patch) {
  try {
    await runTransaction(db, async (tx) => {
      const ref = roomRef(code)
      const snap = await tx.get(ref)
      if (!snap.exists()) return
      if (!predicate(snap.data())) return
      tx.update(ref, patch)
    })
  } catch {
    // 複数人がほぼ同時に押した場合、負けた側のトランザクションは競合で失敗しうるが、
    // それは「もう片方が先に処理した」という正常な結果なので無視してよい。
  }
}

export async function updateSettings(code, settings) {
  await updateDoc(roomRef(code), { settings })
}

// ロビーを経由せず(参加者確認・ゲーム開始ボタンを省略して)その場でもう一度始める。
// スコアは各プレイヤー本人しか書き換えられない(Firestoreルール)ため、ホストからは
// リセットせず、その部屋での通算成績としてそのまま積み上げる
export async function rematch(code) {
  await updateDoc(roomRef(code), { round: null })
}

export async function startGame(code) {
  await updateDoc(roomRef(code), { status: 'playing' })
}

export async function backToLobby(code) {
  await updateDoc(roomRef(code), { status: 'lobby', round: null })
}

export async function addScore(code, playerId, delta) {
  const snap = await getDoc(playerRef(code, playerId))
  const current = snap.exists() ? (snap.data().score || 0) : 0
  await updateDoc(playerRef(code, playerId), { score: current + delta })
}

export function currentUid() {
  return auth.currentUser?.uid ?? null
}

// 一瞬表示して消えるリアクション。送信者が表示後(数秒後)に自分で削除するので
// 部屋に溜まり続けない
export async function sendReaction(code, playerId, emoji) {
  const ref = doc(reactionsColRef(code))
  await setDoc(ref, { emoji, playerId, createdAt: serverTimestamp() })
  setTimeout(() => { deleteDoc(ref).catch(() => {}) }, 4000)
}

export function subscribeReactions(code, cb) {
  return onSnapshot(reactionsColRef(code), (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') cb({ id: change.doc.id, ...change.doc.data() })
    })
  })
}

export { deleteField }
