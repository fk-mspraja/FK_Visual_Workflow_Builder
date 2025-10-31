'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Check,
  Circle,
  ChevronRight,
  X,
  Play,
  Save,
  Loader2,
  Upload,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Quick prompt suggestions based on existing actions
const QUICK_PROMPTS = [
  {
    icon: '📧',
    text: 'Send email notifications',
    prompt: 'Send an email notification to facility managers',
  },
  {
    icon: '⏱️',
    text: 'Wait and check response',
    prompt: 'Wait 48 hours and check for email response',
  },
  {
    icon: '🚨',
    text: 'Escalate if no response',
    prompt: 'Escalate to manager if no response after 2 days',
  },
  {
    icon: '🤖',
    text: 'Parse email with AI',
    prompt: 'Parse email response and extract key information',
  },
];

// Action Catalog - FourKites Supply Chain Actions (synced with backend)
const ACTION_CATALOG: Record<string, any> = {
  // EMAIL ACTIONS
  send_email_level1_real: {
    name: 'Send Initial Email',
    category: 'Email',
    description: 'Send professional outreach email for shipment information',
    required_params: ['recipient_email', 'facility'],
    optional_params: ['shipment_id', 'cc_list', 'email_template', 'custom_subject', 'custom_message'],
    icon: '📧',
    connector: 'FourKites Email',
    color: 'from-blue-500 to-cyan-500',
  },
  send_email_level2_followup_real: {
    name: 'Send Follow-up Email',
    category: 'Email',
    description: 'Send follow-up email when information is incomplete',
    required_params: ['recipient_email', 'facility', 'missing_fields'],
    optional_params: ['cc_list'],
    icon: '📨',
    connector: 'FourKites Email',
    color: 'from-blue-600 to-indigo-600',
  },
  send_email_level3_escalation_real: {
    name: 'Send Escalation Email',
    category: 'Email',
    description: 'Send urgent escalation email to manager/supervisor',
    required_params: ['escalation_recipient', 'facility', 'escalation_level'],
    optional_params: ['original_recipient', 'reason', 'cc_list'],
    icon: '🚨',
    connector: 'FourKites Email',
    color: 'from-red-500 to-orange-500',
  },
  check_gmail_inbox: {
    name: 'Check Email Inbox',
    category: 'Email',
    description: 'Check inbox for new emails and replies',
    required_params: [],
    optional_params: ['subject_filter', 'from_filter', 'since_hours', 'mark_as_read'],
    icon: '📬',
    connector: 'FourKites Email',
    color: 'from-indigo-500 to-blue-500',
  },
  parse_email_response_real: {
    name: 'Parse Email Response (AI)',
    category: 'Email',
    description: 'AI-powered email parsing to extract delivery info and detect gibberish',
    required_params: [],
    optional_params: ['email_body', 'subject_filter', 'from_email', 'auto_fetch', 'since_hours'],
    icon: '🤖📧',
    connector: 'FourKites AI',
    color: 'from-purple-500 to-pink-500',
  },

  // LOGIC & CONDITIONALS
  wait_timer: {
    name: 'Wait Timer',
    category: 'Logic',
    description: 'Wait for specified duration before continuing workflow',
    required_params: ['duration'],
    optional_params: ['unit'],
    icon: '⏱️',
    connector: 'FourKites Timer',
    color: 'from-gray-400 to-gray-600',
  },
  conditional_router: {
    name: 'Conditional Router (If/Else)',
    category: 'Logic',
    description: 'Route workflow based on conditions (if/else logic)',
    required_params: ['condition_field', 'operator', 'condition_value'],
    optional_params: ['true_branch', 'false_branch'],
    icon: '🔀',
    connector: 'FourKites Logic',
    color: 'from-yellow-500 to-orange-500',
  },

  // DOCUMENT EXTRACTION
  extract_document_text: {
    name: 'Extract Document Text',
    category: 'Documents',
    description: 'Extract text from PDF or Word documents',
    required_params: ['document_path'],
    optional_params: ['page_numbers'],
    icon: '📄',
    connector: 'FourKites Docs',
    color: 'from-green-500 to-emerald-500',
  },
  parse_document_with_ai: {
    name: 'Parse Document with AI',
    category: 'Documents',
    description: 'AI-powered document parsing to extract structured information',
    required_params: ['document_text'],
    optional_params: ['extraction_fields', 'format'],
    icon: '🤖📄',
    connector: 'FourKites AI',
    color: 'from-purple-600 to-blue-600',
  },

  // TRIGGERS
  check_trigger_condition: {
    name: 'Check Database Trigger',
    category: 'Triggers',
    description: 'Monitor database for new shipments requiring follow-up',
    required_params: ['database'],
    optional_params: ['query_filter'],
    icon: '🔍',
    connector: 'FourKites DB',
    color: 'from-purple-500 to-pink-500',
  },
};

interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  actionId?: string;
  connector?: string;
  icon?: string;
  status: 'pending' | 'active' | 'complete';
  configFields?: Array<{ name: string; value: string; required: boolean }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  workflowProposal?: {
    steps: WorkflowStep[];
  };
  showApproveButton?: boolean;
}

interface Props {
  onClose: () => void;
  onWorkflowGenerated: (workflow: any) => void;
}

