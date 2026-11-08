# 画像の組み込み指示書（spec.md の付録）

- 作成日：2026-11-08
- 画像の置き場所：作業フォルダの `img/` に、`charactors/web/` の中身をすべてコピーする
- 実装は**バッチごと**に行う。1バッチ終わったら作業ルール（spec.md 0章）どおり報告して止まる

---

## 共通ルール（全バッチ）

1. **画像のパスは `config.js` に書く。** `game.js` や CSS にファイル名を直接書かない（例外：PC背景だけはCSSの `background-image` でよい）。
   - 敵・ボス・仲間の画像は、`CONFIG.enemies` / `CONFIG.boss` / `CONFIG.stages[].ally` の各データに `image` などの項目を足して持たせる。
   - それ以外の画像は `CONFIG.images` にまとめる。
2. **画像が表示できなかったときも、ゲームは動き続けること。** `<img>` には必ず `alt`（例：「青鬼」）を付ける。
3. キャラクター画像は `object-fit: contain` で、縦横比を崩さずに表示する。背景は `background-size: cover`。
4. 今までの「色付きの箱」「文字の顔アイコン」は、画像に置き換える。鬼の色（`color`）は、メッセージの文字色などで使い続けてよい。

### 設定データの形（例）
```js
// 画像のファイル名をまとめた設定。画像を差し替えるときは、ここだけを書き換える
images: {
  playerBack: 'img/img_player_back.png',
  faces: {
    normal: 'img/img_face_normal.png',
    pain:   'img/img_face_pain.png',
    happy:  'img/img_face_happy.png'
  },
  bgRoad: 'img/img_bg_road.jpg',
  bgBoss: 'img/img_bg_boss.jpg',
  sceneStart:    'img/img_scene_start.jpg',
  sceneGameover: 'img/img_scene_gameover.jpg',
  sceneEnding:   'img/img_scene_ending.jpg'
},

// stages の仲間に画像を追加する例
{ name: 'ステージ1',
  ally: { name: '犬', hpBonus: 50,
          face: 'img/face_dog.png',            // 仲間表示の顔アイコン
          back: 'img/img_ally_dog_back.png' }, // 桃太郎の後ろをついてくる姿
  clearScene: 'img/img_scene_clear1.jpg',      // クリア画面の再会シーン
  hasBoss: false },

// enemies に画像を追加する例
{ name: '青鬼', damage: 10, color: '#2b6cff', image: 'img/img_oni_blue.png' },
```

---

## バッチ1：ゲーム画面（S4 が完成してから）

| ファイル | 使う場所 | 表示サイズの目安 |
|---|---|---|
| `img_bg_road.jpg` | ゲーム画面のプレイエリアの背景（通常ステージ） | プレイエリア全体 |
| `img_player_back.png` | 選んだマスに立つ桃太郎 | マスの幅いっぱい |
| `img_oni_blue.png` / `img_oni_red.png` / `img_oni_yellow.png` | 鬼が出たマス（今の色付きの箱を置き換える） | マスの幅いっぱい |
| `img_face_normal.png` / `img_face_pain.png` / `img_face_happy.png` | 顔アイコン（初期＝normal、当たり＝pain、回避＝happy） | 直径60〜72px の円 |

- 完成したときの状態：ボタンを押すと、鬼の画像が出て、桃太郎の画像が選んだマスに移り、顔アイコンが結果に合わせて変わる
- 理解しておくこと：`CONFIG` の画像パスを `<img>` の `src` に入れて表示を切り替える方法（jQuery の `.attr('src', …)`）

## バッチ2：仲間とクリア画面（S5 が完成してから）

| ファイル | 使う場所 | 表示サイズの目安 |
|---|---|---|
| `face_dog.png` / `face_monkey.png` / `face_pheasant.png` | ゲーム画面の仲間表示（**文字の代わりに顔アイコンを並べる**） | 直径32〜40px |
| `img_ally_dog_back.png` / `img_ally_monkey_back.png` / `img_ally_pheasant_back.png` | 桃太郎の後ろをついてくる仲間（いちばん新しく加わった1体だけでよい） | 桃太郎の半分くらい |
| `img_scene_clear1.jpg` / `img_scene_clear2.jpg` / `img_scene_clear3.jpg` | クリア画面の再会シーン（ステージ1・2・3） | 画面幅いっぱい |

- 完成したときの状態：ステージをクリアすると再会シーンが出て、ゲーム画面の仲間表示に顔アイコンが増えていく
- 理解しておくこと：`state.allies` の数だけ顔アイコンを並べる繰り返し処理（`for` または `$.each`）

## バッチ3：ボス戦とその他の画面（S8 が完成してから）

| ファイル | 使う場所 | 表示サイズの目安 |
|---|---|---|
| `img_bg_boss.jpg` | ボス戦中のプレイエリアの背景 | プレイエリア全体 |
| `img_boss.png` | ボスの攻撃マス（鬼の代わりに表示） | マスの幅より大きくてよい |
| `img_scene_start.jpg` | タイトル画面 | 画面幅いっぱい |
| `img_scene_gameover.jpg` | ゲームオーバー画面 | 画面幅いっぱい |
| `img_scene_ending.jpg` | エンディング画面 | 画面幅いっぱい |
| `img_bg_pc.jpg` | PC表示のときの左右の余白（`body` の背景） | 画面全体（`cover`） |

- 完成したときの状態：すべての画面に画像が入り、PCで見ると左右に背景が見える
- 理解しておくこと：ボス戦かどうか（`state.isBossBattle`）で背景画像を切り替える方法

---

## 今回は使わない画像

- `img_item_*.png`（4種）：アイテム（S10）を実装する場合だけ使う。カードの裏面（`img_card_back`）は未作成
- `桃太郎と鬼たちの整列イラスト.png`：キャラクター設定画（基準用）。作業フォルダには入れない
