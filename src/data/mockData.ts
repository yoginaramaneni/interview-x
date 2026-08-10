// Structured Mock Data for InterviewAI X

export interface UpcomingInterview {
  id: string;
  role: string;
  company: string;
  date: string;
  time: string;
  type: 'Behavioral' | 'Technical' | 'System Design' | 'Coding';
  status: 'Confirmed' | 'Pending';
}

export interface RecentInterview {
  id: string;
  role: string;
  company: string;
  date: string;
  score: number;
  type: string;
  status: 'Passed' | 'Needs Practice' | 'Excellent';
}

export interface SkillProgress {
  name: string;
  level: number; // 0 to 100
  category: 'Frontend' | 'Backend' | 'Architecture' | 'Soft Skills';
}

export const mockUpcomingInterviews: UpcomingInterview[] = [
  { id: '1', role: 'Senior Frontend Engineer', company: 'Vercel', date: 'Jul 29, 2026', time: '10:00 AM', type: 'Technical', status: 'Confirmed' },
  { id: '2', role: 'Full Stack Developer', company: 'Linear', date: 'Aug 02, 2026', time: '2:30 PM', type: 'Coding', status: 'Confirmed' },
  { id: '3', role: 'Software Engineer II', company: 'Stripe', date: 'Aug 05, 2026', time: '11:00 AM', type: 'System Design', status: 'Pending' },
];

export const mockRecentInterviews: RecentInterview[] = [
  { id: '1', role: 'Frontend Developer', company: 'Figma', date: 'Jul 24, 2026', score: 88, type: 'Technical', status: 'Excellent' },
  { id: '2', role: 'Software Engineer', company: 'Notion', date: 'Jul 18, 2026', score: 76, type: 'Behavioral', status: 'Passed' },
  { id: '3', role: 'React Engineer', company: 'Vercel', date: 'Jul 10, 2026', score: 58, type: 'Coding', status: 'Needs Practice' },
  { id: '4', role: 'UI Engineer', company: 'Apple', date: 'Jun 28, 2026', score: 92, type: 'Technical', status: 'Excellent' },
];

export const mockSkillProgress: SkillProgress[] = [
  { name: 'React / Next.js', level: 90, category: 'Frontend' },
  { name: 'TypeScript', level: 85, category: 'Frontend' },
  { name: 'Tailwind CSS', level: 95, category: 'Frontend' },
  { name: 'Node.js', level: 70, category: 'Backend' },
  { name: 'GraphQL / APIs', level: 75, category: 'Backend' },
  { name: 'System Design', level: 65, category: 'Architecture' },
  { name: 'Communication', level: 80, category: 'Soft Skills' },
  { name: 'Problem Solving', level: 75, category: 'Soft Skills' },
];

export const mockDashboardStats = {
  atsScore: 84,
  completedInterviews: 12,
  learningStreak: 8, // days
  weeklyHours: 4.5,
};

export const mockWeeklyActivity = [
  { day: 'Mon', minutes: 30 },
  { day: 'Tue', minutes: 45 },
  { day: 'Wed', minutes: 20 },
  { day: 'Thu', minutes: 60 },
  { day: 'Fri', minutes: 90 },
  { day: 'Sat', minutes: 15 },
  { day: 'Sun', minutes: 40 },
];

// Resume breakdown
export const mockResumeData = {
  fileName: 'John_Doe_Resume_Frontend.pdf',
  fileSize: '142 KB',
  uploadDate: 'July 25, 2026',
  atsScore: 84,
  candidateName: 'John Doe',
  email: 'johndoe@example.com',
  phone: '+1 (555) 019-2834',
  summary: 'Experienced Senior Frontend Developer with 5+ years of expertise in crafting modern, high-fidelity user interfaces. Skilled in React, TypeScript, Tailwind CSS, Next.js, and browser performance optimization.',
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'REST APIs', 'Framer Motion', 'Git', 'Webpack', 'Jest'],
  experience: [
    {
      role: 'Senior Frontend Engineer',
      company: 'TechFlow Solutions',
      period: '2023 - Present',
      bullets: [
        'Spearheaded transition to Vite-based architecture, reducing build times by 40% and enhancing developer feedback loops.',
        'Engineered responsive, reusable component libraries using React, TypeScript, and Tailwind CSS, standardizing UI patterns across 4 product suites.',
        'Optimized core app rendering paths, elevating Lighthouse performance scores from 72 to 94.'
      ]
    },
    {
      role: 'Frontend Developer',
      company: 'CreativeWeb Studio',
      period: '2021 - 2023',
      bullets: [
        'Built interactive SaaS dashboard panels featuring real-time charting integration using Recharts.',
        'Collaborated closely with UX designers to code pixel-perfect, accessible (WCAG 2.1) layouts.'
      ]
    }
  ],
  projects: [
    { name: 'SaaS Analytics Dashboard', desc: 'A premium, Vercel-style real-time web traffic analytics tool built in Next.js.', tech: ['Next.js', 'Tailwind CSS', 'Recharts'] },
    { name: 'AI Voice Trainer', desc: 'Browser-based voice synth practice playground utilizing speech analytics APIs.', tech: ['React', 'Framer Motion', 'Web Audio API'] }
  ],
  education: [
    { degree: 'B.S. in Computer Science', school: 'State University', period: '2017 - 2021' }
  ]
};

