import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, Mail, Phone, MapPin, Globe, User } from 'lucide-react';

interface ProfessionalResumeProps {
  candidate: any;
  onClose: () => void;
}

const safeArray = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value.split(/[,;]\s*/).filter(Boolean);
    } catch {
      return value.split(/[,;]\s*/).filter(Boolean);
    }
  }
  return [];
};

const safeString = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  return String(value);
};

const parseContact = (candidate: any) => ({
  email: candidate.email || candidate.user_email || '-',
  phone: candidate.phone || candidate.mobile || '-',
  location: candidate.address || candidate.city || candidate.province || '-',
  website: candidate.portfolio_url || candidate.website || '-',
});

const formatPeriod = (item: any) => {
  if (!item) return '-';
  if (item.period) return item.period;
  const start = item.start_date || item.join_date || item.start || '-';
  const end = item.end_date || item.finish_date || item.end || 'Present';
  return `${start} – ${end}`;
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return '-';
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return `${age} Tahun`;
};

export default function ProfessionalResume({ candidate, onClose }: ProfessionalResumeProps) {
  const contact = parseContact(candidate);
  const skills = safeArray(candidate.skills).map((skill: any) => {
    if (!skill) return '-';
    return typeof skill === 'string' ? skill : skill.name || skill.skill || String(skill);
  });
  const languages = safeArray(candidate.languages);
  const certifications = safeArray(candidate.certifications);
  const workExperience = safeArray(candidate.work_experience);
  const educationHistory = safeArray(candidate.education_history);
  const familyMembers = safeArray(candidate.family_members);
  const hobbies = safeArray(candidate.hobbies);
  const references = safeArray(candidate.references);

  const buildResumeHtml = () => {
    const content = document.getElementById('professional-resume-content')?.innerHTML || '';
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Resume - ${safeString(candidate.full_name)}</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;} .page{max-width:960px;margin:0 auto;padding:32px;background:#fff;} .section-title{font-size:14px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#64748b;margin-bottom:16px;} .header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;} .name{font-size:38px;font-weight:700;margin:0;} .subtitle{font-size:16px;color:#475569;margin-top:8px;} .badge{display:inline-flex;padding:8px 14px;border-radius:9999px;background:#e2e8f0;color:#334155;font-size:12px;margin-right:8px;margin-bottom:8px;} .grid{display:grid;grid-template-columns:300px 1fr;gap:24px;} .panel{background:#0f172a;color:#e2e8f0;padding:28px;border-radius:28px;} .panel h3{margin-top:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.2em;} .panel p, .panel li{font-size:14px;line-height:1.8;} .card{background:#fff;padding:28px;border-radius:28px;box-shadow:0 18px 60px rgba(15,23,42,.08);border:1px solid #e2e8f0;} .section{margin-bottom:32px;} .resume-list{list-style:none;padding:0;margin:0;} .resume-list li{margin-bottom:12px;} .resume-row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;} .resume-row strong{color:#0f172a;} @media print{body{background:#fff;} .no-print{display:none!important;} .page{box-shadow:none;margin:0;} }</style></head><body><div class="page">${content}</div></body></html>`;
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const html = buildResumeHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_${safeString(candidate.full_name).replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[96vh] overflow-hidden shadow-2xl">
        <div className="bg-slate-950 text-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resume</p>
            <h2 className="text-2xl font-semibold">{candidate.full_name || 'Nama Kandidat'}</h2>
            <p className="mt-1 text-sm text-slate-300">{candidate.current_position || candidate.current_company || 'Professional Candidate'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handlePrint} className="bg-white text-slate-950 hover:bg-slate-100 flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-white text-white hover:bg-white hover:text-slate-950 flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={onClose} variant="ghost" className="text-white hover:bg-white/10 flex items-center gap-2">
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto bg-slate-100 p-6" id="professional-resume-content">
          <div className="mx-auto grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="panel">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-28 w-28 rounded-full bg-slate-800 grid place-items-center overflow-hidden">
                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt={candidate.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-slate-300" />
                    )}
                  </div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Contact</p>
                </div>

                <div>
                  <h3>Contact</h3>
                  <ul className="resume-list mt-4 space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" /> {contact.email}</li>
                    <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /> {contact.phone}</li>
                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {contact.location}</li>
                    <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-500" /> {contact.website}</li>
                  </ul>
                </div>

                <div>
                  <h3>Key Skills</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((skill, index) => (
                      <span key={index} className="badge">{skill}</span>
                    )) : (
                      <p className="text-sm text-slate-500">No skills available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3>Languages</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {languages.length > 0 ? languages.map((language: any, index: number) => (
                      <li key={index}>{typeof language === 'string' ? language : language.name || language.language || '-'}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3>Certifications</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {certifications.length > 0 ? certifications.map((cert: any, index: number) => (
                      <li key={index}>{typeof cert === 'string' ? cert : cert.name || String(cert)}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3>Hobbies</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {hobbies.length > 0 ? hobbies.map((hobby: any, index: number) => (
                      <li key={index}>{typeof hobby === 'string' ? hobby : hobby.name || hobby}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
              </div>
            </aside>

            <main className="space-y-6">
              <section className="card">
                <div className="header">
                  <div>
                    <p className="section-title">Professional Summary</p>
                    <h2 className="text-2xl font-semibold text-slate-900">About the Candidate</h2>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p>{candidate.current_position || candidate.current_company || 'Professional Candidate'}</p>
                    <p>{candidate.experience_years ? `${candidate.experience_years} years experience` : '-'}</p>
                  </div>
                </div>
                <div className="mt-6 text-slate-700 leading-7">
                  {candidate.bio || candidate.additional_info || 'A dependable professional with strong experience, ready to contribute in a new role.'}
                </div>
              </section>

              <section className="card">
                <p className="section-title">Personal Details</p>
                <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-700">
                  <div>
                    <strong>Full Name</strong>
                    <p>{safeString(candidate.full_name)}</p>
                  </div>
                  <div>
                    <strong>Birth Date</strong>
                    <p>{safeString(candidate.birth_date)}</p>
                  </div>
                  <div>
                    <strong>Birth Place</strong>
                    <p>{safeString(candidate.birth_place)}</p>
                  </div>
                  <div>
                    <strong>Age</strong>
                    <p>{calculateAge(candidate.birth_date)}</p>
                  </div>
                  <div>
                    <strong>Gender</strong>
                    <p>{safeString(candidate.gender)}</p>
                  </div>
                  <div>
                    <strong>Marital Status</strong>
                    <p>{safeString(candidate.marital_status)}</p>
                  </div>
                  <div>
                    <strong>Religion</strong>
                    <p>{safeString(candidate.religion)}</p>
                  </div>
                  <div>
                    <strong>Nationality</strong>
                    <p>{safeString(candidate.nationality)}</p>
                  </div>
                  <div>
                    <strong>Height</strong>
                    <p>{safeString(candidate.height)}</p>
                  </div>
                  <div>
                    <strong>Weight</strong>
                    <p>{safeString(candidate.weight)}</p>
                  </div>
                  <div>
                    <strong>Blood Type</strong>
                    <p>{safeString(candidate.blood_type)}</p>
                  </div>
                  <div>
                    <strong>ID Card</strong>
                    <p>{safeString((candidate as any).id_card_number || (candidate as any).nik)}</p>
                  </div>
                </div>
              </section>

              <section className="card">
                <p className="section-title">Work Experience</p>
                <div className="space-y-6 mt-5">
                  {workExperience.length > 0 ? workExperience.map((item: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="resume-row">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{safeString(item.position || item.title || item.role)}</h3>
                          <p className="text-sm text-slate-500">{safeString(item.company_name || item.company || item.employer)}</p>
                        </div>
                        <span className="text-sm text-slate-500">{formatPeriod(item)}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-7 whitespace-pre-line">{safeString(item.duties || item.description || item.summary || 'No description available.')}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No work experience available.</p>
                  )}
                </div>
              </section>

              <section className="card">
                <p className="section-title">Education</p>
                <div className="space-y-5 mt-5">
                  {educationHistory.length > 0 ? educationHistory.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="resume-row">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{safeString(item.school || item.institution || item.university)}</h3>
                          <p className="text-sm text-slate-500">{safeString(item.major || item.field_of_study || item.program)}</p>
                        </div>
                        <span className="text-sm text-slate-500">{safeString(item.graduation_year || item.end_year || item.year)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{safeString(item.level || item.degree || 'Education Record')}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No education history available.</p>
                  )}
                </div>
              </section>

              <section className="card">
                <p className="section-title">Additional Information</p>
                <div className="grid gap-4 md:grid-cols-2 mt-5 text-sm text-slate-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">Expected Salary</p>
                    <p>{safeString(candidate.expected_salary)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">Available Start</p>
                    <p>{safeString(candidate.available_start_date)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">Willing to Relocate</p>
                    <p>{candidate.willing_to_relocate ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">Salary Negotiable</p>
                    <p>{candidate.salary_negotiable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="mt-6 text-sm text-slate-700 leading-7 whitespace-pre-line">
                  {candidate.strengths || 'No additional strengths provided.'}
                </div>
              </section>

              <section className="card">
                <p className="section-title">Family & References</p>
                <div className="space-y-5 mt-5 text-sm text-slate-700">
                  <div>
                    <strong>Family Members</strong>
                    {familyMembers.length > 0 ? (
                      <ul className="resume-list mt-2 text-slate-700">
                        {familyMembers.map((member: any, index: number) => (
                          <li key={index}>{safeString(member.name || member.nama)} – {safeString(member.relation || member.hubungan || member.relationship)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <strong>References</strong>
                    {references.length > 0 ? (
                      <ul className="resume-list mt-2 text-slate-700">
                        {references.map((ref: any, index: number) => (
                          <li key={index}>{safeString(ref.name)} – {safeString(ref.position)} – {safeString(ref.contact)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
