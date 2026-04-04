export const MAX_ANSWER_CHARACTERS = 300;

export function getMaxTotalAnswerCharacters(questionCount: number) {
  const safeQuestionCount = Math.max(1, questionCount);

  if (safeQuestionCount <= 5) {
    return 1200;
  }

  if (safeQuestionCount <= 10) {
    return 2400;
  }

  return Math.min(safeQuestionCount * 240, 3000);
}
