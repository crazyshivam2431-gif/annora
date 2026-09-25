import { NextResponse } from 'next/server';
import { answerZeva } from '@/lib/zeva-knowledge';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const systemPrompt = `You are ZEVA, ANNORA's Intelligent Food-Rescue Assistant. Help with donations, verified NGOs, drivers, delivery status, impact, privacy, and ANNORA navigation. Be concise, warm, and practical. Reply in the user's English, Hindi, or Hinglish. Never invent live data or reveal private information. ANNORA is not a food-safety authority.`;

const event = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

export async function POST(request: Request) {
  const body = await request.json() as { messages?: ChatMessage[] };
  const messages = (body.messages ?? []).filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string').slice(-12);
  if (!messages.length) return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 });

  const encoder = new TextEncoder();
  const apiKey = process.env.OPENAI_API_KEY;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!apiKey || apiKey === 'your-openai-key') {
          const fallback = answerZeva(messages.filter((message) => message.role === 'user').at(-1)?.content ?? '').text;
          for (const chunk of fallback.split(/(\s+)/)) controller.enqueue(encoder.encode(event({ delta: chunk })));
          controller.enqueue(encoder.encode(event({ done: true, provider: 'Hacksmiths' })));
          controller.close();
          return;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', temperature: 0.4, max_tokens: 500, stream: true, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
        });
        if (!response.ok || !response.body) throw new Error('ZEVA provider unavailable.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const value = line.slice(6);
            if (value === '[DONE]') continue;
            const parsed = JSON.parse(value) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(event({ delta })));
          }
        }
        controller.enqueue(encoder.encode(event({ done: true, provider: 'openai' })));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(event({ error: error instanceof Error ? error.message : 'ZEVA is temporarily unavailable.' })));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}
