// START
angular.module('shairy', ['ionic', 'rn-lazy', 'shairy.controllers', 'shairy.filters'])

.run(function ($rootScope, $state, $timeout, $http, $ionicScrollDelegate, $ionicPlatform){
  // SETTINGS
  $rootScope.debug = true;
  $rootScope.production = true;
  var jsKey = 'MvTrXFa7M3FfdVVyPHrpIHHE4EauI1iK5JVm37oB';
  var appId = 'ODlR3SDDnQktio67j0jX0GvD2IIDM3Jwz4wnhO60';
  var appName = 'SaloneDigitale';
  var appVersion = '1.0.8';
  $rootScope.colors = ['#8e9bad', '#f4ba51', '#f4e345', '#9cea73', '#6ac9d3', '#5e9e35', '#1a7cad', '#e55a5a', '#edb9b9', '#c567e8', '#bcbcbc'];
  $rootScope.toPreload = ['profile', 'salone', 'settings', 'roll', 'photo'];

  // LOAD THINGS
  Parse.initialize(appId, jsKey);
  var user = Parse.User.current();
  if (user)
    $rootScope.me = user.toJSON();
  else
    $rootScope.me = {};
  $rootScope.imgUrl = 'cdvfile://localhost/persistent/Shairy/';
  $rootScope.device = 'Non definito';
  $rootScope.Math = window.Math;
  $rootScope.online = true;
  $rootScope.isLoaded = false;
  $timeout(function (){
    $rootScope.isLoaded = true;
  }, 2000);
  var tipTimer, errorTimer;

  // OPERATING SYSTEM?
  $rootScope.android = ionic.Platform.isAndroid();
  if ($rootScope.android){
    $rootScope.viewportWidth = window.screen.width;
    $rootScope.viewportHeight = window.screen.height;      
  } else {
    steroids.statusBar.onTap(function (){
      $ionicScrollDelegate.scrollTop(true);
    });
    $rootScope.viewportWidth = window.innerWidth;
    $rootScope.viewportHeight = window.innerHeight - 20;
  }

  // FUNCTIONS
  $rootScope.checkConnection = function (){
    if (navigator.connection){
      var networkState = navigator.connection.type;
      var states = {};
      states[Connection.UNKNOWN]  = 'Unknown';
      states[Connection.ETHERNET] = 'Ethernet';
      states[Connection.WIFI]     = 'WiFi';
      states[Connection.CELL_2G]  = '2G';
      states[Connection.CELL_3G]  = '3G';
      states[Connection.CELL_4G]  = '4G';
      states[Connection.CELL]     = 'Cell';
      states[Connection.NONE]     = false;

      return states[networkState];
    } else
      return false;
  };

  $rootScope.delError = function (){
    window.postMessage({action: 'delError'});
  };

  $rootScope.doError = function (error, action, errorObj, invisible){
    if ($rootScope.error)
      $timeout.cancel(errorTimer);
    if (!invisible)
      window.postMessage({action: 'error', value: action, error: error, object: errorObj});
    if (errorObj)
      steroids.logger.log('Action: ' + action + ' - Error: ' + error + ' - Object: ' + JSON.stringify(errorObj));
    else
      steroids.logger.log('Action: ' + action + ' - Error: ' + error);
    if ($rootScope.debug)
      if ($rootScope.me)
        Parse.Cloud.run('error', {device: $rootScope.device, appName: appName, appVersion: appVersion, workId: $rootScope.me.objectId, workName: $rootScope.me.workname, action: action, description: error, object: errorObj});
      else
        Parse.Cloud.run('error', {device: $rootScope.device, appName: appName, appVersion: appVersion, action: action, description: error, object: errorObj});
  };

  $rootScope.delTip = function (){
    window.postMessage({action: 'delTip'});
  };

  $rootScope.doTip = function (tip, addedPhoto){
    if ($rootScope.tip)
      $timeout.cancel(tipTimer);
    window.postMessage({action: 'tip', value: tip});
    if (addedPhoto)
      $rootScope.addedPhoto = addedPhoto;
    else
      delete $rootScope.addedPhoto;
  };

  $rootScope.stringDate = function (date){
    var newDate;
    var dateDiff = Date.now() - date;
    if (dateDiff < 10000)
      newDate = "ora";
    else if (dateDiff < 60*1000)
      newDate = "meno di un minuto fa";
    else if (dateDiff < 2*60*1000)
      newDate = "più di un minuto fa";
    else if (dateDiff < 60*60*1000)
      newDate = "qualche minuto fa";
    else if (dateDiff < 2*60*60*1000)
      newDate = "più di un'ora fa";
    else if (dateDiff < 24*60*60*1000)
      newDate = "meno di un giorno fa";
    else if (dateDiff < 48*60*60*1000)
      newDate = "più di un giorno fa";
    else {
      var now = new Date();
      var day = now.getDate();
      var month = now.getMonth()+1;
      var year = now.getFullYear();
      var art = "il";
      if (day == 1 || day == 8 || day == 11)
        art = "l'";
      newDate = art+" "+day+"/"+month+"/"+year;
    }
    return newDate;
  };

  $rootScope.ucFirst = function (string){
    return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase();
  };

  $rootScope.openNew = function (type, name, preload){
    var webview;
    if ($rootScope.toPreload.indexOf(name) >= 0){
      if (name.indexOf('http://') >= 0)
        webview = new steroids.views.WebView({location: name, id: name});
      else
        webview = new steroids.views.WebView({location: 'app/shairy/' + name + '.html', id: name});
    } else {
      if (name.indexOf('http://') >= 0)
        webview = new steroids.views.WebView(name);
      else
        webview = new steroids.views.WebView('app/shairy/' + name + '.html');
      if (preload)
        webview.preload({id: name}, {
          onSuccess: function (){
            window.postMessage({action: 'preload', value: name});
          }
        });
    }
    if (type === 'modal')
      steroids.modal.show(webview);
    else if (type === 'webview')
      steroids.layers.push({view: webview, navigationBar: true});
    else if (type === 'section')
      steroids.drawers.hide({center: webview});
    else
      steroids.layers.push({view: webview, navigationBar: false});
  };

  $rootScope.closeModal = function (edited, callback){
    if (edited)
      navigator.notification.confirm(
        'Hai effettuato delle modifiche. Sei sicuro di volerle annullare?',
        function (i){
          if (i === 1){
            steroids.modal.hide({}, {
              onSuccess: callback
            });
          }
        },
        'Attenzione',
        ['Si', 'No']
      );
    else
      steroids.modal.hide({}, {
        onSuccess: callback
      });
    delete $rootScope.error;
    delete $rootScope.tip;
  };

  $rootScope.backAll = function (edited){
    if (edited)
      navigator.notification.confirm(
        'Hai effettuato delle modifiche. Sei sicuro di volerle annullare?',
        function (i){
          if (i === 1)
            steroids.layers.popAll();
        },
        'Attenzione',
        ['Si', 'No']
      );
    else
      steroids.layers.popAll();
    delete $rootScope.error;
    delete $rootScope.tip;
  };

  $rootScope.back = function (edited){
    if (edited)
      navigator.notification.confirm(
        'Hai effettuato delle modifiche. Sei sicuro di volerle annullare?',
        function (i){
          if (i === 1)
            steroids.layers.pop();
        },
        'Attenzione',
        ['Si', 'No']
      );
    else
      steroids.layers.pop();
    delete $rootScope.error;
    delete $rootScope.tip;
  };

  $rootScope.toggleTooltip = function (id){
    document.getElementById(id).classList.toggle('visible');
  };

  $rootScope.photoFromCamera = function (action){
    if (action)
      var dim = 960;
    else
      var dim = 240;
    navigator.camera.getPicture(
      function (data){
        if (action)
          window.postMessage({action: 'workerPhoto', value: 'data:image/png;base64,' + data});
        else
          window.postMessage({action: 'photoBranding', value: {image: 'data:image/png;base64,' + data, photoSource: 'camera'}});
      },  
      function (message){
      },
      {
        quality: 50,
        allowEdit: true,
        destinationType: Camera.DestinationType.DATA_URL,
        correctOrientation: true,
        saveToPhotoAlbum: true,
        targetWidth: dim,
        targetHeight: dim
      }
    );
  };

  $rootScope.photoFromLibrary = function (action){
    if (action)
      var dim = 960;
    else
      var dim = 240;
    navigator.camera.getPicture(
      function (data){
        if (action)
          window.postMessage({action: 'workerPhoto', value: 'data:image/png;base64,' + data});
        else
          window.postMessage({action: 'photoBranding', value: {image: 'data:image/png;base64,' + data, photoSource: 'library'}});
      }, 
      function (message){
      },
      {
        quality: 50,
        allowEdit: true,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        destinationType: Camera.DestinationType.DATA_URL,
        saveToPhotoAlbum: false,
        correctOrientation: true,
        targetWidth: dim,
        targetHeight: dim
      }
    );
  };

  // EVENTS
  window.onerror = function (error, url, line, column){
    if (typeof line != 'undefined'){
      var action = url + ':' + line + ':' + column;
      steroids.logger.log('Error: ' + error + ' - Script: ' + action);
      if ($rootScope.debug)
        if ($rootScope.me)
          Parse.Cloud.run('error', {device: $rootScope.device, appName: appName, appVersion: appVersion, workId: $rootScope.me.objectId, workName: $rootScope.me.workname, action: action, description: error});
        else
          Parse.Cloud.run('error', {device: $rootScope.device, appName: appName, appVersion: appVersion, action: action, description: error});
    }
    return true;
  };

  window.addEventListener('orientationchange', function (){
    $rootScope.$apply(function (){
      if ($rootScope.android){
        $rootScope.viewportWidth = window.screen.width;
        $rootScope.viewportHeight = window.screen.height;
      } else {
        $rootScope.viewportWidth = window.innerWidth;
        $rootScope.viewportHeight = window.innerHeight - 20;
      }
    });
  }, false);

  document.addEventListener('deviceready', function (){
    $rootScope.device = device.platform + ' ' + device.version + ' - ' + device.model;
    steroids.view.setBackgroundColor('#000000');
  });

  window.addEventListener('message', function (e){
    if (e.data.action === 'login')
      $rootScope.$apply(function (){
        $rootScope.me = e.data.me;
        $rootScope.photos = e.data.photos;
      });
    else if (e.data.action === 'logout'){
      for (i in localStorage)
        if (i !== 'allServices' && i !== 'products')
          delete localStorage[i];
      $rootScope.$apply(function (){
        if (!$rootScope.online && $rootScope.checkConnection())
          $rootScope.online = true;
      });
    } else if (e.data.action === 'addPhoto'){
      if ($rootScope.photos){
        $rootScope.photos.unshift(e.data.value);
        if (!e.data.invisible){
          var tip = 'Hai inserito una nuova foto.';
          $rootScope.doTip(tip);
        }
      }
    } else if (e.data.action === 'delphoto')
      $rootScope.$apply(function (){
        $rootScope.photos = e.data.value;
      });
    else if (e.data.action === 'modsalone')
      $rootScope.$apply(function (){
        $rootScope.me = e.data.value;
      });
    else if (e.data.action === 'tip'){
      $timeout(function (){
        $rootScope.tip = e.data.value;
      }, 0);
      tipTimer = $timeout(function (){
        delete $rootScope.tip;
      }, 5000);
    } else if (e.data.action === 'error'){
      $timeout(function (){
        $rootScope.error = e.data.error;
      }, 0);
      errorTimer = $timeout(function (){
        delete $rootScope.error;
      }, 5000);
    } else if (e.data.action === 'preload')
      $rootScope.$apply(function (){
        $rootScope.toPreload.push(e.data.value);
      });
    else if (e.data.action === 'delError')
      $rootScope.$apply(function (){
        $timeout.cancel(errorTimer);
        delete $rootScope.error;
      });
    else if (e.data.action === 'delTip')
      $rootScope.$apply(function (){
        $timeout.cancel(tipTimer);
        delete $rootScope.tip;
        if ($rootScope.addedPhoto){
          window.postMessage({action: 'viewingPhoto', value: 0});
          $rootScope.openNew('modal', 'photo');
        }
      });
  }, false);

  document.addEventListener('offline', function (){
    $rootScope.$apply(function (){
      $rootScope.online = false;
    });
  }, false);

  document.addEventListener('online', function (){
    $rootScope.$apply(function (){
      $rootScope.online = true;
    });
  }, false);

  document.addEventListener('backbutton', function (e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    steroids.layers.pop();
  }, false);
});