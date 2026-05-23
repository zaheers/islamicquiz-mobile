const fs = require("fs");

const lines = fs
  .readFileSync("./data/transliteration/en.transliteration.txt", "utf8")
  .split("\n");

const output = {};

lines.forEach((line) => {
  if (!line.trim()) return;

  const [surah, ayah, text] = line.split("|");

  const key = `${surah}:${ayah}`;

  output[key] = text;
});

fs.writeFileSync(
  "./data/transliteration.json",
  JSON.stringify(output, null, 2),
);

console.log("Transliteration JSON created");
