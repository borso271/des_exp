const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

assert.ok(
  fs.existsSync("El_nacimiento_de_Venus,_por_Sandro_Botticelli.jpg"),
  "the packaged Botticelli default image must exist"
);

vm.runInThisContext(
  fs.readFileSync("js/light-columns/image-layer.js", "utf8"),
  { filename: "js/light-columns/image-layer.js" }
);

const {
  draw,
  drawOverlay,
  filterString,
  fitRectangle,
  ImageController,
  resolveBlendMode
} = window.LightColumns.imageLayer;

assert.deepEqual(
  fitRectangle(100, 50, 100, 100, { fit: "cover" }),
  { x: -50, y: 0, width: 200, height: 100 }
);
assert.deepEqual(
  fitRectangle(100, 50, 100, 100, { fit: "contain" }),
  { x: 0, y: 25, width: 100, height: 50 }
);
assert.deepEqual(
  fitRectangle(100, 50, 100, 100, { fit: "stretch" }),
  { x: 0, y: 0, width: 100, height: 100 }
);
assert.deepEqual(
  fitRectangle(100, 50, 100, 100, {
    fit: "contain",
    positionX: 1,
    positionY: 0,
    scale: 0.5
  }),
  { x: 50, y: 0, width: 50, height: 25 }
);

assert.equal(
  filterString(),
  "blur(0px) brightness(100%) contrast(100%) saturate(100%) " +
    "hue-rotate(0deg) grayscale(0%)"
);
assert.equal(
  filterString({
    blur: 7,
    brightness: 125,
    contrast: 80,
    saturation: 145,
    hue: -35,
    grayscale: 40
  }),
  "blur(7px) brightness(125%) contrast(80%) saturate(145%) " +
    "hue-rotate(-35deg) grayscale(40%)"
);
assert.equal(resolveBlendMode("soft-light"), "soft-light");
assert.equal(resolveBlendMode("not-a-mode"), "source-over");

function makeContext() {
  const operations = [];
  const stack = [];
  const context = {
    globalAlpha: 0.37,
    globalCompositeOperation: "xor",
    filter: "contrast(12%)",
    fillStyle: "magenta",
    save() {
      operations.push("save");
      stack.push({
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        filter: this.filter,
        fillStyle: this.fillStyle
      });
    },
    drawImage(...args) {
      operations.push([
        "drawImage",
        ...args,
        {
          globalAlpha: this.globalAlpha,
          globalCompositeOperation: this.globalCompositeOperation,
          filter: this.filter
        }
      ]);
    },
    fillRect(...args) {
      operations.push([
        "fillRect",
        ...args,
        {
          globalAlpha: this.globalAlpha,
          globalCompositeOperation: this.globalCompositeOperation,
          filter: this.filter,
          fillStyle: this.fillStyle
        }
      ]);
    },
    restore() {
      operations.push("restore");
      Object.assign(this, stack.pop());
    }
  };

  return { context, operations };
}

{
  const image = { naturalWidth: 200, naturalHeight: 100 };
  const { context, operations } = makeContext();

  assert.equal(draw(context, image, 100, 100, { enabled: false }), false);
  assert.deepEqual(operations, []);

  assert.equal(draw(context, null, 100, 100, { enabled: true }), false);
  assert.deepEqual(operations, []);

  assert.equal(draw(context, image, 100, 100, {
    enabled: true,
    fit: "contain",
    opacity: 0.62,
    blendMode: "overlay",
    filters: {
      blur: 4,
      brightness: 110,
      contrast: 95,
      saturation: 130,
      hue: 20,
      grayscale: 10
    }
  }), true);

  assert.equal(operations[0], "save");
  assert.deepEqual(operations[1], [
    "drawImage",
    image,
    0,
    25,
    100,
    50,
    {
      globalAlpha: 0.62,
      globalCompositeOperation: "overlay",
      filter: "blur(4px) brightness(110%) contrast(95%) " +
        "saturate(130%) hue-rotate(20deg) grayscale(10%)"
    }
  ]);
  assert.equal(operations[2], "restore");
  assert.equal(context.globalAlpha, 0.37);
  assert.equal(context.globalCompositeOperation, "xor");
  assert.equal(context.filter, "contrast(12%)");
}

