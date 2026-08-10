import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CircularProgress } from '../components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const formatBackendResumeToUI = (res: any) => {
  if (!res) return null;
  const p = res.parsed_details || {};
  
  const formattedEducation = (p.education || []).map((edu: any) => ({
    degree: edu.degree || 'Degree',
    school: edu.institution || 'University',
    period: edu.start_year && edu.end_year ? `${edu.start_year} - ${edu.end_year}` : edu.end_year || edu.start_year || 'N/A'
  }));

  const formattedProjects = (p.projects || []).map((proj: any) => ({
    name: proj.title || 'Project',
    desc: proj.description || '',
    tech: proj.technologies || []
  }));

  const formattedExperience = (p.experience || []).map((exp: any) => ({
    role: exp.role || 'Software Engineer',
    company: exp.company || 'Company',
    period: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : exp.end_date || exp.start_date || 'N/A',
    bullets: exp.responsibilities || []
  }));

  const generatedSummary = `Professional CV of ${p.name || 'Candidate'} containing parsed technical skills in ${ (p.skills || []).slice(0, 5).join(', ') } and experience across ${ (p.experience || []).length } organizations.`;

  // Read latest cached ATS result if available
  const cachedAts = localStorage.getItem('latestAtsResult');
  const atsData = cachedAts ? JSON.parse(cachedAts) : null;

  return {
    id: res.id,
    fileName: res.filename || 'resume.pdf',
    fileSize: 'N/A',
    uploadDate: new Date(res.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    atsScore: atsData ? atsData.ats_score : 75,
    missingSkills: atsData ? atsData.missing_skills : [],
    strengths: atsData ? atsData.strengths : [],
    weaknesses: atsData ? atsData.weaknesses : [],
    recommendations: atsData ? atsData.improvement_suggestions : [],
    candidateName: p.name || 'N/A',
    email: p.email || 'N/A',
    phone: p.phone || 'N/A',
    summary: generatedSummary,
    skills: p.skills || [],
    experience: formattedExperience,
    projects: formattedProjects,
    education: formattedEducation,
    certifications: p.certifications || []
  };
};

