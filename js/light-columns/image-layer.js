(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const supportedFits = new Set(["cover", "contain", "stretch"]);
  const blendModes = Object.freeze({
    normal: "source-over",
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
    "soft-light": "soft-light",
    color: "color",
    luminosity: "luminosity"
  });
  const defaults = Object.freeze({
    enabled: false,
    fit: "cover",
    positionX: 0.5,
    positionY: 0.5,
    scale: 1,
    opacity: 1,
    blendMode: "normal",
    overlay: Object.freeze({
      enabled: false,
      color: "#000000",
      opacity: 0.35,
      blendMode: "normal"
    }),
    filters: Object.freeze({
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      grayscale: 0
    })
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function fitRectangle(
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    settings = {}
  ) {
    const safeImageWidth = Math.max(1, Number(imageWidth) || 1);
    const safeImageHeight = Math.max(1, Number(imageHeight) || 1);
    const safeCanvasWidth = Math.max(1, Number(canvasWidth) || 1);
    const safeCanvasHeight = Math.max(1, Number(canvasHeight) || 1);
    const fit = supportedFits.has(settings.fit) ? settings.fit : "cover";
    const scale = clamp(settings.scale === undefined ? 1 : settings.scale, 0.1, 4);
    const positionX = clamp(
      settings.positionX === undefined ? 0.5 : settings.positionX,
      0,
      1
    );
    const positionY = clamp(
      settings.positionY === undefined ? 0.5 : settings.positionY,
      0,
      1
    );
    let width;
    let height;

    if (fit === "stretch") {
      width = safeCanvasWidth * scale;
      height = safeCanvasHeight * scale;
    } else {
      const baseScale = fit === "contain"
        ? Math.min(
          safeCanvasWidth / safeImageWidth,
          safeCanvasHeight / safeImageHeight
        )
        : Math.max(
          safeCanvasWidth / safeImageWidth,
          safeCanvasHeight / safeImageHeight
        );

      width = safeImageWidth * baseScale * scale;
      height = safeImageHeight * baseScale * scale;
    }

    return {
      x: (safeCanvasWidth - width) * positionX,
      y: (safeCanvasHeight - height) * positionY,
      width,
      height
    };
  }

  function filterString(filters = {}) {
    return [
      `blur(${clamp(filters.blur, 0, 100)}px)`,
      `brightness(${clamp(
        filters.brightness === undefined ? 100 : filters.brightness,
        0,
        300
      )}%)`,
      `contrast(${clamp(
        filters.contrast === undefined ? 100 : filters.contrast,
        0,
        300
      )}%)`,
      `saturate(${clamp(
        filters.saturation === undefined ? 100 : filters.saturation,
        0,
        300
      )}%)`,
      `hue-rotate(${clamp(filters.hue, -180, 180)}deg)`,
      `grayscale(${clamp(filters.grayscale, 0, 100)}%)`
    ].join(" ");
  }

  function resolveBlendMode(mode) {
    return blendModes[mode] || blendModes.normal;
  }

  function imageDimensions(image) {
    return {
      width: image && (image.naturalWidth || image.width),
      height: image && (image.naturalHeight || image.height)
    };
  }

  function isDrawable(image) {
    const dimensions = imageDimensions(image);

    return Boolean(
      image &&
      Number(dimensions.width) > 0 &&
      Number(dimensions.height) > 0
    );
  }

  function draw(context, image, canvasWidth, canvasHeight, settings = {}) {
    if (!settings.enabled || !isDrawable(image)) {
      return false;
    }

    const dimensions = imageDimensions(image);
    const rectangle = fitRectangle(
      dimensions.width,
      dimensions.height,
      canvasWidth,
      canvasHeight,
      settings
    );

    context.save();
    try {
      context.globalAlpha = clamp(
        settings.opacity === undefined ? 1 : settings.opacity,
        0,
        1
      );
      context.globalCompositeOperation = resolveBlendMode(
        settings.blendMode
      );
      context.filter = filterString(settings.filters);
      context.drawImage(
        image,
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
      );
      return true;
    } catch (error) {
      return false;
    } finally {
      context.restore();
    }
  }

  function drawOverlay(context, canvasWidth, canvasHeight, settings = {}) {
    if (!settings.enabled) {
      return false;
    }

    const opacity = clamp(
      settings.opacity === undefined ? 0.35 : settings.opacity,
      0,
      1
    );

    if (opacity <= 0) {
      return false;
    }

    context.save();
    try {
      context.globalAlpha = opacity;
      context.globalCompositeOperation = resolveBlendMode(
        settings.blendMode
      );
      context.filter = "none";
      context.fillStyle = typeof settings.color === "string"
        ? settings.color
        : "#000000";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      return true;
    } finally {
      context.restore();
    }
  }

  class ImageController {
    constructor(options = {}) {
      this.defaultSource = options.defaultSource || "";
      this.defaultFilename = options.defaultFilename || this.defaultSource;
      this.ImageConstructor = options.ImageConstructor || window.Image;
      this.urlApi = options.urlApi || window.URL;
      this.onChange = typeof options.onChange === "function"
        ? options.onChange
        : () => {};
      this.status = "idle";
      this.filename = this.defaultFilename;
      this.source = "";
      this.image = null;
      this.error = null;
      this.objectUrl = null;
      this.loadToken = 0;
      this.usingDefault = true;
      this.portableSource = null;
    }

    snapshot() {
      return {
        status: this.status,
        filename: this.filename,
        source: this.source,
        image: this.status === "ready" ? this.image : null,
        error: this.error,
        usingDefault: this.usingDefault,
        portableSource: this.portableSource
      };
    }

    notify() {
      this.onChange(this.snapshot());
    }

    releaseObjectUrl(exceptUrl = null) {
      if (this.objectUrl && this.objectUrl !== exceptUrl) {
        this.urlApi.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
    }

    loadSource(source, filename, options = {}) {
      const token = ++this.loadToken;
      const objectUrl = options.objectUrl || null;

      this.releaseObjectUrl(objectUrl);
      this.objectUrl = objectUrl;
      this.source = source;
      this.portableSource = source.startsWith('data:image/') ? source : null;
      this.filename = filename || source || "No image";
      this.usingDefault = Boolean(options.usingDefault);
      this.status = "loading";
      this.error = null;
      this.notify();

      return new Promise((resolve) => {
        let image;

        try {
          image = new this.ImageConstructor();
        } catch (error) {
          this.image = null;
          this.status = "error";
          this.error = error;
          this.releaseObjectUrl();
          this.notify();
          resolve(false);
          return;
        }

        image.onload = () => {
          if (token !== this.loadToken) {
            resolve(false);
            return;
          }

          this.image = image;
          this.status = "ready";
          this.error = null;
          this.notify();
          resolve(true);
        };
        image.onerror = () => {
          if (token !== this.loadToken) {
            resolve(false);
            return;
          }

          this.image = null;
          this.status = "error";
          this.error = new Error(`Unable to load image: ${this.filename}`);
          this.releaseObjectUrl();
          this.notify();
          resolve(false);
        };
        try {
          image.src = source;
        } catch (error) {
          image.onerror(error);
        }
      });
    }

    loadDefault() {
      return this.loadSource(this.defaultSource, this.defaultFilename, {
        usingDefault: true
      });
    }

    loadFile(file) {
      if (!file) {
        return Promise.resolve(false);
      }

      let objectUrl;

      try {
        objectUrl = this.urlApi.createObjectURL(file);
      } catch (error) {
        this.image = null;
        this.filename = file.name || "Uploaded image";
        this.usingDefault = false;
        this.status = "error";
        this.error = error;
        this.notify();
        return Promise.resolve(false);
      }

      const loaded=this.loadSource(objectUrl, file.name || "Uploaded image", {
        objectUrl,
        usingDefault: false
      });
      const token=this.loadToken;
      if(typeof file.arrayBuffer!=='function')return loaded;
      // Keep original image bytes for complete configuration downloads (including
      // vector images), instead of flattening an uploaded asset into a screenshot.
      const portable=file.arrayBuffer().then(buffer=>{
        const bytes=new Uint8Array(buffer),chunks=[];
        for(let offset=0;offset<bytes.length;offset+=16384)chunks.push(String.fromCharCode(...bytes.subarray(offset,offset+16384)));
        const mime=file.type?.startsWith('image/')?file.type:'image/png';
        return `data:${mime};base64,${window.btoa(chunks.join(''))}`;
      }).catch(()=>null);
      return Promise.all([loaded,portable]).then(([success,source])=>{
        if(success&&token===this.loadToken){this.portableSource=source;this.notify();}
        return success&&token===this.loadToken;
      });
    }

    clearForSelection(filename = "Local image") {
      this.loadToken += 1;
      this.releaseObjectUrl();
      this.source = "";
      this.portableSource = null;
      this.filename = filename;
      this.usingDefault = false;
      this.image = null;
      this.status = "awaiting-file";
      this.error = null;
      this.notify();
    }

    // Commit an already decoded image only after the entire configuration has
    // passed validation. Used by the lab's complete host configuration API.
    adoptPrepared(snapshot) {
      this.loadToken += 1;
      this.releaseObjectUrl();
      this.source=snapshot.source;
      this.portableSource=snapshot.portableSource;
      this.filename=snapshot.filename;
      this.usingDefault=snapshot.usingDefault;
      this.image=snapshot.image;
      this.status=snapshot.status;
      this.error=null;
      this.notify();
    }

    destroy() {
      this.loadToken += 1;
      this.releaseObjectUrl();
      this.image = null;
      this.source = "";
      this.portableSource = null;
      this.status = "idle";
      this.error = null;
    }
  }

  root.imageLayer = {
    blendModes,
    defaults,
    draw,
    drawOverlay,
    filterString,
    fitRectangle,
    ImageController,
    isDrawable,
    resolveBlendMode
  };
})();
