# Read more about app configs at http://docs.appgyver.com

module.exports =
  app:
    name: "Salone Digitale"

  network:
    extraResponseHeaders:
      "Access-Control-Allow-Origin": "*"
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With, Authorization"

  webView:
    viewsIgnoreStatusBar: true
    enableDoubleTapToFocus: false
    disableOverscroll: true
    enableViewportScale: false
    enablePopGestureRecognition: true
    allowInlineMediaPlayback: false
    SuppressesIncrementalRendering: false
    AutoHideSplashScreen: false
    DisableTabBarUnselectedIconTintColor: false

  # Applies on iOS only
  statusBar:
    enabled: true
    style: "light"
