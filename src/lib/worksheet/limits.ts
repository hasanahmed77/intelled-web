export const MAX_ANSWER_CHARACTERS = 600;

export function getMaxTotalAnswerCharacters(questionCount: number) {
  return Math.max(1, questionCount) * MAX_ANSWER_CHARACTERS;
}
