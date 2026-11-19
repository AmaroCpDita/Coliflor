import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, cacheDir: 'tmp.local/quiz-series-test-cache', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
try {
  const { getDailyQuiz, THEMED_QUIZZES } = await server.ssrLoadModule('/src/lib/quizBank.ts');
  const { NEW_QUIZZES, QUIZ_SERIES_START } = await server.ssrLoadModule('/src/lib/quizSeries.ts');
  const normalize = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const seen = new Set(THEMED_QUIZZES.flatMap(q => q.questions.map(q => normalize(q.question))));
  const ids = new Set();
  const start = Date.parse(`${QUIZ_SERIES_START}T00:00:00Z`);
  for (let day=0;day<NEW_QUIZZES.length;day++) {
    const date=new Date(start+day*86400000).toISOString().slice(0,10);
    const quiz=getDailyQuiz(date);
    assert.deepEqual(quiz,getDailyQuiz(date),'Same date always returns identical payload');
    assert.equal(quiz.questions.length,5);
    for(const question of quiz.questions) {
      assert(!seen.has(normalize(question.question)),`Repeated question: ${question.question}`);
      assert(!ids.has(question.id));
      seen.add(normalize(question.question)); ids.add(question.id);
      assert.equal(new Set(question.options).size,4);
    }
  }
  const after=new Date(start+NEW_QUIZZES.length*86400000).toISOString().slice(0,10);
  assert.equal(getDailyQuiz(after).questions.length,0,'Exhaustion never cycles old questions');
  assert.equal(getDailyQuiz('2030-01-01').questions.length,0);
  assert.equal(getDailyQuiz('2026-10-03').questions.length,5,'Today remains compatible with existing answers');
  assert.equal(ids.size, NEW_QUIZZES.length * 5);
  console.log(`Quiz series passed: ${NEW_QUIZZES.length} dates, ${ids.size} unique prompts/IDs, stable pairs and no recycling at exhaustion.`);
} finally { await server.close(); }
