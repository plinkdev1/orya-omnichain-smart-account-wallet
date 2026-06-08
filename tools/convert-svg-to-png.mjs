#!/usr/bin/env node

/**
 * SVG to PNG Converter for Icon Manifest
 * Converts all SVG icons to PNG at 32x32, 64x64, 128x128
 */

import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'apps/web/public/icons');
const SVG_OUT = path.join(OUT, 'svg');
const PNG32 = path.join(OUT, 'png', '32x32');
const PNG64 = path.join(OUT, 'png', '64x64');
const PNG128 = path.join(OUT, 'png', '128x128');

async function convertWithImageMagick(svgFile, sizes = [32, 64, 128]) {
  const svgPath = path.join(SVG_OUT, svgFile);
  const results = {};

  for (const size of sizes) {
    const pngDir = path.join(OUT, 'png', `${size}x${size}`);
    const baseName = path.parse(svgFile).name;
    const pngPath = path.join(pngDir, `${baseName}.png`);

    try {
      // Use ImageMagick convert (or magick on newer versions)
      const cmd = `convert -background none -density 300 -resize ${size}x${size} "${svgPath}" "${pngPath}"`;
      await execAsync(cmd);
      results[size] = true;
    } catch (err) {
      console.warn(`  ⚠️  ImageMagick not available or failed for ${size}x${size}`);
      results[size] = false;
    }
  }

  return results;
}

async function convertWithInkscape(svgFile, sizes = [32, 64, 128]) {
  const svgPath = path.join(SVG_OUT, svgFile);
  const results = {};

  for (const size of sizes) {
    const pngDir = path.join(OUT, 'png', `${size}x${size}`);
    const baseName = path.parse(svgFile).name;
    const pngPath = path.join(pngDir, `${baseName}.png`);

    try {
      // Use Inkscape
      const cmd = `inkscape --export-type=png --export-width=${size} --export-height=${size} --export-filename="${pngPath}" "${svgPath}"`;
      await execAsync(cmd);
      results[size] = true;
    } catch (err) {
      console.warn(`  ⚠️  Inkscape not available or failed for ${size}x${size}`);
      results[size] = false;
    }
  }

  return results;
}

async function createPlaceholderPng(svgFile, sizes = [32, 64, 128]) {
  // If no conversion tool available, create a simple PNG placeholder
  // (In production, integrate with jimp or canvas)
  const baseName = path.parse(svgFile).name;

  for (const size of sizes) {
    const pngDir = path.join(OUT, 'png', `${size}x${size}`);
    fs.ensureDirSync(pngDir);

    // Create a placeholder file (would be replaced with actual conversion)
    const pngPath = path.join(pngDir, `${baseName}.png`);
    
    // Write a minimal valid PNG (1x1 transparent pixel)
    // This is base64 of a valid 1x1 PNG with transparency
    const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(pngPath, minimalPng);
  }

  return { 32: true, 64: true, 128: true };
}

async function main() {
  console.log('🎨 SVG to PNG Converter\n');

  // Get list of SVG files
  const svgFiles = fs.readdirSync(SVG_OUT).filter(f => f.endsWith('.svg'));
  console.log(`📁 Found ${svgFiles.length} SVG files\n`);

  // Try to detect available tools
  let hasImageMagick = false;
  let hasInkscape = false;

  try {
    await execAsync('convert --version');
    hasImageMagick = true;
    console.log('✅ ImageMagick detected\n');
  } catch {
    console.log('⚠️  ImageMagick not found');
  }

  try {
    await execAsync('inkscape --version');
    hasInkscape = true;
    console.log('✅ Inkscape detected\n');
  } catch {
    console.log('⚠️  Inkscape not found');
  }

  console.log(`🔄 Converting ${svgFiles.length} SVGs to PNG...\n`);

  let successCount = 0;

  for (let i = 0; i < svgFiles.length; i++) {
    const svgFile = svgFiles[i];
    process.stdout.write(`[${i + 1}/${svgFiles.length}] ${svgFile.replace('.svg', '')}`);

    let results;

    if (hasImageMagick) {
      results = await convertWithImageMagick(svgFile);
    } else if (hasInkscape) {
      results = await convertWithInkscape(svgFile);
    } else {
      results = await createPlaceholderPng(svgFile);
      console.log(' ⚠️  (placeholder - no conversion tool)\n');
      continue;
    }

    if (Object.values(results).every(v => v)) {
      successCount++;
      console.log(' ✅\n');
    } else {
      console.log(' ⚠️  (partial)\n');
    }
  }

  console.log(`\n✅ PNG conversion complete!\n`);
  console.log(`📊 Results:`);
  console.log(`   Total SVGs: ${svgFiles.length}`);
  console.log(`   Successfully converted: ${successCount}`);
  console.log(`\n📁 PNG files saved to:`);
  console.log(`   ${PNG32}`);
  console.log(`   ${PNG64}`);
  console.log(`   ${PNG128}\n`);

  if (!hasImageMagick && !hasInkscape) {
    console.log(`💡 To enable automatic PNG conversion, install one of:`);
    console.log(`   • ImageMagick: https://imagemagick.org/`);
    console.log(`   • Inkscape: https://inkscape.org/`);
    console.log(`\n   Or add sharp to package.json:\n`);
    console.log(`   npm install sharp\n`);
  }
}

main().catch(console.error);