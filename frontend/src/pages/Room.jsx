import { useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import Lobby from './Lobby';
import PomodoroTimer from '../components/room/PomodoroTimer';
import QuizPanel from '../components/room/QuizPanel';
import Whiteboard from '../components/room/Whiteboard';
import GroupChat from '../components/room/GroupChat';
import AIChat from '../components/room/AIChat';
import Leaderboard from '../components/room/Leaderboard';
import { useRoom } from '../context/RoomContext';
import { useSocket } from '../hooks/useSocket';

export default function Room() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get('username');
  const isHostQuery = searchParams.get('isHost') === 'true';

  const { roomName, members, isHost, setIsHost, setMyUsername, setRoomCode, setRoomName } = useRoom();

  const [activeTab, setActiveTab] = useState('timer');
  const [chatTab, setChatTab] = useState('group'); // group | ai
  const [sessionStarted, setSessionStarted] = useState(false);

  const whiteboardRef = useRef(null);

  // Hook handles socket connect/listeners automatically
  const {
    startSession,
    startTimer, pauseTimer, resumeTimer, completeTimer,
    submitAnswer, sendDraw, sendChatMessage, startQuiz, nextQuestion
  } = useSocket(
    roomCode, 
    username, 
    isHostQuery, 
    (payload) => whiteboardRef.current?.drawStroke(payload),
    () => setSessionStarted(true)
  );

  // Hydrate context on mount
  useState(() => {
    if (!username) { navigate('/'); return; }
    setRoomCode(roomCode);
    setMyUsername(username);
    setIsHost(isHostQuery);
  });

  const handleStartSession = () => {
    startSession();
  };

  const tabs = [
    { id: 'timer', icon: '⏱️', label: 'Pomodoro' },
    { id: 'quiz', icon: '📝', label: 'Notes & AI Quiz' },
    { id: 'whiteboard', icon: '🎨', label: 'Whiteboard' }
  ];

  if (!members.length) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <Loading message="Joining room..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      {!sessionStarted && isHostQuery ? (
        <Lobby onStartSession={handleStartSession} />
      ) : !sessionStarted && !isHostQuery && members.length > 0 ? (
        <Lobby onStartSession={handleStartSession} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="flex-1 relative overflow-hidden z-10 m-4 rounded-2xl glass-panel shadow-2xl">
              {activeTab === 'timer' && (
                <div className="animate-in h-full">
                  <PomodoroTimer 
                    startTimer={startTimer} 
                    pauseTimer={pauseTimer} 
                    resumeTimer={resumeTimer} 
                    completeTimer={completeTimer} 
                  />
                </div>
              )}
              {activeTab === 'quiz' && (
                <div className="animate-in h-full">
                  <QuizPanel 
                    startQuiz={startQuiz} 
                    nextQuestion={nextQuestion} 
                    submitAnswer={submitAnswer} 
                  />
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ opacity: activeTab === 'whiteboard' ? 1 : 0, pointerEvents: activeTab === 'whiteboard' ? 'auto' : 'none', zIndex: activeTab === 'whiteboard' ? 10 : -1 }}>
                <Whiteboard ref={whiteboardRef} sendDraw={sendDraw} />
              </div>
            </div>

            <div className="h-24 bg-[rgba(10,10,10,0.8)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.05)] flex items-center justify-center gap-3 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col w-32 items-center justify-center h-16 rounded-xl transition-all duration-300 ease-out relative group overflow-hidden ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-t from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] transform -translate-y-1' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent blur-0'
                  }`}
                >
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ${activeTab === tab.id ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></div>
                  <span className={`text-2xl mb-1 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                  <span className="text-xs font-semibold tracking-wide">{tab.label}</span>
                </button>
              ))}
              
              {isHost && (
                <div className="mx-4 w-px h-12 bg-white/10"></div>
              )}
              {isHost && (
                <button 
                  onClick={() => window.confirm('End session and view results?') && navigate(`/room/${roomCode}/results`)}
                  className="btn btn-danger py-2 px-5 h-16 flex flex-col justify-center rounded-xl relative overflow-hidden group shadow-lg shadow-red-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-sm font-bold leading-none tracking-wide z-10">End & View</span>
                  <span className="text-[10px] opacity-80 mt-1.5 uppercase font-semibold tracking-widest z-10">Results</span>
                </button>
              )}
            </div>

          </div>

          <div className="w-80 shrink-0 z-20 flex flex-col bg-[#0f1117] border-l border-gray-800">
            <div className="flex-1 flex flex-col min-h-0">
               
               {/* Segmented Control Header */}
               <div className="flex bg-[#161b27] border-b border-gray-800 p-2 shrink-0">
                  <div className="flex w-full bg-black/40 rounded-lg overflow-hidden border border-gray-800 relative">
                     <div 
                        className={`absolute top-0 bottom-0 w-1/2 bg-gray-800 rounded-md shadow-sm transition-transform duration-300 ease-out ${chatTab === 'group' ? 'translate-x-0' : 'translate-x-full'}`}
                     ></div>
                     <button
                        className={`flex-1 py-1.5 text-xs font-semibold z-10 transition-colors ${chatTab === 'group' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setChatTab('group')}
                     >
                        Chat
                     </button>
                     <button
                        className={`flex-1 py-1.5 text-xs font-semibold z-10 flex items-center justify-center gap-1 transition-colors ${chatTab === 'ai' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setChatTab('ai')}
                     >
                        ✨ AI Tutor
                     </button>
                  </div>
               </div>

               <div className="flex-1 min-h-0 border-b border-gray-800 relative">
                  {chatTab === 'group' ? (
                    <GroupChat sendChatMessage={sendChatMessage} />
                  ) : (
                    <AIChat />
                  )}
               </div>
               <div className="h-1/3 min-h-[250px]">
                  <Leaderboard />
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
