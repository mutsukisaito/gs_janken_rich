// 作成日: 2026-11-08

// 指定した画面だけを表示する関数
// 受け取る値：screenId … 表示したい画面のID（例：'screen-game'）
// 返す値：なし
function showScreen(screenId) {
  // いったん、すべての画面から is-active を外して隠す
  $('.screen').removeClass('is-active');
  // 指定された画面にだけ is-active を付けて表示する
  $('#' + screenId).addClass('is-active');
}

// ページの読み込みが終わったら実行される（jQuery の書き方）
$(function () {
  // 動作確認用：コンソールにメッセージを出す
  console.log('起動しました');

  // [スタート] を押したら、ゲーム画面を表示する
  $('#btn-start').on('click', function () {
    showScreen('screen-game');
  });

  // 3か所ある [タイトルへ]（ゲーム・ゲームオーバー・エンディング）を押したら、タイトル画面に戻る
  $('#btn-title-game, #btn-title-gameover, #btn-title-ending').on('click', function () {
    showScreen('screen-title');
  });
});
