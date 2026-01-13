
import React, { useState, useEffect } from 'react';
import { SECTIONS, QUESTIONS } from './data';
import { Section, Question, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});

  // Persistence: Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('exam_progress');
    if (saved) {
      setUserAnswers(JSON.parse(saved));
    }
  }, []);

  // Save progress whenever userAnswers changes
  useEffect(() => {
    if (Object.keys(userAnswers).length > 0) {
      localStorage.setItem('exam_progress', JSON.stringify(userAnswers));
    }
  }, [userAnswers]);

  const handleSelectSection = (section: Section) => {
    setActiveSection(section);
    setCurrentView('EXAM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setCurrentView('LANDING');
    setActiveSection(null);
  };

  const handleAnswer = (questionId: number, selected: 'A' | 'B' | 'C' | 'D') => {
    const question = QUESTIONS.find(q => q.id === questionId);
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
      localStorage.removeItem('exam_progress');
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
                Select a section to begin your practice. Your progress is automatically saved.
                Total of 206 questions across 7 modules.
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
            section={activeSection!} 
            questions={QUESTIONS.filter(q => q.id >= activeSection!.startId && q.id <= activeSection!.endId)}
            userAnswers={userAnswers}
            onAnswer={handleAnswer}
            onBack={handleBackToDashboard}
            onSectionSwitch={handleSelectSection}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
