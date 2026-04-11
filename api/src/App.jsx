import { useState, useEffect, useRef, useCallback } from "react";

const SECTIONS = [
  {
    id:"s1", num:"01", title:"働く前の心構え", short:"心構え", color:"#1756B8",
    questions:[
      { id:"s1q1a", label:"問１①", points:"不正解 −10点", section:"基本5大ルール",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"①『　』は責任を持つ（変更は原則不可・欠勤は『　』時間前まで連絡・助け合い）",a:["シフト","3"]},
          {s:"② お客様との『　』交換・『　』交流禁止（SNSの『　』含む）",a:["連絡先","プライベート","相互フォロー"]},
          {s:"③『　』投稿禁止（個人/店舗アカウント両方）",a:["ネガティブ"]},
          {s:"　デルタ名での『　』の作成禁止",a:["個人アカウント"]},
          {s:"　『　』でデルタ店舗関連の『　』禁止",a:["個人アカウント","フォロー"]},
          {s:"④ 同一店舗での『　』禁止（交際時は異動対応）",a:["社内恋愛"]},
          {s:"⑤ お客様に『　』発言禁止（会話はプラスかゼロ）",a:["マイナス"]},
        ],
        model:"①シフト・3時間前　②連絡先・プライベート・相互フォロー　③ネガティブ・個人アカウント・個人アカウント・フォロー　④社内恋愛　⑤マイナス",
        exp:"①シフトの責任：無断変更・直前キャンセルは他スタッフへの負担増・接客品質低下に直結。欠勤連絡は3時間前までが原則。\n\n②連絡先交換・プライベート交流禁止：お客様との個人的なつながりはトラブルの原因。SNSの相互フォローも禁止。\n\n③ネガティブ投稿禁止：店舗の評判・信頼に直接影響する。\n\n④社内恋愛禁止：同一店舗内の恋愛関係は職場環境・チームワークに悪影響。\n\n⑤マイナス発言禁止：お客様にネガティブな気持ちを持ち帰らせないことがデルタのホスピタリティの基本。",
      },
      { id:"s1q1b", label:"問１②", points:"不正解 −5点", section:"店舗利用・私用関連",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"所属店舗の『　』NG",a:["私的利用"]},
          {s:"他店舗利用時は『　』に事前に連絡",a:["自店舗の店舗責任者"]},
          {s:"他店舗利用時『　』での来店はNG　『　』名以上グループならOK",a:["異性とペア","3"]},
          {s:"※『　』がいる場合はグループでもNG",a:["パートナー"]},
          {s:"利用時は、他店舗スタッフへ必ず『　』を実施する",a:["挨拶"]},
        ],
        model:"私的利用NG／自店舗の店舗責任者に事前連絡／異性とペアNG・3名以上OK・パートナーがいればNG／挨拶",
        exp:"■所属店舗の私的利用がNGの理由\nスタッフが自分の店舗をプライベートで利用すると、他スタッフが気を遣い業務に支障が生じます。\n\n■他店舗利用時のルール\n・必ず自店舗の店舗責任者に事前連絡\n・異性とペアNG→誤解やトラブルの原因\n・3名以上グループならOK（ただしパートナーがいる場合はグループでもNG）\n\n■他店舗スタッフへの挨拶が必須\nお客様として訪れても「同じ会社の仲間」として礼儀を示すことが大切です。",
      },
      { id:"s1q1c", label:"問１③", points:"不正解 −5点", section:"姿勢のルール",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"出勤時・退勤時は必ず全員に『　』をする",a:["あいさつ"]},
          {s:"『　』・『　』。おはようございます・おつかれさまです",a:["目を見て","笑顔で"]},
          {s:"『　』な姿勢と『　』の気持ちは心を込めて相手に伝えましょう！",a:["謙虚","感謝・謝罪"]},
        ],
        model:"あいさつ／目を見て・笑顔で／謙虚な姿勢・感謝（謝罪）の気持ち",
        exp:"「あいさつ」の頭文字：あ＝あかるく　い＝いつも　さ＝さきに　つ＝つけくわえる\n\n■目を見て・笑顔での重要性\n挨拶は言葉だけでは不十分。目を見て笑顔でするからこそ気持ちが伝わります。\n\n■謙虚な姿勢と感謝・謝罪の気持ち\n「ありがとう」「ごめんなさい」は絶対に言葉で伝えることが必要です。",
      },
      { id:"s1q1d", label:"問１④", points:"不正解 −5点", section:"期限意識",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"『　』をしない",a:["先延ばし"]},
          {s:"すべての提出物・報告を『　』させる",a:["期日内に完了"]},
        ],
        model:"先延ばしをしない／すべての提出物・報告を期日内に完了させる",
        exp:"シフト希望：前半5日・後半20日まで\n月末書類：毎月本社3日までに必着\n\n「後でやろう」の積み重ねが管理者・同僚への負担となります。期日を守ることが信頼の基本です。",
      },
      { id:"s1q1e", label:"問１⑤", points:"不正解 −5点", section:"身だしなみ",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"勤務時の服装は『　』NG",a:["スカート・半パン"]},
          {s:"制服は『　』まで締める",a:["第二ボタン"]},
          {s:"『　』のみでの出退勤禁止",a:["制服"]},
          {s:"『　』の臭い等に配慮する",a:["体臭・口臭・タバコ"]},
          {s:"制服・サロンに『　』がないか",a:["シワ・汚れ"]},
          {s:"『　』が伸びすぎてないか（男性）",a:["爪"]},
          {s:"『　』の着用は無し（体調不良時は例外）",a:["マスク"]},
        ],
        model:"スカート・半パンNG／第二ボタンまで締める／制服のみ出退勤禁止／体臭・口臭・タバコ配慮／シワ・汚れ確認／爪（男性）／マスク原則なし",
        exp:"■服装ルール\n・スカート・半パンNG：動きやすさと清潔感のため\n・制服は第二ボタンまで締める：だらしない印象を避けるため\n・制服のみでの出退勤禁止：通勤時も常に第三者から見られています\n\n■臭いへの配慮\n体臭・口臭・部屋干し臭・タバコの臭いはお客様が最も不快に感じる要素の一つ。\n\n■マスク原則なし\n表情が見えることで接客の質が上がります。体調不良時は例外。",
      },
      { id:"s1q2", label:"問２", points:"全問正解で2点", section:"コンセプト理解",
        question:"デルタのコンセプトについて、デルタの接客において必ず行う二つの行動を記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①自己紹介をすること　②お客様の名前を覚えて呼ぶこと（顔見知りの方には「いらっしゃいませ」と伝えること）",
        exp:"デルタのお客様の約90%はリピーターです。残り10%の新規をリピーターにするために、自己紹介は欠かせません。\n\n「お客様は知っている人がいるところに行きたがる」という心理があります。スタッフの名前を知っている・お客様の名前を知っている、この相互認識が「居場所感」を生み出します。\n\n■自己紹介の例\n「失礼します！お話中すみません！初めまして、〇〇です！よろしくお願いします！」\n\n★顔見知りの方には「いらっしゃいませ」と伝えること。",
      },
      { id:"s1q3", label:"問３", points:"2点", section:"接客意識",
        question:"フロアにおいて作ってはならないお客様の状態を記述せよ",
        type:"free", subs:[{l:""}],
        model:"暇な（退屈している）お客様の状態",
        exp:"暇なお客様とはどんな状態か：\n・一人でダーツを投げている\n・ずっとスマホを見ている\n・椅子に座って人のダーツを見ている\n\nこれらすべてが「退屈している」サインです。お客様が退屈したまま帰ると「また来たい」という気持ちが生まれません。",
      },
      { id:"s1q4", label:"問４", points:"2点", section:"接客意識",
        question:"その状態であると判断できる具体的な状況を記述せよ",
        type:"free", subs:[{l:""}],
        model:"一人でダーツを投げている／ずっとスマホを見ている／椅子に座って人のダーツを見ている",
        exp:"①一人でダーツを投げている → 誰かに声をかけてほしいサイン\n②ずっとスマホを見ている → 会話のきっかけを待っている状態\n③椅子に座って他の人のダーツを見ている → 参加したいが入れない状態\n\n■すぐにとるべき行動\n「一緒に投げませんか？」「〇〇さんとダブルスどうですか？」など、自然な形でコミュニケーションを取りましょう。",
      },
    ],
  },
  {
    id:"s2", num:"02", title:"ホール業務", short:"ホール", color:"#0A7C5C",
    questions:[
      { id:"s2q1", label:"問１", points:"全問正解で1点", section:"出勤時",
        question:"出勤時、最優先で行うべき行動を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①着席しているお客様全員に自己紹介すること　②顔見知りの方には「いらっしゃいませ」と伝えること",
        exp:"出勤したら、すでに着席しているお客様全員に自己紹介することが最初の仕事です。\n\n①初めて会うお客様 → 自己紹介（名前・よろしくお願いします）\n②顔見知りのお客様 → 「いらっしゃいませ」と名前を呼んで迎える\n\n■自己紹介の実践例\n「失礼します！お話中すみません！初めまして、〇〇です！よろしくお願いします！」\n※ここで一言追加の会話ができると上出来です",
      },
      { id:"s2q2", label:"問２", points:"2点", section:"出勤時",
        question:"フロアに出た後、最優先で行うべき行動を1つ記述せよ",
        type:"free", subs:[{l:""}],
        model:"暇なお客様を見つけて声をかけること（マッチングやコミュニケーションにつなげる）",
        exp:"デルタのコンセプトは「暇なお客様をつくらない」ことです。フロアに出た瞬間から全体を見渡し、一人でいるお客様・スマホを見ているお客様を見つけることが最初の行動です。\n\nStep1：声をかけて自己紹介\nStep2：ダーツやゲームに誘う\nStep3：他のお客様とマッチングにつなげる",
      },
      { id:"s2q3", label:"問３", points:"全問正解で1点", section:"ご案内",
        question:"お客様来店時ご案内前に必ず確認すべき事項を4つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"},{l:"③"},{l:"④"}],
        model:"①来店経験の有無　②人数　③年齢確認（30歳未満と思われる場合）　④空席・テーブル状況の確認",
        exp:"①来店経験の有無：初来店かどうかで対応が変わります\n②人数：適切なテーブルへの案内のために必要\n③年齢確認：見た目30歳以下と思われるお客様には必ず実施\n④空席・テーブル状況：ダーツ台に近い席から優先的に案内（責任者の指示を仰ぐ）",
      },
      { id:"s2q4", label:"問４", points:"全問正解で1点", section:"ご案内",
        question:"ご新規様へのシステム説明の内容を4つ以上記入せよ",
        type:"free", subs:[{l:"①"},{l:"②"},{l:"③"},{l:"④"}],
        model:"①ノーチャージ　②ワンドリンクオーダー制　③電子・加熱式タバコのみ　④ダーツ台はどこを使ってもOK",
        exp:"①ノーチャージ：入場料・席料がかかりません\n②ワンドリンクオーダー制：お一人様一杯以上のご注文をお願いしています\n③電子・加熱式タバコのみ：フロア内は紙たばこNGです\n④ダーツ台はどこを使ってもOK：空いているダーツ台は自由に使えます\n\n■混雑時の追加説明\n「混雑時は席2時間制・ダーツ2ゲーム交代制」も伝えます。",
      },
      { id:"s2q5", label:"問５", points:"1点", section:"ご案内",
        question:"年齢確認を行う基準を記述せよ",
        type:"free", subs:[{l:""}],
        model:"見た目30歳以下と思われるお客様に必ず実施（顔写真あり1点／なし2点）",
        exp:"見た目30歳以下と思われるお客様には必ず年齢確認を実施します。「たぶん大丈夫だろう」という判断はNGです。\n\n・顔写真あり（運転免許証・パスポートなど）：1点で確認OK\n・顔写真なし（学生証など）：2点の組み合わせで確認\n\n20歳未満のお客様は18時以降の来店NG（貸切時は22時まで）",
      },
      { id:"s2q6", label:"問６", points:"1点", section:"ご案内",
        question:"ご新規、リピーター様を優先的にご案内する席の基準を記述せよ",
        type:"free", subs:[{l:""}],
        model:"ダーツ台に近い席から優先的にご案内する（責任者の指示を仰ぐ）",
        exp:"■なぜダーツ台に近い席を優先するのか\n・周囲のダーツプレイヤーとの会話が生まれやすくなる\n・スタッフからマッチングに誘いやすくなる\n・お店の雰囲気を体感しやすくなる\n\n■責任者の指示を仰ぐ理由\n予約・混雑状況・常連様の位置など、フロア全体を把握しているのは責任者です。",
      },
      { id:"s2q7", label:"問７", points:"2点", section:"注文対応",
        question:"セカンドオーダーを取りに行くべき状況を記述せよ",
        type:"free", subs:[{l:""}],
        model:"グラスの残りが少ない方がいるとき・メニューを見ている方がいるとき",
        exp:"①グラスの残りが少ない方がいるとき\n→「お代わりいかがですか？」と先に声をかける\n\n②メニューを見ている方がいるとき\n→「何かお決まりになりましたか？」と先に声をかける\n\n呼ばれてから動くのは受動的な接客です。デルタが目指すのは「気遣いのスペシャリスト」。先読みして動くことで満足度と売上の両方が上がります。",
      },
      { id:"s2q8", label:"問８", points:"2点", section:"注文対応",
        question:"注文時または提供時に行うべき行動を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①先に声をかける（「すいません」と言われたら「はい！」と返事しながらお伺い）　②提供後お客様のもとに届いているか確認する",
        exp:"■①注文時：先に声をかける\n・「すいません」と言われたら「はい！」と元気に返事をしながら向かう\n・手を上げながら行くと「気づいてくれた」という安心感を与えられます\n\n■②提供時：届いているか確認する\n「作る」だけでなく「提供確認」までが仕事です。",
      },
      { id:"s2q9", label:"問９", points:"全問正解で1点", section:"バッシング",
        question:"バッシング完了時の理想的な状態を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①卓上・床までキレイな状態　②常に初めてご案内するお席とお客様に感じさせる状態",
        exp:"①卓上・床までキレイ：グラス・ゴミの除去だけでなく、床に落ちたものも確認\n②「初めてご案内するお席」：次のお客様が気持ちよく座れる状態にリセットすること\n\n自分がお客様の立場で考えてみてください。案内されたテーブルがべたべたしている・床にゴミが落ちている……気持ちよく遊べませんよね。",
      },
      { id:"s2q10", label:"問１０", points:"全問正解で2点", section:"作業意識",
        question:"作業中、常に意識すべき事項を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①常にお客様を見られるよう顔を上げること　②バッシング・作業中もお客様・フロア全体への気配りを忘れないこと",
        exp:"■①顔を上げる\nバッシングや片付けなど下を向く作業中でも、常にお客様を視野に入れておくことが必要です。\n\n■②フロア全体への気配り\n「暇そうなお客様はいないか」「グラスが空いているテーブルはないか」を常に意識しながら動くことが求められます。",
      },
      { id:"s2q11", label:"問１１", points:"全問正解で1点", section:"環境チェック",
        question:"トイレおよび灰皿のチェックを行うべきタイミングを2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①S（セカンド）休憩に行くタイミング　②汚れがひどい場合（気づいたとき）は随時",
        exp:"「トイレは飲食店の鏡」という言葉があるように、トイレの状態がお店全体の印象を映し出します。\n\n①S（セカンド）休憩のタイミング：原則このタイミングでチェックします\n②汚れがひどい場合は随時：気づいたらすぐ対応。汚れがひどい場合は社員に報告。",
      },
      { id:"s2q12", label:"問１２", points:"全問正解で1点", section:"ダーツ業務",
        question:"次の『　』内に入る適切な語句を記入せよ",
        type:"fill",
        blanks:[
          {s:"ダーツに入るときは『　』へ確認",a:["責任者"]},
          {s:"同じお客様との連続してのダーツは『　』回までとする",a:["1"]},
          {s:"常に『　』への意識を持つこと",a:["フロア（お客様・スタッフ）"]},
          {s:"『　』がダーツ中の場合は原則入らないこと",a:["ほかのスタッフ"]},
          {s:"席の稼働率が『　』以上埋まっているときは原則入らない",a:["8割（80%）"]},
        ],
        model:"責任者へ確認／同じお客様との連続は1回まで／フロアへの意識／他スタッフがダーツ中はNG／稼働率8割以上はNG",
        exp:"①責任者へ確認：フロアの状況を把握している責任者が「今入っていいか」を判断します\n②連続は1回まで：特定のお客様との関係が深まりすぎる・他のお客様が放置されるリスク\n③フロアへの意識：ダーツ中も常にお客様・スタッフを視野に入れておく\n④他スタッフがダーツ中はNG：複数スタッフが同時に入るとフロアが手薄になる\n⑤稼働率8割以上はNG：席が埋まっているときは接客・オーダー対応を優先",
      },
      { id:"s2q13", label:"問１３", points:"全問正解で2点", section:"ダーツ業務",
        question:"ダーツに入る目的を「いまどこ通知」以外で2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①お客様とのコミュニケーション促進・新規のつながりづくり　②お客様同士のマッチングにつなげる橋渡し（初心者へのインストラクション・店内の一体感醸成）",
        exp:"■ダーツはコミュニケーションツール\n\n①コミュニケーション促進\n・新規のお客様との接点を作る\n・新規層と常連層のお客様をつなげる橋渡し\n・初心者のお客様に投げ方を教える（インストラクション）\n\n②マッチングへの橋渡し・一体感醸成\n・ダーツを通じてお客様同士を紹介し、その後のマッチングにつなげる\n\n■ご新規様と常連様、どちらを優先するか\nご新規様との方が優先度が高いです。",
      },
      { id:"s2q14", label:"問１４", points:"全問正解で2点", section:"ダーツ業務",
        question:"シングルスに入ってよい条件を2つ以上記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①責任者に確認済みであること　②他のスタッフがダーツをしていないこと　③席の稼働率が8割未満であること",
        exp:"■シングルスに入るための条件\n①責任者に確認済み：すべてのダーツ参加の前提条件\n②他スタッフがダーツ中でないこと：フロアを守るため\n③稼働率が8割未満：混んでいる時は接客優先\n\n■誰と入るかの優先順位\nご新規様・リピーター様 ＞ 常連様\n\n■断るときの対応例\n「少し落ち着くまでお待ちいただけますか？自分は入れませんが、〇〇さんが代わりに投げてくれます！」",
      },
      { id:"s2q15", label:"問１５", points:"全問正解で3点", section:"マッチング",
        question:"デルタにおけるマッチングの目的を記述せよ",
        type:"free", subs:[{l:""}],
        model:"お客様同士をつなげ、コミュニティを創ること",
        exp:"マッチングには「お客様同士をつなげ、コミュニティを創る」という意図があります。これがデルタの醍醐味です。\n\nマッチング → つながり → コミュニティ → 再来店 → 売上。この循環がデルタのビジネスモデルの核心です。",
      },
      { id:"s2q16", label:"問１６", points:"全問正解で3点", section:"マッチング",
        question:"マッチングを優先すべきお客様を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①初来店のお客様（ご新規様）　②リピーターの方",
        exp:"①ご新規様が最優先な理由\n新規のお客様はまだ誰とも繋がっていません。マッチングを通じて「知り合い」を作ることで、リピーターになってもらう確率が大幅に上がります。\n\n②リピーター様も優先すべき理由\nリピーターのお客様はまだコミュニティに完全に入れていない場合があります。\n\n■基本の組み合わせ\n初来店・リピーターの方 × 常連様をマッチングしてあげてください。",
      },
      { id:"s2q17", label:"問１７", points:"全問正解で3点", section:"マッチング",
        question:"マッチングを行う際に、必ず確認すべき事項を3つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"},{l:"③"}],
        model:"①カウンター・テーブルの暇そうなお客様を把握する　②相手のレベルを確認してハンデをつける　③常連・知り合いばかりのマッチングは極力避ける",
        exp:"①暇そうなお客様の把握：マッチングに参加してもらう候補を事前に把握\n②相手のレベル確認・ハンデ設定：実力差が大きすぎると不満・不快感を与えます。「ダーツはどのくらいやられてますか？」と確認する\n③常連・知り合いばかりのマッチングを避ける：新規・リピーターを必ず一方に含めるよう意識してください",
      },
      { id:"s2q18", label:"問１８", points:"全問正解で3点", section:"マッチング",
        question:"お客様のみのマッチングを行う際に、スタッフが必ず行うべき行動を3つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"},{l:"③"}],
        model:"①試合前にお客様を一人ずつスタッフが紹介する　②マッチング中もナイス〇〇など声掛け・盛り上げ　③絶対に無理強いをしない",
        exp:"①試合前の紹介：スタッフがお客様を一人ずつ紹介することで初対面の緊張がほぐれます\n②盛り上げ（アワード意識）：「ナイス〇〇！」などの声かけを続ける。スタッフが盛り上げることで一体感が生まれます\n③無理強いをしない：これが最重要です。断られた場合は無理に誘わないこと。「嫌な思い出」が残るとリピートしなくなります",
      },
      { id:"s2q19", label:"問１９", points:"全問正解で3点", section:"マッチング",
        question:"マッチングした試合終了後に行うべき行動を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①試合後すぐに声をかけてアフターフォローをする　②次のマッチングや再来店につなげる",
        exp:"①アフターフォロー（即座に）\n・「どうでしたか？楽しめましたか？」と感想を聞く\n・名前を呼んで話しかける\n\n②次につなげる\n・「またリベンジしてみませんか？」\n・ドリンクのセカンドオーダーを取ることで滞在時間・売上もアップ",
      },
      { id:"s2q20", label:"問２０", points:"3点", section:"マッチング",
        question:"マッチングを行わなかった場合に発生する問題を記述せよ",
        type:"free", subs:[{l:""}],
        model:"暇なお客様が生まれる・リピーターにつながらない・コミュニティが生まれず再来店率が下がる",
        exp:"・暇なお客様が生まれる → 退屈したまま帰る → 「また来たい」とならない\n・孤立したお客様は「自分の居場所がない」と感じる\n・つながりのないお客様はリピーターにならない\n・店の活気が失われ、既存の常連様も来なくなる\n\nデルタの売上の90%はリピーターによって支えられています。マッチングをしないことはリピーターを育てないことと同じです。",
      },
      { id:"s2q21", label:"問２１", points:"3点", section:"マッチング",
        question:"デルタにおいて、マッチングが売り上げにつながる理由を記述せよ",
        type:"free", subs:[{l:""}],
        model:"お客様同士がつながりコミュニティが生まれることで、知っている人がいる場所として再来店につながり、継続的な売上が生まれるから",
        exp:"■マッチングが売上に直結する3ステップ\n①マッチング → お客様同士が知り合いになる\n②知り合いがいる → 「また行きたい」という動機が生まれる\n③再来店 → ドリンク・フードの注文 → 売上\n\n■具体的な売上への連鎖\n・再来店頻度の増加\n・グループ化による友人紹介（新規獲得）\n・滞在時間の延長 → オーダー回数増加",
      },
      { id:"s2q22", label:"問２２", points:"3点", section:"マッチング",
        question:"アフターフォローはどのように行うのか、具体的に記述せよ",
        type:"free", subs:[{l:""}],
        model:"試合終了後すぐに声をかけて感想を聞く・名前を覚えて呼ぶ・次回の来店や次のマッチングを促す",
        exp:"■タイミング：試合終了後すぐ\n時間が経つほど盛り上がりが冷めます。\n\n■具体的な言葉かけ\n・「楽しめましたか？いい試合でしたね！」（感想を聞く）\n・「〇〇さん、あのショット良かったですよ！」（名前を呼んで褒める）\n・「また対戦しましょう！次はリベンジですね！」（次につなげる）\n\n■ドリンクオーダーとの連動\n「お飲み物いかがですか？」と自然にセカンドオーダーへつなげましょう。",
      },
      { id:"s2q23", label:"問２３", points:"3点", section:"マッチング",
        question:"マッチングを行う際に、お客様に対し絶対に行ってはいけないことを記述せよ",
        type:"free", subs:[{l:""}],
        model:"無理強いをしないこと",
        exp:"マッチングはあくまで「お客様の楽しみを増やすため」のものです。断られた場合に強引に誘い続けると：\n・お客様が不快に感じる\n・「嫌な思い出」として記憶に残る\n・二度と来店しなくなる可能性がある\n\n■断られたときの対応\n「そうですか、また気が向いたら声をかけてください！」と笑顔で引き下がることが大切です。",
      },
    ],
  },
  {
    id:"s3", num:"03", title:"カウンター業務", short:"カウンター", color:"#8B4000",
    questions:[
      { id:"s3q1", label:"問１", points:"1点", section:"ドリンク",
        question:"ドリンク1杯に対して作成目標時間を記述せよ",
        type:"free", subs:[{l:"（　）秒"}],
        model:"5秒",
        exp:"ドリンク作成の目標時間は5秒です。\n・お客様の待ち時間を最小化する\n・複数のオーダーをさばける\n\n「作る」だけでなく、お客様のもとに届いているかを確認することが仕事の完了です。",
      },
      { id:"s3q2", label:"問２", points:"1点", section:"フード",
        question:"フード1品作成目標時間を記述せよ",
        type:"free", subs:[{l:"（　）分"}],
        model:"マニュアルへの明記なし。レシピ通りに速やかに作成し、提供確認まで行う",
        exp:"フード作成については具体的な目標時間の明記はありません。重要なのは：\n①グランドメニューのフードをレシピ通りに作ること\n②作成後、提供確認までが仕事であること\n③オリジナルフードは絶対に作らないこと",
      },
      { id:"s3q3", label:"問３", points:"1点", section:"フード",
        question:"フード作成時、やってはいけないことを記述せよ",
        type:"free", subs:[{l:""}],
        model:"オリジナルフードを作ること（俗人化したものにしないため）",
        exp:"「俗人化」とは「特定の人だけができる状態」のことです。Aさんが作ると美味しいがBさんが作ると違う味、という状態はお店の品質管理として問題があります。\n\n■基本ルール\n・グランドメニューのフードをレシピ通りに作成する\n・わからないことは必ず確認する（「たぶんこうだろう」はNG）",
      },
      { id:"s3q4", label:"問４", points:"全問正解で2点", section:"カウンター全般",
        question:"カウンター業務中に意識すべき事項を2つ記述せよ",
        type:"free", subs:[{l:"①"},{l:"②"}],
        model:"①他のお客様とのマッチング斡旋　②カウンター全員を巻き込んだ会話を心がけること（特定の常連だけと話さない）",
        exp:"■カウンターはフロアの「司令塔」\n\n①マッチング斡旋の役割\n・暇そうなお客様をホールスタッフにこっそり伝える\n・マッチングの指示を出す\n\n②カウンター全員を巻き込んだ会話\n特定の常連様だけと盛り上がることは他のお客様を放置することになります。",
      },
      { id:"s3q5", label:"問５", points:"全問正解で2点", section:"電話応対",
        question:"電話応対の流れについて『　』内を記述せよ",
        type:"fill",
        blanks:[
          {s:"『　』コール以内に出て、『　』という",a:["3","お電話ありがとうございます ダーツカフェデルタ〇〇店（苗字）がお受けいたします"]},
          {s:"電話に出るときはお客様に対し『　』を意識する",a:["元気で明るい声（笑顔）"]},
          {s:"その場での対応ができない内容であった場合：『　』",a:["確認いたします！といってすぐ保留"]},
        ],
        model:"3コール以内／「お電話ありがとうございます ダーツカフェデルタ〇〇店（苗字）がお受けいたします！」／元気で明るい声（笑顔）／「確認いたします！」ですぐ保留",
        exp:"■3コール以内に出る理由\n3コール以上待たせると「電話に出てくれない」という印象を与えます。\n\n■第一声\n「お電話ありがとうございます ダーツカフェデルタ〇〇店（苗字）がお受けいたします！」\n※元気で明るい声で言うことが重要。笑顔で話すと声のトーンが上がります。\n\n■わからない内容への対応\n「確認いたします！」と言ってすぐ保留。「わかりません」はNGです。",
      },
    ],
  },
  {
    id:"s4", num:"04", title:"ケーススタディ", short:"ケース", color:"#8B0000",
    questions:[
      { id:"s4q1", label:"問題①", points:"5点", section:"状況判断",
        question:"土曜日21時、席稼働率70%。以下の状況において、あなたの行動の優先順位を第1〜第3まで記述し、その理由も記述せよ。\n【状況】・常連2名がスタッフにダーツを求めている　・新規2名が着席したがスマホを見ている　・常連4名が対戦中　・ドリンク空きグラスが2卓ある",
        type:"free", subs:[{l:"第1優先（行動と理由）"},{l:"第2優先（行動と理由）"},{l:"第3優先（行動と理由）"}],
        model:"第1：新規2名への声かけ・自己紹介とマッチング誘導\n第2：ドリンク空きグラス2卓へのセカンドオーダー確認\n第3：常連へのダーツ対応（稼働率70%は8割未満なのでOK）",
        exp:"■第1優先：新規2名への声かけ\n「スマホを見ている」＝暇のサイン。「暇なお客様をつくらない」原則が最優先。\n\n■第2優先：ドリンク空きグラスへの対応\nセカンドオーダーは売上に直結します。\n\n■第3優先：常連へのダーツ対応\n稼働率70%は8割未満なのでルール上はOK。ただし新規対応・オーダー対応が終わってから。",
      },
      { id:"s4q2", label:"問題②", points:"5点", section:"状況判断",
        question:"新規のお客様2名にマッチングを行い、対戦が終了した。この後、売上と再来店率を最大化するために行うべき行動を具体的に記述せよ。",
        type:"free", subs:[{l:""}],
        model:"試合後すぐに声をかけて感想を聞く・名前を覚えて呼ぶ・お互いを紹介し繋がりを作る・次のマッチングや再来店を促す・ドリンクのセカンドオーダーを取る",
        exp:"①声をかけて感想を聞く（「楽しめましたか？」）\n②名前を呼んで褒める（「〇〇さん、あのショット良かったですよ！」）\n③お客様同士を改めて紹介する（つながりを確認・強化）\n④次のマッチングや来店を促す（「また来週も来てください！」）\n⑤ドリンクのセカンドオーダーを取る（売上アップ）",
      },
      { id:"s4q3", label:"問題③", points:"5点", section:"状況判断",
        question:"フロアが忙しい状況で、他スタッフは常連とダーツをしており、新規のお客様が1人でスマホを見ている。あなたはどのように行動するか。「自分の行動」のみを具体的に記述せよ。",
        type:"free", subs:[{l:""}],
        model:"他スタッフに常連とのダーツを切り上げて新規のお客様に声をかけるよう伝える。もしくは自分で手を止めて新規のお客様に声をかけて自己紹介・マッチングへ誘導する",
        exp:"■この状況の問題点\n・他スタッフが常連とダーツをしている → 新規より常連優先（本来は逆）\n・新規のお客様がスマホを見ている → 暇のサイン・放置状態\n\n■正しい対応\n【選択肢A】他スタッフへの指示：「常連さんとのダーツを一度中断して、あちらの新規のお客様に声をかけてきてください」\n【選択肢B】自分で動く：手を止めて新規のお客様のもとへ行き、自己紹介・声かけ・マッチングへの誘導を行う",
      },
      { id:"s4q4", label:"問題④", points:"5点", section:"総合",
        question:"デルタにおいて、顧客満足度を高めるためにスタッフが最も優先して行うべき行動は何か。また、それが売上にどのように繋がるか記述せよ。",
        type:"free", subs:[{l:""}],
        model:"最優先行動：暇なお客様をつくらないこと（積極的な声かけ・自己紹介・マッチング）。売上への連結：コミュニティが生まれることで再来店率が上がり、継続的な売上につながる。",
        exp:"■最優先行動：「暇なお客様をつくらない」\n①積極的な声かけ・自己紹介（出勤直後から）\n②マッチングによるお客様同士のつながり作り\n③試合後のアフターフォロー\n\n■売上への連鎖\n満足度向上 → 再来店 → 友人紹介（新規獲得） → 滞在時間延長 → オーダー増加 → 売上アップ",
      },
    ],
  },
];

