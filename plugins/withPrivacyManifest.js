const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withPrivacyManifest(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const src = path.join(config.modRequest.projectRoot, "PrivacyInfo.xcprivacy");
      const dest = path.join(config.modRequest.platformProjectRoot, "PrivacyInfo.xcprivacy");
      fs.copyFileSync(src, dest);
      return config;
    },
  ]);
};
