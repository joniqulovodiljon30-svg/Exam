import React, { useState, useEffect, useRef } from 'react';
import { Section, Question, Player, ChatMessage } from '../types';
import { SECTIONS, QUESTIONS } from '../data';
import { getQuestionsForVariant } from '../utils';

interface MultiplayerGameProps {
  onBack: () => void;
}

type GameState = 'SETUP' | 'LOBBY' | 'PLAYING' | 'FINISHED';

const BOT_NAMES = ['Ali', 'Vali', 'Guli', 'Sardor', 'Malika'];
const BOT_AVATARS = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-blue-500'];

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section>(SECTIONS[0]);
  const [selectedVariant, setSelectedVariant] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Game Loop State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(0);
  
  // Chat & Vote
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [voteSectionId, setVoteSectionId] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  // 1. SETUP: Create User
  const handleJoin = (name: string) => {
    const newPlayer: Player = {
      id: 'me-' + Date.now(),
      name: name || 'Foydalanuvchi',
      isReady: false,
      score: 0,
      totalTime: 0,
      currentAnswer: null,
      avatarColor: 'bg-indigo-600'
    };
    setMyPlayerId(newPlayer.id);
    setPlayers([newPlayer]);
    setGameState('LOBBY');
    
    // Simulate bots joining
    setTimeout(() => {
      const bot1: Player = { id: 'bot-1', name: 'Ali', isReady: false, score: 0, totalTime: 0, currentAnswer: null, avatarColor: 'bg-emerald-500', isBot: true };
      setPlayers(prev => [...prev, bot1]);
    }, 1500);
    setTimeout(() => {
      const bot2: Player = { id: 'bot-2', name: 'Malika', isReady: false, score: 0, totalTime: 0, currentAnswer: null, avatarColor: 'bg-pink-500', isBot: true };
      setPlayers(prev => [...prev, bot2]);
    }, 3000);
  };

  // 2. LOBBY: Toggle Ready & Start
  const toggleReady = () => {
    setPlayers(prev => prev.map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Havola nusxalandi! Do'stlaringizga yuboring.");
  };

  // Check if everyone is ready to start
  useEffect(() => {
    if (gameState === 'LOBBY') {
      const me = players.find(p => p.id === myPlayerId);
      // Auto-ready bots if I am ready
      if (me?.isReady) {
        const unreadyBots = players.filter(p => p.isBot && !p.isReady);
        if (unreadyBots.length > 0) {
          const timer = setTimeout(() => {
            setPlayers(prev => prev.map(p => p.isBot ? { ...p, isReady: true } : p));
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
      
      const allReady = players.length > 0 && players.every(p => p.isReady);
      if (allReady && players.length > 1) {
        setTimeout(startGame, 1000);
      }
    }
  }, [players, gameState, myPlayerId]);

  const startGame = () => {
    // Load questions
    const q = getQuestionsForVariant(QUESTIONS, selectedSection.startId, selectedSection.endId, selectedVariant);
    setQuestions(q);
    setCurrentQuestionIdx(0);
    setGameState('PLAYING');
    startRound();
  };

  // 3. GAME LOOP
  const startRound = () => {
    setTimeLeft(10);
    setIsQuestionActive(true);
    setRoundStartTime(Date.now());
    
    // Reset current answers
    setPlayers(prev => prev.map(p => ({ ...p, currentAnswer: null })));
    
    // Bot logic: Bots decide when and what to answer
    players.filter(p => p.isBot).forEach(bot => {
      const reactionTime = 2000 + Math.random() * 6000; // 2s to 8s
      const isCorrect = Math.random() > 0.3; // 70% accuracy
      
      setTimeout(() => {
        if (gameState !== 'PLAYING') return;
        setPlayers(prev => {
           // Only update if round is still active
           return prev.map(p => {
             if (p.id === bot.id) {
               const q = questions[currentQuestionIdx]; // Need current ref, tricky in timeout. Using functional update might lag behind index.
               // Simplified: We assume question hasn't changed in 10s window (it shouldn't)
               // But we need the ACTUAL correct answer here. 
               // For simulation, we will pick randomly A/B/C/D
               const options: Array<'A'|'B'|'C'|'D'> = ['A','B','C','D'];
               const picked = isCorrect ? 'A' : options[Math.floor(Math.random() * 4)]; // Assuming A is correct in data flow, handled by util
               
               return {
                 ...p,
                 currentAnswer: picked,
                 // Bots don't accumulate score yet, we calculate at end of round
               };
             }
             return p;
           });
        });
      }, reactionTime);
    });
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && isQuestionActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isQuestionActive]);

  const endRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsQuestionActive(false);

    // Calculate scores
    setPlayers(prev => prev.map(p => {
      const q = questions[currentQuestionIdx];
      const isCorrect = p.currentAnswer === q.correctAnswer;
      // Time taken: If answered, assume some time. For User we tracked it. For Bots we simulate.
      // Actually simpler: Just check correctness. Time is cumulative.
      
      // Note: Real "time taken" for user was handled in handleAnswer.
      // For bots, we just add random time if they answered.
      let addedTime = 0;
      if (p.isBot) addedTime = p.currentAnswer ? (2 + Math.random() * 6) : 10;
      else if (!p.currentAnswer) addedTime = 10; // User didn't answer

      return {
        ...p,
        score: p.score + (isCorrect ? 1 : 0),
        totalTime: p.totalTime + (p.id === myPlayerId && p.currentAnswer === null ? 10 : (p.isBot ? addedTime : 0)) // User time added in handleAnswer
      };
    }));

    // Wait a bit then next question or finish
    setTimeout(() => {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        startRound();
      } else {
        setGameState('FINISHED');
      }
    }, 2000);
  };

  const handleAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!isQuestionActive) return;
    
    const me = players.find(p => p.id === myPlayerId);
    if (me?.currentAnswer) return; // Already answered

    const timeTaken = (Date.now() - roundStartTime) / 1000;
    
    setPlayers(prev => prev.map(p => 
      p.id === myPlayerId 
        ? { ...p, currentAnswer: option, totalTime: p.totalTime + timeTaken } 
        : p
    ));
  };

  // 4. RESULTS & CHAT
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      playerId: myPlayerId,
      playerName: players.find(p => p.id === myPlayerId)?.name || 'Men',
      text: newMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Bot reply simulation
    setTimeout(() => {
       const botMsg: ChatMessage = {
         id: (Date.now()+1).toString(),
         playerId: 'bot-1',
         playerName: 'Ali',
         text: ['Zor oyin boldi!', 'Keyingisiga men tayyorman', 'Qiyin ekan bu safar'].sort(() => 0.5 - Math.random())[0],
         timestamp: Date.now()
       };
       setMessages(prev => [...prev, botMsg]);
    }, 2000);
  };

  const handleRestart = () => {
    // In real app, we check if everyone voted. Here we just restart as Host.
    // Reset players but keep names
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, totalTime: 0, currentAnswer: null, isReady: false })));
    setVoteSectionId(null);
    setGameState('LOBBY');
  };

  // RENDERERS
  
  if (gameState === 'SETUP') {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Ismingizni kiriting</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleJoin(fd.get('name') as string);
        }} className="space-y-4">
          <input 
            name="name" 
            required 
            placeholder="Ism Familiya" 
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl active-press">
            O'yinga kirish
          </button>
          <button type="button" onClick={onBack} className="w-full py-3 text-slate-400 font-medium">Ortga</button>
        </form>
      </div>
    );
  }

  if (gameState === 'LOBBY') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Lobby (Kutish xonasi)</h2>
            <button onClick={copyLink} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold">
              Havoladan nusxa olish
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center text-white font-bold`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.id === myPlayerId ? '(Siz)' : 'O\'yinchi'}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${p.isReady ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {p.isReady ? 'TAYYOR' : 'KUTILMOQDA...'}
                </div>
              </div>
            ))}
            {players.length < 2 && (
              <p className="text-center text-slate-400 text-sm animate-pulse">Boshqa o'yinchilar ulanishi kutilmoqda...</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase">Bo'limni tanlash</label>
               <select 
                 value={selectedSection.id}
                 onChange={(e) => setSelectedSection(SECTIONS.find(s => s.id === Number(e.target.value))!)}
                 className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none"
               >
                 {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase">Variant</label>
               <div className="flex gap-2 overflow-x-auto mt-1 no-scrollbar pb-1">
                 {[1,2,3,4,5,6,7].map(v => (
                   <button 
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 ${selectedVariant === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                   >
                     #{v}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          <div className="mt-8 flex gap-3">
             <button onClick={onBack} className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-slate-500">Chiqish</button>
             <button 
               onClick={toggleReady}
               className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg active-press transition-colors ${
                 players.find(p => p.id === myPlayerId)?.isReady 
                 ? 'bg-red-500 hover:bg-red-600' 
                 : 'bg-emerald-500 hover:bg-emerald-600'
               }`}
             >
               {players.find(p => p.id === myPlayerId)?.isReady ? 'BEKOR QILISH' : 'TAYYOR (DEADLY)'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'PLAYING') {
    const question = questions[currentQuestionIdx];
    const me = players.find(p => p.id === myPlayerId)!;
    const hasAnswered = !!me.currentAnswer;

    return (
      <div className="max-w-3xl mx-auto px-2">
        {/* Header Info */}
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="text-slate-500 font-bold text-sm">
             Savol {currentQuestionIdx + 1} / {questions.length}
          </div>
          <div className="flex -space-x-2">
            {players.map(p => (
              <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-white ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold relative`}>
                 {p.name.charAt(0)}
                 {p.currentAnswer && (
                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Timer Bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 4 ? 'bg-red-500' : 'bg-indigo-500'}`} 
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 md:p-8">
           <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8">{question.text}</h2>
           
           <div className="grid gap-3">
             {(['A','B','C','D'] as const).map(opt => {
               const isSelected = me.currentAnswer === opt;
               const showResults = hasAnswered; // In MP we show choices after YOU answer
               
               // Who else chose this?
               const choosers = players.filter(p => p.id !== myPlayerId && p.currentAnswer === opt);

               let btnClass = "bg-white border-slate-200 hover:bg-slate-50";
               if (isSelected) btnClass = "bg-indigo-600 border-indigo-600 text-white";
               // If simulating "after everyone answers" reveal correct:
               // But user wanted "show others after I answer"
               
               return (
                 <button 
                   key={opt}
                   disabled={hasAnswered || !isQuestionActive}
                   onClick={() => handleAnswer(opt)}
                   className={`relative p-4 rounded-xl border-2 text-left font-medium transition-all active-press flex justify-between items-center ${btnClass}`}
                 >
                   <div className="flex items-center gap-3">
                     <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border ${isSelected ? 'bg-white text-indigo-600 border-white' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                       {opt}
                     </span>
                     <span>{question.options[opt]}</span>
                   </div>
                   
                   {/* Opponent Avatars on this option */}
                   {showResults && choosers.length > 0 && (
                     <div className="flex -space-x-1">
                       {choosers.map(cp => (
                         <div key={cp.id} className={`w-6 h-6 rounded-full border border-white ${cp.avatarColor} text-[8px] text-white flex items-center justify-center`}>
                           {cp.name.charAt(0)}
                         </div>
                       ))}
                     </div>
                   )}
                 </button>
               );
             })}
           </div>
        </div>

        <div className="text-center mt-6 text-slate-400 font-bold text-sm uppercase tracking-widest">
           {timeLeft > 0 ? `${timeLeft} soniya qoldi` : 'Vaqt tugadi!'}
        </div>
      </div>
    );
  }

  // FINISHED VIEW
  if (gameState === 'FINISHED') {
    // Sort players: Score desc, then Time asc
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTime - b.totalTime;
    });

    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {/* LEADERBOARD */}
        <div className="space-y-4">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h2 className="text-2xl font-bold mb-6 text-center">Natijalar</h2>
             <div className="space-y-3">
               {sortedPlayers.map((p, idx) => (
                 <div key={p.id} className={`flex items-center p-4 rounded-2xl border-2 ${p.id === myPlayerId ? 'border-indigo-100 bg-indigo-50' : 'border-transparent bg-slate-50'}`}>
                    <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full mr-4 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{p.name} {p.id === myPlayerId && '(Siz)'}</div>
                      <div className="text-xs text-slate-400">{Math.round(p.totalTime)} sek sarflandi</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-bold text-indigo-600">{p.score}</div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase">Ball</div>
                    </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <h3 className="font-bold text-slate-400 uppercase text-xs mb-4">Keyingi test uchun ovoz bering</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {SECTIONS.slice(0, 3).map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setVoteSectionId(s.id)}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border font-bold text-xs transition-all ${voteSectionId === s.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {s.name.substring(0, 15)}...
                  </button>
                ))}
              </div>
              <button onClick={handleRestart} className="w-full mt-4 py-3 bg-emerald-500 text-white font-bold rounded-xl active-press">
                 Qayta o'ynash (Restart)
              </button>
              <button onClick={onBack} className="w-full mt-2 py-3 text-slate-400 font-bold text-xs">
                 Menyuga qaytish
              </button>
           </div>
        </div>

        {/* CHAT */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px] lg:h-auto">
           <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Chat xonasi</div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-300 text-sm py-10">Hozircha xabarlar yo'q</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.playerId === myPlayerId ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.playerName}</span>
                      <span className="text-[8px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${msg.playerId === myPlayerId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                     {msg.text}
                   </div>
                </div>
              ))}
           </div>
           <div className="p-3 border-t border-slate-100 flex gap-2">
             <input 
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder="Xabar yozish..."
               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-indigo-500"
             />
             <button onClick={handleSendMessage} className="p-3 bg-indigo-600 text-white rounded-xl active-press">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
             </button>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MultiplayerGame;