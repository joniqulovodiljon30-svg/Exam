
import React, { useState, useEffect, useMemo } from 'react';
import { SECTIONS, QUESTIONS as RAW_QUESTIONS } from './data';
import { Section, UserAnswer, AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import SectionSelector from './components/SectionSelector';
import ExamContainer from './components/ExamContainer';
import { getQuestionsForVariant } from './utils';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeVariant, setActiveVariant] = useState<number>(1);
  
  // Maps Grounding State
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapResults, setMapResults] = useState<{text: string, links: any[]} | null>(null);

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
    setMapResults(null);
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

  const findPsychologistsNearby = async () => {
    setIsSearchingMap(true);
    setMapResults(null);
    
    try {
      // Get User Location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Always initialize GoogleGenAI inside the event handler to ensure correct key context
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        // Maps grounding requires Gemini 2.5 series models
        model: "gemini-2.5-flash",
        contents: "Menga yaqin atrofdagi eng yaxshi psixologik markazlar va psixologlar haqida ma'lumot ber. Ularning manzili va reytingini ham ayt.",
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          }
        },
      });

      const text = response.text || "Ma'lumot topilmadi.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      setMapResults({ text, links: chunks });
    } catch (error) {
      console.error("Map search error:", error);
      alert("Joylashuvni aniqlashda yoki qidiruvda xatolik yuz berdi.");
    } finally {
      setIsSearchingMap(false);
    }
  };

  const dashboardStats = useMemo(() => {
    const stats: Record<number, UserAnswer> = {};
    // Fix: Cast Object.values results to UserAnswer[] to fix 'unknown' type property access errors.
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
                  onClick={clearProgress}
                  className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all active-press"
                >
                  Progressni tozalash
                </button>
                <button 
                  onClick={findPsychologistsNearby}
                  disabled={isSearchingMap}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all active-press shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {isSearchingMap ? 'Qidirilmoqda...' : 'Yaqin atrofdagi psixologlar'}
                </button>
              </div>
            </div>

            {mapResults && (
              <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-indigo-700 text-sm">Xaritadan natijalar:</h3>
                  <button onClick={() => setMapResults(null)} className="text-slate-400 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grounding-text text-slate-700 mb-4 whitespace-pre-wrap">
                  {mapResults.text}
                </div>
                {mapResults.links.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Manbalar va xarita:</p>
                    <div className="flex flex-wrap gap-2">
                      {mapResults.links.map((chunk, idx) => {
                        const uri = chunk.maps?.uri || chunk.web?.uri;
                        const title = chunk.maps?.title || chunk.web?.title || `Manba ${idx + 1}`;
                        if (!uri) return null;
                        return (
                          <a 
                            key={idx} 
                            href={uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            {title}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <SectionSelector 
              sections={SECTIONS} 
              onSelect={handleSelectSection} 
              userAnswers={dashboardStats}
            />
          </div>
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
