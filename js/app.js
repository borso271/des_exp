(function (app) {
  "use strict";

  function setGeometry(name) {
    app.renderer.setGeometry(name);
    app.palette.handleGeometryChange();
  }

  function initialize() {
    const elements = app.controls.collectElements();

    app.controls.initialize(elements);
    app.renderer.initialize({
      svg: elements.svg,
      cellsGroup: elements.cellsGroup
    });
    app.palette.initialize();
    app.rendering.initialize({
      svg: elements.svg,
      cellsGroup: elements.cellsGroup
    });
    app.overlays.initialize({
      animationBox: elements.animationBox,
      beArtsLogo: elements.beArtsLogo,
      logoGraphic: elements.logoGraphic,
      logoSolid: elements.logoSolid,
      eventCopy: elements.eventCopy
    });
    app.settings.initialize();
    app.animation.start();
  }

  app.setGeometry = setGeometry;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})(window.CircleApp = window.CircleApp || {});
