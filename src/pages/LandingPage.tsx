import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import {
  Mic,
  Code,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
  };  const features = [
    {
      icon: <Mic className="w-6 h-6 text-blue-650" />,
      title: 'AI-Powered Voice Mock Interviews',
      desc: 'Immersive verbal sessions with an advanced voice avatar that adjusts questions dynamically based on your speaking patterns and knowledge depth.',
    },
    {
      icon: <Code className="w-6 h-6 text-emerald-500" />,
      title: 'Integrated Coding Sandbox',
      desc: 'Full-featured editor mockup with syntax highlighted lines, console panels, memory profiling, execution time monitoring, and comprehensive test suites.',
    },
    {
      icon: <FileText className="w-6 h-6 text-amber-500" />,
      title: 'ATS Resume Optimizer',
      desc: 'Instantly scan and audit your resume against target roles. Uncover critical missing keyword gaps and receive interactive, structured skill roadmaps.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
      title: 'Deep Competency Reports',
      desc: 'Review multi-dimensional radar metrics, progress tracking lines, custom verbal reports, strengths/weaknesses digests, and hiring suggestions.',
    },
  ];

  const testimonials = [
    {
      quote: "InterviewAI X changed my entire prep strategy. The voice UI felt so real that I lost all my actual interview nervousness. Got a senior role at Figma!",
      author: "Sarah Jenkins",
      role: "Senior UX Engineer",
      avatar: "SJ",
      stars: 5,
    },
    {
      quote: "The coding sandbox execution reports and the ATS resume parser matched the precise feedback I got from recruiters. Highly recommend the yearly pass.",
      author: "Marcus Chen",
      role: "Staff Software Engineer",
      avatar: "MC",
      stars: 5,
    },
  ];

  const faqs = [
    {
      value: 'faq-1',
      trigger: 'How does the AI voice avatar evaluation work?',
      content: 'Our interface simulates a real verbal conversation. When you speak, the system processes key behavioral patterns, vocabulary, filler word ratios, and technical precision to compile your radar breakdown.',
    },
    {
      value: 'faq-2',
      trigger: 'Can I upload resumes in formats other than PDF?',
      content: 'We support PDF, DOCX, and plain text. The parser scans details, calculates matching ratios, and aligns your profile with target job descriptions instantly.',
    },
    {
      value: 'faq-3',
      trigger: 'Do you offer a free trial?',
      content: 'Yes! You can complete up to 2 full mock voice interviews, one coding exercise, and one resume ATS assessment without entering any payment information.',
    },
  ];

  const stats = [
    { number: '93%', label: 'Offer Rate Success' },
    { number: '15,000+', label: 'Interviews Conducted' },
    { number: '4.9/5', label: 'Candidate Rating' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      {/* Glassmorphic Navbar */}
      <nav className="glass-panel fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 md:px-12 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">InterviewAI</span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-md">X</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-blue-650 transition-colors">Features</a>
          <a href="#how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-blue-650 transition-colors">Process</a>
          <a href="#pricing" className="text-slate-600 dark:text-slate-400 hover:text-blue-650 transition-colors">Pricing</a>
          <a href="#faq" className="text-slate-600 dark:text-slate-400 hover:text-blue-650 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/60 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Introducing InterviewAI X v2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-4xl mx-auto"
          >
            Ace Your Next Big Role with <span className="bg-gradient-to-r from-blue-650 to-indigo-550 bg-clip-text text-transparent">Premium AI Mock Interviews</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Immersive voice mockups, split-screen coding sandboxes, and interactive resume ATS auditing. All in one gorgeous platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button onClick={() => navigate('/register')} rightIcon={<ArrowRight className="w-4 h-4" />} size="lg">
              Start Free Trial
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline" size="lg">
              View Demo Portal
            </Button>
          </motion.div>

          {/* Animated Statistics */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-8"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-extrabold text-blue-650 dark:text-blue-400">{stat.number}</span>
                <span className="text-[11px] md:text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Features Built for Success</h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Everything you need to master your technical, behavioral, and architectural mock assessments.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feat, i) => (
              <Card key={i} isHoverable className="h-full flex flex-col justify-between">
                <CardContent className="p-8 flex gap-6">
                  <div className="shrink-0 w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center border border-slate-100 dark:border-slate-750">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{feat.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Stepper */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Three Steps to Master</h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Our structured path ensures you focus on core weaknesses first.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-8 rounded-card border border-slate-200 dark:border-slate-800 relative">
              <span className="text-4xl font-extrabold text-blue-100 dark:text-slate-800 absolute top-4 right-6 select-none">01</span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">1</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">Upload Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Drag in your resume. Get it parsed instantly and cross-checked for missing keywords.</p>
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-8 rounded-card border border-slate-200 dark:border-slate-800 relative">
              <span className="text-4xl font-extrabold text-blue-100 dark:text-slate-800 absolute top-4 right-6 select-none">02</span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">2</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">Simulate Assessments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Take immersive verbal interviews, logic aptitude rounds, or split-pane coding tests.</p>
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-8 rounded-card border border-slate-200 dark:border-slate-800 relative">
              <span className="text-4xl font-extrabold text-blue-100 dark:text-slate-800 absolute top-4 right-6 select-none">03</span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">3</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">Review & Improve</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Get detailed radar charts, strengths/weaknesses catalogs, and clear custom roadmaps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-12">Approved by Top Engineers</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {[...Array(t.stars)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm italic text-slate-650 dark:text-slate-350 leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-slate-200 dark:border-slate-850">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs select-none">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{t.author}</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Page */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Fair, Simple Pricing</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Unlock your true potential today. Cancel at any time.</p>
            
            {/* Switch Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-slate-400'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full p-1 transition-colors relative flex items-center"
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm
                    ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-slate-400'}`}>
                Yearly <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 text-[10px] px-1.5 py-0.5 rounded font-bold">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-card flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Standard Tier</h3>
                <p className="text-xs text-slate-400 mt-1">Great for starting out.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-xs text-slate-650 dark:text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 2 Voice interviews</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 1 Coding problem</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> ATS resume check</li>
                  <li className="flex items-center gap-2 text-slate-350 dark:text-slate-600"><CheckCircle className="w-4 h-4 text-slate-200 dark:text-slate-800" /> Custom learning roadmaps</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/register')} variant="outline" className="mt-8">Start Free</Button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 p-8 rounded-card flex flex-col justify-between relative shadow-lg">
              <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">POPULAR</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Premium Pro</h3>
                <p className="text-xs text-slate-400 mt-1">Full developer assessment vault.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    ${billingCycle === 'monthly' ? '29' : '23'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-xs text-slate-650 dark:text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Unlimited voice interviews</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 50+ Coding problems & tests</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Detailed resume feedback + maps</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Core radar metric breakdowns</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> PDF report export downloads</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/register')} className="mt-8">Get Pro Access</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-650 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500 to-blue-700 opacity-90" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">Ready to Ace Your Next Interview?</h2>
          <p className="mt-4 text-sm text-blue-100 leading-relaxed">Join thousands of software engineers using InterviewAI X to land offers at Apple, Stripe, and Google.</p>
          <Button onClick={() => navigate('/register')} variant="secondary" size="lg" className="mt-8">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">InterviewAI</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded-md">X</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 InterviewAI X. Built for mock assessments. All rights reserved.</p>
          <div className="flex gap-4 text-xs font-semibold">
            <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
