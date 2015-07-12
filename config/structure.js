(function() {
  module.exports = {
    rootView: {
      location: "shairy#home"
    },
    drawers: {
      left: {
        id: "menu",
        location: "shairy#menu",
        showOnAppLoad: false,
        openGestures: ["PanNavBar", "PanBezelCenterView"]
      },
      options: {
        animation: "slideAndScale"
      }
    }
  };

}).call(this);
