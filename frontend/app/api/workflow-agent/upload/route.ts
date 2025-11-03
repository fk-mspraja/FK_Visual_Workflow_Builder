import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Session storage for conversation history (shared with chat route)
const conversationStore: Record<string, any[]> = {};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = new URL(request.url).searchParams.get('session_id');

    if (!file || !sessionId) {
      return NextResponse.json(
        { error: 'Missing file or session_id' },
        { status: 400 }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Extract text from document (simplified - in production use proper PDF/DOCX parsers)
    let documentText = fileContent;

    // For now, just use the first 5000 characters
    if (documentText.length > 5000) {
      documentText = documentText.substring(0, 5000) + '\n\n[Document truncated for brevity...]';
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'AI assistant not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Initialize conversation for this session
    if (!conversationStore[sessionId]) {
      conversationStore[sessionId] = [];
    }

    const analysisPrompt = `I've received a requirement document for workflow automation. Please analyze it comprehensively and extract ALL critical information.

DOCUMENT CONTENT:
${documentText}

YOUR TASK - EXTRACT THESE 6 CRITICAL SECTIONS:

**1. MAIN WORKFLOW STEPS**
- What actions need to happen? (send email, wait, check inbox, parse response, etc.)
- What's the sequence? (step 1, step 2, step 3...)
- Are there any conditional branches? (if X then Y, else Z)

**2. NEGATIVE SCENARIOS & ERROR HANDLING (CRITICAL)**
Look for phrases like:
- "What if..."
- "If data is missing..."
- "In case of failure..."
- "If no response..."
- "If API is down..."
Extract: What should happen when things go wrong?

**3. ESCALATION LOGIC (VERY IMPORTANT)**
Look for:
- "Escalate to..."
- "Level 1, Level 2, Level 3"
- "After X hours/days, contact..."
- "Hierarchy: Manager → Director → VP"
- "Final escalation: Create ticket"
Extract:
- How many escalation levels?
- Wait time between levels?
- Who gets escalated at each level?
- What happens if all escalations fail?

**4. ORCHESTRATION LOGIC**
Look for:
- "Sequential" vs "Parallel"
- "Wait for all" vs "Proceed when any"
- "Retry X times"
- "Timeout after Y minutes"
- "Run simultaneously"
Extract:
- Should actions run one-by-one or in parallel?
- Retry logic for failures?
- Timeout values?

**5. REQUIRED PARAMETERS**
Extract all specific values:
- Email addresses (john@company.com)
- Facility names (Chicago, Dallas)
- Wait durations (48 hours, 2 days)
- Phone numbers
- API endpoints

**6. MISSING INFORMATION**
Identify what's NOT specified in the document that you need to ask about.

RESPONSE FORMAT (VERY IMPORTANT):
Provide a structured summary in this format:

"📄 **Document Analysis Complete**

**Main Workflow:**
[Numbered list of steps]

**Error Handling:**
- If [scenario 1] → [action]
- If [scenario 2] → [action]
[If none found: "❓ No error handling specified"]

**Escalation Chain:**
- Level 1: [person/role] (wait [time])
- Level 2: [person/role] (wait [time])
- Final: [fallback action]
[If none found: "❓ No escalation logic specified"]

**Orchestration:**
- Execution: [Sequential/Parallel/Conditional]
- Retry: [X times with Y backoff]
- Timeouts: [Z minutes]
[If none found: "❓ No orchestration rules specified"]

**Collected Parameters:**
- Email: [emails found]
- Facility: [facilities found]
- Duration: [durations found]

**❓ I need clarification on:**
1. [Missing item 1]
2. [Missing item 2]
3. [Missing item 3]"

Be thorough and extract EVERYTHING related to error handling, escalation, and orchestration!`;

    conversationStore[sessionId].push({
      role: 'user',
      content: analysisPrompt
    });

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: conversationStore[sessionId]
    });

    const assistantMessage = aiResponse.content[0].type === 'text'
      ? aiResponse.content[0].text
      : 'I\'ve analyzed your document. Let me help you create a workflow based on these requirements.';

    conversationStore[sessionId].push({
      role: 'assistant',
      content: assistantMessage
    });

    return NextResponse.json({
      status: 'success',
      session_id: sessionId,
      filename: file.name,
      agent_response: assistantMessage,
      document_preview: documentText.substring(0, 500) + (documentText.length > 500 ? '...' : '')
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process document',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
