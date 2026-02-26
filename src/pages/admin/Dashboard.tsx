import { KeyRound, Users, ClipboardList, BarChart3, TrendingUp, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { initialActivationCodes, initialCandidates, initialTestInstruments, initialTestResults } from "@/data/adminStore";

const stats = [
  {
    label: "Kode Aktivasi",
    value: initialActivationCodes.length,
    sub: `${initialActivationCodes.filter((c) => !c.isUsed).length} aktif`,
    icon: KeyRound,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Kandidat",
    value: initialCandidates.length,
    sub: `${initialCandidates.filter((c) => c.status === "completed").length} selesai`,
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Alat Tes",
    value: initialTestInstruments.length,
    sub: `${initialTestInstruments.filter((t) => t.isActive).length} aktif`,
    icon: ClipboardList,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    label: "Hasil Tes",
    value: initialTestResults.length,
    sub: `${initialTestResults.filter((r) => r.status === "passed").length} lulus`,
    icon: BarChart3,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan sistem tes psikologi rekrutmen</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-5 glow-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Kandidat Terbaru
            </h3>
            <div className="mt-4 space-y-3">
              {initialCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.position}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "completed"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : c.status === "in_progress"
                        ? "bg-amber-400/10 text-amber-400"
                        : c.status === "expired"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status === "completed" ? "Selesai" : c.status === "in_progress" ? "Berlangsung" : c.status === "expired" ? "Kadaluarsa" : "Menunggu"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5 glow-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Hasil Tes Terbaru
            </h3>
            <div className="mt-4 space-y-3">
              {initialTestResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.candidateName}</p>
                    <p className="text-xs text-muted-foreground">Skor: {r.score}%</p>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
