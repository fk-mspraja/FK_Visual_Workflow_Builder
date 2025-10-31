import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { nodes, nodeCount, edgeCount } = await request.json();

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      // Fallback: Generate a simple name without AI
      return NextResponse.json({
        name: `Workflow (${nodeCount} nodes) - ${new Date().toLocaleDateString()}`,
      });
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const prompt = `Generate a concise, professional workflow name (max 6 words) based on this workflow structure:

Nodes: ${nodes}
Node Count: ${nodeCount}
Edge Count: ${edgeCount}

Requirements:
- Maximum 6 words
- Professional and descriptive
- Focus on the main purpose
- Use title case
- Do NOT include dates or version numbers
- Do NOT include emojis

Examples of good names:
- "Email Escalation with Delay Handling"
- "Shipment Tracking Alert System"
- "Customer Notification Workflow"
- "Delivery Confirmation and Follow-up"

Respond with ONLY the workflow name, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const generatedName = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Clean up the name (remove quotes, extra whitespace)
    const cleanName = generatedName.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({
      name: cleanName,
    });
  } catch (error) {
    console.error('Error generating workflow name:', error);

    // Fallback to simple name generation
    return NextResponse.json({
      name: `Custom Workflow - ${new Date().toLocaleDateString()}`,
    });
  }
}
