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

const buildResumeHtml = (candidate: any, contact: any, skills: string[], languages: string[], certifications: string[], hobbies: string[], workExperience: any[], educationHistory: any[], familyMembers: any[], references: any[]) => {
  const formatItem = (item: any, field: string | string[]) => {
    if (!item) return '-';
    if (Array.isArray(field)) {
      return field.map((key) => safeString(item[key])).filter((value) => value !== '-').join(' • ');
    }
    return safeString(item[field]);
  };

  const renderList = (items: string[]) => {
    if (!items || items.length === 0) return '<li>-</li>';
    return items.map((item) => `<li>${safeString(item)}</li>`).join('');
  };

  const renderSkills = (items: string[]) => {
    if (!items || items.length === 0) return '<span class="tag">-</span>';
    return items.map((item) => `<span class="tag">${safeString(item)}</span>`).join('');
  };

  const renderWork = (items: any[]) => {
    if (!items || items.length === 0) return '<p class="text">No work experience available.</p>';
    return items.map((item) => {
      const title = formatItem(item, ['position', 'title', 'role']);
      const company = formatItem(item, ['company_name', 'company', 'employer']);
      const period = formatPeriod(item);
      const description = formatItem(item, ['duties', 'description', 'summary']);
      return `
        <div class="section-block">
          <div class="section-heading">
            <div>
              <h3>${title}</h3>
              <p class="subtext">${company}</p>
            </div>
            <span class="meta">${period}</span>
          </div>
          <p class="text">${description}</p>
        </div>
      `;
    }).join('');
  };

  const renderEducation = (items: any[]) => {
    if (!items || items.length === 0) return '<p class="text">No education history available.</p>';
    return items.map((item) => {
      const place = formatItem(item, ['school', 'institution', 'university']);
      const major = formatItem(item, ['major', 'field_of_study', 'program']);
      const year = safeString(item.graduation_year || item.end_year || item.year || '-');
      const degree = formatItem(item, ['level', 'degree']);
      return `
        <div class="section-block">
          <div class="section-heading">
            <div>
              <h3>${place}</h3>
              <p class="subtext">${major}</p>
            </div>
            <span class="meta">${year}</span>
          </div>
          <p class="text">${degree}</p>
        </div>
      `;
    }).join('');
  };

  const renderFamilyMembers = (items: any[]) => {
    if (!items || items.length === 0) return '<li>-</li>';
    return items.map((member) => `<li>${safeString(member.name || member.nama)} – ${safeString(member.relation || member.hubungan || member.relationship)}</li>`).join('');
  };

  const renderReferences = (items: any[]) => {
    if (!items || items.length === 0) return '<li>-</li>';
    return items.map((ref) => `<li>${safeString(ref.name)} – ${safeString(ref.position)} – ${safeString(ref.contact)}</li>`).join('');
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume - ${safeString(candidate.full_name)}</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f3f4f6; color: #0f172a; }
    .page { max-width: 960px; margin: 0 auto; padding: 32px; }
    .card { background: #ffffff; border-radius: 28px; box-shadow: 0 20px 60px rgba(15, 23, 42, .08); border: 1px solid #e2e8f0; overflow: hidden; }
    .topbar { background: #0f172a; color: #f8fafc; padding: 28px 32px; display: flex; flex-wrap: wrap; gap: 24px; align-items: center; justify-content: space-between; }
    .topbar h1 { margin: 0; font-size: 34px; line-height: 1.1; }
    .topbar p { margin: 8px 0 0; color: #cbd5e1; }
    .topbar .contact { font-size: 14px; color: #cbd5e1; }
    .container { display: grid; gap: 24px; grid-template-columns: 1fr 320px; margin-top: 24px; }
    .sidebar { padding: 28px; background: #0f172a; border-radius: 24px; color: #e2e8f0; }
    .sidebar h3 { margin: 0 0 12px; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #94a3b8; }
    .sidebar ul { list-style: none; margin: 0; padding: 0; }
    .sidebar li { margin-bottom: 10px; font-size: 14px; color: #cbd5e1; }
    .sidebar .tag { display: inline-flex; background: #1e3a8a; color: white; border-radius: 9999px; padding: 6px 12px; font-size: 12px; margin: 4px 4px 0 0; }
    .content { padding: 28px 0 0; }
    .section { margin-bottom: 32px; }
    .section-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: .2em; color: #334155; }
    .section-heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .section-heading h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .subtext { margin: 4px 0 0; font-size: 14px; color: #64748b; }
    .meta { font-size: 13px; color: #475569; white-space: nowrap; }
    .text { margin: 14px 0 0; line-height: 1.8; color: #475569; font-size: 14px; }
    .details-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .detail { font-size: 14px; color: #475569; }
    .detail strong { display: block; color: #0f172a; margin-bottom: 4px; }
    .section-block { padding: 16px 0; border-bottom: 1px solid #e2e8f0; }
    .section-block:last-child { border-bottom: none; }
    @media print { body { background: white; } .page { box-shadow: none; margin: 0; padding: 16px; } .no-print { display: none !important; } }
    @media (max-width: 900px) { .container { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="topbar">
        <div>
          <h1>${safeString(candidate.full_name)}</h1>
          <p>${safeString(candidate.current_position || candidate.current_company || 'Professional Candidate')}</p>
        </div>
        <div class="contact">
          <div>${contact.email}</div>
          <div>${contact.phone}</div>
          <div>${contact.location}</div>
          <div>${contact.website}</div>
        </div>
      </div>
      <div class="container">
        <div class="content">
          <div class="section">
            <p class="section-title">Summary</p>
            <p class="text">${safeString(candidate.bio || candidate.additional_info || 'A motivated professional with a strong background and readiness to contribute immediately to the team.')}</p>
          </div>

          <div class="section">
            <p class="section-title">Work Experience</p>
            ${renderWork(workExperience)}
          </div>

          <div class="section">
            <p class="section-title">Education</p>
            ${renderEducation(educationHistory)}
          </div>

          <div class="section">
            <p class="section-title">Additional Information</p>
            <div class="details-grid">
              <div class="detail"><strong>Expected Salary</strong>${safeString(candidate.expected_salary)}</div>
              <div class="detail"><strong>Available Start</strong>${safeString(candidate.available_start_date)}</div>
              <div class="detail"><strong>Relocate</strong>${candidate.willing_to_relocate ? 'Yes' : 'No'}</div>
              <div class="detail"><strong>Negotiable</strong>${candidate.salary_negotiable ? 'Yes' : 'No'}</div>
            </div>
            <p class="text">${safeString(candidate.strengths || 'No additional strengths provided.')}</p>
          </div>

          <div class="section">
            <p class="section-title">Family & References</p>
            <div class="section-block">
              <h3 class="subtext">Family Members</h3>
              <ul>${renderFamilyMembers(familyMembers)}</ul>
            </div>
            <div class="section-block">
              <h3 class="subtext">References</h3>
              <ul>${renderReferences(references)}</ul>
            </div>
          </div>
        </div>

        <aside class="sidebar">
          <div>
            <h3>Personal Details</h3>
            <ul>
              <li><strong>Birth Date:</strong> ${safeString(candidate.birth_date)}</li>
              <li><strong>Birth Place:</strong> ${safeString(candidate.birth_place)}</li>
              <li><strong>Gender:</strong> ${safeString(candidate.gender)}</li>
              <li><strong>Marital Status:</strong> ${safeString(candidate.marital_status)}</li>
              <li><strong>Religion:</strong> ${safeString(candidate.religion)}</li>
              <li><strong>Nationality:</strong> ${safeString(candidate.nationality)}</li>
              <li><strong>Height:</strong> ${safeString(candidate.height)}</li>
              <li><strong>Weight:</strong> ${safeString(candidate.weight)}</li>
              <li><strong>Blood Type:</strong> ${safeString(candidate.blood_type)}</li>
              <li><strong>ID:</strong> ${safeString(candidate.id_card_number || candidate.nik)}</li>
            </ul>
          </div>

          <div>
            <h3>Skills</h3>
            <div>${renderSkills(skills)}</div>
          </div>

          <div>
            <h3>Languages</h3>
            <ul>${renderList(languages)}</ul>
          </div>

          <div>
            <h3>Certifications</h3>
            <ul>${renderList(certifications)}</ul>
          </div>

          <div>
            <h3>Hobbies</h3>
            <ul>${renderList(hobbies)}</ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export default function ProfessionalResume({ candidate, onClose }: ProfessionalResumeProps) {
  const contact = parseContact(candidate);
  const skills = safeArray(candidate.skills).map((skill: any) => {
    if (!skill) return '-';
    return typeof skill === 'string' ? skill : skill.name || skill.skill || String(skill);
  });
  const languages = safeArray(candidate.languages).map((language: any) => (typeof language === 'string' ? language : language.name || language.language || String(language)));
  const certifications = safeArray(candidate.certifications).map((cert: any) => (typeof cert === 'string' ? cert : cert.name || String(cert)));
  const workExperience = safeArray(candidate.work_experience);
  const educationHistory = safeArray(candidate.education_history);
  const familyMembers = safeArray(candidate.family_members);
  const hobbies = safeArray(candidate.hobbies).map((hobby: any) => (typeof hobby === 'string' ? hobby : hobby.name || String(hobby)));
  const references = safeArray(candidate.references);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const html = buildResumeHtml(candidate, contact, skills, languages, certifications, hobbies, workExperience, educationHistory, familyMembers, references);
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
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Contact</h3>
                  <ul className="resume-list mt-4 space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" /> {contact.email}</li>
                    <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /> {contact.phone}</li>
                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {contact.location}</li>
                    <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-500" /> {contact.website}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Key Skills</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((skill, index) => (
                      <span key={index} className="badge">{skill}</span>
                    )) : (
                      <p className="text-sm text-slate-500">No skills listed.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Languages</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {languages.length > 0 ? languages.map((language, index) => (
                      <li key={index}>{language}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Certifications</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {certifications.length > 0 ? certifications.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Hobbies</h3>
                  <ul className="resume-list mt-4 text-sm text-slate-300">
                    {hobbies.length > 0 ? hobbies.map((hobby, index) => (
                      <li key={index}>{hobby}</li>
                    )) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
              </div>
            </aside>

            <main className="space-y-6">
              <section className="card">
                <p className="section-title">Professional Summary</p>
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{candidate.full_name || 'Candidate Name'}</h2>
                    <p className="mt-2 text-sm text-slate-500">{candidate.current_position || candidate.current_company || 'Professional Candidate'}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{calculateAge(candidate.birth_date)}</p>
                    <p>{safeString(candidate.gender)}</p>
                  </div>
                </div>
                <div className="mt-6 text-slate-700 leading-7 whitespace-pre-line">
                  {candidate.bio || candidate.additional_info || 'A motivated professional with a strong background and readiness to contribute immediately to the team.'}
                </div>
              </section>

              <section className="card">
                <p className="section-title">Personal Details</p>
                <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-700">
                  <div><strong>Birth Date</strong><p>{safeString(candidate.birth_date)}</p></div>
                  <div><strong>Birth Place</strong><p>{safeString(candidate.birth_place)}</p></div>
                  <div><strong>Gender</strong><p>{safeString(candidate.gender)}</p></div>
                  <div><strong>Marital Status</strong><p>{safeString(candidate.marital_status)}</p></div>
                  <div><strong>Religion</strong><p>{safeString(candidate.religion)}</p></div>
                  <div><strong>Nationality</strong><p>{safeString(candidate.nationality)}</p></div>
                  <div><strong>Height</strong><p>{safeString(candidate.height)}</p></div>
                  <div><strong>Weight</strong><p>{safeString(candidate.weight)}</p></div>
                  <div><strong>Blood Type</strong><p>{safeString(candidate.blood_type)}</p></div>
                </div>
              </section>

              <section className="card">
                <p className="section-title">Work Experience</p>
                <div className="space-y-5 mt-5">
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
                  <div><strong>Expected Salary</strong><p>{safeString(candidate.expected_salary)}</p></div>
                  <div><strong>Available Start</strong><p>{safeString(candidate.available_start_date)}</p></div>
                  <div><strong>Relocate</strong><p>{candidate.willing_to_relocate ? 'Yes' : 'No'}</p></div>
                  <div><strong>Salary Negotiable</strong><p>{candidate.salary_negotiable ? 'Yes' : 'No'}</p></div>
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
