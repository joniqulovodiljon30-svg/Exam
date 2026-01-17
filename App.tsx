import React, { useState, useEffect, useMemo } from 'react';
import { SECTIONS, QUESTIONS as RAW_QUESTIONS } from './data';
import { Section, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';
import MultiplayerGame from './components/MultiplayerGame';
import { getQuestionsForVariant } from './utils';

type AppMode = 'standard' | 'azimxon' | 'islomboy';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeVariant, setActiveVariant] = useState<number>(1);
  const [appMode, setAppMode] = useState<AppMode>('standard');
  
  const [allUserAnswers, setAllUserAnswers] = useState<Record<string, UserAnswer>>({});

  // Initialize state from URL on mount and handle Browser Back Button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const roomId = params.get('room');
      const sectionId = params.get('section');
      const modeParam = params.get('mode');

      // Set Mode
      if (modeParam === 'azimxon') {
        setAppMode('azimxon');
      } else if (modeParam === 'islomboy') {
        setAppMode('islomboy');
      } else {
        setAppMode('standard');
      }
      
      // Set View
      if (roomId) {
        setCurrentView('MULTIPLAYER');
        setActiveSection(null);
      } else if (sectionId) {
        const sec = SECTIONS.find(s => s.id === parseInt(sectionId));
        if (sec) {
          setActiveSection(sec);
          setCurrentView('EXAM');
        } else {
          setCurrentView('LANDING');
          setActiveSection(null);
        }
      } else {
        setCurrentView('LANDING');
        setActiveSection(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentExamQuestions = useMemo(() => {
    if (!activeSection) return [];
    return getQuestionsForVariant(
      RAW_QUESTIONS, 
      activeSection.startId, 
      activeSection.endId, 
      activeVariant,
      activeSection.totalQuestions
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
    const saved = localStorage.getItem('exam_pro_v8_safe');
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
      localStorage.setItem('exam_pro_v8_safe', JSON.stringify(allUserAnswers));
    }
  }, [allUserAnswers]);

  const handleSelectSection = (section: Section) => {
    setActiveSection(section);
    setActiveVariant(1);
    setCurrentView('EXAM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const params = new URLSearchParams(window.location.search);
    params.set('section', section.id.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleVariantSwitch = (variantId: number) => {
    setActiveVariant(variantId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    // If we have history state (meaning we navigated here within the app), use back()
    if (window.history.state && window.history.length > 1) {
      window.history.back();
    } else {
      // Direct link open or no history, force replaceState to landing
      const params = new URLSearchParams(window.location.search);
      params.delete('section');
      params.delete('room');
      // Keep mode
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      
      setCurrentView('LANDING');
      setActiveSection(null);
      setActiveVariant(1);
    }
  };

  const cycleAppMode = () => {
    let newMode: AppMode = 'standard';
    if (appMode === 'standard') newMode = 'azimxon';
    else if (appMode === 'azimxon') newMode = 'islomboy';
    else newMode = 'standard';

    setAppMode(newMode);
    
    const params = new URLSearchParams(window.location.search);
    if (newMode === 'standard') {
      params.delete('mode');
    } else {
      params.set('mode', newMode);
    }
    
    // Clear section if switching modes
    params.delete('section');
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    setCurrentView('LANDING');
    setActiveSection(null);
  };

  const handleStartMultiplayer = () => {
    setCurrentView('MULTIPLAYER');
  };

  const handleAnswer = (questionId: number, selected: string) => {
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
      localStorage.removeItem('exam_pro_v8_safe');
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

  // Filter sections based on mode
  const displayedSections = useMemo(() => {
    return SECTIONS.filter(s => {
      if (appMode === 'azimxon') return s.category === 'azimxon';
      if (appMode === 'islomboy') return s.category === 'islomboy';
      return !s.category || s.category === 'standard'; 
    });
  }, [appMode]);

  // Dynamic Styles based on mode
  const getThemeColors = () => {
    switch(appMode) {
      case 'azimxon': return 'bg-slate-100';
      case 'islomboy': return 'bg-teal-50'; // Light Green/Teal for Islomboy
      default: return 'bg-[#f1f5f9]';
    }
  };

  const getTitleColor = () => {
    switch(appMode) {
      case 'azimxon': return 'text-red-600';
      case 'islomboy': return 'text-teal-600';
      default: return 'text-indigo-600';
    }
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${getThemeColors()}`}>
      <Header onLogoClick={handleBackToDashboard} />

      <main className="flex-grow container mx-auto px-3 py-6 max-w-5xl relative">
        
        {/* Mode Switcher Button (Top Right) */}
        {currentView === 'LANDING' && (
          <div className="absolute top-0 right-3 z-10">
            <button 
              onClick={cycleAppMode}
              className="p-3 bg-white rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all active-press"
              title="Rejimni o'zgartirish: Standard -> Azimxon -> Islomboy"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}

        {currentView === 'LANDING' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                {appMode === 'islomboy' ? 'Xavfsizlik Qoidalari' : appMode === 'azimxon' ? 'Xavfsizlik Exam' : 'Xavfsizlik Texnikasi'}
                <span className={`block text-2xl md:text-3xl mt-2 ${getTitleColor()}`}>
                   {appMode === 'islomboy' ? 'for Islomboy' : appMode === 'azimxon' ? 'A-TOIFA QOIDABUZARLIKLAR' : 'for Azimxon'}
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium">
                {appMode === 'azimxon' 
                  ? "Conch Cement xavfsizlik qoidabuzarliklari (A-sinf) bo'yicha maxsus testlar."
                  : appMode === 'islomboy'
                  ? "Toshkent Conch Cement xodimlari uchun maxsus xavfsizlik va yo'l harakati qoidalari testlari."
                  : "Xavfsizlik qoidalari, yong'in xavfsizligi va birinchi yordam bo'yicha testlar."}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {appMode === 'standard' && (
                  <button 
                    onClick={handleStartMultiplayer}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active-press flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Do'stlar bilan o'ynash
                  </button>
                )}
                
                <button 
                  onClick={clearProgress}
                  className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all active-press"
                >
                  Natijalarni Tozalash
                </button>
              </div>
            </div>

            <SectionSelector 
              sections={displayedSections} 
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