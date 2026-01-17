import React, { useState, useEffect } from 'react';
import { Section, Question, UserAnswer } from '../types';
import QuestionCard from './QuestionCard';

interface ExamContainerProps {
  section: Section;
  variant: number;
  questions: Question[];
  userAnswers: Record<number, UserAnswer>;
  onAnswer: (questionId: number, selected: string) => void;
  onBack: () => void;
  onVariantSwitch: (variantId: number) => void;
}

const ExamContainer: React.FC<ExamContainerProps> = ({ 
  section, 
  variant,
  questions, 
  userAnswers, 
  onAnswer, 
  onBack,
  onVariantSwitch
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const currentQuestion = questions[currentIndex];
  const totalInSet = questions.length;
  
  const answeredCount = questions.filter(q => userAnswers[q.id]).length;
  const progressPercent = totalInSet > 0 ? Math.round((answeredCount / totalInSet) * 100) : 0;

  useEffect(() => {
    setCurrentIndex(0);
    setIsFinished(false);
  }, [variant, section.id]);

  const goToNext = () => {
    if (currentIndex < totalInSet - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isFinished) {
    const correctCount = questions.filter(q => userAnswers[q.id]?.isCorrect).length;
    
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-2">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Natijalar</h2>
          <p className="text-sm text-slate-500 mb-6">Variant {variant}</p>
          
          <div className="flex justify-around items-center mb-8">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{correctCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">To'g'ri</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalInSet}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Jami</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className={`text-2xl font-bold ${progressPercent >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {totalInSet > 0 ? Math.round((correctCount/totalInSet) * 100) : 0}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Natija</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <button onClick={() => setIsFinished(false)} className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white text-sm">Savollarni ko'rish</button>
             <button onClick={onBack} className="w-full py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">Menyuga qaytish</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto px-1">
      {/* Compact Header for Mobile */}
      <div className="glass p-3 rounded-2xl flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="p-2 bg-slate-100 rounded-lg text-slate-600 active-press hover:bg-slate-200 transition-colors cursor-pointer relative z-20">
            <svg className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-800 leading-tight line-clamp-1">{section.name}</h2>
            <p className="text-[10px] text-slate-500 font-bold">SAVOL {currentIndex + 1} / {totalInSet}</p>
          </div>
          <div className="w-9 h-9"></div> {/* Balancer */}
        </div>

        {/* Variant Selectors - Better scrolling for mobile */}
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {[1, 2, 3, 4, 5, 6, 7].map(vId => (
            <button
              key={vId}
              onClick={() => onVariantSwitch(vId)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                vId === variant 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              SEC {vId}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="min-h-[300px]">
        {currentQuestion && (
          <QuestionCard 
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id]}
            onAnswer={(choice) => onAnswer(currentQuestion.id, choice)}
          />
        )}
      </div>

      {/* Navigation - Sticky-ish for mobile */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button 
          onClick={goToPrev} 
          disabled={currentIndex === 0} 
          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 disabled:opacity-30 active-press text-sm"
        >
          Oldingi
        </button>
        
        {currentIndex === totalInSet - 1 ? (
          <button 
            onClick={() => setIsFinished(true)} 
            className="flex-1 py-3 bg-emerald-600 rounded-xl font-bold text-white shadow-md active-press text-sm"
          >
            Tugatish
          </button>
        ) : (
          <button 
            onClick={goToNext} 
            className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white shadow-md active-press text-sm"
          >
            Keyingi
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamContainer;