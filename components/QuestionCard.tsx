
import React from 'react';
import { Question, UserAnswer } from '../types';

interface QuestionCardProps {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswer: (choice: 'A' | 'B' | 'C' | 'D') => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, userAnswer, onAnswer }) => {
  const isAnswered = !!userAnswer;

  const getOptionStyle = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!isAnswered) {
      return "bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700";
    }

    const isSelected = userAnswer.selectedOption === key;
    const isCorrect = question.correctAnswer === key;

    if (isCorrect) {
      return "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400/20";
    }
    if (isSelected && !isCorrect) {
      return "bg-red-50 border-red-400 text-red-900 ring-2 ring-red-400/20";
    }
    return "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
  };

  const getIcon = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!isAnswered) return null;
    const isCorrect = question.correctAnswer === key;
    const isSelected = userAnswer.selectedOption === key;

    if (isCorrect) {
      return (
        <svg className="w-5 h-5 text-emerald-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
        </svg>
      );
    }
    if (isSelected && !isCorrect) {
      return (
        <svg className="w-5 h-5 text-red-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-8 md:p-12 space-y-8">
        {/* Question Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
              Practical Test
            </span>
            {isAnswered && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${userAnswer.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {userAnswer.isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-snug text-slate-800">
            {question.text}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {(Object.keys(question.options) as Array<'A' | 'B' | 'C' | 'D'>).map((key) => (
            <button
              key={key}
              disabled={isAnswered}
              onClick={() => onAnswer(key)}
              className={`flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left group ${getOptionStyle(key)}`}
            >
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-bold mr-4 border-2 transition-colors ${
                !isAnswered 
                  ? "bg-slate-50 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600" 
                  : userAnswer.selectedOption === key 
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
                {key}
              </div>
              <span className="font-medium text-lg flex-grow">
                {question.options[key]}
              </span>
              {getIcon(key)}
            </button>
          ))}
        </div>

        {/* Post-Answer Feedback */}
        {isAnswered && (
          <div className={`p-6 rounded-2xl border flex items-start space-x-4 animate-in zoom-in-95 duration-300 ${userAnswer.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className={`p-2 rounded-lg ${userAnswer.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className={`font-bold ${userAnswer.isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                {userAnswer.isCorrect ? 'Well done!' : 'Keep learning!'}
              </p>
              <p className={`text-sm ${userAnswer.isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                {userAnswer.isCorrect 
                  ? "You got this right. Move on to the next question to maintain your momentum." 
                  : `The correct answer was option ${question.correctAnswer}. Review this concept before continuing.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
