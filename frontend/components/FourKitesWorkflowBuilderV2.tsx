'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
  Home,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ReactFlow, Node, Edge, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { chatHistoryDB, ChatSession } from '../lib/chatHistory';
import { EMAIL_TEMPLATES, EmailTemplate, getTemplatesByCategory, fillTemplate } from '../lib/emailTemplates';
import { OrchestrationConfigPanel } from './OrchestrationConfigPanel';
import { OrchestrationConfig } from '../lib/orchestrationConfig';
import { TriggerBuilder, WorkflowTrigger } from './TriggerBuilder';

// Use local Next.js API routes for AI agent (no need for backend API)
const USE_LOCAL_API = true;
const API_URL = USE_LOCAL_API ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001');

// Real workflow templates for demo
const QUICK_PROMPTS = [
  {
    icon: '🚚',
    text: 'Late Delivery Notifier',
    prompt: 'Create a workflow to notify facilities about late deliveries, wait 48 hours for response, send follow-up if incomplete, and escalate to manager if no response',
  },
  {
    icon: '📋',
    text: 'BOL Document Extractor',
    prompt: 'Create a workflow to check emails for BOL document attachments, extract text from PDF, parse BOL number and delivery date using AI, and send confirmation email',
  },
  {
    icon: '📧',
    text: 'Custom Email Workflow',
    prompt: 'Send an email notification about shipment delays to facility managers',
  },
  {
    icon: '🤖',
    text: 'AI Response Parser',
    prompt: 'Parse email responses using AI to detect if information is complete, partial, or gibberish',
  },
];

