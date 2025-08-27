#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Minimal Document Loader
 * Usage: cmd /c node .windsurf\\tools\\docs-loader.js <document-name>
 *        cmd /c node .windsurf\\tools\\docs-loader.js --list
 * Outputs document content to stdout for AI ingestion
 */

function loadDocument(docName) {
  if (docName === '--help' || docName === '-h') {
    console.log('Usage: cmd /c node .windsurf\\tools\\docs-loader.js <document-name>')
    console.log('       cmd /c node .windsurf\\tools\\docs-loader.js --list')
    console.log('Example: cmd /c node .windsurf\\tools\\docs-loader.js code-critical')
    process.exit(0)
  }

  if (docName === '--list') {
    const guidesDir = path.join(__dirname, '..', 'guides')
    try {
      const files = fs.existsSync(guidesDir) ? fs.readdirSync(guidesDir) : []
      const names = files
        .filter((f) => f.toLowerCase().endsWith('.md'))
        .map((f) => path.basename(f, '.md'))
        .sort()
      const pattern = path.join('.windsurf', 'guides', '<name>.md')
      console.log(`Guides path pattern: ${pattern}`)
      if (names.length === 0) {
        console.log('(no guides found)')
      } else {
        for (const name of names) console.log(name)
      }
      process.exit(0)
    } catch (err) {
      console.error(`Error listing guides in ${guidesDir}: ${err.message}`)
      process.exit(1)
    }
  }

  if (!docName) {
    console.error('Usage: cmd /c node .windsurf\\tools\\docs-loader.js <document-name>')
    console.error('Example: cmd /c node .windsurf\\tools\\docs-loader.js code-critical')
    process.exit(1)
  }

  // Map document name to file path
  const windsDir = path.join(__dirname, '..')
  const possiblePaths = [
    path.join(windsDir, 'guides', `${docName}.md`)
  ]

  // Find the document file
  let filePath = null
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      filePath = testPath
      break
    }
  }

  if (!filePath) {
    console.error(`Error: Document '${docName}' not found in any .windsurf directory`)
    process.exit(1)
  }

  try {
    // Read and output document content
    const content = fs.readFileSync(filePath, 'utf8')
    process.stdout.write(content)
  } catch (error) {
    console.error(`Error reading document '${docName}': ${error.message}`)
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  const docName = process.argv[2]
  loadDocument(docName)
}

module.exports = { loadDocument }
