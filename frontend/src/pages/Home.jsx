import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [createName, setCreateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) setJoinName(user.username);
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreating(true);
    try {
      const { data } = await axios.post('/api/rooms/create', { roomName: createName });
      navigate(`/room/${data.roomCode}?username=Host&isHost=true`);
    } catch (err) {
      console.error(err);
      alert('Failed to create room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim()) return;
    
    setJoinError('');
    setIsJoining(true);
    try {
      const code = joinCode.toUpperCase();
      await axios.get(`/api/rooms/${code}`);
      navigate(`/room/${code}?username=${encodeURIComponent(joinName)}&isHost=false`);
    } catch (err) {
      if (err.response?.status === 404) {
        setJoinError('Room not found or expired.');
      } else {
        setJoinError('Failed to join room.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col justify-center pb-20 z-10">
        <div className="text-center mb-16 animate-in">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-6 backdrop-blur-md">
            ✨ Premium Collaborative Learning
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            BrainRoom,<br />But Better.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Generate AI quizzes from your notes, sync Pomodoro timers instantly, and compete on the live leaderboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="card glass-panel p-8 animate-in group relative" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
            
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-lg shadow-indigo-500/10">
              🚀
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Create a Room</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">You'll be the host. You can upload PDF notes and control the timer & quiz. {user ? '' : 'Log in to save history.'}</p>
            
            <form onSubmit={handleCreate} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Bio 101 Midterm Prep"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  maxLength={30}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full py-3 text-base shadow-lg shadow-indigo-500/20"
                disabled={!createName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>

          <div className="card glass-panel p-8 animate-in group relative" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>

            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-lg shadow-emerald-500/10">
              👋
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Join a Room</h2>
            <p className="text-gray-400 mb-6 text-sm">Enter the 6-letter room code from your host to join their study session.</p>
            
            <form onSubmit={handleJoin} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Room Code</label>
                  <input 
                    type="text" 
                    className="input uppercase tracking-widest font-mono" 
                    placeholder="ABCDEF"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Your Name"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
              
              {joinError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {joinError}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn bg-white/5 hover:bg-white/10 border border-white/10 text-white w-full py-3 text-base shadow-lg shadow-black/20"
                disabled={!joinCode.trim() || !joinName.trim() || isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
