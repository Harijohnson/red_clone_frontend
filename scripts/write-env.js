const fs = require('fs')
const path = require('path')

// Reads BACKEND_API_URL from environment and writes to dist/env-config.js
const outDir = path.resolve(__dirname, '..', 'dist')
const outFile = path.join(outDir, 'env-config.js')

const backend = process.env.BACKEND_API_URL || process.env.VITE_BACKEND_API_URL || ''

const content = `window.__env = window.__env || {}; window.__env.BACKEND_API_URL = ${JSON.stringify(backend)};`;

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, content)
console.log('Wrote', outFile)
