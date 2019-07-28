window.addEventListener('load', function() {
  var os = checkOs();
  var DOWNLOAD_BUTTON = document.getElementById('js-download');
  var message = 'Please wait ...';
  var fileName = '';
  switch(os) {
    case 'phone':
      message = 'Please see this site on Desktop PC.';
      break;
    case 'mac':
      message = 'Download for Mac.';
      fileName = 'StickyNotes-1.0.0.dmg';
      break;
    case 'win':
      message = 'Download for Windows.';
      fileName = 'StickyNotes Setup 1.0.0.exe';
      break;
    case 'linux':
      message = 'StickyNotes cannot use on Linux.';
      break;
  }
  DOWNLOAD_BUTTON.innerText = message;
  if(os == 'mac' || os == 'win') {
    DOWNLOAD_BUTTON.addEventListener('click', function(e) {
      window.open('./app/'+fileName);
    })
  }
});

function checkOs() {
  var os ='';
  if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)){
    os = 'phone';
  } else if (navigator.platform.toUpperCase().indexOf('MAC')>=0) {
    os = 'mac';
  } else if (navigator.platform.toUpperCase().indexOf('WIN')>=0) {
    os = 'win';
  } else if (navigator.platform.toUpperCase().indexOf('LINUX')>=0) {
    os = 'linux';
  } 
  return os;
}
