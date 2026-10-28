const fs = require('fs');
const path = require('path');

// Detects import statements that appear after real code statements in a file.
// Such imports compile to require() calls placed after their usage -> TDZ crash at runtime.
function scanFile(full) {
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  let inImport = false;
  let codeStarted = false;
  const late = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!inImport && /^import\s/.test(t)) {
      if (codeStarted) late.push(i + 1);
      if (!/;\s*$/.test(t)) inImport = true; // multi-line import continues on next lines
      continue;
    }
    if (inImport) {
      if (/;\s*$/.test(t)) inImport = false;
      continue;
    }
    if (
      t !== '' &&
      !t.startsWith('//') &&
      !t.startsWith('/*') &&
      !t.startsWith('*') &&
      !t.startsWith('*/')
    ) {
      codeStarted = true;
    }
  }
  return late;
}

function scan(dir, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full, results);
    } else if (entry.name.endsWith('.ts')) {
      const late = scanFile(full);
      if (late.length) results.push({ file: full, lines: late });
    }
  }
}

const results = [];
scan(path.join(__dirname, 'src'), results);
scan(path.join(__dirname, 'test'), results);
if (results.length === 0) {
  console.log('No late imports found.');
} else {
  for (const r of results) console.log(r.file, '-> import at lines:', r.lines.join(', '));
}
