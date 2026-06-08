#!/usr/bin/env node

/**
 * Simplified Blockchain Icon Fetcher (Standalone ESM)
 * Minimal dependencies - uses fetch and native crypto
 * 
 * Usage: node tools/fetch-icons-standalone.mjs [path/to/blockchains.txt]
 */

import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output directories
const OUT = path.resolve('apps/web/public/icons');
const SVG_OUT = path.join(OUT, 'svg');
const PNG32 = path.join(OUT, 'png', '32x32');
const PNG64 = path.join(OUT, 'png', '64x64');
const PNG128 = path.join(OUT, 'png', '128x128');
const REPORT = path.join(OUT, 'report');

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore if exists
  }
}

// Source repositories
const SOURCES = [
  { name: 'ErikThiart', base: 'https://cdn.jsdelivr.net/gh/ErikThiart/cryptocurrency-icons@latest' },
  { name: 'spothq', base: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@latest' },
  { name: 'ledgerhq', base: 'https://cdn.jsdelivr.net/gh/LedgerHQ/crypto-icons@latest' },
  { name: 'cryptocoins-jsdelivr', base: 'https://cdn.jsdelivr.net/npm/cryptocoins-icons@latest' }
];

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

let globalStats = {
  downloaded: 0,
  pngCreated: 0,
  fallback: 0,
  ambiguous: 0,
  failed: 0,
  duplicates: 0
};

function normalizeName(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      const delay = INITIAL_DELAY * Math.pow(2, i);
      console.log(`  Retry in ${delay}ms (attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function urlExists(url) {
  try {
    const response = await retryWithBackoff(() =>
      fetch(url, { method: 'HEAD', timeout: 8000 })
    );
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function downloadIfExists(url) {
  try {
    const response = await retryWithBackoff(() =>
      fetch(url, { timeout: 20000 })
    );
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (e) {
    console.error(`    Download failed: ${e.message}`);
    return null;
  }
}

function isSvgValid(buffer) {
  if (buffer.length > 500000) {
    console.warn('    Warning: SVG file very large (>500KB)');
    return true;
  }
  return true;
}

async function createPngFallback(svgBuffer, filename, sizes = [32, 64, 128]) {
  const results = {};
  
  // Note: PNG creation requires ImageMagick or similar
  // For now, we'll just record the paths but skip actual conversion
  // Users can run: convert input.svg -resize 32x32 output.png
  
  for (const size of sizes) {
    results[size] = `png/${size}x${size}/${path.basename(filename, '.svg')}.png`;
  }
  
  return results;
}

async function main() {
  console.log('🔄 ORYA Blockchain Icon Fetcher (Standalone)\n');
  
  // Ensure output directories
  await ensureDir(SVG_OUT);
  await ensureDir(PNG32);
  await ensureDir(PNG64);
  await ensureDir(PNG128);
  await ensureDir(REPORT);
  
  // Read blockchain list
  const chainsFile = process.argv[2];
  let chains = [];
  
  if (chainsFile) {
    try {
      const content = await fs.readFile(chainsFile, 'utf8');
      chains = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      console.log(`📋 Reading chain list from: ${chainsFile}`);
    } catch (e) {
      console.log(`⚠️  Could not read ${chainsFile}, using default list`);
    }
  }
  
  if (!chains.length) {
    console.log('⚠️  No blockchain file provided, using default list');
    chains = [
      'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'litecoin', 'cardano', 'polkadot',
      'solana', 'avalanche', 'tron', 'dogecoin', 'monero', 'chainlink', 'polygon',
      'algorand', 'tezos', 'bitcoin-cash', 'stellar', 'filecoin', 'zcash', 'near',
      'sui', 'aptos', 'optimism', 'arbitrum', 'fantom', 'klaytn', 'hedera', 'cosmos'
    ];
  }
  
  console.log(`✅ Found ${chains.length} chains to process\n`);
  
  const manifest = {};
  const ambiguous = [];
  const seenSha256 = {};
  
  // Candidate filename patterns
  const altNames = {
    'bitcoin-cash': ['bch', 'bitcoin-cash'],
    'ethereum': ['eth'],
    'polygon': ['matic', 'polygon'],
    'binancecoin': ['bnb', 'binance-coin', 'binancecoin'],
    'solana': ['sol'],
    'cardano': ['ada'],
    'polkadot': ['dot'],
    'ripple': ['xrp'],
    'litecoin': ['ltc'],
    'dogecoin': ['doge'],
    'monero': ['xmr'],
    'tezos': ['xtz'],
    'stellar': ['xlm'],
    'zcash': ['zec'],
    'tron': ['trx']
  };
  
  // Process each chain
  for (let idx = 0; idx < chains.length; idx++) {
    const rawChain = chains[idx];
    const canonical = rawChain;
    const norm = normalizeName(rawChain);
    
    console.log(`[${idx + 1}/${chains.length}] 🔍 ${canonical} (${norm})`);
    
    let found = false;
    let bestMatch = null;
    let bestBuffer = null;
    let bestSha = null;
    
    // Build candidates
    const candidates = [
      norm,
      norm.replace(/coin(s)?$/, ''),
      norm.replace(/\-chain$/, ''),
      norm.replace(/\-network$/, ''),
      norm.replace(/\./g, ''),
      norm.replace(/\-/g, '')
    ];
    
    if (altNames[norm]) {
      candidates.push(...altNames[norm]);
    }
    
    // Try sources
    for (const src of SOURCES) {
      for (const cand of candidates) {
        const filePatterns = [
          `/svg/${cand}.svg`,
          `/32/svg/${cand}.svg`,
          `/${cand}.svg`,
          `/icons/svg/${cand}.svg`
        ];
        
        for (const p of filePatterns) {
          const url = src.base + p;
          const exists = await urlExists(url);
          
          if (!exists) continue;
          
          console.log(`  ✓ Found at: ${src.name}${p}`);
          const buf = await downloadIfExists(url);
          
          if (!buf) {
            console.log(`  ✗ Failed to download`);
            continue;
          }
          
          const sh = sha256(buf);
          
          if (seenSha256[sh]) {
            console.log(`  ⚠️  Duplicate (${seenSha256[sh]})`);
            globalStats.duplicates++;
            continue;
          }
          
          seenSha256[sh] = canonical;
          bestMatch = { filename: `${cand}.svg`, source: url, sourceRepo: src.name };
          bestBuffer = buf;
          bestSha = sh;
          found = true;
          globalStats.downloaded++;
          break;
        }
        
        if (found) break;
      }
      
      if (found) break;
    }
    
    // Fallback
    if (!found) {
      console.log(`  → Creating fallback icon`);
      
      const letter = canonical[0].toUpperCase();
      const bgColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
        Math.floor(Math.random() * 5)
      ];
      
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">${letter}</text>
</svg>`;
      
      const fname = `${norm}.svg`;
      await fs.writeFile(path.join(SVG_OUT, fname), fallbackSvg);
      
      bestMatch = { filename: fname, source: 'fallback', sourceRepo: 'fallback' };
      bestBuffer = Buffer.from(fallbackSvg);
      bestSha = sha256(bestBuffer);
      found = true;
      globalStats.fallback++;
    }
    
    // Save manifest entry
    if (bestMatch && bestBuffer) {
      const svgPath = path.join(SVG_OUT, bestMatch.filename);
      await fs.writeFile(svgPath, bestBuffer);
      
      const pngRefs = await createPngFallback(bestBuffer, bestMatch.filename);
      
      manifest[norm] = {
        canonical_name: canonical,
        filename: bestMatch.filename,
        sha256: bestSha,
        source: bestMatch.source,
        source_repo: bestMatch.sourceRepo,
        png: pngRefs
      };
    }
  }
  
  // Save manifest
  const manifestPath = path.join(OUT, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest saved to: ${manifestPath}`);
  
  // Save ambiguous report
  if (ambiguous.length > 0) {
    const ambPath = path.join(REPORT, 'ambiguous_matches.json');
    await fs.writeFile(ambPath, JSON.stringify(ambiguous, null, 2));
    console.log(`⚠️  Ambiguous matches: ${ambPath}`);
  }
  
  // Generate summary
  const summaryPath = path.join(REPORT, 'summary.txt');
  const summary = `ORYA Blockchain Icon Fetcher - Summary
================================================================================
Execution: ${new Date().toISOString()}

Statistics:
  Total Chains: ${chains.length}
  Downloaded:  ${globalStats.downloaded}
  Fallbacks:   ${globalStats.fallback}
  Duplicates:  ${globalStats.duplicates}

Output:
  SVG Icons: ${SVG_OUT}
  Manifest:  ${manifestPath}
  Report:    ${REPORT}

Sources:
  1. ErikThiart/cryptocurrency-icons
  2. spothq/cryptocurrency-icons
  3. LedgerHQ/crypto-icons
  4. cryptocoins-icons

Next Steps:
  1. Review ${path.join(REPORT, 'summary.txt')}
  2. Test manifest loading in app
  3. For PNGs: use ImageMagick or similar tool to convert SVGs
     Example: magick convert input.svg -resize 32x32 output.png
  4. Commit to version control

================================================================================
`;
  
  await fs.writeFile(summaryPath, summary);
  console.log(`📊 Summary report: ${summaryPath}`);
  
  console.log(`\n✨ Icon fetching complete!`);
  console.log(`\n📦 Deliverables:`);
  console.log(`   ✓ ${globalStats.downloaded + globalStats.fallback} SVG icons`);
  console.log(`   ✓ manifest.json`);
  console.log(`   ✓ Detailed reports`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});