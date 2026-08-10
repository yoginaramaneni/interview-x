import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress, CircularProgress } from '../components/ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import {
  FileText,
  Mic,
  Code,
  Layers,
  Calendar,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  mockUpcomingInterviews,
  mockRecentInterviews,
  mockSkillProgress,
  mockDashboardStats,
  mockWeeklyActivity
} from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cachedResume = localStorage.getItem('resumeDetails');
  const parsedResume = cachedResume ? JSON.parse(cachedResume) : null;
  const atsScore = parsedResume ? parsedResume.atsScore : mockDashboardStats.atsScore;

  const stats = [
    {
      title: 'ATS Resume Score',
      value: `${atsScore}%`,
      desc: parsedResume ? `Based on ${parsedResume.fileName}` : 'Based on your latest upload',
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: 'text-blue-600',
    },
    {
      title: 'Completed Mocks',
      value: mockDashboardStats.completedInterviews,
      desc: '3 mock interviews this week',
      icon: <CheckIcon className="w-5 h-5 text-emerald-500" />,
      color: 'text-emerald-500',
    },
    {
      title: 'Practice Streak',
      value: `${mockDashboardStats.learningStreak} days`,
      desc: 'Personal record: 12 days',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      color: 'text-amber-500',
    },
    {
      title: 'Weekly Focus',
      value: `${mockDashboardStats.weeklyHours}h`,
      desc: 'Target: 6 hours/week',
      icon: <Clock className="w-5 h-5 text-indigo-500" />,
      color: 'text-indigo-500',
    },
  ];

  const quickActions = [
    {
      title: 'AI voice simulator',
      desc: 'Verbal behavioral or system architecture round',
      icon: <Mic className="w-5 h-5 text-white" />,
      color: 'bg-blue-600',
      action: () => navigate('/interview'),
    },
    {
      title: 'Coding sandbox',
      desc: 'Solve algorithmic challenges with line details',
      icon: <Code className="w-5 h-5 text-white" />,
      color: 'bg-emerald-600',
      action: () => navigate('/coding'),
    },
    {
      title: 'ATS Resume Review',
      desc: 'Audit your resume keywords and roadmap',
      icon: <FileText className="w-5 h-5 text-white" />,
      color: 'bg-amber-600',
      action: () => navigate('/resume'),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden p-6 rounded-card border border-blue-100 dark:border-blue-950 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-650 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI INSIGHTS</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Ready to step up your coding prep, {user?.full_name?.split(' ')[0] || 'Candidate'}?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Your technical communication score increased by 12% in your last mock. Focus on resolving missing skills inside your resume roadmap.
          </p>
        </div>
        <div className="shrink-0 flex gap-3 relative z-10">
          <Button onClick={() => navigate('/interview')} size="sm">
            Mock Voice Session
          </Button>
          <Button onClick={() => navigate('/resume')} variant="outline" size="sm">
            Update Resume
          </Button>
        </div>
        {/* Glow Spheres */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Grid of 4 Core Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} variant="default" isHoverable>
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 flex items-center justify-center rounded-xl shrink-0">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</div>
              <span className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 block">{stat.desc}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity Recharts bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Practice Activity</CardTitle>
            <CardDescription>Minutes practiced per day this week</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  contentStyle={{
                    background: '#0F172A',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: 11
                  }}
                />
                <Bar dataKey="minutes" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick actions panel */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quick Actions</h3>
          <div className="flex flex-col gap-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-card flex items-center justify-between group hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${action.color} flex items-center justify-center rounded-[12px] shrink-0 shadow-sm`}>
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{action.title}</h4>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5 leading-relaxed">{action.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lists of upcoming/recent reviews & Skill breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interviews schedule list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mock Sessions Agenda</CardTitle>
            <CardDescription>Upcoming scheduled sessions and recent diagnostics</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3.5">Upcoming Slots</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUpcomingInterviews.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate('/interview')}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{item.role}</TableCell>
                      <TableCell>{item.company}</TableCell>
                      <TableCell>{item.date} • {item.time}</TableCell>
                      <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Confirmed' ? 'success' : 'warning'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3.5">Completed Runs</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentInterviews.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate('/reports')}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{item.role}</TableCell>
                      <TableCell>{item.company}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="font-bold">{item.score}%</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Excellent' ? 'success' : item.status === 'Passed' ? 'default' : 'danger'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Skill progress rings/progress bars */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown</CardTitle>
            <CardDescription>Evaluation scores from mock transcripts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5.5">
            {mockSkillProgress.slice(0, 5).map((skill, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{skill.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{skill.level}%</span>
                </div>
                <Progress value={skill.level} color={skill.level >= 85 ? 'bg-emerald-500' : skill.level >= 70 ? 'bg-blue-600' : 'bg-amber-500'} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper components
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
