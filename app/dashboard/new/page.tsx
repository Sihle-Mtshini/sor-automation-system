'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, AlertCircle, Search, CheckCircle, RefreshCw, Users,
  Zap, UserPlus, XCircle, ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '@/lib/api';

// ---- Types ----

interface MoodleLearner {
  id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  completed: boolean;
  completion_date: string | null;
}

interface Learner {
  id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
}

interface QuizResult {
  quiz_id: number;
  topic_name: string;
  score: number;
  total_marks: number;
  percentage: number;
}

interface GradesData {
  learner_name: string;
  quizzes: QuizResult[];
  overall_score: number | null;
  quiz_count: number;
}

interface BulkResult {
  total_created: number;
  total_failed: number;
  created: { id: number; learner_name: string; status: string }[];
  failed: { learner_name: string; error: string }[];
}

// ---- Shared status badge ----

function StatusBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={12} /> Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      In Progress
    </span>
  );
}

// ===========================================================================
//  TAB 1: Auto-Detect from Moodle
// ===========================================================================

function AutoDetectTab({ onComplete }: { onComplete: () => void }) {
  const [learners, setLearners] = useState<MoodleLearner[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const fetchCompletions = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.getMoodleCompletions();
      if (res.success) {
        setLearners(res.data || []);
      } else {
        setError(res.error || 'Failed to fetch completions');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch completions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Don't auto-fetch on load - wait for user to click Refresh

  const displayed = showOnlyCompleted ? learners.filter(l => l.completed) : learners;

  const toggleAll = () => {
    if (selected.size === displayed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayed.map(l => l.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    setError('');
    setResult(null);
    setProgress(`Preparing ${selected.size} SOR requests...`);

    try {
      const selectedLearners = displayed
        .filter(l => selected.has(l.id))
        .map(l => ({
          learner_id: l.id,
          learner_name: l.fullname,
          learner_email: l.email,
          overall_score: null,
        }));

      setProgress(`Creating ${selectedLearners.length} SOR requests...`);
      const res = await api.createBulkRequests(selectedLearners);

      if (res.success) {
        setResult(res.data);
        setSelected(new Set());
      } else {
        setError(res.error || 'Bulk creation failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bulk creation failed';
      setError(message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  if (result) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Bulk SOR Generation Complete</h3>
            <p className="text-sm text-gray-500">
              {result.total_created} created, {result.total_failed} failed
            </p>
          </div>
        </div>

        {result.created.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-700 mb-2">Successfully Created ({result.created.length})</h4>
            <div className="grid grid-cols-2 gap-2">
              {result.created.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-800">{c.learner_name}</span>
                  <span className="text-green-600 font-medium">#{c.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.failed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-700 mb-2">Failed ({result.failed.length})</h4>
            <div className="grid grid-cols-2 gap-2">
              {result.failed.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-red-800">{f.learner_name}</span>
                  <span className="text-red-500 text-xs">{f.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button onClick={onComplete} className="flex items-center gap-2 px-5 py-2.5 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors">
            <ArrowRight size={16} /> Go to Dashboard
          </button>
          <button onClick={() => { setResult(null); fetchCompletions(); }} className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors">
            Generate More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompletions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Scanning Moodle...' : 'Refresh from Moodle'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyCompleted}
              onChange={(e) => setShowOnlyCompleted(e.target.checked)}
              className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522]"
            />
            Show only completed learners
          </label>
        </div>
        {displayed.length > 0 && (
          <span className="text-sm text-gray-500">
            {displayed.length} learner{displayed.length !== 1 ? 's' : ''} found
            {selected.size > 0 && ` | ${selected.size} selected`}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {progress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin" /> {progress}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mr-3" /> Scanning Moodle for completions...
        </div>
      ) : displayed.length === 0 && learners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>Click &quot;Refresh from Moodle&quot; to scan for enrolled learners.</p>
          <p className="text-sm mt-1">Make sure your Moodle URL and Token are set in the environment variables.</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>{showOnlyCompleted ? 'No completed learners found. Uncheck the filter to see all enrolled learners.' : 'No enrolled learners found.'}</p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === displayed.length && displayed.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(learner => (
                  <tr
                    key={learner.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selected.has(learner.id) ? 'bg-orange-50' : ''}`}
                    onClick={() => toggleOne(learner.id)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(learner.id)}
                        onChange={() => toggleOne(learner.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{learner.fullname}</td>
                    <td className="px-4 py-3 text-gray-600">{learner.email}</td>
                    <td className="px-4 py-3 text-gray-500">{learner.id}</td>
                    <td className="px-4 py-3"><StatusBadge completed={learner.completed} /></td>
                    <td className="px-4 py-3 text-gray-500">
                      {learner.completion_date ? new Date(learner.completion_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleGenerate}
            disabled={selected.size === 0 || generating}
            className="flex items-center gap-2 px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <><RefreshCw size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><Zap size={18} /> Generate SORs for {selected.size} Selected Learner{selected.size !== 1 ? 's' : ''}</>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ===========================================================================
//  TAB 2: Manual Selection
// ===========================================================================

function ManualSelectionTab({ onComplete }: { onComplete: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Learner[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<(Learner & { grades?: GradesData })[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await api.getLearners(searchTerm);
      if (res.success) {
        setSearchResults(res.data || []);
        if ((res.data || []).length === 0) {
          setError('No learners found matching your search.');
        }
      } else {
        setError(res.error || 'Search failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  const addLearner = async (learner: Learner) => {
    if (selectedLearners.find(l => l.id === learner.id)) return;

    const entry: Learner & { grades?: GradesData } = { ...learner };

    // Fetch grades in background
    try {
      const res = await api.getLearnerGrades(learner.id, learner.fullname);
      if (res.success && res.data) {
        entry.grades = res.data;
      }
    } catch {
      // Grades optional
    }

    setSelectedLearners(prev => [...prev, entry]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const removeLearner = (id: number) => {
    setSelectedLearners(prev => prev.filter(l => l.id !== id));
    setExpandedGrades(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleGrades = (id: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedLearners.length === 0) return;
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const learners = selectedLearners.map(l => ({
        learner_id: l.id,
        learner_name: l.fullname,
        learner_email: l.email,
        overall_score: l.grades?.overall_score || null,
      }));

      const res = await api.createBulkRequests(learners);
      if (res.success) {
        setResult(res.data);
        setSelectedLearners([]);
      } else {
        setError(res.error || 'Failed to create SOR requests');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bulk creation failed';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">SOR Generation Complete</h3>
            <p className="text-sm text-gray-500">
              {result.total_created} created, {result.total_failed} failed
            </p>
          </div>
        </div>

        {result.created.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-700 mb-2">Successfully Created</h4>
            <div className="grid grid-cols-2 gap-2">
              {result.created.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-800">{c.learner_name}</span>
                  <span className="text-green-600 font-medium">#{c.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.failed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-700 mb-2">Failed</h4>
            <div className="grid grid-cols-2 gap-2">
              {result.failed.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-red-800">{f.learner_name}</span>
                  <span className="text-red-500 text-xs">{f.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button onClick={onComplete} className="flex items-center gap-2 px-5 py-2.5 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors">
            <ArrowRight size={16} /> Go to Dashboard
          </button>
          <button onClick={() => setResult(null)} className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors">
            Generate More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search learners by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !searchTerm.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg mb-4 max-h-60 overflow-auto">
          {searchResults.map(learner => {
            const alreadySelected = selectedLearners.some(l => l.id === learner.id);
            return (
              <div
                key={learner.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 ${alreadySelected ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`}
                onClick={() => !alreadySelected && addLearner(learner)}
              >
                <div>
                  <span className="font-medium text-gray-900">{learner.fullname}</span>
                  <span className="ml-3 text-sm text-gray-500">{learner.email}</span>
                </div>
                {alreadySelected ? (
                  <span className="text-xs text-gray-400">Already added</span>
                ) : (
                  <button className="text-[#F26522] hover:text-orange-700 text-sm font-medium">
                    <UserPlus size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Learners */}
      {selectedLearners.length > 0 ? (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Selected Learners ({selectedLearners.length})
          </h3>
          <div className="space-y-2">
            {selectedLearners.map(learner => (
              <div key={learner.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F26522] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {learner.firstname[0]}{learner.lastname[0]}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{learner.fullname}</span>
                      <span className="ml-2 text-sm text-gray-500">{learner.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {learner.grades && (
                      <span className={`text-sm font-semibold ${(learner.grades.overall_score || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {learner.grades.overall_score}%
                      </span>
                    )}
                    {learner.grades && learner.grades.quizzes.length > 0 && (
                      <button
                        onClick={() => toggleGrades(learner.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedGrades.has(learner.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => removeLearner(learner.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
                {expandedGrades.has(learner.id) && learner.grades && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-white">
                    {learner.grades.quizzes.map(q => (
                      <div key={q.quiz_id} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-100 text-sm">
                        <span className="text-gray-700 truncate mr-2">{q.topic_name}</span>
                        <span className={`font-medium whitespace-nowrap ${q.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {q.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded-lg mb-4">
          <UserPlus size={32} className="mx-auto mb-2 opacity-50" />
          <p>Search and add learners to generate SORs</p>
          <p className="text-sm mt-1">Grades will be fetched automatically when selected</p>
        </div>
      )}

      {selectedLearners.length > 0 && (
        <div className="flex items-center gap-3">
          {selectedLearners.length === 1 ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <><RefreshCw size={18} className="animate-spin" /> Creating...</>
              ) : (
                <><Plus size={18} /> Create SOR Request</>
              )}
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <><RefreshCw size={18} className="animate-spin" /> Generating...</>
              ) : (
                <><Zap size={18} /> Generate {selectedLearners.length} SORs</>
              )}
            </button>
          )}
          <button
            onClick={() => setSelectedLearners([])}
            className="px-5 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
//  MAIN PAGE
// ===========================================================================

export default function NewRequestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');

  const goToDashboard = () => router.push('/dashboard');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New SOR Request</h1>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-blue-800 font-medium">Automated & Bulk SOR Generation</p>
            <p className="text-blue-700 text-sm">
              Auto-detect learners who completed courses from Moodle, or manually search and
              select learners. You can generate SORs individually or in bulk for multiple learners at once.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('auto')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'auto'
                ? 'border-[#F26522] text-[#F26522] bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Zap size={18} />
            Auto-Detect from Moodle
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'manual'
                ? 'border-[#F26522] text-[#F26522] bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={18} />
            Manual Selection
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'auto' ? (
            <AutoDetectTab onComplete={goToDashboard} />
          ) : (
            <ManualSelectionTab onComplete={goToDashboard} />
          )}
        </div>
      </div>
    </div>
  );
}
