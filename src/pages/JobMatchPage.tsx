import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CircularProgress } from '../components/ui/Progress';
import { Input } from '../components/ui/Input';
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Loader2,
  Bookmark
} from 'lucide-react';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const JobMatchPage: React.FC = () => {
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<{ stage: string; topic: string; duration: string; status: 'todo' | 'active' }[]>([]);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id != id));
  };

  const jobTemplates = [
    {
      title: 'Senior Frontend Engineer (Vercel)',
      desc: 'Looking for a developer with expertise in React, Next.js, and Framer Motion. Knowledge of Webpack optimization, state management, and accessibility (A11y) is key. Experience with GraphQL API integration is a major plus.',
    },
    {
      title: 'Staff Full Stack Developer (Linear)',
      desc: 'Requirements: Strong typescript, Node.js, Postgres, and Docker. Experience with microservices, Redis caching, system database partitioning, and sharding. Excellent communication skills.',
    }
  ];

  const runAnalysis = async (jdText: string) => {
    const resumeId = localStorage.getItem('resumeId');
    if (!resumeId) {
      addToast('No resume found. Please upload a resume in the Resume Builder first!', 'error');
      return;
    }

    setLoading(true);
    setAnalyzed(false);

    try {
      const jobRes = await jobService.analyze(jdText);
      localStorage.setItem('latestJobId', jobRes.id);
      const atsRes = await resumeService.calculateATS(resumeId, jobRes.id);
      localStorage.setItem('latestAtsResult', JSON.stringify(atsRes));

      setMatchScore(atsRes.ats_score);
      setMissingSkills(atsRes.missing_skills || []);
      setStrengths(atsRes.strengths || []);
      setWeaknesses(atsRes.weaknesses || []);

      const mappedRoadmap = (atsRes.improvement_suggestions || []).map((suggestion: string, idx: number) => ({
        stage: `Step ${idx + 1}`,
        topic: suggestion,
        duration: idx === 0 ? 'Immediate focus' : '1-2 weeks',
        status: idx === 0 ? 'active' as const : 'todo' as const,
      }));
      setRoadmap(mappedRoadmap);
      setAnalyzed(true);
      addToast('ATS compatibility analyzed successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to complete job compatibility audit.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: typeof jobTemplates[0]) => {
    setJobDesc(template.desc);
    runAnalysis(template.desc);
  };

  const handleManualAnalyze = () => {
    if (!jobDesc.trim()) return;
    runAnalysis(jobDesc);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Job Match Analyzer</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cross-check your resume capabilities against target descriptions to view custom study roadmaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Resume Stats & Results */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Analysis Dashboard</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed -mt-3">
              Matches are computed based on skills tags, years of experience, and summary statements extracted from your CV.
            </p>

            <div className="flex flex-col items-center text-center gap-2 border-y border-slate-100 dark:border-slate-800/80 py-6">
              <CircularProgress
                value={matchScore}
                size={120}
                strokeWidth={10}
                colorClass={matchScore >= 80 ? 'text-emerald-500' : matchScore >= 60 ? 'text-blue-600' : 'text-amber-500'}
                label={`${matchScore}%`}
              />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">Overall Match Ratio</span>
            </div>

            {/* Missing Skills Tags */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Identified Gaps</h4>
              {analyzed && missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((skill, i) => (
                    <Badge key={i} variant="danger" size="md" className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {skill}
                    </Badge>
                  ))}
                </div>
              ) : analyzed ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Perfect keyword match!
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">Please paste or select a job description first.</span>
              )}
            </div>

            {analyzed && strengths.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Top match Strengths</h4>
                <div className="flex flex-col gap-2">
                  {strengths.slice(0, 3).map((str, i) => (
                    <div key={i} className="text-xs text-slate-700 dark:text-slate-350 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyzed && weaknesses.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Priority Improvements</h4>
                <div className="flex flex-col gap-2">
                  {weaknesses.slice(0, 3).map((wk, i) => (
                    <div key={i} className="text-xs text-slate-700 dark:text-slate-350 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{wk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Columns: Description Input & Learning Roadmap */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Paste Job description card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Target Job Description</CardTitle>
              <CardDescription>Select a sample template card or paste details below</CardDescription>
              {/* Template Buttons */}
              <div className="flex flex-wrap gap-2.5 mt-2">
                {jobTemplates.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTemplate(t)}
                    className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-350 transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex flex-col gap-4">
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste the target job description requirements here..."
                rows={6}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y"
              />
              <Button
                onClick={handleManualAnalyze}
                disabled={loading || !jobDesc.trim()}
                isLoading={loading}
                rightIcon={!loading && <ArrowRight className="w-4 h-4" />}
                className="self-end"
              >
                Analyze Match
              </Button>
            </CardContent>
          </Card>

          {/* Interactive Study Roadmap */}
          {analyzed && roadmap.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suggested Learning Roadmap</h3>
              </div>

              <div className="space-y-6 relative border-l border-slate-100 dark:border-slate-800 pl-6 ml-3">
                {roadmap.map((node, i) => (
                  <div key={i} className="relative space-y-1.5">
                    {/* Circle Node */}
                    <div className={`absolute w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full -left-[33px] top-1
                      ${node.status === 'active'
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-700'
                      }
                    `} />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-blue-650 dark:text-blue-450">{node.stage}</span>
                      <span className="text-[10px] text-slate-400">• {node.duration}</span>
                      {node.status === 'active' && (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          IN FOCUS
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{node.topic}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Practice this skill structure to lift your match index and score higher.
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
