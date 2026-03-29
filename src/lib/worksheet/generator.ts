import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";
import { generateWorksheetWithOpenAI } from "@/lib/openai";

export async function generateWorksheet(
  topic: string,
  difficulty: Difficulty
): Promise<GeneratedWorksheet> {
  return generateWorksheetWithOpenAI(topic, difficulty);
}
