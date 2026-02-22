/**
 * Kelime avı grid oluşturma ve kelime konumlarını hesaplama
 */

const TURKISH_LETTERS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const TURKISH_LOWER = "abcçdefgğhıijklmnoöprsştuüvyz";

function randomLetter() {
  return TURKISH_LETTERS[Math.floor(Math.random() * TURKISH_LETTERS.length)];
}

function toUpperTR(s) {
  const map = { "i": "İ", "ı": "I" };
  return (s || "").toUpperCase().replace(/[iı]/g, ch => map[ch] || ch);
}

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // yatay sağ
  { dr: 0, dc: -1 },  // yatay sol
  { dr: 1, dc: 0 },   // dikey aşağı
  { dr: -1, dc: 0 },  // dikey yukarı
  { dr: 1, dc: 1 },   // çapraz aşağı-sağ
  { dr: -1, dc: -1 }, // çapraz yukarı-sol
  { dr: 1, dc: -1 },  // çapraz aşağı-sol
  { dr: -1, dc: 1 },  // çapraz yukarı-sağ
];

/**
 * Kelimeyi grid'e yerleştirilebilir mi kontrol et
 */
function canPlaceWord(grid, word, row, col, dr, dc) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    const ch = grid[r][c];
    if (ch !== null && ch !== word[i]) return false;
  }
  return true;
}

/**
 * Kelimeyi grid'e yaz
 */
function placeWord(grid, word, row, col, dr, dc) {
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    grid[r][c] = word[i];
    positions.push({ r, c });
  }
  return positions;
}

/**
 * Kelime havuzundan grid oluştur
 * @param {string[]} words - Büyük harf, Türkçe karakterler düzgün
 * @param {number} minSize - Minimum grid boyutu
 * @returns { { grid: string[][], wordPositions: { [word]: { r, c }[] } } }
 */
function generateWordSearchGrid(words, minSize = 12) {
  const normalized = words
    .map(w => toUpperTR((w || "").trim()).replace(/[^A-ZÇĞİÖŞÜI]/g, ""))
    .filter(w => w.length >= 2);

  if (normalized.length === 0) {
    const size = Math.max(minSize, 8);
    const grid = Array(size).fill(null).map(() => Array(size).fill(null).map(() => randomLetter()));
    return { grid, wordPositions: {} };
  }

  const maxLen = Math.max(...normalized.map(w => w.length));
  const size = Math.max(minSize, maxLen + 2, Math.ceil(Math.sqrt(normalized.length * 8)));

  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const wordPositions = {};

  const shuffled = [...normalized].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
    let placed = false;
    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      const dr = dirs[attempt % dirs.length].dr;
      const dc = dirs[attempt % dirs.length].dc;
      const maxR = dr >= 0 ? size - word.length : word.length - 1;
      const maxC = dc >= 0 ? size - word.length : word.length - 1;
      const startR = dr >= 0 ? Math.floor(Math.random() * (size - word.length + 1)) : Math.floor(Math.random() * size);
      const startC = dc >= 0 ? Math.floor(Math.random() * (size - word.length + 1)) : Math.floor(Math.random() * size);
      let r = Math.max(0, Math.min(startR, size - word.length));
      let c = Math.max(0, Math.min(startC, size - word.length));
      if (canPlaceWord(grid, word, r, c, dr, dc)) {
        const positions = placeWord(grid, word, r, c, dr, dc);
        wordPositions[word] = positions;
        placed = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) grid[r][c] = randomLetter();
    }
  }

  return { grid, wordPositions };
}

/**
 * Seçilen hücrelerin sırası bir kelimeye karşılık geliyor mu?
 */
function getWordFromSelection(wordPositions, selectedCells) {
  if (!selectedCells || selectedCells.length < 2) return null;
  const key = selectedCells.map(c => `${c.r},${c.c}`).sort().join("|");
  for (const [word, positions] of Object.entries(wordPositions)) {
    const posKey = positions.map(p => `${p.r},${p.c}`).sort().join("|");
    if (posKey === key) return word;
    const revKey = [...positions].reverse().map(p => `${p.r},${p.c}`).sort().join("|");
    if (revKey === key) return word;
  }
  return null;
}

/**
 * İki hücre listesi aynı kelimeyi mi (sıra fark etmez)
 */
function isSameWord(pos1, pos2) {
  if (!pos1 || !pos2 || pos1.length !== pos2.length) return false;
  const s1 = pos1.map(p => `${p.r},${p.c}`).sort().join(",");
  const s2 = pos2.map(p => `${p.r},${p.c}`).sort().join(",");
  return s1 === s2;
}
