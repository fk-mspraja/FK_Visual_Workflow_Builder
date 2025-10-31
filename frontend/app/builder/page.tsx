'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import SidebarWithAI from '@/components/SidebarWithAI';
import ConfigPanel from '@/components/ConfigPanel';
import AIWorkflowAssistant from '@/components/AIWorkflowAssistant';
import OnboardingModal from '@/components/OnboardingModal';
import { useWorkflowStore } from '@/lib/store';
import { executeWorkflow } from '@/lib/api';
import { ACTION_BLOCKS } from '@/lib/actions';
import { WORKFLOW_TEMPLATES_ENTERPRISE } from '@/lib/enterpriseTemplates';

// Dynamically import WorkflowCanvas to avoid SSR issues with React Flow
const WorkflowCanvas = dynamic(() => import('@/components/WorkflowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <p className="text-gray-600">Loading canvas...</p>
      </div>
    </div>
  ),
});

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('template');
  const showGuide = searchParams?.get('guide');

  const {
    nodes,
    edges,
    clearWorkflow,
    isExecuting,
    workflowId,
    workflowRunId,
    executionError,
    setExecuting,
    setWorkflowExecution,
    setExecutionError,
    addWorkflowToHistory,
    loadTemplate,
  } = useWorkflowStore();

  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [recommendedBlocks, setRecommendedBlocks] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingRequirement, setOnboardingRequirement] = useState('');

  // Check if guide parameter is present or first visit and show onboarding
  useEffect(() => {
    if (showGuide === 'true') {
      setShowOnboarding(true);
      return;
    }
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && !templateId) {
      setShowOnboarding(true);
    }
  }, [templateId, showGuide]);

  // Load template if specified in URL
  useEffect(() => {
    if (templateId) {
      const template = WORKFLOW_TEMPLATES_ENTERPRISE.find(t => t.id === templateId);
      if (template) {
        loadTemplate(template);
        setWorkflowTitle(template.name);
      }
    }
  }, [templateId, loadTemplate]);

  const handleOnboardingSubmit = (requirement: string) => {
    setOnboardingRequirement(requirement);
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const onDragStart = (event: React.DragEvent, actionId: string) => {
    event.dataTransfer.setData('application/reactflow', actionId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const generateWorkflowName = async () => {
    setIsGeneratingTitle(true);
    try {
      // Analyze workflow structure
      const nodeDescriptions = nodes.map((node) => {
        const action = ACTION_BLOCKS[node.data.activity];
        return `${action?.name || node.data.label}: ${action?.description || ''}`;
      }).join('; ');

      const response = await fetch('/api/generate-workflow-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodeDescriptions,
          nodeCount: nodes.length,
          edgeCount: edges.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflowTitle(data.name);
      } else {
        // Fallback to simple generation
        const firstAction = ACTION_BLOCKS[nodes[0]?.data.activity];
        const fallbackName = `${firstAction?.name || 'Workflow'} - ${new Date().toLocaleDateString()}`;
        setWorkflowTitle(fallbackName);
      }
    } catch (error) {
      console.error('Failed to generate workflow name:', error);
      // Fallback
      const firstAction = ACTION_BLOCKS[nodes[0]?.data.activity];
      const fallbackName = `${firstAction?.name || 'Workflow'} - ${new Date().toLocaleDateString()}`;
      setWorkflowTitle(fallbackName);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleExecute = () => {
    if (nodes.length === 0) {
      alert('Please add at least one node to the workflow');
      return;
    }

    // Validate that all nodes are configured
    const unconfiguredNodes = nodes.filter((node) => !node.data.configured);
    if (unconfiguredNodes.length > 0) {
      const nodeNames = unconfiguredNodes.map((n) => n.data.label).join(', ');
      if (
        !confirm(
          `The following nodes are not configured: ${nodeNames}\n\nDo you want to continue anyway?`
        )
      ) {
        return;
      }
    }

    // Show title modal and auto-generate name
    setShowTitleModal(true);
    generateWorkflowName();
  };

  const executeWorkflowWithTitle = async () => {
    if (!workflowTitle.trim()) {
      alert('Please enter a workflow title');
      return;
    }

    setShowTitleModal(false);
    setExecuting(true);
    setExecutionError(null);

    try {
      // Build workflow definition
      const workflowNodes = nodes.map((node, index) => {
        // Find connected nodes
        const outgoingEdges = edges.filter((edge) => edge.source === node.id);
        const nextNodes = outgoingEdges.map((edge) => edge.target);

        return {
          id: node.id,
          type: index === 0 ? 'trigger' : 'action',
          activity: node.data.activity,
          params: node.data.params,
          next: nextNodes,
        };
      });

      const totalActions = nodes.reduce(
        (sum, node) => sum + (node.data.action_count || 1),
        0
      );

      const workflow = {
        id: `workflow-${Date.now()}`,
        name: workflowTitle,
        config: {
          task_queue: 'fourkites-workflow-queue',
        },
        nodes: workflowNodes,
      };

      console.log('Executing workflow:', workflow);

      const result = await executeWorkflow(workflow);
      setWorkflowExecution(result.workflow_id, result.run_id);

      // Add to history
      addWorkflowToHistory({
        id: result.workflow_id,
        title: workflowTitle,
        workflowId: result.workflow_id,
        runId: result.run_id,
        nodeCount: nodes.length,
        actionCount: totalActions,
        status: 'running',
        startedAt: new Date().toISOString(),
        temporalUrl: `http://localhost:8233/namespaces/default/workflows/${result.workflow_id}`,
      });

      setShowExecutionModal(true);
      setWorkflowTitle(''); // Reset for next execution
    } catch (error: any) {
      console.error('Workflow execution failed:', error);
      setExecutionError(error.message || 'Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the workflow?')) {
      clearWorkflow();
    }
  };

  const totalActions = nodes.reduce(
    (sum, node) => sum + (node.data.action_count || 1),
    0
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-white/30" />
          <h1 className="text-xl font-bold">Workflow Builder</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Nodes:</div>
              <div className="text-lg font-bold">{nodes.length}</div>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Connections:</div>
              <div className="text-lg font-bold">{edges.length}</div>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Total Actions:</div>
              <div className="text-lg font-bold">{totalActions}</div>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-2 border-l border-white/20 pl-4 ml-2">
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Show AI Assistant Guide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">AI Guide</span>
            </button>
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
              title={showLeftSidebar ? "Hide Actions Panel" : "Show Actions Panel"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
              title={showRightSidebar ? "Hide Config Panel" : "Show Config Panel"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Actions */}
          <Link
            href="/history"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </Link>
          <button
            onClick={handleClear}
            disabled={nodes.length === 0}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || nodes.length === 0}
            className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors shadow-lg"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Executing...
              </span>
            ) : (
              'Execute Workflow'
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {executionError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-800">{executionError}</span>
            <button
              onClick={() => setExecutionError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {showLeftSidebar && (
          <SidebarWithAI
            onDragStart={onDragStart}
            recommendedBlocks={recommendedBlocks}
          />
        )}
        <WorkflowCanvas />
        {showRightSidebar && <ConfigPanel />}
      </div>

      {/* AI Workflow Assistant */}
      <AIWorkflowAssistant
        onWorkflowGenerated={(generatedNodes, generatedEdges) => {
          // Add generated nodes to canvas
          generatedNodes.forEach((node: any) => {
            // Use store methods to add nodes
            console.log('Generated node:', node);
          });
        }}
        onBlocksRecommended={(blocks) => {
          setRecommendedBlocks(blocks);
        }}
        initialRequirement={onboardingRequirement}
        autoOpen={!!onboardingRequirement}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onSubmit={handleOnboardingSubmit}
      />

      {/* Workflow Title Modal */}
      {showTitleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold">Name Your Workflow</h2>
              <p className="text-blue-100 mt-1">
                Give your workflow a descriptive title
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-black">
                  Workflow Title
                </label>
                <button
                  onClick={generateWorkflowName}
                  disabled={isGeneratingTitle}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-200"
                  title="Generate AI-powered workflow name"
                >
                  {isGeneratingTitle ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span>AI Generate</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={workflowTitle}
                onChange={(e) => setWorkflowTitle(e.target.value)}
                placeholder="e.g., Email Escalation Workflow"
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    executeWorkflowWithTitle();
                  }
                }}
                autoFocus
                disabled={isGeneratingTitle}
              />

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowTitleModal(false);
                    setWorkflowTitle('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeWorkflowWithTitle}
                  disabled={!workflowTitle.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Execute Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution Success Modal */}
      {showExecutionModal && workflowId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Workflow Started!</h2>
              </div>
              <p className="text-green-100">
                Your workflow has been successfully submitted to Temporal
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Workflow ID:</span>
                  <code className="text-sm font-mono text-blue-600">{workflowId}</code>
                </div>
                {workflowRunId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Run ID:</span>
                    <code className="text-sm font-mono text-blue-600 text-xs truncate max-w-xs">
                      {workflowRunId}
                    </code>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Nodes:</span>
                  <span className="text-sm font-bold text-gray-900">{nodes.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Total Actions:</span>
                  <span className="text-sm font-bold text-gray-900">{totalActions}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  View in Temporal UI
                </div>
                <a
                  href={`http://localhost:8233/namespaces/default/workflows/${workflowId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  http://localhost:8233/namespaces/default/workflows/{workflowId}
                </a>
              </div>

              <button
                onClick={() => setShowExecutionModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
