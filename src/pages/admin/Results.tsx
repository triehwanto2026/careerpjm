import { useState } from "react";
import { Search, Eye, Download, BarChart3 } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialTestResults, type TestResult } from "@/data/adminStore";

const Results = () => {
  const [results] = useState<TestResult[]>(initialTestResults);
  const [search, setSearch] = useState("");

  const filtered = results.filter(
    (r) =>
      r.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (r: TestResult) => {
    const categoriesHtml = Object.entries(r.categories)
      .map(([cat, val]) => `<p style="display:flex;justify-content:space-between"><span>${cat}</span><b>${val}</b></p>`)
      .join("");

    Swal.fire({
      title: r.candidateName,
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <p><b>Posisi:</b> ${r.position}</p>
          <p><b>Skor:</b> ${r.score}%</p>
          <p><b>Soal Dijawab:</b> ${r.answeredQuestions}/${r.totalQuestions}</p>
          <p><b>Tanggal:</b> ${r.completedAt}</p>
          <hr style="border-color:hsl(220,14%,18%);margin:8px 0">
          <p style="font-weight:600;margin-bottom:4px">Hasil per Kategori:</p>
          ${categoriesHtml}
        </div>
      `,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(174, 72%, 46%)",
      width: 500,
    });
  };

  const handleExport = () => {
    const csv = [
      "Nama,Posisi,Skor,Soal Dijawab,Total Soal,Tanggal,Status",
      ...results.map(
        (r) => `${r.candidateName},${r.position},${r.score},${r.answeredQuestions},${r.totalQuestions},${r.completedAt},${r.status}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hasil-tes-psikologi.csv";
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "Export Berhasil",
      text: "File CSV telah diunduh.",
      timer: 1500,
      showConfirmButton: false,
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Hasil Tes</h1>
            <p className="text-sm text-muted-foreground">Lihat dan kelola hasil tes kandidat</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau posisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Result cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="glass rounded-xl p-5 glow-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{r.candidateName}</h3>
                  <p className="text-xs text-muted-foreground">{r.position}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "passed"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : r.status === "review"
                      ? "bg-amber-400/10 text-amber-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {r.status === "passed" ? "Lulus" : r.status === "review" ? "Review" : "Gagal"}
                </span>
              </div>

              {/* Score bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Skor</span>
                  <span className="font-semibold text-foreground">{r.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      r.score >= 75 ? "bg-emerald-400" : r.score >= 50 ? "bg-amber-400" : "bg-destructive"
                    }`}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{r.answeredQuestions}/{r.totalQuestions} dijawab</span>
                <span>{r.completedAt}</span>
              </div>

              <div className="flex items-center gap-1 border-t border-border pt-3">
                <button
                  onClick={() => handleView(r)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Detail
                </button>
                <button
                  onClick={() => handleView(r)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analisis
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Tidak ada data ditemukan
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Results;
