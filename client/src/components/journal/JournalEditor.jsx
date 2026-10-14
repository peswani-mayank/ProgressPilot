import React, { useEffect, useRef } from 'react';
import {
  Check,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Languages,
  PenTool,
} from 'lucide-react';

const PROMPT_CHIPS = [
  { label: '🎯 Aaj kya kiya?', text: 'Aaj maine ' },
  { label: '💡 What did you learn?', text: 'Key learning today: ' },
  { label: '⚠️ Blockers / Bugs', text: 'Challenge/Blocker: ' },
  { label: '🚀 Tomorrow plan', text: 'Kal ka plan: ' },
];

export const JournalEditor = ({
  text,
  onChange,
  saveState, // 'saved' | 'saving' | 'failed' | 'unsaved'
  lastSavedAt,
  onRetrySave,
  selectedDate,
  readOnly = false,
}) => {
  const textareaRef = useRef(null);

  // Count words and characters
  const charCount = text ? text.length : 0;
  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  // Insert prompt chip text at cursor
  const handleInsertPrompt = (promptText) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;

    const prefix = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
    const newText = text.substring(0, start) + prefix + promptText + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + promptText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Editor Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Freeform Daily Journal
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Write freely in Hindi, Hinglish, or English
            </p>
          </div>
        </div>

        {/* Auto-Save Status Badge */}
        <div className="flex items-center gap-2">
          {saveState === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving draft...</span>
            </span>
          )}

          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>
                Saved {lastSavedAt ? `at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </span>
          )}

          {saveState === 'failed' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Save failed</span>
              <button
                onClick={onRetrySave}
                type="button"
                className="ml-1 p-0.5 rounded hover:bg-rose-200/50 dark:hover:bg-rose-900/50 transition-colors"
                title="Retry saving"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {saveState === 'unsaved' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>
      </div>

      {/* Multilingual Guidance / Prompt Chips */}
      <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Prompts:
        </span>
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleInsertPrompt(chip.text)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 transition-colors shrink-0 font-medium"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main Large Distraction-Free Textarea */}
      <div className="flex-1 p-5 flex flex-col min-h-[360px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder={`Aaj ka din kaisa raha? What did you build, study, or learn today?

Examples:
- "Aaj LeetCode ke 3 medium dynamic programming questions solve kiye. Logic me thoda phansa but solved."
- "Studied MongoDB indexing and compound queries for 2 hours."
- "Blocker: Docker compose networking issue when connecting client with API."
- "Kal subah resume update karke 5 companies me apply karna hai."

Feel free to write naturally in English, Hindi, or Hinglish!`}
          className="w-full flex-1 resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base leading-relaxed focus:outline-none font-normal"
        />
      </div>

      {/* Editor Footer / Word Count & Stats */}
      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <Languages className="w-3.5 h-3.5 text-indigo-500" />
          <span>Multilingual Input Supported</span>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
