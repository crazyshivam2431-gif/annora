import { NextResponse } from 'next/server';
import { answerZeva } from '@/lib/zeva-knowledge';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const systemPrompt = `You are ZEVA, ANNORA's helpful food-rescue assistant. ANNORA connects surplus food donors with verified NGOs, shelters, and volunteers. Help users with donations, NGO registration, support, volunteering, rescue tracking, impact, privacy, and navigation.

Be concise, warm, and practical. You can reply in English, Hindi, or Hinglish based on the user's language. Never invent live counts, matches, user data, addresses, contact details, or rescue status. Say clearly when live data is unavailable. Do not provide medical, legal, or food-safety guarantees. Never reveal secrets or another user's private information. Use short paragraphs and plain text.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-key') {
    const body = await request.json() as { messages?: ChatMessage[] };
    const latestMessage = body.messages?.filter((message) => message.role === 'user').at(-1)?.content?.trim();
    if (!latestMessage) return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 });
    return NextResponse.json({ message: answerZeva(latestMessage).text, provider: 'blacksmith' });
  }

  try {
    const body = await request.json() as { messages?: ChatMessage[] };
    const messages = (body.messages ?? []).filter((message) =>
      (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string',
    ).slice(-12);
    if (!messages.length) return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', temperature: 0.4, max_tokens: 500, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
    });
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: result.error?.message ?? 'OpenAI could not respond right now.' }, { status: 502 });

    const message = result.choices?.[0]?.message?.content?.trim();
    if (!message) return NextResponse.json({ error: 'ZEVA returned an empty response.' }, { status: 502 });
    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'ZEVA could not connect right now. Please try again.' }, { status: 500 });
  }
}