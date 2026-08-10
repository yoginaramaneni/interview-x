import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Toast, ToastContainer } from '../components/ui/Notification';
import {
  Download,
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle,
  XCircle,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { mockReportData } from '../data/mockData';
import { reportService } from '../services/reportService';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addToast = (message: string, type: 'success' | 'info' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const fetchReport = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id') || localStorage.getItem('latestSessionId');
      
      if (!sessionId) {
        // Fallback to mock data silently if no session is active yet
        return;
      }

      setLoading(true);
      try {
        const data = await reportService.get(sessionId);
        setReport(data);
        localStorage.setItem('latestSessionId', sessionId);
      } catch (err: any) {
        addToast('Failed to compile live report scorecard. Showing mock data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const handleDownloadPDF = () => {
    setDownloading(true);
    addToast('Opening print dialog to export report as PDF...', 'info');
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-650 animate-spin" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Compiling Report Scorecard via Gemini...</p>
      </div>
    );
  }

  // Map dynamic report details to charts
  const overallScore = report ? report.overall_score : mockReportData.overallScore;
  const technicalScore = report ? report.technical_score : 80;
  const communicationScore = report ? report.communication_score : 75;
  const codingScore = report ? report.coding_score : 85;
  const aptitudeScore = report ? report.aptitude_score : 70;
  
  // Read cached ATS score if available
  const cachedAts = localStorage.getItem('latestAtsResult');
  const atsScore = cachedAts ? JSON.parse(cachedAts).ats_score : 75;

  const hiringRecommendation = report ? report.hiring_recommendation : mockReportData.hiringRecommendation;
  const hiringRationale = report ? report.hiring_rationale : 'Baseline target scores successfully cleared.';

  const radarMetrics = [
    { subject: 'Technical', A: technicalScore, fullMark: 100 },
    { subject: 'Communication', A: communicationScore, fullMark: 100 },
    { subject: 'Coding', A: codingScore, fullMark: 100 },
    { subject: 'Aptitude', A: aptitudeScore, fullMark: 100 },
    { subject: 'ATS Audit', A: atsScore, fullMark: 100 },
  ];

  const questionTypeMetrics = [
    { name: 'Technical', value: 25, color: '#3B82F6' },
    { name: 'Communication', value: 20, color: '#10B981' },
    { name: 'Coding', value: 20, color: '#F59E0B' },
    { name: 'Aptitude', value: 15, color: '#EC4899' },
    { name: 'ATS Audit', value: 20, color: '#6366F1' },
  ];

  const strengths = report ? report.strengths : mockReportData.strengths;
  const weaknesses = report ? report.weaknesses : mockReportData.weaknesses;

  const parseLearningPlan = () => {
    if (!report || !report.learning_plan) return mockReportData.recommendations;
    const plan = report.learning_plan;
    if (Array.isArray(plan)) {
      return plan.map((item: any, idx: number) => ({
        topic: typeof item === 'string' ? item : item.topic || `Focus area ${idx + 1}`,
        link: idx % 2 === 0 ? '/coding' : '/aptitude',
        actionText: 'Practice Module'
      }));
    }
    if (typeof plan === 'object') {
      return Object.values(plan).map((val: any, idx: number) => ({
        topic: typeof val === 'string' ? val : val.topic || `Focus area ${idx + 1}`,
        link: idx % 2 === 0 ? '/coding' : '/aptitude',
        actionText: 'Practice Module'
      }));
    }
    return [
      { topic: String(plan), link: '/coding', actionText: 'Practice Module' }
    ];
  };

  const recommendations = parseLearningPlan();

  return (
    <div className="flex flex-col gap-8">
      {/* Toast container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header bar actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Performance Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Diagnostic stats compiled from mock interviews, sandboxes, and exams.</p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          isLoading={downloading}
          leftIcon={!downloading && <Download className="w-4 h-4" />}
          variant="outline"
          size="sm"
        >
          Download PDF Report
        </Button>
      </div>

      {/* Top row: Metrics card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <Card className="p-6 flex items-center justify-between bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-900/40 border-blue-100 dark:border-blue-950">
          <div className="space-y-1">
            <span className="text-[10px] text-blue-650 dark:text-blue-450 uppercase font-bold tracking-wider">Overall Score</span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{overallScore}%</h3>
            <p className="text-[10px] text-slate-400">Target score is &gt; 80%</p>
          </div>
          <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-650 border border-blue-50/50 shadow-sm shrink-0">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cohort Percentile</span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{report ? '85th' : mockReportData.percentile}</h3>
            <p className="text-[10px] text-slate-400">Beating {report ? '85th' : mockReportData.percentile} of applicants</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/80 rounded-[14px] border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-650 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Platform Recommendation</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">{hiringRecommendation}</h3>
            <p className="text-[10px] text-slate-450 mt-1"><Badge variant={hiringRecommendation === 'No Hire' ? 'danger' : 'success'}>{hiringRecommendation === 'No Hire' ? 'Re-test recommended' : 'Cleared'}</Badge></p>
          </div>
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/80 rounded-[14px] border border-slate-100 dark:border-slate-750 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Detailed Competency Scorecard */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Competency Breakdown Scorecard</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overall Score</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-450">{overallScore}%</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ATS Score</span>
            <span className="text-2xl font-extrabold text-indigo-500 dark:text-indigo-405">{atsScore}%</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Interview Score</span>
            <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-450">{technicalScore}%</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Coding Score</span>
            <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-450">{codingScore}%</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aptitude Score</span>
            <span className="text-2xl font-extrabold text-pink-500 dark:text-pink-400">{aptitudeScore}%</span>
          </div>
        </div>
      </Card>

      {/* Advanced Charting section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Evaluation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Dimension</CardTitle>
            <CardDescription>Topic weighting scored across mocks</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarMetrics}>
                <PolarGrid stroke="#E2E8F0" opacity={0.5} />
                <PolarAngleAxis dataKey="subject" style={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Candidate" dataKey="A" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress history line */}
        <Card>
          <CardHeader>
            <CardTitle>Progress History</CardTitle>
            <CardDescription>Average performance indices over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockReportData.attemptHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[40, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: 10
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories split pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment weighting</CardTitle>
            <CardDescription>Metric source categorization breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center relative">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={questionTypeMetrics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {questionTypeMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0F172A',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: 10
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center Legend */}
            <div className="absolute flex flex-col gap-2 right-4 bottom-4 text-[10px] font-semibold text-slate-500">
              {questionTypeMetrics.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable items: strengths, weaknesses & suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnostic list card */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-blue-600" />
            Feedback Summary
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Highlights
              </h4>
              <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-450 leading-relaxed pl-1 list-disc list-inside">
                {strengths.map((str: string, idx: number) => (
                  <li key={idx} className="marker:text-emerald-500">{str}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800/80">
              <h4 className="text-xs font-bold text-red-650 dark:text-red-405 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Focus Gaps
              </h4>
              <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-450 leading-relaxed pl-1 list-disc list-inside">
                {weaknesses.map((weak: string, idx: number) => (
                  <li key={idx} className="marker:text-red-400">{weak}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* suggested modules card */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-indigo-500" />
              Tailored Mock Training Modules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Based on gaps parsed inside your reports, practice these sessions to boost your competency ratings.
            </p>

            <div className="flex flex-col gap-3.5">
              {recommendations.map((rec: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between hover:-translate-y-0.5 transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rec.topic}</h4>
                    <span className="text-[10px] text-slate-405">Evaluation target</span>
                  </div>
                  <Button
                    onClick={() => navigate(rec.link)}
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="h-8 text-[10px]"
                  >
                    {rec.actionText}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
