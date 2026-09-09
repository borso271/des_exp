(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function smoothstep(value) {
    const amount = clamp(value, 0, 1);

    return amount * amount * (3 - 2 * amount);
  }

  function alphaAt(y, columnTop, softness, opacity) {
    if (y < columnTop) {
      return 0;
    }

    if (softness <= 0) {
      return opacity;
    }

    return opacity * smoothstep((y - columnTop) / softness);
  }

  root.mask = {
    alphaAt,
    smoothstep
  };
})();
