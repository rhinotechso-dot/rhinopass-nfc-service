const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "..", "src", "electron", "renderer");
const targetDir = path.join(__dirname, "..", "dist", "electron", "renderer");

const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

if (!fs.existsSync(sourceDir)) {
  console.warn("[copy-assets] renderer folder not found. Skipping copy.");
  process.exit(0);
}

copyDir(sourceDir, targetDir);
console.log("[copy-assets] Renderer assets copied.");