// Coding interview page
export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  template: string;
}

export const mockCodingProblems: CodingProblem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs, but that would be O(N^2). Can you do it in O(N)?',
      'Try using a Hash Map to store values and their index as you traverse.'
    ],
    template: `function twoSum(nums: number[], target: number): number[] {
    // Write your code here
    
    return [];
};`
  },
  {
    id: '2',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    hints: [
      'Think about using a sliding window approach with two pointers.',
      'A hash set can help store characters currently in the window to detect duplicates.'
    ],
    template: `function lengthOfLongestSubstring(s: string): number {
    // Write your code here
    
    return 0;
};`
  }
];

// Aptitude questions
export interface AptitudeQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export const mockAptitudeQuestions: AptitudeQuestion[] = [
  {
    id: 1,
    question: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
    options: ['120 meters', '180 meters', '324 meters', '150 meters'],
    correctAnswer: 3, // 150 meters
    explanation: 'Speed = 60 * (5/18) m/sec = 50/3 m/sec.\nLength of the train = (Speed * Time) = (50/3) * 9 = 150 meters.'
  },
  {
    id: 2,
    question: 'A sum of money at simple interest amounts to $815 in 3 years and to $854 in 4 years. The sum is:',
    options: ['$650', '$690', '$698', '$700'],
    correctAnswer: 2, // $698
    explanation: 'S.I. for 1 year = $(854 - 815) = $39.\nS.I. for 3 years = $(39 * 3) = $117.\nPrincipal = $(815 - 117) = $698.'
  },
  {
    id: 3,
    question: 'If log 27 = 1.431, then the value of log 9 is:',
    options: ['0.934', '0.945', '0.954', '0.958'],
    correctAnswer: 2, // 0.954
    explanation: 'log 27 = log(3^3) = 3 log 3 = 1.431 => log 3 = 0.477.\nlog 9 = log(3^2) = 2 log 3 = 2 * 0.477 = 0.954.'
  }
];

// Reports data
export const mockReportData = {
  overallScore: 81,
  percentile: '89th',
  grade: 'A-',
  hiringRecommendation: 'Strong Hire',
  radarMetrics: [
    { subject: 'Coding Skill', A: 85, fullMark: 100 },
    { subject: 'System Design', A: 68, fullMark: 100 },
    { subject: 'Communication', A: 88, fullMark: 100 },
    { subject: 'Problem Solving', A: 78, fullMark: 100 },
    { subject: 'Behavioral Fits', A: 86, fullMark: 100 },
  ],
  attemptHistory: [
    { date: 'Jun 10', score: 62 },
    { date: 'Jun 28', score: 72 },
    { date: 'Jul 10', score: 58 },
    { date: 'Jul 18', score: 76 },
    { date: 'Jul 24', score: 88 },
  ],
  questionTypeMetrics: [
    { name: 'Technical MCQ', value: 40, color: '#3B82F6' },
    { name: 'Coding Problems', value: 35, color: '#10B981' },
    { name: 'Behavioral Speech', value: 25, color: '#F59E0B' },
  ],
  strengths: [
    'Articulate speaker with strong pacing and minimal filler words (technical interviews).',
    'Demonstrated efficient memory complexity awareness in standard array problems.',
    'Highly structure-driven approach to solving coding questions.'
  ],
  weaknesses: [
    'Struggles with defining clear boundary/edge states in complex string parsing.',
    'Needs higher domain expertise in database scaling tradeoffs (System Design).'
  ],
  recommendations: [
    { topic: 'Database Sharding & Replication', link: '/job-match', actionText: 'View Roadmap' },
    { topic: 'Sliding Window Strings Sandbox', link: '/coding', actionText: 'Code Practice' },
    { topic: 'Practice speaking with brief structures', link: '/interview', actionText: 'Voice Arena' }
  ]
};
