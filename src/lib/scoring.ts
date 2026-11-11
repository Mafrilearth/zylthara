import { Section } from "@prisma/client";

export interface QuestionAnswerPair {
  question: {
    section: Section;
    answerKey: string;
  };
  choice: string;
}

export interface SectionScoreDetail {
  correct: number;
  total: number;
  scaledScore: number;
}

export interface ITPScoreResult {
  listeningScore: number;
  structureScore: number;
  readingScore: number;
  totalScore: number;
  breakdown: {
    listening: SectionScoreDetail;
    structure: SectionScoreDetail;
    reading: SectionScoreDetail;
  };
}

/**
 * Calculates scaled scores following standard TOEFL ITP conversion principles:
 * - Section 1 (Listening Comprehension): 31 – 68
 * - Section 2 (Structure & Written Expression): 31 – 68
 * - Section 3 (Reading Comprehension): 31 – 67
 * - Total Score = ((Section 1 + Section 2 + Section 3) * 10) / 3 (Range: 310 – 677)
 */
export function calculateITPScores(
  answers: QuestionAnswerPair[],
  totalQuestionsBySection?: Record<Section, number>
): ITPScoreResult {
  let listeningCorrect = 0;
  let structureCorrect = 0;
  let readingCorrect = 0;

  for (const item of answers) {
    const isCorrect = item.choice.trim().toUpperCase() === item.question.answerKey.trim().toUpperCase();
    if (isCorrect) {
      if (item.question.section === "LISTENING") listeningCorrect++;
      else if (item.question.section === "STRUCTURE") structureCorrect++;
      else if (item.question.section === "READING") readingCorrect++;
    }
  }

  // Count totals either from questions array or provided total counts
  const listeningTotal = totalQuestionsBySection?.LISTENING ?? answers.filter(a => a.question.section === "LISTENING").length;
  const structureTotal = totalQuestionsBySection?.STRUCTURE ?? answers.filter(a => a.question.section === "STRUCTURE").length;
  const readingTotal = totalQuestionsBySection?.READING ?? answers.filter(a => a.question.section === "READING").length;

  const scaleSection = (correct: number, total: number, minScaled: number, maxScaled: number): number => {
    if (total <= 0) {
      // Default to baseline minimum scale
      return minScaled;
    }
    const ratio = Math.max(0, Math.min(1, correct / total));
    return Math.round(minScaled + ratio * (maxScaled - minScaled));
  };

  const listeningScore = scaleSection(listeningCorrect, listeningTotal, 31, 68);
  const structureScore = scaleSection(structureCorrect, structureTotal, 31, 68);
  const readingScore = scaleSection(readingCorrect, readingTotal, 31, 67);

  // TOEFL ITP Formula: ((L + S + R) * 10) / 3
  const totalScore = Math.round(((listeningScore + structureScore + readingScore) * 10) / 3);

  return {
    listeningScore,
    structureScore,
    readingScore,
    totalScore,
    breakdown: {
      listening: {
        correct: listeningCorrect,
        total: listeningTotal,
        scaledScore: listeningScore,
      },
      structure: {
        correct: structureCorrect,
        total: structureTotal,
        scaledScore: structureScore,
      },
      reading: {
        correct: readingCorrect,
        total: readingTotal,
        scaledScore: readingScore,
      },
    },
  };
}
