(function() {
  module.exports = {
    app: {
      name: "Shairy SM"
    },
    network: {
      extraResponseHeaders: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With, Authorization"
      }
    },
    webView: {
      viewsIgnoreStatusBar: true,
      enableDoubleTapToFocus: false,
      disableOverscroll: true,
      enableViewportScale: false,
      enablePopGestureRecognition: true,
      allowInlineMediaPlayback: false,
      SuppressesIncrementalRendering: false,
      AutoHideSplashScreen: false,
      DisableTabBarUnselectedIconTintColor: false
    },
    statusBar: {
      enabled: true,
      style: "light"
    }
  };

}).call(this);
