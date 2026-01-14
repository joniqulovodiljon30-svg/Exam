import { Question } from './types';

// Linear Congruential Generator (Seeded Random)
const createLCG = (seed: number) => {
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296;
  let state = seed;

  return () => {
    state = (a * state + c) % m;
    return Math.abs(state / m);
  };
};

export const getQuestionsForVariant = (
  allQuestions: Question[], 
  startId: number, 
  endId: number, 
  variantId: number
): Question[] => {
  // 1. To'g'ri bo'limdagi savollarni ajratish
  let filtered = allQuestions.filter(q => q.id >= startId && q.id <= endId);

  // 2. Savollar tartibini aralashtirish (Sec 1 dan boshqa hamma variantlar uchun)
  if (variantId !== 1) {
    const questionsToShuffle = filtered.map(q => ({...q}));
    const rngOrder = createLCG((variantId * 77777) + (startId * 123));
    for (let i = questionsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(rngOrder() * (i + 1));
      [questionsToShuffle[i], questionsToShuffle[j]] = [questionsToShuffle[j], questionsToShuffle[i]];
    }
    filtered = questionsToShuffle;
  } else {
    // Sec 1 uchun tartibni saqlaymiz, lekin yangi obyekt yaratamiz
    filtered = filtered.sort((a, b) => a.id - b.id).map(q => ({...q}));
  }

  // 3. Javob variantlarini (A, B, C, D) MAJBURIY aralashtirish (Hamma variantlar uchun)
  return filtered.map((q) => {
    const originalOptions = [
      { key: 'A', text: q.options.A },
      { key: 'B', text: q.options.B },
      { key: 'C', text: q.options.C },
      { key: 'D', text: q.options.D },
    ];

    const correctText = q.options[q.correctAnswer];

    // Har bir savol va har bir variant uchun takrorlanmas "seed"
    const seed = (q.id * 1000) + (variantId * 10) + 42;
    const rng = createLCG(seed);

    // Shuffle options array
    for (let i = originalOptions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
    }

    // Yangi variantlar obyektini qurish
    const newOptions = {
      A: originalOptions[0].text,
      B: originalOptions[1].text,
      C: originalOptions[2].text,
      D: originalOptions[3].text,
    };

    // To'g'ri javob yangi qayerga ko'chganini aniqlash
    let newCorrectKey: 'A' | 'B' | 'C' | 'D' = 'A';
    if (originalOptions[0].text === correctText) newCorrectKey = 'A';
    else if (originalOptions[1].text === correctText) newCorrectKey = 'B';
    else if (originalOptions[2].text === correctText) newCorrectKey = 'C';
    else if (originalOptions[3].text === correctText) newCorrectKey = 'D';

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectKey
    };
  });
};