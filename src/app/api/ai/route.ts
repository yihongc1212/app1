import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AIRequest } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(action: string): string {
  switch (action) {
    case 'summarize':
      return 'You are a helpful writing assistant. Summarize the provided note content concisely, highlighting the key points and main ideas. Format your response in a clear, readable way.';
    case 'improve':
      return 'You are an expert editor and writing coach. Improve the writing quality of the provided text while preserving the author\'s voice and intent. Fix grammar, clarity, flow, and style. Provide the improved version directly without commentary.';
    case 'generate-title':
      return 'You are a creative writing assistant. Generate 3-5 compelling, concise title suggestions for the provided note content. Return only the titles, one per line, without numbering or extra formatting.';
    case 'continue':
      return 'You are a creative writing assistant. Continue writing from where the provided text ends, matching the style, tone, and content direction. Write naturally as if you are the original author continuing their work.';
    case 'chat':
      return 'You are a helpful assistant that answers questions about the provided note content. Be concise, accurate, and helpful. If a question cannot be answered from the note content alone, say so clearly.';
    default:
      return 'You are a helpful writing assistant.';
  }
}

function buildUserMessage(request: AIRequest): string {
  const { action, noteTitle, noteContent, message } = request;

  const noteContext = noteTitle
    ? `Note Title: ${noteTitle}\n\nNote Content:\n${noteContent}`
    : `Note Content:\n${noteContent}`;

  switch (action) {
    case 'summarize':
      return `Please summarize this note:\n\n${noteContext}`;
    case 'improve':
      return `Please improve the writing in this note:\n\n${noteContext}`;
    case 'generate-title':
      return `Please suggest titles for this note:\n\n${noteContext}`;
    case 'continue':
      return `Please continue writing from where this note ends:\n\n${noteContext}`;
    case 'chat':
      return `Note for context:\n${noteContext}\n\nUser question: ${message}`;
    default:
      return noteContext;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    const { action, noteContent, noteTitle, message, chatHistory } = body;

    if (!noteContent && action !== 'chat') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(action);
    const userMessage = buildUserMessage(body);

    // Build messages array
    type MessageParam = { role: 'user' | 'assistant'; content: string };
    const messages: MessageParam[] = [];

    // Add chat history for chat action
    if (action === 'chat' && chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    // Create streaming response
    // Note: using thinking type "enabled" with budget_tokens for extended reasoning
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      thinking: { type: 'enabled', budget_tokens: 10000 },
      system: systemPrompt,
      messages,
    });

    // Return a streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = encoder.encode(event.delta.text);
              controller.enqueue(chunk);
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('AI API error:', error);
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