{
  const { context, operations } = makeContext();

  assert.equal(drawOverlay(context, 1200, 750, { enabled: false }), false);
  assert.deepEqual(operations, []);
  assert.equal(drawOverlay(context, 1200, 750, {
    enabled: true,
    color: "#ff3366",
    opacity: 1,
    blendMode: "color"
  }), true);
  assert.equal(operations[0], "save");
  assert.deepEqual(operations[1], [
    "fillRect",
    0,
    0,
    1200,
    750,
    {
      globalAlpha: 1,
      globalCompositeOperation: "color",
      filter: "none",
      fillStyle: "#ff3366"
    }
  ]);
  assert.equal(operations[2], "restore");
  assert.equal(context.fillStyle, "magenta");
}

{
  const image = { naturalWidth: 200, naturalHeight: 100 };
  const { context, operations } = makeContext();

  context.drawImage = () => {
    operations.push("draw-error");
    throw new Error("decode failed");
  };
  assert.equal(draw(context, image, 100, 100, { enabled: true }), false);
  assert.deepEqual(operations, ["save", "draw-error", "restore"]);
  assert.equal(context.globalAlpha, 0.37);
  assert.equal(context.globalCompositeOperation, "xor");
  assert.equal(context.filter, "contrast(12%)");
}

const pendingImages = [];
class FakeImage {
  constructor() {
    this.naturalWidth = 2500;
    this.naturalHeight = 1560;
    pendingImages.push(this);
  }

  set src(value) {
    this.source = value;
  }
}

const createdUrls = [];
const revokedUrls = [];
const urlApi = {
  createObjectURL(file) {
    const url = `blob:${file.name}:${createdUrls.length}`;
    createdUrls.push(url);
    return url;
  },
  revokeObjectURL(url) {
    revokedUrls.push(url);
  }
};

(async () => {
  const changes = [];
  const controller = new ImageController({
    defaultSource: "default.jpg",
    defaultFilename: "Default.jpg",
    ImageConstructor: FakeImage,
    urlApi,
    onChange: (snapshot) => changes.push(snapshot.status)
  });

  const defaultLoad = controller.loadDefault();
  assert.equal(controller.snapshot().status, "loading");
  assert.equal(controller.snapshot().filename, "Default.jpg");
  pendingImages.shift().onload();
  assert.equal(await defaultLoad, true);
  assert.equal(controller.snapshot().status, "ready");
  assert.equal(controller.snapshot().usingDefault, true);

  const firstUpload = controller.loadFile({ name: "first.png" });
  assert.equal(createdUrls[0], "blob:first.png:0");
  pendingImages.shift().onload();
  assert.equal(await firstUpload, true);
  assert.equal(controller.snapshot().filename, "first.png");
  assert.equal(controller.snapshot().usingDefault, false);

  const replacement = controller.loadFile({ name: "second.jpg" });
  assert.deepEqual(revokedUrls, ["blob:first.png:0"]);
  pendingImages.shift().onerror();
  assert.equal(await replacement, false);
  assert.equal(controller.snapshot().status, "error");
  assert.equal(controller.snapshot().image, null);

  const reset = controller.loadDefault();
  assert.deepEqual(revokedUrls, ["blob:first.png:0", "blob:second.jpg:1"]);
  pendingImages.shift().onload();
  assert.equal(await reset, true);
  assert.equal(controller.snapshot().filename, "Default.jpg");
  assert.equal(controller.snapshot().usingDefault, true);

  const thirdUpload = controller.loadFile({ name: "third.webp" });
  pendingImages.shift().onload();
  await thirdUpload;
  controller.clearForSelection("third.webp");
  assert.equal(controller.snapshot().status, "awaiting-file");
  assert.equal(controller.snapshot().filename, "third.webp");
  assert.equal(controller.snapshot().image, null);
  assert.equal(revokedUrls.at(-1), "blob:third.webp:2");

  const fourthUpload = controller.loadFile({ name: "fourth.avif" });
  pendingImages.shift().onload();
  await fourthUpload;
  controller.destroy();
  assert.equal(revokedUrls.at(-1), "blob:fourth.avif:3");
  assert.equal(controller.snapshot().status, "idle");
  assert.ok(changes.includes("loading"));
  assert.ok(changes.includes("ready"));
  assert.ok(changes.includes("error"));

  console.log("PASS: Background image fitting, filters, drawing, and lifecycle");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
