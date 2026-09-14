import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  collection, serverTimestamp, deleteField,
} from 'firebase/firestore'
import { db, auth, authReady } from '../firebase.js'
import { generateRoomCode } from './id.js'

const roomRef = (code) => doc(db, 'rooms', code)
const playerRef = (code, playerId) => doc(db, 'rooms', code, 'players', playerId)
const playersColRef = (code) => collection(db, 'rooms', code, 'players')

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
  await setDoc(playerRef(code, uid), {
    name,
    score: 0,
    isHost: false,
    joinedAt: serverTimestamp(),
  }, { merge: true })
  return { code, playerId: uid }
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

export async function updateSettings(code, settings) {
  await updateDoc(roomRef(code), { settings })
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

export { deleteField }
