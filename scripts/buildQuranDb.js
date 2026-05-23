const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../assets/database/quran.db");
const db = new sqlite3.Database(dbPath);

// Helper to generate a list of words, each with its own tajweed HTML
function generateWordsWithTajweed(arabicText, rules) {
  // First, identify word boundaries (spaces)
  // We need to know which rules fall into which word.
  
  let words = [];
  let currentWordStart = 0;
  let wordIndex = 0;

  // Split text into words but keep track of indices
  const rawWords = arabicText.split(/(\s+)/); // Keep delimiters to reconstruct indices
  
  let currentIndex = 0;
  rawWords.forEach((part) => {
    if (/\s+/.test(part)) {
      currentIndex += part.length;
      return;
    }
    
    let wordText = part;
    let wordStart = currentIndex;
    let wordEnd = currentIndex + part.length;
    
    // Find rules that overlap with this word
    // We adjust rule indices to be relative to the word
    let wordRules = rules.filter(r => r.start < wordEnd && r.end > wordStart)
                         .map(r => ({
                           rule: r.rule,
                           start: Math.max(0, r.start - wordStart),
                           end: Math.min(wordText.length, r.end - wordStart)
                         }));

    // Apply tajweed to this word specifically
    let tajweedHtml = applyTajweedToWord(wordText, wordRules);
    
    words.push({
      id: wordIndex++,
      text: tajweedHtml,
      // For now, linear progress estimate if no audio timing is available
      // This will be refined in the service or by loading audio segments
    });
    
    currentIndex += part.length;
  });

  return words;
}

function applyTajweedToWord(text, rules) {
  if (!rules || rules.length === 0) return text;
  let chars = Array.from(text);
  let tags = {};
  
  rules.forEach(rule => {
    if (!tags[rule.start]) tags[rule.start] = { open: [], close: [] };
    if (!tags[rule.end]) tags[rule.end] = { open: [], close: [] };
    tags[rule.start].open.push(`<span class="tj-${rule.rule}">`);
    tags[rule.end].close.unshift(`</span>`);
  });

  let result = "";
  for (let i = 0; i <= chars.length; i++) {
    if (tags[i]) {
      tags[i].close.forEach(c => result += c);
      tags[i].open.forEach(o => result += o);
    }
    if (i < chars.length) result += chars[i];
  }
  return result;
}

db.serialize(() => {
  console.log("Creating tables...");

  db.run("DROP TABLE IF EXISTS surahs");
  db.run("DROP TABLE IF EXISTS ayahs");

  db.run(`
    CREATE TABLE surahs (
      id INTEGER PRIMARY KEY,
      name TEXT,
      english_name TEXT,
      revelation_type TEXT,
      ayah_count INTEGER
    )
  `);

  db.run(`
    CREATE TABLE ayahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_id INTEGER,
      ayah_number INTEGER,
      arabic_text TEXT,
      translation_text TEXT,
      transliteration_text TEXT,
      tajweed_text TEXT,
      words_json TEXT
    )
  `);

  console.log("Loading transliteration data...");
  const translitRaw = fs.readFileSync("./data/transliteration.json", "utf8");
  const translitData = JSON.parse(translitRaw);

  console.log("Loading surah metadata...");
  const surahMetadataRaw = fs.readFileSync("./data/quran/surah.json", "utf8");
  const surahMetadata = JSON.parse(surahMetadataRaw);

  console.log("Processing surahs...");

  for (let surahId = 1; surahId <= 114; surahId++) {
    const arabicPath = `./data/quran/surah/surah_${surahId}.json`;
    const arabicData = JSON.parse(fs.readFileSync(arabicPath, "utf8"));
    const tajweedPath = `./quranjson/source/tajweed/surah_${surahId}.json`;
    let tajweedData = { verse: {} };
    if (fs.existsSync(tajweedPath)) {
        tajweedData = JSON.parse(fs.readFileSync(tajweedPath, "utf8"));
    }
    const enPath = `./data/quran/translation/en/en_translation_${surahId}.json`;
    const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));

    const metadata = surahMetadata.find(s => parseInt(s.index) === surahId) || {
      title: `Surah ${surahId}`,
      titleAr: "",
      place: "Mecca",
      count: arabicData.count,
    };

    const arabicDisplayName = metadata.titleAr ? `سورة ${metadata.titleAr}` : `سورة ${surahId}`;
    const revelationPlace = metadata.place === "Mecca" ? "MECCAN" : "MEDINAN";

    db.run(`INSERT INTO surahs (id, name, english_name, revelation_type, ayah_count) VALUES (?,?,?,?,?)`, 
        [surahId, arabicDisplayName, metadata.title, revelationPlace, arabicData.count]);

    const verses = arabicData.verse;

    // We need to handle Bismillah consistently.
    // Surah 1: Bismillah is Ayah 1.
    // Surahs 2-114 (except 9): Bismillah is Ayah 0.
    // Surah 9: No Bismillah.

    Object.entries(verses).forEach(([key, text]) => {
      // Extract ayah number from key: "verse_1" -> 1, "verse_0" -> 0
      const ayahNum = parseInt(key.replace("verse_", ""));
      const trans = enData.verse[key] || "";
      const translit = translitData[`${surahId}:${ayahNum}`] || "";
      const rules = tajweedData.verse[key] || [];
      
      const wordList = generateWordsWithTajweed(text, rules);
      const tajweedHtml = applyTajweedToWord(text, rules);

      db.run(
        `INSERT INTO ayahs (surah_id, ayah_number, arabic_text, translation_text, transliteration_text, tajweed_text, words_json)
         VALUES (?,?,?,?,?,?,?)`,
        [surahId, ayahNum, text, trans, translit, tajweedHtml, JSON.stringify(wordList)],
      );
    });

    // Special case: If Bismillah (verse_0) is missing for Surahs 2-114 (except 9), synthesize it.
    // Check if verse_0 was present
    if (surahId !== 1 && surahId !== 9 && !verses["verse_0"]) {
      const bismillahArabic = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
      const bismillahTrans = "In the name of God, the Gracious, the Merciful.";
      const bismillahTranslit = "Bismillaahir Rahmaanir Raheem";
      
      const wordList = generateWordsWithTajweed(bismillahArabic, []);
      const tajweedHtml = bismillahArabic; // No tajweed for synthesized Bismillah for now

      db.run(
        `INSERT INTO ayahs (surah_id, ayah_number, arabic_text, translation_text, transliteration_text, tajweed_text, words_json)
         VALUES (?,?,?,?,?,?,?)`,
        [surahId, 0, bismillahArabic, bismillahTrans, bismillahTranslit, tajweedHtml, JSON.stringify(wordList)],
      );
    }
    
    if (surahId % 10 === 0) console.log(`Processed ${surahId} surahs...`);
  }

  db.run(`CREATE INDEX idx_surah_ayah ON ayahs (surah_id, ayah_number)`);
});

db.close(() => {
  console.log("Quran DB built successfully with Tajweed and Words JSON.");
});
