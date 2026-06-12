import React from 'react';
import { Download, X, User, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, Award, FileText, Building2, Heart, Home, Car, CreditCard, Languages, Target, Star, MessageSquare, Link2, Globe, Camera, BookOpen, FolderOpen, AlertCircle, CheckCircle, Clock, ChevronRight, Bell, SettingsIcon, UserCog, Shield, ChevronDown, Workflow, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfessionalApplicationFormProps {
  candidate: any;
  onClose: () => void;
}

export default function ProfessionalApplicationForm({ candidate, onClose }: ProfessionalApplicationFormProps) {
  const safeParseArray = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const familyMembers = safeParseArray(candidate.family_members);
      const educationHistory = safeParseArray(candidate.education_history);
      const workExperience = safeParseArray(candidate.work_experience);
      const skills = safeParseArray(candidate.skills);
      const languages = safeParseArray(candidate.languages);
      const certificates = safeParseArray(candidate.certificates);
      const references = safeParseArray(candidate.references);
      const hobbies = safeParseArray(candidate.hobbies);

      const buildPersonalInfoTable = () => {
        const fields = [
          { label: 'Tempat, Tanggal Lahir', value: `${candidate.birth_place || '-'}, ${formatDate(candidate.birth_date)}` },
          { label: 'Usia', value: calculateAge(candidate.birth_date) + ' tahun' },
          { label: 'Jenis Kelamin', value: candidate.gender || '-' },
          { label: 'Status Pernikahan', value: candidate.marital_status || '-' },
          { label: 'Agama', value: candidate.religion || '-' },
          { label: 'Kewarganegaraan', value: candidate.nationality || '-' },
          { label: 'No. KTP / NIK', value: candidate.nik || candidate.id_card_number || '-' },
          { label: 'No. SIM', value: candidate.vehicle_license || '-' },
          { label: 'Golongan Darah', value: candidate.blood_type || '-' },
          { label: 'Tinggi Badan', value: candidate.height_cm ? `${candidate.height_cm} cm` : '-' },
          { label: 'Berat Badan', value: candidate.weight_kg ? `${candidate.weight_kg} kg` : '-' },
          { label: 'Alamat Lengkap', value: candidate.address || '-' },
        ];

        let html = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">';
        html += '<tr>';
        fields.forEach((field, index) => {
          if (index % 3 === 0 && index !== 0) {
            html += '</tr><tr>';
          }
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; width: 33.33%; vertical-align: top;">`;
          html += `<div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">${field.label}</div>`;
          html += `<div style="font-size: 10px; color: #374151;">${field.value}</div>`;
          html += '</td>';
        });
        html += '</tr></table>';
        return html;
      };

      const buildFamilyTable = () => {
        if (familyMembers.length === 0) return '<p style="text-align: center; color: #6b7280; padding: 8px;">Belum ada data keluarga</p>';
        
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #f3f4f6;">';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Hubungan</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Nama</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Jenis Kelamin</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Usia</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Pendidikan</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Pekerjaan</th>';
        html += '</tr></thead><tbody>';
        
        familyMembers.forEach((member: any, index: number) => {
          html += `<tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.relation || member.relationship || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.name || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.gender || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.age || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.education || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${member.occupation || '-'}</td>`;
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
      };

      const buildEducationTable = () => {
        if (educationHistory.length === 0) {
          return `
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">
                  <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Tingkat Pendidikan</div>
                  <div style="font-size: 10px; color: #374151;">${candidate.education_level || '-'}</div>
                </td>
                <td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">
                  <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Institusi</div>
                  <div style="font-size: 10px; color: #374151;">${candidate.education_institution || '-'}</div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">
                  <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Jurusan</div>
                  <div style="font-size: 10px; color: #374151;">${candidate.major || '-'}</div>
                </td>
                <td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">
                  <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Tahun Lulus</div>
                  <div style="font-size: 10px; color: #374151;">${candidate.graduation_year || '-'}</div>
                </td>
              </tr>
            </table>
          `;
        }

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #f3f4f6;">';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Tingkat</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Sekolah/Universitas</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Jurusan</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Tahun Mulai</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Tahun Selesai</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Nilai/Grade</th>';
        html += '<th style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px; text-align: left;">Status</th>';
        html += '</tr></thead><tbody>';
        
        educationHistory.forEach((edu: any, index: number) => {
          html += `<tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.level || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.school || edu.institution || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.major || edu.field_of_study || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.start_year || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.end_year || edu.graduation_year || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.grade || edu.gpa || '-'}</td>`;
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; font-size: 9px;">${edu.status || '-'}</td>`;
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
      };

      const buildSkillsTable = () => {
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tr>';
        html += '<td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">';
        html += '<div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 4px;">Skills</div>';
        if (skills.length > 0) {
          html += '<div style="display: flex; flex-wrap: wrap; gap: 4px;">';
          skills.forEach((skill: any) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill || '-';
            html += `<span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 9999px; font-size: 8px;">${skillName}</span>`;
          });
          html += '</div>';
        } else {
          html += '<span style="font-size: 9px; color: #6b7280;">Tidak ada data</span>';
        }
        html += '</td>';
        
        html += '<td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">';
        html += '<div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 4px;">Bahasa</div>';
        if (languages.length > 0) {
          html += '<div style="display: flex; flex-direction: column; gap: 2px;">';
          languages.forEach((lang: any) => {
            html += `<div style="display: flex; justify-content: space-between; padding: 2px; background: #f3f4f6; border-radius: 2px;">`;
            html += `<span style="font-size: 9px;">${lang.language || lang.name || '-'}</span>`;
            html += `<span style="font-size: 8px; background: #dbeafe; color: #1e40af; padding: 1px 4px; border-radius: 9999px;">${lang.level || '-'}</span>`;
            html += '</div>';
          });
          html += '</div>';
        } else {
          html += '<span style="font-size: 9px; color: #6b7280;">Tidak ada data</span>';
        }
        html += '</td>';
        html += '</tr>';
        html += '</table>';
        return html;
      };

      const buildExpectationsTable = () => {
        const fields = [
          { label: 'Gaji yang Diharapkan', value: candidate.expected_salary || (candidate as any).salary_exp_base || '-' },
          { label: 'Gaji Saat Ini', value: (candidate as any).salary_expectation || '-' },
          { label: 'Tanggal Mulai Tersedia', value: (candidate as any).available_from || '-' },
          { label: 'Periode Notice', value: (candidate as any).notice_period ? `${(candidate as any).notice_period} hari` : '-' },
          { label: 'Bersedia Relokasi', value: (candidate as any).willing_relocate ? 'Ya' : 'Tidak' },
          { label: 'Bersedia Lembur', value: (candidate as any).willing_overtime ? 'Ya' : 'Tidak' },
          { label: 'Bersedia Shift', value: (candidate as any).willing_shift ? 'Ya' : 'Tidak' },
          { label: 'Negosiasi Gaji', value: candidate.salary_negotiable ? 'Ya' : 'Tidak' },
        ];

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tr>';
        fields.forEach((field, index) => {
          if (index % 2 === 0 && index !== 0) {
            html += '</tr><tr>';
          }
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; width: 50%; vertical-align: top;">`;
          html += `<div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">${field.label}</div>`;
          html += `<div style="font-size: 10px; color: #374151;">${field.value}</div>`;
          html += '</td>';
        });
        html += '</tr></table>';
        return html;
      };

      const buildAdditionalInfoTable = () => {
        const fields = [
          { label: 'Hobi', value: hobbies.length > 0 ? hobbies.map((h: any) => typeof h === 'string' ? h : h.name).join(', ') : '-' },
          { label: 'SIM yang Dimiliki', value: candidate.vehicle_license || '-' },
          { label: 'Alamat Domisili', value: (candidate as any).alamat_domisili || '-' },
          { label: 'Memiliki Kendaraan', value: (candidate as any).has_vehicle ? 'Ya' : 'Tidak' },
          { label: 'Status Kepemilikan Rumah', value: (candidate as any).home_ownership || '-' },
          { label: 'Telepon Rumah', value: (candidate as any).home_phone || '-' },
          { label: 'Sumber Informasi Lowongan', value: (candidate as any).source_info || '-' },
        ];

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tr>';
        fields.forEach((field, index) => {
          if (index % 3 === 0 && index !== 0) {
            html += '</tr><tr>';
          }
          html += `<td style="border: 1px solid #1e3a8a; padding: 4px; width: 33.33%; vertical-align: top;">`;
          html += `<div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">${field.label}</div>`;
          html += `<div style="font-size: 10px; color: #374151;">${field.value}</div>`;
          html += '</td>';
        });
        html += '</tr></table>';
        return html;
      };

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Personal History Card (PHC) - ${candidate.full_name || 'Candidate'}</title>
          <style>
            @page {
              size: A4;
              margin: 1.5cm 1.5cm 1.5cm 1.5cm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            @media print {
              body { 
                print-color-adjust: exact; 
                -webkit-print-color-adjust: exact; 
                background: white !important;
                margin: 0;
                padding: 0;
              }
              table {
                page-break-inside: auto;
                width: 100%;
                border-collapse: collapse;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              td {
                page-break-inside: avoid;
                page-break-after: auto;
                word-wrap: break-word;
                word-break: break-word;
              }
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              margin: 0;
              padding: 0;
              color: #1f2937;
              font-size: 11px;
            }
            
            .section-card {
              background: white;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 12px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
              page-break-inside: avoid;
            }
            
            .section-header {
              background: #f1f5f9;
              color: #334155;
              padding: 8px;
              font-weight: bold;
              text-align: center;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              margin-bottom: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 12px;
            }
            
            .header-section {
              text-align: center;
              padding: 12px;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              border-radius: 4px;
              margin-bottom: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .header-section h1 {
              font-size: 16px;
              font-weight: bold;
              margin: 0 0 4px 0;
            }
            
            .header-section p {
              font-size: 10px;
              margin: 0;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div style="max-width: 100%; margin: 0;">
            <div class="section-card">
              <div class="header-section">
                <h1>PERSONAL HISTORY CARD (PHC)</h1>
                <p>Data Pelamar Lengkap</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                <tr>
                  <td style="border: 1px solid #1e3a8a; padding: 8px; width: 120px; vertical-align: top;">
                    <div style="width: 100px; height: 120px; border: 2px solid #1e3a8a; border-radius: 4px; overflow: hidden; background: #f9fafb; display: flex; align-items: center; justify-content: center;">
                      ${candidate.photo_url ? `<img src="${candidate.photo_url}" alt="${candidate.full_name}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span style="font-size: 9px; color: #6b7280;">No Photo</span>'}
                    </div>
                  </td>
                  <td style="border: 1px solid #1e3a8a; padding: 8px; vertical-align: top;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="border: none; padding: 2px; width: 50%; vertical-align: top;">
                          <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Nama Lengkap</div>
                          <div style="font-size: 10px; color: #374151;">${candidate.full_name || '-'}</div>
                        </td>
                        <td style="border: none; padding: 2px; width: 50%; vertical-align: top;">
                          <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Email</div>
                          <div style="font-size: 10px; color: #374151;">${candidate.email || '-'}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="border: none; padding: 2px; width: 50%; vertical-align: top;">
                          <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Telepon</div>
                          <div style="font-size: 10px; color: #374151;">${candidate.phone || '-'}</div>
                        </td>
                        <td style="border: none; padding: 2px; width: 50%; vertical-align: top;">
                          <div style="font-size: 9px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px;">Posisi yang Dilamar</div>
                          <div style="font-size: 10px; color: #374151;">${candidate.current_position || '-'}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>

            <div class="section-card">
              <div class="section-header">DATA PRIBADI</div>
              ${buildPersonalInfoTable()}
            </div>

            <div class="section-card">
              <div class="section-header">DATA KELUARGA</div>
              ${buildFamilyTable()}
            </div>

            <div class="section-card">
              <div class="section-header">RIWAYAT PENDIDIKAN</div>
              ${buildEducationTable()}
            </div>

            <div class="section-card">
              <div class="section-header">KEAHLIAN & KOMPETENSI</div>
              ${buildSkillsTable()}
            </div>

            <div class="section-card">
              <div class="section-header">EKSPETASI & PREFERENSI</div>
              ${buildExpectationsTable()}
            </div>

            <div class="section-card">
              <div class="section-header">INFORMASI TAMBAHAN</div>
              ${buildAdditionalInfoTable()}
            </div>

            <div class="section-card">
              <div class="section-header">PERNYATAAN</div>
              <p style="font-size: 10px; color: #374151; margin-bottom: 8px; line-height: 1.5;">
                Dengan ini saya menyatakan bahwa seluruh data yang saya berikan adalah benar dan dapat dipertanggungjawabkan. 
                Apabila di kemudian hari terdapat ketidaksesuaian dengan kenyataan, saya bersedia menerima sanksi dan 
                pembatalan proses rekrutmen ini tanpa tuntutan apapun.
              </p>
              <div style="text-align: right; margin-top: 16px;">
                <p style="font-size: 9px; color: #374151; margin-bottom: 2px;">Surabaya, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div style="height: 48px;"></div>
                <p style="font-size: 10px; font-weight: bold; color: #374151;">( ${candidate.full_name || 'Nama Pelamar'} )</p>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const familyMembers = safeParseArray(candidate.family_members);
  const educationHistory = safeParseArray(candidate.education_history);
  const workExperience = safeParseArray(candidate.work_experience);
  const skills = safeParseArray(candidate.skills);
  const languages = safeParseArray(candidate.languages);
  const certificates = safeParseArray(candidate.certificates);
  const references = safeParseArray(candidate.references);
  const hobbies = safeParseArray(candidate.hobbies);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[98vh] overflow-hidden shadow-2xl">
        {/* Header with controls */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 flex items-center justify-between no-print sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold">Formulir Lamaran Kerja</h2>
            <p className="text-blue-200 text-sm">{candidate.full_name || 'Nama Kandidat'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} className="bg-white text-blue-900 hover:bg-gray-100">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-blue-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[90vh] bg-gray-100 p-6">
          <div id="application-form-content" className="max-w-5xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">PERSONAL HISTORY CARD (PHC)</h1>
                <p className="text-gray-600">Data Pelamar Lengkap</p>
              </div>
              
              {/* Photo and Basic Info */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-40 h-48 border-4 border-blue-900 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {candidate.photo_url ? (
                      <img 
                        src={candidate.photo_url} 
                        alt={candidate.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <User className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Foto Pelamar</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Nama Lengkap</label>
                      <p className="text-lg font-medium text-gray-800">{candidate.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Email</label>
                      <p className="text-lg font-medium text-gray-800">{candidate.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-900">No. Telepon / WA</label>
                      <p className="text-lg font-medium text-gray-800">{candidate.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Posisi yang Dilamar</label>
                      <p className="text-lg font-medium text-gray-800">{candidate.current_position || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Pribadi Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <User className="w-6 h-6" />
                  DATA PRIBADI
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-blue-900">Tempat, Tanggal Lahir</label>
                  <p className="text-gray-800">{candidate.birth_place || '-'}, {formatDate(candidate.birth_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Usia</label>
                  <p className="text-gray-800">{calculateAge(candidate.birth_date)} tahun</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Jenis Kelamin</label>
                  <p className="text-gray-800">{candidate.gender || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Status Pernikahan</label>
                  <p className="text-gray-800">{candidate.marital_status || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Agama</label>
                  <p className="text-gray-800">{candidate.religion || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Kewarganegaraan</label>
                  <p className="text-gray-800">{candidate.nationality || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">No. KTP / NIK</label>
                  <p className="text-gray-800">{candidate.nik || candidate.id_card_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">No. SIM</label>
                  <p className="text-gray-800">{candidate.vehicle_license || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Golongan Darah</label>
                  <p className="text-gray-800">{candidate.blood_type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Tinggi Badan</label>
                  <p className="text-gray-800">{candidate.height_cm ? `${candidate.height_cm} cm` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Berat Badan</label>
                  <p className="text-gray-800">{candidate.weight_kg ? `${candidate.weight_kg} kg` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Alamat Lengkap</label>
                  <p className="text-gray-800 text-sm">{candidate.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Data Keluarga Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Heart className="w-6 h-6" />
                  DATA KELUARGA
                </h2>
              </div>
              
              {familyMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-border">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="table-cell text-left font-bold text-blue-900">Hubungan</th>
                        <th className="table-cell text-left font-bold text-blue-900">Nama Lengkap</th>
                        <th className="table-cell text-left font-bold text-blue-900">Jenis Kelamin</th>
                        <th className="table-cell text-left font-bold text-blue-900">Usia</th>
                        <th className="table-cell text-left font-bold text-blue-900">Pendidikan</th>
                        <th className="table-cell text-left font-bold text-blue-900">Pekerjaan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familyMembers.map((member: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="table-cell">{member.relation || member.relationship || '-'}</td>
                          <td className="table-cell font-medium">{member.name || '-'}</td>
                          <td className="table-cell">{member.gender || '-'}</td>
                          <td className="table-cell">{member.age || '-'}</td>
                          <td className="table-cell">{member.education || '-'}</td>
                          <td className="table-cell">{member.occupation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Belum ada data keluarga</p>
              )}
            </div>

            {/* Pendidikan Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  RIWAYAT PENDIDIKAN
                </h2>
              </div>
              
              {educationHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-border">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="table-cell text-left font-bold text-blue-900">Tingkat</th>
                        <th className="table-cell text-left font-bold text-blue-900">Nama Sekolah/Universitas</th>
                        <th className="table-cell text-left font-bold text-blue-900">Jurusan</th>
                        <th className="table-cell text-left font-bold text-blue-900">Tahun Mulai</th>
                        <th className="table-cell text-left font-bold text-blue-900">Tahun Selesai</th>
                        <th className="table-cell text-left font-bold text-blue-900">Nilai/Grade</th>
                        <th className="table-cell text-left font-bold text-blue-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {educationHistory.map((edu: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="table-cell font-medium">{edu.level || '-'}</td>
                          <td className="table-cell">{edu.school || edu.institution || '-'}</td>
                          <td className="table-cell">{edu.major || edu.field_of_study || '-'}</td>
                          <td className="table-cell">{edu.start_year || '-'}</td>
                          <td className="table-cell">{edu.end_year || edu.graduation_year || '-'}</td>
                          <td className="table-cell">{edu.grade || edu.gpa || '-'}</td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              edu.status === 'Lulus' || edu.status === 'Graduated' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {edu.status || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Pendidikan Terakhir</label>
                    <p className="text-gray-800">{candidate.education_level || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Institusi</label>
                    <p className="text-gray-800">{candidate.education_institution || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Jurusan</label>
                    <p className="text-gray-800">{candidate.major || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Tahun Lulus</label>
                    <p className="text-gray-800">{candidate.graduation_year || '-'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pengalaman Kerja Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Briefcase className="w-6 h-6" />
                  PENGALAMAN KERJA
                </h2>
              </div>
              
              {workExperience.length > 0 ? (
                <div className="space-y-4">
                  {workExperience.map((work: any, index: number) => (
                    <div key={index} className="border-2 border-blue-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-sm font-semibold text-blue-900">Perusahaan</label>
                          <p className="text-gray-800 font-medium">{work.company_name || work.company || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-blue-900">Posisi</label>
                          <p className="text-gray-800 font-medium">{work.position_start || work.position || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-blue-900">Periode</label>
                          <p className="text-gray-800">{work.join_date && work.end_date ? `${work.join_date} - ${work.end_date}` : work.period || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-blue-900">Gaji Terakhir</label>
                          <p className="text-gray-800">{work.salary_end || work.salary || '-'}</p>
                        </div>
                        {work.industry && (
                          <div>
                            <label className="text-sm font-semibold text-blue-900">Industri</label>
                            <p className="text-gray-800">{work.industry}</p>
                          </div>
                        )}
                        {work.company_size && (
                          <div>
                            <label className="text-sm font-semibold text-blue-900">Ukuran Perusahaan</label>
                            <p className="text-gray-800">{work.company_size}</p>
                          </div>
                        )}
                        {work.reason_for_leaving && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-blue-900">Alasan Keluar</label>
                            <p className="text-gray-800">{work.reason_for_leaving}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-900">Deskripsi Pekerjaan</label>
                        <p className="text-gray-800 text-sm mt-1">{work.duties || work.description || '-'}</p>
                      </div>
                      {work.achievements && (
                        <div className="mt-2">
                          <label className="text-sm font-semibold text-blue-900">Pencapaian</label>
                          <p className="text-gray-800 text-sm mt-1">{work.achievements}</p>
                        </div>
                      )}
                      {work.supervisor_name && (
                        <div className="mt-2">
                          <label className="text-sm font-semibold text-blue-900">Nama Atasan</label>
                          <p className="text-gray-800 text-sm">{work.supervisor_name}</p>
                        </div>
                      )}
                      {work.supervisor_contact && (
                        <div className="mt-2">
                          <label className="text-sm font-semibold text-blue-900">Kontak Atasan</label>
                          <p className="text-gray-800 text-sm">{work.supervisor_contact}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Perusahaan Saat Ini</label>
                    <p className="text-gray-800">{candidate.current_company || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Posisi Saat Ini</label>
                    <p className="text-gray-800">{candidate.current_position || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Lama Pengalaman</label>
                    <p className="text-gray-800">{candidate.experience_years ? `${candidate.experience_years} Tahun` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900">Gaji Saat Ini</label>
                    <p className="text-gray-800">{(candidate as any).salary_expectation || '-'}</p>
                  </div>
                  {(candidate as any).industry && (
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Industri</label>
                      <p className="text-gray-800">{(candidate as any).industry || '-'}</p>
                    </div>
                  )}
                  {(candidate as any).company_size && (
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Ukuran Perusahaan</label>
                      <p className="text-gray-800">{(candidate as any).company_size || '-'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Keahlian Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Star className="w-6 h-6" />
                  KEAHLIAN & KOMPETENSI
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-2 block">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((skill: any, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-medium">
                        {typeof skill === 'string' ? skill : skill.name || skill.skill || '-'}
                      </span>
                    )) : (
                      <span className="text-gray-500">Tidak ada data</span>
                    )}
                  </div>
                </div>
                
                {candidate.strengths && (
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-2 block">Kelebihan</label>
                    <p className="text-gray-800 whitespace-pre-line">{candidate.strengths}</p>
                  </div>
                )}
                
                {languages.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-2 block">Bahasa</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {languages.map((lang: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{lang.language || lang.name || '-'}</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded">{lang.level || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {hobbies.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-2 block">Hobi</label>
                    <div className="flex flex-wrap gap-2">
                      {hobbies.map((hobby: any, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {typeof hobby === 'string' ? hobby : hobby.name || '-'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ekspektasi Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Target className="w-6 h-6" />
                  EKSPETASI & PREFERENSI
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-blue-900">Gaji yang Diharapkan</label>
                  <p className="text-gray-800 text-lg font-medium">{candidate.expected_salary || (candidate as any).salary_exp_base || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Gaji Saat Ini</label>
                  <p className="text-gray-800">{(candidate as any).salary_expectation || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Tanggal Mulai Tersedia</label>
                  <p className="text-gray-800">{(candidate as any).available_from || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Periode Notice</label>
                  <p className="text-gray-800">{(candidate as any).notice_period ? `${(candidate as any).notice_period} hari` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Bersedia Relokasi</label>
                  <p className="text-gray-800">{(candidate as any).willing_relocate ? 'Ya' : 'Tidak'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Bersedia Lembur</label>
                  <p className="text-gray-800">{(candidate as any).willing_overtime ? 'Ya' : 'Tidak'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Bersedia Shift</label>
                  <p className="text-gray-800">{(candidate as any).willing_shift ? 'Ya' : 'Tidak'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900">Negosiasi Gaji</label>
                  <p className="text-gray-800">{candidate.salary_negotiable ? 'Ya' : 'Tidak'}</p>
                </div>
              </div>
            </div>

            {/* Informasi Tambahan Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  INFORMASI TAMBAHAN
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidate.bio && (
                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-blue-900">Bio / Tentang Saya</label>
                    <p className="text-gray-800 whitespace-pre-line">{candidate.bio}</p>
                  </div>
                )}
                
                {candidate.additional_info && (
                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-blue-900">Informasi Tambahan</label>
                    <p className="text-gray-800 whitespace-pre-line">{candidate.additional_info}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Hobi</label>
                  <div className="flex flex-wrap gap-2">
                    {hobbies.length > 0 ? hobbies.map((hobby: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {typeof hobby === 'string' ? hobby : hobby.name || '-'}
                      </span>
                    )) : <span className="text-gray-500">-</span>}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">SIM yang Dimiliki</label>
                  <p className="text-gray-800">{candidate.vehicle_license || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Alamat Domisili</label>
                  <p className="text-gray-800 whitespace-pre-line">{(candidate as any).alamat_domisili || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Memiliki Kendaraan</label>
                  <p className="text-gray-800">{(candidate as any).has_vehicle ? 'Ya' : 'Tidak'}</p>
                </div>
                
                {(candidate as any).has_vehicle && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Jenis Kendaraan</label>
                      <p className="text-gray-800">{(candidate as any).vehicle_type || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-900">Merk Kendaraan</label>
                      <p className="text-gray-800">{(candidate as any).vehicle_brand || '-'}</p>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Status Kepemilikan Rumah</label>
                  <p className="text-gray-800">{(candidate as any).home_ownership || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Telepon Rumah</label>
                  <p className="text-gray-800">{(candidate as any).home_phone || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-blue-900">Sumber Informasi Lowongan</label>
                  <p className="text-gray-800">{(candidate as any).source_info || '-'}</p>
                </div>
                
                <div className="md:col-span-3">
                  <label className="text-sm font-semibold text-blue-900">Aktivitas Sosial/Organisasi</label>
                  <p className="text-gray-800 whitespace-pre-line">{(candidate as any).social_activities || '-'}</p>
                </div>
                
                {candidate.social_media && Object.keys(candidate.social_media).length > 0 && (
                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-blue-900">Social Media</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(candidate.social_media).map(([platform, url]: [string, any]) => (
                        <div key={platform} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium capitalize">{platform}:</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-900 hover:underline">
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {references.length > 0 && (
                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-blue-900">Referensi</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {references.map((ref: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-800">{ref.name || '-'}</p>
                          <p className="text-sm text-gray-600">{ref.position || '-'}</p>
                          <p className="text-sm text-gray-600">{ref.contact || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pernyataan Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  PERNYATAAN
                </h2>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Dengan ini saya menyatakan bahwa seluruh data yang saya berikan adalah benar dan dapat dipertanggungjawabkan. 
                Apabila di kemudian hari terdapat ketidaksesuaian dengan kenyataan, saya bersedia menerima sanksi dan 
                pembatalan proses rekrutmen ini tanpa tuntutan apapun.
              </p>
              
              <div className="text-right mt-8">
                <p className="mb-2">Surabaya, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div className="h-24"></div>
                <p className="font-bold text-lg">( {candidate.full_name || 'Nama Pelamar'} )</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
