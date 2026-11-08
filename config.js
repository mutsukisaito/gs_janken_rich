// 作成日: 2026-11-08

// ゲーム全体の設定。数値を変えたいときは、このファイルだけを書き換える
const CONFIG = {
  maxSteps: 10,      // 1ステージをクリアするのに必要な歩数
  startHp: 100,      // ゲーム開始時の体力
  clearHeal: 20,     // ステージクリア時の回復量
  laneNames: ['左', '中央', '右'], // マスの名前（ボタンの順番と同じ）

  // ステージの一覧。ステージを増やすときは、ここに1行足す
  stages: [
    // ally.face … 仲間表示の顔アイコン／ally.back … 桃太郎の後ろをついてくる姿／clearScene … クリア画面の再会シーン
    { name: 'ステージ1',
      ally: { name: '犬', hpBonus: 50,  face: 'img/face_dog.png',      back: 'img/img_ally_dog_back.png' },
      clearScene: 'img/img_scene_clear1.jpg', hasBoss: false },
    { name: 'ステージ2',
      ally: { name: '猿', hpBonus: 50,  face: 'img/face_monkey.png',   back: 'img/img_ally_monkey_back.png' },
      clearScene: 'img/img_scene_clear2.jpg', hasBoss: false },
    { name: 'ステージ3',
      ally: { name: '雉', hpBonus: 100, face: 'img/face_pheasant.png', back: 'img/img_ally_pheasant_back.png' },
      clearScene: 'img/img_scene_clear3.jpg', hasBoss: false },
    { name: 'ステージ4', ally: null,                          hasBoss: true  }
  ],

  // 敵の一覧。敵を増やすときは、ここに1行足す
  enemies: [
    { name: '青鬼', damage: 10, color: '#2b6cff', image: 'img/img_oni_blue.png' },
    { name: '赤鬼', damage: 20, color: '#e53935', image: 'img/img_oni_red.png' },
    { name: '黄鬼', damage: 30, color: '#f9a825', image: 'img/img_oni_yellow.png' }
  ],

  // 画像のファイル名をまとめた設定。画像を差し替えるときは、ここだけを書き換える
  images: {
    playerBack: 'img/img_player_back.png',  // 選んだマスに立つ桃太郎
    faces: {                                // 顔アイコン（初期＝normal、当たり＝pain、回避＝happy）
      normal: 'img/img_face_normal.png',
      pain:   'img/img_face_pain.png',
      happy:  'img/img_face_happy.png'
    },
    bgRoad: 'img/img_bg_road.jpg',          // プレイエリアの背景（通常ステージ）
    bgBoss: 'img/img_bg_boss.jpg',          // プレイエリアの背景（ボス戦）
    sceneStart:    'img/img_scene_start.jpg',    // タイトル画面
    sceneGameover: 'img/img_scene_gameover.jpg', // ゲームオーバー画面
    sceneEnding:   'img/img_scene_ending.jpg'    // エンディング画面
  },

  // ラスボスの設定
  boss: {
    name: 'でかい鬼',
    hp: 300,             // ボスの体力
    attackDamage: 30,    // ボスの攻撃が当たったときに、プレイヤーが受けるダメージ
    counterDamage: 20,   // プレイヤーの反撃でボスが受けるダメージ
    color: '#6a1b9a',
    image: 'img/img_boss.png'  // ボスの画像
  }
};
