'use strict';

// Electronのモジュール
const electron = require( 'electron' );

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;

// 全てのウィンドウが閉じたら終了
app.on( 'window-all-closed', function() {
  if ( process.platform != 'darwin' ) {
    app.quit();
  }
});

// Electronの初期化完了後に実行
app.on( 'ready', function() {
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,      // 幅
    height: height,    // 高さ
    transparent: true, // 背景透過
    frame: false,      // フレーム有無
    resizable: false   // 大きさ変更禁止
  });
  mainWindow.loadURL( 'file://' + __dirname + '/app/index.html' );

  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on( 'closed', function() {
    mainWindow = null;
  });
});