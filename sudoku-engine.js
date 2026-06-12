// ═══════════════════════════════════════════════════════
// SUDOKU ENGINE  (shared by index.html and book-builder.html)
// ═══════════════════════════════════════════════════════
// Pure puzzle generation + SVG/PNG rendering. No DOM/page dependencies
// except the canvas used by svgToPngBlob (browser only).

const DEFAULT_CLUE_RANGES = {
  easy:    [37, 39],
  medium:  [34, 36],
  hard:    [29, 32],
  extreme: [26, 28],
  surreal: [23, 25],
};

function newGrid() { return Array.from({ length: 9 }, () => new Array(9).fill(0)); }

function isValid(grid, row, col, num) {
  for (let c = 0; c < 9; c++) if (grid[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (grid[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (grid[r][c] === num) return false;
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid, limit = 2) {
  let count = 0;
  function bt() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n; bt(); grid[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  bt();
  return count;
}

function solve(puzzle) {
  const grid = puzzle.map(r => [...r]);
  function bt() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (bt()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  return bt() ? grid : null;
}

function generatePuzzle(difficulty, ranges = DEFAULT_CLUE_RANGES) {
  const solution = newGrid();
  fillGrid(solution);
  const [minClues, maxClues] = ranges[difficulty];
  const targetClues = minClues + Math.floor(Math.random() * (maxClues - minClues + 1));
  const puzzle = solution.map(r => [...r]);
  const maxPasses = difficulty === 'surreal' ? 6 : difficulty === 'extreme' ? 3 : 2;
  for (let pass = 0; pass < maxPasses; pass++) {
    const filled = [];
    for (let i = 0; i < 81; i++)
      if (puzzle[Math.floor(i / 9)][i % 9] !== 0) filled.push(i);
    if (filled.length <= targetClues) break;
    shuffle(filled);
    for (const pos of filled) {
      if (puzzle.flat().filter(v => v !== 0).length <= targetClues) break;
      const r = Math.floor(pos / 9), c = pos % 9;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;
      if (countSolutions(puzzle.map(row => [...row]), 2) !== 1) puzzle[r][c] = backup;
    }
  }
  return { puzzle, solution };
}

// Retry until the clue count lands within [min, max]; null if unreachable.
function generatePuzzleInRange(difficulty, ranges = DEFAULT_CLUE_RANGES, maxAttempts = 40) {
  const [min, max] = ranges[difficulty];
  for (let i = 0; i < maxAttempts; i++) {
    const result = generatePuzzle(difficulty, ranges);
    const clues = result.puzzle.flat().filter(v => v !== 0).length;
    if (clues >= min && clues <= max) return result;
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// SVG RENDERING
// ═══════════════════════════════════════════════════════
// 9×9 cells of 60px = 540×540, origin (0,0), full bleed.
const GRID_SVG = `
  <rect x="0" y="0" width="540" height="540" fill="#ffffff"/>
  <line x1="0" y1="60"  x2="540" y2="60"  stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="60"  y1="0" x2="60"  y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="120" x2="540" y2="120" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="120" y1="0" x2="120" y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="240" x2="540" y2="240" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="240" y1="0" x2="240" y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="300" x2="540" y2="300" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="300" y1="0" x2="300" y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="420" x2="540" y2="420" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="420" y1="0" x2="420" y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="480" x2="540" y2="480" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="480" y1="0" x2="480" y2="540" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="0" y1="180" x2="540" y2="180" stroke="#0a0a0a" stroke-width="4.0" stroke-linecap="square"/>
  <line x1="180" y1="0" x2="180" y2="540" stroke="#0a0a0a" stroke-width="4.0" stroke-linecap="square"/>
  <line x1="0" y1="360" x2="540" y2="360" stroke="#0a0a0a" stroke-width="4.0" stroke-linecap="square"/>
  <line x1="360" y1="0" x2="360" y2="540" stroke="#0a0a0a" stroke-width="4.0" stroke-linecap="square"/>
  <rect x="2" y="2" width="536" height="536" fill="none" stroke="#0a0a0a" stroke-width="4.0" stroke-linejoin="miter"/>
`;

function cellX(col) { return 30 + col * 60; }
function cellY(row) { return 30 + row * 60; }

function buildSVGContent(puzzle, solution, showSolution) {
  let texts = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c];
      const x = cellX(c), y = cellY(r);
      if (v !== 0) {
        texts += `<text class="given" x="${x}" y="${y}">${v}</text>\n`;
      } else if (showSolution && solution) {
        texts += `<text class="solution" x="${x}" y="${y}">${solution[r][c]}</text>\n`;
      }
    }
  }
  return texts;
}

// Self-contained SVG string with embedded font (for canvas→PNG rendering).
function buildSudokuSVGString({ puzzle, solution, showSolution, fontName, fontFamily, dataUri, fontSize = 38 }) {
  const faceBlock = dataUri
    ? `@font-face { font-family: '${fontName}'; src: url('${dataUri}') format('truetype'); }`
    : '';
  const styleBlock = `<defs><style>
    ${faceBlock}
    text.given    { fill:#0a0a0a; font-family:${fontFamily}; font-size:${fontSize}px; dominant-baseline:central; text-anchor:middle; }
    text.solution { fill:#cc2020; font-family:${fontFamily}; font-size:${fontSize}px; dominant-baseline:central; text-anchor:middle; }
  </style></defs>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540" width="540" height="540">
${styleBlock}
${GRID_SVG}
${buildSVGContent(puzzle, solution, showSolution)}
</svg>`;
}

// Render an SVG string to a PNG Blob at the given pixel size (square).
function svgToPngBlob(svgString, px) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext('2d');
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, px, px);
      URL.revokeObjectURL(url);
      canvas.toBlob(pngBlob => { canvas.remove(); resolve(pngBlob); }, 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function svgToPngBytes(svgString, px) {
  const blob = await svgToPngBlob(svgString, px);
  return new Uint8Array(await blob.arrayBuffer());
}
