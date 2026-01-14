
import { Question } from './types';

// Linear Congruential Generator (LCG) for seeded randomness
// This provides a consistent sequence of random numbers based on a seed
const createLCG = (seed: number) => {
  // Constants for LCG (using widely used values)
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296;
  let state = seed;

  return () => {
    state = (a * state + c) % m;
    // Return a float between 0 and 1
    return Math.abs(state / m);
  };
};

export const getQuestionsForVariant = (
  allQuestions: Question[], 
  startId: number, 
  endId: number, 
  variantId: number
): Question[] => {
  // 1. Filter questions for the specific topic (Section)
  const topicQuestions = allQuestions.filter(q => q.id >= startId && q.id <= endId);

  // 2. If Variant 1, return original order and original options
  if (variantId === 1) {
    return topicQuestions.sort((a, b) => a.id - b.id).map(q => ({
        ...q,
        // Ensure options are in original A, B, C, D order by creating a fresh object
        options: { ...q.options } 
    }));
  }

  // 3. If Variant 2-7, Shuffle Questions Order AND Options
  
  // Create a deep-ish clone for shuffling to prevent mutating original data
  let shuffledQuestions = topicQuestions.map(q => ({...q, options: {...q.options}}));

  // Initialize RNG with a seed specific to this variant and section range.
  // Using a larger multiplier helps separate the seeds for adjacent variants.
  const rngOrder = createLCG((variantId * 7919) + (startId * 104729));

  // Fisher-Yates shuffle for Question Order
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(rngOrder() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }

  // Shuffle the OPTIONS for each question
  return shuffledQuestions.map((q) => {
    const correctText = q.options[q.correctAnswer];
    
    const optionsArray = [
      { key: 'A', text: q.options.A },
      { key: 'B', text: q.options.B },
      { key: 'C', text: q.options.C },
      { key: 'D', text: q.options.D },
    ];

    // Seed for options needs to be unique per question + variant
    const rngOptions = createLCG(q.id * variantId * 1234567 + 987654321);

    // Fisher-Yates shuffle for Options
    for (let i = optionsArray.length - 1; i > 0; i--) {
      const j = Math.floor(rngOptions() * (i + 1));
      [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
    }

    const newOptions = {
      A: optionsArray[0].text,
      B: optionsArray[1].text,
      C: optionsArray[2].text,
      D: optionsArray[3].text,
    };

    // Find new key for the correct text
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
