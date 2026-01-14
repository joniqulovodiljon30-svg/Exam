import React, { useState, useEffect, useMemo } from 'react';
import { SECTIONS, QUESTIONS as RAW_QUESTIONS } from './data';
import { Section, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';
import MultiplayerGame from './components/MultiplayerGame';
import { getQuestionsForVariant } from './utils';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeVariant, setActiveVariant] = useState<number>(1);
  
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

  const dashboardStats = useMemo(() => {
    const stats: Record<number, UserAnswer> = {};
    (Object.values(allUserAnswers) as UserAnswer[]).forEach(ans => {
      if (!stats[ans.questionId] || ans.isCorrect) {
        stats[ans.questionId] = ans;
      }
    });
    return stats;
  }, [allUserAnswers]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogoClick={handleBackToDashboard} />

      <main className="flex-grow container mx-auto px-3 py-6 max-w-5xl">
        {currentView === 'LANDING' ? (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                Psixologiya Testlari
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium">
                Bo'limni tanlang. Har bir bo'limda 7 xil mustaqil variant mavjud.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button 
                  onClick={() => setCurrentView('MULTIPLAYER')}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active-press flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Do'stlar bilan o'ynash (Quiz)
                </button>
                <button 
                  onClick={clearProgress}
                  className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all active-press"
                >
                  Progressni tozalash
                </button>
              </div>
            </div>

            <SectionSelector 
              sections={SECTIONS} 
              onSelect={handleSelectSection} 
              userAnswers={dashboardStats}
            />
          </div>
        ) : currentView === 'MULTIPLAYER' ? (
          <MultiplayerGame onBack={handleBackToDashboard} />
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