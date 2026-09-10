(() => {
  'use strict';

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function saveSettings(parameters) {
    const settings = {format: 'light-reference-v2', version: 2, parameters};
    download(
      new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'}),
      'light-reference-v2-settings.json'
    );
  }

  async function readSettings(file) {
    if (file.size > 100000) throw new Error('Settings file is too large.');
    const data = JSON.parse(await file.text());
    return data.parameters || data;
  }

  window.LightStudyModules.files = {download, saveSettings, readSettings};
})();
