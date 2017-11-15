/**
 *@fileoverview 付箋紙の要素に対するイベント操作・記憶処理を行う
 *@author AkihisaOchi
 */
(function() {

  /** storageにはローカルストレージオブジェクトが格納される @const { object } */
  const STORAGE = localStorage;
  /** appendTargetIdは要素をhtmlにappendするための鍵となるId @const { object } */
  const SCREEN_TARGET = document.getElementById( 'js__append--target' );

  window.addEventListener( 'load', function () {

    let uniqueId = createUniqueId();
    appendElements( SCREEN_TARGET, [ createBox( uniqueId ) ] );

  });

  /**
   *@param { string } keyId - Boxの情報を記憶する鍵となるid
   *@return { object } 付箋紙を再現するhtml要素を返す
   */
  function createBox( keyId ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof keyId !== 'string' ) {
      throw new Error( 'In createBox() at "keyId" must be string' );
    }

    //boxElementはreturnされるhtml要素
    let boxElement = createElementAndSetAttribute( 'section', { 'class': 'box box__color--yellow' } );
    boxElement.setAttribute('id', keyId);

    //headlineElementはboxElementの子要素
    let headlineElement = createElementAndSetAttribute( 'h1', { 'class': 'box__headline' } ),
        appendButtonElement = createElementAndSetAttribute( 'i', { 'class': 'fa fa-plus', 'role': 'button' , 'aria-hidden': 'true' } ),
        settingButtonElement = createElementAndSetAttribute('i', { 'class': 'fa fa-cog', 'role': 'button', 'aria-hidden': 'true' }),
        removeButtonElement = createElementAndSetAttribute( 'i', { 'class': 'fa fa-trash-o', 'role': 'button' , 'aria-hidden': 'true' } );

    //appendButtonElementにイベントを追加
    appendButtonElement.addEventListener( 'click', elementAppendOnButtonClicked );

    //settingButtonElementにイベントを追加
    settingButtonElement.addEventListener( 'click', elementSettingOnButtonClicked );

    //removeButtonElementにイベントを追加
    removeButtonElement.addEventListener( 'click', elementRemoveOnButtonClicked );

    //headlineElementに子要素を追加
    headlineElement = appendElements( headlineElement, [ appendButtonElement, settingButtonElement, removeButtonElement ] );

    //headlineElementにイベントを追加
    headlineElement.addEventListener( 'mousedown', elementMoveOnDrug );

    //textareaElementはboxElementの子要素
    let textareaElement = createElementAndSetAttribute('textarea', { 'class': 'box__textarea' });
    //textareaElementにイベントを追加・削除
    textareaElement.addEventListener( 'mouseover', addEventCursorAllScrollOnMouseover );
    textareaElement.addEventListener( 'mouseout', function() {
      textareaElement.removeEventListener( 'mouseover', addEventCursorAllScrollOnMouseover );
    });

    boxElement = appendElements( boxElement, [ headlineElement, textareaElement ] );
    boxElement.style.zIndex = 100;

    boxElement.addEventListener( 'click', controlZIndexOnBoxClicked );

    //boxElementを返す
    return boxElement;

  }//--- end createBox()

  /**
   *createUniqueIdは重複することのない文字列を返す
   *@return { string } Boxの情報を記憶する鍵となるidを生成する
   */
  function createUniqueId() {

    let characterGroup = 'abcdefghijklmnopqrstuvwxyz0123456789',
        idLength = 25,
        uniqueId = '';

    for( let i = 0; i < idLength; i++ ){
      uniqueId += characterGroup[ Math.floor( Math.random() * idLength ) ];
    }

    return uniqueId;

  }//--- end createUniqueId()

  /**
   *elementMoveOnDrugはマウスの移動に合わせて要素を移動させる
   *マウスの移動が要素の移動よりも速い場合に備えてdocumentに対してmouseomoveイベントを設定する
   *@param { object } mouseDownObject - mousedown時の情報が入ったオブジェクト
   */
  function elementMoveOnDrug( mouseDownObject ) {

    //mousedownイベントの対象となる要素と移動処理を適用する親要素を取得
    let [ targetElement, parentElement ] = [ mouseDownObject.target, mouseDownObject.target.parentNode ];

    //スクリーンをはみ出すかどうかを判定するために画面サイズを取得
    let [ windowWidth, windowHeight ] = [ screen.width, screen.height ];

    //mousemove時にスクリーンを超えたかどうかを判定するために親要素のサイズを取得
    let [ parentWidth, parentHeight ] = [ parentElement.offsetWidth, parentElement.offsetHeight ];

    //マウスの移動が要素の移動よりも速い場合に備えてdocumentにmousemoveイベントを設置
    document.addEventListener( 'mousemove', elementMoveWithMouseMove );

    /**
     *mouseの移動に合わせて要素を移動させる
     *@param { object } mouseMoveObject - mousemove時の情報が入ったオブジェクト
     */
    function elementMoveWithMouseMove( mouseMoveObject ) {

      //mousemoveに合わせて位置を変更するために要素の位置情報を取得
      let [ parentPositionLeft, parentPositionTop ] = [ parentElement.offsetLeft, parentElement.offsetTop ];
      let [ parentPositionRight, parentPositionBottom ] = [ ( parentPositionLeft + parentWidth ), ( parentPositionTop + parentHeight ) ];

      //X軸座標において要素がスクリーンを超えて移動しないためのガード節
      if ( parentPositionRight > windowWidth ) {
        parentPositionLeft = windowWidth - parentWidth;
      } else if ( parentPositionLeft < 0 ) {
        parentPositionLeft = 0;
      } else {
        parentPositionRight += mouseMoveObject.movementX;
        parentPositionLeft += mouseMoveObject.movementX;
      }
      //Y軸座標において要素がスクリーンを超えて移動しないためのガード節
      if ( parentPositionBottom > windowHeight ) {
        parentPositionTop = windowHeight - parentHeight;
      } else if ( parentPositionTop < 0 ) {
        parentPositionTop = 0;
      } else {
        parentPositionBottom += mouseMoveObject.movementY;
        parentPositionTop += mouseMoveObject.movementY;
      }
      //parentElementにmousemoveに対応する位置情報を適用
      parentElement.style.left = parentPositionLeft + 'px';
      parentElement.style.top = parentPositionTop + 'px';

    }//--- end elementMoveWithMouseMove()

    //mouseup時にmousemoveのイベントを削除
    document.addEventListener( 'mouseup', function () {

      document.removeEventListener( 'mousemove', elementMoveWithMouseMove );

    });

  }//--- end elementMoveOnDrug()

  /**
   *テキストエリアのリサイズ可能範囲(右下部分)にマウスポインタを合わせた場合にcursorプロパティにall-scrollを適用する
   *@param { object } mouseoverObject - mouseover時の情報が入ったオブジェクト
   */
  function addEventCursorAllScrollOnMouseover( mouseoverObject ) {

    mouseoverObject.target.addEventListener( 'mousemove', function ( mousemoveObject ) {

      let targetElement = mousemoveObject.target,
          [ targetWidth, targetHeight ] = [ targetElement.clientWidth, targetElement.clientHeight ],
          [ cursorPositionX, cursorPositionY ] = [ mousemoveObject.offsetX, mousemoveObject.offsetY ];

      //テキストエリアのリサイズ可能範囲かどうかを判定し、cursorプロパティにall-scrollを適用する
      if ( cursorPositionX > ( targetWidth - 15 ) && cursorPositionY > ( targetHeight - 15 ) ) {
        targetElement.style.cursor = 'all-scroll';
      } else {
        targetElement.style.cursor = 'auto';
      }

    });

  }//--- end addEventCursorAllScrollOnMouseover()

  /**
   *appendボタンがクリックされたときに要素を追加する
   *@param {object} clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementAppendOnButtonClicked( clickObject ) {

    let grandParentElement = clickObject.target.parentElement.parentElement,
        [ addPositionX, addPositionY ] = [ grandParentElement.offsetLeft, ( grandParentElement.offsetTop + grandParentElement.offsetHeight ) ];

    let uniqueId = createUniqueId();
    let appendBox = createBox(uniqueId);

    appendBox.style.left = addPositionX + 'px';
    appendBox.style.top = addPositionY + 'px';

    appendElements( SCREEN_TARGET, [ appendBox ] );

  }//--- end elementAppendOnButtonClicked()

  /**
   *settingボタンが押されたときにメニューバーを表示する(色を変えたりフォントサイズを変更したりするための)
   *@param { object } clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementSettingOnButtonClicked( clickObject ) {

    let showTarget = clickObject.target.parentElement.parentElement,
        settingMenu = createElementAndSetAttribute( 'div', { 'class': 'box__headline--setting' } ),
        yellowBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--yellow', 'role': 'button', 'aria-hidden': 'true', 'title': 'change yellow' } ),
        blueBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--blue', 'role': 'button', 'aria-hidden': 'true', 'title': 'change blue' } ),
        pinkBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--pink', 'role': 'button', 'aria-hidden': 'true', 'title': 'change pink' } ),
        greenBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--green', 'role': 'button', 'aria-hidden': 'true', 'title': 'change green' } ),
        grayBtn = createElementAndSetAttribute( 'i', { 'class': 'box__headline--setting-color-btn box__color--gray', 'role': 'button', 'aria-hidden': 'true', 'title': 'change gray' } ),
        largerTxtBtn = createElementAndSetAttribute( 'i', { 'class': 'fa fa-search-plus', 'role': 'button', 'aria-hidden': 'true', 'title': 'more larger' } ),
        smallerTxtBtn = createElementAndSetAttribute( 'i', { 'class': 'fa fa-search-minus', 'role': 'button', 'aria-hidden': 'true', 'title': 'more smaller' } ),
        closeBtn = createElementAndSetAttribute( 'i', { 'class': 'fa fa-times', 'role': 'button', 'aria-hidden': 'true', 'title': 'close' } );

    closeBtn.addEventListener('click', function ( clickObject ) {
      showTarget.removeChild( clickObject.target.parentElement );
    });
    settingMenu = appendElements( settingMenu, [ yellowBtn, blueBtn, pinkBtn, greenBtn, grayBtn, largerTxtBtn, smallerTxtBtn, closeBtn ] );
    appendElements( showTarget, [ settingMenu ] );

  }//--- end elementSettingOnButtonClicked()

  /**
   *付箋要素がクリックされたときに他の要素よりも表示を手前にする
   *@param { object } clickObject - クリック時の情報が入ったオブジェクト
   */
  function controlZIndexOnBoxClicked( clickObject ) {

    //クリックイベントが設定された要素のidを取得する
    let clickedBoxId = this.id;
    //画面に表示されている付箋要素の一覧を取得
    let boxElements = SCREEN_TARGET.children;

    //付箋要素の一覧をループで回す
    for ( let key in boxElements ) {

      let thisBox = boxElements[ key ];

      //.childrenで取得した要素にはメソッドが含まれているのでhtml要素の場合にだけ処理を実行
      if ( typeof thisBox === 'object' ) {

        //クリックイベントが設定された要素のidと一致した場合に手前に表示する
        if (thisBox.id === clickedBoxId) {
          thisBox.style.zIndex = 101;
        } else {
          thisBox.style.zIndex = 100;
        }

      }

    }

  }//--- end controlZIndexOnBoxClicked()

  /**
   *removeボタンが押されたときに要素をremoveする
   *@param { object } clickObject - クリック時の情報が入ったオブジェクト
   */
  function elementRemoveOnButtonClicked( clickObject ) {

    //削除する対象となる要素を取得
    let removeElement = clickObject.target.parentElement.parentElement;

    //画面から削除する
    SCREEN_TARGET.removeChild(removeElement);

    //全ての子要素がなくなったときにはlenghtが0になるので新たな付箋要素を生成して表示する
    if ( SCREEN_TARGET.children.length === 0 ) {
      let uniqueId = createUniqueId();
      appendElements( SCREEN_TARGET, [ createBox( uniqueId ) ] );
    }

  }//--- end elementRemoveOnButtonClicked()

  /**
   *createElementAndSetAttributeは引数を元にhtml要素を返す
   *@param { string } tagName - 生成する要素のタグ名
   *@param { object } attributes - 要素にセットされる属性 / keyは属性名でvalueは属性値
   *@return { object } tagNameを要素名としattributesが属性としてセットされたhtml要素
   */
  function createElementAndSetAttribute( tagName, attributes ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof tagName !== 'string' ) {
      throw new Error( 'In createElementAndSetAttribute() at "tagName" must be string' );
    }
    if ( typeof attributes !== 'object' ) {
      throw new Error( 'In createElementAndSetAttribute() at "attributes" must be object' );
    }

    //要素を生成
    let element = document.createElement( tagName );

    //attributesを要素に設定
    for ( const key in attributes ) {
      element.setAttribute( key, attributes[ key ] );
    }

    //要素を返す
    return element;

  }//--- end createElementAndSetAttribute()

  /**
   *appendElementsはtargetElementに対してmaterialElementsをループで回してappendchildする
   *@param { object } targetElement - appendchildの対象となる要素
   *@param { array } materialElements - appendChildの素材となる要素軍群
   */
  function appendElements( targetElement, materialElements ) {

    //引数のデータ型が期待通りかどうかを判定
    if ( typeof targetElement !== 'object' ) {
      throw new Error( 'In appendElement() at "targetElement" must be object' );
    }
    if ( materialElements instanceof Array !== true ) {
      throw new Error( 'In appendElement() at "materialElements" must be array' );
    }
    //targetElementに対してmaterialElementsをループで回してappendchildする
    for ( const key in materialElements ) {
      targetElement.appendChild( materialElements[ key ] );
    }
    //targetElementを返す
    return targetElement;

  }//--- end appendElements()

})();