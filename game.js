// 作成日: 2026-11-08

// 今のゲームの状況。ボタンが押されるたびに、ここの値が変わる
let state = {
  stageIndex: 0,      // 今のステージ（0から数える。0 = ステージ1）
  step: 0,            // 今の歩数（0〜maxSteps）
  hp: CONFIG.startHp,     // 今の体力
  maxHp: CONFIG.startHp,  // 体力の上限
  allies: [],         // 仲間になったキャラの名前（例：['犬', '猿']）
  isBossBattle: false,// ボス戦中なら true
  bossHp: 0,          // ボスの今の体力
  lastResult: null    // 直前のターンの結果（表示用）。例：{ lane: 1, enemy: {...}, isHit: true }
};

// ---------- 状態を変える関数 ----------

// ゲームを最初の状態に戻す関数（タイトルからスタートするときに使う）
// 受け取る値：なし　返す値：なし
function resetGame() {
  state.stageIndex = 0;
  state.step = 0;
  state.hp = CONFIG.startHp;
  state.maxHp = CONFIG.startHp;
  state.allies = [];
  state.isBossBattle = false;
  state.bossHp = 0;
  state.lastResult = null;
}

// 今のステージを0歩目から始める関数（体力は回復しない）
// 受け取る値：なし　返す値：なし
function startStage() {
  state.step = 0;
  state.isBossBattle = false;
  state.lastResult = null;
}

// ボタンが押されたときの入口の関数。ボス戦中かどうかで、処理を振り分ける
// 受け取る値：lane … 選んだマス番号（0=左, 1=中央, 2=右）
// 返す値：なし
function handleLaneSelect(lane) {
  if (state.isBossBattle) {
    playBossTurn(lane);
  } else {
    playNormalTurn(lane);
  }
}

// 通常ステージの1ターンの処理をする関数
// 受け取る値：lane … 選んだマス番号（0, 1, 2）
// 返す値：なし
function playNormalTurn(lane) {
  // 鬼のマスと、鬼の種類をランダムに決める
  const enemyLane = getRandomInt(CONFIG.laneNames.length);
  const enemy = pickRandomEnemy();

  // 選んだマスと鬼のマスが同じなら「当たり」
  const isHit = (lane === enemyLane);

  if (isHit) {
    // 当たり：体力を減らして、1歩後退（0歩より小さくしない）
    state.hp = Math.max(0, state.hp - enemy.damage);
    state.step = Math.max(0, state.step - 1);
  } else {
    // 回避：1歩前進
    state.step = state.step + 1;
  }

  // 結果を保存して、画面を更新する
  state.lastResult = { lane: lane, enemyLane: enemyLane, enemy: enemy, isHit: isHit };
  render();

  if (state.hp <= 0) {
    // 体力が0以下なら、ゲームオーバー画面へ
    showScreen('screen-gameover');
  } else if (state.step >= CONFIG.maxSteps) {
    // 歩数がクリアに必要な歩数に届いたとき
    if (CONFIG.stages[state.stageIndex].hasBoss) {
      // ボス戦があるステージなら、クリアではなくボス戦を始める
      startBossBattle();
      render();
    } else {
      // それ以外は、ステージクリア
      clearStage();
      renderClear();
      showScreen('screen-clear');
    }
  }
}

// ボス戦を始める関数（ボス戦中の印を立てて、ボスの体力を満タンにする）
// 受け取る値：なし　返す値：なし
function startBossBattle() {
  state.isBossBattle = true;
  state.bossHp = CONFIG.boss.hp;
  state.lastResult = null;
}

// ボス戦の1ターンの処理をする関数
// 受け取る値：lane … 選んだマス番号（0, 1, 2）
// 返す値：なし
function playBossTurn(lane) {
  // ボスの攻撃マスをランダムに決める
  const attackLane = getRandomInt(CONFIG.laneNames.length);

  // 選んだマスと攻撃マスが同じなら「被弾」（通常ステージの当たり判定と同じ考え方）
  const isHit = (lane === attackLane);

  if (isHit) {
    // 被弾：プレイヤーの体力が減る
    state.hp = Math.max(0, state.hp - CONFIG.boss.attackDamage);
  } else {
    // 回避＋反撃：ボスの体力が減る
    state.bossHp = Math.max(0, state.bossHp - CONFIG.boss.counterDamage);
  }

  // 結果を保存する（鬼のかわりにボスのデータを入れる）
  state.lastResult = {
    lane: lane,
    enemyLane: attackLane,
    enemy: CONFIG.boss,
    isHit: isHit,
    isBoss: true,
    isDefeated: false
  };

  if (state.hp <= 0) {
    // プレイヤーがやられた：ボス戦を最初からやり直す（体力は両方とも満タンに戻す）
    state.hp = state.maxHp;
    state.bossHp = CONFIG.boss.hp;
    state.lastResult.isDefeated = true;
    render();
  } else if (state.bossHp <= 0) {
    // ボスを倒した：エンディング画面へ
    render();
    renderEnding();
    showScreen('screen-ending');
  } else {
    render();
  }
}

