# 飲み会ゲーム集 (games-hub)

友達と一緒に、それぞれのスマホから遊べるパーティーゲーム集。
ロビー(部屋作成・参加・進行管理)は共通基盤として作ってあり、各ゲームはその上に載る。

現在遊べるゲーム:
- それが正解(お題に一言回答 → みんなで正解を選ぶ)

準備中(共通の「盤面+交互に手を打つ」土台を流用予定): オセロ / hit and blow / 9マス将棋 / コネクトフォー / ヨット / チンチロ / ワード落とし / Wikipediaゴルフ

## ローカルでの動作確認(本番Firebase不要)

Firebaseの実プロジェクトを作らなくても、ローカルのエミュレータだけで全機能を試せる。

```bash
cd games-hub
npm install

# ターミナル1: Firestore/Authエミュレータ
npm run emulators

# ターミナル2: 開発サーバー
npm run dev
```

`http://localhost:5174` を2つ以上のタブ/ブラウザで開けば、複数人でのルーム参加・回答・判定の同期が確認できる。
`.env` を何も設定していない場合、自動的にこのローカルエミュレータに接続する(コード内 `src/firebase.js` の分岐)。

## 本番用Firebaseプロジェクトの作成(ユーザー本人の作業)

以下はGoogleアカウントでの外部サービス登録を伴うため、AIが代行できない。本人が実施する。

1. https://console.firebase.google.com を開き、新規プロジェクトを作成する
2. 左メニュー「Firestore Database」→ データベースを作成 →「テスト モードで開始」(位置は `asia-northeast1` 等お好みで)
3. 左メニュー「Authentication」→「Sign-in method」→「匿名」を有効化する
4. プロジェクト設定 →「マイアプリ」→ ウェブアプリを追加(</> アイコン)→ 表示された `firebaseConfig` の値を控える
5. `games-hub/.env.example` を `.env.local` としてコピーし、4で控えた値を貼り付ける
6. `firestore.rules` をデプロイする(初回のみ `firebase login` が必要):
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add   # 作成したプロジェクトを選択
   npx firebase-tools deploy --only firestore:rules
   ```

これで `npm run dev` すると本番Firebaseに接続する(`.env.local` に `VITE_FIREBASE_PROJECT_ID` があるかどうかで自動判定)。

## デプロイ(Vercel例)

Vercelのプロジェクト設定で「Root Directory」を `games-hub` に指定し、環境変数に `.env.local` と同じ `VITE_FIREBASE_*` を登録する。
GitHub Pages等の静的ホスティングでも `npm run build` の `dist/` をそのまま公開すればよい(SPAなのでルーティング設定は不要、ルームコードはURLクエリ `?room=CODE` で共有できる)。

## データ構造(Firestore)

```
rooms/{roomCode}
  gameId, hostId, status(lobby|playing), settings.timerSeconds, round
  round: { index, topic, phase(answering|reveal|judged), deadlineAt, answers: {playerId: text}, winnerId }

rooms/{roomCode}/players/{uid}
  name, score, isHost, joinedAt
```

新しいゲームを追加する場合:
1. `src/games/<game-id>/` にコンポーネントを作成し、`room`(部屋ドキュメント全体)・`players`・`code`・`playerId`・`isHost` を受け取ってゲーム固有のロジックを `round` フィールド(または独自フィールド)に対して読み書きする
2. `src/games/registry.js` に登録する

## 既知の制約

- 匿名認証のみで、部屋コードを知っている人なら誰でも参加・部屋の状態を更新できる(友達内利用の前提。厳密な不正対策はしていない)
- 同一ブラウザでの複数タブは別プレイヤーとして扱われない場合がある(Firebase Authの匿名セッションがブラウザ単位のため)。実機では端末ごとに別セッションになるので問題ない
