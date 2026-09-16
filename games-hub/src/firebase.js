import { initializeApp } from 'firebase/app'
import { initializeFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const hasRealProject = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

const firebaseConfig = hasRealProject
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : {
      // 実プロジェクト未設定時はローカルエミュレータ専用のダミー設定を使う(`npm run emulators`と併用)
      apiKey: 'demo-key',
      authDomain: 'demo-games-hub.firebaseapp.com',
      projectId: 'demo-games-hub',
    }

export const app = initializeApp(firebaseConfig)
// 学校・職場Wi-Fiや一部のモバイル回線などWebSocketと相性が悪いネットワークでは、
// Firestoreのリアルタイム接続が繋がったまま固まり、ページを再読み込みしないと
// 更新が届かなくなることがある。自動でlong-pollingに切り替えさせて回避する
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
export const auth = getAuth(app)

if (!hasRealProject) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}

// 上記の対策をしても接続が固まってしまった場合のフォールバック。
// タブが再びアクティブになった時・オンライン復帰時に接続を張り直させる
let reconnecting = false
async function kickReconnect() {
  if (reconnecting) return
  reconnecting = true
  try {
    await disableNetwork(db)
    await enableNetwork(db)
  } catch {
    // 何もできない状態(オフラインのまま等)なら黙って諦める。次のイベントで再試行される
  } finally {
    reconnecting = false
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') kickReconnect()
  })
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', kickReconnect)
}

let authReadyResolve
export const authReady = new Promise((resolve) => { authReadyResolve = resolve })

onAuthStateChanged(auth, (user) => {
  if (user) authReadyResolve(user.uid)
  else signInAnonymously(auth).catch((err) => console.error('anonymous sign-in failed', err))
})
