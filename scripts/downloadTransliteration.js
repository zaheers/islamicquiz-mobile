const fs = require("fs");
const axios = require("axios");

const output = {};

async function run() {
  console.log("Downloading transliteration dataset...");

  let page = 1;
  const perPage = 50;

  while (true) {
    const url = `https://api.quran.com/api/v4/verses?language=en&words=true&word_fields=transliteration&per_page=${perPage}&page=${page}`;

    const res = await axios.get(url);

    const verses = res.data.verses;

    if (!verses || verses.length === 0) break;

    verses.forEach((v) => {
      const key = `${v.surah_id}:${v.verse_number}`;

      const transliteration = v.words
        .map((w) => w.transliteration?.text || "")
        .join(" ");

      output[key] = transliteration;
    });

    console.log("Downloaded page", page);

    page++;
  }

  fs.writeFileSync(
    "./data/transliteration.json",
    JSON.stringify(output, null, 2),
  );

  console.log("Transliteration dataset saved");
}

run();
