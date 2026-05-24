import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Lightbulb,
  MessageSquareText,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getScoreColor, getScoreProgressColor, getScoreTextColor } from '../utils/score';
import type { InterviewDetail } from '../api/history';

interface InterviewDetailPanelProps {
  interview: InterviewDetail;
}

interface DiagnosisDimension {
  name: string;
  score: number;
  count: number;
  trend: 'strong' | 'watch' | 'weak';
}

interface LearningTask {
  title: string;
  detail: string;
  source: 'improvement' | 'answer' | 'fallback';
}

interface RetestFocus {
  title: string;
  detail: string;
  priority: 'high' | 'medium';
}

interface AnswerRecord {
  questionIndex?: number;
  question?: string;
  category?: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
  referenceAnswer?: string;
  keyPoints?: string[];
}

interface BackendDiagnosisDimension {
  name?: string;
  label?: string;
  dimension?: string;
  category?: string;
  score?: number;
  value?: number;
  questionCount?: number;
  count?: number;
}

interface BackendActionItem {
  title?: string;
  label?: string;
  task?: string;
  action?: string;
  detail?: string;
  description?: string;
  reason?: string;
  focus?: string;
  question?: string;
  passCriteria?: string;
  priority?: string;
  level?: string;
}

const EMPTY_LIST: never[] = [];

