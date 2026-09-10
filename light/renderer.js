(() => {
  'use strict';

  const {vertex, fragment} = window.LightStudyModules.shaders;

  // Owns the GPU, frame scheduling, context recovery, and offscreen-size exports.
  // Parameters are shared with the application; UI updates use callbacks only.
  function createRenderer(canvas, params, {
    onStatus, onError,
    getBounds = () => ({width: innerWidth, height: innerHeight}),
    motionAllowed = () => true
  }) {
    let gl, program, vao;
    let uniforms = new Map();
    let scheduled = 0;
    let lost = false;
    let exporting = false;
    let disposed = false;
    let drawCount = 0;
    let frameTime = 0;
    let elapsed = 0;
    let lastFrame = performance.now();
    let maxDimension = 4096;
    let exportChain = Promise.resolve();

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info || 'Shader compilation failed.');
      }
      return shader;
    }

    function initialize() {
      if (disposed) return;
      gl = canvas.getContext('webgl2', {
        alpha: false, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      if (!gl) throw new Error('A WebGL2 context is not available.');
      if ('drawingBufferColorSpace' in gl) gl.drawingBufferColorSpace = 'srgb';
      const vs = compile(gl.VERTEX_SHADER, vertex);
      const fs = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program linking failed.');
      }
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      uniforms = new Map();
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const uniform = gl.getActiveUniform(program, i);
        uniforms.set(uniform.name, gl.getUniformLocation(program, uniform.name));
      }
      maxDimension = Math.min(
        8192, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        ...gl.getParameter(gl.MAX_VIEWPORT_DIMS)
      );
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.DITHER);
      lost = false;
      onError(null);
      resize();
      requestRender();
    }

    function set1(name, value) {
      const location = uniforms.get(name);
      if (location !== undefined && location !== null) gl.uniform1f(location, value);
    }

    function hex(value) {
      return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
    }

    function currentAspect() {
      if (params.frame === 'reference') return 2047 / 1331;
      if (params.frame === 'clean') return 2047 / 1158;
      const bounds = getBounds();
      return bounds.width / Math.max(bounds.height, 1);
    }

    function dimensionsForWidth(width) {
      width = Number(width);
      if (!Number.isFinite(width) || width < 128) {
        throw new RangeError('PNG width must be at least 128 pixels.');
      }
      const height = Math.round(width / currentAspect());
      width = Math.round(width);
      if (width > maxDimension || height > maxDimension || width * height > 22000000) {
        throw new RangeError('Requested export exceeds the safe GPU limit. Choose a smaller width.');
      }
      return {width, height};
    }

    function resize() {
      if (!gl || lost || exporting || disposed) return;
      const aspect = currentAspect();
      const bounds = getBounds();
      const width = Math.min(bounds.width, bounds.height * aspect);
      const height = width / aspect;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      const density = Math.min(devicePixelRatio || 1, 2) * params.quality;
      const scale = Math.min(
        density, maxDimension / Math.max(width, height),
        Math.sqrt(14000000 / Math.max(1, width * height))
      );
      const renderWidth = Math.max(2, Math.round(width * scale));
      const renderHeight = Math.max(2, Math.round(height * scale));
      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }
      requestRender();
    }

    function draw(time = 0) {
      if (!gl || lost || disposed) return;
      const started = performance.now();
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const resolution = uniforms.get('uResolution');
      if (resolution) gl.uniform2f(resolution, canvas.width, canvas.height);
      set1('uFrame', params.frame === 'reference' ? 1 : 0);
      const artAspect = params.frame === 'reference' || params.frame === 'clean'
        ? 2047 / 1158 : currentAspect();
      set1('uAspect', artAspect);
      set1('uTime', time);
      for (const [key, value] of Object.entries(params)) {
        const name = 'u' + key[0].toUpperCase() + key.slice(1);
        const location = uniforms.get(name);
        if (location === undefined || location === null) continue;
        if (typeof value === 'number') gl.uniform1f(location, value);
        else if (typeof value === 'string' && value.startsWith('#')) {
          gl.uniform3fv(location, hex(value));
        }
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawCount++;
      frameTime = performance.now() - started;
      onStatus(`WebGL2 · ${canvas.width} × ${canvas.height} · procedural / no textures`);
    }

    function requestRender() {
      if (scheduled || lost || exporting || disposed) return;
      scheduled = requestAnimationFrame(now => {
        scheduled = 0;
        const moving = params.animate && motionAllowed();
        if (moving && lastFrame !== null) elapsed += Math.max(0, (now - lastFrame) / 1000);
        lastFrame = moving ? now : null;
        draw(params.animate ? elapsed : 0);
        if (moving) requestRender();
      });
    }

    function restartAnimation() {
      elapsed = 0;
      lastFrame = performance.now();
    }

    function syncMotion() {
      // Resuming starts from the held frame, without counting time spent paused.
      lastFrame = params.animate && motionAllowed() ? performance.now() : null;
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      requestRender();
    }

    function renderAt(time) {
      if (typeof time !== 'number' || !Number.isFinite(time) || time < 0) {
        throw new TypeError('Invalid light animation time.');
      }
      elapsed = time;
      lastFrame = null;
      resize();
      draw(time);
    }

    function renderToBlob(width = 3072) {
      // Serialize exports because each temporarily resizes the same canvas.
      const task = async () => {
        if (lost || !gl || disposed) throw new Error('Renderer is not available.');
        const dimensions = dimensionsForWidth(width);
        exporting = true;
        if (scheduled) {
          cancelAnimationFrame(scheduled);
          scheduled = 0;
        }
        try {
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          draw(params.animate ? elapsed : 0);
          return await new Promise((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png');
          });
        } finally {
          exporting = false;
          resize();
          requestRender();
        }
      };
      const promise = exportChain.then(task, task);
      exportChain = promise.catch(() => {});
      return promise;
    }

    function getDiagnostics() {
      return {
        ready: !!gl && !lost && !disposed, draws: drawCount,
        width: canvas.width, height: canvas.height, maxDimension,
        lastSubmitMs: frameTime, renderer: 'analytical WebGL2; no textures'
      };
    }

    function dispose() {
      disposed = true;
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      removeEventListener('resize', resize);
      if (gl && !lost) {
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    }

    addEventListener('resize', resize);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      lost = true;
      lastFrame = null;
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      if (!disposed) onStatus('Graphics context lost. Waiting for restoration…');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      try { initialize(); } catch (error) { onError(error); }
    });

    return {
      initialize, resize, requestRender, restartAnimation, renderToBlob, getDiagnostics,
      syncMotion, renderAt, getTime: () => elapsed, dispose
    };
  }

  window.LightStudyModules.createRenderer = createRenderer;
})();
