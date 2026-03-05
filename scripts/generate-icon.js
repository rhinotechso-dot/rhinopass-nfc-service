const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;

const sourceSvg = path.join(__dirname, "..", "src", "electron", "renderer", "icon.svg");
const outputDir = path.join(__dirname, "..", "build");
const pngSizes = [256, 128, 64, 48, 32, 16];
const pngFiles = [];

if (!fs.existsSync(sourceSvg)) {
  console.error(`[generate-icon] Missing source SVG: ${sourceSvg}`);
  process.exit(1);
}

const svgSource = fs.readFileSync(sourceSvg, "utf8");
fs.mkdirSync(outputDir, { recursive: true });

const viewBoxMatch = svgSource.match(/viewBox="([^"]+)"/);
if (!viewBoxMatch) {
  console.error("[generate-icon] Missing viewBox on source SVG.");
  process.exit(1);
}

const [vbX, vbY, vbWidth, vbHeight] = viewBoxMatch[1]
  .trim()
  .split(/\s+/)
  .map((value) => Number(value));

if (![vbX, vbY, vbWidth, vbHeight].every(Number.isFinite)) {
  console.error("[generate-icon] Invalid viewBox values.");
  process.exit(1);
}

const innerSvg = svgSource.replace(/<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
const targetSize = 512;
const paddingRatio = 0.82;
const scale = (targetSize * paddingRatio) / Math.max(vbWidth, vbHeight);
const translateX = (targetSize - vbWidth * scale) / 2;
const translateY = (targetSize - vbHeight * scale) / 2;

const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetSize}" height="${targetSize}" viewBox="0 0 ${targetSize} ${targetSize}" fill="none"><g transform="translate(${translateX} ${translateY}) scale(${scale})">${innerSvg}</g></svg>`;

for (const size of pngSizes) {
  const resvg = new Resvg(wrappedSvg, {
    fitTo: {
      mode: "width",
      value: size,
    },
  });
  const png = resvg.render().asPng();
  const pngPath = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(pngPath, png);
  pngFiles.push(pngPath);
}

const icoPath = path.join(outputDir, "icon.ico");
pngToIco(pngFiles)
  .then((ico) => {
    fs.writeFileSync(icoPath, ico);
    console.log(`[generate-icon] Wrote ${icoPath}`);
  })
  .catch((error) => {
    console.error("[generate-icon] Failed to generate ico:", error);
    process.exit(1);
  });
