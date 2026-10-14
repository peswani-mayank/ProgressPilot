import User, { DEFAULT_TASK_CATEGORIES } from '../models/User.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId,
        email: req.user.email || 'user@progresspilot.dev',
        displayName: req.user.name || 'Progress Pilot User',
        photoURL: req.user.picture || '',
        preferences: {
          categories: DEFAULT_TASK_CATEGORIES,
        },
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Validation Error', message: 'preferences object required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    // Merge preferences
    user.preferences = {
      ...user.preferences.toObject(),
      ...preferences,
    };

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { timezone, dailyTaskTarget, dailyFocusHoursTarget, categories } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    user.onboardingCompleted = true;
    if (timezone) user.preferences.timezone = timezone;
    if (dailyTaskTarget) user.preferences.dailyTaskTarget = Number(dailyTaskTarget);
    if (dailyFocusHoursTarget) user.preferences.dailyFocusHoursTarget = Number(dailyFocusHoursTarget);
    if (Array.isArray(categories)) user.preferences.categories = categories;

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};
