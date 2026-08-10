import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Accordion } from '../components/ui/Accordion';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  Play,
  CheckCircle,
  Terminal,
  Clock,
  HardDrive,
  Settings2,
  ChevronRight,
  HelpCircle,
  Code
} from 'lucide-react';
import { mockCodingProblems } from '../data/mockData';
import type { CodingProblem } from '../data/mockData';
import { codingService } from '../services/codingService';
import { Toast, ToastContainer } from '../components/ui/Notification';

const getTemplate = (problemIdx: number, lang: string): string => {
  if (lang.toLowerCase().includes('python')) {
    if (problemIdx === 0) {
      return `def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your code here\n    pass`;
    } else {
      return `def lengthOfLongestSubstring(s: str) -> int:\n    # Write your code here\n    pass`;
    }
  } else {
    if (problemIdx === 0) {
      return `function twoSum(nums: number[], target: number): number[] {\n    // Write your code here\n    return [];\n};`;
    } else {
      return `function lengthOfLongestSubstring(s: string): number {\n    // Write your code here\n    return 0;\n};`;
    }
  }
};

export const CodingInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  const [language, setLanguage] = useState('python');
  const [savedCode, setSavedCode] = useState<{ [key: string]: string }>({});
  const [codeValue, setCodeValue] = useState(getTemplate(0, 'python'));
  const [consoleTab, setConsoleTab] = useState<'testcases' | 'output'>('testcases');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [runDetails, setRunDetails] = useState<{
    status: 'idle' | 'success' | 'failed';
    duration?: string;
    memory?: string;
    stdout?: string;
  }>({ status: 'idle' });

  const problem: CodingProblem = mockCodingProblems[selectedProblemIdx];
  const lineCount = codeValue.split('\n').length;

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keep template matching language and selected problem with local cache preservation
  useEffect(() => {
    const key = `${selectedProblemIdx}_${language}`;
    if (savedCode[key] !== undefined) {
      setCodeValue(savedCode[key]);
    } else {
      const template = getTemplate(selectedProblemIdx, language);
      setCodeValue(template);
      setSavedCode((prev) => ({ ...prev, [key]: template }));
    }
  }, [language, selectedProblemIdx]);

  const handleCodeChange = (val: string) => {
    setCodeValue(val);
    const key = `${selectedProblemIdx}_${language}`;
    setSavedCode((prev) => ({ ...prev, [key]: val }));
  };

  const handleProblemChange = (idx: number) => {
    setSelectedProblemIdx(idx);
    setRunDetails({ status: 'idle' });
    setConsoleTab('testcases');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleTab('output');
    setRunDetails({ status: 'idle' });

    try {
      const res = await codingService.run(codeValue, language, problem.description);
      setRunDetails({
        status: res.passed ? 'success' : 'failed',
        duration: res.passed ? '12 ms' : undefined,
        memory: res.passed ? '38.4 MB' : undefined,
        stdout: res.stdout || res.message,
      });
      addToast(res.passed ? 'Code executed successfully!' : 'Code execution failed.', res.passed ? 'success' : 'error');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to execute code sandbox.';
      setRunDetails({
        status: 'failed',
        stdout: errMsg,
      });
      addToast(errMsg, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setConsoleTab('output');
    setRunDetails({ status: 'idle' });

    try {
      const subRes = await codingService.submit(codeValue, problem.description, language);
      addToast('Solution submitted! Analyzing code complexity...', 'success');
      
      const review = await codingService.getReview(subRes.id);
      
      const formattedOutput = `SUBMISSION EVALUATION REPORT\n============================\nScore: ${review.score}/100\nTime Complexity: ${review.time_complexity}\nSpace Complexity: ${review.space_complexity}\n\nStrengths:\n${review.strengths}\n\nWeaknesses:\n${review.weaknesses}\n\nOptimization Suggestions:\n${review.optimization_suggestions}\n\nRedirecting to reports page...`;
      
      setRunDetails({
        status: 'success',
        duration: '16 ms',
        memory: '41.2 MB',
        stdout: formattedOutput,
      });
      
      addToast('Review completed successfully!', 'success');
      
      setTimeout(() => {
        navigate('/reports');
      }, 5000);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to submit solution for review.';
      setRunDetails({
        status: 'failed',
        stdout: errMsg,
      });
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedHints = problem.hints.map((hint, idx) => ({
    value: `hint-${idx}`,
    trigger: `Hint ${idx + 1}`,
    content: hint
  }));

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)] min-h-[500px]">
      {/* Top action header: selector problem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4.5 rounded-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400 flex items-center justify-center">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Algorithmic Sandbox</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{problem.title}</span>
              <Badge variant={problem.difficulty === 'Easy' ? 'success' : 'warning'}>
                {problem.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Question Selector tabs */}
        <div className="flex items-center gap-2">
          {mockCodingProblems.map((prob, idx) => (
            <button
              key={prob.id}
              onClick={() => handleProblemChange(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                ${selectedProblemIdx === idx
                  ? 'bg-blue-600 border-transparent text-white'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-350 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-700 text-slate-650 dark:text-slate-350'
                }
              `}
            >
              Task {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left column: Problem descriptions, examples, constraints & hints */}
        <Card className="flex flex-col min-h-0 overflow-y-auto p-6 bg-white dark:bg-slate-900">
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Description</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {problem.description}
              </p>
            </div>

            {/* Examples grid */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Examples</h4>
              <div className="space-y-3">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="text-slate-405 dark:text-slate-500 uppercase font-bold text-[9px] tracking-wider">Example {i + 1}</div>
                    <div><span className="text-blue-650 dark:text-blue-400">Input:</span> {ex.input}</div>
                    <div><span className="text-emerald-650 dark:text-emerald-450">Output:</span> {ex.output}</div>
                    {ex.explanation && (
                      <div className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed font-sans text-[11px]">
                        <span className="font-semibold font-mono text-xs">Explanation:</span> {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Constraints</h4>
              <ul className="list-disc list-inside text-xs text-slate-500 dark:text-slate-400 font-mono space-y-1 pl-1">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Hints Collapsible */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Accordion items={formattedHints} />
            </div>
          </div>
        </Card>

        {/* Right column: Styled Code Editor & compilation feedback */}
        <Card className="flex flex-col min-h-0 bg-slate-900 border-slate-800 text-white rounded-card overflow-hidden">
          {/* Editor Header settings */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-850 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-350">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>

            <Settings2 className="w-4 h-4 text-slate-450 cursor-pointer hover:text-white transition-colors" />
          </div>

          {/* Styled Editor text area simulating Monaco Editor */}
          <div className="flex-1 relative min-h-0 flex font-mono text-xs leading-relaxed p-4 bg-slate-950">
            {/* Line numbers panel */}
            <div className="w-8 select-none text-slate-600 text-right pr-3 border-r border-slate-850 flex flex-col gap-0.5 animate-fade-in">
              {[...Array(Math.max(lineCount, 16))].map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>

            {/* Input code editor content */}
            <textarea
              value={codeValue}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none pl-4 text-slate-300 placeholder-slate-600 font-mono text-xs focus:ring-0 focus:outline-none h-full overflow-y-auto leading-relaxed"
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Console / Output area */}
          <div className="h-44 bg-slate-950 border-t border-slate-850 flex flex-col min-h-[120px] shrink-0">
            <div className="flex items-center border-b border-slate-850 bg-slate-900/50 px-4 py-1.5 shrink-0 justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors
                    ${consoleTab === 'testcases' ? 'bg-white/10 text-white' : 'text-slate-450 hover:text-slate-200'}
                  `}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('output')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors
                    ${consoleTab === 'output' ? 'bg-white/10 text-white' : 'text-slate-450 hover:text-slate-200'}
                  `}
                >
                  Console Output
                </button>
              </div>

              {/* Execution details tags */}
              {runDetails.status === 'success' && (
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {runDetails.duration}</span>
                  <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-emerald-500" /> {runDetails.memory}</span>
                </div>
              )}
            </div>

            {/* Tab content console details */}
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono text-slate-400 leading-relaxed bg-slate-950/80">
              {consoleTab === 'testcases' ? (
                <div className="space-y-2 select-none">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Standard inputs assertions</p>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                    <div>nums: <span className="text-blue-400">[2, 7, 11, 15]</span></div>
                    <div>target: <span className="text-emerald-400">9</span></div>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2Icon className="w-4 h-4 animate-spin text-current" /> Running local checks...
                    </div>
                  ) : isSubmitting ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Loader2Icon className="w-4 h-4 animate-spin text-current" /> Evaluating system test cases...
                    </div>
                  ) : runDetails.stdout ? (
                    <span className="text-slate-205">{runDetails.stdout}</span>
                  ) : (
                    <span className="text-slate-550 italic">Click Run to compile code.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer triggers */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-t border-slate-850 shrink-0">
            <button className="text-xs font-semibold text-slate-450 hover:text-white flex items-center gap-1.5 transition-colors">
              <Terminal className="w-4 h-4" /> Custom Test Input
            </button>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                isLoading={isRunning}
                variant="ghost"
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                className="text-white hover:bg-white/5 border border-white/10"
              >
                Run
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

// Loader Icon component
const Loader2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);
