import React from 'react';
import { Printer, Download, X, User, MapPin, Phone, Mail, Calendar, Briefcase, GraduationCap, Award, Globe, Heart, Home, Car, CreditCard, FileText, Building2, Star, Target, Languages, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfessionalResumeProps {
  candidate: any; // Using any to accept CandidateProfile directly
  onClose: () => void;
}

export default function ProfessionalResume({ candidate, onClose }: ProfessionalResumeProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Professional Resume - ${candidate.full_name || 'Candidate'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Times+New+Roman:wght@400;700&display=swap" rel="stylesheet">
            <style>
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
                .font-serif { font-family: 'Times New Roman', serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
              }
              .font-serif { font-family: 'Times New Roman', serif; }
              .font-sans { font-family: 'Inter', sans-serif; }
              .table-border { border: 1px solid #374151; }
              .table-cell { border: 1px solid #374151; padding: 8px; }
              .header-gradient { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
            </style>
          </head>
          <body class="bg-gray-50 font-sans">
            <div class="max-w-4xl mx-auto bg-white shadow-lg">
              ${document.getElementById('professional-resume-content')?.innerHTML || ''}
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

  // Parse skills data
  const parseSkills = (skills: any) => {
    if (!skills) return [];
    if (typeof skills === 'string') {
      return skills.split(',').map(s => ({ name: s.trim(), level: 'Intermediate' }));
    }
    if (Array.isArray(skills)) {
      return skills.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, level: 'Intermediate' };
        }
        return { name: skill.name || skill.skill || '-', level: skill.level || 'Intermediate' };
      });
    }
    return [];
  };

  // Parse family members
  const parseFamilyMembers = (members: any) => {
    if (!members || !Array.isArray(members)) return [];
    return members.map(member => ({
      relationship: member.relationship || member.hubungan || '-',
      name: member.name || member.nama || '-',
      occupation: member.occupation || member.pekerjaan || '-',
      age: member.age || member.usia || '-',
      education: member.education || member.pendidikan || '-'
    }));
  };

  // Parse education history
  const parseEducation = (education: any) => {
    if (!education || !Array.isArray(education)) return [];
    return education.map(edu => ({
      level: edu.level || edu.tingkat || '-',
      school: edu.school || edu.sekolah || '-',
      major: edu.major || edu.jurusan || '-',
      graduation_year: edu.graduation_year || edu.tahun || '-',
      status: edu.status || '-'
    }));
  };

  // Parse work experience
  const parseWorkExperience = (work: any) => {
    if (!work || !Array.isArray(work)) return [];
    return work.map(exp => ({
      company: exp.company_name || exp.perusahaan || '-',
      position: exp.position_start || exp.jabatan || '-',
      period: exp.period || exp.periode || '-',
      salary: exp.salary || exp.gaji || '-',
      duties: exp.duties || exp.tugas || '-',
      achievements: exp.achievements || exp.prestasi || '-',
      resignation_reason: exp.resignation_reason || exp.alasan || '-'
    }));
  };

  const skills = parseSkills(candidate.skills);
  const familyMembers = parseFamilyMembers(candidate.family_members);
  const education = parseEducation(candidate.education_history);
  const workExperience = parseWorkExperience(candidate.work_experience);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[98vh] overflow-hidden">
        {/* Header with controls */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold">Professional Resume Preview</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="bg-white text-gray-900 hover:bg-gray-100">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-gray-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resume Content */}
        <div className="overflow-y-auto max-h-[90vh] bg-white">
          <div id="professional-resume-content" className="font-sans">
            {/* Professional Header */}
            <div className="header-gradient text-white p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6">
                  {/* Photo */}
                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                    {candidate.photo_url ? (
                      <img 
                        src={candidate.photo_url} 
                        alt={candidate.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  
                  {/* Name and Title */}
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold font-serif mb-2">
                      {candidate.full_name || 'Candidate Name'}
                    </h1>
                    <p className="text-xl font-medium mb-4 text-blue-100">
                      {candidate.current_position || 'Professional'}
                    </p>
                    
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{candidate.email || 'email@example.com'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone || '+62 000-0000-0000'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.address || 'City, Country'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto p-8 space-y-8">
              {/* Personal Information */}
              <section>
                <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Personal Information
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell w-1/3 bg-gray-100 font-semibold text-gray-700">Full Name</td>
                        <td className="table-cell">{candidate.full_name || '-'}</td>
                        <td className="table-cell w-1/3 bg-gray-100 font-semibold text-gray-700">Gender</td>
                        <td className="table-cell">{candidate.gender || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Birth Place</td>
                        <td className="table-cell">{candidate.birth_place || '-'}</td>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Birth Date</td>
                        <td className="table-cell">{candidate.birth_date || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Age</td>
                        <td className="table-cell">{calculateAge(candidate.birth_date || '')} years</td>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Marital Status</td>
                        <td className="table-cell">{candidate.marital_status || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Height</td>
                        <td className="table-cell">{candidate.height || '-'} cm</td>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Weight</td>
                        <td className="table-cell">{candidate.weight || '-'} kg</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Blood Type</td>
                        <td className="table-cell">{candidate.blood_type || '-'}</td>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Religion</td>
                        <td className="table-cell">{candidate.religion || '-'}</td>
                      </tr>
                      <tr>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">ID Card Number</td>
                        <td className="table-cell">{candidate.id_card_number || '-'}</td>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Vehicle</td>
                        <td className="table-cell">{candidate.vehicle_type || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Complete Address */}
              <section>
                <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="w-6 h-6 text-blue-600" />
                  Address Information
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {candidate.address || 'No address provided'}
                  </p>
                </div>
              </section>

              {/* Family Members */}
              {familyMembers.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Family Members
                  </h2>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="table-cell text-left font-semibold text-gray-700">Relationship</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Name</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Age</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Education</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Occupation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyMembers.map((member, index) => (
                          <tr key={index} className="border-b border-gray-200 last:border-b-0">
                            <td className="table-cell">{member.relationship}</td>
                            <td className="table-cell">{member.name}</td>
                            <td className="table-cell">{member.age}</td>
                            <td className="table-cell">{member.education}</td>
                            <td className="table-cell">{member.occupation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Education History */}
              {education.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    Education History
                  </h2>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="table-cell text-left font-semibold text-gray-700">Level</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Institution</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Major</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Year</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {education.map((edu, index) => (
                          <tr key={index} className="border-b border-gray-200 last:border-b-0">
                            <td className="table-cell font-medium">{edu.level}</td>
                            <td className="table-cell">{edu.school}</td>
                            <td className="table-cell">{edu.major}</td>
                            <td className="table-cell">{edu.graduation_year}</td>
                            <td className="table-cell">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                edu.status === 'Lulus' || edu.status === 'Graduated' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {edu.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Professional Skills */}
              {skills.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" />
                    Professional Skills
                  </h2>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="table-cell text-left font-semibold text-gray-700 w-12">No</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Skill</th>
                          <th className="table-cell text-left font-semibold text-gray-700">Proficiency Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skills.map((skill, index) => (
                          <tr key={index} className="border-b border-gray-200 last:border-b-0">
                            <td className="table-cell text-center font-medium">{index + 1}</td>
                            <td className="table-cell font-medium">{skill.name}</td>
                            <td className="table-cell">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {skill.level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Work Experience */}
              {workExperience.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    Work Experience
                  </h2>
                  <div className="space-y-4">
                    {workExperience.map((work, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-4 border-b border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900">{work.company}</h3>
                          <p className="text-gray-600">{work.position}</p>
                          <p className="text-sm text-gray-500 mt-1">{work.period}</p>
                        </div>
                        <div className="p-4">
                          <table className="w-full">
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="table-cell w-1/3 bg-gray-50 font-semibold text-gray-700">Salary</td>
                                <td className="table-cell">{work.salary}</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="table-cell bg-gray-50 font-semibold text-gray-700">Resignation Reason</td>
                                <td className="table-cell">{work.resignation_reason}</td>
                              </tr>
                              <tr>
                                <td className="table-cell bg-gray-50 font-semibold text-gray-700 align-top">Duties & Responsibilities</td>
                                <td className="table-cell">
                                  <p className="text-gray-700 whitespace-pre-line">{work.duties}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {work.achievements && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="font-semibold text-gray-700 mb-2">Key Achievements</h4>
                              <p className="text-gray-700 whitespace-pre-line">{work.achievements}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Additional Information */}
              <section>
                <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Additional Information
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell w-1/3 bg-gray-100 font-semibold text-gray-700">Expected Salary</td>
                        <td className="table-cell">{candidate.expected_salary || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Available From</td>
                        <td className="table-cell">{candidate.available_start_date || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700">Willing to Relocate</td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            candidate.willing_to_relocate 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {candidate.willing_to_relocate ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="table-cell bg-gray-100 font-semibold text-gray-700 align-top">Strengths</td>
                        <td className="table-cell">
                          <p className="text-gray-700 whitespace-pre-line">{candidate.strengths || '-'}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Declaration */}
              <section className="border-t-2 border-gray-300 pt-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold font-serif text-gray-900 mb-4">Declaration</h2>
                  <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                    I hereby declare that all the information provided above is true and correct to the best of my knowledge. 
                    I understand that any false information may lead to disqualification of my application.
                  </p>
                  
                  <div className="mt-12">
                    <p className="text-gray-600 mb-2">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="h-20"></div>
                    <p className="font-bold text-gray-900 border-t-2 border-gray-300 pt-2 inline-block">
                      {candidate.full_name || 'Candidate Name'}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">Signature</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