export function FourKitesWorkflowBuilderV2({ onClose, onWorkflowGenerated }: Props) {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 **Welcome to FourKites Workflow Builder!**

I'm your AI assistant for creating supply chain automation workflows.

**Here's how I can help:**
- 📄 Upload a requirement document (Word/PDF) and I'll analyze it
- 💬 Or simply chat with me to describe what you need

Just tell me what workflow you'd like to build, and I'll guide you step-by-step!`,
    },
  ]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${API_URL}/api/workflow-agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
      });

      if (!response.ok) throw new Error('API call failed');

      const data = await response.json();
      const agentMessage = data.agent_response || 'I understand. Let me help you with that.';

      // Check if the agent detected actions
      const hasDetectedActions = data.detected_actions && Array.isArray(data.detected_actions) && data.detected_actions.length > 0;

      // Build workflow proposal if actions detected
      let workflowProposal: WorkflowStep[] | undefined;
      if (hasDetectedActions) {
        workflowProposal = data.detected_actions.map((actionId: string, index: number) => {
          const actionDef = ACTION_CATALOG[actionId];
          return {
            stepNumber: index + 1,
            title: actionDef?.name || actionId,
            description: actionDef?.name || actionId,
            actionId,
            connector: actionDef?.connector,
            icon: actionDef?.icon,
            status: 'pending' as const,
          };
        });
      }

      // Check if message suggests approval
      const suggestsApproval =
        agentMessage.toLowerCase().includes('workflow') &&
        (agentMessage.toLowerCase().includes('created') ||
          agentMessage.toLowerCase().includes('ready') ||
          agentMessage.toLowerCase().includes('do that'));

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: agentMessage,
          workflowProposal: workflowProposal ? { steps: workflowProposal } : undefined,
          showApproveButton: suggestsApproval && hasDetectedActions,
        },
      ]);
    } catch (error) {
      console.error('Error calling AI agent:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveWorkflow = (steps: WorkflowStep[]) => {
    const activeSteps = steps.map((step, index) => ({
      ...step,
      status: index === 0 ? ('active' as const) : ('pending' as const),
    }));
    setWorkflowSteps(activeSteps);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '✅ **Workflow approved!** The flow is now displayed on the right. You can configure each step.',
      },
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setShowQuickPrompts(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/workflow-agent/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `📄 Uploaded: ${file.name}` },
        { role: 'assistant', content: data.agent_response || 'Document received! Let me analyze it...' },
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Sorry, I couldn\'t process the document. Please try describing your workflow instead.' },
      ]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickPrompts(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      setShowQuickPrompts(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">FourKites Workflows</h1>
            <p className="text-xs text-gray-500">AI-Powered Supply Chain Automation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWorkflowGenerated({ steps: workflowSteps })}
            disabled={workflowSteps.length === 0}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Chat with Stepper */}
        <div className="w-[560px] bg-white border-r border-gray-200 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`flex-1 ${message.role === 'user' ? 'max-w-[80%]' : ''}`}>
                  {/* Message Content */}
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl px-4 py-3'
                        : 'text-gray-800'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none prose-p:my-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Workflow Stepper */}
                  {message.workflowProposal && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Workflow Plan</span>
                      </div>

                      <div className="space-y-2">
                        {message.workflowProposal.steps.map((step, stepIndex) => (
                          <motion.div
                            key={stepIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: stepIndex * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all group"
                          >
                            {/* Step Number Circle */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                              {step.stepNumber}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {step.icon && <span className="text-base">{step.icon}</span>}
                                <span className="font-medium text-gray-900 text-sm">{step.title}</span>
                              </div>
                              <p className="text-xs text-gray-600">{step.description}</p>
                              {step.connector && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center">
                                    <span className="text-[9px]">🔌</span>
                                  </div>
                                  <span className="text-[10px] text-blue-700 font-medium">{step.connector}</span>
                                </div>
                              )}
                            </div>

                            {/* Connector Line */}
                            {stepIndex < message.workflowProposal.steps.length - 1 && (
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Approve Button */}
                      {message.showApproveButton && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          onClick={() => handleApproveWorkflow(message.workflowProposal!.steps)}
                          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                        >
                          <Play className="w-4 h-4" />
                          Approve & Build Workflow
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">You</span>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {/* Quick Prompts */}
            {showQuickPrompts && messages.length <= 1 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleQuickPromptClick(prompt.prompt)}
                      className="flex items-center gap-2 p-2 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-xs"
                    >
                      <span className="text-base">{prompt.icon}</span>
                      <span className="text-gray-700 font-medium">{prompt.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Upload requirement document"
              >
                <Upload className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setShowQuickPrompts(false)}
                  placeholder="Describe your workflow..."
                  rows={2}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Flow Visualization */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50/30 p-8 overflow-y-auto">
          {workflowSteps.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflow yet</h3>
                <p className="text-sm text-gray-600">
                  Chat with the AI to create your workflow. Once approved, it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Workflow</h2>
                <p className="text-sm text-gray-600">Configure each step to complete your automation</p>
              </div>

              {/* Flow Steps */}
              <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Step Card */}
                    <div className={`bg-white rounded-xl border-2 p-6 shadow-sm ${
                      step.status === 'active' ? 'border-blue-500' : 'border-gray-200'
                    }`}>
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          ACTION_CATALOG[step.actionId || '']?.color || 'from-gray-400 to-gray-500'
                        } flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                          {step.icon || '⚡'}
                        </div>

                        {/* Title */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">STEP {step.stepNumber}</span>
                            {step.status === 'active' && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            {step.status === 'complete' && (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        </div>
                      </div>

                      {/* Connector Badge */}
                      {step.connector && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-4">
                          <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center">
                            <span className="text-[10px]">🔌</span>
                          </div>
                          {step.connector}
                        </div>
                      )}

                      {/* Configuration Fields Placeholder */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Configuration <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Click to configure..."
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < workflowSteps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