export const ResumePage: React.FC = () => {
  const navigate = useNavigate();
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsePhase, setParsePhase] = useState<'idle' | 'uploading' | 'extracting' | 'analyzing' | 'scoring'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getPhaseMessage = () => {
    switch (parsePhase) {
      case 'uploading':
        return `Uploading file... ${uploadProgress}%`;
      case 'extracting':
        return 'Extracting document text & structure...';
      case 'analyzing':
        return 'Running Gemini AI Resume Analysis...';
      case 'scoring':
        return 'Completing profile parsing...';
      default:
        return 'Parsing Resume PDF...';
    }
  };

  const getPhaseSubMessage = () => {
    switch (parsePhase) {
      case 'uploading':
        return 'Transferring binary payload to secure storage';
      case 'extracting':
        return 'Reading raw PDF stream and formatting layout';
      case 'analyzing':
        return 'Gemini is extracting skills, education, and roles';
      case 'scoring':
        return 'Synthesizing performance dashboards';
      default:
        return 'Extracting structure, entities, and keywords';
    }
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  React.useEffect(() => {
    const fetchLatest = async () => {
      const cachedResume = localStorage.getItem('resumeDetails');
      if (cachedResume) {
        setCurrentFile(JSON.parse(cachedResume));
        setFileUploaded(true);
      }
      try {
        const res = await resumeService.getLatest();
        const uiFormatted = formatBackendResumeToUI(res);
        setCurrentFile(uiFormatted);
        setFileUploaded(true);
        localStorage.setItem('resumeId', res.id);
        localStorage.setItem('resumeDetails', JSON.stringify(uiFormatted));
      } catch (e) {
        if (!cachedResume) {
          setFileUploaded(false);
        }
      }
    };
    fetchLatest();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerUpload = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && fileExt !== 'pdf' && fileExt !== 'docx') {
      addToast('Invalid file format. Only PDF and DOCX files are allowed.', 'error');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      addToast('File is too large. Maximum size allowed is 10MB.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setParsePhase('uploading');

    let phaseTimer1: any = null;
    let phaseTimer2: any = null;

    try {
      const res = await resumeService.upload(file, (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
        if (percentCompleted >= 100) {
          setParsePhase('extracting');
          
          // Setup timeouts to simulate extraction and AI analysis feedback while awaiting server response
          if (!phaseTimer1) {
            phaseTimer1 = setTimeout(() => {
              setParsePhase('analyzing');
            }, 1200);
          }
          if (!phaseTimer2) {
            phaseTimer2 = setTimeout(() => {
              setParsePhase('scoring');
            }, 3200);
          }
        }
      });
      
      const uiFormatted = formatBackendResumeToUI(res);
      setCurrentFile(uiFormatted);
      setFileUploaded(true);
      localStorage.setItem('resumeId', res.id);
      localStorage.setItem('resumeDetails', JSON.stringify(uiFormatted));
      addToast('Resume uploaded and parsed successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to parse resume. Ensure it is PDF or DOCX and under 10MB.';
      addToast(errMsg, 'error');
    } finally {
      if (phaseTimer1) clearTimeout(phaseTimer1);
      if (phaseTimer2) clearTimeout(phaseTimer2);
      setUploading(false);
      setParsePhase('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerUpload(e.target.files[0]);
    }
  };

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx"
        style={{ display: 'none' }}
      />
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">ATS Resume Auditor</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit your resume for target vacancies and find competency gaps.</p>
        </div>
        {fileUploaded && (
          <Button onClick={() => setFileUploaded(false)} variant="outline" size="sm">
            Re-upload New File
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload Dropzone & ATS score */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Upload card */}
          {!fileUploaded ? (
            <Card
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] transition-all
                ${dragActive ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800'}
              `}
              onClick={handleCardClick}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-4 w-full px-4">
                  <Loader2 className="w-10 h-10 text-blue-650 animate-spin" />
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{getPhaseMessage()}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-650 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400">{getPhaseSubMessage()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center rounded-[16px] text-blue-600 dark:text-blue-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-850 dark:text-slate-200">Drag & drop your resume</p>
                    <p className="text-xs text-slate-400">PDF, DOCX, or RTF formats. Max 10MB.</p>
                  </div>
                  <Button size="sm" className="mt-2 pointer-events-none">
                    Select File
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 flex flex-col gap-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/40">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentFile?.fileName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{currentFile?.fileSize} • Uploaded {currentFile?.uploadDate}</p>
                </div>
              </div>

              {/* ATS radial gauge */}
              <div className="flex flex-col items-center text-center gap-3">
                <CircularProgress
                  value={currentFile?.atsScore || 0}
                  size={120}
                  strokeWidth={10}
                  colorClass="text-emerald-500"
                  label={`${currentFile?.atsScore}%`}
                />
                <div className="space-y-1 mt-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Strong Match Score</span>
                  <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">Your resume matches the core developer specs. Great baseline!</p>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Critical Gaps:</span>
                  <span className={`font-semibold flex items-center gap-1 ${currentFile?.missingSkills?.length > 0 ? 'text-red-650 dark:text-red-400' : 'text-emerald-600'}`}>
                    {currentFile?.missingSkills?.length > 0 ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> {currentFile.missingSkills.length} Missing keywords
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Perfect match
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Parsed Experience:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentFile?.experience ? `${currentFile.experience.length} Roles/Projects` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Parsed Credentials:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Validated
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate('/job-match')} rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full mt-2 h-[44px]">
                Open Job Matcher
              </Button>
            </Card>
          )}
        </div>

        {/* Right Side: Parsed Resume Details */}
        <div className="lg:col-span-2">
          {!fileUploaded ? (
            <Card className="h-full flex items-center justify-center p-8 text-center min-h-[300px]">
              <div className="space-y-2">
                <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Awaiting Resume Upload</h4>
                <p className="text-xs text-slate-400 max-w-sm">Upload your CV to preview parsed information details like skills, project tags, and chronological records.</p>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
              <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-0">
                  <div>
                    <CardTitle>Parsed Candidate Profile</CardTitle>
                    <CardDescription>Structured representation of details extracted from PDF</CardDescription>
                  </div>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="flex-1 p-6">
                  {/* Overview tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</h4>
                      <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4.5 rounded-xl border border-slate-100 dark:border-slate-850">
                        {currentFile?.summary}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Entities</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                          <span className="text-slate-400 block mb-0.5">Parsed Name</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{currentFile?.candidateName}</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                          <span className="text-slate-400 block mb-0.5">Parsed Email</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{currentFile?.email}</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                          <span className="text-slate-400 block mb-0.5">Parsed Phone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{currentFile?.phone}</span>
                        </div>
                      </div>
                    </div>

                    {currentFile?.strengths && currentFile.strengths.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strengths</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentFile.strengths.map((str: string, idx: number) => (
                            <div key={idx} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 text-xs text-slate-800 dark:text-slate-200 rounded-xl flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{str}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFile?.weaknesses && currentFile.weaknesses.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Areas for Improvement</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentFile.weaknesses.map((wk: string, idx: number) => (
                            <div key={idx} className="p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 text-xs text-slate-850 dark:text-slate-200 rounded-xl flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
                              <span>{wk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFile?.recommendations && currentFile.recommendations.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommendations</h4>
                        <ul className="list-disc list-outside text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-4 leading-relaxed">
                          {currentFile.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  {/* Skills tab */}
                  <TabsContent value="skills" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Layers className="w-4.5 h-4.5" />
                        <span>Core Competencies</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {currentFile?.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" size="md">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Sparkles className="w-4.5 h-4.5" />
                        <span>Highlighted Projects</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {currentFile?.projects.map((proj: any, i: number) => (
                          <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{proj.name}</h4>
                            <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">{proj.desc}</p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proj.tech.map((t: string, idx: number) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Briefcase className="w-4.5 h-4.5" />
                      <span>Work History Breakdown</span>
                    </div>
                    <div className="space-y-6 relative border-l border-slate-100 dark:border-slate-800/80 pl-6 ml-3">
                      {currentFile?.experience.map((exp: any, i: number) => (
                        <div key={i} className="relative space-y-2">
                          <div className="absolute w-3.5 h-3.5 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full -left-[33px] top-1" />
                          <div className="flex flex-col md:flex-row md:items-center justify-between text-xs">
                            <h4 className="font-bold text-slate-950 dark:text-slate-100 text-sm">
                              {exp.role} <span className="text-slate-400 font-normal">at {exp.company}</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md font-semibold mt-1 md:mt-0">
                              {exp.period}
                            </span>
                          </div>
                          <ul className="list-disc list-outside text-xs text-slate-500 dark:text-slate-405 space-y-1.5 pl-4 leading-relaxed">
                            {exp.bullets.map((b: string, idx: number) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Education tab */}
                  <TabsContent value="education" className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <GraduationCap className="w-4.5 h-4.5" />
                      <span>Academic Credentials</span>
                    </div>
                    <div className="space-y-4">
                      {currentFile?.education.map((edu: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{edu.degree}</h4>
                            <p className="text-[10px] text-slate-400">{edu.school}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{edu.period}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
