import { buildScoringPrompt } from './scoring';
import { Env } from '../worker-env';

export async function getCharacterResponse(env: Env, systemPrompt: string, history: { role: 'user'|'assistant', content: string }[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages
  });

  return response.response;
}

export async function scoreRound(env: Env, userMessage: string, context: string): Promise<{ score: number, feedback: string }> {
  try {
    const prompt = buildScoringPrompt(userMessage, context);
    
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.response;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { score: 50, feedback: "Anlaşılamadı" };
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      score: typeof data.score === 'number' ? data.score : 50,
      feedback: data.feedback || "Değerlendirilemedi"
    };
  } catch (error) {
    return { score: 50, feedback: "Sistem hatası" };
  }
}
