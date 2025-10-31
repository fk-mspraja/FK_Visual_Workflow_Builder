'use client';

/**
 * Natural Language Workflow Builder Component
 * Inspired by Microsoft Workflows (Frontier) UI
 */

import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

interface WorkflowChatBuilderProps {
  onClose?: () => void;
  onWorkflowGenerated?: (workflowJson: any) => void;
}

export function WorkflowChatBuilder({ onClose, onWorkflowGenerated }: WorkflowChatBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Hi! I\'m your AI workflow assistant. I can help you create workflows in three ways:\n\n1. **Upload a requirement document** (Word or PDF)\n2. **Describe your workflow** in plain English\n3. **Answer my questions** to build step-by-step\n\nWhat would you like to do today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workflowPlan, setWorkflowPlan] = useState<any>(null);
  const [showError, setShowError] = useState<string | null>(null);
  const [useMockMode, setUseMockMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { setNodes, setEdges } = useWorkflowStore();

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const addMessage = (role: 'user' | 'agent' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Mock response generator when AI agent is not available
  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('send') && lowerMessage.includes('email')) {
      return `Great! I understand you need an **email workflow**. Let me clarify a few things:

**Questions:**
1. What's the recipient email address?
2. Would you like to add a wait time before checking for responses?
3. What should happen if there's no response? (escalate, send reminder, etc.)

Please provide these details so I can create your workflow.`;
    }

    if (lowerMessage.includes('escalat')) {
      return `I see you need an **escalation workflow**. Here's what I'm thinking:

**Workflow Plan:**
1. 📧 **Send Initial Email** - Send to facility contact
2. ⏱️ **Wait 48 hours** - Give them time to respond
3. 📬 **Check Inbox** - Look for their reply
4. 🤖 **Parse Response (AI)** - Analyze if response is complete
5. 🔀 **Conditional Router** - Route based on response quality:
   - ✅ If complete → End workflow
   - ⚠️ If incomplete → Send follow-up email
   - ❌ If no response → Escalate to manager

Does this look good? Type **"approve"** to generate the workflow!`;
    }

    if (lowerMessage.includes('approve') || lowerMessage.includes('yes') || lowerMessage.includes('looks good')) {
      setWorkflowPlan({ approved: true });
      return `✅ **Perfect!** I'll create this workflow for you now. Click the **"Approve & Generate"** button below to see it on the canvas!`;
    }

    return `I understand you're describing a workflow. To help you better, please provide more details:

- What **action** needs to happen? (send email, check inbox, wait, etc.)
- Who or what is involved?
- Are there any **conditions** or **timeouts**?
- What happens in **negative scenarios**?

Or, if you prefer, use the **Manual Builder** to drag and drop blocks visually!`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(file.type)) {
      setShowError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setShowError(null);

    addMessage('user', `📎 Uploaded: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/workflow-agent/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI agent not available');
      }

      const data = await response.json();
      addMessage('agent', data.agent_response);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUseMockMode(true);
      addMessage('system', `⚠️ The AI agent is currently unavailable. I'll help you with basic workflow building, but for full AI capabilities, please check that the backend server is running.`);
      addMessage('agent', `I can still help you! Please describe what your workflow needs to do, and I'll guide you through creating it manually.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    addMessage('user', userMessage);
    setInputMessage('');
    setIsLoading(true);
    setShowError(null);

    // If in mock mode, use mock responses
    if (useMockMode) {
      setTimeout(() => {
        const mockResponse = generateMockResponse(userMessage);
        addMessage('agent', mockResponse);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/workflow-agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage
        })
      });

      if (!response.ok) {
        throw new Error('AI agent not available');
      }

      const data = await response.json();
      addMessage('agent', data.agent_response);

      // Check if the response contains a workflow plan
      if (data.agent_response.toLowerCase().includes('workflow plan') ||
          data.agent_response.toLowerCase().includes('does this look good') ||
          data.agent_response.toLowerCase().includes('shall i generate')) {
        setWorkflowPlan(data);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setUseMockMode(true);
      addMessage('system', `⚠️ The AI agent is currently unavailable. Switching to basic mode...`);

      // Generate mock response
      setTimeout(() => {
        const mockResponse = generateMockResponse(userMessage);
        addMessage('agent', mockResponse);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWorkflow = async () => {
    setIsLoading(true);
    setShowError(null);

    // If in mock mode, create a sample workflow
    if (useMockMode) {
      setTimeout(() => {
        const sampleWorkflow = {
          nodes: [
            {
              id: 'node-1',
              type: 'workflowNode',
              position: { x: 300, y: 100 },
              data: {
                label: '1. Send Initial Email',
                activity: 'send_email_level1_real',
                icon: '📧',
                gradient: 'from-blue-500 to-cyan-500',
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
                label: '2. Wait 48 Hours',
                activity: 'wait_timer',
                icon: '⏱️',
                gradient: 'from-gray-400 to-gray-600',
                params: { duration: '48', unit: 'hours' },
                configured: true,
                action_count: 0
              }
            },
            {
              id: 'node-3',
              type: 'workflowNode',
              position: { x: 300, y: 400 },
              data: {
                label: '3. Check Email Inbox',
                activity: 'check_gmail_inbox',
                icon: '📬',
                gradient: 'from-indigo-500 to-blue-500',
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

        addMessage('agent', '✅ **Workflow created!** I\'ve added a basic workflow to your canvas. You can now configure each node\'s parameters and add more blocks as needed. Redirecting you to the builder...');

        setTimeout(() => {
          router.push('/builder');
          if (onClose) onClose();
        }, 1500);

        setIsLoading(false);
      }, 1500);
      return;
    }

    // Real API call
    try {
      const response = await fetch(`${API_URL}/api/workflow-agent/generate?session_id=${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();
      const workflowJson = data.workflow_json;

      if (workflowJson.nodes && workflowJson.edges) {
        setNodes(workflowJson.nodes);
        setEdges(workflowJson.edges);

        addMessage('agent', '✅ **Perfect!** I\'ve created your workflow. Redirecting you to the builder...');

        if (onWorkflowGenerated) {
          onWorkflowGenerated(workflowJson);
        }

        setTimeout(() => {
          router.push('/builder');
          if (onClose) onClose();
        }, 1500);
      }

    } catch (error: any) {
      console.error('Generate workflow error:', error);
      setShowError(error.message || 'Failed to generate workflow');
      addMessage('system', `⚠️ Error generating workflow. Please use the Manual Builder instead.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleManualBuilder = () => {
    router.push('/builder?guide=true');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Workflow Builder</h2>
              <p className="text-sm text-blue-100">
                {useMockMode ? 'Basic Mode (Agent Offline)' : 'Powered by Claude Sonnet 4.5'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualBuilder}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-lg transition-all border border-white/20"
            >
              Manual Builder
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {showError && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{showError}</p>
              <p className="text-xs text-red-700 mt-1">You can still use the manual workflow builder.</p>
            </div>
            <button
              onClick={() => setShowError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3 mt-1">
                {message.role === 'agent' ? '🤖' : '⚠️'}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : message.role === 'system'
                  ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                  : 'bg-white text-gray-900 shadow-md border border-gray-100'
              }`}
            >
              <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                message.role === 'user' ? 'prose-invert' : ''
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3 mt-1">
              🤖
            </div>
            <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2 text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Workflow Approval Section */}
      {workflowPlan && !isLoading && (
        <div className="px-8 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white text-xl">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-green-900">Workflow Plan Ready</p>
                <p className="text-xs text-green-700">Review the plan above and approve to generate</p>
              </div>
            </div>
            <button
              onClick={handleApproveWorkflow}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve & Generate
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-8 py-6 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 w-12 h-12 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-gray-200"
            title="Upload document"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your workflow or ask me anything..."
              disabled={isLoading}
              rows={1}
              className="w-full px-5 py-3.5 pr-14 text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {uploadedFile && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Attached:</span>
            <span>{uploadedFile.name}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Press Enter to send • Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