// ステージクリアの処理をする関数（仲間を加えて、体力を回復する）
// 受け取る値：なし　返す値：なし
function clearStage() {
  // 1. そのステージに仲間がいれば、仲間に加える（体力の上限も今の体力も、ボーナス分増える）
  const ally = CONFIG.stages[state.stageIndex].ally;
  if (ally !== null) {
    state.allies.push(ally.name);
    state.maxHp = state.maxHp + ally.hpBonus;
    state.hp = state.hp + ally.hpBonus;
  }

  // 2. クリア回復：体力を増やす（上限は超えない）
  state.hp = Math.min(state.maxHp, state.hp + CONFIG.clearHeal);
}

// リトライの関数（体力を上限まで回復して、同じステージを0歩目から始め直す）
// 仲間とステージ番号は変えないので、仲間は減らない
// 受け取る値：なし　返す値：なし
function retryStage() {
  state.hp = state.maxHp;
  // 「ステージを始める処理」を使い回す
  startStage();
}

// 次のステージに進む関数（ステージ番号を1つ進めて、0歩目から始める）
// 受け取る値：なし　返す値：なし
function nextStage() {
  state.stageIndex = state.stageIndex + 1;
  startStage();
}

// ---------- 補助の関数 ----------

// 0 から max-1 までのランダムな整数を返す関数
// 受け取る値：max … 上限（この値は含まない）
// 返す値：整数（例：max が 3 なら 0, 1, 2 のどれか）
function getRandomInt(max) {
  // Math.random() は 0以上1未満の小数。max をかけて小数点を切り捨てる
  return Math.floor(Math.random() * max);
}

// CONFIG.enemies から鬼を1体ランダムに返す関数
// 受け取る値：なし
// 返す値：鬼のデータ（例：{ name: '青鬼', damage: 10, color: '#2b6cff' }）
function pickRandomEnemy() {
  return CONFIG.enemies[getRandomInt(CONFIG.enemies.length)];
}

// ---------- 画面に表示する関数（state を読むだけで、state は変えない） ----------

// 指定した画面だけを表示する関数
// 受け取る値：screenId … 表示したい画面のID（例：'screen-game'）
// 返す値：なし
function showScreen(screenId) {
  // いったん、すべての画面から is-active を外して隠す
  $('.screen').removeClass('is-active');
  // 指定された画面にだけ is-active を付けて表示する
  $('#' + screenId).addClass('is-active');
}

// ゲーム画面全体を更新する関数（下の render〜 をまとめて呼ぶ）
// 受け取る値：なし　返す値：なし
function render() {
  renderHeader();
  renderProgress();
  renderLanes();
  renderHp();
  renderMessage();
  renderAllies();
}

// ヘッダーにステージ名を表示する関数（ボス戦中は「ボス戦」）
// 受け取る値：なし　返す値：なし
function renderHeader() {
  if (state.isBossBattle) {
    $('#stage-name').text('ボス戦');
  } else {
    $('#stage-name').text(CONFIG.stages[state.stageIndex].name);
  }
}

// 進捗バーを表示する関数（ボス戦中はボスの体力バーに切り替える）
// 受け取る値：なし　返す値：なし
function renderProgress() {
  let label;
  let percent;
  if (state.isBossBattle) {
    // ボス戦：ボスの体力 ÷ 満タン の割合でバーの長さを決める
    label = 'ボスの体力 ' + state.bossHp + ' / ' + CONFIG.boss.hp;
    percent = state.bossHp / CONFIG.boss.hp * 100;
  } else {
    // 通常：歩数 ÷ クリアに必要な歩数 の割合でバーの長さを決める
    label = state.step + ' / ' + CONFIG.maxSteps + '歩';
    percent = state.step / CONFIG.maxSteps * 100;
  }
  $('#progress-label').text(label);
  $('#progress-fill').css('width', percent + '%');
}

