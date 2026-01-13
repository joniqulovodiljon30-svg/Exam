
import React from 'react';
import { Section, UserAnswer } from '../types';

interface SectionSelectorProps {
  sections: Section[];
  onSelect: (section: Section) => void;
  userAnswers: Record<number, UserAnswer>;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ sections, onSelect, userAnswers }) => {
  const getSectionStats = (section: Section) => {
    let answered = 0;
    let correct = 0;
    for (let id = section.startId; id <= section.endId; id++) {
      if (userAnswers[id]) {
        answered++;
        if (userAnswers[id].isCorrect) correct++;
      }
    }
    return { answered, correct, percentage: Math.round((answered / section.totalQuestions) * 100) };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sections.map(section => {
        const stats = getSectionStats(section);
        return (
          <div 
            key={section.id}
            onClick={() => onSelect(section)}
            className="group relative bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-indigo-200 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {section.name}
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  Questions {section.startId} - {section.endId}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-700">
                  Progress
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {stats.answered} / {section.totalQuestions}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                <span>Completed</span>
                <span>{stats.percentage}%</span>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 hidden group-hover:block">
               {stats.percentage === 100 && (
                 <span className="flex items-center text-emerald-500 text-xs font-bold animate-pulse">
                   <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                   DONE
                 </span>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SectionSelector;
