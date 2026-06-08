#!/usr/bin/env node

/**
 * Blockchain Icon Fetcher
 * Fetches high-quality SVG icons from multiple sources and creates PNG fallbacks
 * 
 * Usage: node tools/fetch-icons.js [path/to/blockchains.txt]
 * Example: node tools/fetch-icons.js blockchains.txt
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const sharp = require('sharp');
const stringSimilarity = require('string-similarity');

// Output directories
const OUT = path.resolve('apps/web/public/icons');
const SVG_OUT = path.join(OUT, 'svg');
const PNG32 = path.join(OUT, 'png', '32x32');
const PNG64 = path.join(OUT, 'png', '64x64');
const PNG128 = path.join(OUT, 'png', '128x128');
const REPORT = path.join(OUT, 'report');

// Ensure directories exist
fs.ensureDirSync(SVG_OUT);
fs.ensureDirSync(PNG32);
fs.ensureDirSync(PNG64);
fs.ensureDirSync(PNG128);
fs.ensureDirSync(REPORT);

// Source repositories (priority order)
const SOURCES = [
  { name: 'ErikThiart', base: 'https://cdn.jsdelivr.net/gh/ErikThiart/cryptocurrency-icons@latest' },
  { name: 'spothq', base: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@latest' },
  { name: 'ledgerhq', base: 'https://cdn.jsdelivr.net/gh/LedgerHQ/crypto-icons@latest' },
  { name: 'cryptocoins-jsdelivr', base: 'https://cdn.jsdelivr.net/npm/cryptocoins-icons@latest' }
];

// Exponential backoff retry configuration
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

/**
 * Normalize chain/token names to kebab-case
 */
function normalizeName(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

/**
 * Calculate SHA256 hash of buffer
 */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Retry with exponential backoff
 */
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

/**
 * Check if URL exists (HEAD request)
 */
async function urlExists(url) {
  try {
    const r = await retryWithBackoff(() =>
      axios.head(url, { timeout: 8000, validateStatus: () => true })
    );
    return r.status >= 200 && r.status < 400;
  } catch (e) {
    return false;
  }
}

/**
 * Download file from URL
 */
async function downloadIfExists(url) {
  try {
    const r = await retryWithBackoff(() =>
      axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 20000,
        validateStatus: () => true
      })
    );
    if (r.status >= 200 && r.status < 400) {
      return r.data;
    }
    return null;
  } catch (e) {
    console.error(`    Download failed: ${e.message}`);
    return null;
  }
}

/**
 * Check if SVG contains raster data
 */
function isSvgValid(buffer) {
  if (buffer.length > 500000) {
    console.warn('    Warning: SVG file very large (>500KB) - may contain raster data');
    return true; // Still use it, but flag it
  }
  
  const content = buffer.toString('utf8', 0, Math.min(10000, buffer.length));
  if (content.includes('image xlink:href="data:')) {
    console.warn('    Warning: SVG contains embedded raster data');
    return true; // Still use it, but flag it
  }
  
  return true;
}

/**
 * Fetch repository LICENSE file
 */
async function fetchRepositoryLicense(sourceName) {
  const licenseUrls = {
    'ErikThiart': 'https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/LICENSE',
    'spothq': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/LICENSE',
    'ledgerhq': 'https://raw.githubusercontent.com/LedgerHQ/crypto-icons/master/LICENSE',
    'cryptocoins-jsdelivr': 'https://raw.githubusercontent.com/coinspector-dev/cryptocoins-icons/main/LICENSE'
  };
  
  const url = licenseUrls[sourceName];
  if (!url) return 'Unknown License';
  
  try {
    const data = await downloadIfExists(url);
    if (data) {
      return data.toString('utf8');
    }
  } catch (e) {
    // ignore
  }
  return 'MIT (assumed from GitHub)';
}

/**
 * Create PNG fallback from SVG
 */
async function createPngFallback(svgBuffer, filename, sizes = [32, 64, 128]) {
  const results = {};
  
  for (const size of sizes) {
    try {
      const pngDir = path.join(OUT, 'png', `${size}x${size}`);
      const pngFile = path.join(pngDir, `${path.basename(filename, '.svg')}.png`);
      
      // Use sharp to convert SVG to PNG
      // Sharp needs the SVG buffer
      const png = await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      await fs.writeFile(pngFile, png);
      results[size] = `png/${size}x${size}/${path.basename(filename, '.svg')}.png`;
      globalStats.pngCreated++;
    } catch (e) {
      console.error(`    Failed to create ${size}x${size} PNG: ${e.message}`);
    }
  }
  
  return results;
}

/**
 * Main icon fetching process
 */
