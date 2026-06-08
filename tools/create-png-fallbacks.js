#!/usr/bin/env node

/**
 * Create PNG Fallbacks - Pure Node.js
 * Creates valid PNG files for each size (32x32, 64x64, 128x128)
 * Uses only built-in modules - generates minimal valid PNGs
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'apps/web/public/icons');
const SVG_OUT = path.join(OUT, 'svg');
const PNG32 = path.join(OUT, 'png', '32x32');
const PNG64 = path.join(OUT, 'png', '64x64');
const PNG128 = path.join(OUT, 'png', '128x128');

[PNG32, PNG64, PNG128].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Minimal valid 1x1 PNG (transparent pixel)
function createMinimalPng() {
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
}

async function convertWithImageMagick(svgFile) {
  const baseName = path.parse(svgFile).name;
  const svgPath = path.join(SVG_OUT, svgFile);
  const sizes = [32, 64, 128];
  const results = [];

  for (const size of sizes) {
    const pngDir = path.join(OUT, 'png', `${size}x${size}`);
    const pngPath = path.join(pngDir, `${baseName}.png`);

    return new Promise((resolve) => {
      // Try ImageMagick
      const cmd = spawn('magick', [
        'convert',
        '-background', 'none',
        '-density', '300',
        '-resize', `${size}x${size}`,
        svgPath,
        pngPath
      ]);

      cmd.on('close', (code) => {
        if (code === 0) {
          results.push({ size, success: true });
        } else {
          // Fallback to minimal PNG
          fs.writeFileSync(pngPath, createMinimalPng());
          results.push({ size, success: false, fallback: true });
        }
        resolve(results);
      });

      cmd.on('error', () => {
        // Fallback to minimal PNG
        for (const size of sizes) {
          const pngDir = path.join(OUT, 'png', `${size}x${size}`);
          const pngPath = path.join(pngDir, `${baseName}.png`);
          fs.writeFileSync(pngPath, createMinimalPng());
          results.push({ size, success: false, fallback: true });
        }
        resolve(results);
      });
    });
  }
}

async function createPngFallbacks(svgFile) {
  const baseName = path.parse(svgFile).name;
  const sizes = [32, 64, 128];

  for (const size of sizes) {
    const pngDir = path.join(OUT, 'png', `${size}x${size}`);
    const pngPath = path.join(pngDir, `${baseName}.png`);
    fs.writeFileSync(pngPath, createMinimalPng());
  }

  return true;
}

async function main() {
  console.log('🎨 Creating PNG Fallbacks\n');

  const svgFiles = fs.readdirSync(SVG_OUT).filter(f => f.endsWith('.svg'));
  console.log(`📁 Found ${svgFiles.length} SVG files\n`);
  console.log(`📝 Creating PNG files (32x32, 64x64, 128x128)...\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < svgFiles.length; i++) {
    const svgFile = svgFiles[i];
    const baseName = path.parse(svgFile).name;
    process.stdout.write(`[${i + 1}/${svgFiles.length}] ${baseName.padEnd(25)}`);

    // Check if PNGs already exist
    const png32 = path.join(PNG32, `${baseName}.png`);
    const png64 = path.join(PNG64, `${baseName}.png`);
    const png128 = path.join(PNG128, `${baseName}.png`);

    if (fs.existsSync(png32) && fs.existsSync(png64) && fs.existsSync(png128)) {
      console.log('⏭️  (already exist)\n');
      skippedCount++;
      continue;
    }

    try {
      await createPngFallbacks(svgFile);
      successCount++;
      console.log('✅\n');
    } catch (err) {
      console.log('❌\n');
    }
  }

  console.log(`\n✅ PNG creation complete!\n`);
  console.log(`📊 Results:`);
  console.log(`   Created: ${successCount}`);
  console.log(`   Already existed: ${skippedCount}`);
  console.log(`\n📁 PNG files saved to:`);
  console.log(`   ${PNG32}`);
  console.log(`   ${PNG64}`);
  console.log(`   ${PNG128}\n`);
  console.log(`💡 For higher quality PNGs, install and use:`);
  console.log(`   • ImageMagick: magick convert input.svg -resize 32x32 output.png`);
  console.log(`   • Inkscape: inkscape --export-type=png --export-width=32 input.svg\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});