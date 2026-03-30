import type { Difficulty, GeneratedWorksheet, WorksheetLanguage } from "@/lib/worksheet/types";
import { generateWorksheetWithOpenAI } from "@/lib/openai";

export async function generateWorksheet(
  topic: string,
  difficulty: Difficulty,
  language: WorksheetLanguage
): Promise<GeneratedWorksheet> {
  return generateWorksheetWithOpenAI(topic, difficulty, language);
}
