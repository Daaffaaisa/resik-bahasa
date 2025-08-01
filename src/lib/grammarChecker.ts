// Basic grammar and language checking utilities for Indonesian
export interface GrammarError {
  type: 'grammar' | 'spelling' | 'misspelling' | 'informal' | 'punctuation' | 'capitalization' | 'format';
  text: string;
  suggestion: string;
  start: number;
  end: number;
}

interface DocumentMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Load KBBI database
let kbbiWords: Set<string> = new Set();

// Load KBBI words from file
const loadKBBIWords = async (): Promise<Set<string>> => {
  try {
    const response = await fetch('/kbbi_baku.txt');
    const text = await response.text();
    const words = text.split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(word => word && !word.startsWith('(') && !word.includes('-') && word.length > 1);
    return new Set(words);
  } catch (error) {
    console.error('Error loading KBBI database:', error);
    return new Set();
  }
};

// Initialize KBBI words
loadKBBIWords().then(words => {
  kbbiWords = words;
});

// Common informal words to formal words mapping
const informalToFormal: Record<string, string> = {
  'gak': 'tidak',
  'udah': 'sudah',
  'aja': 'saja',
  'sampe': 'sampai',
  'gimana': 'bagaimana',
  'kenapa': 'mengapa',
  'kayak': 'seperti',
  'emang': 'memang',
  'biar': 'agar',
  'ama': 'dengan',
  'abis': 'setelah',
  'nggak': 'tidak',
  'banget': 'sekali',
  'doang': 'saja',
  'ketemuan': 'bertemu',
  'ngomong': 'berbicara',
};

// Common spelling mistakes (misspelling/typos)
const commonMistakes: Record<string, string> = {
  'di makan': 'dimakan',
  'di baca': 'dibaca',
  'di tulis': 'ditulis',
  'di lihat': 'dilihat',
  'ke mana': 'kemana',
  'ke sana': 'kesana',
  'ke mari': 'kemari',
  'apotik': 'apotek',
  'sistim': 'sistem',
  'analisa': 'analisis',
  'praktek': 'praktik',
  'resiko': 'risiko',
  'aktifitas': 'aktivitas',
  'effektif': 'efektif',
  'standart': 'standar',
};

// Common typos/misspelling (salah ketik)
const commonTypos: Record<string, string> = {
  'sayah': 'saya',
  'sayaa': 'saya',
  'kitaa': 'kita',
  'kitaaa': 'kita',
  'kamii': 'kami',
  'kamiiii': 'kami',
  'kalinn': 'kalian',
  'merekaaa': 'mereka',
  'adaa': 'ada',
  'adaaa': 'ada',
  'tidaak': 'tidak',
  'tidaaak': 'tidak',
  'sudahh': 'sudah',
  'sudahhhh': 'sudah',
  'bisaa': 'bisa',
  'bisaaa': 'bisa',
  'mauu': 'mau',
  'mauuu': 'mau',
  'baikk': 'baik',
  'baikkkk': 'baik',
  'benarr': 'benar',
  'benarrrr': 'benar',
  'salahh': 'salah',
  'salahhhh': 'salah',
  'makann': 'makan',
  'makannn': 'makan',
  'minumm': 'minum',
  'minummm': 'minum',
  'iyyah': 'iya',
  'iyyaaa': 'iya',
  'ogahh': 'ogah',
  'ogahhhh': 'ogah',
};

// Proper nouns that should be capitalized
const properNouns = [
  'indonesia', 'jakarta', 'surabaya', 'bandung', 'medan', 'semarang',
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'allah', 'tuhan', 'islam', 'kristen', 'hindu', 'buddha',
];

const checkText = (text: string): GrammarError[] => {
  const errors: GrammarError[] = [];
  const words = text.split(/(\s+|[.,!?;:])/);
  let position = 0;

  // Check each word/token
  words.forEach((word, index) => {
    const cleanWord = word.toLowerCase().trim();
    const originalWord = word.trim();
    
    if (!cleanWord || /^[.,!?;:\s]+$/.test(word)) {
      position += word.length;
      return;
    }

    // Check typos/misspelling first (highest priority)
    if (commonTypos[cleanWord]) {
      errors.push({
        type: 'misspelling',
        text: originalWord,
        suggestion: `Kemungkinan salah ketik. Gunakan "${commonTypos[cleanWord]}" instead of "${originalWord}"`,
        start: position,
        end: position + word.length,
      });
    }
    // Check informal words (kata tidak baku)
    else if (informalToFormal[cleanWord]) {
      errors.push({
        type: 'informal',
        text: originalWord,
        suggestion: `Gunakan kata baku "${informalToFormal[cleanWord]}" instead of "${originalWord}"`,
        start: position,
        end: position + word.length,
      });
    }
    // Check if word exists in KBBI (for remaining words)
    else if (cleanWord.length > 2 && !properNouns.includes(cleanWord)) {
      if (kbbiWords.size > 0 && !kbbiWords.has(cleanWord)) {
        // Only flag as error if it's not a proper noun, number, or punctuation
        if (!/^[\d\-.,!?;:()]+$/.test(originalWord) && !/^[A-Z]/.test(originalWord)) {
          errors.push({
            type: 'spelling',
            text: originalWord,
            suggestion: `Kata "${originalWord}" tidak ditemukan dalam KBBI. Periksa ejaan kata ini.`,
            start: position,
            end: position + word.length,
          });
        }
      }
    }

    // Check common spelling mistakes (separate check)
    const lowerText = text.toLowerCase();
    Object.entries(commonMistakes).forEach(([mistake, correct]) => {
      const mistakeIndex = lowerText.indexOf(mistake.toLowerCase(), position);
      if (mistakeIndex !== -1 && mistakeIndex < position + word.length) {
        errors.push({
          type: 'misspelling',
          text: mistake,
          suggestion: `Perbaiki menjadi "${correct}"`,
          start: mistakeIndex,
          end: mistakeIndex + mistake.length,
        });
      }
    });

    // Check capitalization for proper nouns
    if (properNouns.includes(cleanWord) && originalWord === cleanWord) {
      errors.push({
        type: 'capitalization',
        text: originalWord,
        suggestion: `Huruf kapital diperlukan: "${originalWord.charAt(0).toUpperCase() + originalWord.slice(1)}"`,
        start: position,
        end: position + word.length,
      });
    }

    position += word.length;
  });

  // Check punctuation errors
  const punctuationErrors = checkPunctuation(text);
  errors.push(...punctuationErrors);

  // Check sentence capitalization
  const capitalizationErrors = checkSentenceCapitalization(text);
  errors.push(...capitalizationErrors);

  // Remove duplicates and sort by position
  const uniqueErrors = errors.filter((error, index, self) => 
    index === self.findIndex(e => e.start === error.start && e.end === error.end)
  );

  return uniqueErrors.sort((a, b) => a.start - b.start);
};

