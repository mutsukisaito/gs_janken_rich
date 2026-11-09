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

// ボタンが押されたときの入口の関数。ボス戦中かどうかで処理を振り分け、そのあと結果を画面に表示する
// 受け取る値：lane … 選んだマス番号（0=左, 1=中央, 2=右）
// 返す値：なし
function handleLaneSelect(lane) {
  let outcome;
  if (state.isBossBattle) {
    outcome = playBossTurn(lane);
  } else {
    outcome = playNormalTurn(lane);
  }
  // 状態の更新は終わったので、ここから先は表示だけ
  showTurnResult(outcome);
}

// 通常ステージの1ターンの処理をする関数（state を変えるだけで、画面は触らない）
// 受け取る値：lane … 選んだマス番号（0, 1, 2）
// 返す値：ターンのあとの展開（'gameover' = ゲームオーバー／'clear' = ステージクリア／'continue' = そのまま続く）
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

  // 結果を保存する
  state.lastResult = { lane: lane, enemyLane: enemyLane, enemy: enemy, isHit: isHit };

  if (state.hp <= 0) {
    // 体力が0以下なら、ゲームオーバー
    return 'gameover';
  }
  if (state.step >= CONFIG.maxSteps) {
    // 歩数がクリアに必要な歩数に届いたとき
    if (CONFIG.stages[state.stageIndex].hasBoss) {
      // ボス戦があるステージなら、クリアではなくボス戦を始める（そのまま続く）
      startBossBattle();
      return 'continue';
    }
    // それ以外は、ステージクリア
    clearStage();
    return 'clear';
  }
  return 'continue';
}

// ボス戦を始める関数（ボス戦中の印を立てて、ボスの体力を満タンにする）
// 受け取る値：なし　返す値：なし
function startBossBattle() {
  state.isBossBattle = true;
  state.bossHp = CONFIG.boss.hp;
  state.lastResult = null;
}

// ボス戦の1ターンの処理をする関数（state を変えるだけで、画面は触らない）
// 受け取る値：lane … 選んだマス番号（0, 1, 2）
// 返す値：ターンのあとの展開（'ending' = ボスを倒した／'continue' = そのまま続く。やられたときも 'continue'）
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
    return 'continue';
  }
  if (state.bossHp <= 0) {
    // ボスを倒した：エンディング
    return 'ending';
  }
  return 'continue';
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

