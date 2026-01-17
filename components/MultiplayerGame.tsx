import React, { useState, useEffect, useRef } from 'react';
import { Section, Question, Player, ChatMessage } from '../types';
import { SECTIONS, QUESTIONS } from '../data';
import { getQuestionsForVariant } from '../utils';

interface MultiplayerGameProps {
  onBack: () => void;
}

type GameState = 'SETUP' | 'LOBBY' | 'PLAYING' | 'FINISHED';

// Colors for players
const AVATAR_COLORS = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
const BOT_NAMES = ['Bot Ali', 'Bot Vali', 'Bot Guli', 'Bot Hasan', 'Bot Husan', 'Bot Ziyoda'];

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [roomId, setRoomId] = useState<string>('');
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Settings (Synced)
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
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerRef = useRef<number | null>(null);

  // State ref to access latest values in callbacks
  const stateRef = useRef({
    players,
    gameState,
    selectedSection,
    selectedVariant,
    questions,
    currentQuestionIdx,
    myPlayerId,
    isQuestionActive
  });

  useEffect(() => {
    stateRef.current = {
      players,
      gameState,
      selectedSection,
      selectedVariant,
      questions,
      currentQuestionIdx,
      myPlayerId,
      isQuestionActive
    };
  }, [players, gameState, selectedSection, selectedVariant, questions, currentQuestionIdx, myPlayerId, isQuestionActive]);

  // Initialize Room from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');
    if (urlRoomId) {
      setRoomId(urlRoomId);
    } else {
      // Generate new room ID if not present
      const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newId);
    }
  }, []);

  // CONNECT TO CHANNEL (Real players)
  useEffect(() => {
    if (!roomId) return;

    // Join the channel
    const ch = new BroadcastChannel(`exam_pro_room_${roomId}`);
    channelRef.current = ch;

    ch.onmessage = (event) => {
      const { type, payload } = event.data;
      const currentState = stateRef.current;

      switch (type) {
        case 'JOIN_REQUEST':
          // Agar men host bo'lsam (birinchi o'yinchi), yangi kelganga o'zimdagi ma'lumotni beraman
          if (currentState.players.length > 0 && currentState.players[0].id === currentState.myPlayerId) {
             const newPlayerList = [...currentState.players, payload.player];
             // Duplikatni oldini olish
             const uniquePlayers = newPlayerList.filter((p, index, self) => 
                index === self.findIndex((t) => (t.id === p.id))
             );
             
             setPlayers(uniquePlayers);
             
             // Yangi o'yinchiga hozirgi holatni yuboramiz
             ch.postMessage({ 
               type: 'SYNC_STATE', 
               payload: { 
                 players: uniquePlayers, 
                 sectionId: currentState.selectedSection.id, 
                 variantId: currentState.selectedVariant,
                 gameState: currentState.gameState
               } 
             });
          }
          break;

        case 'SYNC_STATE':
          setPlayers(payload.players);
          if (payload.sectionId) setSelectedSection(SECTIONS.find(s => s.id === payload.sectionId)!);
          if (payload.variantId) setSelectedVariant(payload.variantId);
          if (payload.gameState && payload.gameState !== 'SETUP') setGameState(payload.gameState);
          break;

        case 'UPDATE_PLAYERS':
          setPlayers(payload);
          break;
        
        case 'SETTINGS_CHANGE':
          if (payload.sectionId) setSelectedSection(SECTIONS.find(s => s.id === payload.sectionId)!);
          if (payload.variantId) setSelectedVariant(payload.variantId);
          break;

        case 'START_GAME':
          setQuestions(payload.questions);
          setCurrentQuestionIdx(0);
          setGameState('PLAYING');
          startLocalRound();
          break;

        case 'PLAYER_ANSWERED':
          setPlayers(prev => prev.map(p => 
            p.id === payload.playerId 
              ? { ...p, currentAnswer: payload.answer, totalTime: payload.totalTime } 
              : p
          ));
          break;

        case 'NEXT_QUESTION':
          setCurrentQuestionIdx(payload.idx);
          startLocalRound();
          break;

        case 'GAME_OVER':
          setGameState('FINISHED');
          break;

        case 'CHAT_MESSAGE':
          setMessages(prev => [...prev, payload]);
          break;
          
        case 'RESTART':
          setGameState('LOBBY');
          setPlayers(prev => prev.map(p => ({ ...p, score: 0, totalTime: 0, currentAnswer: null, isReady: p.isBot ? true : false })));
          break;
      }
    };

    return () => {
      ch.close();
    };
  }, [roomId]);

  // Handle joining logic separately to send initial join request
  useEffect(() => {
    if (myPlayerId && channelRef.current) {
        // Tell everyone I joined, but wait a bit for connection
        setTimeout(() => {
            const me = players.find(p => p.id === myPlayerId);
            if (me) {
              channelRef.current?.postMessage({ type: 'JOIN_REQUEST', payload: { player: me } });
            }
        }, 500);
    }
  }, [myPlayerId]);

  // 1. SETUP: Create User
  const handleJoin = (name: string) => {
    const newPlayer: Player = {
      id: 'p-' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: name || 'O\'yinchi',
      isReady: false,
      score: 0,
      totalTime: 0,
      currentAnswer: null,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      isBot: false
    };
    
    setMyPlayerId(newPlayer.id);
    setPlayers([newPlayer]);
    
    const params = new URLSearchParams(window.location.search);
    if (!params.get('room')) {
       const newUrl = window.location.pathname + '?room=' + roomId;
       window.history.pushState({path: newUrl}, '', newUrl);
    }

    setGameState('LOBBY');
  };

  // ADD BOTS
  const handleAddBots = () => {
    const botCount = 3;
    const newBots: Player[] = [];
    for (let i = 0; i < botCount; i++) {
      newBots.push({
        id: `bot-${Date.now()}-${i}`,
        name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
        isReady: true,
        score: 0,
        totalTime: 0,
        currentAnswer: null,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        isBot: true
      });
    }
    const updatedPlayers = [...players, ...newBots];
    setPlayers(updatedPlayers);
    broadcast('UPDATE_PLAYERS', updatedPlayers);
  };

  // 2. LOBBY ACTIONS
  const toggleReady = () => {
    const updatedPlayers = players.map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p);
    setPlayers(updatedPlayers);
    broadcast('UPDATE_PLAYERS', updatedPlayers);
  };

  const changeSettings = (secId: number, varId: number) => {
    setSelectedSection(SECTIONS.find(s => s.id === secId)!);
    setSelectedVariant(varId);
    broadcast('SETTINGS_CHANGE', { sectionId: secId, variantId: varId });
  };

  const handleStartGame = () => {
    const q = getQuestionsForVariant(QUESTIONS, selectedSection.startId, selectedSection.endId, selectedVariant);
    setQuestions(q);
    setCurrentQuestionIdx(0);
    setGameState('PLAYING');
    
    broadcast('START_GAME', { questions: q });
    startLocalRound();
  };

  const broadcast = (type: string, payload: any) => {
    channelRef.current?.postMessage({ type, payload });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Havola nusxalandi! Do'stingizga yuboring.");
  };

  // 3. GAME LOGIC
  const startLocalRound = () => {
    setTimeLeft(10);
    setIsQuestionActive(true);
    setRoundStartTime(Date.now());
    
    // Clear previous answers
    setPlayers(prev => prev.map(p => ({ ...p, currentAnswer: null })));
  };

  // Handles logic when time is up
  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsQuestionActive(false);

    // Calculate Scores Locally
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return; 

    const updatedPlayers = players.map(p => {
      const isCorrect = p.currentAnswer === currentQ.correctAnswer;
      const penalty = p.currentAnswer ? 0 : 10;
      
      return {
        ...p,
        score: p.score + (isCorrect ? 1 : 0),
        totalTime: p.totalTime + penalty
      };
    });

    setPlayers(updatedPlayers);

    // Only HOST triggers next round logic
    if (players.length > 0 && players[0].id === myPlayerId) {
       setTimeout(() => {
         if (currentQuestionIdx < questions.length - 1) {
           broadcast('NEXT_QUESTION', { idx: currentQuestionIdx + 1 });
           setCurrentQuestionIdx(prev => prev + 1);
           startLocalRound();
         } else {
           broadcast('GAME_OVER', {});
           setGameState('FINISHED');
         }
       }, 3000); 
    }
  };

  // Timer Ticker
  useEffect(() => {
    if (gameState === 'PLAYING' && isQuestionActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isQuestionActive]);

  // Trigger Time Up
  useEffect(() => {
    if (timeLeft === 0 && isQuestionActive && gameState === 'PLAYING') {
      handleTimeUp();
    }
  }, [timeLeft, isQuestionActive, gameState]);

  // BOT AI LOGIC
  useEffect(() => {
    if (gameState === 'PLAYING' && isQuestionActive) {
      const activeBots = players.filter(p => p.isBot && !p.currentAnswer);
      
      const timeouts: number[] = [];

      activeBots.forEach(bot => {
        // Random delay between 1.5s and 8.5s
        const delay = Math.random() * 7000 + 1500;
        
        const t = window.setTimeout(() => {
            const currentQ = questions[currentQuestionIdx];
            if (!currentQ) return;

            // 60-70% chance to be correct
            const isCorrect = Math.random() > 0.35;
            const options = ['A', 'B', 'C', 'D'] as const;
            let answer: string;

            if (isCorrect) {
               answer = currentQ.correctAnswer;
            } else {
               const wrongs = options.filter(o => o !== currentQ.correctAnswer);
               answer = wrongs[Math.floor(Math.random() * wrongs.length)];
            }

            setPlayers(prev => prev.map(p => 
              p.id === bot.id 
                ? { ...p, currentAnswer: answer, totalTime: p.totalTime + (delay / 1000) }
                : p
            ));
        }, delay);

        timeouts.push(t);
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [gameState, isQuestionActive, currentQuestionIdx]);


  const handleAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!isQuestionActive) return;
    
    const me = players.find(p => p.id === myPlayerId);
    if (me?.currentAnswer) return; 

    const timeTaken = (Date.now() - roundStartTime) / 1000;
    
    // Optimistic Update
    setPlayers(prev => prev.map(p => 
      p.id === myPlayerId 
        ? { ...p, currentAnswer: option, totalTime: p.totalTime + timeTaken } 
        : p
    ));

    // Broadcast
    broadcast('PLAYER_ANSWERED', { 
      playerId: myPlayerId, 
      answer: option, 
      totalTime: me!.totalTime + timeTaken 
    });
  };

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
    broadcast('CHAT_MESSAGE', msg); 
    setNewMessage('');
  };

  const handleRestart = () => {
    broadcast('RESTART', {});
    setGameState('LOBBY');
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, totalTime: 0, currentAnswer: null, isReady: p.isBot ? true : false })));
  };

  // --- RENDER ---

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
            Xonaga kirish
          </button>
          <button type="button" onClick={onBack} className="w-full py-3 text-slate-400 font-medium">Ortga</button>
        </form>
      </div>
    );
  }

  if (gameState === 'LOBBY') {
    const iAmHost = players.length > 0 && players[0].id === myPlayerId;
    const allReady = players.length > 1 && players.every(p => p.isReady);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-xl font-bold">Kutish xonasi</h2>
               <p className="text-xs text-slate-400 font-mono">Room ID: {roomId}</p>
            </div>
            <button onClick={copyLink} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-bold flex items-center gap-1 active-press">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Ulashish
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center text-white font-bold shadow-sm`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {p.name}
                      {players[0].id === p.id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">HOST</span>}
                      {p.isBot && <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">BOT</span>}
                    </div>
                    <div className="text-xs text-slate-400">{p.id === myPlayerId ? '(Siz)' : p.isBot ? 'Robot' : 'O\'yinchi'}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${p.isReady ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                  {p.isReady ? 'TAYYOR' : 'KUTILMOQDA...'}
                </div>
              </div>
            ))}
            {players.length < 2 && (
              <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
                 <p className="text-slate-400 text-sm mb-2">Sheriklar kutilmoqda...</p>
                 {iAmHost && (
                   <button onClick={handleAddBots} className="text-indigo-600 font-bold text-sm underline hover:text-indigo-800">
                     Botlar bilan o'ynash
                   </button>
                 )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
             <div className={!iAmHost ? 'opacity-50 pointer-events-none' : ''}>
               <label className="text-xs font-bold text-slate-400 uppercase">Bo'limni tanlash {(!iAmHost) && '(Faqat Host)'}</label>
               <select 
                 value={selectedSection.id}
                 onChange={(e) => changeSettings(Number(e.target.value), selectedVariant)}
                 className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
               >
                 {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div className={!iAmHost ? 'opacity-50 pointer-events-none' : ''}>
               <label className="text-xs font-bold text-slate-400 uppercase">Variant</label>
               <div className="flex gap-2 overflow-x-auto mt-1 no-scrollbar pb-1">
                 {[1,2,3,4,5,6,7].map(v => (
                   <button 
                    key={v}
                    onClick={() => changeSettings(selectedSection.id, v)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 transition-all ${selectedVariant === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                   >
                     #{v}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          <div className="mt-8 flex gap-3">
             <button onClick={onBack} className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Chiqish</button>
             
             {iAmHost && allReady ? (
                <button 
                  onClick={handleStartGame}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active-press animate-pulse"
                >
                  O'YINNI BOSHLASH
                </button>
             ) : (
                <button 
                  onClick={toggleReady}
                  className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg active-press transition-all ${
                    players.find(p => p.id === myPlayerId)?.isReady 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                  }`}
                >
                  {players.find(p => p.id === myPlayerId)?.isReady ? 'BEKOR QILISH' : 'TAYYOR'}
                </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'PLAYING') {
    const question = questions[currentQuestionIdx];
    const me = players.find(p => p.id === myPlayerId);
    if (!me) return null; // Safety check
    
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
              <div key={p.id} className={`w-10 h-10 rounded-full border-2 border-white ${p.avatarColor} flex items-center justify-center text-white text-sm font-bold relative transition-transform hover:scale-110 z-10`}>
                 {p.name.charAt(0)}
                 {p.currentAnswer && (
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                     <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Timer Bar */}
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-6 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 4 ? 'bg-red-500' : 'bg-indigo-500'}`} 
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 relative overflow-hidden">
           {/* Watermark/Background decoration */}
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>

           <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 relative z-10 leading-snug">{question.text}</h2>
           
           <div className="grid gap-3 relative z-10">
             {(['A','B','C','D'] as const).map(opt => {
               const isSelected = me.currentAnswer === opt;
               // Show results only if I have answered
               const showResults = hasAnswered; 
               
               // Who else chose this?
               const choosers = players.filter(p => p.id !== myPlayerId && p.currentAnswer === opt);

               let btnClass = "bg-white border-slate-200 hover:bg-slate-50";
               if (isSelected) btnClass = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-[1.01]";
               
               return (
                 <button 
                   key={opt}
                   disabled={hasAnswered || !isQuestionActive}
                   onClick={() => handleAnswer(opt)}
                   className={`relative p-4 rounded-xl border-2 text-left font-medium transition-all active-press flex justify-between items-center group ${btnClass}`}
                 >
                   <div className="flex items-center gap-4">
                     <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border text-sm ${isSelected ? 'bg-white text-indigo-600 border-white' : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:border-slate-300'}`}>
                       {opt}
                     </span>
                     <span className="text-sm md:text-base">{question.options[opt]}</span>
                   </div>
                   
                   {/* Opponent Avatars on this option (Only visible after I answer) */}
                   {showResults && choosers.length > 0 && (
                     <div className="flex -space-x-1 ml-2">
                       {choosers.map(cp => (
                         <div key={cp.id} className={`w-6 h-6 rounded-full border border-white ${cp.avatarColor} text-[10px] text-white flex items-center justify-center shadow-sm`}>
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

        <div className="text-center mt-8">
           <span className={`inline-block px-4 py-2 rounded-full font-bold text-sm tracking-widest ${timeLeft > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
             {timeLeft > 0 ? `${timeLeft} SONIYA QOLDI` : 'VAQT TUGADI!'}
           </span>
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

    const winnerId = sortedPlayers[0].id;

    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {/* LEADERBOARD */}
        <div className="space-y-4">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Natijalar</h2>
                <p className="text-sm text-slate-400 font-medium">Variant: {selectedVariant}</p>
             </div>
             
             <div className="space-y-3">
               {sortedPlayers.map((p, idx) => (
                 <div key={p.id} className={`relative flex items-center p-4 rounded-2xl border-2 transition-all ${p.id === winnerId ? 'bg-yellow-50 border-yellow-200 shadow-md transform scale-[1.02]' : 'bg-slate-50 border-transparent'}`}>
                    {idx === 0 && <div className="absolute -top-3 -right-2 text-2xl">👑</div>}
                    
                    <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-full mr-4 text-sm ${idx === 0 ? 'bg-yellow-400 text-white shadow-yellow-200 shadow-lg' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {p.name} 
                        {p.id === myPlayerId && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">SIZ</span>}
                        {p.isBot && <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">BOT</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         {p.totalTime.toFixed(1)} sek
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-indigo-600 leading-none">{p.score}</div>
                       <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Ball</div>
                    </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <h3 className="font-bold text-slate-400 uppercase text-xs mb-4">Keyingi o'yin</h3>
              <button onClick={handleRestart} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl active-press shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">
                 Qayta o'ynash (Restart)
              </button>
              <button onClick={onBack} className="w-full mt-3 py-3 text-slate-400 font-bold text-xs hover:text-slate-600">
                 Menyuga qaytish
              </button>
           </div>
        </div>

        {/* CHAT */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px] lg:h-auto overflow-hidden">
           <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50">Chat</div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth">
              {messages.length === 0 && (
                <div className="text-center text-slate-300 text-sm py-10 italic">Suhbatni boshlang...</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.playerId === myPlayerId ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.playerName}</span>
                      <span className="text-[8px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.playerId === myPlayerId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                     {msg.text}
                   </div>
                </div>
              ))}
           </div>
           <div className="p-3 border-t border-slate-100 flex gap-2 bg-white">
             <input 
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder="Xabar yozish..."
               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
             />
             <button onClick={handleSendMessage} className="p-3 bg-indigo-600 text-white rounded-xl active-press hover:bg-indigo-700 transition-colors">
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