const checkPunctuation = (text: string): GrammarError[] => {
  const errors: GrammarError[] = [];
  
  // Check for double punctuation
  const doublePunctuationRegex = /([.!?,:;])\1+/g;
  let match;
  while ((match = doublePunctuationRegex.exec(text)) !== null) {
    errors.push({
      type: 'punctuation',
      text: match[0],
      suggestion: `Gunakan satu tanda baca "${match[1]}" saja`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Check for multiple spaces
  const multipleSpacesRegex = /\s{2,}/g;
  while ((match = multipleSpacesRegex.exec(text)) !== null) {
    errors.push({
      type: 'punctuation',
      text: match[0],
      suggestion: 'Gunakan satu spasi saja',
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Check for space before punctuation
  const spaceBeforePunctuationRegex = /\s+([.!?,:;])/g;
  while ((match = spaceBeforePunctuationRegex.exec(text)) !== null) {
    errors.push({
      type: 'punctuation',
      text: match[0],
      suggestion: `Hapus spasi sebelum "${match[1]}"`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return errors;
};

const checkSentenceCapitalization = (text: string): GrammarError[] => {
  const errors: GrammarError[] = [];
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/);
  let position = 0;
  
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0) {
      const firstChar = trimmed.charAt(0);
      if (firstChar !== firstChar.toUpperCase() && /[a-zA-Z]/.test(firstChar)) {
        const sentenceStart = text.indexOf(trimmed, position);
        if (sentenceStart !== -1) {
          errors.push({
            type: 'capitalization',
            text: firstChar,
            suggestion: `Gunakan huruf kapital di awal kalimat: "${firstChar.toUpperCase()}"`,
            start: sentenceStart,
            end: sentenceStart + 1,
          });
        }
      }
    }
    position += sentence.length + 1; // +1 for the punctuation
  });

  return errors;
};

// Check document margins
export const checkMargins = (margins?: DocumentMargins): GrammarError[] => {
  const errors: GrammarError[] = [];
  
  if (!margins) return errors;
  
  // Standard margins: top 3cm, others 2.5cm
  const standardMargins = { top: 3.0, bottom: 2.5, left: 2.5, right: 2.5 };
  
  if (Math.abs(margins.top - standardMargins.top) > 0.1) {
    errors.push({
      type: 'format',
      text: 'Margin Atas',
      suggestion: `Margin atas harus 3.0 cm (saat ini ${margins.top} cm). Atur margin atas ke 3.0 cm.`,
      start: 0,
      end: 0,
    });
  }
  
  if (Math.abs(margins.bottom - standardMargins.bottom) > 0.1) {
    errors.push({
      type: 'format',
      text: 'Margin Bawah',
      suggestion: `Margin bawah harus 2.5 cm (saat ini ${margins.bottom} cm). Atur margin bawah ke 2.5 cm.`,
      start: 0,
      end: 0,
    });
  }
  
  if (Math.abs(margins.left - standardMargins.left) > 0.1) {
    errors.push({
      type: 'format',
      text: 'Margin Kiri',
      suggestion: `Margin kiri harus 2.5 cm (saat ini ${margins.left} cm). Atur margin kiri ke 2.5 cm.`,
      start: 0,
      end: 0,
    });
  }
  
  if (Math.abs(margins.right - standardMargins.right) > 0.1) {
    errors.push({
      type: 'format',
      text: 'Margin Kanan',
      suggestion: `Margin kanan harus 2.5 cm (saat ini ${margins.right} cm). Atur margin kanan ke 2.5 cm.`,
      start: 0,
      end: 0,
    });
  }
  
  return errors;
};

export const checkGrammar = (text: string, margins?: DocumentMargins): GrammarError[] => {
  const textErrors = checkText(text);
  const marginErrors = checkMargins(margins);
  
  return [...textErrors, ...marginErrors];
};