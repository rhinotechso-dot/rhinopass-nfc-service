const fs = require("fs");
const path = require("path");

const sourceFile = path.join(__dirname, "..", "docs", "INSTALLATION.txt");
const targetDir = path.join(__dirname, "..", "release");
const targetFile = path.join(targetDir, "INSTALLATION.txt");

if (!fs.existsSync(sourceFile)) {
  console.warn("[copy-installation] INSTALLATION.txt not found. Skipping.");
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceFile, targetFile);
console.log("[copy-installation] INSTALLATION.txt copied to release folder.");