async function aiJudge(q, model, answer) {
  const res = await fetch("/api/judge", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:300,
      system:`あなたはダーツバー「DELTA」の研修テスト採点者です。以下のJSON形式のみで返答してください。他テキスト不要。
{"result":"correct"|"partial"|"incorrect","comment":"採点コメント（日本語・60字以内）"}
correct=核心を含む（表現違いOK）、partial=一部正解・重要要素が不足、incorrect=大きく外れ・未回答`,
      messages:[{role:"user",content:`問題:${q}\n模範解答:${model}\n回答:${answer||"（未回答）"}\n\n採点の注意事項：\n・表現の細かいずれ（「未満」「以下」など）は許容してください\n・証明書の点数条件（写真あり1点・なし2点）など細かい付帯条件が抜けていても、核心が合っていればcorrectとしてください\n・核心となる概念・行動が含まれていれば正解とし、枝葉の補足情報の有無で減点しないでください`}]
    })
  });
  const d = await res.json();
  const t = d.content?.[0]?.text||"{}";
  try { return JSON.parse(t.replace(/```json|```/g,"").trim()); }
  catch { return {result:"incorrect",comment:"採点エラーが発生しました"}; }
}

const RC = {
  correct:  {c:"#1756B8",bg:"#EBF1FD",bd:"#B8CFFA",tc:"#0E419A",icon:"✓",lbl:"正解"},
  partial:  {c:"#C27000",bg:"#FFF4E0",bd:"#FFD98A",tc:"#9A5800",icon:"△",lbl:"惜しい"},
  incorrect:{c:"#B51B1B",bg:"#FEF0F0",bd:"#F9B8B8",tc:"#8A1111",icon:"✗",lbl:"不正解"},
};

