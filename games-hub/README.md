# ほうだのゲーム集 (games-hub)

友達と一緒に、それぞれのスマホから遊べるパーティーゲーム集。
ロビー(部屋作成・参加・進行管理)は共通基盤として作ってあり、各ゲームはその上に載る。

現在遊べるゲーム:
- 激論！朝までそれ正解！(お題に一言回答 → みんなで正解を選ぶ)
- オセロ / Hit and Blow / 9マス将棋 / コネクトフォー / ヨット / チンチロ / ワード落とし / Wikipediaゴルフ

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
7. 古い部屋の自動削除(TTL)を有効にする。部屋の合言葉が3桁の数字(最大1000通り)しかないため、
   遊び終わった部屋が溜まり続けると新しい部屋が作りにくくなる。`rooms` コレクションの
   `expiresAt` フィールド(作成から12時間後を自動設定)にTTLポリシーを設定しておくと安心:
   ```bash
   npx firebase-tools firestore:indexes  # gcloudが未認証なら先に `gcloud auth login`
   gcloud firestore fields ttls update expiresAt --collection-group=rooms --enable-ttl --project=<プロジェクトID>
   ```
   (Firebase ConsoleのFirestore→「TTL」タブからでも同様に設定できる。未設定でもアプリの動作に支障はないが、部屋は削除されずに残り続ける)

これで `npm run dev` すると本番Firebaseに接続する(`.env.local` に `VITE_FIREBASE_PROJECT_ID` があるかどうかで自動判定)。

## デプロイ(Vercel例)

Vercelのプロジェクト設定で「Root Directory」を `games-hub` に指定し、環境変数に `.env.local` と同じ `VITE_FIREBASE_*` を登録する。
GitHub Pages等の静的ホスティングでも `npm run build` の `dist/` をそのまま公開すればよい(SPAなのでルーティング設定は不要、ルームコードはURLクエリ `?room=CODE` で共有できる)。

## データ構造(Firestore)

```
rooms/{roomCode}
  gameId, hostId, status(lobby|playing), settings.timerSeconds, round, expiresAt(TTL用)
  round: { index, topic, phase(answering|reveal|judged), deadlineAt, answers: {playerId: text}, winnerId }

rooms/{roomCode}/reactions/{id}
  emoji, playerId, createdAt (表示後に送信者が自分で削除する一時的なドキュメント)

rooms/{roomCode}/players/{uid}
  name, score, isHost, joinedAt
```

新しいゲームを追加する場合:
1. `src/games/<game-id>/` にコンポーネントを作成し、`room`(部屋ドキュメント全体)・`players`・`code`・`playerId`・`isHost` を受け取ってゲーム固有のロジックを `round` フィールド(または独自フィールド)に対して読み書きする
2. `src/games/registry.js` に登録する

## 既知の制約

- 匿名認証のみで、部屋コードを知っている人なら誰でも参加・部屋の状態を更新できる(友達内利用の前提。厳密な不正対策はしていない)
- 同一ブラウザでの複数タブは別プレイヤーとして扱われない場合がある(Firebase Authの匿名セッションがブラウザ単位のため)。実機では端末ごとに別セッションになるので問題ない

### Firestoreルールの見直しメモ(2026-09)

以下の設計を確認し、友達内利用の前提では許容範囲と判断してそのままにした:

- `rooms/{roomId}` は認証済みなら誰でも中身を更新できる(ホスト権限のチェックはアプリ側UIのみ)。部屋コードが3桁の数字(最大1000通り)なので理論上は総当たりも容易だが、見知らぬ第三者が偶然合言葉を当てて荒らす実害は想定しにくい
- `players/{playerId}` と `reactions/{reactionId}` は本人(uid一致)のみ書き込み可能に既になっている

追加で施した軽い硬化(挙動は変えず、クライアント側のバグ等で不正な値が書き込まれるのを防ぐだけの安全網):
- `reactions` の `emoji` フィールドに型(文字列)と長さ(8文字以内)のバリデーションを追加
