
import React, { useState } from 'react';
import { Section, Question, UserAnswer } from '../types';
import QuestionCard from './QuestionCard';
import { SECTIONS } from '../data';

interface ExamContainerProps {
  section: Section;
  questions: Question[];
  userAnswers: Record<number, UserAnswer>;
  onAnswer: (questionId: number, selected: 'A' | 'B' | 'C' | 'D') => void;
  onBack: () => void;
  onSectionSwitch: (section: Section) => void;
}

const ExamContainer: React.FC<ExamContainerProps> = ({ 
  section, 
  questions, 
  userAnswers, 
  onAnswer, 
  onBack,
  onSectionSwitch
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];
  const totalInSet = questions.length;
  const answeredInSet = questions.filter(q => userAnswers[q.id]).length;
  const progressPercent = Math.round((answeredInSet / totalInSet) * 100);

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

  const handleQuickJump = (index: number) => {
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Exam Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-4 rounded-3xl">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-600"
            title="Back to Sections"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{section.name}</h2>
            <p className="text-sm text-slate-500 font-medium">Question {currentIndex + 1} of {totalInSet}</p>
          </div>
        </div>

        {/* Section Quick Switcher (Independent Selection) */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                onSectionSwitch(s);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                s.id === section.id 
                  ? 'bg-indigo-600 text-white shadow-md scale-105' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              Sec {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
          <span>Overall Section Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="min-h-[400px]">
        <QuestionCard 
          question={currentQuestion}
          userAnswer={userAnswers[currentQuestion.id]}
          onAnswer={(choice) => onAnswer(currentQuestion.id, choice)}
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4">
        <button 
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Previous
        </button>

        <div className="hidden lg:flex items-center space-x-1.5 px-4 max-w-md overflow-x-auto py-2">
           {questions.map((q, idx) => (
             <button
               key={q.id}
               onClick={() => handleQuickJump(idx)}
               className={`w-8 h-8 flex-shrink-0 rounded-lg text-[10px] font-bold transition-all ${
                 currentIndex === idx 
                   ? 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700' 
                   : userAnswers[q.id] 
                     ? (userAnswers[q.id].isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
                     : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
               }`}
             >
               {idx + 1}
             </button>
           ))}
        </div>

        <button 
          onClick={goToNext}
          disabled={currentIndex === totalInSet - 1}
          className="flex items-center px-6 py-3 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-200 active:scale-95"
        >
          Next
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default ExamContainer;