// ── Confetti ────────────────────────────────────────────────────────
function Confetti({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({length:60},()=>({
      x: Math.random()*canvas.width, y: -10,
      r: Math.random()*6+3,
      d: Math.random()*10+5,
      color: ["#1756B8","#34D399","#FBBF24","#F87171","#A78BFA"][Math.floor(Math.random()*5)],
      vx: (Math.random()-0.5)*3, vy: Math.random()*3+2,
      angle: Math.random()*360, spin: (Math.random()-0.5)*6,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
        ctx.restore();
        p.x+=p.vx; p.y+=p.vy; p.angle+=p.spin;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(()=>cancelAnimationFrame(raf),1800);
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(t); };
  },[active]);
  if (!active) return null;
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:9999}} />;
}

// ── Streak Toast ────────────────────────────────────────────────────
function StreakToast({ streak }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{
    if (streak>=3){ setVis(true); const t=setTimeout(()=>setVis(false),2200); return()=>clearTimeout(t); }
  },[streak]);
  if (!vis) return null;
  const msgs = {3:"🔥 3問連続正解！",5:"⚡ 5問連続正解！すごい！",10:"🏆 10問連続正解！完璧！"};
  const msg = msgs[streak]||(streak>10?"🌟 連続正解継続中！":"");
  if (!msg) return null;
  return (
    <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"#1A1E2E",color:"#fff",padding:"10px 22px",borderRadius:30,fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",animation:"toast .3s ease",whiteSpace:"nowrap"}}>
      {msg}
    </div>
  );
}

