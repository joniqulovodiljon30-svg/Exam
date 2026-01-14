
import React, { useState, useEffect } from 'react';
import { Section, Question, UserAnswer } from '../types';
import QuestionCard from './QuestionCard';

interface ExamContainerProps {
  section: Section;
  variant: number;
  questions: Question[];
  userAnswers: Record<number, UserAnswer>;
  onAnswer: (questionId: number, selected: 'A' | 'B' | 'C' | 'D') => void;
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
  
  // Calculate progress for current set
  const answeredCount = questions.filter(q => userAnswers[q.id]).length;
  const progressPercent = Math.round((answeredCount / totalInSet) * 100);

  // Reset state when variant changes
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

  const handleQuickJump = (index: number) => {
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    setIsFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RESULTS VIEW ---
  if (isFinished) {
    const correctCount = questions.filter(q => userAnswers[q.id]?.isCorrect).length;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={() => setIsFinished(false)} className="text-indigo-600 font-bold hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Review Questions
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl text-center border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Exam Results</h2>
          <p className="text-slate-500 mb-6">{section.name} - Variant {variant}</p>
          
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-indigo-600">{correctCount}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">Correct</div>
            </div>
            <div className="h-12 w-[1px] bg-slate-200"></div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-slate-800">{totalInSet}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">Total</div>
            </div>
            <div className="h-12 w-[1px] bg-slate-200"></div>
            <div className="text-center">
              <div className={`text-4xl font-extrabold ${correctCount/totalInSet >= 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {Math.round((correctCount/totalInSet) * 100)}%
              </div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">Score</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Review</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {questions.map((q, idx) => {
                  const ans = userAnswers[q.id];
                  const isCorrect = ans?.isCorrect;
                  const isAnswered = !!ans;
                  
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAnswered ? (
                          isCorrect ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              Correct
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Incorrect
                            </span>
                          )
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => {
                            setCurrentIndex(idx);
                            setIsFinished(false);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 flex justify-center space-x-4">
             <button 
                onClick={onBack}
                className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
             >
               Back to Topics
             </button>
             <button 
                onClick={() => setIsFinished(false)}
                className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700"
             >
               Review Answers
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Exam Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-4 rounded-3xl">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-600"
            title="Back to Topics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-none">{section.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
               <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Variant {variant}</span>
               <p className="text-sm text-slate-500 font-medium">Question {currentIndex + 1} of {totalInSet}</p>
            </div>
          </div>
        </div>

        {/* Variant Switcher (Sec 1 ... Sec 7) */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(vId => (
            <button
              key={vId}
              onClick={() => onVariantSwitch(vId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                vId === variant 
                  ? 'bg-indigo-600 text-white shadow-md scale-105' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              Sec {vId}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
          <span>Variant Progress</span>
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
        {currentQuestion && (
          <QuestionCard 
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id]}
            onAnswer={(choice) => onAnswer(currentQuestion.id, choice)}
          />
        )}
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

        {/* Quick jump only visible on larger screens */}
        <div className="hidden xl:flex items-center space-x-1.5 px-4 max-w-lg overflow-x-auto py-2 no-scrollbar">
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

        {currentIndex === totalInSet - 1 ? (
          <button 
            onClick={handleFinish}
            className="flex items-center px-6 py-3 bg-emerald-600 rounded-2xl font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            Finish Exam
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
        ) : (
          <button 
            onClick={goToNext}
            className="flex items-center px-6 py-3 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            Next
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamContainer;
