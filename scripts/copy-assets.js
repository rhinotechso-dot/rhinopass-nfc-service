const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

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

const buildWrappedSvg = (svgSource) => {
  const viewBoxMatch = svgSource.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) return svgSource;

  const [vbX, vbY, vbWidth, vbHeight] = viewBoxMatch[1]
    .trim()
    .split(/\s+/)
    .map((value) => Number(value));

  if (![vbX, vbY, vbWidth, vbHeight].every(Number.isFinite)) {
    return svgSource;
  }

  const innerSvg = svgSource.replace(/<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
  const targetSize = 512;
  const paddingRatio = 0.82;
  const scale = (targetSize * paddingRatio) / Math.max(vbWidth, vbHeight);
  const translateX = (targetSize - vbWidth * scale) / 2;
  const translateY = (targetSize - vbHeight * scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${targetSize}" height="${targetSize}" viewBox="0 0 ${targetSize} ${targetSize}" fill="none"><g transform="translate(${translateX} ${translateY}) scale(${scale})">${innerSvg}</g></svg>`;
};

const renderSvgToPng = (srcPath, destPath, size, options = {}) => {
  if (!fs.existsSync(srcPath)) return;
  const svgSource = fs.readFileSync(srcPath, "utf8");
  const svg = options.wrap ? buildWrappedSvg(svgSource) : svgSource;
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: size,
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(destPath, png);
};

if (!fs.existsSync(sourceDir)) {
  console.warn("[copy-assets] renderer folder not found. Skipping copy.");
  process.exit(0);
}

copyDir(sourceDir, targetDir);

renderSvgToPng(
  path.join(sourceDir, "icon.svg"),
  path.join(targetDir, "app-icon.png"),
  64,
  { wrap: true },
);

["tray-online", "tray-connecting", "tray-error"].forEach((name) => {
  renderSvgToPng(
    path.join(sourceDir, `${name}.svg`),
    path.join(targetDir, `${name}.png`),
    24,
  );
});

console.log("[copy-assets] Renderer assets copied.");
