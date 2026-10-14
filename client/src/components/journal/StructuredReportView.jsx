import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Trophy,
  AlertTriangle,
  Clock,
  ArrowRightCircle,
  FileText,
  Lightbulb,
  Plus,
  Edit3,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Languages,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const StructuredReportView = ({
  report,
  isProcessing,
  onGenerate,
  onSaveEditedReport,
  outputLanguage = 'original',
  onChangeLanguage,
  onCreateTaskFromBullet,
  originalTextExists = false,
  lastStructuredAt = null,
}) => {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable local state
  const [editedSummary, setEditedSummary] = useState('');
  const [editedCompleted, setEditedCompleted] = useState('');
  const [editedLearnings, setEditedLearnings] = useState('');
  const [editedAchievements, setEditedAchievements] = useState('');
  const [editedChallenges, setEditedChallenges] = useState('');
  const [editedPending, setEditedPending] = useState('');
  const [editedTomorrow, setEditedTomorrow] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  const hasReport = Boolean(
    report &&
      (report.summary ||
        (report.completedActivities && report.completedActivities.length > 0) ||
        (report.learnings && report.learnings.length > 0) ||
        (report.challenges && report.challenges.length > 0) ||
        (report.tomorrowPlan && report.tomorrowPlan.length > 0))
  );

  const startEditing = () => {
    setEditedSummary(report?.summary || '');
    setEditedCompleted((report?.completedActivities || []).join('\n'));
    setEditedLearnings((report?.learnings || []).join('\n'));
    setEditedAchievements((report?.achievements || []).join('\n'));
    setEditedChallenges((report?.challenges || []).join('\n'));
    setEditedPending((report?.pendingWork || []).join('\n'));
    setEditedTomorrow((report?.tomorrowPlan || []).join('\n'));
    setEditedNotes((report?.additionalNotes || []).join('\n'));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const splitLines = (str) =>
      str
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

    const updated = {
      summary: editedSummary.trim(),
      completedActivities: splitLines(editedCompleted),
      learnings: splitLines(editedLearnings),
      achievements: splitLines(editedAchievements),
      challenges: splitLines(editedChallenges),
      pendingWork: splitLines(editedPending),
      tomorrowPlan: splitLines(editedTomorrow),
      additionalNotes: splitLines(editedNotes),
      aiSuggestions: report?.aiSuggestions || [],
    };

    onSaveEditedReport(updated);
    setIsEditing(false);
    toast.success('Structured report updated!');
  };

  const handleCopyMarkdown = () => {
    if (!report) return;

    let md = `# Daily Productivity Report\n\n`;
    if (report.summary) md += `**Summary**: ${report.summary}\n\n`;

    const addSection = (title, items) => {
      if (items && items.length > 0) {
        md += `### ${title}\n`;
        items.forEach((item) => {
          md += `- ${item}\n`;
        });
        md += `\n`;
      }
    };

    addSection('✅ Completed Activities', report.completedActivities);
    addSection('🎓 Learning & Skills Practiced', report.learnings);
    addSection('🏆 Achievements & Milestones', report.achievements);
    addSection('⚠️ Challenges & Blockers', report.challenges);
    addSection('⏳ Pending Work', report.pendingWork);
    addSection('🚀 Tomorrow Plan', report.tomorrowPlan);
    addSection('📝 Additional Notes', report.additionalNotes);
    addSection('💡 AI Suggestions', report.aiSuggestions);

    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success('Report copied to clipboard as Markdown!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Render a bullet section
  const renderSection = ({
    title,
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
    items,
    sectionKey,
    emptyText = 'Not mentioned',
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`p-4 rounded-xl ${bgColor} border ${borderColor} transition-all`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {title}
            </h4>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <ul className="space-y-1.5">
          {items.map((bullet, idx) => (
            <li
              key={idx}
              className="group flex items-start justify-between gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 py-1 px-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-slate-400 mt-1 select-none">•</span>
                <span className="break-words">{bullet}</span>
              </div>

              {/* Action to create a task from this bullet */}
              <button
                type="button"
                onClick={() => onCreateTaskFromBullet(bullet, sectionKey)}
                title="Create task from this bullet"
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Task</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              AI Structured Daily Report
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {lastStructuredAt
                ? `Structured on ${new Date(lastStructuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Transforms raw notes into organized bullet points'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={outputLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="original">Original Voice (Hindi/Hinglish/English)</option>
              <option value="english">Standard English</option>
              <option value="hindi">Clean Hindi</option>
            </select>
          </div>

          {hasReport && !isEditing && (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit report directly"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy report as Markdown"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* Generate / Regenerate Button */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isProcessing || !originalTextExists}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98] ${
              hasReport
                ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Analyzing...' : hasReport ? 'Regenerate' : 'Generate AI Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Processing State */}
        {isProcessing && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-pulse">
              <Sparkles className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                AI is structuring your daily journal...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Parsing Hindi/Hinglish/English notes into daily summary, completed tasks, skills learned, blockers, and tomorrow's plan.
              </p>
            </div>
          </div>
        )}

        {/* Empty State when no report yet */}
        {!isProcessing && !hasReport && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Transform Freeform Notes into Smart Progress
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Write freely in the editor on the left. When ready, click <span className="font-semibold text-indigo-600 dark:text-indigo-400">"Generate AI Report"</span> to get an organized, verifiable breakdown of your day without losing your original text.
              </p>
            </div>
            {originalTextExists && (
              <button
                type="button"
                onClick={onGenerate}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-600/20 active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Structured Report</span>
              </button>
            )}
          </div>
        )}

        {/* Edit Report Mode */}
        {!isProcessing && hasReport && isEditing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Editing Structured Report
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Executive Daily Summary
              </label>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Completed Activities (1 per line)
                </label>
                <textarea
                  value={editedCompleted}
                  onChange={(e) => setEditedCompleted(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  Learnings & Skills (1 per line)
                </label>
                <textarea
                  value={editedLearnings}
                  onChange={(e) => setEditedLearnings(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                  Challenges & Blockers (1 per line)
                </label>
                <textarea
                  value={editedChallenges}
                  onChange={(e) => setEditedChallenges(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                  Tomorrow Plan (1 per line)
                </label>
                <textarea
                  value={editedTomorrow}
                  onChange={(e) => setEditedTomorrow(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Structured Report View */}
        {!isProcessing && hasReport && !isEditing && (
          <div className="space-y-4">
            {/* Daily Summary Hero Card */}
            {report.summary && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/60 dark:border-purple-900/50">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  Daily Summary
                </span>
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {report.summary}
                </p>
              </div>
            )}

            {/* 1. Completed Activities */}
            {renderSection({
              title: 'Completed Activities',
              icon: CheckCircle2,
              iconColor: 'text-emerald-500',
              bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
              borderColor: 'border-emerald-100 dark:border-emerald-900/40',
              items: report.completedActivities,
              sectionKey: 'completedActivities',
            })}

            {/* 2. Learnings & Skills Practiced */}
            {renderSection({
              title: 'Learning & Skills Practiced',
              icon: GraduationCap,
              iconColor: 'text-indigo-500',
              bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/20',
              borderColor: 'border-indigo-100 dark:border-indigo-900/40',
              items: report.learnings,
              sectionKey: 'learnings',
            })}

            {/* 3. Achievements & Milestones */}
            {renderSection({
              title: 'Achievements & Milestones',
              icon: Trophy,
              iconColor: 'text-amber-500',
              bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
              borderColor: 'border-amber-100 dark:border-amber-900/40',
              items: report.achievements,
              sectionKey: 'achievements',
            })}

            {/* 4. Challenges & Blockers */}
            {renderSection({
              title: 'Challenges & Blockers',
              icon: AlertTriangle,
              iconColor: 'text-rose-500',
              bgColor: 'bg-rose-50/50 dark:bg-rose-950/20',
              borderColor: 'border-rose-100 dark:border-rose-900/40',
              items: report.challenges,
              sectionKey: 'challenges',
            })}

            {/* 5. Incomplete or Pending Work */}
            {renderSection({
              title: 'Incomplete or Pending Work',
              icon: Clock,
              iconColor: 'text-orange-500',
              bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
              borderColor: 'border-orange-100 dark:border-orange-900/40',
              items: report.pendingWork,
              sectionKey: 'pendingWork',
            })}

            {/* 6. Tomorrow\'s Plan */}
            {renderSection({
              title: "Tomorrow's Plan",
              icon: ArrowRightCircle,
              iconColor: 'text-cyan-500',
              bgColor: 'bg-cyan-50/50 dark:bg-cyan-950/20',
              borderColor: 'border-cyan-100 dark:border-cyan-900/40',
              items: report.tomorrowPlan,
              sectionKey: 'tomorrowPlan',
            })}

            {/* 7. Additional Notes */}
            {renderSection({
              title: 'Additional Notes',
              icon: FileText,
              iconColor: 'text-slate-500',
              bgColor: 'bg-slate-50 dark:bg-slate-800/40',
              borderColor: 'border-slate-200 dark:border-slate-800',
              items: report.additionalNotes,
              sectionKey: 'additionalNotes',
            })}

            {/* 8. AI Suggestions (Distinguished with AI badge) */}
            {report.aiSuggestions && report.aiSuggestions.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-200">
                      AI Productivity Suggestions
                    </h4>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                    AI SUGGESTION
                  </span>
                </div>

                <ul className="space-y-1.5 pt-1">
                  {report.aiSuggestions.map((sug, idx) => (
                    <li
                      key={idx}
                      className="group flex items-start justify-between gap-2 text-xs sm:text-sm text-purple-900 dark:text-purple-200 py-1 px-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 select-none">💡</span>
                        <span>{sug}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCreateTaskFromBullet(sug, 'aiSuggestions')}
                        title="Turn suggestion into task"
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white shrink-0 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Task</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StructuredReportView;
