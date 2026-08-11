import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Square,
  ChevronRight,
  Clock,
  Sparkles,
  Volume2,
  Loader2
} from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { jobService } from '../services/jobService';
import { Toast, ToastContainer } from '../components/ui/Notification';

export const AIInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'speaking' | 'listening' | 'processing'>('speaking');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(false);

  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [loading, setLoading] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const questionsCount = 4; // Target interview turns

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasInitializedRef = useRef(false);

  // Request mic permission on mount and start session
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initSession = async () => {
      const resumeId = localStorage.getItem('resumeId');
      if (!resumeId) {
        addToast('Please upload a resume in the Resume Builder first!', 'error');
        setTimeout(() => navigate('/resume'), 1500);
        return;
      }

      let jobId = localStorage.getItem('latestJobId');
      if (!jobId) {
        try {
          // Generate a default job description if none analyzed yet
          const defaultJD = await jobService.analyze(
            'Looking for a Backend Software Engineer with experience in Python, FastAPI, and MongoDB.'
          );
          jobId = defaultJD.id;
          localStorage.setItem('latestJobId', jobId as string);
        } catch (e) {
          addToast('Failed to initialize target job description.', 'error');
          return;
        }
      }

      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        addToast('Your browser does not support voice recording. Please use the latest Chrome or Edge.', 'error');
        setLoading(false);
        return;
      }

      try {
        // Request microphone permission exactly once
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Start interview session
        const session = await interviewService.start(resumeId!, jobId!);
        setSessionId(session.id);
        
        // Fetch first question
        const firstQ = await interviewService.generateQuestion(session.id);
        setCurrentQuestion(firstQ);
        setLoading(false);
      } catch (err: any) {
        console.error("Microphone access or initialization failed:", err);
        addToast('Microphone permission is required for the voice interview. Please allow microphone access and try again.', 'error');
        setLoading(false);
      }
    };

    initSession();

    return () => {
      // Cleanup streams when unmounting/leaving the page
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch (e) {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Speaking timer transition (AI Interviewer Speaks the question)
  useEffect(() => {
    let timeout: any;
    if (status === 'speaking' && currentQuestion) {
      // AI speaks for 8 seconds, then transitions to listening
      timeout = setTimeout(() => {
        setStatus('listening');
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [status, currentQuestion]);

  // Handle active audio recording during listening state
  useEffect(() => {
    if (status === 'listening' && micActive && sessionId && currentQuestion && streamRef.current) {
      try {
        chunksRef.current = [];

        // Prevent multiple MediaRecorder instances
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          try {
            recorderRef.current.stop();
          } catch (e) {}
        }

        let options = {};
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
            mimeType = 'audio/ogg';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
            mimeType = 'audio/mp4';
          }
        }

        const recorder = new MediaRecorder(streamRef.current, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        recorder.onstop = async () => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          if (audioBlob.size > 0) {
            await uploadVoiceAnswer(audioBlob);
          }
        };

        recorderRef.current = recorder;
        
        // Setup speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          // Prevent multiple SpeechRecognition instances
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          let finalTranscript = '';
          recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              }
            }
            localStorage.setItem('lastSpeechTranscript', finalTranscript.trim());
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          localStorage.removeItem('lastSpeechTranscript');
          addToast('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
        }

        recorder.start();
      } catch (err) {
        console.error("Failed to start MediaRecorder or SpeechRecognition:", err);
        addToast('Failed to start microphone recording.', 'error');
        setStatus('speaking');
      }
    }

    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch (e) {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [status, micActive, sessionId, currentQuestion]);

  const uploadVoiceAnswer = async (blob: Blob) => {
    if (!sessionId || !currentQuestion) return;
    setStatus('processing');
    try {
      await interviewService.submitVoiceAnswer(sessionId, currentQuestion.id, blob);
      addToast('Answer Received!', 'success');
      
      const nextTurn = currentQuestionIdx + 1;
      if (nextTurn < questionsCount) {
        // Fetch next question
        const nextQ = await interviewService.generateQuestion(sessionId);
        setCurrentQuestion(nextQ);
        setCurrentQuestionIdx(nextTurn);
        setStatus('speaking');
      } else {
        await interviewService.end(sessionId);
        addToast('Interview completed successfully!', 'success');
        setTimeout(() => {
          navigate(`/reports?session_id=${sessionId}`);
        }, 1000);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Answer evaluation failed. Please retry speaking.';
      addToast(errMsg, 'error');
      setStatus('listening');
    }
  };

  const handleNextQuestion = async () => {
    // Manual skip
    if (!sessionId) return;
    setStatus('processing');
    try {
      const nextTurn = currentQuestionIdx + 1;
      if (nextTurn < questionsCount) {
        const nextQ = await interviewService.generateQuestion(sessionId);
        setCurrentQuestion(nextQ);
        setCurrentQuestionIdx(nextTurn);
        setStatus('speaking');
      } else {
        await interviewService.end(sessionId);
        navigate(`/reports?session_id=${sessionId}`);
      }
    } catch (e) {
      addToast('Failed to fetch next question.', 'error');
      setStatus('listening');
    }
  };

  const handleFinishAnswer = () => {
    if (status === 'listening' && recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  const handleEndSession = async () => {
    if (sessionId) {
      try {
        await interviewService.end(sessionId);
      } catch (e) {}
      navigate(`/reports?session_id=${sessionId}`);
    } else {
      navigate('/reports');
    }
  };

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white rounded-card p-6 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold">Initializing AI Simulator Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white rounded-card p-6 md:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar: Timer, indicator status */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-350 tracking-wider uppercase">Live Session</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Duration: {formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {/* Center section: Avatar, wave feedback, and status */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 gap-8 w-full max-w-2xl mx-auto">
        
        {/* Immersive Avatar sphere */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing rings */}
          <div className={`absolute w-36 h-36 rounded-full border border-blue-500/30 scale-110 animate-avatar-pulse`} />
          <div className={`absolute w-44 h-44 rounded-full border border-blue-500/15 scale-125 animate-avatar-pulse`} style={{ animationDelay: '1s' }} />
          
          <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-blue-650 to-indigo-650 flex items-center justify-center shadow-xl border border-white/10 select-none
            ${status === 'speaking' ? 'ring-4 ring-blue-500/50' : status === 'listening' ? 'ring-4 ring-emerald-500/50' : 'ring-4 ring-amber-500/50'}
          `}>
            {status === 'speaking' ? (
              <Volume2 className="w-8 h-8 text-white animate-bounce" />
            ) : status === 'listening' ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            )}
          </div>
        </div>

        {/* Audio speech waves feedback */}
        <div className="h-10 flex items-end justify-center gap-1.5 w-full">
          {status === 'listening' && micActive ? (
            <>
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full animate-wave-1" />
              <div className="w-1.5 h-8 bg-emerald-450 rounded-full animate-wave-2" />
              <div className="w-1.5 h-6 bg-emerald-400 rounded-full animate-wave-3" />
              <div className="w-1.5 h-10 bg-emerald-450 rounded-full animate-wave-4" />
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full animate-wave-5" />
            </>
          ) : status === 'speaking' ? (
            <>
              <div className="w-1.5 h-3 bg-blue-550 rounded-full animate-wave-2" />
              <div className="w-1.5 h-6 bg-blue-500 rounded-full animate-wave-3" />
              <div className="w-1.5 h-9 bg-blue-450 rounded-full animate-wave-1" />
              <div className="w-1.5 h-5 bg-blue-500 rounded-full animate-wave-5" />
              <div className="w-1.5 h-3 bg-blue-550 rounded-full animate-wave-4" />
            </>
          ) : (
            <div className="text-xs text-amber-450 font-bold uppercase tracking-widest animate-pulse">Processing Transcript diagnostics...</div>
          )}
        </div>

        {/* Live Status description text */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold">
            {status === 'speaking'
              ? 'AI Interviewer Speaking'
              : status === 'listening'
              ? micActive ? 'Listening (Speak Now)' : 'Microphone Muted'
              : 'Analyzing speech precision...'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {status === 'speaking'
              ? 'Please listen closely to the prompt details.'
              : status === 'listening'
              ? 'Click Finish Answer when you are done speaking.'
              : 'Parsing vocabulary and filler word counts.'}
          </p>
        </div>

        {/* Dynamic prompt detail card */}
        <Card className="w-full bg-white/5 border border-white/10 text-white rounded-xl shadow-lg mt-4">
          <CardContent className="p-6 text-center space-y-2">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Question {currentQuestionIdx + 1} of {questionsCount}</span>
            <p className="text-sm font-semibold leading-relaxed text-slate-200">
              "{currentQuestion?.question_text || ''}"
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer dashboard stats & control inputs */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-6 w-full">
        {/* Progress tracker */}
        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Interview Completion</span>
            <span>{Math.round(((currentQuestionIdx) / questionsCount) * 100)}%</span>
          </div>
          <Progress value={((currentQuestionIdx) / questionsCount) * 100} max={100} color="bg-blue-650" />
        </div>

        {/* Audio control deck */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-4 rounded-full transition-all duration-200 shadow-md border
              ${micActive
                ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                : 'bg-red-500/20 hover:bg-red-500/25 text-red-550 border-red-500/30'
              }
            `}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setVideoActive(!videoActive)}
            className={`p-4 rounded-full transition-all duration-200 shadow-md border
              ${videoActive
                ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                : 'bg-white/5 hover:bg-white/10 text-slate-450 border-white/5'
              }
            `}
          >
            {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {status === 'listening' && (
            <Button onClick={handleFinishAnswer} variant="primary" size="md">
              Finish Answer
            </Button>
          )}

          {status !== 'processing' && (
            <Button
              onClick={handleNextQuestion}
              variant="outline"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="border-white/10 hover:bg-white/5 text-white"
            >
              Skip
            </Button>
          )}
        </div>

        {/* End interview button */}
        <Button onClick={handleEndSession} variant="danger" leftIcon={<Square className="w-3.5 h-3.5 fill-current" />} size="sm">
          End Session
        </Button>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};
