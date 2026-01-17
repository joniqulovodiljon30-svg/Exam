import React, { useState, useEffect } from 'react';
import { Question, UserAnswer } from '../types';

interface QuestionCardProps {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswer: (choice: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, userAnswer, onAnswer }) => {
  const isAnswered = !!userAnswer;
  const isMultiple = question.type === 'multiple';
  
  // Local state for multiple choice selection before confirming
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  // Reset local state when question changes
  useEffect(() => {
    setSelectedMulti([]);
  }, [question.id]);

  const handleMultiSelect = (key: string) => {
    if (isAnswered) return;
    
    setSelectedMulti(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key].sort();
      }
    });
  };

  const submitMultiAnswer = () => {
    if (selectedMulti.length === 0) return;
    onAnswer(selectedMulti.join(''));
  };

  const getOptionStyle = (key: string) => {
    // 1. Agar javob berilgan bo'lsa (Natijani ko'rsatish)
    if (isAnswered) {
      const userSelected = userAnswer.selectedOption || "";
      const isSelectedByUser = userSelected.includes(key);
      const isActuallyCorrect = question.correctAnswer.includes(key);

      if (isActuallyCorrect) {
        // To'g'ri javob edi (Yashil)
        return "bg-emerald-50 border-emerald-500 text-emerald-900";
      }
      if (isSelectedByUser && !isActuallyCorrect) {
        // Foydalanuvchi tanladi, lekin xato (Qizil)
        return "bg-red-50 border-red-500 text-red-900";
      }
      // Tanlanmagan va xato variant
      return "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
    }

    // 2. Javob berilmagan (Tanlash jarayoni)
    if (isMultiple) {
      if (selectedMulti.includes(key)) {
        return "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.01]";
      }
      return "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";
    } else {
      // Single choice hover effect
      return "bg-white hover:bg-slate-50 active:bg-indigo-50 border-slate-200 text-slate-700";
    }
  };

  const getOptionBadgeStyle = (key: string) => {
    if (isAnswered) {
      const userSelected = userAnswer.selectedOption || "";
      if (userSelected.includes(key)) {
         return "bg-indigo-600 text-white border-indigo-600";
      }
      return "bg-slate-100 border-slate-100 text-slate-400";
    }

    if (isMultiple && selectedMulti.includes(key)) {
      return "bg-white text-indigo-600 border-white";
    }
    
    return "bg-slate-50 border-slate-200 text-slate-500";
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden transition-all">
      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Question Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">
              {question.id}-Savol
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
              {question.type === 'multiple' ? "Ko'p tanlovli" : question.type === 'boolean' ? "To'g'ri/Noto'g'ri" : "Bitta tanlov"}
            </span>
            {isAnswered && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${userAnswer.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {userAnswer.isCorrect ? 'To\'g\'ri' : 'Xato'}
              </span>
            )}
          </div>
          <h2 className="text-base md:text-xl font-semibold leading-tight text-slate-800">
            {question.text}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {Object.keys(question.options).sort().map((key) => (
            <button
              key={key}
              disabled={isAnswered}
              onClick={() => isMultiple ? handleMultiSelect(key) : onAnswer(key)}
              className={`flex items-center p-3 md:p-4 rounded-xl border-2 transition-all text-left active-press ${getOptionStyle(key)}`}
            >
              <div className={`w-7 h-7 md:w-9 md:h-9 flex-shrink-0 rounded-lg flex items-center justify-center font-bold mr-3 border transition-colors text-sm md:text-base ${getOptionBadgeStyle(key)}`}>
                {key}
              </div>
              <span className="font-medium text-sm md:text-base leading-tight">
                {question.options[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Multi-choice Confirm Button */}
        {isMultiple && !isAnswered && (
          <div className="pt-2">
            <button 
              onClick={submitMultiAnswer}
              disabled={selectedMulti.length === 0}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none active-press"
            >
              Javobni Tasdiqlash
            </button>
          </div>
        )}

        {/* Feedback Section */}
        {isAnswered && !userAnswer.isCorrect && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 animate-in fade-in zoom-in-95">
             <div className="text-amber-500 mt-0.5">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <p className="text-xs text-amber-800 font-medium">
               To'g'ri javob: <span className="font-bold">{question.correctAnswer}</span> varianti edi.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;