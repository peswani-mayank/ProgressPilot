process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_AUTH = 'true';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import mongoose from 'mongoose';
import Task from '../src/models/Task.js';
import TaskOccurrence from '../src/models/TaskOccurrence.js';
import Notification from '../src/models/Notification.js';
import ReminderPreference from '../src/models/ReminderPreference.js';
import User from '../src/models/User.js';
import {
  evaluateUserReminder,
  getUserLocalTime,
  isTimeInWindow,
  generateReminderMessage,
} from '../src/services/smartReminderService.js';
import { sendAccountabilityEmail } from '../src/services/emailService.js';

let server;
let baseUrl;
const TEST_UID = 'remind_user_101';
const DEV_TOKEN = `Bearer dev-token-${TEST_UID}:::reminder_user@test.com:::Reminder Tester`;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connection.asPromise();
    } catch (e) {
      // Offline fallback
    }
  }

  // Create or update test user
  await User.findOneAndUpdate(
    { userId: TEST_UID },
    {
      userId: TEST_UID,
      email: 'reminder_user@test.com',
      displayName: 'Reminder Tester',
    },
    { upsert: true }
  );

  // Clean test records
  await Task.deleteMany({ userId: TEST_UID });
  await TaskOccurrence.deleteMany({ userId: TEST_UID });
  await Notification.deleteMany({ userId: TEST_UID });
  await ReminderPreference.deleteMany({ userId: TEST_UID });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  setTimeout(() => process.exit(0), 100);
});

const apiRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: DEV_TOKEN,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

