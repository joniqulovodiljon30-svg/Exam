import React, { useState, useEffect, useMemo } from 'react';
import { SECTIONS, QUESTIONS as RAW_QUESTIONS } from './data';
import { Section, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';
import { getQuestionsForVariant } from './utils';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeVariant, setActiveVariant] = useState<number>(1);
  
  // State key: "sec_{sectionId}_var_{variantId}_q_{questionId}"
  const [allUserAnswers, setAllUserAnswers] = useState<Record<string, UserAnswer>>({});

  const currentExamQuestions = useMemo(() => {
    if (!activeSection) return [];
    return getQuestionsForVariant(
      RAW_QUESTIONS, 
      activeSection.startId, 
      activeSection.endId, 
      activeVariant
    );
  }, [activeSection, activeVariant]);

  // Hozirgi tanlangan variant uchun javoblarni ajratib olish
  const currentVariantAnswers = useMemo(() => {
    const variantAnswers: Record<number, UserAnswer> = {};
    if (!activeSection) return variantAnswers;

    const prefix = `sec_${activeSection.id}_var_${activeVariant}_q_`;
    
    Object.keys(allUserAnswers).forEach(key => {
      if (key.startsWith(prefix)) {
        const questionId = parseInt(key.replace(prefix, ''));
        variantAnswers[questionId] = allUserAnswers[key];
      }
    });
    
    return variantAnswers;
  }, [allUserAnswers, activeSection, activeVariant]);

  useEffect(() => {
    const saved = localStorage.getItem('exam_pro_v5');
    if (saved) {
      try {
        setAllUserAnswers(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved progress");
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(allUserAnswers).length > 0) {
      localStorage.setItem('exam_pro_v5', JSON.stringify(allUserAnswers));
    }
  }, [allUserAnswers]);

  const handleSelectSection = (section: Section) => {
    setActiveSection(section);
    setActiveVariant(1);
    setCurrentView('EXAM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVariantSwitch = (variantId: number) => {
    setActiveVariant(variantId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setCurrentView('LANDING');
    setActiveSection(null);
    setActiveVariant(1);
  };

  const handleAnswer = (questionId: number, selected: 'A' | 'B' | 'C' | 'D') => {
    const question = currentExamQuestions.find(q => q.id === questionId);
    if (!question || !activeSection) return;

    const compositeKey = `sec_${activeSection.id}_var_${activeVariant}_q_${questionId}`;

    setAllUserAnswers(prev => ({
      ...prev,
      [compositeKey]: {
        questionId,
        selectedOption: selected,
        isCorrect: selected === question.correctAnswer
      }
    }));
  };

  const clearProgress = () => {
    if (confirm("Haqiqatan ham barcha natijalarni o'chirib tashlamoqchimisiz?")) {
      setAllUserAnswers({});
      localStorage.removeItem('exam_pro_v5');
    }
  };

  // Dashboard uchun progress: Agar biror savol kamida bitta variantda to'g'ri yechilgan bo'lsa
  const dashboardStats = useMemo(() => {
    const stats: Record<number, UserAnswer> = {};
    Object.values(allUserAnswers).forEach(ans => {
      // Bir xil questionId bo'lsa, correct bo'lganini saqlashga harakat qiladi
      if (!stats[ans.questionId] || ans.isCorrect) {
        stats[ans.questionId] = ans;
      }
    });
    return stats;
  }, [allUserAnswers]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogoClick={handleBackToDashboard} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {currentView === 'LANDING' ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                Psixologiya Test Platformasi
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Bo'limni tanlang. Har bir bo'limda 7 xil mustaqil variant mavjud (Sec 1 - Sec 7).
              </p>
              <button 
                onClick={clearProgress}
                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-sm font-bold transition-all"
              >
                Progressni nolga tushirish
              </button>
            </div>

            <SectionSelector 
              sections={SECTIONS} 
              onSelect={handleSelectSection} 
              userAnswers={dashboardStats}
            />
          </div>
        ) : (
          <ExamContainer 
            key={`${activeSection?.id}-${activeVariant}`}
            section={activeSection!} 
            variant={activeVariant}
            questions={currentExamQuestions}
            userAnswers={currentVariantAnswers}
            onAnswer={handleAnswer}
            onBack={handleBackToDashboard}
            onVariantSwitch={handleVariantSwitch}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;