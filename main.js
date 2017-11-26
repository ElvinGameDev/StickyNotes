// Electronのモジュール
const electron = require('electron');

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ipcMainモジュールの取得
const ipcMain = electron.ipcMain;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// menu機能を読み込み
const globalMenu = electron.Menu;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;

// メニューの中身、ショートカットを設定
const template = [
  {
    label: 'StickyNotes',
    submenu: [
      {
        label: 'Hide',
        accelerator: 'CmdOrCtrl+H',
        role: 'hide',
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit',
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'new memo',
        accelerator: 'CmdOrCtrl+N',
        click: function() {
          // クライアントサイドにショートカットキーが押された信号を送る
          mainWindow.webContents.send('CmdOrCtrl+N', 'N');
        },
      },
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall',
      },
    ],
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Request To Developer',
        click: function() {
          electron.shell.openExternal('https://github.com/akihisaochi/StickyNotes/');
        },
      },
      // { // デバッグ用(メニューバーにデベロッパーツールを表示)
      //   label: 'Toggle &Developer Tools',
      //   accelerator: 'Alt+CmdOrCtrl+I',
      //   click: function() {
      //     mainWindow.toggleDevTools();
      //   },
      // },
    ],
  },
];

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// Electronの初期化完了後に実行
app.on('ready', function() {
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width, // 幅
    height: height, // 高さ
    transparent: true, // 背景透過
    frame: false, // フレーム有無
    resizable: false, // 大きさ変更禁止
    hasShadow: false,
  });
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');

  hideWindowOnClickBackground();

  // メニュー機能を追加
  globalMenu.setApplicationMenu(globalMenu.buildFromTemplate(template));

  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

/**
 * レンダラプロセスで付箋要素以外がクリックされた時にはwindowを隠す
 */
function hideWindowOnClickBackground() {
  ipcMain.on('hide', (event, arg) => {
    app.hide();
  })
}
