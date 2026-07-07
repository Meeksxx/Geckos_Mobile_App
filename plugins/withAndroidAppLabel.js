const { withStringsXml, AndroidConfig } = require("@expo/config-plugins");

// Overrides the Android home screen icon label independently of expo.name,
// same purpose as ios.infoPlist.CFBundleDisplayName in app.json.
module.exports = function withAndroidAppLabel(config, { label }) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name", translatable: "false" }, _: label }],
      config.modResults
    );
    return config;
  });
};
