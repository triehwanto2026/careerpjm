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

  const text = (...values: any[]) => {
    const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
    return found === undefined ? '-' : String(found);
  };

  const optionalText = (...values: any[]) => {
    const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
    return found === undefined ? '' : String(found);
  };

  const escapeHtml = (value: any) => text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatWorkPeriod = (work: any) => {
    const start = optionalText(work.join_date, work.start_date, work.start_year);
    const end = work.still_working ? 'Sekarang' : optionalText(work.end_date, work.end_year);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return text(work.period, work.duration, '-');
  };

  const normalizeWorkExperience = (items: any[]) => items
    .filter((work) => work && typeof work === 'object')
    .map((work) => ({
      company: text(work.company_name, work.company, work.employer),
      businessType: text(work.business_type, work.industry),
      employeeCount: text(work.employee_count, work.company_size),
      address: text(work.address, work.company_address),
      city: text(work.city),
      period: formatWorkPeriod(work),
      positionStart: text(work.position_start, work.position, work.role),
      positionEnd: text(work.position_end, work.position, work.role),
      salaryStart: text(work.salary_start),
      salaryEnd: text(work.salary_end, work.salary),
      supervisorName: text(work.supervisor_name),
      supervisorPosition: text(work.supervisor_position),
      supervisorPhone: text(work.supervisor_phone, work.supervisor_contact),
      duties: text(work.duties, work.description),
      achievements: text(work.achievements),
      organizationStructure: text(work.organization_structure),
      resignationReason: text(work.resignation_reason, work.reason_for_leaving),
      benefits: text(work.benefits),
    }));

  const renderWorkExperiencePrint = (items: any[]) => {
    const normalized = normalizeWorkExperience(items);
    if (normalized.length === 0) {
      return '<p style="text-align:center;color:#64748b;padding:10px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc;">Belum ada data pengalaman kerja</p>';
    }

    return normalized.map((work) => `
      <div class="work-card">
        <div class="work-title">
          <div>
            <strong>${escapeHtml(work.positionEnd)}</strong>
            <span>${escapeHtml(work.company)}</span>
          </div>
          <em>${escapeHtml(work.period)}</em>
        </div>
        <table class="phc-table">
          <tbody>
            <tr>
              <td><b>Jenis Usaha</b><span>${escapeHtml(work.businessType)}</span></td>
              <td><b>Jumlah Karyawan</b><span>${escapeHtml(work.employeeCount)}</span></td>
              <td><b>Kota</b><span>${escapeHtml(work.city)}</span></td>
            </tr>
            <tr>
              <td><b>Jabatan Awal</b><span>${escapeHtml(work.positionStart)}</span></td>
              <td><b>Jabatan Akhir</b><span>${escapeHtml(work.positionEnd)}</span></td>
              <td><b>Gaji Akhir</b><span>${escapeHtml(work.salaryEnd)}</span></td>
            </tr>
            <tr>
              <td colspan="3"><b>Alamat Perusahaan</b><span>${escapeHtml(work.address)}</span></td>
            </tr>
            <tr>
              <td><b>Atasan Langsung</b><span>${escapeHtml(work.supervisorName)}</span></td>
              <td><b>Jabatan Atasan</b><span>${escapeHtml(work.supervisorPosition)}</span></td>
              <td><b>Kontak Atasan</b><span>${escapeHtml(work.supervisorPhone)}</span></td>
            </tr>
            <tr>
              <td colspan="3"><b>Tugas & Tanggung Jawab</b><span>${escapeHtml(work.duties)}</span></td>
            </tr>
            <tr>
              <td colspan="3"><b>Target / Pencapaian</b><span>${escapeHtml(work.achievements)}</span></td>
            </tr>
            <tr>
              <td colspan="3"><b>Alasan Berhenti / Benefit</b><span>${escapeHtml(work.resignationReason)}${work.benefits !== '-' ? ` | ${escapeHtml(work.benefits)}` : ''}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `).join('');
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
              margin: 1.15cm 1.2cm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            @media print {
              body { 
                print-color-adjust: exact; 
                -webkit-print-color-adjust: exact; 
                background: #fff !important;
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
              font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
              background: #fff;
              margin: 0;
              padding: 0;
              color: #172033;
              font-size: 10.5px;
              line-height: 1.45;
            }

            .page {
              width: 100%;
              margin: 0;
            }

            .doc-header {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              overflow: hidden;
              margin-bottom: 12px;
              page-break-inside: avoid;
            }

            .doc-header-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 18px;
              background: #0f2f6f;
              color: #fff;
              padding: 16px 18px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .doc-title {
              margin: 0;
              font-size: 22px;
              letter-spacing: 0.02em;
              line-height: 1.1;
            }

            .doc-subtitle {
              margin: 5px 0 0;
              color: #bfdbfe;
              font-size: 10.5px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .doc-meta {
              min-width: 150px;
              border: 1px solid rgba(255,255,255,0.28);
              border-radius: 10px;
              padding: 9px 10px;
              text-align: right;
              font-size: 9px;
              color: #dbeafe;
            }

            .doc-meta strong {
              display: block;
              color: #fff;
              font-size: 11px;
              margin-bottom: 2px;
            }

            .candidate-summary {
              display: grid;
              grid-template-columns: 118px 1fr;
              gap: 14px;
              padding: 14px;
              background: #f8fafc;
            }

            .photo-box {
              width: 112px;
              height: 136px;
              overflow: hidden;
              border-radius: 10px;
              border: 1px solid #cbd5e1;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 9px;
            }

            .photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .identity-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
            }

            .identity-item {
              min-height: 48px;
              border: 1px solid #dbe3ef;
              border-radius: 9px;
              background: #fff;
              padding: 8px 10px;
            }

            .identity-item b {
              display: block;
              margin-bottom: 3px;
              color: #1e3a8a;
              font-size: 8.5px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .identity-item span {
              display: block;
              color: #172033;
              font-size: 11px;
              font-weight: 600;
              word-break: break-word;
            }
            
            .section-card {
              background: #fff;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 10px;
              border: 1px solid #dbe3ef;
              page-break-inside: avoid;
            }
            
            .section-header {
              display: flex;
              align-items: center;
              gap: 8px;
              background: #eef4ff;
              color: #12306b;
              padding: 8px 10px;
              font-weight: 800;
              text-align: left;
              border: 1px solid #d7e3f8;
              border-left: 5px solid #1e3a8a;
              border-radius: 8px;
              margin-bottom: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            
            .section-card table:not(.phc-table) {
              border-collapse: separate !important;
              border-spacing: 0 !important;
              border: 1px solid #dbe3ef !important;
              border-radius: 8px !important;
              overflow: hidden;
            }

            .section-card table:not(.phc-table) th {
              border: 0 !important;
              border-right: 1px solid #dbe3ef !important;
              border-bottom: 1px solid #dbe3ef !important;
              background: #eef4ff !important;
              color: #12306b !important;
              padding: 7px 8px !important;
              font-size: 8.8px !important;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .section-card table:not(.phc-table) td {
              border: 0 !important;
              border-right: 1px solid #e2e8f0 !important;
              border-bottom: 1px solid #e2e8f0 !important;
              padding: 7px 8px !important;
              color: #334155 !important;
              font-size: 9.5px !important;
              vertical-align: top;
              background: #fff !important;
            }

            .section-card table:not(.phc-table) tr:nth-child(even) td {
              background: #f8fafc !important;
            }

            .section-card table:not(.phc-table) td div:first-child {
              color: #1e3a8a !important;
              font-size: 8.6px !important;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              margin-bottom: 3px !important;
            }

            .section-card table:not(.phc-table) td div:last-child {
              color: #172033 !important;
              font-size: 10px !important;
            }

            .phc-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              overflow: hidden;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
            }

            .phc-table td {
              border-right: 1px solid #e2e8f0;
              border-bottom: 1px solid #e2e8f0;
              padding: 7px 8px;
              vertical-align: top;
              background: white;
            }

            .phc-table tr:nth-child(even) td {
              background: #f8fafc;
            }

            .phc-table td:last-child {
              border-right: 0;
            }

            .phc-table tr:last-child td {
              border-bottom: 0;
            }

            .phc-table b {
              display: block;
              color: #1e3a8a;
              font-size: 8.5px;
              letter-spacing: 0.02em;
              margin-bottom: 2px;
            }

            .phc-table span {
              display: block;
              color: #334155;
              font-size: 9.5px;
              line-height: 1.45;
            }

            .work-card {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }

            .work-title {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              background: #eef2ff;
              border-bottom: 1px solid #cbd5e1;
              padding: 8px 10px;
              color: #1e3a8a;
            }

            .work-title strong,
            .work-title span,
            .work-title em {
              display: block;
              font-size: 10px;
              line-height: 1.35;
            }

            .work-title span,
            .work-title em {
              color: #475569;
              font-style: normal;
            }

            .statement {
              display: grid;
              grid-template-columns: 1fr 210px;
              gap: 18px;
              align-items: end;
            }

            .statement-text {
              margin: 0;
              color: #334155;
              font-size: 10px;
              line-height: 1.65;
              text-align: justify;
            }

            .signature-box {
              text-align: center;
              color: #172033;
            }

            .signature-line {
              height: 58px;
              border-bottom: 1px solid #94a3b8;
              margin-bottom: 7px;
            }

            .doc-footer {
              margin-top: 10px;
              border-top: 1px solid #cbd5e1;
              padding-top: 7px;
              display: flex;
              justify-content: space-between;
              gap: 12px;
              color: #64748b;
              font-size: 8.5px;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="doc-header">
              <div class="doc-header-top">
                <div>
                  <h1 class="doc-title">PERSONAL HISTORY CARD</h1>
                  <p class="doc-subtitle">Candidate Profile & Employment Record</p>
                </div>
                <div class="doc-meta">
                  <strong>PHC FORM</strong>
                  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div class="candidate-summary">
                <div class="photo-box">
                  ${candidate.photo_url ? `<img src="${escapeHtml(candidate.photo_url)}" alt="${escapeHtml(candidate.full_name || 'Candidate')}" />` : '<span>Foto Pelamar</span>'}
                </div>
                <div class="identity-grid">
                  <div class="identity-item"><b>Nama Lengkap</b><span>${escapeHtml(candidate.full_name || '-')}</span></div>
                  <div class="identity-item"><b>Email</b><span>${escapeHtml(candidate.email || '-')}</span></div>
                  <div class="identity-item"><b>No. Telepon / WA</b><span>${escapeHtml(candidate.phone || '-')}</span></div>
                  <div class="identity-item"><b>Posisi Dilamar</b><span>${escapeHtml(candidate.current_position || '-')}</span></div>
                </div>
              </div>
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
              <div class="section-header">PENGALAMAN KERJA</div>
              ${renderWorkExperiencePrint(workExperience)}
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
              <div class="statement">
                <p class="statement-text">
                  Dengan ini saya menyatakan bahwa seluruh data yang saya berikan adalah benar dan dapat dipertanggungjawabkan. 
                  Apabila di kemudian hari terdapat ketidaksesuaian dengan kenyataan, saya bersedia menerima sanksi dan 
                  pembatalan proses rekrutmen ini tanpa tuntutan apapun.
                </p>
                <div class="signature-box">
                  <div style="font-size:9px;margin-bottom:4px;">Surabaya, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div class="signature-line"></div>
                  <strong>( ${escapeHtml(candidate.full_name || 'Nama Pelamar')} )</strong>
                </div>
              </div>
            </div>

            <div class="doc-footer">
              <span>Personal History Card (PHC) - dokumen rekrutmen internal</span>
              <span>${escapeHtml(candidate.full_name || 'Candidate')}</span>
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
  const normalizedWorkExperience = normalizeWorkExperience(workExperience);

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
              
              {normalizedWorkExperience.length > 0 ? (
                <div className="space-y-5">
                  {normalizedWorkExperience.map((work: any, index: number) => (
                    <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Pengalaman #{index + 1}</p>
                          <h3 className="text-lg font-bold text-slate-900">{work.positionEnd}</h3>
                          <p className="text-sm text-slate-600">{work.company}</p>
                        </div>
                        <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-800">
                          {work.period}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-3">
                        {[
                          ['Jenis Usaha', work.businessType],
                          ['Jumlah Karyawan', work.employeeCount],
                          ['Kota', work.city],
                          ['Jabatan Awal', work.positionStart],
                          ['Jabatan Akhir', work.positionEnd],
                          ['Gaji Awal', work.salaryStart],
                          ['Gaji Akhir', work.salaryEnd],
                          ['Atasan Langsung', work.supervisorName],
                          ['Kontak Atasan', work.supervisorPhone],
                        ].map(([label, value]) => (
                          <div key={label} className="border-t border-slate-100 px-4 py-3 md:border-r md:last:border-r-0">
                            <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">{label}</label>
                            <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                        <div className="border-b border-slate-100 px-4 py-3 md:border-r">
                          <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">Alamat Perusahaan</label>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{work.address}</p>
                        </div>
                        <div className="border-b border-slate-100 px-4 py-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">Alasan Berhenti</label>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{work.resignationReason}</p>
                        </div>
                        <div className="border-b border-slate-100 px-4 py-3 md:border-r">
                          <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">Tugas & Tanggung Jawab</label>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{work.duties}</p>
                        </div>
                        <div className="border-b border-slate-100 px-4 py-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">Target / Pencapaian</label>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{work.achievements}</p>
                        </div>
                        <div className="px-4 py-3 md:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-blue-800">Struktur Organisasi / Benefit</label>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                            {work.organizationStructure !== '-' ? work.organizationStructure : work.benefits}
                          </p>
                        </div>
                      </div>
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
