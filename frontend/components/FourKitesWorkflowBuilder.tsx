'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Check,
  Circle,
  ChevronRight,
  Truck,
  Mail,
  FileText,
  AlertTriangle,
  X,
  Zap,
  Plus,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Action Catalog - FourKites Supply Chain Actions
const ACTION_CATALOG: Record<string, any> = {
  send_email_level1_real: {
    name: 'Send Initial Email',
    category: 'Email',
    icon: '📧',
    connector: 'FourKites Email',
    requiredParams: ['recipient_email', 'facility'],
    optionalParams: ['shipment_id', 'cc_list', 'custom_subject', 'custom_message'],
    paramDescriptions: {
      recipient_email: 'Enter recipient email address',
      facility: 'Enter facility name',
      shipment_id: 'Enter shipment tracking ID (optional)',
      cc_list: 'Enter CC email addresses (optional)',
      custom_subject: 'Enter email subject',
      custom_message: 'Enter email message',
    },
    paramLabels: {
      recipient_email: 'To',
      facility: 'Facility',
      shipment_id: 'Shipment ID',
      cc_list: 'CC',
      custom_subject: 'Subject',
      custom_message: 'Message',
    },
  },
  send_email_level2_followup_real: {
    name: 'Send Follow-up Email',
    category: 'Email',
    icon: '📨',
    connector: 'FourKites Email',
    requiredParams: ['recipient_email', 'facility', 'missing_fields'],
    optionalParams: ['cc_list'],
    paramDescriptions: {
      recipient_email: 'Enter recipient email',
      facility: 'Enter facility name',
      missing_fields: 'Enter missing information fields',
      cc_list: 'Enter CC addresses (optional)',
    },
    paramLabels: {
      recipient_email: 'To',
      facility: 'Facility',
      missing_fields: 'Missing Fields',
      cc_list: 'CC',
    },
  },
  send_email_level3_escalation_real: {
    name: 'Send Escalation Email',
    category: 'Email',
    icon: '🚨',
    connector: 'FourKites Email',
    requiredParams: ['escalation_recipient', 'facility', 'escalation_level'],
    optionalParams: ['original_recipient', 'reason', 'cc_list'],
    paramDescriptions: {
      escalation_recipient: 'Enter manager/supervisor email',
      facility: 'Enter facility name',
      escalation_level: 'Enter escalation level (1-3)',
      original_recipient: 'Enter original contact email (optional)',
      reason: 'Enter reason for escalation (optional)',
    },
    paramLabels: {
      escalation_recipient: 'Escalate To',
      facility: 'Facility',
      escalation_level: 'Level',
      original_recipient: 'Original Contact',
      reason: 'Reason',
    },
  },
  check_gmail_inbox: {
    name: 'Check Email Inbox',
    category: 'Email',
    icon: '📬',
    connector: 'FourKites Email',
    requiredParams: [],
    optionalParams: ['subject_filter', 'from_filter', 'since_hours'],
    paramDescriptions: {
      subject_filter: 'Filter by subject (optional)',
      from_filter: 'Filter by sender (optional)',
      since_hours: 'Time range in hours (default: 24)',
    },
    paramLabels: {
      subject_filter: 'Subject Filter',
      from_filter: 'From',
      since_hours: 'Time Range (hours)',
    },
  },
  parse_email_response_real: {
    name: 'Parse Email Response',
    category: 'Email',
    icon: '🤖',
    connector: 'FourKites AI',
    requiredParams: [],
    optionalParams: ['subject_filter', 'auto_fetch'],
    paramDescriptions: {
      subject_filter: 'Filter by subject (optional)',
      auto_fetch: 'Auto-fetch latest email (true/false)',
    },
    paramLabels: {
      subject_filter: 'Subject Filter',
      auto_fetch: 'Auto Fetch',
    },
  },
  wait_timer: {
    name: 'Wait Timer',
    category: 'Logic',
    icon: '⏱️',
    connector: 'FourKites Timer',
    requiredParams: ['duration'],
    optionalParams: ['unit'],
    paramDescriptions: {
      duration: 'Enter duration (number)',
      unit: 'Enter unit: seconds, minutes, hours, days (default: minutes)',
    },
    paramLabels: {
      duration: 'Duration',
      unit: 'Unit',
    },
  },
  conditional_router: {
    name: 'Conditional Check',
    category: 'Logic',
    icon: '🔀',
    connector: 'FourKites Logic',
    requiredParams: ['condition_field', 'operator', 'condition_value'],
    optionalParams: [],
    paramDescriptions: {
      condition_field: 'Enter field to check',
      operator: 'Enter operator: equals, not_equals, contains, greater_than, less_than',
      condition_value: 'Enter value to compare',
    },
    paramLabels: {
      condition_field: 'Field',
      operator: 'Operator',
      condition_value: 'Value',
    },
  },
  extract_document_text: {
    name: 'Extract Document Text',
    category: 'Documents',
    icon: '📄',
    connector: 'FourKites Docs',
    requiredParams: ['document_path'],
    optionalParams: ['page_numbers'],
    paramDescriptions: {
      document_path: 'Enter path to PDF or Word document',
      page_numbers: 'Enter specific pages (optional)',
    },
    paramLabels: {
      document_path: 'Document Path',
      page_numbers: 'Pages',
    },
  },
  parse_document_with_ai: {
    name: 'Parse Document with AI',
    category: 'Documents',
    icon: '🤖📄',
    connector: 'FourKites AI',
    requiredParams: ['document_text'],
    optionalParams: ['extraction_fields'],
    paramDescriptions: {
      document_text: 'Enter document text content',
      extraction_fields: 'Enter fields to extract (optional)',
    },
    paramLabels: {
      document_text: 'Document Text',
      extraction_fields: 'Fields to Extract',
    },
  },
};

