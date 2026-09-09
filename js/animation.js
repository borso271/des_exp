(function (app) {
  "use strict";

  let requestId = null;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const motionMultiplier = reducedMotion
    ? app.state.animation.reducedMotionMultiplier
    : 1;

  function frame(milliseconds) {
    const time =
      milliseconds *
      0.001 *
      app.state.animation.speed *
      motionMultiplier;

    app.renderer.render(time);
    app.rendering.render(time);
    requestId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (requestId === null) {
      requestId = window.requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (requestId !== null) {
      window.cancelAnimationFrame(requestId);
      requestId = null;
    }
  }

  app.animation = {
    start: start,
    stop: stop
  };
})(window.CircleApp = window.CircleApp || {});
