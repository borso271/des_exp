(function (app) {
  "use strict";

  const registry = new Map();
  let rendererElements = null;
  let activeGeometry = null;
  let revision = 0;

  function applyPresentation(presentation) {
    const settings = presentation || {};

    rendererElements.svg.classList.remove(
      "presentation-polar",
      "presentation-canvas"
    );
    rendererElements.svg.classList.add(
      settings.className || "presentation-polar"
    );
    rendererElements.svg.setAttribute(
      "preserveAspectRatio",
      settings.preserveAspectRatio || "xMidYMid slice"
    );

    if (settings.clipPath) {
      rendererElements.cellsGroup.setAttribute(
        "clip-path",
        settings.clipPath
      );
    } else {
      rendererElements.cellsGroup.removeAttribute("clip-path");
    }
  }

  function registerGeometry(name, definition) {
    if (registry.has(name)) {
      throw new Error(`Geometry "${name}" is already registered.`);
    }

    const descriptor = typeof definition === "function"
      ? { create: definition }
      : definition;

    if (!descriptor || typeof descriptor.create !== "function") {
      throw new Error(`Geometry "${name}" needs a create function.`);
    }

    registry.set(name, descriptor);
  }

  function setGeometry(name) {
    const descriptor = registry.get(name);

    if (!descriptor) {
      throw new Error(`Unknown geometry "${name}".`);
    }

    if (activeGeometry && activeGeometry.destroy) {
      activeGeometry.destroy();
    }

    rendererElements.cellsGroup.replaceChildren();
    activeGeometry = descriptor.create({
      cellsGroup: rendererElements.cellsGroup,
      config: app.constants.geometry[name],
      state: app.state
    });
    revision += 1;
    app.state.geometry.type = name;
    applyPresentation(descriptor.presentation);

    if (descriptor.label) {
      rendererElements.svg.setAttribute("aria-label", descriptor.label);
    }

    return activeGeometry;
  }

  function initialize(elements) {
    rendererElements = elements;
    setGeometry(app.state.geometry.type);
  }

  function render(time) {
    activeGeometry.update(time);
  }

  function forEachCell(callback) {
    activeGeometry.forEachCell(callback);
  }

  function getPaletteCoordinates(rowIndex, columnIndex) {
    return activeGeometry.getPaletteCoordinates(rowIndex, columnIndex);
  }

  function getDimensions() {
    return activeGeometry.getDimensions();
  }

  function getRevision() {
    return revision;
  }

  app.geometryRegistry = {
    register: registerGeometry,
    has(name) {
      return registry.has(name);
    },
    names() {
      return Array.from(registry.keys());
    }
  };

  app.renderer = {
    initialize: initialize,
    setGeometry: setGeometry,
    render: render,
    forEachCell: forEachCell,
    getPaletteCoordinates: getPaletteCoordinates,
    getDimensions: getDimensions,
    getRevision: getRevision
  };
})(window.CircleApp = window.CircleApp || {});
