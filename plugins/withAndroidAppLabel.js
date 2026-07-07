const { withStringsXml, AndroidConfig } = require("@expo/config-plugins");

// Overrides the Android home screen icon label independently of expo.name,
// same purpose as ios.infoPlist.CFBundleDisplayName in app.json.
module.exports = function withAndroidAppLabel(config, { label }) {
  return withStringsXml(config, (config) => {
    // Android string resources treat a bare apostrophe as a special
    // character (disables whitespace trimming) — aapt2 fails to compile
    // it unescaped, so it must be backslash-escaped here.
    const escapedLabel = label.replace(/'/g, "\\'");
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name", translatable: "false" }, _: escapedLabel }],
      config.modResults
    );
    return config;
  });
};
