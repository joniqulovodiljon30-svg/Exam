
import React, { useState, useEffect, useMemo } from 'react';
import { SECTIONS, QUESTIONS as RAW_QUESTIONS } from './data';
import { Section, Question, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';
import { getQuestionsForVariant } from './utils';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeVariant, setActiveVariant] = useState<number>(1); // Default to Variant 1 (Sec 1)
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});

  // Generate the specific list of questions for the current Topic (Section) and Variant
  const currentExamQuestions = useMemo(() => {
    if (!activeSection) return [];
    return getQuestionsForVariant(
      RAW_QUESTIONS, 
      activeSection.startId, 
      activeSection.endId, 
      activeVariant
    );
  }, [activeSection, activeVariant]);

  // Persistence: Load progress
  useEffect(() => {
    const saved = localStorage.getItem('exam_progress_v3');
    if (saved) {
      setUserAnswers(JSON.parse(saved));
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (Object.keys(userAnswers).length > 0) {
      localStorage.setItem('exam_progress_v3', JSON.stringify(userAnswers));
    }
  }, [userAnswers]);

  const handleSelectSection = (section: Section) => {
    setActiveSection(section);
    setActiveVariant(1); // Reset to Sec 1 when entering a new topic
    setCurrentView('EXAM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVariantSwitch = (variantId: number) => {
    // Directly switch variant without confirmation to ensure UI updates immediately
    // and provides a better user experience for rapid switching
    setActiveVariant(variantId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setCurrentView('LANDING');
    setActiveSection(null);
    setActiveVariant(1);
  };

  const handleAnswer = (questionId: number, selected: 'A' | 'B' | 'C' | 'D') => {
    // Find the question in the CURRENT variant set to check correctness
    const question = currentExamQuestions.find(q => q.id === questionId);
    if (!question) return;

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOption: selected,
        isCorrect: selected === question.correctAnswer
      }
    }));
  };

  const clearProgress = () => {
    if (confirm("Are you sure you want to reset all your progress?")) {
      setUserAnswers({});
      localStorage.removeItem('exam_progress_v3');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogoClick={handleBackToDashboard} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {currentView === 'LANDING' ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                Exam Practice Dashboard
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Select a topic to begin. Inside each topic, you can choose from 7 different randomized variants (Sec 1 - Sec 7).
              </p>
              <button 
                onClick={clearProgress}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Reset All Progress
              </button>
            </div>

            <SectionSelector 
              sections={SECTIONS} 
              onSelect={handleSelectSection} 
              userAnswers={userAnswers}
            />
          </div>
        ) : (
          <ExamContainer 
            // Key is crucial here! It forces the component to remount when variant changes,
            // ensuring all internal state (like current question index) is reset completely.
            key={`${activeSection?.id}-${activeVariant}`}
            section={activeSection!} 
            variant={activeVariant}
            questions={currentExamQuestions}
            userAnswers={userAnswers}
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
