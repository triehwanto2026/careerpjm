import React from 'react';
import { Printer, Download, X, User, MapPin, Phone, Mail, Calendar, Briefcase, GraduationCap, Award, Globe, Heart, Home, Car, CreditCard, FileText, Building2, Star, Target, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CandidateResumeData {
  // Data Pribadi
  full_name: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  birth_place: string;
  birth_date: string;
  height?: string;
  weight?: string;
  blood_type?: string;
  religion?: string;
  marital_status?: string;
  id_card_number?: string;
  vehicle_type?: string;
  photo_url?: string;
  
  // Keluarga
  family_members?: any;
  
  // Pendidikan
  education_history?: any;
  
  // Keahlian
  skills?: any;
  
  // Pengalaman Kerja
  work_experience?: any;
  
  // Additional data
  languages?: any;
  hobbies?: any;
  strengths?: string;
  expected_salary?: string;
  salary_negotiable?: boolean;
  available_start_date?: string;
  willing_to_relocate?: boolean;
  social_media?: any;
  certificates?: any;
  references?: any;
  
  // Additional fields
  current_position?: string;
  current_company?: string;
  experience_years?: string;
  education_level?: string;
  education_institution?: string;
  major?: string;
  graduation_year?: string;
  [key: string]: any;
}

interface CandidateResumePreviewProps {
  candidate: CandidateResumeData;
  onClose: () => void;
}

export default function CandidateResumePreview({ candidate, onClose }: CandidateResumePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a temporary window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Resume ${candidate.full_name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body class="bg-gray-100 p-6">
            <div class="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-8">
              ${document.getElementById('resume-content')?.innerHTML || ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Format data untuk template
  const kandidat = {
    nama: candidate.full_name || '-',
    jenisKelamin: candidate.gender || '-',
    alamat: candidate.address || '-',
    telpRumah: candidate.phone || '-',
    hp: candidate.phone || '-',
    ttl: `${candidate.birth_place || '-'}, ${candidate.birth_date || '-'}`,
    usia: calculateAge(candidate.birth_date || '') ? `${calculateAge(candidate.birth_date || '')} Tahun` : '-',
    tinggi: candidate.height || '-',
    berat: candidate.weight || '-',
    golDarah: candidate.blood_type || '-',
    agama: candidate.religion || '-',
    status: candidate.marital_status || '-',
    ktp: candidate.id_card_number || '-',
    email: candidate.email || '-',
    kendaraan: candidate.vehicle_type || '-',
  };

  const keluarga = candidate.family_members?.map(member => ({
    hubungan: member.relationship || member.hubungan || member.relation || '-',
    nama: member.name || member.nama || '-',
    pekerjaan: member.occupation || member.pekerjaan || '-',
    usia: member.age || member.usia || '-',
    pendidikan: member.education || member.pendidikan || '-',
  })) || [];

  const pendidikan = candidate.education_history?.map(edu => ({
    tingkat: edu.level || '-',
    sekolah: edu.school || '-',
    jurusan: edu.major || '-',
    sampai: edu.graduation_year || '-',
    status: edu.status || '-',
  })) || [];

  const keahlian = (() => {
    if (!candidate.skills) return [];
    if (typeof candidate.skills === 'string') {
      return candidate.skills.split(',').map(skill => ({
        skill: skill.trim(),
        level: 'Baik'
      }));
    }
    if (Array.isArray(candidate.skills)) {
      return candidate.skills.map(skill => ({
        skill: typeof skill === 'string' ? skill : skill.name || '-',
        level: typeof skill === 'string' ? 'Baik' : skill.level || 'Baik'
      }));
    }
    return [];
  })();

  const pekerjaan = candidate.work_experience?.map(work => ({
    perusahaan: work.company_name || '-',
    periode: work.period || '-',
    jabatanAwal: work.position_start || '-',
    jabatanAkhir: work.position_end || '-',
    gaji: work.salary || '-',
    alasan: work.resignation_reason || '-',
    tugas: work.duties || '-',
    prestasi: work.achievements || '-',
  })) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header with controls */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-800">Preview Resume Kandidat</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resume Content */}
        <div className="overflow-y-auto max-h-[85vh]">
          <div id="resume-content" className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-8">
              {/* Professional Header with Photo */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-2xl">
                <div className="flex items-center gap-6">
                  {/* Photo */}
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                    {candidate.photo_url ? (
                      <img 
                        src={candidate.photo_url} 
                        alt={candidate.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  
                  {/* Name and Title */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                      PERSONAL HISTORY CARD
                    </h1>
                    <p className="text-xl font-medium mb-2 text-blue-100">
                      {candidate.full_name || 'Candidate Name'}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {candidate.email || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {candidate.phone || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Pribadi */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                  Data Pribadi
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nama Lengkap" value={kandidat.nama} />
                  <Input label="Jenis Kelamin" value={kandidat.jenisKelamin} />
                  <Input label="No. HP / WA" value={kandidat.hp} />
                  <Input label="Email" value={kandidat.email} />
                  <Input label="Tempat, Tanggal Lahir" value={kandidat.ttl} />
                  <Input label="Usia" value={kandidat.usia} />
                  <Input label="Tinggi Badan" value={kandidat.tinggi} />
                  <Input label="Berat Badan" value={kandidat.berat} />
                  <Input label="Golongan Darah" value={kandidat.golDarah} />
                  <Input label="Agama" value={kandidat.agama} />
                  <Input label="Status" value={kandidat.status} />
                  <Input label="No. KTP" value={kandidat.ktp} />
                  <Input label="Kendaraan" value={kandidat.kendaraan} />
                </div>

                <div className="mt-4">
                  <label className="font-medium text-gray-700">Alamat</label>
                  <textarea
                    className="w-full border rounded-lg p-3 mt-1"
                    rows={3}
                    value={kandidat.alamat}
                    readOnly
                  />
                </div>
              </section>

              {/* Susunan Keluarga */}
              {keluarga.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">
                    Susunan Keluarga
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-gray-800 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Hubungan</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Nama Lengkap</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Usia</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Pendidikan</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Pekerjaan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keluarga.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border-2 border-gray-800 p-3 font-medium">{item.hubungan || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.nama || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.usia || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.pendidikan || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.pekerjaan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Pendidikan */}
              {pendidikan.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">
                    Riwayat Pendidikan Formal
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-gray-800 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Pendidikan</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Nama Sekolah</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Jurusan</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Tahun</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendidikan.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border-2 border-gray-800 p-3 font-medium">{item.tingkat || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.sekolah || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.jurusan || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">{item.sampai || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.status === 'Lulus' || item.status === 'Graduated' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Keahlian */}
              {keahlian.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">
                    Ketrampilan & Keahlian
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-gray-800 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border-2 border-gray-800 p-3 text-center font-bold w-16">No</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Ketrampilan</th>
                          <th className="border-2 border-gray-800 p-3 text-left font-bold">Penguasaan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keahlian.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border-2 border-gray-800 p-3 text-center font-medium">{index + 1}</td>
                            <td className="border-2 border-gray-800 p-3">{item.skill || '-'}</td>
                            <td className="border-2 border-gray-800 p-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {item.level || 'Baik'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Riwayat Pekerjaan */}
              {pekerjaan.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">
                    Riwayat Pekerjaan
                  </h2>

                  <div className="space-y-6">
                    {pekerjaan.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-xl p-5 bg-gray-50 shadow-sm"
                      >
                        <h3 className="font-bold text-lg text-gray-800 mb-3">
                          {item.perusahaan}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Periode" value={item.periode} />
                          <Input label="Gaji Terakhir" value={item.gaji} />
                          <Input label="Jabatan Awal" value={item.jabatanAwal} />
                          <Input label="Jabatan Akhir" value={item.jabatanAkhir} />
                          <Input label="Alasan Berhenti" value={item.alasan} />
                        </div>

                        <div className="mt-4">
                          <label className="font-medium">Tugas & Tanggung Jawab</label>
                          <textarea
                            className="w-full border rounded-lg p-3 mt-1"
                            rows={3}
                            value={item.tugas}
                            readOnly
                          />
                        </div>

                        <div className="mt-4">
                          <label className="font-medium">Prestasi / Pencapaian</label>
                          <textarea
                            className="w-full border rounded-lg p-3 mt-1"
                            rows={2}
                            value={item.prestasi}
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Penutup */}
              <section className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                  Pernyataan
                </h2>

                <p className="text-gray-700 leading-relaxed">
                  Dengan ini saya menyatakan bahwa seluruh data yang saya berikan
                  adalah benar dan dapat dipertanggungjawabkan.
                </p>

                <div className="mt-10 text-right">
                  <p>Surabaya, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <div className="h-20"></div>
                  <p className="font-semibold">( {kandidat.nama} )</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full border border-gray-300 rounded-lg p-3 bg-white"
      />
    </div>
  );
}
