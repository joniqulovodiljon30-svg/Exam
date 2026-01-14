
import { Question } from './types';

// Simple seeded random number generator to ensure consistency
// This ensures that for a specific question ID, the shuffle is always the same
const seededRandom = (seed: number) => {
  let t = seed + 0x6D2B79F5;
  return () => {
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const shuffleQuestions = (questions: Question[]): Question[] => {
  return questions.map((q) => {
    // Get the text of the correct answer before shuffling
    const correctText = q.options[q.correctAnswer];

    // Create an array of options to shuffle
    const optionsArray = [
      { key: 'A', text: q.options.A },
      { key: 'B', text: q.options.B },
      { key: 'C', text: q.options.C },
      { key: 'D', text: q.options.D },
    ];

    // Shuffle options using the question ID as a seed
    const rng = seededRandom(q.id * 12345);
    for (let i = optionsArray.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
    }

    // Assign new keys (A, B, C, D) based on the new positions
    const newOptions = {
      A: optionsArray[0].text,
      B: optionsArray[1].text,
      C: optionsArray[2].text,
      D: optionsArray[3].text,
    };

    // Find where the correct answer moved to
    let newCorrectAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
    optionsArray.forEach((opt, index) => {
      if (opt.text === correctText) {
        if (index === 0) newCorrectAnswer = 'A';
        if (index === 1) newCorrectAnswer = 'B';
        if (index === 2) newCorrectAnswer = 'C';
        if (index === 3) newCorrectAnswer = 'D';
      }
    });

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    };
  });
};
