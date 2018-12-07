/**
 *@fileoverview control event and data about StickyNotes
 *@author AkihisaOchi
 *
 * ---------------- localStorage memo ----------------
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
 * ---------------- localStorage memo ----------------
 *
 */
(function() {
  const ELECTRON_MODULE = require('electron').remote;
  const IPC_RENDERER = require('electron').ipcRenderer;
  const FILE_SYSTEM = require('fs');
  let STORAGE = localStorage;
  let BOX_IDS = [];
  const SCREEN_TARGET = document.getElementById('js__append--target');
  const DEFAULT_FONTSIZE = '1.75rem';

  /**
   * 呼ぶたびにカウントを進める(付箋要素のz-indexを操作するときに使用する)
   * @return {number}
   */
  const Z_INDEX_COUNTER = {
    count: 100,
    countUp: () => {
      return Z_INDEX_COUNTER.count++;
    },
    countReset: () => {
      return (Z_INDEX_COUNTER.count = 100);
    },
    getCount: () => {
      return Z_INDEX_COUNTER.count;
    },
  };

  /**
   * ロード時にローカルストレージを呼び出し、処理を分岐させる
   */
  window.addEventListener('load', () => {
    keyboardShortCutsEvent();
    document.addEventListener('mousedown', hideWindowOnClickDocument);

    if ('IDS' in STORAGE) {
      elementCreateFromArray();
    } else {
      firstElementCreate();
    }
  });


  /**
   * 生成したユニークなidをもとに付箋要素を生成し、情報をローカルストレージに記憶する
   */
  function firstElementCreate() {
    let uniqueId = createUniqueId();
    showBoxElementInScreen(uniqueId);
    controlIdsToLocalStorage(uniqueId, 'push');
  }

  /**
   * ローカルストレージから取得した配列をループし、要素を生成する
   */
  function elementCreateFromArray() {
    BOX_IDS = JSON.parse(STORAGE.IDS);
    for (let i = 0; i < BOX_IDS.length; i++) {
      if (BOX_IDS[i] === null) continue;

      let thisId = BOX_IDS[i];

      appendElements(SCREEN_TARGET, [createBox(thisId)]);

      applyBoxValueFromLocalStorage(thisId);
    }
  }

  /**
   * idを元に要素生成しを画面に出力する
   * @param {string} showId - このidを元に要素生成・画面出力・ローカルストレージへの保存をするためのする
   */
  function showBoxElementInScreen(showId) {
    appendElements(SCREEN_TARGET, [createBox(showId)]);

    saveBoxValueToLocalStorage(showId);
  }

  /**
   * 付箋要素を生成する(生成要素にはイベント設置済み)
   * @param {string} keyId - Boxの情報を記憶する鍵となるid
   * @return {object} 付箋紙を再現するhtml要素を返す
   */
  function createBox(keyId) {
    if (typeof keyId !== 'string') {
      throw new Error('In createBox() at "keyId" must be string');
    }

    let boxWrapperElement = createElementAndSetAttribute('section', {
      'class': 'box box__color--yellow',
    });
    boxWrapperElement.setAttribute('id', keyId);

    let boxHeadlineElement = createBoxHeadlineElement();

    let boxTextareaElement = createBoxTextareaElement();

    boxWrapperElement = appendElements(
      boxWrapperElement,
      [boxHeadlineElement, boxTextareaElement]
    );
    boxWrapperElement.style.zIndex = Z_INDEX_COUNTER.countUp();

    boxWrapperElement.addEventListener(
      'mousedown', controlZIndexOnBoxMousedown
    );

    return boxWrapperElement;
  }

  /**
   * 付箋のメニューバー要素を生成しリターンする
   * @return {object} boxHeadlineElement - メニューバーのhtmlElement
   */
  function createBoxHeadlineElement() {
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

    appendButtonElement.addEventListener(
      'click', elementAppendOnButtonClicked
    );

    settingButtonElement.addEventListener(
      'click', elementSettingOnButtonClicked
    );

    removeButtonElement.addEventListener('click', elementRemoveOnButtonClicked);

    boxHeadlineElement = appendElements(
      boxHeadlineElement,
      [appendButtonElement, settingButtonElement, removeButtonElement]
    );

    boxHeadlineElement.addEventListener('mouseover',
      setmouseMoveEventOnMouseover
    );

    /**
     * マウスオーバー時に要素が子要素を含めば移動イベントを設置する
     * @param {Object} mouseoverObject
     */
    function setmouseMoveEventOnMouseover(mouseoverObject) {
      (mouseoverObject.target.children.length > 0) ?
        this.addEventListener('mousedown', elementMoveOnDrug) :
        this.removeEventListener('mousedown', elementMoveOnDrug);
    }

    return boxHeadlineElement;
  }

  /**
   * テキストエリアの要素を生成しリターンする
   * @return {Object}
   */
  function createBoxTextareaElement() {
    let boxTextareaElement = createElementAndSetAttribute('textarea', {
      'class': 'box__textarea',
    });
    boxTextareaElement.style.fontSize = DEFAULT_FONTSIZE;

    boxTextareaElement.addEventListener(
      'mouseover', addEventCursorAllScrollOnMouseover
    );
    boxTextareaElement.addEventListener('mouseout', (mouseoutObject) => {
      boxTextareaElement.removeEventListener(
        'mouseover', addEventCursorAllScrollOnMouseover
      );
    });
    boxTextareaElement.addEventListener('change', (changeObject) => {
      saveBoxValueToLocalStorage(changeObject.target.parentElement.id);
    });

    return boxTextareaElement;
  }

  /**
   * createUniqueIdは重複することのない文字列を返す()
   * @return {String}
   */
  function createUniqueId() {
    let characterGroup = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let idLength = 25;
    let uniqueId = '';

    for (let i = 0; i < idLength; i++) {
      uniqueId += characterGroup[Math.floor(Math.random() * idLength)];
    }

    return uniqueId;
  }

  /**
   * elementMoveOnDrugはマウスの移動に合わせて要素を移動させる
   * マウスの移動が要素の移動よりも速い場合に備えてdocumentに対してmouseomoveイベントを設定する
   * @param {Object} mousedownObject
   */
  function elementMoveOnDrug(mousedownObject) {
    let parentElement = mousedownObject.target.parentNode;

    let [windowWidth, windowHeight] = [screen.width, screen.height];

    let parentWidth = parentElement.offsetWidth;
    let parentHeight = parentElement.offsetHeight;

    document.getElementsByTagName('textarea').Enable = false;

    document.addEventListener('mousemove', elementMoveWithMouseMove);

    /**
     * mouseの移動に合わせて要素を移動させる
     * @param {Object} mousemoveObject
     */
    function elementMoveWithMouseMove(mousemoveObject) {
      let parentPositionLeft = parentElement.offsetLeft;
      let parentPositionTop = parentElement.offsetTop;
      let parentPositionRight = (parentPositionLeft + parentWidth);
      let parentPositionBottom = (parentPositionTop + parentHeight);

      if (parentPositionRight > windowWidth) {
        parentPositionLeft = windowWidth - parentWidth;
      } else if (parentPositionLeft < 0) {
        parentPositionLeft = 0;
      } else {
        parentPositionRight += mousemoveObject.movementX;
        parentPositionLeft += mousemoveObject.movementX;
      }

      if (parentPositionBottom > windowHeight) {
        parentPositionTop = windowHeight - parentHeight;
      } else if (parentPositionTop < 0) {
        parentPositionTop = 0;
      } else {
        parentPositionBottom += mousemoveObject.movementY;
        parentPositionTop += mousemoveObject.movementY;
      }

      parentElement.style.left = `${parentPositionLeft}px`;
      parentElement.style.top = `${parentPositionTop}px`;
    }

    document.addEventListener('mouseup', eventDeleteAndSaveToLocalStorage);

    /**
     * mousemoveイベントを削除しローカルストレージの情報を更新する
     * @param {Object} mouseupObject
     */
    function eventDeleteAndSaveToLocalStorage(mouseupObject) {
      document.removeEventListener('mousemove', elementMoveWithMouseMove);

      document.getElementsByTagName('textarea').Enable = true;

      saveBoxValueToLocalStorage(parentElement.id);
      document.removeEventListener('mouseup', eventDeleteAndSaveToLocalStorage);
    }
  }

  /**
   * テキストエリアのリサイズ可能範囲(右下部分)にマウスポインタを合わせた場合にcursorプロパティにall-scrollを適用する
   * @param {Object} mouseoverObject
   */
  function addEventCursorAllScrollOnMouseover(mouseoverObject) {
    mouseoverObject.target.addEventListener(
      'mousemove', cursorChangeOnMousemove
    );
    /**
     * マウスの位置がテキストエリアのリサイズ可能範囲(右下から15*15以内の範囲)かどうかを判定しスタイルを適用する
     * @param {Object} mousemoveObject
     */
    function cursorChangeOnMousemove(mousemoveObject) {
      let targetElement = mousemoveObject.target;
      let targetWidth = targetElement.clientWidth;
      let targetHeight = targetElement.clientHeight;
      let cursorX = mousemoveObject.offsetX;
      let cursorY = mousemoveObject.offsetY;

      const resizableWidth = targetWidth - 15;
      const resizableHeight = targetHeight - 15;

      if (cursorX > resizableWidth && cursorY > resizableHeight) {
        targetElement.style.cursor = 'all-scroll';
        targetElement.addEventListener('mousedown', textareaResize);
      } else {
        targetElement.style.cursor = 'auto';
        targetElement.removeEventListener('mousedown', textareaResize);
      }
      mouseoverObject.target.addEventListener(
        'mousemove', cursorChangeOnMousemove
      );
    }
  }

  /**
   * appendボタンがクリックされたときに要素を追加する
   * @param {Object} clickObject
   */
  function elementAppendOnButtonClicked(clickObject) {
    let wrapperElement = clickObject.target.parentElement.parentElement;
    let addPositionX = wrapperElement.offsetLeft;
    let addPositionY = (wrapperElement.offsetTop + wrapperElement.offsetHeight);
    let applyColorClassName = getClassNameFromTarget(
      wrapperElement.classList, /^box__color--/
    );

    let uniqueId = createUniqueId();
    let appendBox = createBox(uniqueId);
    let removeColorClassName = getClassNameFromTarget(
      appendBox.classList, /^box__color--/
    );

    appendBox.style.left = `${addPositionX}px`;
    appendBox.style.top = `${addPositionY}px`;
    appendBox.classList.remove(removeColorClassName);
    appendBox.classList.add(applyColorClassName);

    appendElements(SCREEN_TARGET, [appendBox]);

    if (appendBox.clientHeight + addPositionY > screen.height) {
      appendBox.style.left = '0px';
      appendBox.style.top = '0px';
    } else {
      appendBox.style.left = `${addPositionX}px`;
      appendBox.style.top = `${addPositionY}px`;
    }

    controlIdsToLocalStorage(uniqueId, 'push');
    saveBoxValueToLocalStorage(uniqueId);
  }

  /**
   * settingボタンが押されたときにメニューバーを表示する(色を変えたりフォントサイズを変更したりする)
   * @param {Object} clickObject
   */
  function elementSettingOnButtonClicked(clickObject) {
    let showTarget = clickObject.target.parentElement.parentElement;
    let settingMenu = createSettingMenu();
    appendElements(showTarget, [settingMenu]);
  }

  /**
   * 設定メニューのhtml要素を生成しリターンする
   * @return {Object}
   */
  function createSettingMenu() {
    let settingMenu = createElementAndSetAttribute('div', {
      'class': 'box__headline--setting',
    });
    let colorBtnList = createColorBtnArray([
      'yellow', 'blue', 'pink', 'green', 'gray',
    ]);

    let largerTxtBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-search-plus',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'larger',
    });
    let smallerTxtBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-search-minus',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'smaller',
    });
    let closeBtn = createElementAndSetAttribute('i', {
      'class': 'fa fa-reply',
      'role': 'button',
      'aria-hidden': 'true',
      'title': 'close',
    });

    closeBtn.addEventListener('click', (clickObject) => {
      let showTarget = clickObject.target.parentElement.parentElement;
      showTarget.removeChild(clickObject.target.parentElement);
    });

    largerTxtBtn.addEventListener('click', fontSizeChangeOnBtnClicked);
    smallerTxtBtn.addEventListener('click', fontSizeChangeOnBtnClicked);

    settingMenu.addEventListener('mouseover', elementMoveOnSettingDrug);
    settingMenu.removeEventListener('mouseout', elementMoveOnSettingDrug);

    settingMenu = appendElements(
      settingMenu,
      [largerTxtBtn, ...colorBtnList, largerTxtBtn, smallerTxtBtn, closeBtn]
    );
    return settingMenu;
  }

  /**
   * ホバー時に付箋要素を移動させる
   * メニューバーの子要素の場合は付箋要素の移動イベントを削除する
   * @param {Object} mouseoverObject
   */
  function elementMoveOnSettingDrug(mouseoverObject) {
    (mouseoverObject.target.children.length > 0) ?
      this.addEventListener('mousedown', elementMoveOnDrug) :
      this.removeEventListener('mousedown', elementMoveOnDrug);
  }

  /**
   * 色のボタンがクリックされたときに付箋要素の背景色を変更する
   * @param {Object} clickObject
   */
  function colorChangeOnBtnClicked(clickObject) {
    let applyClassName = getClassNameFromTarget(
      clickObject.target.classList, /^box__color--/
    );

    let targetElement = clickObject.target.parentElement.parentElement;
    let removeClassName = getClassNameFromTarget(
      targetElement.classList, /^box__color--/
    );

    targetElement.classList.remove(removeClassName);
    targetElement.classList.add(applyClassName);
    saveBoxValueToLocalStorage(targetElement.id);
  }

  /**
   * カラーボタンのDOM要素を生成しその配列をリターンする
   * @param {Array} colorNameList
   * @return {Array}
   */
  function createColorBtnArray(colorNameList) {
    if (colorNameList instanceof Array !== true) {
      throw new Error(
        'In appendElement() at "materialElements" must be array'
      );
    }
    let colorBtnList = [];
    for (let key in colorNameList) {
      if (colorNameList[key] === null) continue;
      let thisValue = colorNameList[key];
      let thisColorBtn = createElementAndSetAttribute('i', {
        'class': `box__headline--setting-color-btn box__color--${thisValue}`,
        'role': 'button',
        'aria-hidden': 'true',
        'title': `change ${thisValue}`,
      });
      thisColorBtn.addEventListener('click', colorChangeOnBtnClicked);
      colorBtnList.push(thisColorBtn);
    }
    return colorBtnList;
  }

  /**
   *テキスト拡大ボタンが押された時に付箋要素のテキストを大きくする
   *@param {Object} clickObject
   */
  function fontSizeChangeOnBtnClicked(clickObject) {
    let fontSizeDirection = clickObject.target.title;
    if (fontSizeDirection !== 'larger' && fontSizeDirection !== 'smaller') {
      throw new Error(
        'In fontSizeChangeOnBtnClicked() at fontSizeDirection unexpected'
      );
    }

    let wrapperElement = clickObject.target.parentElement.parentElement;
    let targetElementStyle =
      clickObject.target.parentElement.previousElementSibling.style;
    let currentFontSize = targetElementStyle.fontSize;
    let currentFontSizeValue = Number(currentFontSize.replace(/rem/, ''));

    switch (fontSizeDirection) {
    case 'larger':
      applyFontSizeValue = (currentFontSizeValue < 4) ?
        currentFontSizeValue + 0.25 :
        currentFontSizeValue + 0;
      break;
    case 'smaller':
      applyFontSizeValue = (currentFontSizeValue > 1) ?
        currentFontSizeValue - 0.25 :
        currentFontSizeValue + 0;
      break;
    }

    targetElementStyle.fontSize = `${applyFontSizeValue}rem`;
    saveBoxValueToLocalStorage(wrapperElement.id);
  }
  /**
   * 付箋要素がクリックされたときに他の要素よりも表示を手前にする
   * @param {Object} mousedownObject
   */
  function controlZIndexOnBoxMousedown(mousedownObject) {
    let mousedownBoxId = this.id;
    let boxElements = SCREEN_TARGET.children;
    Z_INDEX_COUNTER.countReset();

    let idAndZIndexList = {};
    for (let i = 0; i < boxElements.length; i++) {
      let thisBox = boxElements[i];
      if (thisBox.id !== mousedownBoxId) {
        idAndZIndexList[thisBox.style.zIndex] = thisBox.id;
      }
    }
    for (let key in idAndZIndexList) {
      if (idAndZIndexList[key] === null) continue;
      document.getElementById(
        idAndZIndexList[key]
      ).style.zIndex = Z_INDEX_COUNTER.countUp();
      saveBoxValueToLocalStorage(idAndZIndexList[key]);
    }
    document.getElementById(
      mousedownBoxId
    ).style.zIndex = Z_INDEX_COUNTER.countUp();
    saveBoxValueToLocalStorage(mousedownBoxId);
  }

  /**
   * removeボタンが押されたときに要素をremoveする
   * @param {Object} clickObject
   */
  function elementRemoveOnButtonClicked(clickObject) {
    let removeElement = clickObject.target.parentElement.parentElement;

    let validateTarget = '';
    for (let i = 0; i < removeElement.children.length; i++) {
      let thisNode = removeElement.children[i];
      if (thisNode.tagName === 'TEXTAREA') {
        validateTarget = thisNode;
      }
    }
    (validateTarget.value !== '') ?
      showChoices(removeElement, validateTarget.value) :
      elementDeleteFromScreen(removeElement);
  }

  /**
   * 要素を画面から削除する
   * @param {Object} deleteElement
   */
  function elementDeleteFromScreen(deleteElement) {
    SCREEN_TARGET.removeChild(deleteElement);

    if (SCREEN_TARGET.children.length === 0) {
      STORAGE.clear();
      firstElementCreate();
    }
    controlIdsToLocalStorage(deleteElement.id, 'remove');
  }

  /**
   * 選択肢を表示しユーザーに注意喚起、選択肢に応じてイベントを実行
   * 選択肢 {削除, キャンセル, ファイルに書き出す}
   * @param {Object} deleteElement
   * @param {String} validateData
   */
  function showChoices(deleteElement, validateData) {
    let choiceBox = createElementAndSetAttribute('section', {
      'class': 'choice',
    });
    let headlineElement = createElementAndSetAttribute('h1', {
      'class': 'choice__headline',
    });
    let modal = createElementAndSetAttribute('div', {
      'class': 'modal',
    });
    headlineElement.textContent = 'このメモを保存しない場合、その内容はすべて失われます。';
    let explainElement = createElementAndSetAttribute('p', {
      'class': 'choice__explain',
    });
    explainElement.textContent = 'このメモを破棄してもよろしいですか？';
    let btnLines = createElementAndSetAttribute('ul', {
      'class': 'choice__btns',
    });

    let deleteChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--delete',
      'title': 'delete',
    });
    deleteChoice.textContent = '保存しない';
    deleteChoice.addEventListener('click', deleteChoiceEvent);

    let cancelChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--cancel',
      'title': 'cancel',
    });
    cancelChoice.textContent = 'キャンセル';
    cancelChoice.addEventListener('click', cancelChoiceEvent);

    let saveChoice = createElementAndSetAttribute('li', {
      'class': 'choice__btns--save',
      'title': 'save',
    });
    saveChoice.textContent = '保存...';
    saveChoice.addEventListener('click', saveChoiceEvent);

    appendElements(btnLines, [deleteChoice, cancelChoice, saveChoice]);
    appendElements(choiceBox, [headlineElement, explainElement, btnLines]);
    appendElements(SCREEN_TARGET, [choiceBox, modal]);

    /**
     * 保存しないボタンが押されたときは要素と選択肢を削除する
     * @param {Object} clickObject
     */
    function deleteChoiceEvent(clickObject) {
      removeElements(SCREEN_TARGET, [choiceBox, modal]);
      elementDeleteFromScreen(deleteElement);
    }

    /**
     * キャンセルボタンが押されたときは選択肢のみを削除する
     * @param {Object} clickObject
     */
    function cancelChoiceEvent(clickObject) {
      removeElements(SCREEN_TARGET, [choiceBox, modal]);
    }

    /**
     * 保存ボタンが押されたときは保存ダイアログを表示し、保存成功時に要素と選択肢ボックスを削除する
     * @param {Oject} clickObject
     */
    function saveChoiceEvent(clickObject) {
      const browserWindow = ELECTRON_MODULE.getCurrentWindow();
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
       * @param {String} writePath
       * @param {String} writeData
       */
      function writeFile(writePath, writeData) {
        if (typeof writePath !== 'string') {
          throw new Error('In writeFile at "writePath" must be string');
        }
        if (typeof writeData !== 'string') {
          throw new Error('In writeFile at "writeData" must be string');
        }

        FILE_SYSTEM.writeFile(writePath, writeData, 'utf8', fileWriteEvent);

        /**
         * ファイル保存が成功すれば要素と選択肢ボックスを削除、失敗すればエラーを返す
         * @param {String} writeError
         * @return {String}
         */
        function fileWriteEvent(writeError) {
          if (writeError) {
            return console.error(writeError);
          } else {
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
   * @param {String} tagName
   * @param {Object} attributes
   * @return {Object}
   */
  function createElementAndSetAttribute(tagName, attributes) {
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

    let element = document.createElement(tagName);

    for (const key in attributes) {
      if (attributes[key] === null) continue;
      element.setAttribute(key, attributes[key]);
    }

    return element;
  }

  /**
   * removeElementsはtargetElementに対してmaterialElementsをループで回してremoveChildする
   * @param {Object} targetElement
   * @param {Array} materialElements
   * @return {Object}
   */
  function removeElements(targetElement, materialElements) {
    if (typeof targetElement !== 'object') {
      throw new Error('In appendElement() at "targetElement" must be object');
    }
    if (materialElements instanceof Array !== true) {
      throw new Error('In appendElement() at "materialElements" must be array');
    }

    for (let i = 0; i < materialElements.length; i++) {
      targetElement.removeChild(materialElements[i]);
    }

    return targetElement;
  }

  /**
   * appendElementsはtargetElementに対してmaterialElementsをループで回してappendChildする
   * @param {Object} targetElement
   * @param {Array} materialElements
   * @return {Oject}
   */
  function appendElements(targetElement, materialElements) {
    if (typeof targetElement !== 'object') {
      throw new Error('In appendElement() at "targetElement" must be object');
    }
    if (materialElements instanceof Array !== true) {
      throw new Error('In appendElement() at "materialElements" must be array');
    }

    for (let i = 0; i < materialElements.length; i++) {
      targetElement.appendChild(materialElements[i]);
    }

    return targetElement;
  }

  /**
   * orderの指示に応じてBOX_IDSに対して特定のidを追加・削除しローカルストレージに保存する
   * @param {String} keyId
   * @param {String} order
   */
  function controlIdsToLocalStorage(keyId, order) {
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
    switch (order) {
    case 'push':
      BOX_IDS.push(keyId);
      break;
    case 'remove':
      for (let index in BOX_IDS) {
        if (BOX_IDS[index] === keyId) BOX_IDS.splice(index, 1);
      }
      STORAGE.removeItem(keyId);
      break;
    }

    STORAGE.IDS = JSON.stringify(BOX_IDS);
  }

  /**
   * idを元に付箋要素の表示情報を取得し、ローカルストレージに保存する
   * @param {String} saveTargetId
   */
  function saveBoxValueToLocalStorage(saveTargetId) {
    if (typeof saveTargetId !== 'string') {
      throw new Error(
        'In saveBoxValueToLocalStorage() at "saveTargetId" must be string'
      );
    }

    let savedTargetWrapper = document.getElementById(saveTargetId);
    if (savedTargetWrapper.length === 0) {
      throw new Error(
        'In saveBoxValueToLocalStorage() don\'t found element of this id'
      );
    }

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

    let saveClassName = getClassNameFromTarget(
      savedTargetWrapper.classList, /^box__color--/
    );

    let targetIdStatus = {
      'offsetLeft': savedTargetWrapper.style.left,
      'offsetTop': savedTargetWrapper.style.top,
      'zIndex': savedTargetWrapper.style.zIndex,
      'className': saveClassName,
      'clientWidth': `${savedTextareaElement.clientWidth}px`,
      'clientHeight': `${savedTextareaElement.clientHeight}px`,
      'fontSize': savedTextareaElement.style.fontSize,
      'value': savedTextareaElement.value,
    };
    STORAGE.setItem(saveTargetId, JSON.stringify(targetIdStatus));
  }

  /**
   * applyKeyIdを元にローカルストレージから情報を取り出し、applyKeyIdに対応した要素にスタイルを適用する
   * @param {String} applyKeyId
   */
  function applyBoxValueFromLocalStorage(applyKeyId) {
    if (typeof applyKeyId !== 'string') {
      throw new Error(
        'In applyBoxValueFromLocalStorage() at "applyKeyId" must be string'
      );
    }

    let applyObject = JSON.parse(STORAGE.getItem(applyKeyId));
    let applyTargetWrapper = document.getElementById(applyKeyId);
    let applyTextareaElement = applyTargetWrapper.lastElementChild;

    let removeClassName = getClassNameFromTarget(
      applyTargetWrapper.classList, /^box__color--/
    );

    for (let key in applyObject) {
      if (applyObject[key] === null) continue;
      let thisValue = applyObject[key];
      switch (key) {
      case 'offsetLeft':
        applyTargetWrapper.style.left = thisValue;
        break;
      case 'offsetTop':
        applyTargetWrapper.style.top = thisValue;
        break;
      case 'zIndex':
        applyTargetWrapper.style.zIndex = thisValue;
        break;
      case 'className':
        applyTargetWrapper.classList.remove(removeClassName);
        applyTargetWrapper.classList.add(thisValue);
        break;
      case 'clientWidth':
        applyTextareaElement.style.width = thisValue;
        break;
      case 'clientHeight':
        applyTextareaElement.style.height = thisValue;
        break;
      case 'fontSize':
        applyTextareaElement.style.fontSize = thisValue;
        break;
      case 'value':
        applyTextareaElement.value = thisValue;
        break;
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
   * @param {Object} targetList
   * @param {RegExp} regExp
   * @return {String}
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
    if (matchClassName === '') {
      throw new Error(
        `In getClassNameFromTarget() regExp[${regExp}] maybe wrong`
      );
    }
  }

  /**
   *mousedown時にテキストエリアをリサイズする
   *@param {Object} mousedownObject
   */
  function textareaResize(mousedownObject) {
    let targetElement = mousedownObject.target;

    targetElement.addEventListener('mousemove', textareaResizeOnMouseMove);
    document.addEventListener('mouseup', onMouseupTextareaElement);

    /**
     * mouseuo時にイベントを削除、ローカルストレージを更新
     * @param {oOject} mouseupObject
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
      let applyWidth = resizeTarget.clientWidth + mousemoveObject.movementX;
      let applyHeight = resizeTarget.clientHeight + mousemoveObject.movementY;
      resizeTarget.style.width = `${applyWidth}px`;
      resizeTarget.style.height = `${applyHeight}px`;
    }
  }

  /**
   * キーボードショートカットを押した時に受信する信号を監視する
   */
  function keyboardShortCutsEvent() {
    IPC_RENDERER.on('CmdOrCtrl+N', (msg) => {
      firstElementCreate();
    });
  }

  /**
   * 背景がクリックされた時にwindowを隠す信号をメインプロセスに送る
   * @param {Object} mousedownObject
   */
  function hideWindowOnClickDocument(mousedownObject) {
    if (mousedownObject.target.nodeName === 'HTML') {
      IPC_RENDERER.send('hide', 'hide');
    }
  }

  IPC_RENDERER.on('hideForWindows', (msg) => {
    SCREEN_TARGET.style.display = 'none';
  });

  window.addEventListener('focus', () => {
    SCREEN_TARGET.style.display = 'block';
  });
})();
