(() => {
  'use strict';

  const {defaults, groups, files} = window.LightStudyModules;

  // Native controls, keyboard shortcuts, and dragging all use the same updates.
  function createControls(canvas, params, {setParameters, reset, exportPNG, restartAnimation}) {
    const panel = document.getElementById('panel');
    const inputs = new Map();
    let noticeTimer = 0;
    let dragging = false;

    function sync() {
      for (const [key, elements] of inputs) {
        for (const element of elements) {
          element.value = element.type === 'number'
            ? Number(params[key].toFixed(5)).toString() : params[key];
        }
      }
      document.getElementById('frame').value = params.frame;
      document.getElementById('quality').value = String(params.quality);
      document.getElementById('animate').checked = params.animate;
    }

    function setVisible(visible) {
      if (window.LabEmbed) {
        if (!visible) window.LabEmbed.close();
        return;
      }
      panel.hidden = !visible;
      document.getElementById('show').hidden = visible;
    }

    function notify(message) {
      const notice = document.getElementById('notice');
      notice.textContent = message;
      notice.style.display = 'block';
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => { notice.style.display = 'none'; }, 4200);
    }

    async function fullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else notify('Fullscreen is not supported in this browser.');
      } catch {
        notify('The browser did not allow fullscreen.');
      }
    }

    function buildFields() {
      const root = document.getElementById('fields');
      groups.forEach((group, index) => {
        const section = document.createElement('details');
        section.open = index === 0;
        const summary = document.createElement('summary');
        summary.textContent = group.title;
        section.append(summary);

        for (const [key, label, min, max, step] of group.items) {
          const row = document.createElement('label');
          row.className = 'row';
          const text = document.createElement('span');
          text.textContent = label;
          row.append(text);
          if (typeof defaults[key] === 'string') {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = params[key];
            input.setAttribute('aria-label', label);
            input.dataset.key = key;
            input.oninput = () => setParameters({[key]: input.value});
            row.append(input);
            inputs.set(key, [input]);
          } else {
            const range = document.createElement('input');
            const number = document.createElement('input');
            range.type = 'range';
            number.type = 'number';
            for (const element of [range, number]) {
              element.min = min;
              element.max = max;
              element.step = step;
              element.value = params[key];
              element.dataset.key = key;
              element.setAttribute('aria-label', label + (element === number ? ' value' : ''));
            }
            range.oninput = () => setParameters({[key]: Number(range.value)});
            range.ondblclick = () => setParameters({[key]: defaults[key]});
            number.onchange = () => {
              try { setParameters({[key]: Number(number.value)}); }
              catch (error) { notify(error.message); sync(); }
            };
            row.append(range, number);
            inputs.set(key, [range, number]);
          }
          section.append(row);
        }
        root.append(section);
      });
    }

    function bindToolbar() {
      document.getElementById('reset').onclick = reset;
      document.getElementById('hide').onclick = () => setVisible(false);
      document.getElementById('show').onclick = () => setVisible(true);
      document.getElementById('fullscreen').onclick = fullscreen;
      document.getElementById('frame').onchange = event => setParameters({frame: event.target.value});
      document.getElementById('quality').onchange = event => setParameters({quality: Number(event.target.value)});
      document.getElementById('animate').onchange = event => {
        restartAnimation();
        setParameters({animate: event.target.checked});
      };
      document.getElementById('png').onclick = async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = 'Rendering…';
        try { await exportPNG(Number(document.getElementById('exportWidth').value)); }
        catch (error) { notify(error.message); }
        finally { button.disabled = false; button.textContent = 'Export PNG'; }
      };
      document.getElementById('save').onclick = () => files.saveSettings(params);
      document.getElementById('load').onclick = () => document.getElementById('file').click();
      document.getElementById('file').onchange = async event => {
        const file = event.target.files[0];
        try {
          if (!file) return;
          setParameters(await files.readSettings(file));
          notify('Settings loaded.');
        } catch (error) {
          notify('Settings not loaded: ' + error.message);
        } finally {
          event.target.value = '';
        }
      };
    }

    function moveSource(event) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      let y = (event.clientY - rect.top) / rect.height;
      if (params.frame === 'reference') y = (y - 113 / 1331) / (1158 / 1331);
      setParameters({apexX: x, apexY: y});
    }

    function stopDrag(event) {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }

    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      moveSource(event);
    });
    canvas.addEventListener('pointermove', event => { if (dragging) moveSource(event); });
    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    addEventListener('keydown', event => {
      const active = document.activeElement;
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat
        || /INPUT|TEXTAREA|SELECT/.test(active?.tagName) || active?.isContentEditable) return;
      switch (event.key.toLowerCase()) {
        case 'h': setVisible(panel.hidden); break;
        case 'f': fullscreen(); break;
        case 'r': reset(); break;
      }
    });

    buildFields();
    bindToolbar();
    sync();
    return {sync, setVisible};
  }

  window.LightStudyModules.createControls = createControls;
})();