// 仲間の名前から、CONFIG にある仲間のデータ（顔・後ろ姿の画像など）を探して返す関数
// 受け取る値：name … 仲間の名前（例：'犬'）
// 返す値：仲間のデータ（見つからなければ null）
function findAllyByName(name) {
  for (let i = 0; i < CONFIG.stages.length; i++) {
    const ally = CONFIG.stages[i].ally;
    if (ally !== null && ally.name === name) {
      return ally;
    }
  }
  return null;
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

// 1ターンの結果を画面に出す関数（ターンのあとの展開に合わせて、表示する画面を決める）
// 受け取る値：outcome … playNormalTurn / playBossTurn が返した展開（'gameover' / 'clear' / 'ending' / 'continue'）
// 返す値：なし
function showTurnResult(outcome) {
  // ゲーム画面は、どの展開でも最新の状態に更新しておく
  render();

  if (outcome === 'gameover') {
    showScreen('screen-gameover');
  } else if (outcome === 'clear') {
    renderClear();
    showScreen('screen-clear');
  } else if (outcome === 'ending') {
    renderEnding();
    showScreen('screen-ending');
  }
  // 'continue' のときは、ゲーム画面のまま
}

// ゲーム画面全体を更新する関数（下の render〜 をまとめて呼ぶ）
// 受け取る値：なし　返す値：なし
function render() {
  renderHeader();
  renderProgress();
  renderBackground();
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

// 仲間の顔アイコン（<img>）を1つ作って返す関数（仲間表示とエンディングで共通）
// 受け取る値：name … 仲間の名前（例：'犬'）
// 返す値：顔アイコンの jQuery 要素（表示できないときは alt の名前が出る）
function createAllyFace(name) {
  const ally = findAllyByName(name);
  return $('<img class="ally-face">').attr('src', ally.face).attr('alt', ally.name);
}

// 鬼（またはボス）を表示する要素を作って返す関数
// 受け取る値：enemy … 鬼のデータ、isBoss … ボスなら true
// 返す値：jQuery 要素
function createEnemyElement(enemy, isBoss) {
  if (enemy.image) {
    // 画像がある鬼は、画像を出す（表示できないときは alt の名前が出る）
    const $enemyImg = $('<img class="enemy-img">').attr('src', enemy.image).attr('alt', enemy.name);
    // ボス戦のボスは、鬼より大きく表示する（CSS の boss-img）
    $enemyImg.toggleClass('boss-img', isBoss);
    return $enemyImg;
  }
  // 画像がない敵は、色付きの箱と名前を出す
  return $('<div class="enemy-box"></div>').text(enemy.name).css('background', enemy.color);
}

// 桃太郎と、後ろをついてくる仲間たちの要素を作って返す関数
// 受け取る値：なし（state.allies を読む）
// 返す値：jQuery 要素
function createPlayerGroup() {
  const $group = $('<div class="player-group"></div>');
  $group.append($('<img class="player-img">').attr('src', CONFIG.images.playerBack).attr('alt', '桃太郎'));
  if (state.allies.length > 0) {
    // 仲間がいるときは、桃太郎も仲間も大きく表示する（CSS の has-allies で決まる）
    $group.addClass('has-allies');
    // 仲間の数だけ後ろ姿を並べる。位置は「仲間の人数-何番目か」のクラスで決まる（CSS）
    for (let j = 0; j < state.allies.length; j++) {
      const ally = findAllyByName(state.allies[j]);
      const posClass = 'ally-pos-' + state.allies.length + '-' + j;
      $group.append($('<img class="ally-img">').addClass(posClass).attr('src', ally.back).attr('alt', ally.name));
    }
  }
  return $group;
}

// 3マスに、鬼とプレイヤーを表示する関数
// 受け取る値：なし　返す値：なし
function renderLanes() {
  const result = state.lastResult;

  // 直前の結果があれば、選んだマスにプレイヤーを出す。なければ中央に出す
  let playerLane = 1;
  if (result !== null) {
    playerLane = result.lane;
  }

  for (let i = 0; i < CONFIG.laneNames.length; i++) {
    const $lane = $('#lane-' + i);
    // いったん中身を空にして、作り直す
    $lane.empty();

    // ぶつかったマスには is-hit クラスを付けて、赤く目立たせる（CSS で見た目を決める）
    $lane.toggleClass('is-hit', result !== null && result.isHit && result.enemyLane === i);

    // まだ鬼が出ていないとき（ステージの最初など）は、3マスとも上側に「？」の鬼を出して、
    // 次にどのマスへ何が来るか分からないことを、プレイヤーに見せる
    if (result === null) {
      $lane.append($('<img class="unknown-img">').attr('src', CONFIG.images.enemyUnknown).attr('alt', '？'));
    }

    // 鬼がいるマスなら、鬼を出す
    if (result !== null && result.enemyLane === i) {
      $lane.append(createEnemyElement(result.enemy, result.isBoss === true));
    }

    // プレイヤーのいるマスなら、桃太郎と仲間を出す
    if (i === playerLane) {
      $lane.append(createPlayerGroup());
    }
  }
}

// プレイエリアの背景画像を表示する関数（ボス戦かどうかで、道とボス戦の背景を切り替える）
// 受け取る値：なし　返す値：なし
function renderBackground() {
  let bg = CONFIG.images.bgRoad;
  if (state.isBossBattle) {
    bg = CONFIG.images.bgBoss;
  }
  $('#play-area').css('background-image', 'url("' + bg + '")');
}

// タイトル・ゲームオーバー・エンディング画面の画像を設定する関数（state は使わない。起動時に1回呼ぶ）
// 受け取る値：なし　返す値：なし
function renderSceneImages() {
  $('#scene-start').attr('src', CONFIG.images.sceneStart).attr('alt', '桃太郎と仲間たち');
  $('#scene-gameover').attr('src', CONFIG.images.sceneGameover).attr('alt', 'やられた桃太郎');
  $('#scene-ending').attr('src', CONFIG.images.sceneEnding).attr('alt', 'みんなで勝利のお祝い');
}

// 体力ゲージを表示する関数
// 受け取る値：なし　返す値：なし
function renderHp() {
  $('#hp-label').text(state.hp + ' / ' + state.maxHp);
  // 体力 ÷ 上限 の割合でバーの長さを決める
  $('#hp-fill').css('width', (state.hp / state.maxHp * 100) + '%');
}

// メッセージ欄に、見出し（大きい文字）と詳細（ふつうの文字）を表示する関数
// 受け取る値：見出しの文字、詳細の文字（なければ省略）　返す値：なし
function renderMessageText(head, detail) {
  const $message = $('#message');
  $message.empty();
  $message.append($('<span class="message-head"></span>').text(head));
  if (detail) {
    $message.append($('<span class="message-detail"></span>').text(detail));
  }
}

// メッセージと顔アイコンを表示する関数
// 受け取る値：なし　返す値：なし
function renderMessage() {
  const result = state.lastResult;
  if (result === null) {
    // まだ1回も選んでいない（初期状態）
    renderMessageText('鬼をよけて進もう');
  } else if (result.isBoss && result.isDefeated) {
    // ボス戦でやられた
    renderMessageText('やられた…もう一度挑戦！');
  } else if (result.isBoss && result.isHit) {
    // ボス戦：被弾
    renderMessageText(CONFIG.boss.name + 'の攻撃を受けた！', '体力-' + CONFIG.boss.attackDamage);
  } else if (result.isBoss) {
    // ボス戦：回避＋反撃
    renderMessageText('反撃！', 'ボスに' + CONFIG.boss.counterDamage + 'のダメージ');
  } else if (result.isHit) {
    // 当たり
    renderMessageText(result.enemy.name + 'にぶつかった！', '体力-' + result.enemy.damage + '、1歩後退');
  } else {
    // 回避
    renderMessageText('かわした！', '1歩前進');
  }

  // 状態に応じて、顔の種類を決める（CONFIG.images.faces のキーと、顔の説明文）
  let mood = 'normal';
  let faceKey = 'normal';
  let faceAlt = '普通';
  if (result !== null) {
    if (result.isHit || result.isDefeated) {
      mood = 'hit';    // 当たり・被弾・やられた
      faceKey = 'pain';
      faceAlt = '痛い';
    } else {
      mood = 'happy';  // 回避・反撃
      faceKey = 'happy';
      faceAlt = '嬉しい';
    }
  }

  // 顔アイコンの画像を差し替える（表示できないときは alt の文字が出る）
  $('#face-img').attr('src', CONFIG.images.faces[faceKey]).attr('alt', faceAlt);

  // 顔とメッセージのクラスを付け替える（色は CSS で決まる）
  $('#face, #message').removeClass('mood-normal mood-hit mood-happy').addClass('mood-' + mood);
}

// 仲間の表示を更新する関数
// 受け取る値：なし　返す値：なし
function renderAllies() {
  const $allies = $('#allies');
  // いったん空にして、「仲間：」の文字から作り直す
  $allies.empty();
  $allies.append($('<span class="allies-label"></span>').text('仲間：'));

  if (state.allies.length === 0) {
    $allies.append($('<span></span>').text('なし'));
  } else {
    // 仲間の数だけ、顔アイコンを並べる
    for (let i = 0; i < state.allies.length; i++) {
      $allies.append(createAllyFace(state.allies[i]));
    }
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
  // 再会シーンの画像を出す（画像が設定されていないステージでは隠す）
  if (stage.clearScene) {
    $('#clear-scene').attr('src', stage.clearScene).attr('alt', stage.ally ? stage.ally.name + 'との再会' : '').show();
  } else {
    $('#clear-scene').hide();
  }
  $('#clear-hp').text('体力：' + state.hp + ' / ' + state.maxHp);
}

// エンディング画面の仲間を表示する関数（仲間全員の顔アイコンを並べる。「仲間」の文字は出さない）
// 受け取る値：なし　返す値：なし
function renderEnding() {
  const $allies = $('#ending-allies');
  $allies.empty();
  // 仲間の数だけ、顔アイコンを並べる
  for (let i = 0; i < state.allies.length; i++) {
    $allies.append(createAllyFace(state.allies[i]));
  }
}

// ---------- ボタンとの結びつけ ----------

// ページの読み込みが終わったら実行される（jQuery の書き方）
$(function () {
  // 動作確認用：コンソールにメッセージを出す
  console.log('起動しました');

  // タイトル・ゲームオーバー・エンディングの画像を設定する
  renderSceneImages();

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
