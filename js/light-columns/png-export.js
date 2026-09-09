(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const supportedScales = Object.freeze([1, 2, 4]);

  function normalizeScale(value) {
    const numericValue = Number(value);

    return supportedScales.includes(numericValue) ? numericValue : 2;
  }

  function dimensions(width, height, scale) {
    const safeScale = normalizeScale(scale);

    return {
      scale: safeScale,
      width: Math.round(Number(width) * safeScale),
      height: Math.round(Number(height) * safeScale)
    };
  }

  function sanitizeFilename(value) {
    const base = String(value || "be-art-poster")
      .replace(/\.png$/i, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "be-art-poster";

    return `${base}.png`;
  }

  function loadImage(source, ImageConstructor) {
    return new Promise((resolve, reject) => {
      const image = new ImageConstructor();

      image.onload = () => resolve(image);
      image.onerror = () => reject(
        new Error("The poster could not be prepared for PNG export.")
      );
      image.src = source;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("The browser could not create the PNG file."));
          }
        }, "image/png");
      } catch (error) {
        const message = error && error.name === "SecurityError"
          ? "PNG export was blocked because a source image is not export-safe."
          : "The browser could not create the PNG file.";

        reject(new Error(message, { cause: error }));
      }
    });
  }

  function triggerDownload(url, filename, document) {
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = sanitizeFilename(filename);
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function numericValue(value, fallback = 0) {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function customProperty(style, name, fallback) {
    const value = style.getPropertyValue(name).trim();

    return value || fallback;
  }

  function validRect(rect) {
    return rect && Number.isFinite(rect.left) && Number.isFinite(rect.top) &&
      Number.isFinite(rect.width) && Number.isFinite(rect.height);
  }

  function posterBounds(element, width, height) {
    const rect = element.getBoundingClientRect();

    if (validRect(rect) && rect.width > 0 && rect.height > 0) {
      return rect;
    }

    return {
      left: 0,
      top: 0,
      right: Number(width),
      bottom: Number(height),
      width: Number(width),
      height: Number(height)
    };
  }

  function logicalRect(rect, bounds, width, height) {
    const scaleX = Number(width) / bounds.width;
    const scaleY = Number(height) / bounds.height;

    return {
      x: (rect.left - bounds.left) * scaleX,
      y: (rect.top - bounds.top) * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
      right: (rect.right - bounds.left) * scaleX,
      bottom: (rect.bottom - bounds.top) * scaleY
    };
  }

  function elementLogicalRect(element, bounds, width, height) {
    const rect = element.getBoundingClientRect();

    if (!validRect(rect)) {
      return null;
    }

    return logicalRect(rect, bounds, width, height);
  }

  function textNodeLogicalRect(node, fallbackElement, bounds, width, height) {
    const document = fallbackElement.ownerDocument;

    try {
      const range = document.createRange();

      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach?.();
      if (validRect(rect) && rect.width > 0 && rect.height > 0) {
        return logicalRect(rect, bounds, width, height);
      }
    } catch (_error) {
      // Some test and embedded DOMs do not expose Range geometry.
    }

    const fallback = elementLogicalRect(
      fallbackElement,
      bounds,
      width,
      height
    );

    if (!fallback) {
      return null;
    }

    return {
      ...fallback,
      height: fallback.height / 2,
      bottom: fallback.y + fallback.height / 2
    };
  }

  function eventPaint(event, getComputedStyle) {
    const style = getComputedStyle(event);
    const effect = event.dataset.textEffect || "invert";
    const accent = customProperty(style, "--text-accent", "#7c5cff");
    const alpha = numericValue(
      customProperty(style, "--text-opacity", style.opacity || "1"),
      1
    );
    const paints = {
      "solid-black": { color: "#050505", composite: "source-over" },
      "solid-white": { color: "#ffffff", composite: "source-over" },
      invert: { color: "#ffffff", composite: "difference" },
      difference: { color: accent, composite: "difference" },
      accent: { color: accent, composite: "source-over" }
    };

    return {
      ...(paints[effect] || paints.invert),
      alpha: Math.max(0, Math.min(1, alpha))
    };
  }

  function logoPaint(wordmark, getComputedStyle) {
    const style = getComputedStyle(wordmark);
    const effect = wordmark.dataset.logoEffect || "invert";
    const accent = customProperty(style, "--logo-accent", "#7c5cff");
    const logoAlpha = numericValue(
      customProperty(style, "--logo-opacity", "1"),
      1
    );
    const effectAlpha = numericValue(
      customProperty(style, "--effect-alpha", "1"),
      1
    );
    const fallbackAlpha = numericValue(
      customProperty(style, "--fallback-alpha", "0.6"),
      0.6
    );
    const saturation = customProperty(
      style,
      "--effect-saturation",
      "180%"
    );
    const contrast = customProperty(style, "--effect-contrast", "120%");
    const brightness = customProperty(
      style,
      "--effect-brightness",
      "110%"
    );
    const hue = customProperty(style, "--effect-hue", "90deg");
    const paints = {
      "solid-black": {
        color: "#050505",
        composite: "source-over",
        alpha: logoAlpha,
        filter: "none"
      },
      "solid-white": {
        color: "#ffffff",
        composite: "source-over",
        alpha: logoAlpha,
        filter: "none"
      },
      accent: {
        color: accent,
        composite: "source-over",
        alpha: logoAlpha,
        filter: "none"
      },
      invert: {
        color: "#ffffff",
        composite: "difference",
        alpha: effectAlpha,
        filter: "none"
      },
      difference: {
        color: accent,
        composite: "difference",
        alpha: effectAlpha,
        filter: "none"
      },
      glass: {
        color: "#ffffff",
        composite: "screen",
        alpha: fallbackAlpha,
        filter: "drop-shadow(0 1px 0 rgb(0 0 0 / 35%))"
      },
      hypercolor: {
        color: accent,
        composite: "color-dodge",
        alpha: effectAlpha,
        filter: `saturate(${saturation}) contrast(${contrast}) ` +
          `brightness(${brightness})`
      },
      hue: {
        color: accent,
        composite: "hue",
        alpha: effectAlpha,
        filter: `hue-rotate(${hue}) saturate(${saturation})`
      }
    };
    const paint = paints[effect] || paints.invert;

    return {
      ...paint,
      alpha: Math.max(0, Math.min(1, paint.alpha))
    };
  }

  function serializeLogo(vector, color, environment) {
    const clone = vector.cloneNode(true);
    const XMLSerializerConstructor = environment.XMLSerializer ||
      vector.ownerDocument.defaultView.XMLSerializer;

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("fill", color);
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    clone.querySelectorAll("*").forEach((node) => {
      node.removeAttribute("class");
      node.removeAttribute("style");
    });

    return new XMLSerializerConstructor().serializeToString(clone);
  }

  async function drawLogo(options) {
    const {
      context,
      element,
      bounds,
      width,
      height,
      environment,
      getComputedStyle
    } = options;
    const wordmark = element.querySelector(".wordmark");
    const vector = wordmark?.querySelector(".wordmark-vector");

    if (!wordmark || !vector) {
      return;
    }

    const rect = elementLogicalRect(wordmark, bounds, width, height);

    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const paint = logoPaint(wordmark, getComputedStyle);
    const markup = serializeLogo(vector, paint.color, environment);
    const blob = new environment.Blob([markup], {
      type: "image/svg+xml;charset=utf-8"
    });
    const url = environment.URL.createObjectURL(blob);

    try {
      const image = await loadImage(url, environment.Image);

      context.save();
      context.globalAlpha = paint.alpha;
      context.globalCompositeOperation = paint.composite;
      context.filter = paint.filter;
      context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
      context.restore();
    } finally {
      environment.URL.revokeObjectURL(url);
    }
  }

  function fontForElement(element, bounds, width, getComputedStyle) {
    const style = getComputedStyle(element);
    const logicalScale = Number(width) / bounds.width;
    const fontSize = numericValue(style.fontSize, 16) * logicalScale;
    const fontStyle = style.fontStyle && style.fontStyle !== "normal"
      ? `${style.fontStyle} `
      : "";
    const fontWeight = style.fontWeight || "400";
    const fontFamily = style.fontFamily || "Arial, sans-serif";

    return {
      font: `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`,
      fontSize,
      letterSpacing: numericValue(style.letterSpacing, 0) * logicalScale,
      wordSpacing: numericValue(style.wordSpacing, 0) * logicalScale,
      textTransform: style.textTransform || "none"
    };
  }

  function normalizedText(value, textTransform) {
    const text = String(value || "").replace(/\s+/g, " ").trim();

    return textTransform === "uppercase" ? text.toUpperCase() : text;
  }

  function textRuns(event, bounds, width, height) {
    const runs = [];
    const addElement = (element) => {
      if (!element) {
        return;
      }
      const rect = elementLogicalRect(element, bounds, width, height);

      if (rect && rect.width >= 0 && rect.height > 0) {
        runs.push({ element, rect, text: element.textContent });
      }
    };

    event.querySelectorAll(".event-kicker span").forEach(addElement);

    const venue = event.querySelector(".event-venue");
    const venueTextNode = venue && Array.from(venue.childNodes).find((node) => {
      return node.nodeType === 3 && node.textContent.trim();
    });

    if (venue && venueTextNode) {
      const rect = textNodeLogicalRect(
        venueTextNode,
        venue,
        bounds,
        width,
        height
      );

      if (rect) {
        runs.push({ element: venue, rect, text: venueTextNode.textContent });
      }
    }
    // Positioned title words must retain their individual DOM coordinates.
    const positionedRuns = venue?.querySelectorAll("[data-export-text]");
    if (positionedRuns?.length) {
      positionedRuns.forEach(addElement);
    } else {
      venue?.querySelectorAll(":scope > span").forEach(addElement);
    }
    event.querySelectorAll(".speakers > p").forEach((paragraph) => {
      const parts = paragraph.querySelectorAll(":scope > span");

      if (parts.length > 0) {
        parts.forEach(addElement);
      } else {
        addElement(paragraph);
      }
    });
    event.querySelectorAll(".speakers li").forEach(addElement);
    event.querySelectorAll(".event-footer span").forEach(addElement);

    return runs;
  }

  function drawTextRun(context, run, fontDetails) {
    const text = normalizedText(run.text, fontDetails.textTransform);

    if (!text) {
      return;
    }

    context.font = fontDetails.font;
    if ("letterSpacing" in context) {
      context.letterSpacing = `${fontDetails.letterSpacing}px`;
    }
    const metrics = context.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent ||
      metrics.fontBoundingBoxAscent || fontDetails.fontSize * 0.78;
    const descent = metrics.actualBoundingBoxDescent ||
      metrics.fontBoundingBoxDescent || fontDetails.fontSize * 0.22;
    const baseline = run.rect.y + (run.rect.height - ascent - descent) / 2 +
      ascent;

    if (fontDetails.wordSpacing > 0 && text.includes(" ")) {
      const words = text.split(" ");
      const spaceWidth = context.measureText(" ").width +
        fontDetails.wordSpacing;
      let x = run.rect.x;

      words.forEach((word, index) => {
        context.fillText(word, x, baseline);
        x += context.measureText(word).width;
        if (index < words.length - 1) {
          x += spaceWidth;
        }
      });
    } else {
      context.fillText(text, run.rect.x, baseline);
    }
  }

  function drawEvent(options) {
    const {
      context,
      element,
      bounds,
      width,
      height,
      getComputedStyle
    } = options;
    const event = element.querySelector(".event");

    if (!event) {
      return;
    }

    const paint = eventPaint(event, getComputedStyle);

    context.save();
    context.globalAlpha = paint.alpha;
    context.globalCompositeOperation = paint.composite;
    context.filter = "none";
    context.fillStyle = paint.color;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    textRuns(event, bounds, width, height).forEach((run) => {
      drawTextRun(
        context,
        run,
        fontForElement(run.element, bounds, width, getComputedStyle)
      );
    });

    context.strokeStyle = paint.color;
    [
      [event.querySelector(".event-kicker"), ["bottom"]],
      [event.querySelector(".speakers"), ["top", "bottom"]]
    ].forEach(([lineElement, edges]) => {
      if (!lineElement) {
        return;
      }
      const rect = elementLogicalRect(
        lineElement,
        bounds,
        width,
        height
      );
      const style = getComputedStyle(lineElement);

      if (!rect) {
        return;
      }
      edges.forEach((edge) => {
        const cssWidth = numericValue(
          edge === "top" ? style.borderTopWidth : style.borderBottomWidth,
          0
        );

        if (cssWidth <= 0) {
          return;
        }
        const lineWidth = Math.max(
          1 / Number(options.scale),
          cssWidth * Number(width) / bounds.width
        );
        const y = edge === "top" ? rect.y + lineWidth / 2 :
          rect.bottom - lineWidth / 2;

        context.lineWidth = lineWidth;
        context.beginPath();
        context.moveTo(rect.x, y);
        context.lineTo(rect.right, y);
        context.stroke();
      });
    });
    context.restore();
  }

  async function exportPng(options) {
    const element = options.element;
    const document = element.ownerDocument;
    const environment = options.environment || document.defaultView || window;
    const defer = options.defer || environment.setTimeout.bind(environment);
    const getComputedStyle = environment.getComputedStyle
      ? environment.getComputedStyle.bind(environment)
      : document.defaultView.getComputedStyle.bind(document.defaultView);
    const output = dimensions(options.width, options.height, options.scale);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = output.width;
    canvas.height = output.height;
    if (!context) {
      throw new Error("The browser could not create an export Canvas.");
    }

    const background = await loadImage(
      options.backgroundDataUrl,
      environment.Image
    );
    context.drawImage(background, 0, 0, output.width, output.height);

    const bounds = posterBounds(element, options.width, options.height);
    context.setTransform(
      output.width / Number(options.width),
      0,
      0,
      output.height / Number(options.height),
      0,
      0
    );
    await drawLogo({
      context,
      element,
      bounds,
      width: options.width,
      height: options.height,
      environment,
      getComputedStyle
    });
    drawEvent({
      context,
      element,
      bounds,
      width: options.width,
      height: options.height,
      scale: output.scale,
      getComputedStyle
    });
    context.setTransform(1, 0, 0, 1, 0, 0);

    const pngBlob = await canvasToBlob(canvas);
    const pngUrl = environment.URL.createObjectURL(pngBlob);

    triggerDownload(pngUrl, options.filename, document);
    defer(() => environment.URL.revokeObjectURL(pngUrl), 0);
    return output;
  }

  root.pngExport = {
    dimensions,
    eventPaint,
    exportPng,
    logoPaint,
    normalizeScale,
    sanitizeFilename,
    supportedScales
  };
})();