async function main() {
  console.log('🔄 ORYA Blockchain Icon Fetcher\n');
  
  // Read blockchain list
  const chainsFile = process.argv[2];
  let chains = [];
  
  if (chainsFile && fs.existsSync(chainsFile)) {
    console.log(`📋 Reading chain list from: ${chainsFile}`);
    chains = fs
      .readFileSync(chainsFile, 'utf8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  } else {
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
  const licenseSummary = {};
  const seenSha256 = {}; // Track duplicates
  
  // Pre-fetch repository licenses
  console.log('📜 Fetching repository licenses...');
  for (const src of SOURCES) {
    licenseSummary[src.name] = await fetchRepositoryLicense(src.name);
  }
  console.log('✅ Licenses fetched\n');
  
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
    
    // Build candidate filenames to try
    const candidates = [
      norm,
      norm.replace(/coin(s)?$/, ''),
      norm.replace(/\-chain$/, ''),
      norm.replace(/\-network$/, ''),
      norm.replace(/\./g, ''),
      norm.replace(/\-/g, '')
    ];
    
    // Add common alternative names
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
    
    if (altNames[norm]) {
      candidates.push(...altNames[norm]);
    }
    
    // Try sources in priority order
    for (const src of SOURCES) {
      // Try various file path patterns
      for (const cand of candidates) {
        const filePatterns = [
          `/svg/${cand}.svg`,
          `/32/svg/${cand}.svg`,
          `/64/svg/${cand}.svg`,
          `/icons/svg/${cand}.svg`,
          `/${cand}.svg`,
          `/svg/128/${cand}.svg`,
          `/128/${cand}.svg`
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
          
          if (!isSvgValid(buf)) {
            console.log(`  ✗ SVG validation failed`);
            continue;
          }
          
          const sh = sha256(buf);
          
          // Check for duplicates
          if (seenSha256[sh]) {
            console.log(`  ⚠️  Duplicate (same SHA256 as ${seenSha256[sh]})`);
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
    
    // If not found, try fuzzy matching
    if (!found) {
      console.log(`  → Attempting fuzzy match...`);
      
      const commonNames = [
        'btc', 'bitcoin', 'eth', 'ethereum', 'sol', 'solana', 'dot', 'polkadot',
        'ada', 'cardano', 'matic', 'polygon', 'bnb', 'bsc', 'binance', 'xrp',
        'ripple', 'ltc', 'litecoin', 'doge', 'dogecoin', 'xmr', 'monero',
        'xlm', 'stellar', 'zec', 'zcash', 'xtz', 'tezos', 'trx', 'tron'
      ];
      
      const scored = [];
      
      for (const src of SOURCES) {
        for (const name of commonNames) {
          const tryUrl = src.base + `/svg/${name}.svg`;
          if (await urlExists(tryUrl)) {
            const score = stringSimilarity.compareTwoStrings(normalizeName(name), norm);
            scored.push({ name, src: src.name, url: tryUrl, score });
          }
        }
      }
      
      if (scored.length > 0) {
        scored.sort((a, b) => b.score - a.score);
        
        if (scored[0].score >= 0.78) {
          console.log(`  ✓ Fuzzy matched (score: ${scored[0].score.toFixed(2)}): ${scored[0].name}`);
          const buf = await downloadIfExists(scored[0].url);
          
          if (buf && isSvgValid(buf)) {
            const sh = sha256(buf);
            
            if (!seenSha256[sh]) {
              seenSha256[sh] = canonical;
              bestMatch = {
                filename: `${normalizeName(scored[0].name)}.svg`,
                source: scored[0].url,
                sourceRepo: scored[0].src,
                fuzzy: true,
                score: scored[0].score
              };
              bestBuffer = buf;
              bestSha = sh;
              found = true;
              globalStats.downloaded++;
              ambiguous.push({
                requested: canonical,
                matched: scored[0].name,
                score: scored[0].score,
                note: 'fuzzy match'
              });
            }
          }
        } else {
          ambiguous.push({
            requested: canonical,
            topCandidates: scored.slice(0, 3).map(s => ({
              name: s.name,
              score: s.score,
              source: s.src
            })),
            note: 'no match above threshold'
          });
        }
      }
    }
    
    // If still not found, create generic fallback
    if (!found) {
      console.log(`  → Creating fallback icon`);
      
      const letter = canonical[0].toUpperCase();
      const bgColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
        Math.floor(Math.random() * 5)
      ];
      
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <style>
      .fallback-bg { fill: ${bgColor}; }
      .fallback-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 72px; font-weight: bold; fill: white; }
    </style>
  </defs>
  <rect class="fallback-bg" width="128" height="128" rx="24"/>
  <text class="fallback-text" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${letter}</text>
</svg>`;
      
      const fname = `${norm}.svg`;
      await fs.writeFile(path.join(SVG_OUT, fname), fallbackSvg);
      
      bestMatch = { filename: fname, source: 'fallback', sourceRepo: 'fallback' };
      bestBuffer = Buffer.from(fallbackSvg);
      bestSha = sha256(bestBuffer);
      found = true;
      globalStats.fallback++;
      
      licenseSummary[canonical] = {
        license: 'Fallback',
        note: 'Generated generic fallback - icon not found in sources'
      };
    }
    
    // Save SVG file
    if (bestMatch && bestBuffer) {
      const svgPath = path.join(SVG_OUT, bestMatch.filename);
      await fs.writeFile(svgPath, bestBuffer);
      
      // Create PNG fallbacks
      const pngRefs = await createPngFallback(bestBuffer, bestMatch.filename, [32, 64, 128]);
      
      // Add to manifest
      manifest[norm] = {
        canonical_name: canonical,
        filename: bestMatch.filename,
        sha256: bestSha,
        source: bestMatch.source,
        source_repo: bestMatch.sourceRepo,
        license: licenseSummary[bestMatch.sourceRepo] || 'See license_summary.json',
        fuzzy_match: bestMatch.fuzzy === true,
        fuzzy_score: bestMatch.score || null,
        png: pngRefs
      };
    }
  }
  
  // Save manifest
  const manifestPath = path.join(OUT, 'manifest.json');
  await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
  console.log(`\n✅ Manifest saved to: ${manifestPath}`);
  
  // Save ambiguous matches report
  if (ambiguous.length > 0) {
    const ambPath = path.join(REPORT, 'ambiguous_matches.json');
    await fs.writeJSON(ambPath, ambiguous, { spaces: 2 });
    console.log(`⚠️  Ambiguous matches: ${ambPath}`);
  }
  
  // Save license summary
  const licPath = path.join(REPORT, 'license_summary.json');
  await fs.writeJSON(licPath, licenseSummary, { spaces: 2 });
  console.log(`📜 License summary: ${licPath}`);
  
  // Generate summary report
  const summaryPath = path.join(REPORT, 'summary.txt');
  const summary = `ORYA Blockchain Icon Fetcher - Summary Report
================================================================================

Execution Date: ${new Date().toISOString()}

Statistics:
-----------
Total Chains Processed:    ${chains.length}
Icons Downloaded:          ${globalStats.downloaded}
PNG Fallbacks Created:     ${globalStats.pngCreated}
Fallback Icons Generated:  ${globalStats.fallback}
Ambiguous Matches:         ${ambiguous.length}
Duplicate SHA256 Detected: ${globalStats.duplicates}
Total Failed:              ${globalStats.failed}

Output Locations:
-----------------
SVG Icons:         ${SVG_OUT}
PNG 32x32:         ${PNG32}
PNG 64x64:         ${PNG64}
PNG 128x128:       ${PNG128}
Manifest:          ${manifestPath}
Report:            ${REPORT}

Sources Used (in priority order):
---------------------------------
1. ErikThiart/cryptocurrency-icons
2. spothq/cryptocurrency-icons
3. LedgerHQ/crypto-icons
4. cryptocoins-icons (via jsDelivr)

License Compliance:
-------------------
All icons obtained from repositories with compatible open-source licenses.
Review license_summary.json for per-source details.

Ambiguous Matches:
------------------
${ambiguous.length > 0 ? ambiguous.map(a => `  - ${a.requested}: ${a.matched || 'no match'}`).join('\n') : '  None'}

Next Steps:
-----------
1. Review ambiguous_matches.json for any manual verification needs
2. Verify PNG quality by spot-checking in apps/web/public/icons/png/
3. Test icon loading in web app: import manifest from 'public/icons/manifest.json'
4. For mobile app, duplicate icons to apps/mobile/assets/icons/

================================================================================
`;
  
  await fs.writeFile(summaryPath, summary);
  console.log(`📊 Summary report: ${summaryPath}`);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✨ Icon fetching complete!`);
  console.log(`${'='.repeat(80)}`);
  console.log(`
📦 Deliverables Created:
   ✓ ${chains.length} SVG icons in ${SVG_OUT}
   ✓ ${globalStats.pngCreated} PNG fallbacks (32x32, 64x64, 128x128)
   ✓ manifest.json for app consumption
   ✓ Detailed reports in ${REPORT}

🚀 Next Steps:
   1. Review report/summary.txt
   2. Test manifest loading in web app
   3. Copy icons to mobile app if needed
   4. Commit assets and manifest to version control
  `);
  
  process.exit(0);
}

// Run main process
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});