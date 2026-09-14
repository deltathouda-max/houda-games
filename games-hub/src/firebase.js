import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
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
export const db = getFirestore(app)
export const auth = getAuth(app)

if (!hasRealProject) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}

let authReadyResolve
export const authReady = new Promise((resolve) => { authReadyResolve = resolve })

onAuthStateChanged(auth, (user) => {
  if (user) authReadyResolve(user.uid)
  else signInAnonymously(auth).catch((err) => console.error('anonymous sign-in failed', err))
})
