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
  variantId: number,
  limit?: number // New parameter to limit the result count (e.g., 30 out of 200)
): Question[] => {
  // 1. To'g'ri bo'limdagi savollarni ajratish
  let filtered = allQuestions.filter(q => q.id >= startId && q.id <= endId);

  // Determine if this is a "Random Mode" (where range is big but limit is small)
  const isRandomMode = limit && limit < filtered.length;

  // 2. Savollar tartibini aralashtirish
  // Agar Random Mode bo'lsa (Sec 8) yoki Variant != 1 bo'lsa, aralashtiramiz.
  // Sec 1 da odatiy tartib (agar random mode bo'lmasa)
  if (variantId !== 1 || isRandomMode) {
    const questionsToShuffle = filtered.map(q => ({...q}));
    const rngOrder = createLCG((variantId * 77777) + (startId * 123));
    for (let i = questionsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(rngOrder() * (i + 1));
      [questionsToShuffle[i], questionsToShuffle[j]] = [questionsToShuffle[j], questionsToShuffle[i]];
    }
    filtered = questionsToShuffle;
  } else {
    // Sec 1 (va Random Mode EMAS) uchun tartibni saqlaymiz
    filtered = filtered.sort((a, b) => a.id - b.id).map(q => ({...q}));
  }

  // LIMIT LOGIC: Agar limit berilgan bo'lsa va ro'yxat uzunroq bo'lsa, kesib olamiz
  if (limit && filtered.length > limit) {
    filtered = filtered.slice(0, limit);
  }

  // 3. Javob variantlarini aralashtirish (Hamma variantlar uchun)
  return filtered.map((q) => {
    // Variantlar obyektini arrayga o'tkazamiz
    const originalOptions = Object.keys(q.options).map(key => ({
      key,
      text: q.options[key]
    }));

    // To'g'ri javob matnlarini aniqlash (Ko'p tanlovli bo'lishi mumkin)
    const correctKeys = q.correctAnswer.split(''); // ['A', 'B']
    const correctTexts = correctKeys.map(k => q.options[k]);

    // Har bir savol va har bir variant uchun takrorlanmas "seed"
    const seed = (q.id * 1000) + (variantId * 10) + 42;
    const rng = createLCG(seed);

    // Shuffle options array
    for (let i = originalOptions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
    }

    // Yangi variantlar obyektini qurish (A, B, C, D...)
    const newOptions: Record<string, string> = {};
    const baseKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Yetarlicha uzun
    
    originalOptions.forEach((opt, index) => {
      if (index < baseKeys.length) {
        newOptions[baseKeys[index]] = opt.text;
      }
    });

    // To'g'ri javob yangi qayerga ko'chganini aniqlash
    // Yangi kalitlarni topamiz
    let newCorrectString = "";
    
    // Asl matnlar qaysi yangi kalitlarga to'g'ri kelishini topamiz
    correctTexts.forEach(txt => {
       const foundKey = Object.keys(newOptions).find(key => newOptions[key] === txt);
       if (foundKey) {
         newCorrectString += foundKey;
       }
    });

    // Kalitlarni alifbo tartibida saralash (masalan "BA" -> "AB")
    newCorrectString = newCorrectString.split('').sort().join('');

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectString
    };
  });
};