// Supply Chain Templates
const SUPPLY_CHAIN_TEMPLATES = [
  {
    id: 'late-delivery',
    title: 'Late Delivery Alert',
    description: 'Notify when delayed > 2 hours',
    icon: <Truck className="w-4 h-4" />,
    prompt: 'When a shipment is delayed by more than 2 hours, send an email notification to the facility manager and track the response',
  },
  {
    id: 'auto-response-tracking',
    title: 'Auto Track Response',
    description: 'Send email and track replies',
    icon: <Mail className="w-4 h-4" />,
    prompt: 'Send an initial email asking for shipment updates, wait 24 hours, check for replies, and send a follow-up if no response',
  },
  {
    id: 'document-extraction',
    title: 'Document Processing',
    description: 'Extract shipping documents',
    icon: <FileText className="w-4 h-4" />,
    prompt: 'Extract text from shipping document and parse delivery info',
  },
  {
    id: 'escalation-workflow',
    title: 'Smart Escalation',
    description: 'Auto-escalate after failures',
    icon: <AlertTriangle className="w-4 h-4" />,
    prompt: 'Send initial email, wait 48 hours, check response, escalate to manager if no reply',
  },
];

interface WorkflowProposal {
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    actionId?: string;
    connector?: string;
    icon?: string;
    status: 'pending' | 'active' | 'complete';
  }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showApproveButton?: boolean;
  workflowProposal?: WorkflowProposal;
  proposedWorkflow?: Array<{
    actionId: string;
    name: string;
    description: string;
  }>;
}

interface WorkflowStep {
  id: string;
  actionId: string;
  name: string;
  icon: string;
  connector: string;
  status: 'configuring' | 'complete';
  params: Record<string, any>;
  description: string;
}

interface Props {
  onClose: () => void;
  onWorkflowGenerated: (workflow: any) => void;
}

