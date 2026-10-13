// Copies the design pages (the www folder) into the Android app so they load from the phone itself.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');
module.exports = (config) =>
  withDangerousMod(config, ['android', async (cfg) => {
    const src = path.join(cfg.modRequest.projectRoot, 'www');
    const dst = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets', 'www');
    fs.rmSync(dst, { recursive: true, force: true });
    fs.mkdirSync(dst, { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
    return cfg;
  }]);
