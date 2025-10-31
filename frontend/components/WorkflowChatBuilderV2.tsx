'use client';

/**
 * Microsoft Copilot Workflows-style UI
 * 3-Panel Layout: Chat Input | Workflow Steps | Workflow Details
 */

import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Mic,
  Paperclip,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Mail,
  Clock,
  MessageSquare,
  GitBranch,
  Zap
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
  icon: string;
  connector?: string;
}

interface WorkflowChatBuilderV2Props {
  onClose?: () => void;
  onWorkflowGenerated?: (workflowJson: any) => void;
}

export function WorkflowChatBuilderV2({ onClose, onWorkflowGenerated }: WorkflowChatBuilderV2Props) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [workflowPlan, setWorkflowPlan] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  // Mock workflow generation
  const generateWorkflowSteps = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('bug') || lowerInput.includes('email')) {
      setWorkflowSteps([
        {
          id: '1',
          title: 'New Bug Email Received',
          description: 'When a new email arrives (V3)',
          status: 'complete',
          icon: 'trigger',
          connector: 'Office 365 Outlook'
        },
        {
          id: '2',
          title: 'Reply to Bug Email',
          description: 'Reply to the sender of the email in New Bug Email Received',
          status: 'active',
          icon: 'email',
          connector: 'Office 365 Outlook'
        },
        {
          id: '3',
          title: 'Send Teams Bug Summary',
          description: 'Send a Teams message to summarize the bug email',
          status: 'pending',
          icon: 'teams',
          connector: 'Microsoft Teams'
        }
      ]);
      setShowDetails(true);
    } else {
      setWorkflowSteps([
        {
          id: '1',
          title: 'Send Initial Email',
          description: 'Send professional outreach email',
          status: 'complete',
          icon: 'email'
        },
        {
          id: '2',
          title: 'Wait 48 Hours',
          description: 'Give time for response',
          status: 'active',
          icon: 'clock'
        },
        {
          id: '3',
          title: 'Check Inbox',
          description: 'Look for reply',
          status: 'pending',
          icon: 'inbox'
        },
        {
          id: '4',
          title: 'Parse Response (AI)',
          description: 'Analyze response quality',
          status: 'pending',
          icon: 'ai'
        },
        {
          id: '5',
          title: 'Conditional Router',
          description: 'Route based on response',
          status: 'pending',
          icon: 'router'
        }
      ]);
      setShowDetails(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      generateWorkflowSteps(userMessage);
      setWorkflowPlan({ ready: true });
      setIsLoading(false);
    }, 1500);
  };

  const handleApproveWorkflow = async () => {
    setIsLoading(true);

    setTimeout(() => {
      const sampleWorkflow = {
        nodes: [
          {
            id: 'node-1',
            type: 'workflowNode',
            position: { x: 300, y: 100 },
            data: {
              label: '1. Trigger: New Email',
              activity: 'check_gmail_inbox',
              icon: '📬',
              gradient: 'from-green-500 to-emerald-500',
              params: {},
              configured: false,
              action_count: 1
            }
          },
          {
            id: 'node-2',
            type: 'workflowNode',
            position: { x: 300, y: 250 },
            data: {
              label: '2. Reply to Email',
              activity: 'send_email_level1_real',
              icon: '📧',
              gradient: 'from-blue-500 to-cyan-500',
              params: {},
              configured: false,
              action_count: 1
            }
          },
          {
            id: 'node-3',
            type: 'workflowNode',
            position: { x: 300, y: 400 },
            data: {
              label: '3. Send Teams Message',
              activity: 'send_email_level1_real',
              icon: '💬',
              gradient: 'from-purple-500 to-pink-500',
              params: {},
              configured: false,
              action_count: 1
            }
          }
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'custom' },
          { id: 'edge-2', source: 'node-2', target: 'node-3', type: 'custom' }
        ]
      };

      setNodes(sampleWorkflow.nodes);
      setEdges(sampleWorkflow.edges);

      setTimeout(() => {
        router.push('/builder');
        if (onClose) onClose();
      }, 1000);

      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'trigger':
        return <Zap className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'clock':
        return <Clock className="w-5 h-5" />;
      case 'inbox':
        return <Mail className="w-5 h-5" />;
      case 'ai':
        return <Sparkles className="w-5 h-5" />;
      case 'router':
        return <GitBranch className="w-5 h-5" />;
      case 'teams':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Workflows (Frontier)</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Flow
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Activity
          </button>
          <button
            onClick={() => router.push('/builder')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Input */}
        <div className="w-[500px] border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-6">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Workflows (Frontier)</h2>
                <p className="text-sm text-gray-600">Describe your workflow and I'll help you build it</p>
              </div>

              {/* Input Area */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="When I receive an email with the subject 'bug', automatically reply to the sender..."
                    disabled={isLoading}
                    rows={6}
                    className="w-full px-4 py-4 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />

                {/* Suggestions */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Try these examples:</p>
                  <div className="grid gap-2">
                    {[
                      'Daily Brief in Teams',
                      'Auto Reply and Track',
                      'Unread Email Digest'
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInputMessage(suggestion)}
                        className="text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-sm text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Workflows Section */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My workflows</h3>
            <div className="space-y-2">
              {[
                { title: 'Daily Agentic Automation Market Analysis', time: '2 minutes ago' },
                { title: 'Critical Escalation Email to Teams', time: '1 day ago' },
                { title: 'Create Planner Task from Action Email', time: '3 days ago' }
              ].map((workflow, i) => (
                <button
                  key={i}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{workflow.title}</p>
                      <p className="text-xs text-gray-500">Last modified {workflow.time}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity">
                      <span className="text-gray-400">...</span>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Panel - Workflow Steps */}
        {showDetails && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Workflow Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ChevronRight className="w-4 h-4" />
                    <span>Workflows</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Bug Email Auto-Reply and Teams Notification</span>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-0">
                  {workflowSteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Step Card */}
                      <div
                        className={`relative p-6 rounded-xl transition-all cursor-pointer ${
                          step.status === 'active'
                            ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                            : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        {/* Status Indicator */}
                        <div className="absolute -left-3 top-8">
                          {step.status === 'complete' ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          ) : step.status === 'active' ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                              <div className="w-3 h-3 rounded-full bg-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <Circle className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex items-start gap-4 ml-6">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            step.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getIconComponent(step.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {step.connector && (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">O</span>
                                </div>
                                <span className="text-xs font-medium text-gray-600">{step.connector}</span>
                              </div>
                            )}
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {index + 1}. {step.title}
                            </h3>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Connector Line */}
                      {index < workflowSteps.length - 1 && (
                        <div className="w-0.5 h-4 bg-gray-200 ml-3" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {workflowPlan && (
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleApproveWorkflow}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Generate Workflow
                        </>
                      )}
                    </button>
                    <button className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors">
                      Edit Steps
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Details (Optional) */}
        {showDetails && (
          <div className="w-[400px] border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Workflow Details</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900">Draft</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">Just now</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Steps</p>
                    <p className="text-sm font-medium text-gray-900">{workflowSteps.length} actions</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Connectors Used</h3>
                <div className="space-y-2">
                  {['Office 365 Outlook', 'Microsoft Teams'].map((connector, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">O</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{connector}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
