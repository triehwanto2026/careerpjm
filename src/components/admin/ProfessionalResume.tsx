import React from 'react';
import { Printer, Download, X, User, MapPin, Phone, Mail, Globe, Briefcase, GraduationCap, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  return String(value);
};

const parseSkills = (skills: any) => {
  const list = safeArray(skills);
  return list.map((skill: any) => {
    if (!skill) return '-';
    return typeof skill === 'string' ? skill : skill.name || skill.skill || String(skill);
  });
};

const parseWorkExperience = (workExperience: any) => {
  if (!workExperience) return [];
  if (Array.isArray(workExperience)) return workExperience;
  if (typeof workExperience === 'string') {
    try {
      return JSON.parse(workExperience);
    } catch {
      return [];
    }
  }
  return [];
};

const parseEducation = (education: any) => {
  if (!education) return [];
  if (Array.isArray(education)) return education;
  if (typeof education === 'string') {
    try {
      return JSON.parse(education);
    } catch {
      return [];
    }
  }
  return [];
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
  const skills = parseSkills(candidate.skills);
  const workExperience = parseWorkExperience(candidate.work_experience);
  const educationHistory = parseEducation(candidate.education_history);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('professional-resume-content')?.innerHTML;
    if (!content) return;

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Resume - ${safeString(candidate.full_name)}</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;} .page{max-width:900px;margin:0 auto;padding:32px;background:#fff;} .section{margin-bottom:32px;} .title{margin:0;font-size:32px;} .subtitle{margin:8px 0 0;color:#475569;} .divider{height:1px;background:#e2e8f0;margin:24px 0;} .pill{display:inline-block;background:#e2e8f0;color:#475569;border-radius:9999px;padding:6px 12px;margin:0 8px 8px 0;font-size:13px;}</style></head><body><div class="page">${content}</div></body></html>`;
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resume Preview</p>
            <h1 className="text-2xl font-semibold">{candidate.full_name || 'Nama Kandidat'}</h1>
            <p className="mt-1 text-sm text-slate-300">{candidate.current_position || candidate.current_company || 'Professional Candidate'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handlePrint} className="bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={onClose} variant="ghost" className="text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto bg-slate-100 p-8" id="professional-resume-content">
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="space-y-6 rounded-[32px] bg-slate-950 p-8 text-slate-100">
              <div className="space-y-4 text-center">
                <div className="mx-auto h-28 w-28 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  {candidate.photo_url ? (
                    <img src={candidate.photo_url} alt={candidate.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Contact</p>
                  <p className="text-lg font-semibold text-white">{candidate.email || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Personal</h2>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{candidate.email || '-'}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{candidate.phone || '-'}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{candidate.address || '-'}</div>
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" />{candidate.portfolio_url || candidate.website || '-'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map((skill, index) => (
                    <span key={index} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{skill}</span>
                  )) : (
                    <p className="text-sm text-slate-400">No skills available</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Strengths</h2>
                <p className="text-sm leading-6 text-slate-300 whitespace-pre-line">{candidate.strengths || 'No summary provided.'}</p>
              </div>
            </aside>

            <main className="space-y-6">
              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Summary</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Professional Summary</h2>
                <p className="mt-5 text-sm leading-7 text-slate-700">{candidate.bio || candidate.additional_info || 'A strong candidate with valuable experience and competencies.'}</p>
              </section>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Experience</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-900">Work Experience</h2>
                  </div>
                  <span className="text-sm text-slate-500">{workExperience.length} entries</span>
                </div>
                <div className="mt-6 space-y-5">
                  {workExperience.length > 0 ? workExperience.map((item: any, index: number) => (
                    <article key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{safeString(item.position || item.title || item.role)}</h3>
                          <p className="text-sm text-slate-600">{safeString(item.company_name || item.company || item.employer)}</p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">{safeString(item.period || item.duration || `${item.start_date || '-'} - ${item.end_date || '-'}`)}</span>
                      </div>
                      {item.duties && <p className="mt-4 text-sm text-slate-700 whitespace-pre-line">{safeString(item.duties)}</p>}
                    </article>
                  )) : (
                    <p className="text-sm text-slate-500">Work experience data is not available.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Education</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-900">Academic Background</h2>
                  </div>
                  <span className="text-sm text-slate-500">{educationHistory.length} entries</span>
                </div>
                <div className="mt-6 space-y-4">
                  {educationHistory.length > 0 ? educationHistory.map((item: any, index: number) => (
                    <article key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{safeString(item.school || item.institution || item.university)}</h3>
                          <p className="text-sm text-slate-600">{safeString(item.major || item.field_of_study || item.program)}</p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">{safeString(item.graduation_year || item.end_year || item.year)}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{safeString(item.level || item.degree || 'Education Record')}</p>
                    </article>
                  )) : (
                    <p className="text-sm text-slate-500">Education history is not available.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Additional Info</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-900">Details</h2>
                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                      <div className="grid grid-cols-2 gap-3">
                        <span className="font-medium text-slate-800">Expected Salary</span>
                        <span>{safeString(candidate.expected_salary)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <span className="font-medium text-slate-800">Available Start</span>
                        <span>{safeString(candidate.available_start_date)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <span className="font-medium text-slate-800">Willing to Relocate</span>
                        <span>{candidate.willing_to_relocate ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Core Strengths</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-900">Highlights</h2>
                    <p className="mt-5 text-sm leading-7 text-slate-700 whitespace-pre-line">{safeString(candidate.strengths || candidate.additional_info || 'No additional information was provided.')}</p>
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
