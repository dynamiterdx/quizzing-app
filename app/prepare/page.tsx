"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorNotice } from '@/components/ErrorNotice';
import { LoadingQuiz } from '@/components/LoadingQuiz';
import { QuizRunner, QuizRunSummary } from '@/components/QuizRunner';
import { useLLMSettings } from '@/lib/llm-settings';
import type { Difficulty, QuizSet, SubtopicNode } from '@/types/quiz';

type Step = 'setup' | 'map' | 'diagnostic' | 'select' | 'drill' | 'summary';
type Weight = 'low' | 'med' | 'high';

interface EditableSubtopic {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  weight: Weight;
  childHints?: string[];
}

interface SubtopicAccuracy {
  name: string;
  total: number;
  correct: number;
  accuracy: number;
}

type ScoreMap = Record<string, { initial: number; latest: number; rounds: number; history: number[] }>;

const difficultyOrder: Difficulty[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const masteryThreshold = 75;
const maxDrillRounds = 4;

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function makeId() {
  return `sub-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMap(nodes: SubtopicNode[]): EditableSubtopic[] {
  return nodes.map((node) => ({
    id: node.id || makeId(),
    name: node.name,
    description: node.description,
    included: true,
    weight: 'med',
    childHints: node.children?.map((child) => child.name) ?? undefined,
  }));
}

function computeAccuracies(summary: QuizRunSummary): SubtopicAccuracy[] {
  const tracker = new Map<string, { total: number; correct: number }>();
  summary.quiz.questions.forEach((q) => {
    const key = q.subtopic?.trim() || 'General';
    if (!tracker.has(key)) tracker.set(key, { total: 0, correct: 0 });
    const info = tracker.get(key)!;
    info.total += 1;
    if (summary.answers[q.id] === q.correctChoiceId) info.correct += 1;
  });

  return Array.from(tracker.entries()).map(([name, data]) => ({
    name,
    total: data.total,
    correct: data.correct,
    accuracy: Math.round((data.total ? (data.correct / data.total) : 0) * 100),
  }));
}

function suggestWeakAreas(accuracies: SubtopicAccuracy[]): string[] {
  if (!accuracies.length) return [];
  const sorted = [...accuracies].sort((a, b) => a.accuracy - b.accuracy);
  const weak = sorted.filter((item) => item.accuracy < masteryThreshold);
  if (weak.length >= 2) return weak.slice(0, 3).map((item) => item.name);
  return sorted.slice(0, Math.min(3, sorted.length)).map((item) => item.name);
}

export default function PreparePage() {
  const router = useRouter();
  const { settings, isConfigured } = useLLMSettings();

  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [diagnosticCount, setDiagnosticCount] = useState(12);
  const [diagnosticTimed, setDiagnosticTimed] = useState(false);
  const [diagnosticMinutes, setDiagnosticMinutes] = useState(6);

  const [step, setStep] = useState<Step>('setup');
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editableSubtopics, setEditableSubtopics] = useState<EditableSubtopic[]>([]);
  const [approvedSubtopics, setApprovedSubtopics] = useState<EditableSubtopic[] | null>(null);
  const [mapCompact, setMapCompact] = useState(false);
  const [mapChangedMessage, setMapChangedMessage] = useState<string | null>(null);

  const [diagnosticQuiz, setDiagnosticQuiz] = useState<QuizSet | null>(null);
  const [diagnosticSummary, setDiagnosticSummary] = useState<QuizRunSummary | null>(null);
  const [diagnosticAccuracies, setDiagnosticAccuracies] = useState<SubtopicAccuracy[]>([]);

  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [scoreMap, setScoreMap] = useState<ScoreMap>({});

  const [drillDifficulty, setDrillDifficulty] = useState<Difficulty>('beginner');
  const [drillTimed, setDrillTimed] = useState(false);
  const [drillMinutes, setDrillMinutes] = useState(4);
  const [drillQuiz, setDrillQuiz] = useState<QuizSet | null>(null);
  const [drillSummary, setDrillSummary] = useState<QuizRunSummary | null>(null);
  const [drillRounds, setDrillRounds] = useState(0);

  const [prepSummary, setPrepSummary] = useState<{
    headline?: string;
    encouragement?: string;
    pointers: { subtopic: string; tip: string }[];
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      router.replace('/llm-settings?next=/prepare');
    }
  }, [isConfigured, router]);

  const provider = settings.provider;
  const perplexityKey = settings.perplexityKey;
  const azureKey = settings.azureKey;

  const isLoading = loadingLabel !== null;
  const masteryReached = useMemo(
    () => selectedSubtopics.length > 0 && selectedSubtopics.every((sub) => (scoreMap[sub]?.latest ?? 0) >= masteryThreshold),
    [scoreMap, selectedSubtopics]
  );

  const resetLearningState = useCallback(() => {
    setDiagnosticQuiz(null);
    setDiagnosticSummary(null);
    setDiagnosticAccuracies([]);
    setSelectedSubtopics([]);
    setScoreMap({});
    setDrillQuiz(null);
    setDrillSummary(null);
    setDrillRounds(0);
    setPrepSummary(null);
    setSummaryLoading(false);
  }, []);

  const invalidateApproval = useCallback((message: string) => {
    setApprovedSubtopics(null);
    setMapChangedMessage(message);
    resetLearningState();
    setStep('map');
  }, [resetLearningState]);

  const fetchSubtopicMap = useCallback(async ({ compact }: { compact: boolean }) => {
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      setError('Please enter a topic with at least three characters.');
      return;
    }
    setError(null);
    setLoadingLabel('Mapping your study plan…');
    try {
      const res = await fetch('/api/subtopic-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          language,
          provider,
          perplexityKey,
          azureKey,
          compact,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      const normalized = normalizeMap(data.subtopics || []);
      if (!normalized.length) {
        throw new Error('No subtopics returned. Please try a more specific topic.');
      }
      setTopic(trimmedTopic);
      setEditableSubtopics(normalized);
      setMapCompact(compact);
      setApprovedSubtopics(null);
      setMapChangedMessage(null);
      resetLearningState();
      setStep('map');
    } catch (e: any) {
      setError(e?.message || 'Failed to build the subtopic map. Please try again.');
      setStep('setup');
    } finally {
      setLoadingLabel(null);
    }
  }, [topic, language, provider, perplexityKey, azureKey, resetLearningState]);

  const simplifyMap = useCallback(() => {
    fetchSubtopicMap({ compact: true });
  }, [fetchSubtopicMap]);

  const regenerateMap = useCallback(() => {
    fetchSubtopicMap({ compact: mapCompact });
  }, [fetchSubtopicMap, mapCompact]);

  const markDirty = useCallback(() => {
    if (approvedSubtopics) {
      invalidateApproval('Subtopics changed. Previous diagnostic results were discarded. Approve again to continue.');
    }
  }, [approvedSubtopics, invalidateApproval]);

  const updateSubtopic = (id: string, changes: Partial<EditableSubtopic>) => {
    setEditableSubtopics((subs) =>
      subs.map((sub) => (sub.id === id ? { ...sub, ...changes } : sub))
    );
    markDirty();
  };

  const toggleIncluded = (id: string) => {
    setEditableSubtopics((subs) =>
      subs.map((sub) => (sub.id === id ? { ...sub, included: !sub.included } : sub))
    );
    markDirty();
  };

  const removeSubtopic = (id: string) => {
    setEditableSubtopics((subs) => subs.filter((sub) => sub.id !== id));
    markDirty();
  };

  const addSubtopic = () => {
    setEditableSubtopics((subs) => [
      ...subs,
      {
        id: makeId(),
        name: 'New subtopic',
        description: '',
        included: true,
        weight: 'med',
      },
    ]);
    markDirty();
  };

  const moveSubtopic = (index: number, direction: -1 | 1) => {
    setEditableSubtopics((subs) => {
      const next = subs.slice();
      const target = index + direction;
      if (target < 0 || target >= subs.length) return subs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    markDirty();
  };

  const approveMap = useCallback(async () => {
    const included = editableSubtopics.filter((sub) => sub.included && sub.name.trim().length > 0);
    if (!included.length) {
      setError('Select at least one subtopic before approving.');
      return;
    }
    setError(null);
    setLoadingLabel('Drafting diagnostic quiz…');
    try {
      const payloadSubtopics = included.map((sub) => ({
        name: sub.name.trim(),
        weight: sub.weight,
      }));
      const desiredCount = Math.max(diagnosticCount, included.length * 3);
      const res = await fetch('/api/diagnostic-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subtopics: payloadSubtopics,
          language,
          provider,
          perplexityKey,
          azureKey,
          questionCount: desiredCount,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const diag = await res.json();
      const questionTotal = Array.isArray(diag?.questions) ? diag.questions.length : desiredCount;
      let durationSeconds: number | undefined;
      if (diagnosticTimed) {
        const perQuestion = Math.max(45, Math.round((diagnosticMinutes * 60) / Math.max(questionTotal, 1)));
        durationSeconds = clampInt(perQuestion * questionTotal, 60, questionTotal * 120);
      }
      setApprovedSubtopics(included);
      setDiagnosticQuiz({
        ...diag,
        topic: topic.trim(),
        language,
        difficulty: 'beginner',
        timed: diagnosticTimed,
        durationSeconds,
      });
      setDrillTimed(diagnosticTimed);
      setDrillMinutes(Math.max(3, Math.min(8, diagnosticMinutes)));
      setStep('diagnostic');
    } catch (e: any) {
      setError(e?.message || 'Failed to generate diagnostic quiz. Please try again.');
    } finally {
      setLoadingLabel(null);
    }
  }, [editableSubtopics, topic, language, provider, perplexityKey, azureKey, diagnosticCount, diagnosticTimed, diagnosticMinutes]);

  const handleDiagnosticComplete = useCallback((summary: QuizRunSummary) => {
    const accuracies = computeAccuracies(summary);
    setDiagnosticSummary(summary);
    setDiagnosticAccuracies(accuracies);

    const suggested = suggestWeakAreas(accuracies);
    setSelectedSubtopics(suggested);

    const initialScores: ScoreMap = {};
    accuracies.forEach((item) => {
      initialScores[item.name] = {
        initial: item.accuracy,
        latest: item.accuracy,
        rounds: 0,
        history: [item.accuracy],
      };
    });
    setScoreMap(initialScores);

    const selectedAccuracies = accuracies.filter((item) => suggested.includes(item.name));
    const avg = selectedAccuracies.length
      ? selectedAccuracies.reduce((sum, item) => sum + item.accuracy, 0) / selectedAccuracies.length
      : 0;
    let startDifficulty: Difficulty = 'beginner';
    if (avg >= 85) startDifficulty = 'advanced';
    else if (avg >= 70) startDifficulty = 'intermediate';
    else if (avg >= 55) startDifficulty = 'elementary';
    setDrillDifficulty(startDifficulty);
    setDrillRounds(0);
    setStep('select');
  }, []);

  const startDrill = useCallback(async () => {
    if (!topic.trim() || !selectedSubtopics.length) return;
    setError(null);
    setLoadingLabel('Generating focused drill questions…');
    try {
      const questionsRequested = Math.max(selectedSubtopics.length * 6, 6);
      const res = await fetch('/api/drill-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          targetSubtopics: selectedSubtopics,
          targetDifficulty: drillDifficulty,
          language,
          provider,
          perplexityKey,
          azureKey,
          questionCount: questionsRequested,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const durationSeconds = drillTimed ? Math.max(45, clampInt(drillMinutes * 60, 60, 20 * 60)) : undefined;
      setDrillQuiz({
        topic,
        difficulty: drillDifficulty,
        language,
        timed: drillTimed,
        durationSeconds,
        questions: json.questions,
      });
      setDrillSummary(null);
      setStep('drill');
    } catch (e: any) {
      setError(e?.message || 'Could not generate drill questions. Please retry.');
    } finally {
      setLoadingLabel(null);
    }
  }, [topic, selectedSubtopics, drillDifficulty, drillTimed, drillMinutes, language, provider, perplexityKey, azureKey]);

  const transitionToSummary = useCallback(async () => {
    if (!Object.keys(scoreMap).length) return;
    setPrepSummary(null);
    setSummaryLoading(true);
    setStep('summary');
    try {
      const res = await fetch('/api/prep-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          language,
          provider,
          perplexityKey,
          azureKey,
          scores: Object.entries(scoreMap).map(([subtopic, value]) => ({
            subtopic,
            initialScore: value.initial,
            latestScore: value.latest,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPrepSummary({
        headline: data.headline,
        encouragement: data.encouragement,
        pointers: data.pointers ?? [],
      });
    } catch (e: any) {
      setError(e?.message || 'We could not craft your prep summary. Check your API key and try again.');
    } finally {
      setSummaryLoading(false);
    }
  }, [scoreMap, topic, language, provider, perplexityKey, azureKey]);

  const handleDrillComplete = useCallback((summary: QuizRunSummary) => {
    const accuracies = computeAccuracies(summary);
    const accuracyByName = new Map(accuracies.map((item) => [item.name, item]));
    const nextScores: ScoreMap = { ...scoreMap };

    selectedSubtopics.forEach((name) => {
      const previous = scoreMap[name] || { initial: 60, latest: 60, rounds: 0, history: [] };
      const result = accuracyByName.get(name);
      const latest = result ? result.accuracy : previous.latest;
      nextScores[name] = {
        initial: previous.initial,
        latest,
        rounds: previous.rounds + 1,
        history: [...previous.history, latest],
      };
    });

    setScoreMap(nextScores);
    setDrillSummary(summary);
    setDrillQuiz(null);

    const nextRound = drillRounds + 1;
    setDrillRounds(nextRound);

    const selectedAccuracies = selectedSubtopics.map((name) => nextScores[name]?.latest ?? 0);
    const avg = selectedAccuracies.length ? selectedAccuracies.reduce((sum, val) => sum + val, 0) / selectedAccuracies.length : 0;
    let nextDifficulty: Difficulty = 'beginner';
    if (avg >= 85) nextDifficulty = 'advanced';
    else if (avg >= 70) nextDifficulty = 'intermediate';
    else if (avg >= 55) nextDifficulty = 'elementary';
    setDrillDifficulty(nextDifficulty);

    const reachedMastery = selectedSubtopics.every((name) => (nextScores[name]?.latest ?? 0) >= masteryThreshold);
    const reachedCap = nextRound >= maxDrillRounds;

    if (reachedMastery || reachedCap) {
      transitionToSummary();
    }
  }, [scoreMap, selectedSubtopics, drillRounds, transitionToSummary]);

  const handleSkipToSummary = () => {
    transitionToSummary();
  };

  const restartPlan = () => {
    fetchSubtopicMap({ compact: mapCompact });
  };

  const canStartPlan = topic.trim().length >= 3 && diagnosticCount >= 4 && diagnosticCount <= 10 && isConfigured && !isLoading;
  const canApprove = editableSubtopics.some((sub) => sub.included && sub.name.trim().length > 0) && !isLoading;
  const canStartDrill = selectedSubtopics.length > 0 && !isLoading;

  return (
    <div className="card">
      <h2>Help Me Prepare</h2>
      <p className="muted">Diagnose weak areas, drill with focused quizzes, and track how your understanding improves.</p>
      <p className="muted">Current model: {provider === 'azure' ? 'Azure OpenAI' : provider === 'perplexity' ? 'Perplexity Sonar' : 'Perplexity Sonar Pro'}</p>

      {step === 'setup' && (
        <div className="mt-3">
          <div className="row cols-2">
            <div>
              <label htmlFor="topic">Broad topic</label>
              <input id="topic" placeholder="e.g., Introductory Statistics" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div>
              <label htmlFor="language">Language</label>
              <input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div>
              <label htmlFor="diagCount">Minimum diagnostic questions</label>
              <input
                id="diagCount"
                type="number"
                min={6}
                max={60}
                value={diagnosticCount}
                onChange={(e) => setDiagnosticCount(clampInt(Number(e.target.value), 6, 60))}
              />
              <p className="muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
                We&apos;ll target roughly three questions per approved subtopic.
              </p>
            </div>
            <div>
              <label htmlFor="diagMinutes">Timer (minutes, optional)</label>
              <div className="flex" style={{ gap: 12 }}>
                <label className="flex" style={{ gap: 8 }}>
                  <input type="checkbox" checked={diagnosticTimed} onChange={(e) => setDiagnosticTimed(e.target.checked)} />
                  Timed diagnostic?
                </label>
                <input
                  id="diagMinutes"
                  type="number"
                  min={3}
                  max={12}
                  disabled={!diagnosticTimed}
                  value={diagnosticMinutes}
                  onChange={(e) => setDiagnosticMinutes(clampInt(Number(e.target.value), 3, 12))}
                  style={{ maxWidth: 100 }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex" style={{ gap: 12 }}>
            <button onClick={() => fetchSubtopicMap({ compact: false })} disabled={!canStartPlan}>
              {isLoading ? 'Preparing…' : 'Generate subtopic map'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => router.push('/llm-settings?next=/prepare')}>
              Change model
            </button>
          </div>
        </div>
      )}

      {step !== 'setup' && (
        <div className="mt-3">
          <label htmlFor="refineTopic">Refine topic</label>
          <input id="refineTopic" value={topic} onChange={(e) => { setTopic(e.target.value); markDirty(); }} />
          <div className="mt-2 flex" style={{ gap: 12 }}>
            <button className="btn btn-outline" onClick={regenerateMap} disabled={isLoading}>Regenerate map</button>
            <button className="btn btn-outline" onClick={simplifyMap} disabled={isLoading}>Simplify map</button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <ErrorNotice message={error} retry={step === 'map' ? approveMap : step === 'setup' ? () => fetchSubtopicMap({ compact: false }) : undefined} />
        </div>
      )}

      {mapChangedMessage && (
        <div className="mt-3 card warn" role="status">
          {mapChangedMessage}
        </div>
      )}

      {isLoading && <LoadingQuiz label={loadingLabel ?? 'Working…'} />}

      {step === 'map' && (
        <div className="mt-3">
          <div className="flex justify-between">
            <div>
              <h3>Subtopic map</h3>
              <p className="muted">Adjust names, weights, or remove anything off-topic. Approve when it looks right.</p>
              {mapCompact && <div className="pill mt-1">Simplified view</div>}
            </div>
            <button onClick={addSubtopic} className="btn btn-outline">Add subtopic</button>
          </div>

          <div className="mt-2" style={{ display: 'grid', gap: 12 }}>
            {editableSubtopics.map((sub, index) => (
              <div key={sub.id} className="card">
                <div className="flex justify-between">
                  <div style={{ flex: 1 }}>
                    <label htmlFor={`name-${sub.id}`}>Subtopic title</label>
                    <input
                      id={`name-${sub.id}`}
                      value={sub.name}
                      onChange={(e) => updateSubtopic(sub.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      aria-label="Move up"
                      onClick={() => moveSubtopic(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      aria-label="Move down"
                      onClick={() => moveSubtopic(index, 1)}
                      disabled={index === editableSubtopics.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => removeSubtopic(sub.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label htmlFor={`desc-${sub.id}`}>Description (optional)</label>
                  <textarea
                    id={`desc-${sub.id}`}
                    value={sub.description ?? ''}
                    onChange={(e) => updateSubtopic(sub.id, { description: e.target.value })}
                    rows={2}
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }}
                  />
                </div>
                {sub.childHints && sub.childHints.length > 0 && (
                  <p className="muted mt-1" style={{ fontSize: '0.85rem' }}>
                    Model hints: {sub.childHints.join(', ')}
                  </p>
                )}
                <div className="mt-2 row cols-2">
                  <label className="flex" style={{ gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={sub.included}
                      onChange={() => toggleIncluded(sub.id)}
                    />
                    Include in plan
                  </label>
                  <div>
                    <label htmlFor={`weight-${sub.id}`}>Priority</label>
                    <select
                      id={`weight-${sub.id}`}
                      value={sub.weight}
                      onChange={(e) => updateSubtopic(sub.id, { weight: e.target.value as Weight })}
                    >
                      <option value="low">Low</option>
                      <option value="med">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <button onClick={addSubtopic} className="btn btn-outline">Add another subtopic</button>
          </div>

          <div className="mt-3 flex" style={{ gap: 12 }}>
            <button onClick={approveMap} disabled={!canApprove}>
              {isLoading ? 'Preparing…' : 'Approve subtopics'}
            </button>
            <span className="muted">We’ll build the diagnostic after approval.</span>
          </div>
        </div>
      )}

      {step === 'diagnostic' && diagnosticQuiz && (
        <div className="mt-3">
          <h3>Diagnostic</h3>
          <p className="muted">Answer a quick mix of questions so we can spot weak areas.</p>
          <QuizRunner quiz={diagnosticQuiz} onSubmitComplete={handleDiagnosticComplete} showPracticeButton={false} />
        </div>
      )}

      {step === 'select' && diagnosticSummary && (
        <div className="mt-3">
          <h3>Diagnostic results</h3>
          <p className="muted">We highlighted likely weak spots. Adjust before drilling.</p>
          <div className="mt-2 table-responsive">
            <table className="prep-table">
              <thead>
                <tr>
                  <th scope="col">Subtopic</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Correct</th>
                  <th scope="col">Drill?</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticAccuracies.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>
                      <span className={item.accuracy >= masteryThreshold ? 'good' : 'warn'}>
                        {item.accuracy}%
                      </span>
                    </td>
                    <td>{item.correct}/{item.total}</td>
                    <td>
                      <label className="flex" style={{ gap: 8, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedSubtopics.includes(item.name)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSubtopics((prev) => Array.from(new Set([...prev, item.name])));
                            else setSelectedSubtopics((prev) => prev.filter((sub) => sub !== item.name));
                          }}
                        />
                        <span className="muted" style={{ fontSize: '0.85rem' }}>{item.accuracy < masteryThreshold ? 'Recommended' : 'Optional'}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 row cols-2">
            <div>
              <label htmlFor="drillDifficulty">Starting difficulty</label>
              <select
                id="drillDifficulty"
                value={drillDifficulty}
                onChange={(e) => setDrillDifficulty(e.target.value as Difficulty)}
              >
                {difficultyOrder.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <p className="muted" style={{ fontSize: '0.9rem', marginTop: 6 }}>
                Difficulty will adjust automatically as your accuracy changes.
              </p>
            </div>
            <div>
              <label htmlFor="drillTimer">Drill timer (minutes)</label>
              <div className="flex" style={{ gap: 12 }}>
                <label className="flex" style={{ gap: 8 }}>
                  <input type="checkbox" checked={drillTimed} onChange={(e) => setDrillTimed(e.target.checked)} />
                  Timed drills?
                </label>
                <input
                  id="drillTimer"
                  type="number"
                  min={2}
                  max={10}
                  disabled={!drillTimed}
                  value={drillMinutes}
                  onChange={(e) => setDrillMinutes(clampInt(Number(e.target.value), 2, 10))}
                  style={{ maxWidth: 100 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex" style={{ gap: 12 }}>
            <button onClick={startDrill} disabled={!canStartDrill}>
              {isLoading ? 'Preparing…' : 'Start drills'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleSkipToSummary} disabled={!Object.keys(scoreMap).length}>
              Skip to summary
            </button>
          </div>
        </div>
      )}

      {step === 'drill' && (
        <div className="mt-3">
          <h3>Drill round {drillRounds + (drillQuiz ? 1 : 0)}</h3>
          {drillQuiz && (
            <QuizRunner quiz={drillQuiz} onSubmitComplete={handleDrillComplete} showPracticeButton={false} />
          )}
          {!drillQuiz && drillSummary && (
            <div className="card">
              <h4 className="mt-0">Round recap</h4>
              <p className="muted">Here&apos;s how you did. Continue drilling or jump to the prep summary.</p>
              <div className="mt-2 table-responsive">
                <table className="prep-table">
                  <thead>
                    <tr>
                      <th scope="col">Subtopic</th>
                      <th scope="col">Latest accuracy</th>
                      <th scope="col">Rounds practiced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubtopics.map((name) => {
                      const info = scoreMap[name];
                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{info?.latest ?? '—'}%</td>
                          <td>{info?.rounds ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex" style={{ gap: 12 }}>
                <button
                  onClick={startDrill}
                  disabled={isLoading || drillRounds >= maxDrillRounds}
                >
                  {drillRounds >= maxDrillRounds ? 'Max rounds reached' : 'Run another round'}
                </button>
                <button className="btn btn-outline" onClick={handleSkipToSummary}>
                  Wrap up with summary
                </button>
              </div>
              {drillRounds >= maxDrillRounds && (
                <p className="muted mt-2">You&apos;ve reached the max of {maxDrillRounds} rounds. Use the summary to see what to tackle next.</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'summary' && (
        <div className="mt-3">
          <h3>Prep summary</h3>
          <p className="muted">Before vs. after scores for the areas you drilled.</p>
          <div className="mt-2 table-responsive">
            <table className="prep-table">
              <thead>
                <tr>
                  <th scope="col">Subtopic</th>
                  <th scope="col">Initial</th>
                  <th scope="col">Latest</th>
                  <th scope="col">Rounds</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(scoreMap).map((name) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{scoreMap[name].initial}%</td>
                    <td>{scoreMap[name].latest}%</td>
                    <td>{scoreMap[name].rounds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {summaryLoading && <LoadingQuiz label="Summarising what to study next…" />}

          {prepSummary && (
            <div className="mt-3 card">
              {prepSummary.headline && <h4 className="mt-0">{prepSummary.headline}</h4>}
              {prepSummary.encouragement && <p className="muted">{prepSummary.encouragement}</p>}
              <ul className="mt-2" style={{ paddingLeft: 20 }}>
                {prepSummary.pointers.map((pointer) => (
                  <li key={pointer.subtopic}>
                    <strong>{pointer.subtopic}:</strong> {pointer.tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex" style={{ gap: 12 }}>
            <button onClick={restartPlan} disabled={isLoading}>
              Restart this plan
            </button>
            <button className="btn btn-outline" onClick={startDrill} disabled={isLoading || !selectedSubtopics.length}>
              Generate a few more questions
            </button>
          </div>

          {masteryReached && <p className="good mt-2">Nice! You&apos;ve crossed the mastery bar for the areas you drilled.</p>}
        </div>
      )}
    </div>
  );
}
