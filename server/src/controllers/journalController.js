import DailyJournal from '../models/DailyJournal.js';
import { structureJournalText, generateWeeklyInsights } from '../services/aiJournalService.js';

/**
 * GET /api/journals
 * List user's journal entries with date range and search filtering
 */
export const getJournals = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { startDate, endDate, search, limit = 50 } = req.query;

    const query = { userId };

    if (startDate && endDate) {
      query.journalDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.journalDate = { $gte: startDate };
    } else if (endDate) {
      query.journalDate = { $lte: endDate };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { originalText: searchRegex },
        { 'structuredReport.summary': searchRegex },
        { 'structuredReport.completedActivities': searchRegex },
        { 'structuredReport.learnings': searchRegex },
      ];
    }

    const journals = await DailyJournal.find(query)
      .sort({ journalDate: -1 })
      .limit(parseInt(limit, 10))
      .populate('linkedTasks', 'title priority status')
      .populate('linkedGoals', 'title category progress');

    res.json({
      success: true,
      count: journals.length,
      journals,
    });
  } catch (err) {
    console.error('[Journal Controller] getJournals error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * GET /api/journals/dates
 * Fast metadata query for calendar indicators
 */
export const getJournalDates = async (req, res) => {
  try {
    const userId = req.user.uid;
    const entries = await DailyJournal.find({ userId })
      .select('journalDate structuredReport lastStructuredAt originalText updatedAt')
      .sort({ journalDate: -1 });

    const dateMap = entries.map((e) => ({
      journalDate: e.journalDate,
      hasStructuredReport: Boolean(e.lastStructuredAt || (e.structuredReport && e.structuredReport.summary)),
      hasContent: Boolean(e.originalText && e.originalText.trim().length > 0),
      id: e._id,
    }));

    res.json(dateMap);
  } catch (err) {
    console.error('[Journal Controller] getJournalDates error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * GET /api/journals/by-date/:date
 * Fetch journal for a specific YYYY-MM-DD
 */
export const getJournalByDate = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { date } = req.params;

    const journal = await DailyJournal.findOne({ userId, journalDate: date })
      .populate('linkedTasks', 'title priority status dueDate')
      .populate('linkedGoals', 'title category progress');

    if (!journal) {
      return res.json({ journal: null });
    }

    res.json({ journal });
  } catch (err) {
    console.error('[Journal Controller] getJournalByDate error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * GET /api/journals/insights/weekly
 * Get synthesized weekly insights
 */
export const getWeeklyInsightsHandler = async (req, res) => {
  try {
    const userId = req.user.uid;
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      // Default to last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      endDate = end.toISOString().split('T')[0];
      startDate = start.toISOString().split('T')[0];
    }

    const journals = await DailyJournal.find({
      userId,
      journalDate: { $gte: startDate, $lte: endDate },
    }).sort({ journalDate: 1 });

    const insights = await generateWeeklyInsights(journals);

    res.json({
      startDate,
      endDate,
      ...insights,
    });
  } catch (err) {
    console.error('[Journal Controller] getWeeklyInsights error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * GET /api/journals/:id
 * Fetch single journal entry by ID
 */
export const getJournalById = async (req, res) => {
  try {
    const userId = req.user.uid;
    const journal = await DailyJournal.findOne({ _id: req.params.id, userId })
      .populate('linkedTasks', 'title priority status dueDate')
      .populate('linkedGoals', 'title category progress');

    if (!journal) {
      return res.status(404).json({ error: 'Not Found', message: 'Journal entry not found.' });
    }

    res.json(journal);
  } catch (err) {
    console.error('[Journal Controller] getJournalById error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * POST /api/journals
 * Create or upsert a journal entry for a given date
 */
export const saveJournal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      journalDate,
      originalText = '',
      outputLanguage = 'original',
      linkedTasks = [],
      linkedGoals = [],
    } = req.body;

    if (!journalDate || !/^\d{4}-\d{2}-\d{2}$/.test(journalDate)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid journalDate in YYYY-MM-DD format is required.',
      });
    }

    const journal = await DailyJournal.findOneAndUpdate(
      { userId, journalDate },
      {
        $set: {
          originalText,
          outputLanguage,
          linkedTasks,
          linkedGoals,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(journal);
  } catch (err) {
    console.error('[Journal Controller] saveJournal error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * PATCH /api/journals/:id
 * Edit an existing journal entry (including direct edits to the structured report)
 */
export const updateJournal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const {
      originalText,
      structuredReport,
      outputLanguage,
      linkedTasks,
      linkedGoals,
    } = req.body;

    const journal = await DailyJournal.findOne({ _id: id, userId });
    if (!journal) {
      return res.status(404).json({ error: 'Not Found', message: 'Journal entry not found.' });
    }

    if (originalText !== undefined) journal.originalText = originalText;
    if (outputLanguage !== undefined) journal.outputLanguage = outputLanguage;
    if (linkedTasks !== undefined) journal.linkedTasks = linkedTasks;
    if (linkedGoals !== undefined) journal.linkedGoals = linkedGoals;

    if (structuredReport !== undefined) {
      journal.structuredReport = {
        summary: structuredReport.summary || '',
        completedActivities: structuredReport.completedActivities || [],
        learnings: structuredReport.learnings || [],
        achievements: structuredReport.achievements || [],
        challenges: structuredReport.challenges || [],
        pendingWork: structuredReport.pendingWork || [],
        tomorrowPlan: structuredReport.tomorrowPlan || [],
        additionalNotes: structuredReport.additionalNotes || [],
        aiSuggestions: structuredReport.aiSuggestions || [],
      };
      journal.lastStructuredAt = new Date();
      journal.processingStatus = 'completed';
    }

    await journal.save();
    res.json(journal);
  } catch (err) {
    console.error('[Journal Controller] updateJournal error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * DELETE /api/journals/:id
 * Delete journal entry
 */
export const deleteJournal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const journal = await DailyJournal.findOneAndDelete({ _id: req.params.id, userId });

    if (!journal) {
      return res.status(404).json({ error: 'Not Found', message: 'Journal entry not found.' });
    }

    res.json({ success: true, message: 'Journal entry deleted successfully.' });
  } catch (err) {
    console.error('[Journal Controller] deleteJournal error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * POST /api/journals/:id/structure
 * Run AI structuring on an existing journal entry
 */
export const structureJournal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { outputLanguage } = req.body;

    const journal = await DailyJournal.findOne({ _id: id, userId });
    if (!journal) {
      return res.status(404).json({ error: 'Not Found', message: 'Journal entry not found.' });
    }

    if (!journal.originalText || !journal.originalText.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot generate AI structured report for an empty journal entry. Please write some notes first.',
      });
    }

    const language = outputLanguage || journal.outputLanguage || 'original';

    // Set processing state
    journal.processingStatus = 'processing';
    await journal.save();

    try {
      const structured = await structureJournalText(journal.originalText, language);

      journal.structuredReport = structured;
      journal.outputLanguage = language;
      journal.processingStatus = 'completed';
      journal.lastStructuredAt = new Date();
      await journal.save();

      return res.json({
        success: true,
        message: 'Structured report generated successfully.',
        journal,
      });
    } catch (aiErr) {
      console.error('[Journal Controller] AI Structuring failed:', aiErr);
      journal.processingStatus = 'failed';
      // Notice: journal.originalText is strictly preserved!
      await journal.save();

      return res.status(502).json({
        error: 'AI Structuring Error',
        message: 'Failed to generate structured report. Your original journal notes have been safely preserved.',
        details: aiErr.message,
        journal,
      });
    }
  } catch (err) {
    console.error('[Journal Controller] structureJournal error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export default {
  getJournals,
  getJournalDates,
  getJournalByDate,
  getWeeklyInsightsHandler,
  getJournalById,
  saveJournal,
  updateJournal,
  deleteJournal,
  structureJournal,
};
