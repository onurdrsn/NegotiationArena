export const ROUND_WEIGHTS = [0.25, 0.35, 0.40];

export function calculateFinalScore(roundScores: number[]): number {
  const weighted = roundScores.reduce((acc, score, i) => {
    return acc + score * ROUND_WEIGHTS[i];
  }, 0);

  const allSuccess = roundScores.every(s => s >= 60);
  const bonus = allSuccess ? 10 : 0;

  return Math.min(100, Math.round(weighted + bonus));
}

export function getOutcome(finalScore: number): 'success' | 'partial' | 'failure' {
  if (finalScore >= 70) return 'success';
  if (finalScore >= 40) return 'partial';
  return 'failure';
}

export function buildScoringPrompt(userMessage: string, context: string): string {
  return `Sen bir müzakere koçusun. Kullanıcının aşağıdaki mesajını değerlendir.

Bağlam: ${context}
Kullanıcı mesajı: "${userMessage}"

Şu kriterlere göre 0-100 arası puan ver:
- Empati ve ton uyumu (25p)
- Argüman gücü ve somutluk (35p)
- Kısa ve net olma (20p)
- Stratejik zeka (20p)

SADECE JSON döndür, başka hiçbir şey yazma:
{"score": <number>, "feedback": "<max 15 kelime Türkçe geri bildirim>"}`;
}
