// Shared print utilities for Results page and RecruitmentProcess modal
export interface PrintResult {
  id: string;
  candidate_name: string;
  position?: string;
  test_name: string;
  score: number;
  total_questions: number;
  answered_questions: number;
  categories: Record<string, number>;
  status: string;
  interpretation?: string | null;
  completed_at: string;
  webcam_photo_url?: string | null;
  candidate_profile?: {
    photo_url?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface PrintAnswer {
  id: string;
  question_number: number;
  question_text: string;
  question_text_en?: string | null;
  selected_answer: string;
  selected_answer_label: string;
  correct_answer?: string | null;
  is_correct?: boolean | null;
  category?: string | null;
}

export const generatePrintHTML = (
  result: PrintResult,
  answers: PrintAnswer[] = [],
  profilePhoto?: string
): string => {
  const r = result;
  const profile = r.candidate_profile || {};
  const cats = r.categories as Record<string, number>;
  const catEntries = Object.entries(cats);
  const statusLabel = r.status === "passed" ? "LULUS" : r.status === "review" ? "REVIEW" : "TIDAK LULUS";
  const statusColor = r.status === "passed" ? "#059669" : r.status === "review" ? "#d97706" : "#dc2626";

  // Generate DISC charts and interpretation if test is DISC
  let discChartsHTML = "";
  let discInterpretation = "";
  if (r.test_name.toUpperCase().includes("DISC")) {
    const dims = ["D", "I", "S", "C"];
    const sortedCats = catEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const topCategories = sortedCats.slice(0, 2).map(([cat]) => cat);
    const dominant = topCategories[0];
    const secondary = topCategories[1];

    const interpretations: Record<string, string> = {
      'D': `Dominance (D) yang tinggi menunjukkan kandidat memiliki kemampuan leadership yang kuat, berorientasi pada hasil, dan tegas dalam pengambilan keputusan. Cocok untuk peran manajerial, entrepreneur, atau posisi yang membutuhkan kemampuan mengarahkan dan memotivasi orang lain.`,
      'I': `Influence (I) yang tinggi menunjukkan kandidat memiliki kemampuan komunikasi dan interpersonal yang baik, persuasif, dan energik. Cocok untuk peran sales, marketing, public relations, atau posisi yang membutuhkan interaksi intensif dengan orang lain.`,
      'S': `Steadiness (S) yang tinggi menunjukkan kandidat memiliki sifat stabil, sabar, dan mendukung tim. Cocok untuk peran customer service, HR, counseling, atau posisi yang membutuhkan konsistensi dan kemampuan membangun hubungan jangka panjang.`,
      'C': `Conscientiousness (C) yang tinggi menunjukkan kandidat memiliki ketelitian tinggi, analitis, dan memprioritaskan kualitas. Cocok untuk peran analyst, quality control, engineering, atau posisi yang membutuhkan akurasi dan perhatian detail.`
    };

    const jobMatches: Record<string, string> = {
      'D': "Manager, Entrepreneur, Sales Director, Director, CEO, Project Leader",
      'I': "Sales, Public Relations, Marketing, Trainer, Public Speaker, Event Coordinator",
      'S': "Counselor, Teacher, Nurse, HR, Customer Service, Therapist, Administrator",
      'C': "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer, Auditor"
    };

    discInterpretation = `
      <div class="section">
        <div class="section-title">Interpretasi Psikolog - Analisa DISC</div>
        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 14px; border-radius: 0 8px 8px 0; font-size: 10pt; line-height: 1.7; color: #422006;">
          <p style="font-weight: 700; margin-bottom: 8px;">Profil Dominan: ${dominant}${secondary ? ` & ${secondary}` : ''}</p>
          <p style="margin-bottom: 8px;">${interpretations[dominant] || ''}</p>
          ${secondary ? `<p style="margin-bottom: 8px;">Kombinasi dengan ${secondary} memberikan keseimbangan antara kekuatan ${dominant} dan stabilitas ${secondary}.</p>` : ''}
          <p style="margin-top: 12px; font-weight: 600;"><strong>Pekerjaan yang Sesuai:</strong> ${jobMatches[dominant] || 'Berbagai peran profesional'}</p>
          <p style="margin-top: 8px;"><strong>Rekomendasi:</strong> Kandidat menunjukkan potensi tinggi untuk peran yang sesuai dengan profil ${dominant}. Pertimbangkan untuk penempatan di posisi yang memanfaatkan kekuatan alami ini.</p>
        </div>
      </div>`;

    const discLabels: Record<string, string> = {
      D: "Dominance — Pengarah, tegas, berorientasi hasil",
      I: "Influence — Persuasif, ekspresif, sosial",
      S: "Steadiness — Stabil, sabar, kooperatif",
      C: "Conscientiousness — Teliti, analitis, sistematis"
    };
    const discColors: Record<string, string> = { D: "#dc2626", I: "#f59e0b", S: "#059669", C: "#2563eb" };

    const discData = dims.map(d => {
      const net = Number(cats[d] || 0);
      const m = Math.max(0, net + 10);
      const l = Math.max(0, m - net);
      const absNet = Math.abs(net);
      const level = absNet >= 12 ? "Tinggi" : absNet >= 6 ? "Sedang" : absNet >= 2 ? "Netral" : "Rendah";
      return { dim: d, m, l, net, level, absNet, desc: discLabels[d], color: discColors[d] };
    });

    const ranked = [...discData].sort((a, b) => b.absNet - a.absNet);
    const discDataWithRank = discData.map(d => ({ ...d, rank: ranked.findIndex(r => r.dim === d.dim) + 1 }));

    discChartsHTML = `
    <div class="section">
      <div class="section-title">Detail Skor per Dimensi</div>
      <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;">Dimensi</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">M</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">L</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Net</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Level</th>
            <th style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">Rank</th>
          </tr>
        </thead>
        <tbody>
          ${discDataWithRank.map(d => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: ${d.color}; font-size: 12pt;">${d.dim}</div>
                <div style="font-size: 8pt; color: #64748b; line-height: 1.2;">${d.desc}</div>
              </td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${d.m}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${d.l}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ${d.net > 0 ? '#059669' : d.net < 0 ? '#dc2626' : '#64748b'};">${d.net > 0 ? '+' : ''}${d.net}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: 600; background: ${d.level === 'Tinggi' ? '#fef3c7' : d.level === 'Sedang' ? '#dbeafe' : d.level === 'Netral' ? '#f3f4f6' : '#fee2e2'}; color: ${d.level === 'Tinggi' ? '#d97706' : d.level === 'Sedang' ? '#2563eb' : d.level === 'Netral' ? '#6b7280' : '#dc2626'};">${d.level}</span>
              </td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;">#${d.rank}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Hasil Tes — ${r.candidate_name}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 11pt; line-height: 1.5; }
    .header { border-bottom: 3px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left h1 { font-size: 18pt; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.3px; }
    .header-left p { font-size: 9pt; color: #64748b; }
    .header-right { text-align: right; }
    .header-right .doc-id { font-size: 8pt; color: #64748b; font-family: 'Courier New', monospace; }
    .header-right .doc-date { font-size: 9pt; color: #475569; margin-top: 2px; }
    .badge-status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 9pt; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-title { font-size: 11pt; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .profile-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 10pt; }
    .profile-row .label { color: #64748b; min-width: 110px; font-weight: 500; }
    .profile-row .value { color: #0f172a; font-weight: 600; flex: 1; }
    .score-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 6px; }
    .score-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 12px; text-align: center; }
    .score-card .label { font-size: 8pt; color: #0f766e; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
    .score-card .value { font-size: 22pt; font-weight: 800; color: #0f172a; line-height: 1.1; margin-top: 4px; }
    table.dim-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    table.dim-table th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 9pt; text-transform: uppercase; }
    table.dim-table td { padding: 7px 10px; border: 1px solid #e2e8f0; }
    table.dim-table tr:nth-child(even) td { background: #fafafa; }
    .interpretation { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 10pt; line-height: 1.7; color: #422006; }
    table.answer-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    table.answer-table th { background: #0f172a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 8pt; }
    table.answer-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    table.answer-table tr:nth-child(even) td { background: #f8fafc; }
    .signature-area { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; page-break-inside: avoid; }
    .sig-box { text-align: center; font-size: 9pt; }
    .sig-box .role { color: #64748b; margin-bottom: 60px; }
    .sig-box .name { border-top: 1px solid #1f2937; padding-top: 4px; font-weight: 600; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8pt; color: #94a3b8; }
    .page-break { page-break-before: always; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Laporan Hasil Tes Psikologi</h1>
      <p>Sistem Asesmen Rekrutmen — Konfidensial</p>
    </div>
    <div class="header-right">
      <span class="badge-status">${statusLabel}</span>
      <div class="doc-id">REF: ${r.id.substring(0, 8).toUpperCase()}</div>
      <div class="doc-date">${new Date(r.completed_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Profil Kandidat</div>
    <div style="display:flex; gap:18px; align-items:flex-start;">
      ${profilePhoto || profile.photo_url ? `<img src="${profilePhoto || profile.photo_url}" alt="Foto Kandidat" style="width:110px;height:140px;object-fit:cover;border:2px solid #0f766e;border-radius:6px;background:#f1f5f9;" />` : `<div style="width:110px;height:140px;border:2px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8.5pt;text-align:center;padding:8px;">Foto tidak tersedia</div>`}
      <div style="flex:1;">
        <div class="profile-grid">
          <div class="profile-row"><span class="label">Nama Lengkap</span><span class="value">${r.candidate_name}</span></div>
          <div class="profile-row"><span class="label">Posisi Dilamar</span><span class="value">${r.position || "-"}</span></div>
          <div class="profile-row"><span class="label">Email</span><span class="value">${profile.email || "-"}</span></div>
          <div class="profile-row"><span class="label">No. Telepon</span><span class="value">${profile.phone || "-"}</span></div>
          <div class="profile-row"><span class="label">Tanggal Tes</span><span class="value">${new Date(r.completed_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</span></div>
          <div class="profile-row"><span class="label">Nama Tes</span><span class="value">${r.test_name}</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ringkasan Hasil - ${r.test_name}</div>
    <div class="score-cards">
      <div class="score-card"><div class="label">Alat Tes</div><div class="value" style="font-size:13pt;margin-top:8px;">${r.test_name}</div></div>
      <div class="score-card"><div class="label">Skor Akhir</div><div class="value">${r.score}${r.test_name.includes("CFIT") ? "" : "%"}</div></div>
      <div class="score-card"><div class="label">Soal Dijawab</div><div class="value">${r.answered_questions}<span style="font-size:14pt;color:#64748b;">/${r.total_questions}</span></div></div>
    </div>
  </div>

  ${discChartsHTML}

  <div class="section">
    <div class="section-title">Profil Dimensi & Skor</div>
    <table class="dim-table">
      <thead>
        <tr>
          <th style="width:35%">Dimensi / Aspek</th>
          <th style="width:15%">Nilai</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${catEntries.map(([dim, val]) => `<tr>
          <td><strong>${dim}</strong></td>
          <td>${val}</td>
          <td>${val > 0 ? 'Positif' : 'Netral'}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  ${discInterpretation}

  ${r.interpretation ? `
  <div class="section">
    <div class="section-title">Interpretasi Psikolog</div>
    <div class="interpretation">${r.interpretation.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>
  </div>
  ` : ''}

  ${answers.length > 0 ? `
  <div class="section">
    <div class="section-title">Lembar Jawaban Kandidat (${answers.length} Soal)</div>
    <table class="answer-table">
      <thead>
        <tr>
          <th style="width:36px;">No</th>
          <th>Pertanyaan</th>
          <th style="width:150px;">Jawaban</th>
          <th style="width:100px;">Kategori</th>
        </tr>
      </thead>
      <tbody>
        ${answers.map(a => `
        <tr>
          <td style="text-align:center; font-weight:700;">${a.question_number}</td>
          <td>${a.question_text}</td>
          <td>${a.selected_answer_label || a.selected_answer || "-"}</td>
          <td>${a.category || "-"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="signature-area">
    <div class="sig-box">
      <div class="role">Kandidat</div>
      <div class="name">${r.candidate_name}</div>
    </div>
    <div class="sig-box">
      <div class="role">Psikolog Penilai</div>
      <div class="name">________________________</div>
    </div>
  </div>

  <div class="footer">
    Dokumen ini dihasilkan secara otomatis oleh PsyTest Recruitment Platform — Bersifat Konfidensial.<br/>
    Dicetak pada: ${new Date().toLocaleString("id-ID")}
  </div>
</body>
</html>`;

  return html;
};

export const printHTML = (html: string) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
};
