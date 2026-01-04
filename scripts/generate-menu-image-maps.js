/* scripts/generate-menu-image-maps.js */
const fs = require("fs");
const path = require("path");

// === Adjust these if your paths differ ===
const ROOT = process.cwd();
const MENU_FILE = path.join(ROOT, "src", "data", "menu.ts");
const OUT_DIR = path.join(ROOT, "src", "constants");
const DEFAULT_EXT = "jpg"; // change to "png" if you want

// categoryId -> assets folder name + constants file name + exported const name
// NOTE: these match the category IDs you already use in menu.ts
const CATEGORY_CONFIG = {
  appetizers: {
    folder: "Appetizers",
    file: "Appetizers-image.ts",
    exportName: "APPETIZER_IMAGES",
  },
  ensalada: {
    folder: "Ensaladas",
    file: "Ensaladas-image.ts",
    exportName: "ENSALADA_IMAGES",
  },
  beverage: {
    folder: "Beverages",
    file: "Beverages-image.ts",
    exportName: "BEVERAGE_IMAGES",
  },

  "lunch-specials": {
    folder: "Lunch-Specials",
    file: "Lunch-Specials-image.ts",
    exportName: "LUNCH_SPECIALS_IMAGES",
  },
  "local-favorites": {
    folder: "Local-Favorites",
    file: "Local-Favorites-image.ts",
    exportName: "LOCAL_FAVORITES_IMAGES",
  },
  "house-specialties": {
    folder: "House-Specialties",
    file: "House-Specialties-image.ts",
    exportName: "HOUSE_SPECIALTIES_IMAGES",
  },
  "american-food": {
    folder: "American-Food",
    file: "American-Food-image.ts",
    exportName: "AMERICAN_FOOD_IMAGES",
  },
  fajitas: {
    folder: "Fajitas",
    file: "Fajitas-image.ts",
    exportName: "FAJITAS_IMAGES",
  },
  nachos: {
    folder: "Nachos",
    file: "Nachos-image.ts",
    exportName: "NACHOS_IMAGES",
  },
  dessert: {
    folder: "Dessert",
    file: "Dessert-image.ts",
    exportName: "DESSERT_IMAGES",
  },
  kids: {
    folder: "Kids",
    file: "Kids-image.ts",
    exportName: "KIDS_IMAGES",
  },
  quesadillas: {
    folder: "Quesadillas",
    file: "Quesadillas-image.ts",
    exportName: "QUESADILLAS_IMAGES",
  },
};

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readText(p) {
  if (!fs.existsSync(p)) die(`Missing file: ${p}`);
  return fs.readFileSync(p, "utf8");
}

// Very small parser: finds objects that contain id + categoryId (works for your current menu.ts format)
function extractMenuItems(menuSource) {
  const items = [];

  // Grab blocks that look like { ... }
  // Then inside each, find id: "..." and categoryId: "..."
  const objectBlocks = menuSource.match(/\{[\s\S]*?\}/g) || [];
  for (const block of objectBlocks) {
    const idMatch = block.match(/id:\s*"([^"]+)"/);
    const catMatch = block.match(/categoryId:\s*"([^"]+)"/);
    if (!idMatch || !catMatch) continue;

    items.push({
      id: idMatch[1],
      categoryId: catMatch[1],
    });
  }

  return items;
}

function buildMapFile({ exportName, folder }, ids, ext) {
  const lines = [];
  lines.push(`// AUTO-GENERATED from src/data/menu.ts`);
  lines.push(`// Edit by adding/removing entries or re-run the generator.\n`);
  lines.push(`export const ${exportName} = {`);

  for (const id of ids) {
    const key =
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(id) ? id : `"${id}"`; // quote if needed
    lines.push(
      `  ${key}: require("../../assets/${folder}/${id}.${ext}"),`
    );
  }

  lines.push(`} as const;`);
  lines.push("");
  return lines.join("\n");
}

function main() {
  ensureDir(OUT_DIR);

  const menuSource = readText(MENU_FILE);
  const items = extractMenuItems(menuSource);

  if (!items.length) {
    die(
      `Could not extract any {id, categoryId} items from src/data/menu.ts.\n` +
        `If you changed formatting a lot, we can adjust the parser.`
    );
  }

  // Group IDs by categoryId
  const byCategory = new Map();
  for (const it of items) {
    if (!CATEGORY_CONFIG[it.categoryId]) continue; // ignore categories not in config
    if (!byCategory.has(it.categoryId)) byCategory.set(it.categoryId, new Set());
    byCategory.get(it.categoryId).add(it.id);
  }

  // Create missing files only (won't overwrite your existing beverage/appetizer/ensalada files)
  const created = [];
  const skipped = [];
  for (const [categoryId, idsSet] of byCategory.entries()) {
    const cfg = CATEGORY_CONFIG[categoryId];
    const outPath = path.join(OUT_DIR, cfg.file);

    const ids = Array.from(idsSet).sort();
    if (fs.existsSync(outPath)) {
      skipped.push(cfg.file);
      continue;
    }

    const content = buildMapFile(cfg, ids, DEFAULT_EXT);
    fs.writeFileSync(outPath, content, "utf8");
    created.push(cfg.file);
  }

  console.log("\n✅ Image-map generation complete.\n");
  console.log(`MENU_FILE: ${MENU_FILE}`);
  console.log(`OUT_DIR:   ${OUT_DIR}\n`);

  if (created.length) {
    console.log("Created:");
    created.forEach((f) => console.log(`  + ${f}`));
    console.log("");
  }

  if (skipped.length) {
    console.log("Skipped (already exists):");
    skipped.forEach((f) => console.log(`  - ${f}`));
    console.log("");
  }

  console.log(
    "Next:\n" +
      "1) Create the matching assets folders under /assets (if you haven't)\n" +
      `2) Drop images named <id>.${DEFAULT_EXT} into assets/<Category> folders\n` +
      "3) Restart Expo with cache clear: npx expo start -c\n"
  );
}

main();
