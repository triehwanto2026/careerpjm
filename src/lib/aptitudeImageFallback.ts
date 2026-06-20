type AptitudeQuestionLike = {
  question_number: number;
  question_text?: string | null;
  category?: string | null;
};

const APTITUDE_IMAGE_QUESTIONS = new Set([3, 5, 10, 13, 17, 22, 25, 27, 30, 35, 37, 39, 41, 43, 46, 49, 51, 57, 59]);

const escapeSvg = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const encodeSvg = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const wrap = (value: string, max = 74) => {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = `${line} ${word}`.trim();
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const shape = (kind: string, x: number, y: number, size: number, fill = "none", stroke = "#111", rotate = 0) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const attrs = `stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="${fill}" transform="rotate(${rotate} ${cx} ${cy})"`;
  if (kind === "circle") return `<circle cx="${cx}" cy="${cy}" r="${size * 0.38}" ${attrs}/>`;
  if (kind === "triangle") return `<path d="M ${cx} ${y + 4} L ${x + size - 5} ${y + size - 5} L ${x + 5} ${y + size - 5} Z" ${attrs}/>`;
  if (kind === "diamond") return `<path d="M ${cx} ${y + 3} L ${x + size - 3} ${cy} L ${cx} ${y + size - 3} L ${x + 3} ${cy} Z" ${attrs}/>`;
  if (kind === "arrow") return `<path d="M ${x + 4} ${cy} H ${x + size - 8} M ${x + size - 22} ${y + 10} L ${x + size - 6} ${cy} L ${x + size - 22} ${y + size - 10}" ${attrs}/>`;
  return `<rect x="${x + 6}" y="${y + 6}" width="${size - 12}" height="${size - 12}" ${attrs}/>`;
};

const optionRow = (labels = ["A", "B", "C", "D", "E"]) => `
  ${labels.map((label, index) => {
    const x = 85 + index * 190;
    const kinds = ["circle", "square", "triangle", "diamond", "arrow"];
    return `
      <g>
        <text x="${x}" y="350" font-family="Arial" font-size="28" font-weight="700" fill="#111">(${label.toLowerCase()})</text>
        <rect x="${x + 55}" y="304" width="96" height="96" fill="#fff" stroke="#111" stroke-width="2"/>
        ${shape(kinds[index] || "square", x + 76, 324, 54, "none", "#111", index * 45)}
      </g>
    `;
  }).join("")}
`;

const specificFigure = (n: number) => {
  if (n === 3) {
    return `
      ${shape("diamond", 165, 104, 78)}<line x1="165" y1="143" x2="243" y2="143" stroke="#111" stroke-width="2"/>
      <rect x="315" y="118" width="128" height="66" fill="none" stroke="#111" stroke-width="3"/><line x1="379" y1="118" x2="379" y2="184" stroke="#111" stroke-width="3"/>
      <rect x="590" y="88" width="72" height="128" fill="none" stroke="#111" stroke-width="3"/><line x1="590" y1="152" x2="662" y2="152" stroke="#111" stroke-width="3"/>
    `;
  }
  if (n === 57) {
    return `
      ${shape("circle", 160, 92, 92)}<ellipse cx="206" cy="138" rx="13" ry="21" fill="none" stroke="#111" stroke-width="3"/>
      <rect x="350" y="90" width="86" height="110" fill="#050505"/><rect x="390" y="126" width="13" height="20" fill="#fff"/>
      <circle cx="615" cy="145" r="48" fill="#050505"/><circle cx="615" cy="145" r="14" fill="#fff"/>
    `;
  }
  if (n === 59) {
    return `
      <rect x="150" y="110" width="88" height="88" fill="none" stroke="#111" stroke-width="3"/>
      <rect x="335" y="104" width="96" height="96" fill="none" stroke="#111" stroke-width="3"/><line x1="383" y1="104" x2="383" y2="200" stroke="#111" stroke-width="3"/><line x1="335" y1="152" x2="431" y2="152" stroke="#111" stroke-width="3"/>
      ${shape("triangle", 575, 82, 122)}
    `;
  }
  if (n === 43) {
    return `
      <text x="95" y="138" font-family="Arial" font-size="52">✋</text><text x="255" y="146" font-family="Arial" font-size="64">🧤</text>
      <text x="455" y="138" font-family="Arial" font-size="58">🦶</text><text x="660" y="146" font-family="Arial" font-size="48" font-weight="700">?</text>
      <text x="86" y="350" font-family="Arial" font-size="44">🧶</text><text x="277" y="350" font-family="Arial" font-size="44">🪑</text><text x="468" y="350" font-family="Arial" font-size="44">👨</text><text x="659" y="350" font-family="Arial" font-size="44">🎩</text><text x="850" y="350" font-family="Arial" font-size="44">👞</text>
      ${["a","b","c","d","e"].map((l, i) => `<text x="${95 + i * 190}" y="410" font-family="Arial" font-size="24" font-weight="700">(${l})</text>`).join("")}
    `;
  }
  return `
    <rect x="128" y="88" width="820" height="150" rx="8" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="538" y="146" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#111">Gambar soal nomor ${n}</text>
    <text x="538" y="190" text-anchor="middle" font-family="Arial" font-size="22" fill="#475569">Fallback visual sampai gambar bucket tersedia</text>
  `;
};

export const getAptitudeFallbackImage = (question?: AptitudeQuestionLike | null, testName?: string | null) => {
  if (!question) return null;
  const n = Number(question.question_number);
  const instrumentName = String(testName || "").toUpperCase();
  const questionText = String(question.question_text || "").toUpperCase();
  const isAptitudeInstrument = instrumentName.includes("APTITUDE") || instrumentName.includes("TES BAKAT");
  const explicitlyMarkedImageQuestion = questionText.includes("[SOAL GAMBAR]");
  if (!isAptitudeInstrument && !explicitlyMarkedImageQuestion) return null;
  if (!APTITUDE_IMAGE_QUESTIONS.has(n)) return null;

  const title = question.question_text || "Mana dari gambar ini yang paling sesuai?";
  const lines = wrap(`${n}. ${title}`, 82).slice(0, 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="455" viewBox="0 0 1080 455">
      <rect width="100%" height="100%" fill="#fff"/>
      ${lines.map((line, i) => `<text x="44" y="${48 + i * 34}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="${i === 0 ? 700 : 500}" fill="#111">${escapeSvg(line)}</text>`).join("")}
      <text x="86" y="154" font-family="Arial" font-size="26" fill="#111">Jika</text>
      <text x="270" y="154" font-family="Arial" font-size="26" fill="#111">adalah</text>
      <text x="500" y="154" font-family="Arial" font-size="26" fill="#111">maka</text>
      <text x="740" y="154" font-family="Arial" font-size="26" fill="#111">adalah</text>
      ${specificFigure(n)}
      ${n === 43 ? "" : optionRow(n === 51 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"])}
    </svg>
  `;
  return encodeSvg(svg);
};
