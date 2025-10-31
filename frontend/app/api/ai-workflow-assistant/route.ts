import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ACTION_BLOCKS } from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const { requirement, availableBlocks } = await request.json();

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'AI assistant not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build available blocks description for AI
    const blocksDescription = availableBlocks
      .map((blockId: string) => {
        const block = ACTION_BLOCKS[blockId];
        if (!block) return null;
        return `- ${blockId}: ${block.name} - ${block.description} (Category: ${block.category})`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `You are an expert workflow automation assistant. Analyze the user's requirement and build a complete workflow.

USER REQUIREMENT:
${requirement}

AVAILABLE ACTION BLOCKS:
${blocksDescription}

YOUR TASK:
1. Identify the most relevant action blocks for this workflow
2. Design a complete workflow with proper sequencing
3. Add conditional routing where needed (using edge labels)
4. Return a JSON response with this exact structure:

{
  "name": "Workflow Name (concise, max 6 words)",
  "description": "Brief description of what this workflow does",
  "recommendedBlocks": ["block_id_1", "block_id_2", ...],
  "nodes": [
    {
      "id": "node-1",
      "type": "action",
      "activity": "send_email_level1_real",
      "label": "Send Initial Email",
      "position": {"x": 100, "y": 300},
      "params": {
        "recipient_email": "user@example.com",
        "facility": "Example Facility"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "node-1",
      "target": "node-2"
    }
  ],
  "estimatedTime": "Time estimate (e.g., '1-2 hours')",
  "complexity": "simple|moderate|advanced"
}

IMPORTANT RULES:
1. Use realistic node positions (space them 300px horizontally, vary vertically for branches)
2. For conditional routing, use edge labels: "complete", "partial", "incomplete/gibberish"
3. Always include wait_for_duration before checking responses
4. Use send_test_email_real for testing, send_email_level1_real for production
5. Add log_activity nodes to track workflow progress
6. Merge branches back to a final node when possible
7. Use realistic parameter values
8. recommendedBlocks should be a subset of nodes actually used

RESPOND WITH ONLY THE JSON OBJECT, NO ADDITIONAL TEXT.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const workflow = JSON.parse(jsonMatch[0]);

    // Validate workflow structure
    if (!workflow.name || !workflow.nodes || !workflow.edges) {
      throw new Error('Invalid workflow structure');
    }

    // Ensure all node IDs are unique
    const nodeIds = workflow.nodes.map((n: any) => n.id);
    const uniqueIds = new Set(nodeIds);
    if (nodeIds.length !== uniqueIds.size) {
      throw new Error('Duplicate node IDs found');
    }

    // Extract recommended blocks from nodes if not provided
    if (!workflow.recommendedBlocks || workflow.recommendedBlocks.length === 0) {
      workflow.recommendedBlocks = Array.from(
        new Set(workflow.nodes.map((n: any) => n.activity))
      );
    }

    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error('AI workflow assistant error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate workflow',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
