const fs = require("fs");

async function main() {
  const source = fs.readFileSync("scripts/update_papikostik_questions.cjs", "utf8");
  const optionMatches = [...source.matchAll(/\{\s*label:\s*["']([ab])["'],\s*text:\s*["']([^"']+)["'],\s*dimension:\s*["']([A-Z])["']\s*\}/g)]
    .map((match) => ({ label: match[1], text: match[2], current: match[3] }));
  if (optionMatches.length !== 180) throw new Error(`Expected 180 local options, got ${optionMatches.length}`);

  const response = await fetch("https://raw.githubusercontent.com/cahyadsn/papi/master/db/papi.sql");
  if (!response.ok) throw new Error(`Reference fetch failed: ${response.status}`);
  const sql = await response.text();
  const pairs = [...sql.matchAll(/\((\d+),'questions #\d+A',(\d+),'questions #\d+B',(\d+)\)/g)]
    .map((match) => ({ no: Number(match[1]), a: Number(match[2]), b: Number(match[3]) }));
  if (pairs.length !== 90) throw new Error(`Expected 90 reference pairs, got ${pairs.length}`);

  const grouped = {};
  pairs.forEach((pair, index) => {
    const options = [optionMatches[index * 2], optionMatches[index * 2 + 1]];
    [[pair.a, options[0]], [pair.b, options[1]]].forEach(([id, option]) => {
      grouped[id] ||= [];
      grouped[id].push({ no: pair.no, ...option });
    });
  });
  Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).forEach((id) => {
    console.log(`\nID ${id} (${grouped[id].length} items)`);
    grouped[id].forEach((item) => console.log(`${item.no}${item.label}. [current ${item.current}] ${item.text}`));
  });
}

main().catch((error) => { console.error(error); process.exit(1); });
