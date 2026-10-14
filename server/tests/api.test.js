process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_AUTH = 'true';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import mongoose from 'mongoose';

let server;
let baseUrl;
const DEV_TOKEN = 'Bearer dev-token-testuser999:::testuser@progresspilot.dev:::Test User';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Give MongoDB connection a moment if connecting
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connection.asPromise();
    } catch (e) {
      // Offline fallback allowed in unit tests
    }
  }
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

describe('ProgressPilot Backend API Tests', () => {
  test('GET /api/health should return 200 with system status', async () => {
    const res = await apiRequest('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
    assert.equal(res.data.name, 'ProgressPilot API');
  });

  test('GET /api/tasks without authorization should return 401', async () => {
    const res = await apiRequest('/api/tasks');
    assert.equal(res.status, 401);
    assert.equal(res.data.error, 'Unauthorized');
  });

  test('GET /api/user/profile with valid dev token should succeed', async () => {
    const res = await apiRequest('/api/user/profile', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.userId, 'testuser999');
  });

  test('POST /api/tasks validates required title field', async () => {
    const res = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({ description: 'No title provided' }),
    });
    assert.equal(res.status, 400);
  });

  test('POST /api/tasks creates a new task with persistence', async () => {
    const res = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        title: 'Complete System Architecture Review',
        category: 'projects',
        priority: 'high',
        scheduleType: 'daily',
        estimatedDuration: 45,
        dueDate: '2026-10-15',
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.title, 'Complete System Architecture Review');
    assert.equal(res.data.priority, 'high');
  });

  test('GET /api/tasks returns created tasks for authenticated user', async () => {
    const res = await apiRequest('/api/tasks', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.tasks));
    assert.ok(res.data.tasks.length > 0);
  });

  test('POST /api/focus-sessions logs focus time and updates task duration', async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 25 * 60000);

    const res = await apiRequest('/api/focus-sessions', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        taskTitle: 'Automated Test Focus Session',
        category: 'projects',
        sessionType: 'pomodoro',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: 25,
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.durationMinutes, 25);
  });

  test('GET /api/analytics/daily calculates real-time metrics', async () => {
    const res = await apiRequest('/api/analytics/daily?date=2026-10-15', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.formulaExplanations);
    assert.ok(typeof res.data.completionRate === 'number');
    assert.ok(typeof res.data.timeUtilizationRate === 'number');
  });

  test('GET /api/export/tasks exports CSV data for user', async () => {
    const res = await apiRequest('/api/export/tasks', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.ok(typeof res.data === 'string');
    assert.ok(res.data.includes('Task ID'));
    assert.ok(res.data.includes('Title'));
  });

  test('GET /api/export/all returns complete JSON account export', async () => {
    const res = await apiRequest('/api/export/all', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.version, '1.0');
    assert.ok(res.data.user);
    assert.ok(Array.isArray(res.data.tasks));
  });

  test('POST /api/journals saves daily journal entry with Hinglish/multilingual text', async () => {
    const rawNote = `Aaj LeetCode ke 3 medium dynamic programming questions solve kiye.
Dynamic programming concepts revised.
Challenge: Segment Tree question me logic me thoda phansa, runtime error aa raha tha.
Tomorrow plan: Kal subah System Design interview chapter 4 padhna hai.
Great energy today!`;

    const res = await apiRequest('/api/journals', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        journalDate: '2026-10-15',
        originalText: rawNote,
        outputLanguage: 'original',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.journalDate, '2026-10-15');
    assert.ok(res.data.originalText.includes('LeetCode'));
    assert.ok(res.data._id);
  });

  test('GET /api/journals lists saved journal entries and /api/journals/dates returns calendar markers', async () => {
    const listRes = await apiRequest('/api/journals', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.data.journals.length >= 1);

    const datesRes = await apiRequest('/api/journals/dates', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(datesRes.status, 200);
    assert.ok(Array.isArray(datesRes.data));
    assert.ok(datesRes.data.some((d) => d.journalDate === '2026-10-15'));
  });

  test('POST /api/journals/:id/structure transforms raw text into structured report preserving original text', async () => {
    const listRes = await apiRequest('/api/journals', {
      headers: { Authorization: DEV_TOKEN },
    });
    const journalId = listRes.data.journals[0]._id;

    const res = await apiRequest(`/api/journals/${journalId}/structure`, {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({ outputLanguage: 'original' }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.journal.structuredReport);
    // Preserves original text
    assert.ok(res.data.journal.originalText.includes('LeetCode'));
    // Successfully extracted sections
    assert.ok(Array.isArray(res.data.journal.structuredReport.completedActivities));
    assert.ok(Array.isArray(res.data.journal.structuredReport.challenges));
    assert.ok(Array.isArray(res.data.journal.structuredReport.tomorrowPlan));
    assert.ok(Array.isArray(res.data.journal.structuredReport.aiSuggestions));
  });

  test('GET /api/journals/insights/weekly aggregates weekly reflection and topics', async () => {
    const res = await apiRequest('/api/journals/insights/weekly?startDate=2026-10-10&endDate=2026-10-16', {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.totalDaysJournaled >= 1);
    assert.ok(typeof res.data.summaryReflection === 'string');
  });

  test('Feature: Actual Time Tracking - Planned 180m with 90m session records 90m, not 180m', async () => {
    // 1. Create a task planned for 180 minutes
    const taskRes = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        title: 'Java DSA Practice Plan 180m',
        category: 'dsa',
        priority: 'high',
        estimatedDuration: 180,
      }),
    });
    assert.equal(taskRes.status, 201);
    const taskId = taskRes.data._id;
    assert.equal(taskRes.data.estimatedDuration, 180);
    assert.equal(taskRes.data.actualDuration, 0);

    // 2. Log 90 focused minutes
    const now = new Date();
    const startTime = new Date(now.getTime() - 90 * 60000);
    const sessionRes = await apiRequest('/api/focus-sessions', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        taskId,
        clientSessionId: `test_session_${taskId}_90m`,
        taskTitle: 'Java DSA Practice Plan 180m',
        category: 'dsa',
        sessionType: 'custom_focus',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: 90,
      }),
    });
    assert.equal(sessionRes.status, 201);
    assert.equal(sessionRes.data.durationMinutes, 90);

    // 3. Verify task's actualDuration is 90, not 180
    const updatedTask = await apiRequest(`/api/tasks/${taskId}`, {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(updatedTask.status, 200);
    assert.equal(updatedTask.data.estimatedDuration, 180);
    assert.equal(updatedTask.data.actualDuration, 90);

    // 4. Complete task early - verify actualDuration is STILL 90 and not inflated to 180!
    const completeRes = await apiRequest(`/api/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({ status: 'done' }),
    });
    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.data.status, 'done');
    assert.equal(completeRes.data.actualDuration, 90);
  });

  test('Feature: Focus Session Idempotency - duplicate clientSessionId avoids double-counting', async () => {
    const taskRes = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        title: 'Idempotency Test Task',
        category: 'projects',
        estimatedDuration: 60,
      }),
    });
    const taskId = taskRes.data._id;
    const clientSessionId = `idempotent_${Date.now()}`;
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 60000);

    // First attempt: 30 minutes
    const res1 = await apiRequest('/api/focus-sessions', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        taskId,
        clientSessionId,
        taskTitle: 'Idempotency Test Task',
        category: 'projects',
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: 30,
      }),
    });
    assert.equal(res1.status, 201);

    // Second attempt with same clientSessionId (e.g. network retry)
    const res2 = await apiRequest('/api/focus-sessions', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        taskId,
        clientSessionId,
        taskTitle: 'Idempotency Test Task',
        category: 'projects',
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: 30,
      }),
    });
    assert.equal(res2.status, 200);

    // Check task duration is strictly 30, not 60!
    const taskCheck = await apiRequest(`/api/tasks/${taskId}`, {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(taskCheck.data.actualDuration, 30);
  });

  test('Feature: Task Work Log CRUD - creates, lists, edits, and deletes multilingual work log entries', async () => {
    const taskRes = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        title: 'Work Log Integration Task',
        category: 'dsa',
        estimatedDuration: 120,
      }),
    });
    const taskId = taskRes.data._id;

    // 1. Create work log in Hinglish
    const logText = '45 minutes: Array questions solve kiye, 2 problems successfully submit hui.';
    const createRes = await apiRequest(`/api/tasks/${taskId}/work-logs`, {
      method: 'POST',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        text: logText,
        durationMinutes: 45,
      }),
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.text, logText);
    assert.equal(createRes.data.durationMinutes, 45);
    const logId = createRes.data._id;

    // 2. List work logs for task
    const listRes = await apiRequest(`/api/tasks/${taskId}/work-logs`, {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.length, 1);
    assert.equal(listRes.data[0]._id, logId);

    // 3. Edit work log
    const updatedText = 'Updated: 45 minutes spent on Array binary search questions.';
    const editRes = await apiRequest(`/api/tasks/${taskId}/work-logs/${logId}`, {
      method: 'PATCH',
      headers: { Authorization: DEV_TOKEN },
      body: JSON.stringify({
        text: updatedText,
        durationMinutes: 50,
      }),
    });
    assert.equal(editRes.status, 200);
    assert.equal(editRes.data.text, updatedText);
    assert.equal(editRes.data.durationMinutes, 50);

    // 4. Delete work log
    const deleteRes = await apiRequest(`/api/tasks/${taskId}/work-logs/${logId}`, {
      method: 'DELETE',
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.data.success, true);

    // Verify empty list
    const finalList = await apiRequest(`/api/tasks/${taskId}/work-logs`, {
      headers: { Authorization: DEV_TOKEN },
    });
    assert.equal(finalList.data.length, 0);
  });
});
