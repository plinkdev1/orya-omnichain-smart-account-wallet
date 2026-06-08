#!/usr/bin/env node

/**
 * ORYA Blockchain Icon Fetcher (Pure Node.js)
 * Uses only built-in modules - no external dependencies
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'apps/web/public/icons');
const SVG_OUT = path.join(OUT, 'svg');
const PNG32 = path.join(OUT, 'png', '32x32');
const PNG64 = path.join(OUT, 'png', '64x64');
const PNG128 = path.join(OUT, 'png', '128x128');
const REPORT = path.join(OUT, 'report');

// Ensure directories exist
[SVG_OUT, PNG32, PNG64, PNG128, REPORT].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const SOURCES = [
  {
    name: 'ErikThiart',
    base: 'https://cdn.jsdelivr.net/gh/ErikThiart/cryptocurrency-icons@latest',
    paths: ['/svg', '/32/svg', '/64/svg']
  },
  {
    name: 'spothq',
    base: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@latest',
    paths: ['/svg', '/32/svg', '/64/svg']
  },
  {
    name: 'LedgerHQ',
    base: 'https://cdn.jsdelivr.net/gh/LedgerHQ/crypto-icons@latest',
    paths: ['/svg', '/cryptocurrencies']
  },
  {
    name: 'cryptocoins-icons',
    base: 'https://cdn.jsdelivr.net/npm/cryptocoins-icons@latest',
    paths: ['/svg', '/32/svg']
  }
];

function normalizeName(s) {
  return s.toLowerCase().trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function fetchUrl(url, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryFetch = () => {
      attempt++;
      https.get(url, { timeout: 15000 }, (res) => {
        let data = Buffer.alloc(0);

        if (res.statusCode !== 200) {
          res.resume();
          if (attempt < maxRetries) {
            setTimeout(tryFetch, Math.pow(2, attempt - 1) * 1000);
          } else {
            resolve(null);
          }
          return;
        }

        res.on('data', chunk => {
          data = Buffer.concat([data, chunk]);
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        if (attempt < maxRetries) {
          setTimeout(tryFetch, Math.pow(2, attempt - 1) * 1000);
        } else {
          resolve(null);
        }
      }).on('timeout', function() {
        this.destroy();
        if (attempt < maxRetries) {
          setTimeout(tryFetch, Math.pow(2, attempt - 1) * 1000);
        } else {
          resolve(null);
        }
      });
    };

    tryFetch();
  });
}

async function tryDownloadIcon(chainName, normalizedName) {
  const altNames = {
    'bitcoin-cash': ['bch', 'bitcoin-cash'],
    'ethereum': ['eth'],
    'polygon': ['matic', 'polygon'],
    'binancecoin': ['bnb', 'binance-coin', 'binancecoin'],
    'solana': ['sol', 'solana'],
    'cardano': ['ada', 'cardano'],
    'polkadot': ['dot', 'polkadot'],
    'ripple': ['xrp', 'ripple'],
    'litecoin': ['ltc', 'litecoin'],
    'dogecoin': ['doge', 'dogecoin'],
    'cosmos': ['atom', 'cosmos'],
    'optimism': ['op', 'optimism'],
    'arbitrum': ['arb', 'arbitrum'],
    'tron': ['trx', 'tron'],
    'avalanche': ['avax', 'avalanche'],
    'fantom': ['ftm', 'fantom']
  };

  const candidates = new Set([
    normalizedName,
    ...(altNames[normalizedName] || []),
    normalizedName.replace(/coin(s)?$/, ''),
    normalizedName.replace(/\-chain$/, ''),
    normalizedName.replace(/\-network$/, ''),
  ]);

  for (const source of SOURCES) {
    for (const candidate of candidates) {
      for (const dirPath of source.paths) {
        const url = `${source.base}${dirPath}/${candidate}.svg`;
        const buffer = await fetchUrl(url, 2);

        if (buffer && buffer.length > 0) {
          const svgStr = buffer.toString('utf8', 0, Math.min(500, buffer.length));
          if ((svgStr.includes('<?xml') || svgStr.includes('<svg')) &&
              !svgStr.includes('data:image') &&
              buffer.length < 500000) {
            return {
              buffer,
              source: url,
              sourceRepo: source.name,
              filename: `${normalizedName}.svg`,
              sha: sha256(buffer)
            };
          }
        }
      }
    }
  }

  return null;
}

async function main() {
  console.log('🔍 ORYA Blockchain Icon Fetcher (Pure Node.js)\n');

  const chainsFile = path.join(ROOT, 'blockchains.txt');
  let chains = [];

  if (fs.existsSync(chainsFile)) {
    chains = fs.readFileSync(chainsFile, 'utf8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    console.log(`📋 Read ${chains.length} chains from blockchains.txt\n`);
  } else {
    console.log('❌ blockchains.txt not found\n');
    process.exit(1);
  }

  const manifest = {};
  const report = {
    total_chains: chains.length,
    fetched: 0,
    fallback: 0,
    ambiguous: [],
    timestamp: new Date().toISOString()
  };

  console.log(`🔄 Fetching icons for ${chains.length} blockchains...\n`);

  for (let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    const normalized = normalizeName(chain);
    process.stdout.write(`[${i + 1}/${chains.length}] 🔗 ${chain.padEnd(20)}`);

    const result = await tryDownloadIcon(chain, normalized);

    if (result) {
      fs.writeFileSync(path.join(SVG_OUT, result.filename), result.buffer);

      manifest[chain] = {
        canonical_name: chain,
        filename: result.filename,
        sha256: result.sha,
        source: result.source,
        source_repo: result.sourceRepo,
        png: {
          '32': `png/32x32/${normalized}.png`,
          '64': `png/64x64/${normalized}.png`,
          '128': `png/128x128/${normalized}.png`
        }
      };

      report.fetched++;
      console.log('✅');
    } else {
      const letter = chain[0].toUpperCase();
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
      const color = colors[i % colors.length];
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="16" fill="${color}20"/><circle cx="64" cy="64" r="56" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="white">${letter}</text></svg>`;

      fs.writeFileSync(path.join(SVG_OUT, `${normalized}.svg`), fallbackSvg);

      manifest[chain] = {
        canonical_name: chain,
        filename: `${normalized}.svg`,
        sha256: sha256(Buffer.from(fallbackSvg)),
        source: 'fallback-generated',
        source_repo: 'fallback',
        png: {
          '32': `png/32x32/${normalized}.png`,
          '64': `png/64x64/${normalized}.png`,
          '128': `png/128x128/${normalized}.png`
        }
      };

      report.fallback++;
      console.log('⚠️  (fallback)');
    }
  }

  fs.writeFileSync(
    path.join(OUT, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  report.summary = `Processed ${report.total_chains} chains: ${report.fetched} fetched, ${report.fallback} fallback`;
  fs.writeFileSync(
    path.join(REPORT, 'report.json'),
    JSON.stringify(report, null, 2)
  );

  const summaryText = `ORYA Blockchain Icon Fetcher Report
${'='.repeat(60)}

Summary: ${report.summary}

Statistics:
  • Total Chains: ${report.total_chains}
  • Fetched from Sources: ${report.fetched}
  • Fallback Generated: ${report.fallback}
  • Success Rate: ${((report.fetched / report.total_chains) * 100).toFixed(1)}%

Locations:
  • Icons: ${OUT}
  • Manifest: ${path.join(OUT, 'manifest.json')}
  • Reports: ${REPORT}

Next Steps:
  1. Review manifest.json
  2. Convert SVGs to PNG: npm run fetch-icons:png
  3. Integrate with React component

Generated: ${report.timestamp}
`;

  fs.writeFileSync(path.join(REPORT, 'summary.txt'), summaryText);

  console.log(`\n✅ Icon fetching complete!\n`);
  console.log(`📦 Deliverables:`);
  console.log(`   ✓ ${report.fetched} fetched SVG icons`);
  console.log(`   ✓ ${report.fallback} fallback icons`);
  console.log(`   ✓ manifest.json`);
  console.log(`   ✓ Detailed reports`);
  console.log(`\n📁 Location: ${OUT}\n`);
  console.log(`📝 Next: npm run fetch-icons:png\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});