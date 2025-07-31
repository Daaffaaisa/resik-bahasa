// Basic grammar and language checking utilities for Indonesian
export interface GrammarError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'capitalization';
  text: string;
  suggestion: string;
  start: number;
  end: number;
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

// Common spelling mistakes
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

// Proper nouns that should be capitalized
const properNouns = [
  'indonesia', 'jakarta', 'surabaya', 'bandung', 'medan', 'semarang',
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'allah', 'tuhan', 'islam', 'kristen', 'hindu', 'buddha',
];

export const checkGrammar = (text: string): GrammarError[] => {
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

    // Check informal words
    if (informalToFormal[cleanWord]) {
      errors.push({
        type: 'spelling',
        text: originalWord,
        suggestion: `Gunakan kata baku "${informalToFormal[cleanWord]}" instead of "${originalWord}"`,
        start: position,
        end: position + word.length,
      });
    }

    // Check if word exists in KBBI (for non-common words only)
    if (cleanWord.length > 2 && !informalToFormal[cleanWord] && !properNouns.includes(cleanWord)) {
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

    // Check common spelling mistakes
    const lowerText = text.toLowerCase();
    Object.entries(commonMistakes).forEach(([mistake, correct]) => {
      const mistakeIndex = lowerText.indexOf(mistake.toLowerCase(), position);
      if (mistakeIndex !== -1 && mistakeIndex < position + word.length) {
        errors.push({
          type: 'spelling',
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