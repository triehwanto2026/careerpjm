import React from 'react';
import { Printer, Download, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StandardResumeProps {
  candidate: any;
  onClose: () => void;
}

export default function StandardResume({ candidate, onClose }: StandardResumeProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Formulir Data Pribadi Kandidat - ${candidate.full_name || 'Candidate'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
              .container-shadow {
                box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.3), 0 2px 4px -1px rgba(30, 58, 138, 0.2);
              }
              .table-border {
                border: 1px solid #1e3a8a;
              }
              .table-cell {
                border: 1px solid #1e3a8a;
                padding: 8px;
              }
            </style>
          </head>
          <body class="bg-gray-50 p-4">
            <div class="max-w-4xl mx-auto">
              ${document.getElementById('standard-resume-content')?.innerHTML || ''}
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

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }
      return age;
    } catch {
      return '-';
    }
  };

  // Parse family members data
  const parseFamilyMembers = (members: any) => {
    if (!members || !Array.isArray(members)) return [];
    return members.map(member => ({
      relationship: member.relationship || member.hubungan || '-',
      name: member.name || member.nama || '-',
      gender: member.gender || member.jk || '-',
      age: member.age || member.usia || '-',
      education: member.education || member.pendidikan || '-',
      occupation: member.occupation || member.pekerjaan || '-',
      company: member.company || member.perusahaan || '-'
    }));
  };

  // Parse education history
  const parseEducation = (education: any) => {
    if (!education || !Array.isArray(education)) return [];
    return education.map(edu => ({
      level: edu.level || edu.tingkat || '-',
      school: edu.school || edu.sekolah || '-',
      city: edu.city || edu.kota || '-',
      major: edu.major || edu.jurusan || '-',
      from: edu.from || edu.dari || '-',
      to: edu.to || edu.sampai || '-',
      status: edu.status || '-'
    }));
  };

  // Parse work experience
  const parseWorkExperience = (work: any) => {
    if (!work || !Array.isArray(work)) return [];
    return work.map(exp => ({
      company: exp.company_name || exp.perusahaan || '-',
      position: exp.position || exp.jabatan || '-',
      period: exp.period || exp.periode || '-',
      salary: exp.salary || exp.gaji || '-',
      description: exp.description || exp.deskripsi || '-'
    }));
  };

  const familyMembers = parseFamilyMembers(candidate.family_members);
  const education = parseEducation(candidate.education_history);
  const workExperience = parseWorkExperience(candidate.work_experience);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[98vh] overflow-hidden">
        {/* Header with controls */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold">Formulir Data Pribadi Kandidat</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="bg-white text-blue-900 hover:bg-gray-100">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-blue-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resume Content */}
        <div className="overflow-y-auto max-h-[90vh] bg-gray-50 p-4">
          <div id="standard-resume-content" className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Container */}
            <div className="container-shadow bg-white rounded-lg p-6 text-center border border-blue-900">
              <h1 className="text-2xl font-bold text-blue-900">FORMULIR DATA PRIBADI KANDIDAT</h1>
            </div>

            {/* Personal Data Table - 3 Columns with Photo */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="table-cell align-top p-2">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Nama Lengkap</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.full_name || 'kandidat'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Jenis Kelamin</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.gender || 'pria'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900 align-top">Alamat</td>
                            <td className="p-2 align-top">:</td>
                            <td className="p-2">
                              {candidate.address || 'PJM Centerpoint'}<br />
                              Surabaya<br />
                              {candidate.full_address || 'Jl. Polisi Istimewa No.21, Keputran, Kec. Tegalsari, Surabaya, Jawa Timur 60265, surabaya'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Status Rumah</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.home_status || '-'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Telp. Rumah</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.home_phone || '-'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">No. HP / WA</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.phone || '08142847595'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="table-cell align-top p-2">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Tempat, Tanggal Lahir</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.birth_place || 'surabaya'}, {candidate.birth_date || '2002-02-07'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Usia</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{calculateAge(candidate.birth_date) || '24'} tahun</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Tinggi Badan</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.height || '160'} cm</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Berat Badan</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.weight || '66'} kg</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Gol. Darah</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.blood_type || 'O'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Suku</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.ethnicity || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="table-cell align-top p-2">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Agama</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.religion || 'kristen'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Status</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.marital_status || 'menikah'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">No. KTP / SIM</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.id_card_number || '1234567891234567'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Email</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.email || 'kandidat@gmail.com'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Kendaraan</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.vehicle_type || 'motor'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold text-blue-900">Status Kendaraan</td>
                            <td className="p-2">:</td>
                            <td className="p-2">{candidate.vehicle_status || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Photo */}
              <div className="mt-4 text-center">
                <div className="w-32 h-40 mx-auto border-2 border-blue-900 flex items-center justify-center bg-gray-50">
                  {candidate.photo_url ? (
                    <img 
                      src={candidate.photo_url} 
                      alt={candidate.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Photo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Susunan Keluarga Title Container */}
            <div className="container-shadow bg-white rounded-lg p-4 border border-blue-900 text-center">
              <h2 className="text-xl font-bold text-blue-900">Susunan Keluarga</h2>
            </div>

            {/* Susunan Keluarga Professional Table */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Hubungan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Nama</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>L/P</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Usia</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Pendidikan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Pekerjaan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Perusahaan</th>
                  </tr>
                </thead>
                <tbody>
                  {familyMembers.length > 0 ? (
                    familyMembers.map((member, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.relationship}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.name}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.gender}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.age}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.education}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.occupation}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{member.company}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Ayah</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>tes ayah</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>wiraswasta</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Ibu</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>tes ibu</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>pns</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                      </tr>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Saudara</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>tes adik</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>ons</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Keluarga Inti Title Container */}
            <div className="container-shadow bg-white rounded-lg p-4 border border-blue-900 text-center">
              <h2 className="text-xl font-bold text-blue-900">Keluarga Inti</h2>
            </div>

            {/* Keluarga Inti Professional Table */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Hubungan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Nama</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>L/P</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Usia</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Pendidikan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Pekerjaan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Perusahaan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Suami/Istri</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>santi</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>P</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>34</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>S1</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>IRT</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Anak</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Agga</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>L</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>10</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>SD</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Sekolah</td>
                    <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIWAYAT PENDIDIKAN FORMAL Title Container */}
            <div className="container-shadow bg-white rounded-lg p-4 border border-blue-900 text-center">
              <h2 className="text-xl font-bold text-blue-900">RIWAYAT PENDIDIKAN FORMAL</h2>
            </div>

            {/* RIWAYAT PENDIDIKAN FORMAL Professional Table */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Pendidikan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Nama Sekolah</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Kota</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Jurusan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Dari</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Sampai</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Lulus/Status</th>
                  </tr>
                </thead>
                <tbody>
                  {education.length > 0 ? (
                    education.map((edu, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.level}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.school}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.city}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.major}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.from}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.to}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{edu.status}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>SLTA</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>sma 1 surabaya</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>ipa</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>2020</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Lulus</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>S1</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Unair</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Teknik Sipil</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>-</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>2025</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>Lulus</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pendidikan Non Formal Container */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Pendidikan Non Formal</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Hobi</h3>
                  <p className="p-2 bg-gray-50 rounded">{candidate.hobbies || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Sidfat dan Kepribadian</h3>
                  <p className="p-2 bg-gray-50 rounded">{candidate.personality || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Kontrak Darurat</h3>
                  <p className="p-2 bg-gray-50 rounded">{candidate.emergency_contract || '-'}</p>
                </div>
              </div>
            </div>

            {/* Pengalaman Kerja Title Container */}
            <div className="container-shadow bg-white rounded-lg p-4 border border-blue-900 text-center">
              <h2 className="text-xl font-bold text-blue-900">Pengalaman Kerja</h2>
            </div>

            {/* Pengalaman Kerja Professional Table */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Perusahaan</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Posisi</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Periode</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Gaji</th>
                    <th style={{ border: '2px solid #1e3a8a', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {workExperience.length > 0 ? (
                    workExperience.map((work, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{work.company}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{work.position}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{work.period}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{work.salary}</td>
                        <td style={{ border: '2px solid #1e3a8a', padding: '10px' }}>{work.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ backgroundColor: '#ffffff' }}>
                      <td style={{ border: '2px solid #1e3a8a', padding: '10px', textAlign: 'center', fontStyle: 'italic' }} colSpan={5}>
                        Tidak ada data pengalaman kerja
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ekspektasi Gaji Container */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Ekspektasi Gaji</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-blue-900">Gaji yang Diharapkan:</p>
                  <p className="p-2 bg-gray-50 rounded">{candidate.expected_salary || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Gaji Saat Ini:</p>
                  <p className="p-2 bg-gray-50 rounded">{candidate.current_salary || '-'}</p>
                </div>
              </div>
            </div>

            {/* Pernyataan Container */}
            <div className="container-shadow bg-white rounded-lg p-6 border border-blue-900">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Pernyataan</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Dengan ini saya menyatakan bahwa keterangan yang saya berikan di atas adalah BENAR. Bilamana ternyata terdapat ketidaksesuaian, maka saya bertanggung jawab penuh atas segala akibatnya, dan Perusahaan BERHAK menghentikan proses Rekruitmen, tanpa tuntutan apapun dari saya.
              </p>
              
              <div className="text-right">
                <p className="mb-2">surabaya, 11 Mei 2026</p>
                <div className="h-16"></div>
                <p className="font-bold">( {candidate.full_name || 'kandidat'} )</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
