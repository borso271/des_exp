(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const format = "canvas-light-geometry-settings";
  const version = 1;
  const maximumFileSize = 5 * 1024 * 1024;

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" &&
      !Array.isArray(value);
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function serializeControls(controls, excludedNames = []) {
    const excluded = new Set(excludedNames);

    return Object.fromEntries(
      Object.entries(controls).flatMap(([name, control]) => {
        if (!control || excluded.has(name) || control.type === "file") {
          return [];
        }

        if (control.type === "checkbox") {
          return [[name, Boolean(control.checked)]];
        }

        if (control.type === "range" || control.type === "number") {
          const numericValue = Number(control.value);

          return Number.isFinite(numericValue) ? [[name, numericValue]] : [];
        }

        return [[name, String(control.value)]];
      })
    );
  }

  function normalizeControlValue(control, rawValue) {
    if (control.type === "checkbox") {
      return typeof rawValue === "boolean" ? rawValue : undefined;
    }

    if (control.type === "range" || control.type === "number") {
      const numericValue = Number(rawValue);

      if (!Number.isFinite(numericValue)) {
        return undefined;
      }

      const rawMinimum = Number(control.min);
      const rawMaximum = Number(control.max);
      const minimum = control.min === "" || !Number.isFinite(rawMinimum)
        ? -Infinity
        : rawMinimum;
      const maximum = control.max === "" || !Number.isFinite(rawMaximum)
        ? Infinity
        : rawMaximum;

      return Math.max(minimum, Math.min(maximum, numericValue));
    }

    if (control.type === "color") {
      return isHexColor(rawValue) ? rawValue.toLowerCase() : undefined;
    }

    const stringValue = typeof rawValue === "string"
      ? rawValue
      : undefined;

    if (stringValue === undefined) {
      return undefined;
    }

    if (control.tagName === "SELECT") {
      const supported = Array.from(control.options).some((option) => {
        return option.value === stringValue;
      });

      return supported ? stringValue : undefined;
    }

    return stringValue;
  }

  function applyControlValues(controls, values, excludedNames = []) {
    const excluded = new Set(excludedNames);
    const result = { applied: [], ignored: [], invalid: [] };

    Object.entries(values || {}).forEach(([name, rawValue]) => {
      const control = controls[name];

      if (!control || excluded.has(name) || control.type === "file") {
        result.ignored.push(name);
        return;
      }

      const normalized = normalizeControlValue(control, rawValue);

      if (normalized === undefined) {
        result.invalid.push(name);
        return;
      }

      if (control.type === "checkbox") {
        control.checked = normalized;
      } else {
        control.value = String(normalized);
      }
      result.applied.push(name);
    });

    return result;
  }

  // Full-document imports use the native controls as their schema. Validate on
  // detached elements so a rejected import cannot change the current poster.
  function validateCompleteControls(controls, values, limits = {}) {
    const expected=serializeControls(controls);
    if (!isRecord(values) || Object.keys(values).length!==Object.keys(expected).length ||
        Object.keys(expected).some(key=>!Object.hasOwn(values,key))) throw new Error('Expected complete native controls.');
    for (const [key,value] of Object.entries(values)) {
      const control=controls[key].cloneNode(true);
      Object.assign(control,limits[key]||{});
      const normalized=normalizeControlValue(control,value);
      if (normalized!==value) throw new Error(`Invalid native setting: ${key}.`);
      if(control.type==='checkbox')control.checked=value;else control.value=String(value);
      if(serializeControls({[key]:control})[key]!==value) throw new Error(`Unsupported native value: ${key}.`);
    }
    return {...values};
  }

  function createDocument(settings = {}) {
    const image = isRecord(settings.image) ? settings.image : {};
    const paletteCounts = isRecord(settings.paletteCounts)
      ? settings.paletteCounts
      : {};

    return {
      format,
      version,
      exportedAt: settings.exportedAt || new Date().toISOString(),
      controls: isRecord(settings.controls) ? { ...settings.controls } : {},
      palette: {
        manualColors: Array.isArray(settings.paletteColors)
          ? settings.paletteColors.slice()
          : [],
        counts: {
          manual: Number(paletteCounts.manual) || 4,
          generated: Number(paletteCounts.generated) || 8
        }
      },
      image: {
        kind: image.kind === "local" ? "local" : "default",
        filename: typeof image.filename === "string"
          ? image.filename
          : ""
      }
    };
  }

  function parse(text) {
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error("This file is not valid JSON.");
    }

    if (!isRecord(parsed) || parsed.format !== format) {
      throw new Error("This is not a Canvas Light Geometry settings file.");
    }
    if (parsed.version !== version) {
      throw new Error(`Unsupported settings version: ${parsed.version}.`);
    }
    if (!isRecord(parsed.controls)) {
      throw new Error("The settings file has no valid controls object.");
    }

    const palette = isRecord(parsed.palette) ? parsed.palette : {};
    const counts = isRecord(palette.counts) ? palette.counts : {};
    const image = isRecord(parsed.image) ? parsed.image : {};

    return {
      format,
      version,
      exportedAt: typeof parsed.exportedAt === "string"
        ? parsed.exportedAt
        : "",
      controls: Object.fromEntries(
        Object.entries(parsed.controls).filter(([, value]) => {
          return typeof value === "string" ||
            typeof value === "boolean" ||
            (typeof value === "number" && Number.isFinite(value));
        })
      ),
      palette: {
        manualColors: Array.isArray(palette.manualColors)
          ? palette.manualColors.map((color) => {
            return isHexColor(color) ? color.toLowerCase() : null;
          })
          : [],
        counts: {
          manual: Number.isFinite(Number(counts.manual))
            ? Number(counts.manual)
            : 4,
          generated: Number.isFinite(Number(counts.generated))
            ? Number(counts.generated)
            : 8
        }
      },
      image: {
        kind: image.kind === "local" ? "local" : "default",
        filename: typeof image.filename === "string"
          ? image.filename
          : ""
      }
    };
  }

  function readFile(file, options = {}) {
    if (!file) {
      return Promise.reject(new Error("Choose a JSON settings file."));
    }
    if (Number(file.size) > maximumFileSize) {
      return Promise.reject(new Error("The settings file is too large."));
    }
    if (typeof file.text === "function") {
      return file.text();
    }

    const FileReaderConstructor = options.FileReaderConstructor ||
      window.FileReader;

    return new Promise((resolve, reject) => {
      const reader = new FileReaderConstructor();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(
        new Error("The settings file could not be read.")
      );
      reader.readAsText(file);
    });
  }

  function download(settings, filename, options = {}) {
    const environment = options.environment || window;
    const defer = options.defer || environment.setTimeout.bind(environment);
    const blob = new environment.Blob(
      [`${JSON.stringify(settings, null, 2)}\n`],
      { type: "application/json" }
    );
    const objectUrl = environment.URL.createObjectURL(blob);
    const anchor = environment.document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename || "canvas-light-geometry-settings.json";
    anchor.hidden = true;
    environment.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    defer(() => environment.URL.revokeObjectURL(objectUrl), 0);
    return objectUrl;
  }

  root.settingsIO = {
    applyControlValues,
    createDocument,
    download,
    format,
    isHexColor,
    maximumFileSize,
    parse,
    readFile,
    serializeControls,
    validateCompleteControls,
    version
  };
})();
