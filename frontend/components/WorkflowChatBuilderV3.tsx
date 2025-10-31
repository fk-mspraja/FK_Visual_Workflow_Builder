'use client';

/**
 * Microsoft Copilot Workflows-style UI
 * 2-Panel Split: Chat Input (Left) + Flow Visualization (Right)
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
  Zap,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'active' | 'pending';
  icon: string;
  connector?: string;
  position: { x: number; y: number };
}

interface WorkflowChatBuilderV3Props {
  onClose?: () => void;
  onWorkflowGenerated?: (workflowJson: any) => void;
}

export function WorkflowChatBuilderV3({ onClose, onWorkflowGenerated }: WorkflowChatBuilderV3Props) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [workflowPlan, setWorkflowPlan] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

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
          connector: 'Office 365 Outlook',
          position: { x: 100, y: 100 }
        },
        {
          id: '2',
          title: 'Reply to Bug Email',
          description: 'Reply to the sender with acknowledgment',
          status: 'active',
          icon: 'email',
          connector: 'Office 365 Outlook',
          position: { x: 100, y: 220 }
        },
        {
          id: '3',
          title: 'Send Teams Bug Summary',
          description: 'Notify team about the bug report',
          status: 'pending',
          icon: 'teams',
          connector: 'Microsoft Teams',
          position: { x: 100, y: 340 }
        }
      ]);
    } else {
      setWorkflowSteps([
        {
          id: '1',
          title: 'Send Initial Email',
          description: 'Send professional outreach email',
          status: 'complete',
          icon: 'email',
          position: { x: 100, y: 100 }
        },
        {
          id: '2',
          title: 'Wait 48 Hours',
          description: 'Give time for response',
          status: 'active',
          icon: 'clock',
          position: { x: 100, y: 220 }
        },
        {
          id: '3',
          title: 'Check Inbox',
          description: 'Look for reply',
          status: 'pending',
          icon: 'inbox',
          position: { x: 100, y: 340 }
        }
      ]);
    }
    setWorkflowPlan({ ready: true });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    setTimeout(() => {
      generateWorkflowSteps(userMessage);
      setIsLoading(false);
    }, 1500);
  };

  const handleApproveWorkflow = async () => {
    setIsLoading(true);

    setTimeout(() => {
      const sampleWorkflow = {
        nodes: workflowSteps.map((step, index) => ({
          id: `node-${index + 1}`,
          type: 'workflowNode',
          position: { x: 300, y: 100 + (index * 150) },
          data: {
            label: step.title,
            activity: step.icon === 'email' ? 'send_email_level1_real' : 'check_gmail_inbox',
            icon: step.icon === 'trigger' ? '🔔' : step.icon === 'email' ? '📧' : step.icon === 'teams' ? '💬' : '⏱️',
            gradient: 'from-blue-500 to-cyan-500',
            params: {},
            configured: false,
            action_count: 1
          }
        })),
        edges: workflowSteps.slice(0, -1).map((_, index) => ({
          id: `edge-${index + 1}`,
          source: `node-${index + 1}`,
          target: `node-${index + 2}`,
          type: 'custom'
        }))
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Workflows (Frontier)</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Flow
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Activity
          </button>
          <button
            onClick={handleApproveWorkflow}
            disabled={!workflowPlan || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* 2-Panel Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Chat Input & Workflow List */}
        <div className="w-[480px] border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Chat Input Area */}
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
                <p className="text-sm text-gray-600">
                  Describe your workflow in natural language
                </p>
              </div>

              {/* Input Box */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="When I receive an email with the subject 'bug', automatically reply to the sender with a thank-you and confirmation I'm on it. Then send me a message in Teams that summarizes the email, including sender, subject, key details, and deadlines."
                  disabled={isLoading}
                  rows={7}
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
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" />

              {/* Quick Templates */}
              <div className="grid gap-2">
                {[
                  'Daily Brief in Teams',
                  'Auto Reply and Track',
                  'Unread Email Digest'
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(suggestion)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{suggestion}</p>
                      <p className="text-xs text-gray-500">Quick template</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* My Workflows List */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My workflows</h3>
            <div className="space-y-2">
              {[
                { title: 'Daily Agentic Automation Market Analysis', time: '2 minutes ago' },
                { title: 'Critical Escalation Email to Teams', time: '1 day ago' },
                { title: 'Create Planner Task from Action Email', time: '3 days ago' }
              ].map((workflow, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{workflow.title}</p>
                      <p className="text-xs text-gray-500">Last modified {workflow.time}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Flow Visualization */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {workflowSteps.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                  <span className="text-blue-600 font-medium">Workflows</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-900">Bug Email Auto-Reply and Teams Notification</span>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-0">
                  {workflowSteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Status Line on Left */}
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                        {/* Status Dot */}
                        <div className="relative z-10 mt-6">
                          {step.status === 'complete' ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          ) : step.status === 'active' ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center animate-pulse shadow-sm">
                              <div className="w-3 h-3 rounded-full bg-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                          )}
                        </div>
                        {/* Connecting Line */}
                        {index < workflowSteps.length - 1 && (
                          <div className="flex-1 w-0.5 bg-gray-200 my-1" />
                        )}
                      </div>

                      {/* Step Card */}
                      <div className="ml-12 mb-6">
                        <div
                          className={`p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                            step.status === 'active'
                              ? 'bg-blue-50 border-blue-200 shadow-sm'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Connector Badge */}
                          {step.connector && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">O</span>
                              </div>
                              <span className="text-xs font-medium text-gray-600">{step.connector}</span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              step.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getIconComponent(step.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {index + 1}. {step.title}
                              </h3>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {workflowPlan && (
                  <div className="flex items-center gap-3 mt-8">
                    <button
                      onClick={handleApproveWorkflow}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Create Workflow
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => router.push('/builder')}
                      className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
                    >
                      Edit in Builder
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Describe your workflow</h3>
                  <p className="text-sm text-gray-600">
                    Type your workflow description on the left and I'll visualize it here
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
