/**
 *@fileoverview control event and data about StickyNotes
 *@author AkihisaOchi
 *
 * ***************** localStorage memo *****************
 *
 * use localStorage for following two points
 * [1] store ids of element
 * [2] store information of style definition
 *
 * [ STORAGE ] = localStorage >> for simple access
 * [ STORAGE.IDS ] = { array } >> for [1]
 * [ STORAGE.***( uniqueId ) ] = { object } >> for [2]
 *
 * prop & value of [2]
 * {
 *  offsetLeft  : 'distance from screen left',
 *  offsetTop   : 'distance from screen top',
 *  zIndex      : 'z-index',
 *  className   : 'className define background-color',
 *  clientWidth : 'textarea width',
 *  clientHeight: 'textarea height',
 *  value       : 'textarea value',
 *  fontSize    : 'textarea font-size'
 * }
 *
 * ***************** localStorage memo *****************
 *
 */
(function() {
  /** electronのモジュールを格納 @const {object} */
  const ELECTRON_MODULE = require('electron').remote;
  /** ローカルPCのファイルシステムを取得 @const {object} */
  const FILE_SYSTEM = require('fs');
  /** STORAGEにローカルストレージオブジェクトを格納する @const {object} */
  let STORAGE = localStorage;
  /** ローカルストレージに記憶する要素 @let {array} */
  let BOX_IDS = [];
  /** appendTargetIdは要素をhtmlにappendするための鍵となるId @const {string} */
  const SCREEN_TARGET = document.getElementById('js__append--target');
  /** 初期表示のフォントサイズ @const {string} */
  const DEFAULT_FONTSIZE = '1.75rem';

  /**
   * 呼ぶたびにカウントを進める(付箋要素のz-indexを操作するときに使用する)
   * @return {number}
   */
  const Z_INDEX_COUNTER = {
    count: 100,
    countUp: () => {
      return this.count++;
    },
    countReset: () => {
      return (this.count = 100);
    },
    getCount: () => {
      return this.count;
    },
  };

  // STORAGE.clear(); // デバッグ用ローカルストレージをクリアする

  /**
   * ロード時にローカルストレージを呼び出し、処理を分岐させる
   */
  window.addEventListener('load', () => {
    // キーボードショートカットを監視するイベントを設置
    keyBoadShortCutEvent();
    // STORAGEにIDSというプロパティがあるかどうかを調べ条件分岐させる
    // 真ならローカルストレージの情報を画面に再現
    // 偽なら新たに1つの付箋要素を作成
    ('IDS' in STORAGE) ? elementCreateFromArray() : firstElementCreate();
  });


  /**
   * 生成したユニークなidをもとに付箋要素を生成し、情報をローカルストレージに記憶する
   */
  function firstElementCreate() {
    // ユニークなidをを生成
    let uniqueId = createUniqueId();
    showBoxElementInScreen(uniqueId);
    controlIdsToLocalStorage(uniqueId, 'push');
  }

  /**
   * ローカルストレージから取得した配列をループし、要素を生成する
   */
  function elementCreateFromArray() {
    // ローカルストレージに保存されたID情報を読み出す
    BOX_IDS = JSON.parse(STORAGE.IDS);
    for (let i = 0; i < BOX_IDS.length; i++) {
      // 値が存在するかどうかのガード節
      if (BOX_IDS[i] === null) continue;

      // ID毎に付箋要素を生成し記憶されたスタイルを適用する処理
      let thisId = BOX_IDS[i];

      // idを元に生成した付箋要素を画面に表示
      appendElements(SCREEN_TARGET, [createBox(thisId)]);

      // ローカルストレージの情報を要素に適用する
      applyBoxValueFromLocalStorage(thisId);
    }
  }

  /**
   * idを元に要素生成しを画面に出力する
   * @param {string} showId - このidを元に要素生成・画面出力・ローカルストレージへの保存をするためのする
   */
  function showBoxElementInScreen(showId) {
    // idを元に生成した付箋要素を画面に表示
    appendElements(SCREEN_TARGET, [createBox(showId)]);

    // 付箋要素の情報をローカルストレージに記憶
    saveBoxValueToLocalStorage(showId);
  }

  /**
   * 付箋要素を生成する(生成要素にはイベント設置済み)
   * @param {string} keyId - Boxの情報を記憶する鍵となるid
   * @return {object} 付箋紙を再現するhtml要素を返す
   */
  function createBox(keyId) {
    // 引数のデータ型が期待通りかどうかを判定
    if (typeof keyId !== 'string') {
      throw new Error('In createBox() at "keyId" must be string');
    }

    // boxWrapperElementはreturnされるhtml要素
    let boxWrapperElement = createElementAndSetAttribute('section', {
      'class': 'box box__color--yellow',
    });
    boxWrapperElement.setAttribute('id', keyId);

    // boxHeadlineElementはboxWrapperElementの子要素
    let boxHeadlineElement = createBoxHeadlineElement();

    // boxTextareaElementはboxWrapperElementの子要素
    let boxTextareaElement = createBoxTextareaElement();

    // 付箋要素に子要素を格納する
    boxWrapperElement = appendElements(
      boxWrapperElement,
      [boxHeadlineElement, boxTextareaElement]
    );
    // 奮戦要素のz-indexに値を適用
    boxWrapperElement.style.zIndex = Z_INDEX_COUNTER.countUp();

    // z-indexを操作するイベントを追加
    boxWrapperElement.addEventListener(
      'mousedown', controlZIndexOnBoxMousedown
    );

    // boxWrapperElementを返す
    return boxWrapperElement;
  }

  /**
   * 付箋のメニューバー要素を生成しリターンする
   * @return {object} boxHeadlineElement - メニューバーのhtmlElement
   */
  function createBoxHeadlineElement() {
    // boxHeadlineElementはboxWrapperElementの子要素
    let boxHeadlineElement = createElementAndSetAttribute('h1', {
      'class': 'box__headline',
    });
    let appendButtonElement = createElementAndSetAttribute('i', {
      'class': 'fa fa-plus',
      'role': 'button',
      'aria-hidden': 'true',
    });
    let settingButtonElement = createElementAndSetAttribute('i', {
      'class': 'fa fa-cog',
      'role': 'button',
      'aria-hidden': 'true',
    });
    let removeButtonElement = createElementAndSetAttribute('i', {
      'class': 'fa fa-trash-o',
      'role': 'button',
      'aria-hidden': 'true',
    });

    // appendButtonElementにイベントを追加
    appendButtonElement.addEventListener(
      'click', elementAppendOnButtonClicked
    );

    // settingButtonElementにイベントを追加
    settingButtonElement.addEventListener(
      'click', elementSettingOnButtonClicked
    );

    // removeButtonElementにイベントを追加
    removeButtonElement.addEventListener('click', elementRemoveOnButtonClicked);

    // boxHeadlineElementに子要素を追加
    boxHeadlineElement = appendElements(
      boxHeadlineElement,
      [appendButtonElement, settingButtonElement, removeButtonElement]
    );

    // boxHeadlineElementにイベントを追加
    boxHeadlineElement.addEventListener('mouseover', (mouseoverObject) => {
      (mouseoverObject.target.children.length > 0) ?
        this.addEventListener('mousedown', elementMoveOnDrug) :
        this.removeEventListener('mousedown', elementMoveOnDrug);
    });

    return boxHeadlineElement;
  }

  /**
   * テキストエリアの要素を生成しリターンする
   * @return {object} boxTextareaElement - テキストエリアのhtmlElement
   */
  function createBoxTextareaElement() {
    let boxTextareaElement = createElementAndSetAttribute('textarea', {
      'class': 'box__textarea',
    });
    // デフォルトのフォントサイズを設定
    boxTextareaElement.style.fontSize = DEFAULT_FONTSIZE;

    // boxTextareaにイベントを追加・削除(テキストエリアのリサイズ可能範囲でマウスポインタの形状を変更する)
    boxTextareaElement.addEventListener(
      'mouseover', addEventCursorAllScrollOnMouseover
    );
    boxTextareaElement.addEventListener('mouseout', (mouseoutObject) => {
      boxTextareaElement.removeEventListener(
        'mouseover', addEventCursorAllScrollOnMouseover
      );
    });
    // テキスト変更を監視するイベント
    boxTextareaElement.addEventListener('change', (changeObject) => {
      saveBoxValueToLocalStorage(changeObject.target.parentElement.id);
    });

    return boxTextareaElement;
  }

  /**
   * createUniqueIdは重複することのない文字列を返す()
   * @return {string} Boxの情報を記憶する鍵となるidを生成する
   */
  function createUniqueId() {
    // characterGroupは生成される文字列の素材
    let characterGroup = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // idLengthは生成する文字列の長さ
    let idLength = 25;
    // uniqueIdは最終的にリターンする
    let uniqueId = '';

    // idLengthの数だけループしてランダムに選択した値をuniqueIdに格納していく
    for (let i = 0; i < idLength; i++) {
      uniqueId += characterGroup[Math.floor(Math.random() * idLength)];
    }

    // uniqueIdをリターンして処理終了
    return uniqueId;
  }

  /**
   * elementMoveOnDrugはマウスの移動に合わせて要素を移動させる
   * マウスの移動が要素の移動よりも速い場合に備えてdocumentに対してmouseomoveイベントを設定する
   * @param {object} mousedownObject - mousedown時の情報が入ったオブジェクト
   */
  function elementMoveOnDrug(mousedownObject) {
    // mousedownイベントの対象となる要素と移動処理を適用する親要素を取得
    let parentElement = mousedownObject.target.parentNode;

    // スクリーンをはみ出すかどうかを判定するために画面サイズを取得
    let [windowWidth, windowHeight] = [screen.width, screen.height];

    // mousemove時にスクリーンを超えたかどうかを判定するために親要素のサイズを取得
    let parentWidth = parentElement.offsetWidth;
    let parentHeight = parentElement.offsetHeight;

    // マウスポインタの移動時に付箋要素のテキストエリアが選択されるとバグになるので、選択を禁止する
    document.getElementsByTagName('textarea').Enable = false;

    // マウスの移動が要素の移動よりも速い場合に備えてdocumentにmousemoveイベントを設置
    document.addEventListener('mousemove', elementMoveWithMouseMove);

    /**
     * mouseの移動に合わせて要素を移動させる
     * @param {object} mousemoveObject - mousemove時の情報が入ったオブジェクト
     */
    function elementMoveWithMouseMove(mousemoveObject) {
      // mousemoveに合わせて位置を変更するために要素の位置情報を取得
      let parentPositionLeft = parentElement.offsetLeft;
      let parentPositionTop = parentElement.offsetTop;
      let parentPositionRight = (parentPositionLeft + parentWidth);
      let parentPositionBottom = (parentPositionTop + parentHeight);

      // X軸座標において要素がスクリーンを越えて移動しないためのガード節
      if (parentPositionRight > windowWidth) {
        // 付箋要素の右端が画面の右端を越えたとき右には移動させない
        parentPositionLeft = windowWidth - parentWidth;
      } else if (parentPositionLeft < 0) {
        // 付箋要素の左端が画面の左端を越えたとき左には移動させない
        parentPositionLeft = 0;
      } else {
        // 画面内であればマウスポインタの移動値を適用する
        parentPositionRight += mousemoveObject.movementX;
        parentPositionLeft += mousemoveObject.movementX;
      }

      // Y軸座標において要素がスクリーンを超えて移動しないためのガード節
      if (parentPositionBottom > windowHeight) {
        // 付箋要素の下端が画面の下端を越えたとき下には移動させない
        parentPositionTop = windowHeight - parentHeight;
      } else if (parentPositionTop < 0) {
        // 付箋要素の上端が画面の上橋を越えたとき上には移動させない
        parentPositionTop = 0;
      } else {
        // 画面内であればマウスポインタの移動値を適用する
        parentPositionBottom += mousemoveObject.movementY;
        parentPositionTop += mousemoveObject.movementY;
      }

      // 付箋要素にマウスポインタの移動値を適用
      parentElement.style.left = `${parentPositionLeft}px`;
      parentElement.style.top = `${parentPositionTop}px`;
    }

    // mouseup時にmousemoveのイベントを削除する
    document.addEventListener('mouseup', eventDeleteAndSaveToLocalStorage);

    /**
     * mousemoveイベントを削除しローカルストレージの情報を更新する
     * @param {object} mouseupObject - mouseup時の情報が入ったオブジェクト
     */
    function eventDeleteAndSaveToLocalStorage(mouseupObject) {
      // mousemonveイベントを削除
      document.removeEventListener('mousemove', elementMoveWithMouseMove);

      // 移動イベントが終わった際には、選択の禁止を解除する
      document.getElementsByTagName('textarea').Enable = true;

      // 位置情報をローカルストレージに保存する
      saveBoxValueToLocalStorage(parentElement.id);
      // このイベントを削除する
      document.removeEventListener('mouseup', eventDeleteAndSaveToLocalStorage);
    }
  }

  /**
   * テキストエリアのリサイズ可能範囲(右下部分)にマウスポインタを合わせた場合にcursorプロパティにall-scrollを適用する
   * @param {object} mouseoverObject - mouseover時の情報が入ったオブジェクト
   */
  function addEventCursorAllScrollOnMouseover(mouseoverObject) {
    mouseoverObject.target.addEventListener(
      'mousemove', cursorChangeOnMousemove
    );
    /**
     * マウスの位置がテキストエリアのリサイズ可能範囲(右下から15*15以内の範囲)かどうかを判定しスタイルを適用する
     * @param {object} mousemoveObject - mousemove時の情報が入ったオブジェクト
     */
    function cursorChangeOnMousemove(mousemoveObject) {
      // 条件判定のために情報を取得
      let targetElement = mousemoveObject.target;
      let targetWidth = targetElement.clientWidth;
      let targetHeight = targetElement.clientHeight;
      let cursorX = mousemoveObject.offsetX;
      let cursorY = mousemoveObject.offsetY;

      // リサイズ可能範囲
      const resizableWidth = targetWidth - 15;
      const resizableHeight = targetHeight - 15;

      // テキストエリアのリサイズ可能範囲(右下から15*15以内の範囲)かどうかを判定し、cursorプロパティにall-scrollを適用する
      if (cursorX > resizableWidth && cursorY > resizableHeight) {
        targetElement.style.cursor = 'all-scroll';
        targetElement.addEventListener('mousedown', textareaResize);
      } else {
        targetElement.style.cursor = 'auto';
        targetElement.removeEventListener('mousedown', textareaResize);
      }
      // このイベントを削除
      mouseoverObject.target.addEventListener(
        'mousemove', cursorChangeOnMousemove
      );
    }
  }

  /**
   * appendボタンがクリックされたときに要素を追加する
   * @param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementAppendOnButtonClicked(clickObject) {
    let wrapperElement = clickObject.target.parentElement.parentElement;
    let addPositionX = wrapperElement.offsetLeft;
    let addPositionY = (wrapperElement.offsetTop + wrapperElement.offsetHeight);

    let uniqueId = createUniqueId();
    let appendBox = createBox(uniqueId);

    appendBox.style.left = `${addPositionX}px`;
    appendBox.style.top = `${addPositionY}px`;

    appendElements(SCREEN_TARGET, [appendBox]);

    // 要素は基本的にイベント対象の下に追加
    // もし画面からはみ出る場合は左上に表示
    if (appendBox.clientHeight + addPositionY > screen.height) {
      appendBox.style.left = '0px';
      appendBox.style.top = '0px';
    } else {
      appendBox.style.left = `${addPositionX}px`;
      appendBox.style.top = `${addPositionY}px`;
    }

    // ローカルストレージに情報を記憶
    controlIdsToLocalStorage(uniqueId, 'push');
    saveBoxValueToLocalStorage(uniqueId);
  }

  /**
   * settingボタンが押されたときにメニューバーを表示する(色を変えたりフォントサイズを変更したりする)
   * @param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementSettingOnButtonClicked(clickObject) {
    // メニューを表示する要素の取得
    let showTarget = clickObject.target.parentElement.parentElement;
    // メニューバーの要素の生成
    let settingMenu = createSettingMenu();
    // 画面にメニューを表示する
    appendElements(showTarget, [settingMenu]);
  }

  /**
   * 設定メニューのhtml要素を生成しリターンする
   * @return {object} settingMenu - 設定メニューのhtmlElement
   */
  function createSettingMenu() {
    let settingMenu = createElementAndSetAttribute('div', {
      'class': 'box__headline--setting',
    });
    // カラーボタン要素の配列を作成
    let colorBtnList = createColorBtnArray([
      'yellow', 'blue', 'pink', 'green', 'gray',
    ]);

    // largerTxtBtnの'title': 'larger'はfontSizeChangeOnBtnClicked()のフラグなので必須
    let largerTxtBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-search-plus',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'larger',
    });
    // smallerTxtBtnの'title': 'smaller'はfontSizeChangeOnBtnClicked()のフラグなので必須
    let smallerTxtBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-search-minus',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'smaller',
    });
    let closeBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-times',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'close',
    });

    // 閉じるボタンを押した時にメニューバーをremoveする
    closeBtn.addEventListener('click', (clickObject) => {
      let showTarget = clickObject.target.parentElement.parentElement;
      showTarget.removeChild(clickObject.target.parentElement);
    });

    // テキスト拡大ボタンを押した時にフォントサイズを変更するイベントを設置
    largerTxtBtn.addEventListener('click', fontSizeChangeOnBtnClicked);
    smallerTxtBtn.addEventListener('click', fontSizeChangeOnBtnClicked);

    // メニューバーをドラッグした時に付箋要素が移動するようにイベントを追加
    settingMenu.addEventListener('mouseover', elementMoveOnSettingDrug);
    settingMenu.removeEventListener('mouseout', elementMoveOnSettingDrug);

    // settingMenuにボタン要素を格納
    settingMenu = appendElements(
      settingMenu,
      [largerTxtBtn, ...colorBtnList, largerTxtBtn, smallerTxtBtn, closeBtn]
    );
    return settingMenu;
  }

  /**
   * ホバー時に付箋要素を移動させる
   * メニューバーの子要素の場合は付箋要素の移動イベントを削除する
   * @param {object} mouseoverObject - mouseover時の情報が入ったオブジェクト
   */
  function elementMoveOnSettingDrug(mouseoverObject) {
    // ホバー時のターゲットが子要素を含む場合はメニューバーなので移動イベントを追加
    // 子要素を含まない場合はボタンなのでイベントを削除
    (mouseoverObject.target.children.length > 0) ?
      this.addEventListener('mousedown', elementMoveOnDrug) :
      this.removeEventListener('mousedown', elementMoveOnDrug);
  }

  /**
   * 色のボタンがクリックされたときに付箋要素の背景色を変更する
   * @param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function colorChangeOnBtnClicked(clickObject) {
    // クリックしたボタンから背景色を定義するクラス名を取り出す
    let applyClassName = getClassNameFromTarget(
      clickObject.target.classList, /^box__color--/
    );

    // 付箋要素に適用されている背景色を定義するクラス名を調べる
    let targetElement = clickObject.target.parentElement.parentElement;
    let removeClassName = getClassNameFromTarget(
      targetElement.classList, /^box__color--/
    );

    // 付箋要素からremoveClassNameを削除しapplyClassNameを適用する
    targetElement.classList.remove(removeClassName);
    targetElement.classList.add(applyClassName);
    // 更新情報をローカルストレージに保存
    saveBoxValueToLocalStorage(targetElement.id);
  }

  /**
   * カラーボタンのDOM要素を生成しその配列をリターンする
   * @param {array} colorNameList - 色を指定する配列
   * @return {array} colorBtnList - カラーボタンのDOM要素を配列に詰めてリターンする
   */
  function createColorBtnArray(colorNameList) {
    // 引数のチェック
    if (colorNameList instanceof Array !== true) {
      throw new Error(
        'In appendElement() at "materialElements" must be array'
      );
    }
    // colorNameListをループで回す
    let colorBtnList = [];
    for (let key in colorNameList) {
      if (colorNameList[key] === null) continue;
      let thisValue = colorNameList[key];
      // 色ボタンの要素を生成
      let thisColorBtn = createElementAndSetAttribute('i', {
        'class': `box__headline--setting-color-btn box__color--${thisValue}`,
        'role': 'button',
        'aria-hidden': 'true',
        'title': `change ${thisValue}`,
      });
      // 付箋要素の背景色を変更するイベントを追加し、配列に追加
      thisColorBtn.addEventListener('click', colorChangeOnBtnClicked);
      colorBtnList.push(thisColorBtn);
    }
    return colorBtnList;
  }

  /**
   *テキスト拡大ボタンが押された時に付箋要素のテキストを大きくする
   *@param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function fontSizeChangeOnBtnClicked(clickObject) {
    let fontSizeDirection = clickObject.target.title;
    if (fontSizeDirection !== 'larger' && fontSizeDirection !== 'smaller') {
      throw new Error(
        'In fontSizeChangeOnBtnClicked() at fontSizeDirection unexpected'
      );
    }

    // スタイルの適用対象要素と現在のフォントサイズを取得
    let wrapperElement = clickObject.target.parentElement.parentElement;
    let targetElementStyle =
      clickObject.target.parentElement.previousElementSibling.style;
    let currentFontSize = targetElementStyle.fontSize;
    let currentFontSizeValue = Number(currentFontSize.replace(/rem/, ''));

    switch (fontSizeDirection) {
    // フォントサイズを多くする処理
    case 'larger':
    // 多きなりすぎないようにガード
      applyFontSizeValue = (currentFontSizeValue < 4) ?
        currentFontSizeValue + 0.25 :
        currentFontSizeValue + 0;
      break;
    // フォントサイズを小さくする処理
    case 'smaller':
      // 小さくなりすぎないようにガード
      applyFontSizeValue = (currentFontSizeValue > 1) ?
        currentFontSizeValue - 0.25 :
        currentFontSizeValue + 0;
      break;
    // 上記以外のケースはガードしているのでdefaultは設定しない
    }

    // 要素に新たなフォントサイズを適用
    targetElementStyle.fontSize = `${applyFontSizeValue}rem`;
    saveBoxValueToLocalStorage(wrapperElement.id);
  }
  /**
   * 付箋要素がクリックされたときに他の要素よりも表示を手前にする
   * @param {object} mousedownObject - クリック時の情報が入ったオブジェクト
   */
  function controlZIndexOnBoxMousedown(mousedownObject) {
    // クリックイベントが設定された要素のidを取得する
    let mousedownBoxId = this.id;
    // 画面に表示されている付箋要素の一覧を取得
    let boxElements = SCREEN_TARGET.children;
    // z-indexのカウンタを初期化
    Z_INDEX_COUNTER.countReset();

    // 付箋要素の画面の重なり順を記憶しておくためのオブジェクト
    let idAndZIndexList = {};
    // 付箋要素の一覧をループで回す
    for (let i = 0; i < boxElements.length; i++) {
      let thisBox = boxElements[i];
      // mousedownイベントのtargetでなければidAndZIndexListに格納していく
      if (thisBox.id !== mousedownBoxId) {
        idAndZIndexList[thisBox.style.zIndex] = thisBox.id;
      }
    }
    // 上記のループで取得したオブジェクトはkeyをz-index値にしているので自動でソートされている
    // ループで新たにz-indexを適用していく
    for (let key in idAndZIndexList) {
      if (idAndZIndexList[key] === null) continue;
      document.getElementById(
        idAndZIndexList[key]
      ).style.zIndex = Z_INDEX_COUNTER.countUp();
      // ローカルストレージの情報を更新する
      saveBoxValueToLocalStorage(idAndZIndexList[key]);
    }
    document.getElementById(
      mousedownBoxId
    ).style.zIndex = Z_INDEX_COUNTER.countUp();
    // ローカルストレージの情報を更新する
    saveBoxValueToLocalStorage(mousedownBoxId);
  }

  /**
   * removeボタンが押されたときに要素をremoveする
   * @param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementRemoveOnButtonClicked(clickObject) {
    // 削除する対象となる要素を取得
    let removeElement = clickObject.target.parentElement.parentElement;

    let validateTarget = '';
    for (let i = 0; i < removeElement.children.length; i++) {
      let thisNode = removeElement.children[i];
      if (thisNode.tagName === 'TEXTAREA') {
        validateTarget = thisNode;
      }
    }
    // テキストエリアに入力があるかどうかで条件分岐
    (validateTarget.value !== '') ?
      showChoices(removeElement, validateTarget.value) : // 選択肢を表示しユーザーに注意換気
      elementDeleteFromScreen(removeElement); // 素直に要素を削除
  }

  /**
   * 要素を画面から削除する
   * @param {object} deleteElement - 削除する対象となる要素
   */
  function elementDeleteFromScreen(deleteElement) {
    // 画面から削除する
    SCREEN_TARGET.removeChild(deleteElement);

    // 全ての子要素がなくなったときにはlenghtが0になるので新たな付箋要素を生成して表示する
    if (SCREEN_TARGET.children.length === 0) {
      // 情報を記憶する要素が全てなくなるのでローカルストレージをクリア
      STORAGE.clear();
      // 新たな付箋要素を作成して表示する
      firstElementCreate();
    }
    // ローカルストレージから情報を削除
    controlIdsToLocalStorage(deleteElement.id, 'remove');
  }

  /**
   * 選択肢を表示しユーザーに注意喚起、選択肢に応じてイベントを実行
   * 選択肢 {削除, キャンセル, ファイルに書き出す}
   * @param {object} deleteElement - 削除対象のDOM要素
   * @param {string} validateData - テキストエリアに入力された情報
   */
  function showChoices(deleteElement, validateData) {
    // 選択肢の箱を生成
    let choiceBox = createElementAndSetAttribute('section', {
      'class': 'choice',
    });
    // 見出し要素を生成
    let headlineElement = createElementAndSetAttribute('h1', {
      'class': 'choice__headline',
    });
    // モーダルマスク要素の生成
    let modal = createElementAndSetAttribute('div', {
      'class': 'modal',
    });
    headlineElement.textContent = 'このメモを保存しない場合、その内容はすべて失われます。';
    let explainElement = createElementAndSetAttribute('p', {
      'class': 'choice__explain',
    });
    explainElement.textContent = 'このメモを破棄してもよろしいですか？';
    // ボタン一覧を生成
    let btnLines = createElementAndSetAttribute('ul', {
      'class': 'choice__btns',
    });

    // 削除ボタンを生成
    let deleteChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--delete',
      'title': 'delete',
    });
    deleteChoice.textContent = '保存しない';
    // 削除イベントを設置
    deleteChoice.addEventListener('click', deleteChoiceEvent);

    // キャンセルボタンを生成
    let cancelChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--cancel',
      'title': 'cancel',
    });
    cancelChoice.textContent = 'キャンセル';
    // キャンセルイベントを設置
    cancelChoice.addEventListener('click', cancelChoiceEvent);

    // 保存ボタンを生成
    let saveChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--save',
      'title': 'save',
    });
    saveChoice.textContent = '保存...';
    // 保存イベントを設置
    saveChoice.addEventListener('click', saveChoiceEvent);

    // 各要素を子要素として格納
    appendElements(btnLines, [deleteChoice, cancelChoice, saveChoice]);
    appendElements(choiceBox, [headlineElement, explainElement, btnLines]);
    // 画面に表示する
    appendElements(SCREEN_TARGET, [choiceBox, modal]);

    /**
     * 保存しないボタンが押されたときは要素と選択肢を削除する
     * @param {object} clickObject - クリック時の情報が入ったオブジェクト
     */
    function deleteChoiceEvent(clickObject) {
      // 画面から選択肢ボックスを削除
      removeElements(SCREEN_TARGET, [choiceBox, modal]);
      // 画面から要素を削除
      elementDeleteFromScreen(deleteElement);
    }

    /**
     * キャンセルボタンが押されたときは選択肢のみを削除する
     * @param {object} clickObject - クリック時の情報が入ったオブジェクト
     */
    function cancelChoiceEvent(clickObject) {
      // 画面から選択肢ボックスを削除
      removeElements(SCREEN_TARGET, [choiceBox, modal]);
    }

    /**
     * 保存ボタンが押されたときは保存ダイアログを表示し、保存成功時に要素と選択肢ボックスを削除する
     * @param {object} clickObject - クリック時の情報が入ったオブジェクト
     */
    function saveChoiceEvent(clickObject) {
      // 現在の表示ウィンドウを取得
      const browserWindow = ELECTRON_MODULE.getCurrentWindow();
      // ELECTRON_MODULEからdialogプロパティを取得
      const dialogModule = ELECTRON_MODULE.dialog;

      let options = {
        title: 'StickyNots 保存',
        filters: [
          {name: 'ドキュメント', extensions: ['txt', 'text']},
          {name: 'All Files', extensions: ['*']},
        ],
        properties: ['openFile', 'createDirectory'],
      };
      dialogModule.showSaveDialog(browserWindow, options, function(filename) {
        if (filename) {
          let data = validateData;
          writeFile(filename, data);
        }
      });

      /**
       * ローカルPCのファイルシステムにアクセスしデータを作成する
       * @param {string} writePath - 保存ダイアログで選択されたファイル名
       * @param {string} writeData - データに書き込まれる内容
       */
      function writeFile(writePath, writeData) {
        // 引数が想定通りかを判定
        if (typeof writePath !== 'string') {
          throw new Error('In writeFile at "writePath" must be string');
        }
        if (typeof writeData !== 'string') {
          throw new Error('In writeFile at "writeData" must be string');
        }

        // 書き込み処理
        FILE_SYSTEM.writeFile(writePath, writeData, 'utf8', fileWriteEvent);

        /**
         * ファイル保存が成功すれば要素と選択肢ボックスを削除、失敗すればエラーを返す
         * @param {string} writeError - ファイル書き込み成功ならばnull、失敗ならばメッセージが入っている
         * @return {string} - ファイル書き込み成功なら何もリターンしない、失敗ならエラーメッセージを返す
         */
        function fileWriteEvent(writeError) {
          if (writeError) {
            // 失敗時はエラーを表示
          } else {
            // 保存成功時は要素と選択肢ボックスを削除
            removeElements(SCREEN_TARGET, [choiceBox, modal]);
            elementDeleteFromScreen(deleteElement);
            return;
          }
        }
      }
    }
  }

  /**
   * createElementAndSetAttributeは引数を元にhtml要素を返す
   * @param {string} tagName - 生成する要素のタグ名
   * @param {object} attributes - 要素にセットされる属性 / keyは属性名でvalueは属性値
   * @return {object} tagNameを要素名としattributesが属性としてセットされたhtml要素
   */
  function createElementAndSetAttribute(tagName, attributes) {
    // 引数のデータ型が期待通りかどうかを判定
    if (typeof tagName !== 'string') {
      throw new Error(
        'In createElementAndSetAttribute() at "tagName" must be string'
      );
    }
    if (typeof attributes !== 'object') {
      throw new Error(
        'In createElementAndSetAttribute() at "attributes" must be object'
      );
    }

    // 要素を生成
    let element = document.createElement(tagName);

    // attributesを要素に設定
    for (const key in attributes) {
      if (attributes[key] === null) continue;
      element.setAttribute(key, attributes[key]);
    }

    // 要素を返す
    return element;
  }

  /**
   * removeElementsはtargetElementに対してmaterialElementsをループで回してappendchildする
   * @param {object} targetElement - appendchildの対象となる要素
   * @param {array} materialElements - appendChildの素材となる要素軍群
   * @return {object} targetElement - materialElementsをappendchild()して返す
   */
  function removeElements(targetElement, materialElements) {
    // 引数のデータ型が期待通りかどうかを判定
    if (typeof targetElement !== 'object') {
      throw new Error('In appendElement() at "targetElement" must be object');
    }
    if (materialElements instanceof Array !== true) {
      throw new Error('In appendElement() at "materialElements" must be array');
    }

    // targetElementに対してmaterialElementsをループで回してappendchildする
    for (let i = 0; i < materialElements.length; i++) {
      targetElement.removeChild(materialElements[i]);
    }

    // targetElementを返す
    return targetElement;
  }

  /**
   * appendElementsはtargetElementに対してmaterialElementsをループで回してappendchildする
   * @param {object} targetElement - appendchildの対象となる要素
   * @param {array} materialElements - appendChildの素材となる要素軍群
   * @return {object} targetElement - materialElementsをappendchild()して返す
   */
  function appendElements(targetElement, materialElements) {
    // 引数のデータ型が期待通りかどうかを判定
    if (typeof targetElement !== 'object') {
      throw new Error('In appendElement() at "targetElement" must be object');
    }
    if (materialElements instanceof Array !== true) {
      throw new Error('In appendElement() at "materialElements" must be array');
    }

    // targetElementに対してmaterialElementsをループで回してappendchildする
    for (let i = 0; i < materialElements.length; i++) {
      targetElement.appendChild(materialElements[i]);
    }

    // targetElementを返す
    return targetElement;
  }

  /**
   * orderの指示に応じてBOX_IDSに対して特定のidを追加・削除しローカルストレージに保存する
   * @param {string} keyId - 配列に対して操作をする鍵となるid
   * @param {string} order - 値が'push'の場合は配列に追加、'remove'の場合は配列から削除
   */
  function controlIdsToLocalStorage(keyId, order) {
    // 渡ってくる引数が期待通りかどうかを判定するガード節
    if (typeof keyId !== 'string') {
      throw new Error(
        'In controlIdsToLocalStorage() at "keyId" must be string'
      );
    }
    if (order !== 'push' && order !== 'remove') {
      throw new Error(
        'In controlIdsToLocalStorage() at "order" must be "push" or "remove"'
      );
    }
    // orderが'push'の場合はBOX_IDSにkeyIdを追加、orderが'remove'の場合はBOX_IDSからkeyIdを削除
    switch (order) {
    case 'push':
      BOX_IDS.push(keyId);
      break;
    case 'remove':
      // BOX_IDSからkeyIdを削除
      for (let index in BOX_IDS) {
        if (BOX_IDS[index] === keyId) BOX_IDS.splice(index, 1);
      }
      STORAGE.removeItem(keyId);
      break;
    // orderが'push'か'remove'以外の場合はガードしているのでdefaultは設定しない
    }

    // ローカルストレージに配列は保存できないので、json形式に変換してから格納
    STORAGE.IDS = JSON.stringify(BOX_IDS);
  }

  /**
   * idを元に付箋要素の表示情報を取得し、ローカルストレージに保存する
   * @param {string} saveTargetId - 付箋要素を特定するためのid
   */
  function saveBoxValueToLocalStorage(saveTargetId) {
    // 渡ってくる引数が期待通りかどうかを判定するガード節
    if (typeof saveTargetId !== 'string') {
      throw new Error(
        'In saveBoxValueToLocalStorage() at "saveTargetId" must be string'
      );
    }

    // 情報を取得するために鍵となる要素を取得
    let savedTargetWrapper = document.getElementById(saveTargetId);
    // idを持つ要素が見つからなかったときのためのガード節
    if (savedTargetWrapper.length === 0) {
      throw new Error(
        'In saveBoxValueToLocalStorage() don\'t found element of this id'
      );
    }

    // 要素の子要素からテキストエリアの要素を取得
    let savedTextareaElement = '';
    for (let i = 0; i < savedTargetWrapper.childNodes.length; i++) {
      if (savedTargetWrapper.childNodes[i].tagName === 'TEXTAREA') {
        savedTextareaElement = savedTargetWrapper.childNodes[i];
      }
    }
    if (savedTextareaElement === '') {
      throw new Error(
        'In saveBoxValueToLocalStorage() at savedTextareaElement not found'
      );
    }

    // 背景色を定義するクラス名を取得する
    let saveClassName = getClassNameFromTarget(
      savedTargetWrapper.classList, /^box__color--/
    );

    // 情報を格納したオブジェクトを作成する
    let targetIdStatus = {
      // 画面の左端からの距離
      'offsetLeft': savedTargetWrapper.style.left,
      // 画面の上端からの距離
      'offsetTop': savedTargetWrapper.style.top,
      // 要素のz-indexを記憶
      'zIndex': savedTargetWrapper.style.zIndex,
      // 背景色を定義するクラス名
      'className': saveClassName,
      // テキストエリアの横幅
      'clientWidth': `${savedTextareaElement.clientWidth}px`,
      // テキストエリアの縦幅
      'clientHeight': `${savedTextareaElement.clientHeight}px`,
      // フォントサイズ
      'fontSize': savedTextareaElement.style.fontSize,
      // テキストエリアの値
      'value': savedTextareaElement.value,
    };
    // ローカルストレージに保存
    STORAGE.setItem(saveTargetId, JSON.stringify(targetIdStatus));
  }

  /**
   * applyKeyIdを元にローカルストレージから情報を取り出し、applyKeyIdに対応した要素にスタイルを適用する
   * @param {string} applyKeyId - 適用する要素のid、ローカルストレージから呼び出すプロパティとしても使う
   */
  function applyBoxValueFromLocalStorage(applyKeyId) {
    // 渡ってくる引数が期待通りかどうかを判定するガード節
    if (typeof applyKeyId !== 'string') {
      throw new Error(
        'In applyBoxValueFromLocalStorage() at "applyKeyId" must be string'
      );
    }

    // ローカルストレージから情報を取得
    let applyObject = JSON.parse(STORAGE.getItem(applyKeyId));
    let applyTargetWrapper = document.getElementById(applyKeyId);
    let applyTextareaElement = applyTargetWrapper.lastElementChild;

    // 背景色を定義するクラス名を取得
    let removeClassName = getClassNameFromTarget(
      applyTargetWrapper.classList, /^box__color--/
    );

    for (let key in applyObject) {
      if (applyObject[key] === null) continue;
      let thisValue = applyObject[key];
      switch (key) {
      // 画面の左からの表示位置を適用
      case 'offsetLeft':
        applyTargetWrapper.style.left = thisValue;
        break;
      // 画面の上からの表示位置を適用
      case 'offsetTop':
        applyTargetWrapper.style.top = thisValue;
        break;
      // 付箋要素のz-indexを適用
      case 'zIndex':
        applyTargetWrapper.style.zIndex = thisValue;
        break;
      // 背景色を定義するクラス名を適用
      case 'className':
        applyTargetWrapper.classList.remove(removeClassName);
        applyTargetWrapper.classList.add(thisValue);
        break;
      // 横幅を適用する
      case 'clientWidth':
        applyTextareaElement.style.width = thisValue;
        break;
      // 高さを適用する
      case 'clientHeight':
        applyTextareaElement.style.height = thisValue;
        break;
      // フォントサイズを適用する
      case 'fontSize':
        applyTextareaElement.style.fontSize = thisValue;
        break;
      // テキストを適用する
      case 'value':
        applyTextareaElement.value = thisValue;
        break;
      // 想定外のときはエラーを出す
      default:
        throw new Error(
          'In applyBoxValueFromLocalStorage() prop of applyObject is unexpected'
        );
        break;
      }
    }
  }

  /**
   * classListからを検索条件に引っかかるクラス名をリターンする
   * @param {object} targetList - .classList(DOM要素のプロパティから取得したもの)
   * @param {RegExp} regExp - 検索条件
   * @return {string} matchClassName - 検索条件に引っかかるクラス名をリターンする
   */
  function getClassNameFromTarget(targetList, regExp) {
    if (typeof targetList !== 'object') {
      throw new Error(
        'In getClassNameFromTarget() at "targetList" must be array'
      );
    }
    let matchClassName = '';

    for (let i = 0; i < targetList.length; i++) {
      if (targetList[i].match(regExp)) return matchClassName = targetList[i];
    }
    // もし検索条件に何も引っかからなければエラーを吐く
    if (matchClassName === '') {
      throw new Error(
        `In getClassNameFromTarget() regExp[${regExp}] maybe wrong`
      );
    }
  }

  /**
   *mousedown時にテキストエリアをリサイズする
   *@param { object } mousedownObject -mousedown時の情報が入ったオブジェクト
   */
  function textareaResize(mousedownObject) {
    let targetElement = mousedownObject.target;

    targetElement.addEventListener('mousemove', textareaResizeOnMouseMove);
    document.addEventListener('mouseup', onMouseupTextareaElement);

    /**
     * mouseuo時にイベントを削除、ローカルストレージを更新
     * @param {object} mouseupObject - mouseup時の情報が入ったオブジェクト
     */
    function onMouseupTextareaElement(mouseupObject) {
      // テキストエリアからmousemove時のリサイズ処理のイベントを削除
      targetElement.removeEventListener('mousemove', textareaResizeOnMouseMove);
      // ローカルストレージの情報を更新
      saveBoxValueToLocalStorage(targetElement.parentElement.id);
      // documentからこのイベントを削除
      document.removeEventListener('mouseup', onMouseupTextareaElement);
    }

    /**
     *マウスの移動値をテキストエリアに適用
     *@param {object} mousemoveObject
     */
    function textareaResizeOnMouseMove(mousemoveObject) {
      let resizeTarget = mousemoveObject.target;
      // マウスポインタの移動値を追加する
      let applyWidth = resizeTarget.clientWidth + mousemoveObject.movementX;
      let applyHeight = resizeTarget.clientHeight + mousemoveObject.movementY;
      // 要素に横幅と縦幅を適用
      resizeTarget.style.width = `${applyWidth}px`;
      resizeTarget.style.height = `${applyHeight}px`;
    }
  }

  /**
   * キーボードショートカットを押した時に受信する信号を監視する
   */
  function keyBoadShortCutEvent() {
    // クライアントサイドのipcのモジュールを取得
    const ipc = require('electron').ipcRenderer;

    // ipc.sendSync('synchronous-message', 'ping');
    ipc.on('shortCutCtrl&N', (msg) => {
      // 新たな付箋要素を作成
      firstElementCreate();
    });
  }
})();
