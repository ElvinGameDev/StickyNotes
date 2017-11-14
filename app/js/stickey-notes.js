/**
 *@fileoverview 付箋紙のelementをindex.html上に展開したり操作する
 *@author AkihisaOchi
 */
(function () {

  /** stotageにはローカルストレージオブジェクトが格納される @const { object } */
  const storage = localStorage;

  window.addEventListener( 'load', onLoad );

  function onLoad() {
    let uniqueId = createUniqueId();
    document.getElementById( 'js__append--target' ).appendChild( createBox( uniqueId ) );
  }

  /**
   *@param { string } arg1 Boxの情報を記憶する鍵となるid
   *@return { node } 付箋紙を再現するhtml要素
   */
  function createBox( keyId ) {
    //引数のデータが想定と合っているかどうかを判定
    if (typeof keyId !== 'string') {
      console.error('createBox() arg1 must be string');
      return;
    }
    //boxElementはreturnされるhtml要素
    let boxElement = createElementAndSetAttribute( 'section', { 'class': 'box box__color--yellow' } );
    boxElement.setAttribute('id', keyId);

    let headlineElement = createElementAndSetAttribute( 'nav', { 'class': 'box__headline' } );
    headlineElement.appendChild( createElementAndSetAttribute( 'i', { 'class': 'fa fa-plus', 'aria-hidden': 'true' } ) );
    headlineElement.appendChild( createElementAndSetAttribute( 'i', { 'class': 'fa fa-cog', 'aria-hidden': 'true' } ) );
    headlineElement.appendChild( createElementAndSetAttribute( 'i', { 'class': 'fa fa-trash-o', 'aria-hidden': 'true' } ) );
    headlineElement.addEventListener('mousedown', function( mouseEvent ) {
        addEventMoveOnDrug( mouseEvent );
    });

    let textareaElement = createElementAndSetAttribute( 'textarea', { 'class': 'box__textarea' } );

    boxElement.appendChild(headlineElement);
    boxElement.appendChild(textareaElement);
    return boxElement;

    /**
     *@param { string } arg1 生成するタグ名
     *@param { obj } arg2 セットする属性
     *@return { node } arg1をタグ名とし、arg2が属性としてセットされたhtml要素
     */
    function createElementAndSetAttribute( tagName, attributes ) {
      //引数のデータ型が想定と合っているかどうかを判定
      if ( typeof tagName !== 'string' ) {
        console.error('createElementAndSetAttribute() arg1 must be string');
        return;
      }
      if ( typeof attributes !== 'object' ) {
        console.error('createElementAndSetAttribute() arg2 must be object');
        return;
      }

      let element = document.createElement( tagName );
      for( const key in attributes ) {
        element.setAttribute( key, attributes[key] );
      }
      return element;
    }
  }

  /**
   *@return { string } Boxの情報を記憶する鍵となるidを生成する
   */
  function createUniqueId() {
    let ccharacterString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let stringLength = 20;
    let returnString = '';
    for( let i = 0; i < stringLength; i++ ){
      returnString += ccharacterString[ Math.floor( Math.random() * stringLength ) ];
    }
    return returnString;
  }

  function addEventMoveOnDrug( mouseEvent ) {
    //mousedownイベントの対象となるelement
    let targetElement = mouseEvent.target;
    //実際に位置情報を更新する親要素
    let parentElement = mouseEvent.target.parentNode;

    //スクリーンをはみ出すかどうかを判定するための画面サイズ
    let windowWidth = screen.width;
    let windowHeight = screen.height;

    //mousemove時にスクリーンを超えた移動を防ぐために親要素のサイズを取得
    let parentWidth = parentElement.offsetWidth;
    let parentHeight = parentElement.offsetHeight;

    document.addEventListener( 'mousemove', handleMouseMove, true );

    function handleMouseMove( mouseMoveEvent ) {

      //mousemoveに合わせて位置を変更するためにnodeの位置情報を取得
      let parentPositionLeft = parentElement.offsetLeft;
      let parentPositionTop = parentElement.offsetTop;
      let parentPositionRight = parentPositionLeft + parentWidth;
      let parentPositionBottom = parentPositionTop + parentHeight;

      //X軸座標において要素がスクリーンを超えて移動しないためのガード節
      if ( parentPositionRight > windowWidth ) {
        parentPositionLeft = windowWidth - parentWidth - 10;
      } else if ( parentPositionLeft < 0 ) {
        parentPositionLeft = 0;
      } else {
        parentPositionRight += mouseMoveEvent.movementX;
        parentPositionLeft += mouseMoveEvent.movementX;
      }
      //Y軸座標において要素がスクリーンを超えて移動しないためのガード節
      if ( parentPositionBottom > windowHeight + 1 ) {
        parentPositionTop = windowHeight - parentHeight;
      } else if ( parentPositionTop < 0 ) {
        parentPositionTop = 0;
      } else {
        parentPositionBottom += mouseMoveEvent.movementY;
        parentPositionTop += mouseMoveEvent.movementY;
      }
      //parentElementにmousemoveに対応する位置情報を適用
      parentElement.style.left =  parentPositionLeft + 'px';
      parentElement.style.top =  parentPositionTop + 'px';
    }
    //mouseup時にmousemoveのイベントを削除
    document.addEventListener('mouseup', function ( mouseUpEvent ) {
      document.removeEventListener( 'mousemove', handleMouseMove, true );
    }, true );
  }

})();