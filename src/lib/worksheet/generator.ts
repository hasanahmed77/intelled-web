import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";
import { generateWorksheetWithOllama } from "@/lib/ollama";

export async function generateWorksheet(
  topic: string,
  difficulty: Difficulty
): Promise<GeneratedWorksheet> {
  return generateWorksheetWithOllama(topic, difficulty);
}