// 3マスに、鬼とプレイヤーを表示する関数
// 受け取る値：なし　返す値：なし
function renderLanes() {
  // 直前の結果があれば、選んだマスにプレイヤーを出す。なければ中央に出す
  let playerLane = 1;
  if (state.lastResult !== null) {
    playerLane = state.lastResult.lane;
  }

  for (let i = 0; i < CONFIG.laneNames.length; i++) {
    const $lane = $('#lane-' + i);
    // いったん中身を空にして、マスの名前から作り直す
    $lane.empty();
    $lane.append($('<span class="lane-name"></span>').text(CONFIG.laneNames[i]));

    // 鬼がいるマスなら、色付きの箱と名前を出す（鬼の出現は S4 で作る）
    if (state.lastResult !== null && state.lastResult.enemyLane === i) {
      const enemy = state.lastResult.enemy;
      $lane.append($('<div class="enemy-box"></div>').text(enemy.name).css('background', enemy.color));
    }

    // プレイヤーのいるマスなら、桃を出す
    if (i === playerLane) {
      $lane.append($('<div class="player-box"></div>').text('桃'));
    }
  }
}

// 体力ゲージを表示する関数
// 受け取る値：なし　返す値：なし
function renderHp() {
  $('#hp-label').text(state.hp + ' / ' + state.maxHp);
  // 体力 ÷ 上限 の割合でバーの長さを決める
  $('#hp-fill').css('width', (state.hp / state.maxHp * 100) + '%');
}

// メッセージと顔アイコンを表示する関数
// 受け取る値：なし　返す値：なし
function renderMessage() {
  const result = state.lastResult;
  if (result === null) {
    // まだ1回も選んでいない（初期状態）
    $('#message').text('マスを選んでね');
    $('#face').text('普通');
  } else if (result.isBoss && result.isDefeated) {
    // ボス戦でやられた
    $('#message').text('やられた…もう一度挑戦！');
    $('#face').text('痛い');
  } else if (result.isBoss && result.isHit) {
    // ボス戦：被弾
    $('#message').text(CONFIG.boss.name + 'の攻撃を受けた！ 体力-' + CONFIG.boss.attackDamage);
    $('#face').text('痛い');
  } else if (result.isBoss) {
    // ボス戦：回避＋反撃
    $('#message').text('反撃！ ボスに' + CONFIG.boss.counterDamage + 'のダメージ');
    $('#face').text('嬉しい');
  } else if (result.isHit) {
    // 当たり
    $('#message').text(result.enemy.name + 'にぶつかった！ 体力-' + result.enemy.damage + '、1歩後退');
    $('#face').text('痛い');
  } else {
    // 回避
    $('#message').text('かわした！ 1歩前進');
    $('#face').text('嬉しい');
  }
}

// 仲間の表示を更新する関数
// 受け取る値：なし　返す値：なし
function renderAllies() {
  if (state.allies.length === 0) {
    $('#allies').text('仲間：なし');
  } else {
    // 仲間の名前を「・」でつなげて表示する（例：犬・猿）
    $('#allies').text('仲間：' + state.allies.join('・'));
  }
}

// クリア画面の文字を表示する関数
// 受け取る値：なし　返す値：なし
function renderClear() {
  const stage = CONFIG.stages[state.stageIndex];
  $('#clear-title').text(stage.name + ' クリア！');
  // 仲間がいるステージなら、仲間の名前を出す。いなければ空にする
  if (stage.ally !== null) {
    $('#clear-ally').text(stage.ally.name + 'が仲間になった！');
  } else {
    $('#clear-ally').text('');
  }
  $('#clear-hp').text('体力：' + state.hp + ' / ' + state.maxHp);
}

// エンディング画面の文字を表示する関数（仲間全員の名前）
// 受け取る値：なし　返す値：なし
function renderEnding() {
  $('#ending-allies').text('仲間：' + state.allies.join('・'));
}

// ---------- ボタンとの結びつけ ----------

// ページの読み込みが終わったら実行される（jQuery の書き方）
$(function () {
  // 動作確認用：コンソールにメッセージを出す
  console.log('起動しました');

  // [スタート] を押したら、ゲームを初期化してゲーム画面を表示する
  $('#btn-start').on('click', function () {
    resetGame();
    startStage();
    render();
    showScreen('screen-game');
  });

  // ◀ ▲ ▶ のボタンを押したら、そのボタンの順番（0, 1, 2）をマス番号として渡す
  $('.btn-lane').on('click', function () {
    handleLaneSelect($('.btn-lane').index(this));
  });

  // [次のステージへ] を押したら、次のステージを始めてゲーム画面を表示する
  $('#btn-next').on('click', function () {
    nextStage();
    render();
    showScreen('screen-game');
  });

  // [リトライ] を押したら、同じステージをやり直してゲーム画面を表示する
  $('#btn-retry').on('click', function () {
    retryStage();
    render();
    showScreen('screen-game');
  });

  // 3か所ある [タイトルへ]（ゲーム・ゲームオーバー・エンディング）を押したら、
  // ゲームを全部リセットして、タイトル画面に戻る
  $('#btn-title-game, #btn-title-gameover, #btn-title-ending').on('click', function () {
    resetGame();
    showScreen('screen-title');
  });
});
