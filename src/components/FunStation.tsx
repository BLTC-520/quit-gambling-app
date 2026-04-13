import { useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { X, Brain, Megaphone, Sparkles, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ---------------- Cooldown ----------------

const COOLDOWN_MS = 15 * 60 * 1000;
const COOLDOWN_STORAGE_KEY = 'funStationCooldownUntil';

function readCooldownUntil(): number {
  try {
    const raw = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (raw === null) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeCooldownUntil(timestamp: number): void {
  try {
    localStorage.setItem(COOLDOWN_STORAGE_KEY, String(timestamp));
  } catch {
    // Ignore storage failures — cooldown will simply not persist
  }
}

interface FunStationProps {
  onClose: () => void;
  onEarned: (amount: number) => void;
}

type Job = 'menu' | 'promoter' | 'math' | 'trivia';

interface JobSubProps {
  onEarned: (amount: number) => void;
  onDone: () => void;
}

export default function FunStation({ onClose, onEarned }: FunStationProps) {
  const [job, setJob] = useState<Job>('menu');
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => readCooldownUntil());
  const [now, setNow] = useState<number>(() => Date.now());

  // Tick once per second while mounted — drives the cooldown countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const onCooldown = cooldownUntil > now;

  // Wrap onEarned so that any positive payout starts the cooldown
  const handleEarned = useCallback((amount: number) => {
    if (amount <= 0) return;
    onEarned(amount);
    const until = Date.now() + COOLDOWN_MS;
    writeCooldownUntil(until);
    setCooldownUntil(until);
  }, [onEarned]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-2 border-pink-600/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>

        {job !== 'menu' && !onCooldown && (
          <button
            onClick={() => setJob('menu')}
            className="absolute top-3 left-3 text-neutral-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}

        {onCooldown ? (
          <CooldownScreen cooldownUntil={cooldownUntil} now={now} />
        ) : (
          <>
            {job === 'menu' && <JobMenu onPick={setJob} />}
            {job === 'promoter' && <PromoterJob onEarned={handleEarned} onDone={() => setJob('menu')} />}
            {job === 'math' && <MathJob onEarned={handleEarned} onDone={() => setJob('menu')} />}
            {job === 'trivia' && <TriviaJob onEarned={handleEarned} onDone={() => setJob('menu')} />}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------- Menu ----------------

interface JobMenuProps {
  onPick: (job: Job) => void;
}

function JobMenu({ onPick }: JobMenuProps) {
  return (
    <>
      <div className="text-center mb-5 mt-2">
        <h2 className="text-2xl font-black text-pink-400 uppercase tracking-tight">Fun Station</h2>
        <p className="text-neutral-400 text-xs mt-1 italic">
          Quick money schemes. Easy chips — or so they say.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <JobTile
          icon={<Megaphone size={22} />}
          title="Part-time Promoter"
          subtitle="Hand out flyers as fast as you can — 15 seconds"
          reward="Up to $30"
          color="from-orange-700/40 to-orange-900/40 border-orange-600/40 text-orange-300"
          onClick={() => onPick('promoter')}
        />
        <JobTile
          icon={<Brain size={22} />}
          title="Math Quiz"
          subtitle="10 simple arithmetic questions"
          reward="Up to $25"
          color="from-emerald-700/40 to-emerald-900/40 border-emerald-600/40 text-emerald-300"
          onClick={() => onPick('math')}
        />
        <JobTile
          icon={<Sparkles size={22} />}
          title="Fun Facts Trivia"
          subtitle="True or false — 5 questions"
          reward="$5 each"
          color="from-fuchsia-700/40 to-fuchsia-900/40 border-fuchsia-600/40 text-fuchsia-300"
          onClick={() => onPick('trivia')}
        />
      </div>
    </>
  );
}

interface JobTileProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  reward: string;
  color: string;
  onClick: () => void;
}

function JobTile({ icon, title, subtitle, reward, color, onClick }: JobTileProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} border rounded-xl p-4 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="font-bold uppercase text-sm">{title}</p>
          <p className="text-[11px] text-neutral-300/80">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-sm">{reward}</p>
        </div>
      </div>
    </button>
  );
}

// ---------------- Promoter ----------------

const PROMOTER_DURATION = 15;
const PROMOTER_PER_CLICK = 1;
const PROMOTER_CAP = 30;

function PromoterJob({ onEarned, onDone }: JobSubProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [timeLeft, setTimeLeft] = useState(PROMOTER_DURATION);
  const [clicks, setClicks] = useState(0);
  const payoutRef = useRef(0);

  useEffect(() => {
    if (phase !== 'running') return;
    if (timeLeft <= 0) {
      const payout = Math.min(clicks * PROMOTER_PER_CLICK, PROMOTER_CAP);
      payoutRef.current = payout;
      if (payout > 0) onEarned(payout);
      setPhase('done');
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, clicks, onEarned]);

  const handleClick = () => {
    if (phase !== 'running') return;
    setClicks(c => c + 1);
  };

  const start = () => {
    setPhase('running');
    setTimeLeft(PROMOTER_DURATION);
    setClicks(0);
  };

  return (
    <div className="mt-6 text-center">
      <Megaphone className="mx-auto text-orange-400 mb-2" size={32} />
      <h3 className="text-xl font-bold text-orange-300 uppercase">Part-time Promoter</h3>
      <p className="text-neutral-400 text-xs mb-5">
        Click the flyer as many times as you can. $1 per flyer, capped at ${PROMOTER_CAP}.
      </p>

      {phase === 'ready' && (
        <button
          onClick={start}
          className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl uppercase text-sm transition-colors"
        >
          Start Shift
        </button>
      )}

      {phase === 'running' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/40 rounded-xl p-3">
              <p className="text-neutral-500 text-[9px] uppercase">Time Left</p>
              <p className="text-white font-mono font-bold text-2xl">{timeLeft}s</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3">
              <p className="text-neutral-500 text-[9px] uppercase">Flyers</p>
              <p className="text-white font-mono font-bold text-2xl">{clicks}</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="w-full py-8 bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 active:scale-95 text-white font-black rounded-2xl uppercase text-2xl tracking-wider transition-transform select-none"
          >
            HAND OUT FLYER
          </button>
        </>
      )}

      {phase === 'done' && (
        <ResultScreen
          earned={payoutRef.current}
          subtitle={`You handed out ${clicks} flyers.`}
          onDone={onDone}
        />
      )}
    </div>
  );
}

// ---------------- Math Quiz ----------------

interface MathQuestion {
  readonly a: number;
  readonly b: number;
  readonly op: '+' | '-' | '×';
  readonly answer: number;
}

function generateMathQuestions(count: number): MathQuestion[] {
  const ops: MathQuestion['op'][] = ['+', '-', '×'];
  const questions: MathQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    const a = Math.floor(Math.random() * 12) + 1;
    const b = Math.floor(Math.random() * 12) + 1;
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    questions.push({ a, b, op, answer });
  }
  return questions;
}

const MATH_TOTAL = 10;
const MATH_MAX_REWARD = 25;

function MathJob({ onEarned, onDone }: JobSubProps) {
  const [questions] = useState(() => generateMathQuestions(MATH_TOTAL));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const payoutRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  const submit = () => {
    const trimmed = input.trim();
    if (trimmed === '') return;
    const value = Number(trimmed);
    if (Number.isNaN(value)) return;

    const isCorrect = value === questions[idx].answer;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextIdx = idx + 1;

    setInput('');

    if (nextIdx >= questions.length) {
      const payout = Math.round((nextCorrect / MATH_TOTAL) * MATH_MAX_REWARD);
      payoutRef.current = payout;
      setCorrectCount(nextCorrect);
      if (payout > 0) onEarned(payout);
      setFinished(true);
    } else {
      setCorrectCount(nextCorrect);
      setIdx(nextIdx);
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  if (finished) {
    return (
      <ResultScreen
        earned={payoutRef.current}
        subtitle={`${correctCount} / ${MATH_TOTAL} correct`}
        onDone={onDone}
      />
    );
  }

  const current = questions[idx];

  return (
    <div className="mt-6 text-center">
      <Brain className="mx-auto text-emerald-400 mb-2" size={32} />
      <h3 className="text-xl font-bold text-emerald-300 uppercase">Math Quiz</h3>
      <p className="text-neutral-500 text-xs mb-5">
        Question {idx + 1} of {MATH_TOTAL}
      </p>

      <div className="bg-black/40 rounded-2xl p-6 mb-4">
        <p className="text-white font-mono text-4xl font-bold tracking-wide">
          {current.a} {current.op} {current.b} = ?
        </p>
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-neutral-950 border-2 border-emerald-800/50 rounded-xl px-4 py-3 text-white font-mono text-xl text-center focus:outline-none focus:border-emerald-500"
          placeholder="Answer"
        />
        <button
          onClick={submit}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl uppercase text-sm transition-colors"
        >
          Submit
        </button>
      </div>

      <div className="mt-4 h-1 bg-black/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${((idx) / MATH_TOTAL) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------- Trivia ----------------

interface TriviaFact {
  readonly question: string;
  readonly correct: boolean;
}

const TRIVIA_BANK: readonly TriviaFact[] = [
  { question: 'Honey never spoils — archaeologists have eaten 3,000-year-old honey from Egyptian tombs.', correct: true },
  { question: 'Octopuses have three hearts.', correct: true },
  { question: 'Bananas grow on trees.', correct: false },
  { question: "A group of flamingos is called a 'flamboyance'.", correct: true },
  { question: 'The Great Wall of China is visible from space with the naked eye.', correct: false },
  { question: 'Cows have best friends and get stressed when separated from them.', correct: true },
  { question: 'Sharks existed before trees.', correct: true },
  { question: 'Goldfish only have a 3-second memory.', correct: false },
  { question: 'Wombat poop is cube-shaped.', correct: true },
  { question: 'Humans share roughly 50% of their DNA with bananas.', correct: true },
  { question: 'The shortest war in history lasted under 45 minutes.', correct: true },
  { question: "You can see the Eiffel Tower from anywhere in Paris.", correct: false },
];

const TRIVIA_COUNT = 5;
const TRIVIA_PER_CORRECT = 5;

function pickTriviaQuestions(): TriviaFact[] {
  const shuffled = [...TRIVIA_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TRIVIA_COUNT);
}

function TriviaJob({ onEarned, onDone }: JobSubProps) {
  const [questions] = useState(() => pickTriviaQuestions());
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const payoutRef = useRef(0);

  const answer = (choice: boolean) => {
    if (feedback !== null) return;

    const isCorrect = choice === questions[idx].correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) onEarned(TRIVIA_PER_CORRECT);

    setTimeout(() => {
      const nextCorrect = correctCount + (isCorrect ? 1 : 0);
      const nextIdx = idx + 1;
      setFeedback(null);

      if (nextIdx >= questions.length) {
        payoutRef.current = nextCorrect * TRIVIA_PER_CORRECT;
        setCorrectCount(nextCorrect);
        setFinished(true);
      } else {
        setCorrectCount(nextCorrect);
        setIdx(nextIdx);
      }
    }, 900);
  };

  if (finished) {
    return (
      <ResultScreen
        earned={payoutRef.current}
        subtitle={`${correctCount} / ${TRIVIA_COUNT} correct`}
        onDone={onDone}
      />
    );
  }

  const current = questions[idx];

  return (
    <div className="mt-6 text-center">
      <Sparkles className="mx-auto text-fuchsia-400 mb-2" size={32} />
      <h3 className="text-xl font-bold text-fuchsia-300 uppercase">Fun Facts Trivia</h3>
      <p className="text-neutral-500 text-xs mb-5">
        Question {idx + 1} of {TRIVIA_COUNT} — ${TRIVIA_PER_CORRECT} per correct
      </p>

      <div className="bg-black/40 rounded-2xl p-6 mb-4 min-h-[120px] flex items-center justify-center">
        <p className="text-white text-base leading-relaxed">{current.question}</p>
      </div>

      {feedback === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(true)}
            className="py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-xl uppercase text-lg transition-colors"
          >
            True
          </button>
          <button
            onClick={() => answer(false)}
            className="py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-black rounded-xl uppercase text-lg transition-colors"
          >
            False
          </button>
        </div>
      ) : (
        <div
          className={`py-4 rounded-xl font-bold uppercase flex items-center justify-center gap-2 ${
            feedback === 'correct' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
          }`}
        >
          {feedback === 'correct' ? (
            <>
              <CheckCircle2 size={20} /> +${TRIVIA_PER_CORRECT}
            </>
          ) : (
            <>
              <XCircle size={20} /> Wrong
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Cooldown Screen ----------------

interface CooldownScreenProps {
  cooldownUntil: number;
  now: number;
}

function formatCooldown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function CooldownScreen({ cooldownUntil, now }: CooldownScreenProps) {
  const remainingMs = Math.max(0, cooldownUntil - now);
  const totalMs = COOLDOWN_MS;
  const progressPct = Math.min(100, ((totalMs - remainingMs) / totalMs) * 100);

  return (
    <div className="mt-6 text-center">
      <Clock className="mx-auto text-pink-400 mb-3" size={40} />
      <h3 className="text-xl font-bold text-pink-300 uppercase mb-2">On Break</h3>
      <p className="text-neutral-400 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
        Even quick money has limits. The Fun Station is cooling down — come back in a bit.
      </p>

      <div className="bg-black/40 rounded-2xl p-6 mb-4">
        <p className="text-neutral-500 text-[10px] uppercase mb-2 tracking-wider">Time Remaining</p>
        <p className="text-white font-mono font-black text-5xl tracking-wider">
          {formatCooldown(remainingMs)}
        </p>
      </div>

      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-pink-600 to-pink-400 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="text-neutral-600 text-[10px] italic">
        Tip: real income takes real time. So does real freedom from gambling.
      </p>
    </div>
  );
}

// ---------------- Result Screen ----------------

interface ResultScreenProps {
  earned: number;
  subtitle: string;
  onDone: () => void;
}

function ResultScreen({ earned, subtitle, onDone }: ResultScreenProps) {
  return (
    <div className="mt-6 text-center">
      <div className="text-5xl font-mono font-black text-green-400 mb-2">
        +${earned}
      </div>
      <p className="text-neutral-400 text-sm mb-6">{subtitle}</p>
      <button
        onClick={onDone}
        className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl uppercase text-sm transition-colors"
      >
        Back to Fun Station
      </button>
    </div>
  );
}
