import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Eye, EyeOff, Save, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CandidateSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Page access settings
  const [pageAccess, setPageAccess] = useState({
    jobs: true,
    profile: true,
    testResults: true,
    applications: true,
  });

  // Activation settings
  const [activationSettings, setActivationSettings] = useState({
    requireEmailVerification: true,
    autoApprove: false,
    activationCodeRequired: false,
  });

  const handleSave = () => {
    setLoading(true);
    // TODO: Implement save logic to database
    setTimeout(() => {
      setLoading(false);
      toast({ title: "✅ Berhasil", description: "Pengaturan kandidat telah disimpan." });
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kandidat</h1>
          <p className="text-muted-foreground">Kelola akses halaman, aktivasi, dan password untuk kandidat</p>
        </div>

        <Tabs defaultValue="access" className="space-y-4">
          <TabsList>
            <TabsTrigger value="access">Akses Halaman</TabsTrigger>
            <TabsTrigger value="activation">Aktivasi & Password</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Akses Halaman Kandidat
                </CardTitle>
                <CardDescription>
                  Atur halaman mana yang dapat diakses oleh kandidat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label htmlFor="jobs">Halaman Lowongan</Label>
                    <p className="text-sm text-muted-foreground">Kandidat dapat melihat dan melamar lowongan</p>
                  </div>
                  <Switch
                    id="jobs"
                    checked={pageAccess.jobs}
                    onCheckedChange={(checked) => setPageAccess({ ...pageAccess, jobs: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label htmlFor="profile">Halaman Profil</Label>
                    <p className="text-sm text-muted-foreground">Kandidat dapat mengedit profil mereka</p>
                  </div>
                  <Switch
                    id="profile"
                    checked={pageAccess.profile}
                    onCheckedChange={(checked) => setPageAccess({ ...pageAccess, profile: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label htmlFor="testResults">Hasil Tes</Label>
                    <p className="text-sm text-muted-foreground">Kandidat dapat melihat hasil tes mereka</p>
                  </div>
                  <Switch
                    id="testResults"
                    checked={pageAccess.testResults}
                    onCheckedChange={(checked) => setPageAccess({ ...pageAccess, testResults: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label htmlFor="applications">Riwayat Lamaran</Label>
                    <p className="text-sm text-muted-foreground">Kandidat dapat melihat riwayat lamaran</p>
                  </div>
                  <Switch
                    id="applications"
                    checked={pageAccess.applications}
                    onCheckedChange={(checked) => setPageAccess({ ...pageAccess, applications: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Pengaturan Aktivasi
                </CardTitle>
                <CardDescription>
                  Atur kebijakan aktivasi dan password untuk kandidat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label htmlFor="emailVerification">Verifikasi Email Wajib</Label>
                    <p className="text-sm text-muted-foreground">Kandidat harus verifikasi email sebelum login</p>
                  </div>
                  <Switch
                    id="emailVerification"
                    checked={activationSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setActivationSettings({ ...activationSettings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label htmlFor="autoApprove">Otomatis Approve</Label>
                    <p className="text-sm text-muted-foreground">Kandidat otomatis aktif tanpa persetujuan admin</p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={activationSettings.autoApprove}
                    onCheckedChange={(checked) => setActivationSettings({ ...activationSettings, autoApprove: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label htmlFor="activationCode">Kode Aktivasi Wajib</Label>
                    <p className="text-sm text-muted-foreground">Kandidat harus memasukkan kode aktivasi</p>
                  </div>
                  <Switch
                    id="activationCode"
                    checked={activationSettings.activationCodeRequired}
                    onCheckedChange={(checked) => setActivationSettings({ ...activationSettings, activationCodeRequired: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Reset Password Kandidat
                </CardTitle>
                <CardDescription>
                  Reset password kandidat secara massal atau individual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Email Kandidat</Label>
                  <Input id="candidateEmail" type="email" placeholder="nama@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input id="newPassword" type="password" placeholder="••••••••" />
                </div>
                <Button onClick={() => toast({ title: "✅ Berhasil", description: "Password kandidat telah direset." })}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CandidateSettings;
