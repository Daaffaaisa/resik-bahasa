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
  'sayah': 'saya',
};

// Common suffixes that make valid Indonesian words
const validSuffixes = ['ku', 'mu', 'nya', 'lah', 'kah', 'tah', 'an', 'kan', 'i', 'in'];

// Check if a word might be a valid Indonesian word with suffix
const isValidWithSuffix = (word: string): boolean => {
  if (kbbiWords.size === 0) return false;
  
  const wordLower = word.toLowerCase();
  
  // Check if the word itself is in KBBI
  if (kbbiWords.has(wordLower)) return true;
  
  // Check if removing common suffixes results in a valid word
  for (const suffix of validSuffixes) {
    if (wordLower.endsWith(suffix) && wordLower.length > suffix.length + 2) {
      const rootWord = wordLower.slice(0, -suffix.length);
      if (kbbiWords.has(rootWord)) {
        return true;
      }
    }
  }
  
  return false;
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

// Proper nouns that should be capitalized
const properNouns = [
  'indonesia', 'jakarta', 'surabaya', 'bandung', 'medan', 'semarang',
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'allah', 'tuhan', 'islam', 'kristen', 'hindu', 'buddha',
];

// Calculate Levenshtein distance between two strings
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Find closest match in KBBI using fuzzy matching (more conservative)
const findClosestMatch = (word: string): string[] => {
  if (kbbiWords.size === 0) return [];
  
  const wordLower = word.toLowerCase();
  const matches: { word: string; distance: number }[] = [];
  
  // Only check words with similar length to avoid performance issues
  for (const kbbiWord of kbbiWords) {
    // Skip if length difference is too large
    if (Math.abs(kbbiWord.length - wordLower.length) > 2) continue;
    
    const distance = levenshteinDistance(wordLower, kbbiWord);
    
    // More conservative: only distance 1 for short words, max 2 for longer words
    // and only if the words share some common characters
    const maxDistance = wordLower.length <= 4 ? 1 : 2;
    
    if (distance <= maxDistance && distance > 0) {
      // Additional check: ensure some character similarity
      const commonChars = [...wordLower].filter(char => kbbiWord.includes(char)).length;
      const similarityRatio = commonChars / Math.max(wordLower.length, kbbiWord.length);
      
      if (similarityRatio >= 0.5) { // At least 50% character similarity
        matches.push({ word: kbbiWord, distance });
      }
    }
  }
  
  // Return top 2 closest matches, sorted by distance
  return matches
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2)
    .map(match => match.word);
};

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

    // Skip if it's a number, punctuation, or proper noun starting with capital
    if (!/^[\d\-.,!?;:()]+$/.test(originalWord) && cleanWord.length > 1) {
      
      // 1. Check informal words first (kata tidak baku) - highest priority
      if (informalToFormal[cleanWord]) {
        errors.push({
          type: 'informal',
          text: originalWord,
          suggestion: `Gunakan kata baku "${informalToFormal[cleanWord]}" sebagai gantinya`,
          start: position,
          end: position + word.length,
        });
      }
      // 2. Check if word is valid (in KBBI or valid with suffix)
      else if (kbbiWords.size > 0 && !isValidWithSuffix(cleanWord) && !properNouns.includes(cleanWord)) {
        // 3. Try to find closest matches using fuzzy matching
        const closestMatches = findClosestMatch(cleanWord);
        
        if (closestMatches.length > 0) {
          // It's likely a typo/misspelling
          const suggestion = closestMatches.length === 1 
            ? `Kemungkinan salah ketik. Maksud Anda "${closestMatches[0]}"?`
            : `Kemungkinan salah ketik. Maksud Anda "${closestMatches[0]}" atau "${closestMatches[1]}"?`;
            
          errors.push({
            type: 'misspelling',
            text: originalWord,
            suggestion: suggestion,
            start: position,
            end: position + word.length,
          });
        } else {
          // Word not found and no close match - only flag if it's not a proper noun or technical term
          if (!/^[A-Z]/.test(originalWord) && !/\d/.test(originalWord)) {
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
    }

    // Check common spelling mistakes (separate check for specific patterns)
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