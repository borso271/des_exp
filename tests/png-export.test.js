const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!doctype html><html><body>
  <figure class="poster">
    <canvas id="light-canvas"></canvas>
    <div class="poster-copy">
      <div class="wordmark" data-logo-effect="difference"
        style="--logo-accent:#7c5cff;--logo-opacity:1;--effect-alpha:.75">
        <svg class="wordmark-vector" viewBox="0 0 10 10">
          <path d="M0 0h10v10H0z"></path>
        </svg>
      </div>
      <section class="event" data-text-effect="difference"
        style="--text-accent:#ff3366;--text-opacity:.8;font:800 20px Arial;text-transform:uppercase">
        <p class="event-kicker" style="border-bottom:2px solid">
          <span>Join us</span><span>November 4</span>
        </p>
        <h2 class="event-venue">Event details<br><span>One line</span></h2>
        <div class="speakers" style="border-top:2px solid;border-bottom:2px solid">
          <p>With</p><ul><li>Lucía Ferrer</li></ul><ul><li>Omar Diallo</li></ul>
        </div>
        <p class="event-footer"><span>Discover more</span><span>beartgroup.com</span></p>
      </section>
    </div>
  </figure>
</body></html>`);

global.window = dom.window;

vm.runInThisContext(
  fs.readFileSync("js/light-columns/png-export.js", "utf8"),
  { filename: "js/light-columns/png-export.js" }
);

const pngExport = window.LightColumns.pngExport;
const document = dom.window.document;
const poster = document.querySelector(".poster");

assert.deepEqual(pngExport.dimensions(1200, 750, 1), {
  scale: 1,
  width: 1200,
  height: 750
});
assert.deepEqual(pngExport.dimensions(1200, 750, 4), {
  scale: 4,
  width: 4800,
  height: 3000
});
assert.deepEqual(pngExport.dimensions(1200, 750, 3), {
  scale: 2,
  width: 2400,
  height: 1500
});
assert.equal(
  pngExport.sanitizeFilename("Bé Art / Rings 4x.PNG"),
  "Be-Art-Rings-4x.png"
);

const rect = (left, top, width, height) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height
});
poster.getBoundingClientRect = () => rect(0, 0, 1200, 750);
document.querySelector(".wordmark").getBoundingClientRect = () => {
  return rect(50, 30, 1100, 300);
};
document.querySelector(".event").getBoundingClientRect = () => {
  return rect(50, 390, 1100, 310);
};
document.querySelector(".event-kicker").getBoundingClientRect = () => {
  return rect(50, 390, 1100, 35);
};
document.querySelectorAll(".event-kicker span")[0].getBoundingClientRect =
  () => rect(50, 390, 100, 30);
document.querySelectorAll(".event-kicker span")[1].getBoundingClientRect =
  () => rect(1000, 390, 150, 30);
document.querySelector(".event-venue").getBoundingClientRect = () => {
  return rect(50, 440, 700, 100);
};
document.querySelector(".event-venue span").getBoundingClientRect = () => {
  return rect(50, 490, 300, 45);
};
document.querySelector(".speakers").getBoundingClientRect = () => {
  return rect(50, 555, 1100, 75);
};
document.querySelector(".speakers > p").getBoundingClientRect = () => {
  return rect(50, 570, 100, 25);
};
document.querySelectorAll(".speakers li").forEach((element, index) => {
  element.getBoundingClientRect = () => rect(350 + index * 400, 570, 180, 25);
});
document.querySelectorAll(".event-footer span").forEach((element, index) => {
  element.getBoundingClientRect = () => rect(50 + index * 900, 660, 200, 25);
});

const eventPaint = pngExport.eventPaint(
  document.querySelector(".event"),
  dom.window.getComputedStyle.bind(dom.window)
);
assert.deepEqual(eventPaint, {
  color: "#ff3366",
  composite: "difference",
  alpha: 0.8
});

const logoPaint = pngExport.logoPaint(
  document.querySelector(".wordmark"),
  dom.window.getComputedStyle.bind(dom.window)
);
assert.equal(logoPaint.color, "#7c5cff");
assert.equal(logoPaint.composite, "difference");
assert.equal(logoPaint.alpha, 0.75);

(async () => {
  const operations = [];
  const revokedUrls = [];
  const createdBlobs = [];
  let blobIndex = 0;
  let exportedCanvas = null;

  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options.type;
      createdBlobs.push(this);
    }
  }

  class FakeImage {
    set src(value) {
      this.source = value;
      queueMicrotask(() => this.onload());
    }
  }

  dom.window.HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      filter: "none",
      save() {},
      restore() {},
      setTransform(...values) {
        operations.push(["setTransform", ...values]);
      },
      drawImage(image, x, y, width, height) {
        operations.push(["drawImage", image.source, x, y, width, height]);
      },
      measureText() {
        return { actualBoundingBoxAscent: 16, actualBoundingBoxDescent: 4 };
      },
      fillText(text, x, y) {
        operations.push(["fillText", text, x, y]);
      },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {
        operations.push(["stroke"]);
      }
    };
  };
  dom.window.HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
    exportedCanvas = this;
    callback(new FakeBlob(["png"], { type: "image/png" }));
  };
  dom.window.HTMLAnchorElement.prototype.click = function click() {
    operations.push(["download", this.download, this.href]);
  };

  const environment = {
    Blob: FakeBlob,
    Image: FakeImage,
    URL: {
      createObjectURL(blob) {
        const url = `blob:export-${blobIndex}`;

        blobIndex += 1;
        operations.push(["create", blob.type, url]);
        return url;
      },
      revokeObjectURL(url) {
        revokedUrls.push(url);
      }
    },
    setTimeout
  };

  const output = await pngExport.exportPng({
    element: poster,
    backgroundDataUrl: "data:image/png;base64,background",
    width: 1200,
    height: 750,
    scale: 4,
    filename: "Bé Art rings",
    environment,
    defer(callback) {
      callback();
    }
  });

  assert.deepEqual(output, { scale: 4, width: 4800, height: 3000 });
  assert.equal(exportedCanvas.width, 4800);
  assert.equal(exportedCanvas.height, 3000);
  assert.deepEqual(operations.find((operation) => {
    return operation[0] === "drawImage";
  }), [
    "drawImage",
    "data:image/png;base64,background",
    0,
    0,
    4800,
    3000
  ]);
  assert.ok(operations.some((operation) => {
    return operation[0] === "drawImage" &&
      operation[1] === "blob:export-0" && operation[4] === 1100;
  }), "the inline SVG logo must be composited separately");
  assert.ok(operations.some((operation) => {
    return operation[0] === "fillText" &&
      operation[1].toUpperCase() === "EVENT DETAILS";
  }), "event typography must be drawn directly on Canvas");
  assert.ok(operations.some((operation) => operation[0] === "stroke"));
  assert.ok(operations.some((operation) => {
    return operation[0] === "download" &&
      operation[1] === "Be-Art-rings.png";
  }));
  assert.equal(createdBlobs[0].type, "image/svg+xml;charset=utf-8");
  assert.doesNotMatch(createdBlobs[0].parts.join(""), /foreignObject/i);
  assert.match(createdBlobs[0].parts.join(""), /fill="#7c5cff"/i);
  assert.deepEqual(new Set(revokedUrls), new Set([
    "blob:export-0",
    "blob:export-1"
  ]));

  const event = document.querySelector(".event");
  event.innerHTML = '<h2 class="event-venue"><span class="manifesto-title-top"><span data-export-text>NO</span> <span data-export-text>SOMOS</span></span><span data-export-text>ESPECTADORES</span></h2>';
  const words = event.querySelectorAll("[data-export-text]");
  [rect(50, 300, 150, 90), rect(700, 300, 450, 90), rect(50, 390, 1100, 90)].forEach((box, index) => {
    words[index].getBoundingClientRect = () => box;
  });
  const beforeTitleExport = operations.length;
  await pngExport.exportPng({
    element: poster,
    backgroundDataUrl: "data:image/png;base64,background",
    width: 1200, height: 750, scale: 2,
    filename: "manifesto-title", environment,
    defer(callback) {callback();}
  });
  const titleRuns = operations.slice(beforeTitleExport).filter(operation => operation[0] === "fillText");
  assert.deepEqual(titleRuns.map(run => run[1]), ["NO", "SOMOS", "ESPECTADORES"]);
  assert.deepEqual(titleRuns.map(run => run[2]), [50, 700, 50], "export preserves the justified top row");
  assert.equal(titleRuns[0][3], titleRuns[1][3]);
  assert.ok(titleRuns[2][3] > titleRuns[0][3]);
  console.log("PASS: origin-clean Canvas-native PNG export, including positioned manifesto words");
  dom.window.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