export default function InterviewDetailPanel({ interview }: InterviewDetailPanelProps) {
  const answers = useMemo(() => normalizeAnswers(interview.answers), [interview.answers]);

  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(() => {
    const allIndices = new Set<number>();
    answers.forEach((_, idx) => allIndices.add(idx));
    return allIndices;
  });

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const score = interview.overallScore ?? 0;
  const answeredCount = answers.filter(answer => Boolean(answer.userAnswer?.trim())).length;

  const { scorePercent, circumference, strokeDashoffset } = useMemo(() => {
    const percent = Math.max(0, Math.min(100, score));
    const circ = 2 * Math.PI * 54;
    const offset = circ - (percent / 100) * circ;
    return { scorePercent: percent, circumference: circ, strokeDashoffset: offset };
  }, [score]);

  const categoryScoreMap = useMemo(() => {
    const raw = getOptionalRecord(interview).categoryScores;
    if (!Array.isArray(raw)) return new Map<string, { score: number; count: number }>();

    const entries = raw
      .map(item => normalizeBackendDimension(item))
      .filter((item): item is Required<Pick<DiagnosisDimension, 'name' | 'score' | 'count'>> => {
        return Boolean(item.name) && typeof item.score === 'number' && typeof item.count === 'number';
      });

    return new Map(entries.map(item => [item.name, { score: item.score, count: item.count }]));
  }, [interview]);

  const dimensions = useMemo(() => {
    const backendDimensions = pickDiagnosisDimensions(interview);
    if (backendDimensions.length > 0) return backendDimensions;

    const grouped = new Map<string, { total: number; count: number }>();
    answers.forEach(answer => {
      const category = answer.category?.trim() || '综合能力';
      const value = typeof answer.score === 'number' ? answer.score : 0;
      const current = grouped.get(category) ?? { total: 0, count: 0 };
      grouped.set(category, { total: current.total + value, count: current.count + 1 });
    });

    const fromAnswers = Array.from(grouped.entries()).map(([name, value]) => {
      const mapped = categoryScoreMap.get(name);
      const count = mapped?.count ?? value.count;
      const scoreValue = mapped?.score ?? Math.round(value.total / Math.max(value.count, 1));
      return createDiagnosisDimension(name, scoreValue, count);
    });

    if (fromAnswers.length > 0) {
      return fromAnswers.sort((a, b) => b.score - a.score);
    }

    if (typeof interview.overallScore === 'number') {
      return [createDiagnosisDimension('整体表现', interview.overallScore, (interview.totalQuestions ?? answers.length) || 1)];
    }

    return [];
  }, [answers, categoryScoreMap, interview]);

  const strongestDimension = dimensions[0] ?? null;
  const weakestDimension = dimensions.length > 1 ? dimensions[dimensions.length - 1] : null;

  const learningTasks = useMemo(() => pickLearningTasks(interview, answers, dimensions), [interview, answers, dimensions]);
  const retestFocus = useMemo(() => pickRetestFocus(interview, answers, dimensions), [interview, answers, dimensions]);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ScoreCard
        score={interview.overallScore}
        feedback={interview.overallFeedback}
        scorePercent={scorePercent}
        circumference={circumference}
        strokeDashoffset={strokeDashoffset}
        totalQuestions={interview.totalQuestions}
        answeredCount={answeredCount}
        strongestDimension={strongestDimension}
        weakestDimension={weakestDimension}
      />

      {dimensions.length > 0 && <DiagnosisSection dimensions={dimensions} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StrengthsSection strengths={interview.strengths ?? []} dimensions={dimensions} />
        <ImprovementsSection improvements={interview.improvements ?? []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LearningTasksSection tasks={learningTasks} />
        <RetestFocusSection focusItems={retestFocus} />
      </div>

      <QuestionsSection
        answers={answers}
        expandedQuestions={expandedQuestions}
        toggleQuestion={toggleQuestion}
      />
    </motion.div>
  );
}

function ScoreCard({
  score,
  feedback,
  scorePercent,
  circumference,
  strokeDashoffset,
  totalQuestions,
  answeredCount,
  strongestDimension,
  weakestDimension,
}: {
  score: number | null;
  feedback: string | null;
  scorePercent: number;
  circumference: number;
  strokeDashoffset: number;
  totalQuestions?: number | null;
  answeredCount: number;
  strongestDimension: DiagnosisDimension | null;
  weakestDimension: DiagnosisDimension | null;
}) {
  const highlights = [
    totalQuestions ? `共 ${totalQuestions} 题，已记录 ${answeredCount} 题作答` : null,
    strongestDimension ? `优势维度：${strongestDimension.name}（${strongestDimension.score} 分）` : null,
    weakestDimension ? `优先补强：${weakestDimension.name}（${weakestDimension.score} 分）` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg shadow-indigo-900/20">
      <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-8 items-center">
        <div className="flex justify-center">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-4xl font-bold"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {score ?? '-'}
              </motion.span>
              <span className="text-sm text-white/75">综合得分</span>
              <span className="text-xs text-white/60 mt-1">{scorePercent}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/12 text-sm text-white/85 mb-3">
              <Radar className="w-4 h-4" />
              诊断报告
            </div>
            <h3 className="text-2xl font-bold mb-3">本次面试表现概览</h3>
            <p className="text-white/90 max-w-3xl leading-relaxed">
              {feedback || '已根据答题表现生成基础诊断，你可以结合下方维度、学习任务与复测重点安排下一轮练习。'}
            </p>
          </div>

          {highlights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {highlights.map(item => (
                <div key={item} className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white/90">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiagnosisSection({ dimensions }: { dimensions: DiagnosisDimension[] }) {
  return (
    <motion.section
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            强弱项维度
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            优先看低分维度，再结合每题诊断安排针对性训练。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {dimensions.map((dimension, index) => (
          <div
            key={`${dimension.name}-${index}`}
            className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30 p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{dimension.name}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${trendBadgeClass(dimension.trend)}`}>
                {dimension.trend === 'strong' ? '优势' : dimension.trend === 'watch' ? '可提升' : '待补强'}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <div className={`text-3xl font-bold ${getScoreTextColor(dimension.score, [85, 70])}`}>
                  {dimension.score}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">涉及 {dimension.count} 题</div>
              </div>
              <TrendingUp className={`w-5 h-5 ${getScoreTextColor(dimension.score, [85, 70])}`} />
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${getScoreProgressColor(dimension.score, [85, 70])}`}
                style={{ width: `${Math.max(6, dimension.score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function StrengthsSection({ strengths, dimensions }: { strengths: string[]; dimensions: DiagnosisDimension[] }) {
  const fallback = dimensions
    .filter(dimension => dimension.trend === 'strong')
    .slice(0, 3)
    .map(dimension => `${dimension.name} 表现稳定，建议继续保持并沉淀成可复用的答题模板。`);

  const items = uniqueNonEmptyStrings(strengths).length > 0
    ? uniqueNonEmptyStrings(strengths)
    : fallback;

  return (
    <motion.section
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <SectionHeader
        icon={<Sparkles className="w-5 h-5 text-emerald-500" />}
        title="优势亮点"
        description="这些点适合在下一轮继续放大，变成稳定得分项。"
      />
      <BulletList
        items={items}
        dotClassName="bg-emerald-500"
        emptyText="暂未生成优势亮点，建议从得分最高的维度中提炼可复用表达。"
      />
    </motion.section>
  );
}

function ImprovementsSection({ improvements }: { improvements: string[] }) {
  return (
    <motion.section
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
    >
      <SectionHeader
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        title="薄弱点与改进建议"
        description="把改进建议当作待办池，优先解决会持续失分的问题。"
      />
      <BulletList
        items={uniqueNonEmptyStrings(improvements)}
        dotClassName="bg-amber-500"
        emptyText="当前没有返回明确的改进建议，可直接查看下方学习任务与复测重点。"
      />
    </motion.section>
  );
}

function LearningTasksSection({ tasks }: { tasks: LearningTask[] }) {
  return (
    <motion.section
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <SectionHeader
        icon={<BookOpen className="w-5 h-5 text-primary-500" />}
        title="接下来学习任务"
        description="按“先补短板，再固化模板”的顺序安排练习。"
      />

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={`${task.title}-${index}`}
            className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 dark:text-white">{task.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {task.source === 'improvement' ? '改进建议' : task.source === 'answer' ? '答题诊断' : '自动补全'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{task.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function RetestFocusSection({ focusItems }: { focusItems: RetestFocus[] }) {
  return (
    <motion.section
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
    >
      <SectionHeader
        icon={<ClipboardList className="w-5 h-5 text-fuchsia-500" />}
        title="下轮复测重点"
        description="下一次模拟面试优先验证这些点是否真正补上。"
      />

      <div className="space-y-3">
        {focusItems.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 dark:text-white">{item.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.priority === 'high'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {item.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{item.detail}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function QuestionsSection({
  answers,
  expandedQuestions,
  toggleQuestion,
}: {
  answers: AnswerRecord[];
  expandedQuestions: Set<number>;
  toggleQuestion: (index: number) => void;
}) {
  return (
    <section>
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
        <MessageSquareText className="w-5 h-5 text-primary-500" />
        逐题诊断明细
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        展开后可查看原始回答、诊断点评与参考要点，便于复盘每一道题的失分原因。
      </p>

      <div className="space-y-4">
        {answers.map((answer, idx) => (
          <QuestionCard
            key={idx}
            answer={answer}
            index={idx}
            isExpanded={expandedQuestions.has(idx)}
            onToggle={() => toggleQuestion(idx)}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({
  answer,
  index,
  isExpanded,
  onToggle,
}: {
  answer: AnswerRecord;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const answerScore = typeof answer.score === 'number' ? answer.score : 0;
  const answerCategory = answer.category?.trim() || '综合能力';
  const displayIndex = typeof answer.questionIndex === 'number' ? answer.questionIndex + 1 : index + 1;
  const keyPoints = uniqueNonEmptyStrings(answer.keyPoints ?? EMPTY_LIST);
  const scoreClassName = getScoreColor(answerScore, [80, 60]);

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.04 }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {displayIndex}
          </span>
          <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full flex-shrink-0">
            {answerCategory}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreClassName} flex-shrink-0`}>
            {answerScore} 分
          </span>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </div>

      <div className="px-5 pb-2">
        <p className="text-slate-800 dark:text-white font-medium leading-relaxed">
          {answer.question || '未记录题目内容'}
        </p>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              <QuestionSubCard
                icon={<MessageSquareText className="w-4 h-4 text-slate-500" />}
                title="你的回答"
                tone="neutral"
              >
                <p className={`leading-relaxed whitespace-pre-line ${
                  !answer.userAnswer || answer.userAnswer.trim() === '' || answer.userAnswer === '不知道'
                    ? 'text-red-500 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {answer.userAnswer?.trim() || '(未回答)'}
                </p>
              </QuestionSubCard>

              {answer.feedback && (
                <QuestionSubCard
                  icon={<Lightbulb className="w-4 h-4 text-primary-500" />}
                  title="诊断点评"
                  tone="primary"
                >
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {answer.feedback}
                  </p>
                </QuestionSubCard>
              )}

              {(answer.referenceAnswer || keyPoints.length > 0) && (
                <QuestionSubCard
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  title="参考答案与要点"
                  tone="success"
                >
                  {answer.referenceAnswer && (
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {answer.referenceAnswer}
                    </p>
                  )}
                  {keyPoints.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {keyPoints.map((point, pointIndex) => (
                        <li key={`${point}-${pointIndex}`} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </QuestionSubCard>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuestionSubCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: 'neutral' | 'primary' | 'success';
  children: React.ReactNode;
}) {
  const toneClassName = tone === 'primary'
    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900/30'
    : tone === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600';

  return (
    <div className={`rounded-xl p-4 border ${toneClassName}`}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2 font-medium">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function BulletList({
  items,
  dotClassName,
  emptyText,
}: {
  items: string[];
  dotClassName: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="text-slate-700 dark:text-slate-300 flex items-start gap-3">
          <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotClassName}`} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function normalizeAnswers(rawAnswers: InterviewDetail['answers'] | undefined): AnswerRecord[] {
  if (!Array.isArray(rawAnswers)) return [];

  return rawAnswers.map(answer => ({
    questionIndex: answer.questionIndex,
    question: answer.question,
    category: answer.category,
    userAnswer: answer.userAnswer,
    score: typeof answer.score === 'number' ? answer.score : undefined,
    feedback: answer.feedback,
    referenceAnswer: answer.referenceAnswer ?? undefined,
    keyPoints: Array.isArray(answer.keyPoints)
      ? answer.keyPoints.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined,
  }));
}

function pickDiagnosisDimensions(interview: InterviewDetail): DiagnosisDimension[] {
  const record = getOptionalRecord(interview);
  const candidates = [
    record.diagnosisDimensions,
    record.strengthWeaknessDimensions,
    record.dimensions,
    record.categoryScores,
  ];

  const firstArray = candidates.find(Array.isArray);
  if (!firstArray) return [];

  const dimensions = firstArray
    .map(item => normalizeBackendDimension(item))
    .filter((item): item is Required<Pick<DiagnosisDimension, 'name' | 'score' | 'count'>> => {
      return Boolean(item.name) && typeof item.score === 'number' && typeof item.count === 'number';
    })
    .map(item => createDiagnosisDimension(item.name, item.score, item.count));

  return dedupeDimensions(dimensions).sort((a, b) => b.score - a.score).slice(0, 6);
}

function pickLearningTasks(
  interview: InterviewDetail,
  answers: AnswerRecord[],
  dimensions: DiagnosisDimension[]
): LearningTask[] {
  const record = getOptionalRecord(interview);
  const backendTasks = [record.learningTasks, record.actionItems, record.studyTasks]
    .find(Array.isArray);

  const normalizedBackendTasks = Array.isArray(backendTasks)
    ? backendTasks
      .map(item => normalizeBackendTask(item))
      .filter((item): item is LearningTask => item !== null)
    : [];

  if (normalizedBackendTasks.length > 0) {
    return uniqueTasks(normalizedBackendTasks).slice(0, 4);
  }

  const improvementTasks = uniqueNonEmptyStrings(interview.improvements ?? EMPTY_LIST)
    .slice(0, 3)
    .map((item, index) => ({
      title: `任务 ${index + 1}`,
      detail: normalizeTaskDetail(item),
      source: 'improvement' as const,
    }));

  const weakAnswerTasks = answers
    .filter(answer => typeof answer.score === 'number' && answer.score < 70)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 2)
    .map(answer => ({
      title: `${answer.category?.trim() || '综合能力'} 低分题复盘`,
      detail: answer.feedback?.trim()
        || `回看第 ${(answer.questionIndex ?? 0) + 1} 题，补充标准答题结构与关键知识点。`,
      source: 'answer' as const,
    }));

  const fallbackDimension = dimensions.find(dimension => dimension.trend !== 'strong');
  const fallbackTasks = fallbackDimension
    ? [{
      title: `补强 ${fallbackDimension.name}`,
      detail: `围绕 ${fallbackDimension.name} 连续练习 3-5 道题，形成“概念解释 + 方案权衡 + 落地细节”的稳定回答框架。`,
      source: 'fallback' as const,
    }]
    : [{
      title: '整理高频题模板',
      detail: '把本次回答中表现最好的题型整理成模板，下一轮练习时重点验证表达是否更清晰。',
      source: 'fallback' as const,
    }];

  return uniqueTasks([...improvementTasks, ...weakAnswerTasks, ...fallbackTasks]).slice(0, 4);
}

function pickRetestFocus(
  interview: InterviewDetail,
  answers: AnswerRecord[],
  dimensions: DiagnosisDimension[]
): RetestFocus[] {
  const record = getOptionalRecord(interview);
  const backendFocus = [record.nextRoundFocus, record.retestFocus, record.followUpFocus]
    .find(Array.isArray);

  const normalizedBackendFocus = Array.isArray(backendFocus)
    ? backendFocus
      .map(item => normalizeRetestFocus(item))
      .filter((item): item is RetestFocus => item !== null)
    : [];

  if (normalizedBackendFocus.length > 0) {
    return uniqueFocusItems(normalizedBackendFocus).slice(0, 4);
  }

  const answerFocus = mergeRetestFocusByTitle(
    answers
      .filter(answer => typeof answer.score === 'number' && answer.score < 75)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .map((answer, index) => createRetestFocusFromAnswer(answer, index === 0 ? 'high' : 'medium'))
  );

  if (answerFocus.length > 0) {
    return answerFocus.slice(0, 3);
  }

  const fallbackDimension = dimensions.find(dimension => dimension.trend !== 'strong');
  if (fallbackDimension) {
    return [{
      title: '关键短板稳定性复测',
      detail: `下一轮围绕 ${fallbackDimension.name} 对应的真实应用场景继续追问，确认你能否稳定说清问题背景、核心方案、关键证据和实现边界。`,
      priority: 'medium',
    }];
  }

  return [{
    title: '综合追问稳定性',
    detail: '在下一轮增加追问和场景化变体，确认改进项不是“知道答案”，而是真正能稳定讲清楚。',
    priority: 'medium',
  }];
}

function normalizeBackendDimension(item: unknown): Partial<DiagnosisDimension> {
  if (!isRecord(item)) return {};

  const raw = item as BackendDiagnosisDimension;
  const name = firstNonEmptyString(raw.name, raw.label, raw.dimension, raw.category);
  const score = firstFiniteNumber(raw.score, raw.value);
  const count = firstFiniteNumber(raw.questionCount, raw.count) ?? 1;

  if (!name || score === undefined) return {};
  return { name, score, count };
}

function normalizeBackendTask(item: unknown): LearningTask | null {
  if (typeof item === 'string' && item.trim()) {
    return {
      title: '学习任务',
      detail: normalizeTaskDetail(item),
      source: 'improvement',
    };
  }

  if (!isRecord(item)) return null;
  const raw = item as BackendActionItem;
  const title = firstNonEmptyString(raw.title, raw.label, raw.task, raw.action) ?? '学习任务';
  const detail = firstNonEmptyString(raw.detail, raw.description, raw.reason, raw.focus, raw.action, raw.task);

  if (!detail) return null;

  return {
    title,
    detail: normalizeTaskDetail(detail),
    source: 'improvement',
  };
}

function normalizeRetestFocus(item: unknown): RetestFocus | null {
  if (typeof item === 'string' && item.trim()) {
    return {
      title: '下轮复测重点',
      detail: item.trim(),
      priority: 'medium',
    };
  }

  if (!isRecord(item)) return null;
  const raw = item as BackendActionItem;
  const title = firstNonEmptyString(raw.title, raw.label, raw.focus, raw.task) ?? '下轮复测重点';
  const structuredQuestion = firstNonEmptyString(raw.question);
  const structuredPassCriteria = firstNonEmptyString(raw.passCriteria);
  const detail = structuredQuestion && structuredPassCriteria
    ? `复测问题：${structuredQuestion}\n通过标准：${structuredPassCriteria}`
    : firstNonEmptyString(raw.detail, raw.description, raw.reason, raw.focus, raw.action, raw.task);

  if (!detail) return null;

  const priorityText = firstNonEmptyString(raw.priority, raw.level)?.toLowerCase();
  const priority = priorityText === 'high' || priorityText === 'critical' ? 'high' : 'medium';

  return { title, detail, priority };
}

function createRetestFocusFromAnswer(
  answer: AnswerRecord,
  priority: 'high' | 'medium'
): RetestFocus {
  const question = answer.question?.trim() ?? '';
  const normalizedQuestion = question.toLowerCase();
  const title = inferRetestTitle(answer, normalizedQuestion);
  const detail = buildRetestDetail(title, question);
  return { title, detail, priority };
}

function inferRetestTitle(answer: AnswerRecord, normalizedQuestion: string): string {
  const category = answer.category?.trim() ?? '';

  if (containsAny(normalizedQuestion, ['接口', '对接', '数据流', 'topic', '格式', '传给', '输出什么'])) {
    return '模块接口与数据流复测';
  }
  if (containsAny(normalizedQuestion, ['指标', '量化', '评估', '实验', '验证', 'baseline', '对比'])) {
    return '实验验证与量化指标复测';
  }
  if (containsAny(normalizedQuestion, ['为什么', '选择', '替代方案', 'trade-off', '权衡'])) {
    return '方案选型与设计权衡复测';
  }
  if (containsAny(normalizedQuestion, ['负责', '贡献', '你做了什么', '个人完成', '参与边界'])) {
    return '个人贡献边界复测';
  }
  if (containsAny(normalizedQuestion, ['项目', '方案', '输入', '输出', '原理'])) {
    return '项目真实性与技术链路复测';
  }
  if (category) {
    return `${category} 关键能力复测`;
  }
  return '关键短板复测';
}

function buildRetestDetail(title: string, question: string): string {
  const trimmedQuestion = question.trim();
  if (title === '模块接口与数据流复测') {
    return trimmedQuestion
      ? `下轮重点追问模块之间怎么对接。可以从这类问题开始：“${trimmedQuestion}”。通过标准是你能说清输入、输出、传递格式、接口位置，以及你的模块和后续模块如何衔接。`
      : '下轮重点追问模块之间怎么对接，确认你能说清输入、输出、传递格式、接口位置，以及模块之间如何衔接。';
  }
  if (title === '实验验证与量化指标复测') {
    return trimmedQuestion
      ? `下轮重点验证你是否补上了结果可信性的证据。可以从这类问题开始：“${trimmedQuestion}”。通过标准是你能说出至少 2 个量化指标或明确的验证方式，并解释这些证据为什么能支持结论。`
      : '下轮重点验证你是否补上了结果可信性的证据。通过标准是你能说出至少 2 个量化指标或明确的验证方式，并解释这些证据为什么能支持结论。';
  }
  if (title === '方案选型与设计权衡复测') {
    return trimmedQuestion
      ? `下轮重点验证你是否真正理解为什么这样设计。可以从这类问题开始：“${trimmedQuestion}”。通过标准是你能说清选择理由、替代方案，以及这种方案在当前场景下的边界和代价。`
      : '下轮重点验证你是否真正理解为什么这样设计。通过标准是你能说清选择理由、替代方案，以及这种方案在当前场景下的边界和代价。';
  }
  if (title === '个人贡献边界复测') {
    return trimmedQuestion
      ? `下轮重点核验你的个人贡献是否清楚。可以从这类问题开始：“${trimmedQuestion}”。通过标准是你能明确区分自己负责的部分、和同学或系统其他模块的分工，以及你亲自解决过的关键问题。`
      : '下轮重点核验你的个人贡献是否清楚。通过标准是你能明确区分自己负责的部分、和同学或系统其他模块的分工，以及你亲自解决过的关键问题。';
  }
  if (title === '项目真实性与技术链路复测') {
    return trimmedQuestion
      ? `下轮重点核验你能否把项目讲完整。可以从这类问题开始：“${trimmedQuestion}”。通过标准是你能说清核心方案、关键输入输出、实现链路，以及这部分工作和整体项目目标的关系。`
      : '下轮重点核验你能否把项目讲完整。通过标准是你能说清核心方案、关键输入输出、实现链路，以及这部分工作和整体项目目标的关系。';
  }
  return trimmedQuestion
    ? `下轮继续围绕这类问题复测：“${trimmedQuestion}”。通过标准是你能补齐关键论证、实现细节和回答结构，而不是只给出泛泛描述。`
    : '下轮继续围绕本轮低分点复测，确认你能补齐关键论证、实现细节和回答结构，而不是只给出泛泛描述。';
}

function mergeRetestFocusByTitle(items: RetestFocus[]): RetestFocus[] {
  const merged = new Map<string, RetestFocus>();
  for (const item of items) {
    const existing = merged.get(item.title);
    if (!existing) {
      merged.set(item.title, item);
      continue;
    }
    if (existing.priority !== 'high' && item.priority === 'high') {
      merged.set(item.title, item);
    }
  }
  return Array.from(merged.values());
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function createDiagnosisDimension(name: string, score: number, count: number): DiagnosisDimension {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const trend: DiagnosisDimension['trend'] = normalizedScore >= 85
    ? 'strong'
    : normalizedScore >= 70
      ? 'watch'
      : 'weak';

  return {
    name,
    score: normalizedScore,
    count: Math.max(1, Math.round(count)),
    trend,
  };
}

function dedupeDimensions(dimensions: DiagnosisDimension[]): DiagnosisDimension[] {
  const seen = new Set<string>();
  return dimensions.filter(dimension => {
    const key = dimension.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueNonEmptyStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach(item => {
    const normalized = item.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
}

function uniqueTasks(tasks: LearningTask[]): LearningTask[] {
  const seen = new Set<string>();
  return tasks.filter(task => {
    const key = `${task.title}|${task.detail}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueFocusItems(items: RetestFocus[]): RetestFocus[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.title}|${item.detail}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeTaskDetail(detail: string): string {
  const normalized = detail.trim();
  if (!normalized) return '结合低分题与参考答案进行专项复盘。';
  return normalized.endsWith('。') || normalized.endsWith('.') ? normalized : `${normalized}。`;
}

function trendBadgeClass(trend: DiagnosisDimension['trend']): string {
  if (trend === 'strong') {
    return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (trend === 'watch') {
    return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300';
}

function firstFiniteNumber(...values: Array<number | null | undefined>): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function firstNonEmptyString(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getOptionalRecord(interview: InterviewDetail): Record<string, unknown> {
  return interview as unknown as Record<string, unknown>;
}