// Action Catalog - FourKites Supply Chain Actions (Real Actions Only)
const ACTION_CATALOG: Record<string, any> = {
  // EMAIL ACTIONS
  send_initial_email: {
    name: 'Send Initial Email',
    category: 'Email',
    description: 'Send professional outreach email for shipment information or delivery delays',
    required_params: ['recipient_email', 'facility'],
    optional_params: ['shipment_id', 'cc_list', 'email_template', 'custom_subject', 'custom_message'],
    icon: '📧',
    connector: 'Gmail',
    color: 'from-blue-500 to-cyan-500',
  },
  send_followup_email: {
    name: 'Send Follow-up Email',
    category: 'Email',
    description: 'Send follow-up email when information is incomplete or no response received',
    required_params: ['recipient_email', 'facility', 'missing_fields'],
    optional_params: ['cc_list'],
    icon: '📨',
    connector: 'Gmail',
    color: 'from-blue-600 to-indigo-600',
  },
  send_escalation_email: {
    name: 'Send Escalation Email',
    category: 'Email',
    description: 'Send urgent escalation email to manager/supervisor for late deliveries',
    required_params: ['escalation_recipient', 'facility', 'escalation_level'],
    optional_params: ['original_recipient', 'reason', 'cc_list'],
    icon: '🚨',
    connector: 'Gmail',
    color: 'from-red-500 to-orange-500',
  },
  check_email_inbox: {
    name: 'Check Email Inbox',
    category: 'Email',
    description: 'Check Gmail inbox for new emails, replies, and BOL attachments',
    required_params: [],
    optional_params: ['subject_filter', 'from_filter', 'since_hours', 'mark_as_read'],
    icon: '📬',
    connector: 'Gmail',
    color: 'from-indigo-500 to-blue-500',
  },
  parse_email_response: {
    name: 'Parse Email Response (AI)',
    category: 'Email',
    description: 'AI-powered email parsing to extract delivery info, detect gibberish, and validate responses',
    required_params: [],
    optional_params: ['email_body', 'subject_filter', 'from_email', 'auto_fetch', 'since_hours'],
    icon: '🤖',
    connector: 'Claude AI',
    color: 'from-purple-500 to-pink-500',
  },

  // DOCUMENT EXTRACTION
  extract_document_text: {
    name: 'Extract Document Text',
    category: 'Documents',
    description: 'Extract text from PDF BOL documents, invoices, and attachments',
    required_params: ['document_path'],
    optional_params: ['page_numbers'],
    icon: '📄',
    connector: 'PDF Parser',
    color: 'from-green-500 to-emerald-500',
  },
  parse_document_with_ai: {
    name: 'Parse Document with AI',
    category: 'Documents',
    description: 'AI-powered document parsing to extract BOL number, delivery date, carrier info',
    required_params: ['document_text'],
    optional_params: ['extraction_fields', 'format'],
    icon: '📋',
    connector: 'Claude AI',
    color: 'from-purple-600 to-blue-600',
  },

  // LOGIC & CONDITIONALS
  wait_timer: {
    name: 'Wait Timer',
    category: 'Logic',
    description: 'Wait for specified duration before sending follow-up or checking responses',
    required_params: ['duration'],
    optional_params: ['unit'],
    icon: '⏱️',
    connector: 'Temporal',
    color: 'from-gray-400 to-gray-600',
  },
  conditional_router: {
    name: 'Conditional Router',
    category: 'Logic',
    description: 'Route workflow based on email response quality (complete/partial/gibberish)',
    required_params: ['condition_field', 'operator', 'condition_value'],
    optional_params: ['true_branch', 'false_branch'],
    icon: '🔀',
    connector: 'Temporal',
    color: 'from-yellow-500 to-orange-500',
  },

  // TRIGGERS
  check_database_trigger: {
    name: 'Database Trigger',
    category: 'Triggers',
    description: 'Monitor FourKites database for late deliveries requiring notification',
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
  securityWarning?: string;
}

interface Props {
  onClose: () => void;
  onWorkflowGenerated: (workflow: any) => void;
}

export function FourKitesWorkflowBuilderV2({ onClose, onWorkflowGenerated }: Props) {
  const router = useRouter();
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
  const [detectedActions, setDetectedActions] = useState<string[]>([]); // Track all detected actions
  const [selectedActionFilter, setSelectedActionFilter] = useState<string | null>(null); // Filter for action legend
  const [selectedNode, setSelectedNode] = useState<string | null>(null); // Selected node for configuration
  const [showActionsModal, setShowActionsModal] = useState(false); // Show detected actions modal
  const [collectedParams, setCollectedParams] = useState<Record<string, Record<string, any>>>({}); // Collected workflow parameters
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false); // Track workflow execution state

  // Chat history state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  // Email template selector state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EmailTemplate['category'] | 'All'>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Orchestration config state
  const [showOrchestrationConfig, setShowOrchestrationConfig] = useState(false);
  const [selectedOrchestrationConfig, setSelectedOrchestrationConfig] = useState<OrchestrationConfig | null>(null);

  // Trigger builder state
  const [showTriggerBuilder, setShowTriggerBuilder] = useState(false);
  const [workflowTriggers, setWorkflowTriggers] = useState<WorkflowTrigger[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save chat session to database
  useEffect(() => {
    const saveSession = async () => {
      if (messages.length <= 1) return; // Don't save initial welcome message only

      try {
        await chatHistoryDB.init();

        // Generate title from first user message
        const firstUserMessage = messages.find(m => m.role === 'user');
        const title = firstUserMessage
          ? firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '')
          : 'New Workflow';

        const session: ChatSession = {
          id: currentSessionId || sessionId,
          title,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: Date.now(),
          })),
          detectedActions,
          workflowId: workflowSteps.length > 0 ? generateWorkflowJSON().id : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isCompleted: isSessionCompleted,
        };

        await chatHistoryDB.saveSession(session);
      } catch (error) {
        console.error('Failed to save chat session:', error);
      }
    };

    saveSession();
  }, [messages, detectedActions, workflowSteps, isSessionCompleted]);

  // Convert detected actions into React Flow nodes and edges (simple preview during chat)
  const { nodes: previewNodes, edges: previewEdges } = useMemo(() => {
    if (detectedActions.length === 0) {
      return { nodes: [], edges: [] };
    }

    const flowNodes: Node[] = detectedActions.map((actionId, index) => {
      const actionDef = ACTION_CATALOG[actionId];
      return {
        id: actionId,
        position: { x: 250, y: index * 100 + 50 },
        data: {
          label: (
            <div className="flex items-center gap-2">
              <span className="text-lg">{actionDef?.icon || '⚡'}</span>
              <div>
                <div className="font-semibold text-sm">{actionDef?.name || actionId}</div>
                <div className="text-xs text-gray-500">{actionDef?.connector || 'FourKites'}</div>
              </div>
            </div>
          ),
        },
        style: {
          background: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '12px 16px',
          width: 280,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
        },
      };
    });

    const flowEdges: Edge[] = detectedActions.slice(0, -1).map((actionId, index) => {
      return {
        id: `e-${actionId}-${detectedActions[index + 1]}`,
        source: actionId,
        target: detectedActions[index + 1],
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [detectedActions]);

  // Convert approved workflow steps into editable React Flow nodes (compact style like manual builder)
  const { nodes: editableNodes, edges: editableEdges } = useMemo(() => {
    if (workflowSteps.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Filter nodes if action filter is selected
    const filteredSteps = selectedActionFilter
      ? workflowSteps.filter(step => step.actionId === selectedActionFilter)
      : workflowSteps;

    // Position nodes with branching support for parse_email_response and conditional_router
    let currentX = 100;
    let currentY = 200;
    const nodePositions: Record<string, { x: number; y: number }> = {};

    filteredSteps.forEach((step, index) => {
      const stepId = step.actionId || `step-${index}`;

      // Check if previous step was a branching action (parse_email_response or conditional_router)
      if (index > 0) {
        const prevStep = filteredSteps[index - 1];
        if (prevStep.actionId === 'parse_email_response' || prevStep.actionId === 'conditional_router') {
          // Position this node in a branch (vertically offset)
          const branchIndex = index - (filteredSteps.findIndex(s => s.actionId === prevStep.actionId) + 1);
          currentY = 100 + (branchIndex * 200); // Fan out vertically
        }
      }

      nodePositions[stepId] = { x: currentX, y: currentY };

      // Move to next horizontal position for next node
      const isBranchingAction = step.actionId === 'parse_email_response' || step.actionId === 'conditional_router';
      if (!isBranchingAction) {
        currentX += 320;
      } else {
        // After branching action, branches will fan out vertically
        currentX += 450;
        currentY = 100; // Reset Y for first branch
      }
    });

    const flowNodes: Node[] = filteredSteps.map((step, index) => {
      const actionDef = ACTION_CATALOG[step.actionId || ''];
      const isConfigured = false; // TODO: Check if all required params are filled
      const stepId = step.actionId || `step-${index}`;
      const position = nodePositions[stepId] || { x: 100 + (index * 300), y: 200 };

      return {
        id: stepId,
        position,
        data: {
          label: (
            <div
              className="w-full cursor-pointer"
              onClick={() => setSelectedNode(stepId)}
            >
              {/* Compact Node - Similar to Manual Builder */}
              <div className="flex flex-col items-center gap-2">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    actionDef?.color || 'from-gray-400 to-gray-500'
                  } flex items-center justify-center text-2xl shadow-md`}
                >
                  {step.icon || '⚡'}
                </div>

                {/* Title */}
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 mb-0.5">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.actionId}
                  </div>
                </div>

                {/* Not Configured Warning */}
                {!isConfigured && (
                  <div className="flex items-center gap-1 text-orange-600 text-xs">
                    <span className="text-base">⚠️</span>
                    <span className="font-medium">Not configured</span>
                  </div>
                )}
              </div>
            </div>
          ),
        },
        style: {
          background: 'white',
          border: selectedNode === stepId
            ? '3px solid #3b82f6'
            : '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '16px',
          width: 200,
          boxShadow: selectedNode === stepId
            ? '0 8px 24px rgba(59, 130, 246, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      };
    });

    // Build edges with conditional branching support
    const flowEdges: Edge[] = [];

    filteredSteps.forEach((step, index) => {
      if (index >= filteredSteps.length - 1) return;

      const currentStepId = step.actionId || `step-${index}`;
      const nextStep = filteredSteps[index + 1];
      const nextStepId = nextStep.actionId || `step-${index + 1}`;

      // Check if current step is a branching action (parse_email_response or conditional_router)
      const isBranchingAction = step.actionId === 'parse_email_response' || step.actionId === 'conditional_router';

      if (isBranchingAction) {
        // Create multiple branches from this action
        // Find the next few steps as branches
        const branches: Array<{ stepId: string; label: string; color: string; icon: string }> = [];

        // Collect up to 3 next steps as branches
        for (let i = 1; i <= 3 && index + i < filteredSteps.length; i++) {
          const branchStep = filteredSteps[index + i];
          const branchStepId = branchStep.actionId || `step-${index + i}`;

          let label = '';
          let color = '#3b82f6';
          let icon = '';

          if (i === 1) {
            label = '✓ Complete Data';
            color = '#10b981'; // green
            icon = '✓';
          } else if (i === 2) {
            label = 'Partial Data';
            color = '#f59e0b'; // orange
            icon = '📧';
          } else if (i === 3) {
            label = '✗ Gibberish/None';
            color = '#ef4444'; // red
            icon = '⚠️';
          }

          branches.push({ stepId: branchStepId, label, color, icon });
        }

        // Create edges for each branch
        branches.forEach((branch) => {
          flowEdges.push({
            id: `e-${currentStepId}-${branch.stepId}`,
            source: currentStepId,
            target: branch.stepId,
            animated: true,
            type: 'smoothstep',
            label: branch.label,
            labelStyle: { fill: branch.color, fontWeight: 700, fontSize: 13 },
            labelBgStyle: { fill: 'white', fillOpacity: 0.95 },
            labelBgPadding: [8, 4] as [number, number],
            labelBgBorderRadius: 4,
            style: { stroke: branch.color, strokeWidth: 3 },
            markerEnd: {
              type: 'arrowclosed',
              color: branch.color,
            },
          });
        });

        // Skip creating regular edge after branching action
        return;
      }

      // Check if previous step was a branching action (don't create edge if already branched)
      if (index > 0) {
        const prevStep = filteredSteps[index - 1];
        if (prevStep.actionId === 'parse_email_response' || prevStep.actionId === 'conditional_router') {
          // Already handled by conditional branching above
          return;
        }
      }

      // Regular sequential edge
      flowEdges.push({
        id: `e-${currentStepId}-${nextStepId}`,
        source: currentStepId,
        target: nextStepId,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          color: '#3b82f6',
        },
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflowSteps, selectedActionFilter, selectedNode]);

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

      // Check for security warnings
      const hasSecurityWarning = data.status === 'blocked' || data.security_warning;
      const securityWarning = data.security_warning;

      // Check if the agent detected actions
      const hasDetectedActions = data.detected_actions && Array.isArray(data.detected_actions) && data.detected_actions.length > 0;

      // Update detected actions for visualization (accumulate all detected actions)
      if (hasDetectedActions) {
        setDetectedActions((prev) => {
          // Add new actions that aren't already in the list
          const newActions = data.detected_actions.filter((actionId: string) => !prev.includes(actionId));
          return [...prev, ...newActions];
        });
      }

      // Update collected parameters
      if (data.collected_params) {
        setCollectedParams(data.collected_params);
      }

      // Check if message suggests approval (only when AI presents the COMPLETE plan)
      const suggestsApproval =
        agentMessage.toLowerCase().includes('does this workflow look good') ||
        agentMessage.toLowerCase().includes('does this look good') ||
        (agentMessage.toLowerCase().includes('here\'s the') &&
         agentMessage.toLowerCase().includes('workflow') &&
         agentMessage.toLowerCase().includes('i\'ll create'));

      // ONLY build workflow proposal when AI explicitly asks for approval
      let workflowProposal: WorkflowStep[] | undefined;
      if (hasDetectedActions && suggestsApproval) {
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

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: agentMessage,
          workflowProposal: workflowProposal ? { steps: workflowProposal } : undefined,
          showApproveButton: suggestsApproval && hasDetectedActions,
          securityWarning: hasSecurityWarning ? securityWarning : undefined,
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

  const generateWorkflowJSON = () => {
    // Generate proper Temporal workflow JSON (same format as manual builder)
    const workflowNodes = detectedActions.map((actionId, index) => {
      const params = collectedParams[actionId] || {};

      // Determine next nodes based on action type
      let nextNodes: string[] = [];

      if (index < detectedActions.length - 1) {
        const nextActionId = detectedActions[index + 1];

        // Handle branching for parse_email_response
        if (actionId === 'parse_email_response') {
          // Create branches to next 3 actions (or whatever is available)
          const remainingActions = detectedActions.slice(index + 1);
          nextNodes = remainingActions.slice(0, 3).map(aid => `node-${detectedActions.indexOf(aid) + 1}`);
        } else {
          nextNodes = [`node-${index + 2}`];
        }
      }

      return {
        id: `node-${index + 1}`,
        type: index === 0 ? 'trigger' : 'action',
        activity: actionId,
        params,
        next: nextNodes,
      };
    });

    return {
      id: `workflow-${Date.now()}`,
      name: `AI Generated Workflow - ${new Date().toLocaleString()}`,
      config: {
        task_queue: 'fourkites-workflow-queue',
      },
      nodes: workflowNodes,
    };
  };

  const handleApproveWorkflow = async (steps: WorkflowStep[]) => {
    const activeSteps = steps.map((step, index) => ({
      ...step,
      status: index === 0 ? ('active' as const) : ('pending' as const),
    }));
    setWorkflowSteps(activeSteps);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '✅ **Workflow approved!** Generating workflow and executing in Temporal...',
      },
    ]);

    // Generate and execute workflow
    try {
      setIsExecutingWorkflow(true);

      const workflowJSON = generateWorkflowJSON();
      console.log('Generated Workflow JSON:', workflowJSON);

      // Execute workflow using the same API as manual builder
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_API_URL}/api/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowJSON),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to execute workflow');
      }

      const result = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `🎉 **Workflow executed successfully!**\n\n**Workflow ID:** \`${result.workflow_id}\`\n**Run ID:** \`${result.run_id}\`\n\n---\n\n### 🔗 Monitor Workflow Execution\n\n<a href="http://localhost:8233/namespaces/default/workflows/${result.workflow_id}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">\n  📊 Open Temporal UI\n</a>\n\n**Tip:** Click above to view real-time workflow execution, activity history, and logs.`,
        },
      ]);

      // Mark session as completed
      setIsSessionCompleted(true);
    } catch (error: any) {
      console.error('Workflow execution failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Workflow execution failed:** ${error.message}\n\nThe flow is still displayed on the right for manual configuration.`,
        },
      ]);
    } finally {
      setIsExecutingWorkflow(false);
    }
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

  // Chat history handlers
  const handleSelectSession = async (sessionId: string) => {
    try {
      await chatHistoryDB.init();
      const session = await chatHistoryDB.getSession(sessionId);

      if (session) {
        // Restore session state
        setCurrentSessionId(session.id);
        setMessages(session.messages.map(m => ({
          role: m.role,
          content: m.content,
        })));
        setDetectedActions(session.detectedActions);
        setIsSessionCompleted(session.isCompleted);

        // Clear workflow steps if not completed
        if (!session.isCompleted) {
          setWorkflowSteps([]);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleNewChat = () => {
    // Mark current session as completed if it has content
    if (messages.length > 1) {
      setIsSessionCompleted(true);
    }

    // Create new session
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newSessionId);
    setMessages([
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
    setDetectedActions([]);
    setWorkflowSteps([]);
    setCollectedParams({});
    setIsSessionCompleted(false);
    setShowQuickPrompts(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatHistoryDB.deleteSession(sessionId);

      // If deleting current session, create new one
      if (sessionId === currentSessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Back and Home Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 group"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 group"
              title="Go to home"
            >
              <Home className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Home</span>
            </button>
          </div>

          {/* Separator */}
          <div className="h-8 w-px bg-gray-300" />

          {/* Logo and Title */}
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
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        {/* MIDDLE PANEL - Chat with Stepper */}
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
                  {/* Security Warning Banner - Only for dangerous threats */}
                  {message.securityWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">🚨</span>
                        <div>
                          <div className="font-bold text-sm text-red-800 mb-1">Security Guardrail Detected</div>
                          <div className="text-sm text-red-700">{message.securityWarning}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}

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

                  {/* Workflow Progress Indicator - Only show after first exchange and NOT when showing approval */}
                  {message.role === 'assistant' && detectedActions.length > 0 && !message.showApproveButton && index > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 inline-flex"
                    >
                      <button
                        onClick={() => setShowActionsModal(true)}
                        className="group relative flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                      >
                        {/* Clean Professional Icon */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          {/* Soft glow background */}
                          <motion.div
                            className="absolute inset-0 bg-blue-400/20 blur-lg rounded-lg"
                            animate={{
                              opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />

                          {/* Main icon with gentle fade */}
                          <motion.div
                            className="relative"
                            animate={{
                              opacity: [0.85, 1, 0.85],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-blue-100">
                              <img src="/fk_icon.svg" alt="FourKites" className="w-6 h-6" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Progress Info */}
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-px bg-blue-200" />
                          <div className="text-left">
                            <div className="text-xs font-semibold text-blue-900">
                              {detectedActions.length} Action{detectedActions.length > 1 ? 's' : ''} Detected
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              Click to view details
                            </div>
                          </div>
                        </div>

                        {/* Click Indicator */}
                        <div className="ml-2">
                          <ChevronRight className="w-4 h-4 text-blue-500" />
                        </div>
                      </button>
                    </motion.div>
                  )}

                  {/* Workflow Plan - ONLY show when AI explicitly asks for approval */}
                  {message.workflowProposal && message.showApproveButton && (
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
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors text-gray-900"
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
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {workflowSteps.length > 0 ? 'Workflow Editor' : 'Detected Actions'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {workflowSteps.length > 0
                    ? 'Click any node to edit parameters • Drag to rearrange'
                    : detectedActions.length === 0
                    ? 'Start chatting to detect workflow actions'
                    : `${detectedActions.length} action${detectedActions.length > 1 ? 's' : ''} identified • Continue chatting to collect parameters`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Triggers Button */}
                <button
                  onClick={() => setShowTriggerBuilder(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 text-green-700 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                  title="Workflow Triggers"
                >
                  <Zap className="w-4 h-4" />
                  <span>Triggers</span>
                  {workflowTriggers.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-600 text-white rounded-full text-xs font-bold">
                      {workflowTriggers.length}
                    </span>
                  )}
                </button>

                {/* Orchestration Config Button */}
                <button
                  onClick={() => setShowOrchestrationConfig(!showOrchestrationConfig)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-2 border-indigo-200 text-indigo-700 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                  title="Orchestration & Escalation Config"
                >
                  <Settings className="w-4 h-4" />
                  <span>Config</span>
                  {showOrchestrationConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Email Templates Button */}
                <button
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                  title="Email Templates"
                >
                  <Mail className="w-4 h-4" />
                  <span>Templates</span>
                  {showTemplateSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {workflowSteps.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 text-sm font-bold rounded-lg border-2 border-green-200 shadow-sm">
                    <Check className="w-4 h-4" />
                    Workflow Approved
                  </div>
                ) : detectedActions.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border-2 border-blue-200 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    Collecting Info...
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Email Template Selector Panel */}
          <AnimatePresence>
            {showTemplateSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border-b-2 border-gray-200 overflow-hidden"
              >
                <div className="max-h-[400px] overflow-y-auto p-4">
                  {/* Category Filter */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Email Templates
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          selectedCategory === 'All'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All ({EMAIL_TEMPLATES.length})
                      </button>
                      {(['Delivery', 'BOL', 'Escalation', 'Follow-up', 'General'] as EmailTemplate['category'][]).map((category) => {
                        const count = getTemplatesByCategory(category).length;
                        return (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              selectedCategory === category
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {category} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Template Cards */}
                  <div className="space-y-2">
                    {(selectedCategory === 'All'
                      ? EMAIL_TEMPLATES
                      : getTemplatesByCategory(selectedCategory)
                    ).map((template) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg p-3 border-2 border-gray-200 hover:border-purple-300 transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplatePreview(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
                            {template.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                {template.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium">{template.variables.length} variables</span>
                              <span>•</span>
                              <span className="truncate">{template.variables.slice(0, 3).map(v => `{${v}}`).join(', ')}</span>
                            </div>
                          </div>

                          {/* Use Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template);
                              setShowTemplatePreview(true);
                            }}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-purple-700 flex-shrink-0"
                          >
                            View
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parameter Collection Progress Panel */}
          {detectedActions.length > 0 && workflowSteps.length === 0 && (
            <div className="max-h-[300px] overflow-y-auto bg-white border-b-2 border-gray-200">
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Parameter Collection Progress
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">AI is collecting required information from your conversation</p>
                </div>

                <div className="space-y-3">
                  {detectedActions.map((actionId, index) => {
                    const actionDef = ACTION_CATALOG[actionId];
                    const params = collectedParams[actionId] || {};
                    const requiredParams = actionDef?.required_params || [];
                    const optionalParams = actionDef?.optional_params || [];
                    const collectedRequiredCount = requiredParams.filter(p => params[p]).length;
                    const progress = requiredParams.length > 0
                      ? (collectedRequiredCount / requiredParams.length) * 100
                      : 100; // 100% if no required params

                    return (
                      <motion.div
                        key={actionId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-3 border-2 border-gray-200 hover:border-blue-300 transition-all"
                      >
                        {/* Action Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{actionDef?.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-gray-900">{actionDef?.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-600">{actionDef?.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-blue-600">{collectedRequiredCount}/{requiredParams.length}</span>
                            <div className="text-xs text-gray-500">required</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {requiredParams.length > 0 && (
                          <div className="mb-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full transition-all duration-500 ${
                                  progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Required Parameters */}
                        {requiredParams.length > 0 && (
                          <div className="space-y-1.5 mb-2">
                            <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                              <span>Required:</span>
                            </div>
                            {requiredParams.map((param) => (
                              <div key={param} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border border-gray-200">
                                {params[param] ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    <span className="text-green-700 font-medium">{param.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-600 text-xs truncate ml-auto max-w-[120px]">
                                      {String(params[param]).substring(0, 30)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700">{param.replace(/_/g, ' ')}</span>
                                    <span className="text-orange-600 ml-auto flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Pending
                                    </span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Optional Parameters (show only collected ones) */}
                        {optionalParams.some(p => params[p]) && (
                          <div className="space-y-1.5 pt-2 border-t border-gray-200">
                            <div className="text-xs font-semibold text-blue-600">Optional (collected):</div>
                            {optionalParams.filter(p => params[p]).map((param) => (
                              <div key={param} className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2 border border-blue-200">
                                <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <span className="text-blue-700 font-medium">{param.replace(/_/g, ' ')}</span>
                                <span className="text-gray-600 text-xs truncate ml-auto max-w-[120px]">
                                  {String(params[param]).substring(0, 30)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="mt-3 flex items-center justify-end">
                          {progress === 100 ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Complete
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {Math.round(progress)}% collected
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Overall Progress Summary */}
                {detectedActions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Overall Progress</span>
                      <span className="text-lg font-bold">
                        {(() => {
                          const totalRequired = detectedActions.reduce((sum, actionId) => {
                            const actionDef = ACTION_CATALOG[actionId];
                            return sum + (actionDef?.required_params?.length || 0);
                          }, 0);
                          const totalCollected = detectedActions.reduce((sum, actionId) => {
                            const params = collectedParams[actionId] || {};
                            const actionDef = ACTION_CATALOG[actionId];
                            const requiredParams = actionDef?.required_params || [];
                            return sum + requiredParams.filter(p => params[p]).length;
                          }, 0);
                          return totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 100;
                        })()}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(() => {
                            const totalRequired = detectedActions.reduce((sum, actionId) => {
                              const actionDef = ACTION_CATALOG[actionId];
                              return sum + (actionDef?.required_params?.length || 0);
                            }, 0);
                            const totalCollected = detectedActions.reduce((sum, actionId) => {
                              const params = collectedParams[actionId] || {};
                              const actionDef = ACTION_CATALOG[actionId];
                              const requiredParams = actionDef?.required_params || [];
                              return sum + requiredParams.filter(p => params[p]).length;
                            }, 0);
                            return totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 100;
                          })()}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs text-white/80 mt-2">
                      Continue chatting to provide remaining information
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* React Flow Canvas */}
          <div className="flex-1 relative overflow-hidden">
            {workflowSteps.length === 0 ? (
              // BEFORE APPROVAL: Show animated workflow building state
              <div className="h-full flex items-center justify-center p-8">
                {detectedActions.length === 0 ? (
                  // No actions detected yet
                  <div className="text-center max-w-md">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No actions detected yet</h3>
                    <p className="text-sm text-gray-600">
                      Start chatting with the AI to build your workflow!
                    </p>
                  </div>
                ) : (
                  // Professional animated workflow building state
                  <div className="text-center max-w-2xl px-8">
                    {/* Clean, minimal animation container */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      {/* Glassmorphism card with subtle glow */}
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 0 0 rgba(59, 130, 246, 0)',
                            '0 0 40px 0 rgba(59, 130, 246, 0.1)',
                            '0 0 0 0 rgba(59, 130, 246, 0)',
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-12 shadow-xl"
                      >
                        {/* Subtle gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 rounded-3xl" />

                        {/* Content */}
                        <div className="relative z-10">
                          {/* FourKites Icon with gentle fade */}
                          <motion.div
                            animate={{
                              opacity: [0.8, 1, 0.8],
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="flex justify-center mb-8"
                          >
                            <div className="relative">
                              {/* Soft glow behind icon */}
                              <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full scale-110" />

                              {/* Icon container */}
                              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-lg flex items-center justify-center">
                                <img src="/fk_icon.svg" alt="FourKites" className="w-14 h-14" />
                              </div>
                            </div>
                          </motion.div>

                          {/* Status text */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Building Your Workflow...
                          </h3>

                          <p className="text-base text-gray-600 mb-8">
                            {detectedActions.length} action{detectedActions.length > 1 ? 's' : ''} detected • Continue chatting to configure parameters
                          </p>

                          {/* Action badges - clean horizontal list */}
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            {detectedActions.slice(0, 6).map((actionId, idx) => {
                              const actionDef = ACTION_CATALOG[actionId];
                              return (
                                <motion.div
                                  key={actionId}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    delay: idx * 0.1,
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 20,
                                  }}
                                  className="group relative"
                                >
                                  {/* Subtle hover effect */}
                                  <div className="absolute inset-0 bg-blue-400/0 group-hover:bg-blue-400/10 rounded-xl transition-colors duration-300" />

                                  <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <span className="text-xl">{actionDef?.icon || '⚡'}</span>
                                    <span className="text-sm font-medium text-gray-700">{actionDef?.name || actionId}</span>
                                  </div>
                                </motion.div>
                              );
                            })}

                            {detectedActions.length > 6 && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  delay: 0.6,
                                  type: 'spring',
                                  stiffness: 260,
                                  damping: 20,
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-md"
                              >
                                <span className="text-sm font-bold">+{detectedActions.length - 6} more</span>
                              </motion.div>
                            )}
                          </div>

                          {/* Subtle loading indicator */}
                          <motion.div
                            className="flex items-center justify-center gap-1 mt-8"
                            animate={{
                              opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </motion.div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              // AFTER APPROVAL: Show editable React Flow visualization
              <ReactFlow
                nodes={editableNodes}
                edges={editableEdges}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
              >
                <Background color="#e5e7eb" gap={16} />
                <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
                <MiniMap
                  className="bg-white border border-gray-200 rounded-lg shadow-sm"
                  nodeColor="#3b82f6"
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            )}
          </div>

          {/* Footer Info - Only show after approval */}
          {workflowSteps.length > 0 && (
            <div className="px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Click any node to edit its parameters
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                    {workflowSteps.filter(s => s.status === 'complete').length} Completed
                  </div>
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {workflowSteps.filter(s => s.status === 'active').length} Active
                  </div>
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {workflowSteps.filter(s => s.status === 'pending').length} Pending
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detected Actions Modal */}
        <AnimatePresence>
          {showActionsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowActionsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Detected Actions</h3>
                      <p className="text-xs text-gray-600">{detectedActions.length} action{detectedActions.length > 1 ? 's' : ''} identified for your workflow</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowActionsModal(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                  <div className="space-y-4">
                    {detectedActions.map((actionId, index) => {
                      const actionDef = ACTION_CATALOG[actionId];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          {/* Action Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                                actionDef?.color || 'from-gray-400 to-gray-500'
                              } flex items-center justify-center text-2xl shadow-md flex-shrink-0`}
                            >
                              {actionDef?.icon || '⚡'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-base text-gray-900">
                                  {actionDef?.name || actionId}
                                </h4>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  {actionDef?.category || 'Action'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{actionDef?.description}</p>
                            </div>
                          </div>

                          {/* Required Fields */}
                          {actionDef?.required_params && actionDef.required_params.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-red-600">Required Fields:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {actionDef.required_params.map((param: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700"
                                  >
                                    {param.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Optional Fields */}
                          {actionDef?.optional_params && actionDef.optional_params.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-600">Optional Fields:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {actionDef.optional_params.slice(0, 5).map((param: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
                                  >
                                    {param.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </div>
                                ))}
                                {actionDef.optional_params.length > 5 && (
                                  <div className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                                    +{actionDef.optional_params.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Connector Badge */}
                          {actionDef?.connector && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                <Zap className="w-3 h-3" />
                                {actionDef.connector}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Continue chatting to provide the required information
                  </p>
                  <button
                    onClick={() => setShowActionsModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Builder Modal */}
        <AnimatePresence>
          {showTriggerBuilder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowTriggerBuilder(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden"
              >
                <TriggerBuilder
                  onTriggerCreate={(trigger) => {
                    setWorkflowTriggers([...workflowTriggers, trigger]);
                    setShowTriggerBuilder(false);
                    // Add trigger info to chat
                    let triggerDescription = '';
                    switch (trigger.type) {
                      case 'scheduled':
                        triggerDescription = `scheduled trigger (${trigger.schedule})`;
                        break;
                      case 'email':
                        triggerDescription = `email trigger monitoring ${trigger.monitorInbox}`;
                        break;
                      case 'sql_query':
                        triggerDescription = `SQL query trigger on ${trigger.database.database}`;
                        break;
                      case 'manual':
                        triggerDescription = 'manual trigger';
                        break;
                      case 'webhook':
                        triggerDescription = `webhook trigger at ${trigger.endpoint}`;
                        break;
                    }
                    setInputMessage(`Add ${triggerDescription} to workflow${trigger.description ? ': ' + trigger.description : ''}`);
                  }}
                  onClose={() => setShowTriggerBuilder(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orchestration Config Modal */}
        <AnimatePresence>
          {showOrchestrationConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowOrchestrationConfig(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, x: 100 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Orchestration & Escalation Configuration</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Configure parsing rules, escalation logic, and workflow orchestration
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrchestrationConfig(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content - Orchestration Config Panel */}
                <div className="flex-1 overflow-hidden">
                  <OrchestrationConfigPanel
                    onSelectConfig={(config) => {
                      setSelectedOrchestrationConfig(config);
                      // Add selected config info to chat
                      setInputMessage(
                        `Use the "${config.name}" orchestration config: Parse ${config.parsingRules.length} fields, ${config.escalationLevels.length} escalation levels, timeout ${config.orchestration.timeoutHours}h`
                      );
                    }}
                    onCreateCustomConfig={() => {
                      setShowOrchestrationConfig(false);
                      setInputMessage('I want to create a custom orchestration config with specific parsing rules and escalation logic');
                    }}
                  />
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedOrchestrationConfig ? (
                      <span className="font-semibold text-indigo-600">
                        ✓ {selectedOrchestrationConfig.name} selected
                      </span>
                    ) : (
                      <span>Select a configuration template or create a custom one</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOrchestrationConfig(false)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Close
                    </button>
                    {selectedOrchestrationConfig && (
                      <button
                        onClick={() => {
                          setShowOrchestrationConfig(false);
                          // Message already set by onSelectConfig
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Use Configuration
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Preview Modal */}
        <AnimatePresence>
          {showTemplatePreview && selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowTemplatePreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {selectedTemplate.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          {selectedTemplate.category}
                        </span>
                        <span className="text-xs text-gray-600">{selectedTemplate.variables.length} variables</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplatePreview(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>

                  {/* Subject */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Subject Line</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900 font-medium">{selectedTemplate.subject}</p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Email Body</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {selectedTemplate.body}
                      </pre>
                    </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Required Variables</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.variables.map((variable, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 flex items-center gap-2"
                        >
                          <span className="text-purple-600">{'{'}</span>
                          {variable}
                          <span className="text-purple-600">{'}'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    You can mention this template in chat or use it directly
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setInputMessage(`Use the "${selectedTemplate.name}" template`);
                        setShowTemplatePreview(false);
                        setShowTemplateSelector(false);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Use Template
                    </button>
                    <button
                      onClick={() => setShowTemplatePreview(false)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Side Panel (Enhanced with pre-filled values) */}
        {selectedNode && workflowSteps.length > 0 && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-[420px] bg-white border-l-2 border-gray-200 flex flex-col shadow-2xl"
          >
            {/* Panel Header */}
            <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Edit Action</h3>
                    <p className="text-xs text-gray-600">Configure parameters</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Configuration Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const step = workflowSteps.find(s => (s.actionId || `step-${s.stepNumber - 1}`) === selectedNode);
                if (!step) return null;
                const actionDef = ACTION_CATALOG[step.actionId || ''];
                const params = collectedParams[step.actionId || ''] || {};

                return (
                  <div className="space-y-6">
                    {/* Action Info Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
                            actionDef?.color || 'from-gray-400 to-gray-500'
                          } flex items-center justify-center text-3xl shadow-lg`}
                        >
                          {step.icon || '⚡'}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base text-gray-900 mb-1">{step.title}</div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {actionDef?.category || 'Action'}
                            </span>
                            {actionDef?.connector && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {actionDef.connector}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{actionDef?.description}</p>
                    </div>

                    {/* Required Parameters */}
                    {actionDef?.required_params && actionDef.required_params.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-bold text-sm">*</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">Required Parameters</h4>
                        </div>
                        <div className="space-y-4">
                          {actionDef.required_params.map((param: string, idx: number) => (
                            <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all">
                              <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                <span className="text-red-500">●</span>
                                {param.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </label>
                              <input
                                type="text"
                                defaultValue={params[param] || ''}
                                placeholder={`Enter ${param.replace(/_/g, ' ')}`}
                                className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                              />
                              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                <span className="text-blue-500">ℹ️</span>
                                {param === 'recipient_email' && 'Primary recipient email address'}
                                {param === 'facility' && 'Facility name for the shipment'}
                                {param === 'missing_fields' && 'Comma-separated list of missing fields'}
                                {param === 'escalation_recipient' && 'Manager or supervisor email'}
                                {param === 'escalation_level' && 'Escalation level (1, 2, 3)'}
                                {param === 'duration' && 'Duration value (e.g., 48)'}
                                {!['recipient_email', 'facility', 'missing_fields', 'escalation_recipient', 'escalation_level', 'duration'].includes(param) && `Configure ${param.replace(/_/g, ' ')}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Parameters */}
                    {actionDef?.optional_params && actionDef.optional_params.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-sm">?</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">Optional Parameters</h4>
                        </div>
                        <div className="space-y-4">
                          {actionDef.optional_params.slice(0, 3).map((param: string, idx: number) => (
                            <div key={idx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all">
                              <label className="block text-xs font-bold text-gray-700 mb-2">
                                {param.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </label>
                              <input
                                type="text"
                                defaultValue={params[param] || ''}
                                placeholder={`Optional ${param.replace(/_/g, ' ')}`}
                                className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 space-y-2">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
