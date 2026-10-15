import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_SEO = {
  '/': {
    title: 'ProgressPilot — Dashboard & Daily Schedule',
    description: 'Track your daily schedule, today’s focus minutes, task completion rates, and weekly productivity trends on ProgressPilot.',
  },
  '/tasks': {
    title: 'My Tasks & Planning — ProgressPilot',
    description: 'Organize and manage your daily tasks, recurrence schedules, priorities, categories, and deadlines with instant completion.',
  },
  '/calendar': {
    title: 'Productivity Calendar & Schedule — ProgressPilot',
    description: 'View month, week, and day calendars with color-coded task priorities, occurrence schedules, and time blocks.',
  },
  '/goals': {
    title: 'Long-term Goals & Milestones — ProgressPilot',
    description: 'Turn ambitious life and career dreams into predictable daily habits with milestone tracking and progress steppers.',
  },
  '/timer': {
    title: 'Deep Focus & Pomodoro Timer — ProgressPilot',
    description: 'Boost focus with custom Pomodoro intervals, short and long breaks, ambient soundscapes, and offline persistence.',
  },
  '/analytics': {
    title: 'Productivity Analytics & Reports — ProgressPilot',
    description: 'Analyze focused hours, weekly trends, category breakdown, distraction logs, and day-over-day self-improvement metrics.',
  },
  '/journal': {
    title: 'Daily Journal & AI Reflection — ProgressPilot',
    description: 'Document your daily accomplishments, structured reflections, and automatic task generation from notes.',
  },
  '/review': {
    title: 'Daily Review & Self-Improvement — ProgressPilot',
    description: 'Reflect on what went well, identify distractions, capture key learnings, and set tomorrow’s top 3 priorities.',
  },
  '/notifications': {
    title: 'Notifications & Smart Reminders — ProgressPilot',
    description: 'Manage real-time notifications, overdue alerts, daily morning agendas, and scheduled email reminders.',
  },
  '/settings': {
    title: 'Account & Productivity Settings — ProgressPilot',
    description: 'Customize focus categories, email notifications, Pomodoro timer presets, themes, and personal preferences.',
  },
  '/login': {
    title: 'Sign In — ProgressPilot',
    description: 'Sign in to ProgressPilot with Google or launch an instant demo pilot account to plan and track your productivity.',
  },
};

export const SEOUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = ROUTE_SEO[pathname] || ROUTE_SEO['/'];

    // Update Document Title
    document.title = route.title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = route.description;

    // Update OpenGraph Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = route.title;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = route.description;

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://progresspilots.netlify.app${pathname === '/' ? '' : pathname}`;
  }, [pathname]);

  return null;
};

export default SEOUpdater;