export function FourKitesWorkflowBuilder({ onClose, onWorkflowGenerated }: Props) {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 **Hi! I'm your FourKites Workflow AI Assistant.**\n\nI can help you automate supply chain workflows. Just tell me what you'd like to do, or pick a template below.\n\nI'll guide you step-by-step and show your workflow building in real-time! ✨`,
    },
  ]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const detectActionIntent = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('send email') || lowerMessage.includes('email notification')) {
      if (lowerMessage.includes('escalat')) return 'send_email_level3_escalation_real';
      if (lowerMessage.includes('follow') && lowerMessage.includes('up')) return 'send_email_level2_followup_real';
      return 'send_email_level1_real';
    }
    if (lowerMessage.includes('check email') || lowerMessage.includes('check for repl') || lowerMessage.includes('track response')) {
      return 'check_gmail_inbox';
    }
    if (lowerMessage.includes('parse email') || lowerMessage.includes('analyze email')) {
      return 'parse_email_response_real';
    }
    if (lowerMessage.includes('wait') || lowerMessage.includes('delay')) {
      return 'wait_timer';
    }
    if (lowerMessage.includes('if') || lowerMessage.includes('condition')) {
      return 'conditional_router';
    }
    if (lowerMessage.includes('extract') && (lowerMessage.includes('document') || lowerMessage.includes('pdf'))) {
      return 'extract_document_text';
    }
    if (lowerMessage.includes('parse document')) {
      return 'parse_document_with_ai';
    }
    return null;
  };

  const extractParamValues = (message: string, paramNames: string[]): Record<string, string> => {
    const extracted: Record<string, string> = {};
    for (const param of paramNames) {
      if (param.includes('email') || param.includes('recipient')) {
        const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) extracted[param] = emailMatch[0];
      }
      if (param === 'facility') {
        const facilityMatch = message.match(/facility[:\s]+([A-Za-z0-9\s]+)/i) ||
                             message.match(/to\s+(?:the\s+)?([A-Za-z0-9\s]+)\s+manager/i);
        if (facilityMatch) extracted[param] = facilityMatch[1].trim();
      }
      if (param === 'duration') {
        const durationMatch = message.match(/(\d+)\s*(second|minute|hour|day)/i);
        if (durationMatch) {
          extracted[param] = durationMatch[1];
          if (paramNames.includes('unit')) extracted['unit'] = durationMatch[2].toLowerCase() + 's';
        }
      }
    }
    return extracted;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);
    setShowTemplates(false);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Call the real AI agent API
      const response = await fetch(`${API_URL}/api/workflow-agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();

      const agentMessage = data.agent_response || data.response || data.message || 'I understand. Let me help you with that.';

      // Check if the agent detected actions (backend returns detected_actions array)
      const hasDetectedActions = data.detected_actions && Array.isArray(data.detected_actions) && data.detected_actions.length > 0;

      // Check if the message suggests approving a workflow (contains phrases like "approve", "ready", "created")
      const suggestsApproval = agentMessage.toLowerCase().includes('workflow') &&
        (agentMessage.toLowerCase().includes('created') ||
         agentMessage.toLowerCase().includes('ready') ||
         agentMessage.toLowerCase().includes('approve') ||
         agentMessage.toLowerCase().includes('do that'));

      // Build proposed workflow if actions detected
      const proposedWorkflow = hasDetectedActions ? data.detected_actions.map((actionId: string) => {
        const actionDef = ACTION_CATALOG[actionId];
        return actionDef ? {
          actionId,
          name: actionDef.name,
          description: actionDef.name,
        } : null;
      }).filter(Boolean) : undefined;

      // Add AI response to chat (backend returns agent_response, not response)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: agentMessage,
          showApproveButton: suggestsApproval && hasDetectedActions,
          proposedWorkflow,
        },
      ]);

    } catch (error) {
      console.error('Error calling AI agent:', error);

      // Fallback to local detection if API fails
      const detectedActionId = detectActionIntent(userMessage);

      if (detectedActionId) {
        const actionDef = ACTION_CATALOG[detectedActionId];
        const extractedValues = extractParamValues(
          userMessage,
          [...actionDef.requiredParams, ...actionDef.optionalParams]
        );

        const newStep: WorkflowStep = {
          id: `step-${Date.now()}`,
          actionId: detectedActionId,
          name: actionDef.name,
          icon: actionDef.icon,
          connector: actionDef.connector,
          status: 'configuring',
          params: extractedValues,
          description: userMessage,
        };

        setWorkflowSteps((prev) => [...prev, newStep]);

        const missingParams = actionDef.requiredParams.filter((p: string) => !extractedValues[p]);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: missingParams.length > 0
              ? `Great! I've added **"${actionDef.name}"** ${actionDef.icon} to your workflow.\n\nPlease fill in the required details on the right side to complete this step.`
              : `✅ Perfect! **"${actionDef.name}"** is configured.\n\nWhat would you like to do next?`,
          },
        ]);

        if (missingParams.length === 0) {
          newStep.status = 'complete';
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I can help you with:\n\n📧 **Send Email** - "send email to..."\n📬 **Check Inbox** - "check for replies"\n🤖 **Parse Email** - "parse the response"\n⏱️ **Wait Timer** - "wait 24 hours"\n🔀 **Conditions** - "if no response..."\n📄 **Extract Document** - "extract text from PDF"\n\nTry describing what you'd like!`,
          },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateClick = (template: any) => {
    setInputMessage(template.prompt);
  };

  const handleParamChange = (stepId: string, paramName: string, value: string) => {
    setWorkflowSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          const updatedParams = { ...step.params, [paramName]: value };
          const actionDef = ACTION_CATALOG[step.actionId];
          const missingParams = actionDef.requiredParams.filter((p: string) => !updatedParams[p]);
          return {
            ...step,
            params: updatedParams,
            status: missingParams.length === 0 ? 'complete' : 'configuring',
          };
        }
        return step;
      })
    );
  };

  const handleApproveWorkflow = (proposedWorkflow: any[]) => {
    // Create workflow steps from proposed workflow
    const newSteps: WorkflowStep[] = proposedWorkflow.map((item) => {
      const actionDef = ACTION_CATALOG[item.actionId];
      return {
        id: `step-${Date.now()}-${Math.random()}`,
        actionId: item.actionId,
        name: actionDef.name,
        icon: actionDef.icon,
        connector: actionDef.connector,
        status: 'configuring' as const,
        params: {},
        description: item.description,
      };
    });

    setWorkflowSteps(newSteps);

    // Add confirmation message
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '✅ **Workflow approved!** I\'ve created the steps on the right. Now you can fill in the details for each step.',
      },
    ]);
  };

  const handleSaveWorkflow = () => {
    onWorkflowGenerated({ steps: workflowSteps });
    onClose();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600"
      >
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-white">FourKites Workflow AI</h1>
            <p className="text-xs text-blue-100">Supply Chain Automation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveWorkflow}
            disabled={workflowSteps.length === 0 || workflowSteps.some((s) => s.status !== 'complete')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Save
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content - 2 Panel Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Chat */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-[480px] border-r border-gray-200 flex flex-col bg-gray-50"
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:font-semibold prose-strong:text-gray-900">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Approve Button */}
                    {message.showApproveButton && message.proposedWorkflow && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApproveWorkflow(message.proposedWorkflow!)}
                        className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve Workflow
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </motion.div>
            )}

            {/* Templates */}
            {showTemplates && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Start Templates</h3>
                <div className="grid gap-2">
                  {SUPPLY_CHAIN_TEMPLATES.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      onClick={() => handleTemplateClick(template)}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-600">{template.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{template.title}</p>
                          <p className="text-xs text-gray-500">{template.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe your workflow step..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL - Workflow Steps */}
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col bg-white"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Workflow</h2>
                <p className="text-xs text-gray-500">Configure each step below</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {workflowSteps.length} steps
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {workflowSteps.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4 text-6xl"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Build</h3>
                  <p className="text-gray-500">
                    Start chatting on the left, and I'll add workflow steps here as we go!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0 max-w-3xl">
                <AnimatePresence>
                  {workflowSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="relative"
                    >
                      {/* Connector Line */}
                      {index > 0 && <div className="absolute left-[18px] top-0 w-0.5 h-6 bg-gray-300" />}

                      {/* Step Card */}
                      <div className="relative pl-12 pb-6">
                        {/* Status Indicator */}
                        <div className="absolute left-0 top-0">
                          {step.status === 'complete' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          ) : (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
                            >
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </motion.div>
                          )}
                        </div>

                        {/* Card Content */}
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                        >
                          {/* Header */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {step.connector}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <span className="text-2xl">{step.icon}</span>
                              {index + 1}. {step.name}
                            </h3>
                            {step.description && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {step.description}
                              </p>
                            )}
                          </div>

                          {/* Parameters Form */}
                          <div className="space-y-3">
                            {Object.keys(ACTION_CATALOG[step.actionId].paramLabels).map((paramKey) => {
                              const actionDef = ACTION_CATALOG[step.actionId];
                              const label = actionDef.paramLabels[paramKey];
                              const isRequired = actionDef.requiredParams.includes(paramKey);

                              return (
                                <div key={paramKey}>
                                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                                    {label}
                                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  <input
                                    type="text"
                                    value={step.params[paramKey] || ''}
                                    onChange={(e) => handleParamChange(step.id, paramKey, e.target.value)}
                                    placeholder={actionDef.paramDescriptions[paramKey]}
                                    className={`w-full px-3 py-2.5 text-sm text-gray-900 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 ${
                                      isRequired && !step.params[paramKey]
                                        ? 'border-red-300 bg-red-50/50'
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Status Message */}
                          {step.status === 'complete' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Step configured successfully!</span>
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