// ── Section Complete ────────────────────────────────────────────────
function SectionComplete({ show, secTitle, onNext }) {
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,14,30,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}} className="fadeIn">
      <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",textAlign:"center",maxWidth:300,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:"#1756B8",marginBottom:8}}>SECTION COMPLETE</div>
        <div style={{fontSize:18,fontWeight:700,color:"#1A1E2E",marginBottom:6}}>{secTitle}</div>
        <div style={{fontSize:13,color:"#8A94AC",marginBottom:24}}>このセクションが完了しました！</div>
        <button style={{background:"#1756B8",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={onNext}>
          次へ進む →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]   = useState("home");
  const [selSecs, setSelSecs] = useState(new Set(SECTIONS.map(s=>s.id)));
  const [queue, setQueue]     = useState([]);
  const [idx, setIdx]         = useState(0);
  const [inputs, setInputs]   = useState({});
  const [judging, setJudging] = useState(false);
  const [fb, setFb]           = useState(null);
  const [showEx, setShowEx]   = useState(false);
  const [results, setResults] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [ck, setCk]           = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [streak, setStreak]   = useState(0);
  const [secDone, setSecDone] = useState(false);
  const [bookmarkOnly, setBookmarkOnly] = useState(false);
  const bodyRef = useRef(null);

  const Q = queue[idx];
  const cor = results.filter(r=>r.result==="correct").length;
  const par = results.filter(r=>r.result==="partial").length;
  const wrg = results.filter(r=>r.result==="incorrect").length;
  const totalQ = SECTIONS.filter(s=>selSecs.has(s.id)).flatMap(s=>s.questions).length;
  const bmCount = bookmarks.size;

  function buildQueue(bkmOnly=false) {
    let qs = SECTIONS.filter(s=>selSecs.has(s.id)).flatMap(s=>s.questions.map(q=>({...q,sc:s.color,st:s.title,sn:s.num})));
    if (bkmOnly) qs = qs.filter(q=>bookmarks.has(q.id));
    return qs;
  }

  function start(bkmOnly=false) {
    const qs = buildQueue(bkmOnly);
    setQueue(qs); setIdx(0); setInputs({}); setFb(null); setShowEx(false);
    setResults([]); setCk(k=>k+1); setStreak(0); setSecDone(false);
    setBookmarkOnly(bkmOnly); setScreen("quiz");
  }

  const gi = k=>inputs[k]||"";
  const si = (k,v)=>setInputs(p=>({...p,[k]:v}));

  function collect(q) {
    if (q.type==="fill") return q.blanks.map((b,bi)=>b.a.map((_,ai)=>gi(`${q.id}_b${bi}_${ai}`)).join("・")).join(" / ");
    return (q.subs||[]).map((_,i)=>gi(`${q.id}_f${i}`)).filter(Boolean).join(" ／ ");
  }
  function autoFill(q) {
    let w=0,tot=0;
    q.blanks.forEach((b,bi)=>b.a.forEach((a,ai)=>{
      tot++;
      const v=gi(`${q.id}_b${bi}_${ai}`).trim();
      const c=a.replace(/（.*?）/g,"").trim();
      if (!v||(!v.includes(c)&&!c.includes(v))) w++;
    }));
    if (w===0) return {result:"correct",comment:"全ての空欄が正解です！"};
    if (w<tot)  return {result:"partial",comment:`${w}箇所が不正解です。解説を確認してください。`};
    return {result:"incorrect",comment:"不正解です。解説で正解を確認してください。"};
  }

  async function judge() {
    setJudging(true); setFb(null);
    try {
      const r = Q.type==="fill" ? autoFill(Q) : await aiJudge(Q.question,Q.model,collect(Q));
      setFb(r);
      setResults(p=>[...p,{...r,qLabel:Q.label,q:Q.question.slice(0,28),qId:Q.id}]);
      // streak
      if (r.result==="correct") {
        const ns = streak+1;
        setStreak(ns);
        setConfetti(true); setTimeout(()=>setConfetti(false),100);
      } else {
        setStreak(0);
      }
      // section complete check
      const nextIdx = idx+1;
      if (nextIdx < queue.length && queue[nextIdx].sn !== Q.sn) {
        setTimeout(()=>setSecDone(true), 400);
      }
    } catch { setFb({result:"incorrect",comment:"通信エラーが発生しました"}); setStreak(0); }
    setJudging(false);
  }

  function next() {
    setSecDone(false);
    if (idx+1>=queue.length){ setScreen("result"); return; }
    setIdx(i=>i+1); setInputs({}); setFb(null); setShowEx(false); setCk(k=>k+1);
    setTimeout(()=>bodyRef.current?.scrollTo({top:0,behavior:"smooth"}),50);
  }

  function toggleBookmark(id) {
    setBookmarks(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  const scorePct = results.length ? Math.round(((cor+par*0.5)/queue.length)*100) : 0;
  const prog = queue.length ? ((idx+(fb?1:0))/queue.length)*100 : 0;
  const acc = Q?.sc||"#1756B8";
  const fbC = fb?RC[fb.result]:null;

  // weak sections for result
  const sectionStats = SECTIONS.map(s=>{
    const sqIds = s.questions.map(q=>q.id);
    const sRes = results.filter(r=>sqIds.includes(r.qId));
    const sc = sRes.length ? Math.round(((sRes.filter(r=>r.result==="correct").length + sRes.filter(r=>r.result==="partial").length*0.5)/sRes.length)*100) : null;
    return {...s, score:sc, count:sRes.length};
  }).filter(s=>s.count>0);

  // ── HOME ──────────────────────────────────────────────────────────
  if (screen==="home") return (
    <div style={S.page}>
      <div style={S.hWrap}>
        <header style={S.hHdr}>
          <div style={S.hBrand}>
            <div style={S.hLogo}>D</div>
            <div>
              <div style={S.hBrandName}>DELTA Training System</div>
              <div style={S.hBrandSub}>昇給テスト 学習モード — AI即時採点対応</div>
            </div>
          </div>
        </header>
        <div style={S.hDiv}/>
        <div style={S.hSecLbl}>学習セクションを選択</div>
        <div style={S.hSecList}>
          {SECTIONS.map(s=>{
            const on=selSecs.has(s.id);
            return (
              <button key={s.id} style={{...S.hSecRow,...(on?{borderColor:s.color,background:`${s.color}07`}:{})}}
                onClick={()=>setSelSecs(p=>{const n=new Set(p);if(n.has(s.id)){if(n.size>1)n.delete(s.id);}else n.add(s.id);return n;})}>
                <div style={{...S.hSecBar,background:on?s.color:"#DDE2EC"}}/>
                <div style={S.hSecMain}>
                  <div style={{...S.hSecNum,color:on?s.color:"#BCC5D6"}}>{s.num}</div>
                  <div style={{...S.hSecTitle,color:on?"#1A1E2E":"#9AA3B4"}}>{s.title}</div>
                </div>
                <div style={S.hSecR}>
                  <div style={{...S.hSecQ,color:on?s.color:"#BCC5D6"}}>{s.questions.length}問</div>
                  <div style={{...S.hChk,background:on?s.color:"#EEF1F7",color:on?"#fff":"#C0C8D6"}}>{on?"✓":"+"}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={S.hFt}>
          <div style={S.hFtL}>
            <span style={S.hFtN}>{totalQ}</span><span style={S.hFtU}>問</span>
            <span style={S.hDot}/>
            <span style={S.hFtSub}>{selSecs.size}セクション</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            {bmCount>0&&(
              <button style={{...S.hBmBtn}} onClick={()=>start(true)}>
                🔖 苦手のみ ({bmCount})
              </button>
            )}
            <button style={S.hStartBtn} onClick={()=>start(false)}>学習を開始 →</button>
          </div>
        </div>
      </div>
      <style>{G}</style>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  if (screen==="result") return (
    <div style={S.page}>
      <div style={S.rWrap}>
        <div style={S.rTop}>
          <div style={S.rEye}>TRAINING RESULT</div>
          <div style={S.rPct}>{scorePct}<span style={S.rPctU}>%</span></div>
          <div style={S.rSub}>{queue.length}問 — 正解{cor} / 惜しい{par} / 不正解{wrg}</div>
        </div>

        {/* Stat cards */}
        <div style={S.rStats}>
          {(["correct","partial","incorrect"]).map(k=>{
            const c=RC[k],v=results.filter(r=>r.result===k).length;
            return (
              <div key={k} style={{...S.rStatC,background:c.bg,border:`1px solid ${c.bd}`}}>
                <div style={{fontSize:20,color:c.c,marginBottom:4}}>{c.icon}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:28,fontWeight:900,color:c.tc,lineHeight:1,marginBottom:4}}>{v}</div>
                <div style={{fontSize:11,fontWeight:700,color:c.c,letterSpacing:".06em"}}>{c.lbl}</div>
              </div>
            );
          })}
        </div>

        {/* Section bar chart */}
        {sectionStats.length>1&&(
          <div style={S.rChartBox}>
            <div style={S.rChartTitle}>セクション別正答率</div>
            {sectionStats.map(s=>(
              <div key={s.id} style={S.rChartRow}>
                <div style={{...S.rChartLbl,color:s.score<50?"#B51B1B":s.score<80?"#C27000":"#0A7C5C"}}>{s.short}</div>
                <div style={S.rChartTrack}>
                  <div style={{...S.rChartFill,width:`${s.score||0}%`,background:s.color}}/>
                </div>
                <div style={{...S.rChartPct,color:s.color}}>{s.score??"-"}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Result list */}
        <div style={S.rList}>
          <div style={S.rListHd}>
            <span style={{minWidth:56,fontSize:11,fontWeight:700,color:"#8A94AC"}}>判定</span>
            <span style={{fontSize:11,fontWeight:700,color:"#8A94AC"}}>問題</span>
            <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:"#8A94AC"}}>苦手</span>
          </div>
          {results.map((r,i)=>{
            const c=RC[r.result];
            const bm=bookmarks.has(r.qId);
            return (
              <div key={i} style={{...S.rRow,borderLeftColor:c.c}}>
                <span style={{...S.rRBadge,color:c.tc,background:c.bg,border:`1px solid ${c.bd}`}}>{c.icon} {c.lbl}</span>
                <span style={{fontSize:12,color:"#6A7490",flex:1}}>{r.qLabel}. {r.q}…</span>
                <button style={{...S.bmBtn,color:bm?"#F59E0B":"#CCC"}} onClick={()=>toggleBookmark(r.qId)}>{bm?"🔖":"🏷️"}</button>
              </div>
            );
          })}
        </div>

        <div style={S.rBtns}>
          <button style={S.rBtnO} onClick={()=>setScreen("home")}>← 戻る</button>
          {bmCount>0&&<button style={{...S.rBtnF,background:"#C27000"}} onClick={()=>start(true)}>🔖 苦手再挑戦</button>}
          <button style={{...S.rBtnF,background:"#1756B8"}} onClick={()=>start(false)}>もう一度 →</button>
        </div>
      </div>
      <style>{G}</style>
    </div>
  );

  // ── QUIZ ──────────────────────────────────────────────────────────
  if (!Q) return null;
  const isBm = bookmarks.has(Q.id);

  return (
    <div style={S.page}>
      <Confetti active={confetti}/>
      <StreakToast streak={streak}/>
      <SectionComplete show={secDone} secTitle={Q.st} onNext={next}/>

      {/* Progress bar */}
      <div style={S.pBar}><div style={{...S.pFill,width:`${prog}%`,background:acc}}/></div>

      {/* Nav */}
      <div style={S.nav}>
        <button style={S.navClose} onClick={()=>setScreen("home")}>✕</button>
        <div style={S.navMid}>
          <span style={{...S.navBadge,color:acc,background:`${acc}0F`,border:`1px solid ${acc}30`}}>{Q.sn} {Q.st}</span>
          {Q.section&&<span style={S.navSec}>{Q.section}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button style={{...S.bmBtn,color:isBm?"#F59E0B":"#CCC",fontSize:18}} onClick={()=>toggleBookmark(Q.id)} title="苦手マーク">
            {isBm?"🔖":"🏷️"}
          </button>
          <span style={S.navCnt}>{idx+1}<span style={{color:"#BCC5D6",fontWeight:400}}>/{queue.length}</span></span>
        </div>
      </div>

      {/* Score strip */}
      <div style={S.strip}>
        {[["correct","✓"],["partial","△"],["incorrect","✗"]].map(([k,ic])=>(
          <span key={k} style={{...S.chip,color:RC[k].tc,background:RC[k].bg,border:`1px solid ${RC[k].bd}`}}>
            {ic}{results.filter(r=>r.result===k).length}
          </span>
        ))}
        {streak>=2&&<span style={S.streakBadge}>🔥{streak}連続</span>}
        <span style={S.stripR}>残り{queue.length-idx-1}問</span>
      </div>

      {/* Scrollable body */}
      <div ref={bodyRef} style={S.body}>
        {/* Question card */}
        <div key={`q${ck}`} style={{...S.qCard,borderTopColor:acc}} className="su">
          <div style={S.qHdr}>
            <span style={{...S.qLbl,color:acc}}>{Q.label}</span>
            <span style={S.qPts}>{Q.points}</span>
          </div>
          <p style={S.qTxt}>
            {Q.question.split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
          </p>

          {Q.type==="fill"&&(
            <div style={S.fillWrap}>
              {Q.blanks.map((b,bi)=>(
                <div key={bi} style={S.fillRow}>
                  <p style={S.fillTxt}>
                    {b.s.split("『　』").map((p,pi,arr)=>(
                      <span key={pi}>{p}{pi<arr.length-1&&(
                        <input className="bi"
                          style={{...S.bi,borderBottomColor:fb?(gi(`${Q.id}_b${bi}_${pi}`).trim()?RC.correct.c:RC.incorrect.c):acc}}
                          value={gi(`${Q.id}_b${bi}_${pi}`)}
                          onChange={e=>si(`${Q.id}_b${bi}_${pi}`,e.target.value)}
                          disabled={!!fb}
                        />
                      )}</span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          )}

          {Q.type==="free"&&(
            <div style={S.freeWrap}>
              {(Q.subs||[]).map((sub,fi)=>(
                <div key={fi} style={S.freeItem}>
                  {sub.l&&<div style={{...S.freeLbl,color:acc}}>{sub.l}</div>}
                  <textarea style={{...S.ta,outlineColor:acc}}
                    rows={2}
                    value={gi(`${Q.id}_f${fi}`)}
                    onChange={e=>si(`${Q.id}_f${fi}`,e.target.value)}
                    disabled={!!fb}
                    placeholder="こちらに記述してください"
                  />
                </div>
              ))}
            </div>
          )}

          {!fb&&(
            <div style={S.judgeWrap}>
              <button style={{...S.judgeBtn,background:judging?"#9AAABB":acc}} onClick={judge} disabled={judging}>
                {judging?<><span style={S.spin}/>AI採点中…</>:"採点する →"}
              </button>
            </div>
          )}
        </div>

        {/* Feedback card */}
        {fb&&fbC&&(
          <div key={`fb${ck}`} style={{...S.fbCard,background:fbC.bg,border:`1.5px solid ${fbC.bd}`}} className="su">
            <div style={S.fbTop}>
              <div style={{...S.fbBadge,color:fbC.tc,background:"#fff",border:`1.5px solid ${fbC.bd}`}}>
                <span style={{fontSize:15}}>{fbC.icon}</span>{fbC.lbl}
              </div>
              <p style={{...S.fbMsg,color:fbC.tc}}>{fb.comment}</p>
            </div>
            <button style={{...S.exBtn,color:fbC.tc,borderColor:fbC.bd}} onClick={()=>setShowEx(p=>!p)}>
              {showEx?"▲ 解説を閉じる":"▼ 模範解答と解説を確認する"}
            </button>
            {showEx&&(
              <div style={S.exBox} className="ed">
                <div style={{...S.exHd,color:fbC.tc,borderLeftColor:fbC.c}}>模範解答</div>
                <p style={S.exModel}>{Q.model}</p>
                <div style={{...S.exHd,color:fbC.tc,borderLeftColor:fbC.c,marginTop:18}}>解説</div>
                <p style={S.exBody}>{Q.exp}</p>
              </div>
            )}
            <button style={{...S.nextBtn,background:acc}} onClick={next}>
              {idx+1>=queue.length?"結果を見る →":"次の問題 →"}
            </button>
          </div>
        )}
        <div style={{height:20}}/>
      </div>

      <style>{G}</style>
    </div>
  );
}

const G=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#EFF1F7;font-family:'Noto Sans JP','Inter',sans-serif;}
  textarea,input,button{font-family:'Noto Sans JP','Inter',sans-serif;}
  textarea:focus{outline:2px solid;outline-offset:1px;border-radius:7px;}
  input:focus{outline:none;}
  textarea::placeholder{color:#B8C2D4;font-size:13px;}
  button{cursor:pointer;}
  button:hover{opacity:.87;}
  button:active{transform:scale(.985);}
  .su{animation:su .3s cubic-bezier(.22,1,.36,1) both;}
  @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .ed{animation:ed .2s ease both;}
  @keyframes ed{from{opacity:0}to{opacity:1}}
  .fadeIn{animation:fi .2s ease both;}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  @keyframes sp{to{transform:rotate(360deg)}}
  @keyframes toast{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  .bi{transition:border-bottom-color .2s;}
`;

const S={
  page:{minHeight:"100vh",background:"#EFF1F7",paddingBottom:0},
  // HOME
  hWrap:{maxWidth:560,margin:"0 auto",padding:"28px 18px 40px"},
  hHdr:{marginBottom:18},
  hBrand:{display:"flex",alignItems:"center",gap:14},
  hLogo:{width:44,height:44,borderRadius:11,background:"#1756B8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,fontFamily:"'Inter',sans-serif",flexShrink:0,boxShadow:"0 2px 8px #1756B840"},
  hBrandName:{fontSize:15,fontWeight:800,color:"#1A1E2E",letterSpacing:"-.01em"},
  hBrandSub:{fontSize:11,color:"#7A85A0",marginTop:2,fontWeight:500},
  hDiv:{height:1,background:"#DDE2EE",margin:"18px 0"},
  hSecLbl:{fontSize:11,fontWeight:700,color:"#8A94AC",letterSpacing:".1em",textTransform:"uppercase",marginBottom:9},
  hSecList:{display:"flex",flexDirection:"column",gap:7,marginBottom:20},
  hSecRow:{display:"flex",alignItems:"center",background:"#fff",border:"1.5px solid #E2E7F2",borderRadius:11,overflow:"hidden",padding:0,textAlign:"left",transition:"border-color .15s,background .15s"},
  hSecBar:{width:4,alignSelf:"stretch",flexShrink:0,transition:"background .15s"},
  hSecMain:{flex:1,display:"flex",alignItems:"center",gap:11,padding:"13px 13px"},
  hSecNum:{fontSize:10,fontWeight:900,fontFamily:"'Inter',sans-serif",letterSpacing:".1em",minWidth:20},
  hSecTitle:{fontSize:14,fontWeight:700},
  hSecR:{display:"flex",alignItems:"center",gap:9,paddingRight:12},
  hSecQ:{fontSize:12,fontWeight:700},
  hChk:{width:21,height:21,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,transition:"background .15s,color .15s"},
  hFt:{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",borderRadius:13,padding:"16px 18px",border:"1px solid #DDE2EE",boxShadow:"0 1px 3px #1756B810"},
  hFtL:{display:"flex",alignItems:"baseline",gap:4},
  hFtN:{fontFamily:"'Inter',sans-serif",fontSize:34,fontWeight:900,color:"#1A1E2E",lineHeight:1},
  hFtU:{fontSize:13,fontWeight:600,color:"#8A94AC"},
  hDot:{width:1,height:16,background:"#DDE2EE",margin:"0 9px",alignSelf:"center"},
  hFtSub:{fontSize:12,color:"#8A94AC",fontWeight:500},
  hBmBtn:{padding:"11px 14px",background:"#FFF4E0",border:"1.5px solid #FFD98A",borderRadius:9,fontSize:13,fontWeight:700,color:"#9A5800"},
  hStartBtn:{padding:"11px 20px",background:"#1756B8",color:"#fff",border:"none",borderRadius:9,fontSize:14,fontWeight:700,boxShadow:"0 2px 8px #1756B840"},
  // PROGRESS
  pBar:{height:4,background:"#DDE2EE",position:"sticky",top:0,zIndex:200,overflow:"hidden"},
  pFill:{height:"100%",transition:"width .4s cubic-bezier(.22,1,.36,1)"},
  // NAV
  nav:{display:"flex",alignItems:"center",background:"#fff",borderBottom:"1px solid #E8ECF5",padding:"9px 14px",gap:8,position:"sticky",top:4,zIndex:100},
  navClose:{background:"none",border:"1px solid #DDE2EE",borderRadius:7,color:"#8A94AC",fontSize:12,fontWeight:600,padding:"5px 9px"},
  navMid:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2},
  navBadge:{fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20,letterSpacing:".04em"},
  navSec:{fontSize:10,color:"#9AA3B8",fontWeight:600},
  navCnt:{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:800,color:"#1A1E2E",flexShrink:0},
  bmBtn:{background:"none",border:"none",fontSize:16,padding:"2px 4px",lineHeight:1},
  // STRIP
  strip:{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:"#F7F8FC",borderBottom:"1px solid #E8ECF5",flexWrap:"wrap"},
  chip:{fontSize:12,fontWeight:700,padding:"2px 9px",borderRadius:12},
  streakBadge:{fontSize:12,fontWeight:700,color:"#92400E",background:"#FEF3C7",border:"1px solid #FDE68A",padding:"2px 9px",borderRadius:12},
  stripR:{marginLeft:"auto",fontSize:11,color:"#8A94AC",fontWeight:600},
  // BODY — scrollable, padding-bottom for fixed button space
  body:{maxWidth:640,margin:"0 auto",padding:"14px 13px 0",display:"flex",flexDirection:"column",gap:11,overflowY:"auto",maxHeight:"calc(100vh - 120px)"},
  // QUESTION CARD
  qCard:{background:"#fff",borderRadius:15,padding:"20px 18px 16px",borderTop:"4px solid",boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.04)"},
  qHdr:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},
  qLbl:{fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase"},
  qPts:{fontSize:11,fontWeight:600,color:"#8A94AC",background:"#F0F2F8",padding:"2px 9px",borderRadius:9},
  qTxt:{fontSize:15,fontWeight:700,color:"#1A1E2E",lineHeight:2,marginBottom:18},
  // FILL
  fillWrap:{display:"flex",flexDirection:"column",gap:7,marginBottom:16},
  fillRow:{background:"#F7F8FC",borderRadius:9,padding:"11px 13px",border:"1px solid #E8ECF5"},
  fillTxt:{fontSize:13.5,color:"#3A4260",lineHeight:2.9},
  bi:{display:"inline-block",minWidth:76,padding:"1px 5px",background:"transparent",border:"none",borderBottom:"2.5px solid",color:"#1A1E2E",fontSize:14,fontWeight:700,marginInline:4,textAlign:"center"},
  // FREE
  freeWrap:{display:"flex",flexDirection:"column",gap:9,marginBottom:16},
  freeItem:{},
  freeLbl:{fontSize:12,fontWeight:800,marginBottom:4},
  ta:{width:"100%",padding:"9px 12px",border:"1.5px solid #DDE2EE",borderRadius:8,fontSize:14,resize:"none",lineHeight:1.85,background:"#FAFBFD",color:"#1A1E2E",transition:"border-color .15s"},
  // JUDGE — sticky at bottom
  judgeWrap:{position:"sticky",bottom:0,background:"#fff",paddingTop:12,marginTop:4},
  judgeBtn:{width:"100%",padding:"13px",border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:".03em",transition:"background .2s",boxShadow:"0 2px 8px rgba(0,0,0,.12)"},
  spin:{display:"inline-block",width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"sp .7s linear infinite"},
  // FEEDBACK
  fbCard:{borderRadius:15,padding:"20px 18px",boxShadow:"0 2px 10px rgba(0,0,0,.06)"},
  fbTop:{marginBottom:12},
  fbBadge:{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:800,padding:"4px 14px",borderRadius:20,marginBottom:9},
  fbMsg:{fontSize:14,fontWeight:500,lineHeight:1.75},
  exBtn:{width:"100%",padding:"9px 13px",border:"1px solid",borderRadius:8,fontSize:12,fontWeight:700,background:"#fff",marginBottom:12,letterSpacing:".02em"},
  exBox:{background:"#fff",borderRadius:11,padding:"16px",marginBottom:14,border:"1px solid #E2E7F0"},
  exHd:{fontSize:10,fontWeight:800,letterSpacing:".14em",marginBottom:7,paddingLeft:9,borderLeft:"3px solid",textTransform:"uppercase"},
  exModel:{fontSize:14,color:"#1A1E2E",fontWeight:600,lineHeight:1.95,whiteSpace:"pre-wrap"},
  exBody:{fontSize:13,color:"#4A5270",lineHeight:2,whiteSpace:"pre-wrap"},
  nextBtn:{width:"100%",padding:"13px",border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:"#fff",letterSpacing:".03em",boxShadow:"0 2px 8px rgba(0,0,0,.12)"},
  // RESULT
  rWrap:{maxWidth:540,margin:"0 auto",padding:"36px 18px 60px"},
  rTop:{marginBottom:24,paddingBottom:20,borderBottom:"1px solid #DDE2EE"},
  rEye:{fontSize:10,fontWeight:800,letterSpacing:".18em",color:"#1756B8",background:"#EBF1FD",display:"inline-block",padding:"3px 12px",borderRadius:20,marginBottom:12},
  rPct:{fontFamily:"'Inter',sans-serif",fontSize:72,fontWeight:900,color:"#1A1E2E",lineHeight:1,marginBottom:4},
  rPctU:{fontSize:22,color:"#8A94AC",fontWeight:500,marginLeft:2},
  rSub:{fontSize:13,color:"#8A94AC",fontWeight:500},
  rStats:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:18},
  rStatC:{borderRadius:12,padding:"16px 8px",textAlign:"center"},
  rChartBox:{background:"#fff",borderRadius:13,padding:"16px",border:"1px solid #DDE2EE",marginBottom:16},
  rChartTitle:{fontSize:11,fontWeight:700,color:"#8A94AC",letterSpacing:".08em",marginBottom:12},
  rChartRow:{display:"flex",alignItems:"center",gap:10,marginBottom:9},
  rChartLbl:{fontSize:12,fontWeight:700,minWidth:44},
  rChartTrack:{flex:1,height:8,background:"#EEF1F7",borderRadius:99,overflow:"hidden"},
  rChartFill:{height:"100%",borderRadius:99,transition:"width .6s ease"},
  rChartPct:{fontSize:12,fontWeight:700,minWidth:32,textAlign:"right"},
  rList:{background:"#fff",borderRadius:12,overflow:"hidden",border:"1px solid #DDE2EE",marginBottom:18,maxHeight:300,overflowY:"auto"},
  rListHd:{display:"flex",gap:10,padding:"8px 13px",background:"#F0F3FB",borderBottom:"1px solid #DDE2EE",alignItems:"center"},
  rRow:{display:"flex",alignItems:"center",gap:9,padding:"8px 13px",borderBottom:"1px solid #F0F3FB",borderLeft:"3px solid"},
  rRBadge:{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:9,flexShrink:0},
  rBtns:{display:"flex",gap:8,flexWrap:"wrap"},
  rBtnO:{flex:1,padding:"12px",background:"#fff",border:"1.5px solid #DDE2EE",borderRadius:10,fontSize:13,fontWeight:700,color:"#6A7490",minWidth:80},
  rBtnF:{flex:2,padding:"12px",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",minWidth:100},
};