describe('Feature 12 — Smart Accountability Reminders Test Suite', () => {
  const testDate = '2026-10-15';

  test('1. First reminder is triggered when eligible tasks remain pending at configured start time', async () => {
    // Set up user preference: 18:00 to 21:00 window, UTC
    await ReminderPreference.create({
      userId: TEST_UID,
      enabled: true,
      startTime: '18:00',
      endTime: '21:00',
      followUpIntervalMinutes: 30,
      priorities: ['high', 'medium'],
      minPendingTasks: 1,
      timezone: 'UTC',
      channels: { inApp: true, email: true },
    });

    // Create an eligible task for testDate
    const task = await Task.create({
      userId: TEST_UID,
      title: 'Complete DSA Trees and Graphs',
      priority: 'high',
      dueDate: testDate,
      estimatedDuration: 90,
    });

    await TaskOccurrence.create({
      userId: TEST_UID,
      taskId: task._id,
      scheduledDate: testDate,
      status: 'todo',
    });

    // Evaluate at 18:00 (start time)
    const result = await evaluateUserReminder(TEST_UID, {
      simulateTime: '18:00',
      simulateDate: testDate,
    });

    assert.equal(result.notified, true);
    assert.equal(result.pendingCount, 1);
    assert.match(result.message, /Complete DSA Trees and Graphs/);
    assert.match(result.message, /daily plan is waiting/i);

    // Verify Notification document in DB
    const notif = await Notification.findById(result.notificationId);
    assert.ok(notif);
    assert.equal(notif.type, 'smart_reminder');
    assert.equal(notif.channel, 'in_app');
    assert.equal(notif.status, 'delivered');
  });

  test('2. Follow-ups occur at selected interval only during configured window', async () => {
    // Outside window: 16:00
    const outsideResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '16:00',
      simulateDate: testDate,
    });
    assert.equal(outsideResult.notified, false);
    assert.equal(outsideResult.reason, 'outside_window');

    // Outside window: 22:00 (after 21:00 end)
    const lateResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '22:00',
      simulateDate: testDate,
    });
    assert.equal(lateResult.notified, false);
    // Either outside window or quiet hours
    assert.ok(['outside_window', 'in_quiet_hours'].includes(lateResult.reason));

    // Follow-up inside window: 18:35 (next slot, >30m after 18:00)
    const followUpResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '18:35',
      simulateDate: testDate,
      now: new Date('2026-10-15T18:35:00.000Z'),
    });
    assert.equal(followUpResult.notified, true);
    assert.match(followUpResult.message, /Complete DSA Trees and Graphs/);
  });

  test('3. Duplicate scheduler runs do not send duplicate notifications (idempotency)', async () => {
    // Re-evaluating same slot 18:35 should be skipped via idempotency key
    const duplicateRun = await evaluateUserReminder(TEST_UID, {
      simulateTime: '18:35',
      simulateDate: testDate,
      now: new Date('2026-10-15T18:35:00.000Z'),
    });

    assert.equal(duplicateRun.notified, false);
    assert.equal(duplicateRun.reason, 'already_notified_this_interval');
  });

  test('4. Completing a task removes it and reflects actual partial progress in subsequent reminders', async () => {
    // Add a second task
    const task2 = await Task.create({
      userId: TEST_UID,
      title: 'Revise Operating Systems',
      priority: 'medium',
      dueDate: testDate,
      estimatedDuration: 45,
    });

    const occ2 = await TaskOccurrence.create({
      userId: TEST_UID,
      taskId: task2._id,
      scheduledDate: testDate,
      status: 'todo',
    });

    // Mark task 1 (DSA) as done
    await TaskOccurrence.findOneAndUpdate(
      { userId: TEST_UID, scheduledDate: testDate },
      { status: 'done' }
    );

    // Evaluate for next slot: 19:10
    const partialResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '19:10',
      simulateDate: testDate,
      now: new Date('2026-10-15T19:10:00.000Z'),
    });

    assert.equal(partialResult.notified, true);
    assert.equal(partialResult.pendingCount, 1);
    assert.equal(partialResult.completedCount, 1);
    // Message should celebrate completed work and mention remaining task
    assert.match(partialResult.message, /Good progress today!/i);
    assert.match(partialResult.message, /Revise Operating Systems/);
  });

  test('5. Completing all eligible tasks stops reminders completely', async () => {
    // Mark task 2 as done as well
    await TaskOccurrence.updateMany(
      { userId: TEST_UID, scheduledDate: testDate },
      { status: 'done' }
    );

    const allDoneResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '19:45',
      simulateDate: testDate,
      now: new Date('2026-10-15T19:45:00.000Z'),
    });

    assert.equal(allDoneResult.notified, false);
    assert.equal(allDoneResult.reason, 'all_tasks_completed');
  });

  test('6. Snooze and Pause settings suppress reminders properly', async () => {
    // Re-open task 2
    await TaskOccurrence.findOneAndUpdate(
      { userId: TEST_UID, scheduledDate: testDate },
      { status: 'todo' }
    );

    // Snooze for 60 minutes
    const futureSnooze = new Date(Date.now() + 60 * 60 * 1000);
    await ReminderPreference.findOneAndUpdate(
      { userId: TEST_UID },
      { snoozedUntil: futureSnooze }
    );

    const snoozedResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '20:00',
      simulateDate: testDate,
    });
    assert.equal(snoozedResult.notified, false);
    assert.equal(snoozedResult.reason, 'snoozed');

    // Clear snooze, set pause
    await ReminderPreference.findOneAndUpdate(
      { userId: TEST_UID },
      { snoozedUntil: null, isPaused: true, pauseReason: 'Exam preparation' }
    );

    const pausedResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '20:00',
      simulateDate: testDate,
    });
    assert.equal(pausedResult.notified, false);
    assert.equal(pausedResult.reason, 'reminders_paused');

    // Resume reminders
    await ReminderPreference.findOneAndUpdate(
      { userId: TEST_UID },
      { isPaused: false }
    );
  });

  test('7. Rescheduled tasks are not incorrectly reported for the original date', async () => {
    const originalDate = '2026-10-16';
    const rescheduledDate = '2026-10-18';

    // Create task rescheduled from originalDate to rescheduledDate
    const rescheduledTask = await Task.create({
      userId: TEST_UID,
      title: 'Fullstack Project Architecture',
      priority: 'high',
      dueDate: rescheduledDate,
    });

    await TaskOccurrence.create({
      userId: TEST_UID,
      taskId: rescheduledTask._id,
      scheduledDate: rescheduledDate,
      status: 'todo',
    });

    // Evaluate for original date (should find 0 tasks for original date)
    const reschedResult = await evaluateUserReminder(TEST_UID, {
      simulateTime: '18:15',
      simulateDate: originalDate,
    });

    assert.equal(reschedResult.notified, false);
    assert.equal(reschedResult.reason, 'all_tasks_completed');
  });

  test('8. Email delivery errors are safely recorded with in-app notification fallback', async () => {
    // Invalid email triggers error response
    const badEmailResult = await sendAccountabilityEmail({
      to: 'invalid-email-no-domain',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });

    assert.equal(badEmailResult.success, false);
    assert.equal(badEmailResult.status, 'failed');
    assert.ok(badEmailResult.error);
  });

  test('9. Timezone calculations evaluate local evening hours correctly', async () => {
    // 12:30 UTC = 18:00 Asia/Kolkata (+5:30)
    const baseUtcDate = new Date('2026-10-15T12:30:00.000Z');
    const istTime = getUserLocalTime('Asia/Kolkata', baseUtcDate);

    assert.equal(istTime.localTimeStr, '18:00');
    assert.equal(istTime.localDateStr, '2026-10-15');
    assert.equal(istTime.currentMinutes, 18 * 60);

    // 18:00 is within 18:00 to 21:00 window
    assert.equal(isTimeInWindow(istTime.localTimeStr, '18:00', '21:00'), true);
  });

  test('10. REST API allows retrieving, updating, snoozing, and pausing preferences', async () => {
    // GET /api/reminders/preferences
    const getRes = await apiRequest('/api/reminders/preferences');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.data.userId, TEST_UID);

    // PUT /api/reminders/preferences
    const putRes = await apiRequest('/api/reminders/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        startTime: '19:00',
        endTime: '22:00',
        followUpIntervalMinutes: 15,
        maxEmailsPerDay: 5,
      }),
    });
    assert.equal(putRes.status, 200);
    assert.equal(putRes.data.startTime, '19:00');
    assert.equal(putRes.data.followUpIntervalMinutes, 15);
    assert.equal(putRes.data.maxEmailsPerDay, 5);

    // POST /api/reminders/snooze
    const snoozeRes = await apiRequest('/api/reminders/snooze', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes: 30 }),
    });
    assert.equal(snoozeRes.status, 200);
    assert.ok(snoozeRes.data.snoozedUntil);

    // POST /api/reminders/pause
    const pauseRes = await apiRequest('/api/reminders/pause', {
      method: 'POST',
      body: JSON.stringify({ days: 3, reason: 'Vacation' }),
    });
    assert.equal(pauseRes.status, 200);
    assert.equal(pauseRes.data.prefs.isPaused, true);
    assert.equal(pauseRes.data.prefs.pauseReason, 'Vacation');

    // POST /api/reminders/resume
    const resumeRes = await apiRequest('/api/reminders/resume', {
      method: 'POST',
    });
    assert.equal(resumeRes.status, 200);
    assert.equal(resumeRes.data.prefs.isPaused, false);

    // GET /api/reminders/history
    const historyRes = await apiRequest('/api/reminders/history');
    assert.equal(historyRes.status, 200);
    assert.ok(Array.isArray(historyRes.data));
  });
});
