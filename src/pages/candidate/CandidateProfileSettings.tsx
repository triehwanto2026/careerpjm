import { useEffect, useState } from "react";
import React from "react";
import { User, Lock, Mail, Bell, LogOut, Eye, EyeOff, Shield, Smartphone, Monitor, Volume2 } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function CandidateProfileSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Load profile
    const { data: profileData } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    setProfile(profileData);

    // Load notifications (mock data for now since table doesn't exist)
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "application_status",
        title: "Status Lamaran Diperbarui",
        message: "Lamaran Anda untuk posisi Software Engineer telah berpindah ke tahap screening CV.",
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: "2", 
        type: "system",
        title: "Tes Psikologi Tersedia",
        message: "Paket tes psikologi telah ditugaskan untuk Anda. Silakan selesaikan dalam 7 hari.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        read: true
      }
    ];
    setNotifications(mockNotifications);

    // Load activity logs (mock data for now since table doesn't exist)
    const mockActivityLogs: ActivityLog[] = [
      {
        id: "1",
        action: "Login",
        description: "Login berhasil dari browser Chrome",
        ip_address: "192.168.1.100",
        user_agent: "Chrome/120.0.0.0",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        action: "Profile Update",
        description: "Memperbarui profil kandidat",
        ip_address: "192.168.1.100", 
        user_agent: "Chrome/120.0.0.0",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setActivityLogs(mockActivityLogs);
  };

  useEffect(() => { load(); }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire("Error", "Semua field password harus diisi", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("Error", "Password baru dan konfirmasi tidak cocok", "error");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      Swal.fire("Error", "Gagal mengubah password: " + error.message, "error");
    } else {
      Swal.fire("Success", "Password berhasil diubah", "success");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const markNotificationAsRead = async (id: string) => {
    // Mock function - update local state
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteAllNotifications = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Hapus Semua Notifikasi",
      text: "Apakah Anda yakin ingin menghapus semua notifikasi?",
      icon: "warning",
      showCancelButton: true
    });

    if (!isConfirmed) return;

    // Mock function - clear local state
    setNotifications([]);
    Swal.fire("Success", "Semua notifikasi telah dihapus", "success");
  };

  const markAllNotificationsAsRead = async () => {
    // Mock function - update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_status': return Bell;
      case 'system': return Bell;
      case 'security': return Shield;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application_status': return 'text-blue-600';
      case 'system': return 'text-gray-600';
      case 'security': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <CandidateLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-[96rem] mx-auto">
            <h1 className="text-2xl font-bold">Pengaturan Profil</h1>
            <p className="text-sm text-muted-foreground">Kelola akun dan preferensi Anda</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-4 py-6">
          <div className="max-w-[96rem] mx-auto space-y-6">
            {/* Profile Information */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Informasi Profil
              </h2>
              
              {profile && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informasi Dasar</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <div className="p-3 bg-muted rounded-lg">
                          {profile.email}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                        <div className="p-3 bg-muted rounded-lg">
                          {profile.full_name || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                        <div className="p-3 bg-muted rounded-lg">
                          {profile.phone || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Keamanan</h3>
                    <div className="space-y-4">
                      <div>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg hover:brightness-110"
                        >
                          <Lock className="h-4 w-4" />
                          Ubah Password
                        </button>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Terakhir Login</label>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          {profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString('id-ID') : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                Notifikasi
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notifikasi Email</label>
                    <p className="text-xs text-muted-foreground">Terima notifikasi lamaran dan update sistem</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${
                      emailNotifications 
                        ? 'bg-primary border-primary' 
                        : 'bg-muted border-muted'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notifikasi Push</label>
                    <p className="text-xs text-muted-foreground">Notifikasi browser untuk update penting</p>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${
                      pushNotifications 
                        ? 'bg-primary border-primary' 
                        : 'bg-muted border-muted'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Two-Factor Authentication</label>
                    <p className="text-xs text-muted-foreground">Tambahkan keamanan ekstra</p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${
                      twoFactorEnabled 
                        ? 'bg-primary border-primary' 
                        : 'bg-muted border-muted'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6 text-primary" />
                  Notifikasi Saya
                  <span className="ml-auto text-sm text-muted-foreground">
                    {notifications.filter(n => !n.read).length} belum dibaca
                  </span>
                </h2>
                
                <div className="flex gap-2">
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    Tandai Semua Dibaca
                  </button>
                  <button
                    onClick={deleteAllNotifications}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p>Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                        notification.read 
                          ? 'bg-background border-muted' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.read 
                            ? 'bg-muted' 
                            : 'bg-blue-100'
                        }`}>
                          {React.createElement(getNotificationIcon(notification.type), {
                            className: `h-4 w-4 ${
                              notification.read ? 'text-muted-foreground' : 'text-blue-600'
                            }`
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-semibold ${
                              notification.read ? 'text-foreground' : 'text-blue-600'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Logs */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <LogOut className="h-6 w-6 text-primary" />
                Log Aktivitas
              </h2>
              
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p>Belum ada aktivitas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{log.action}</h4>
                          <p className="text-xs text-muted-foreground">{log.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">IP Address:</span>
                          <span>{log.ip_address}</span>
                        </div>
                        <div>
                          <span className="font-medium">Device:</span>
                          <span>{log.user_agent}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Ubah Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg pr-10"
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg pr-10"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg pr-10"
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="px-4 py-2 border border-border text-sm font-semibold rounded-lg hover:bg-muted"
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110"
              >
                Simpan Password
              </button>
            </div>
          </div>
        </div>
      )}
    </CandidateLayout>
  );
}
