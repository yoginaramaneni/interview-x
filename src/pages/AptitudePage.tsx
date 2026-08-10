import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { Loader2 } from 'lucide-react';
import {
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { aptitudeService } from '../services/aptitudeService';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const AptitudePage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({}); // questionText -> optionKey
  const [markedForReview, setMarkedForReview] = useState<{ [key: string]: boolean }>({}); // questionText -> boolean
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const hasFetchedRef = useRef(false);

  // Fetch questions from backend
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchQuestions = async () => {
      try {
        const res = await aptitudeService.getQuestions('Quantitative Reasoning', 'Medium', 30);
        setQuestions(res.questions || []);
      } catch (err: any) {
        addToast('Failed to load assessment questions. Reverting to practice bank.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const question = questions[currentIdx];

  // Timer countdown
  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, questions]);

  const handleSelectOption = (optKey: string) => {
    if (!question) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [question.question_text]: optKey,
    }));
  };

  const toggleMarkForReview = () => {
    if (!question) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [question.question_text]: !prev[question.question_text],
    }));
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmitExam = async () => {
    if (questions.length === 0) return;
    setIsSubmitting(true);
    try {
      const submissions = questions.map((q) => ({
        question_text: q.question_text,
        selected_option: selectedAnswers[q.question_text] || '',
      }));

      const result = await aptitudeService.submit('Quantitative Reasoning', 'Medium', submissions);
      addToast(`Test Submitted! Score: ${result.score}%`, 'success');
      
      // Save result in localStorage for reports page dashboard
      localStorage.setItem('latestAptitudeResult', JSON.stringify(result));
      
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (e) {
      addToast('Failed to submit exam. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-650 animate-spin" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Loading Aptitude Assessment...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-500">No questions available. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Timer navbar header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4.5 rounded-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Aptitude assessment</h3>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Quantitative & Analytical Reasoning</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Time text indicator */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-250">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Time Left:</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
          <Button onClick={handleSubmitExam} size="sm">Submit Test</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Question card & options */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <span className="text-xs font-bold text-blue-650 dark:text-blue-450 uppercase tracking-widest">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                {markedForReview[question.question_text] && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-current" /> Marked for Review
                  </Badge>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {question.question_text}
                </h3>
              </div>

              {/* MCQ Options list */}
              <div className="flex flex-col gap-3">
                {question.options.map((opt: any) => {
                  const isSelected = selectedAnswers[question.question_text] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full text-left p-4 rounded-card border text-xs font-semibold flex items-center justify-between transition-all duration-200
                        ${isSelected
                          ? 'border-blue-600 bg-blue-50/15 dark:border-blue-500 text-blue-600 dark:text-blue-450 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold uppercase transition-colors
                          ${isSelected
                            ? 'bg-blue-650 text-white border-transparent'
                            : 'bg-slate-50 border-slate-250 dark:bg-slate-800 dark:border-slate-700'
                          }
                        `}>
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-650" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Nav deck controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                variant="outline"
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIdx === questions.length - 1}
                variant="outline"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                size="sm"
              >
                Next
              </Button>
            </div>

            <Button
              onClick={toggleMarkForReview}
              variant="ghost"
              leftIcon={<Bookmark className={`w-4 h-4 ${markedForReview[question.question_text] ? 'fill-current text-amber-500' : ''}`} />}
              size="sm"
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {markedForReview[question.question_text] ? 'Unmark review' : 'Mark for review'}
            </Button>
          </div>
        </div>

        {/* Right Side: Navigation panel list */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Question Navigator</h3>
            
            {/* Grid layout */}
            <div className="grid grid-cols-4 gap-2.5">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.question_text] !== undefined;
                const isReview = markedForReview[q.question_text];
                const isActive = currentIdx === idx;

                return (
                  <button
                    key={q.question_text}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 text-xs font-bold rounded-lg transition-all flex items-center justify-center border
                      ${isActive
                        ? 'ring-2 ring-blue-500 border-blue-500 font-extrabold'
                        : ''
                      }
                      ${isReview
                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400'
                        : isAnswered
                        ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/40 dark:text-blue-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Grid legend status */}
            <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4.5 mt-5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                <span>Unanswered</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
