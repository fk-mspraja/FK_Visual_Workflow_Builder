'use client';

import { useState, useEffect } from 'react';
import { ACTION_BLOCKS } from '@/lib/actions';
import { getActionIcon } from '@/lib/iconMap';

interface AIWorkflowAssistantProps {
  onWorkflowGenerated: (nodes: any[], edges: any[]) => void;
  onBlocksRecommended: (recommendedBlocks: string[]) => void;
  initialRequirement?: string;
  autoOpen?: boolean;
}

export default function AIWorkflowAssistant({
  onWorkflowGenerated,
  onBlocksRecommended,
  initialRequirement = '',
  autoOpen = false,
}: AIWorkflowAssistantProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [requirement, setRequirement] = useState(initialRequirement);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendedBlocks, setRecommendedBlocks] = useState<string[]>([]);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);

  // Auto-analyze when opened from onboarding with a requirement
  useEffect(() => {
    if (autoOpen && initialRequirement.trim()) {
      handleAnalyze();
    }
  }, []); // Run only once on mount

  const handleAnalyze = async () => {
    if (!requirement.trim()) {
      alert('Please describe your workflow requirements');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai-workflow-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement,
          availableBlocks: Object.keys(ACTION_BLOCKS),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedBlocks(data.recommendedBlocks);
        setGeneratedWorkflow(data.workflow);
        onBlocksRecommended(data.recommendedBlocks);
      } else {
        alert('Failed to analyze requirements');
      }
    } catch (error) {
      console.error('AI assistant error:', error);
      alert('Failed to connect to AI assistant');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseWorkflow = () => {
    if (generatedWorkflow) {
      onWorkflowGenerated(generatedWorkflow.nodes, generatedWorkflow.edges);
      setIsOpen(false);
      setRequirement('');
      setRecommendedBlocks([]);
      setGeneratedWorkflow(null);
    }
  };

  const handleClear = () => {
    setRequirement('');
    setRecommendedBlocks([]);
    setGeneratedWorkflow(null);
    onBlocksRecommended([]);
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
        title="AI Workflow Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="font-bold text-lg">AI Workflow Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-purple-100 text-sm mt-1">
              Describe your workflow and I'll build it for you
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Input Area */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What do you want to automate?
              </label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Example: Send an email, wait 1 hour, check for reply, if no reply send follow-up email, if gibberish response escalate to manager..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500 resize-none"
                rows={6}
                disabled={isGenerating}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleAnalyze}
                disabled={isGenerating || !requirement.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze & Build
                  </>
                )}
              </button>
              {(recommendedBlocks.length > 0 || generatedWorkflow) && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recommended Blocks */}
            {recommendedBlocks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Recommended Blocks ({recommendedBlocks.length})
                </h4>
                <div className="space-y-2">
                  {recommendedBlocks.map((blockId) => {
                    const block = ACTION_BLOCKS[blockId];
                    if (!block) return null;
                    return (
                      <div
                        key={blockId}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-purple-600">
                          {getActionIcon(blockId, 'w-5 h-5')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{block.name}</div>
                          <div className="text-xs text-gray-600">{block.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generated Workflow Preview */}
            {generatedWorkflow && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Generated Workflow</h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold text-green-900">
                      {generatedWorkflow.name}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mb-3">{generatedWorkflow.description}</p>
                  <div className="flex gap-2 text-xs text-green-700">
                    <span>Nodes: {generatedWorkflow.nodes?.length || 0}</span>
                    <span>•</span>
                    <span>Connections: {generatedWorkflow.edges?.length || 0}</span>
                  </div>
                </div>
                <button
                  onClick={handleUseWorkflow}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Canvas
                </button>
              </div>
            )}

            {/* Examples */}
            {!recommendedBlocks.length && !generatedWorkflow && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Example Workflows</h4>
                {[
                  'Send email → Wait 1 hour → Check for reply → If no reply, send follow-up',
                  'Check database for late deliveries → Send alert to manager → Log incident',
                  'Monitor temperature sensor → If over 45°F alert driver → Email quality team',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setRequirement(example)}
                    className="w-full text-left p-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
