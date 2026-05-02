import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

export default function Results() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // We need to tell the server to end the session first if we navigated here via the button
        await axios.post(`/api/rooms/${roomCode}/end`).catch(() => {});
        const { data } = await axios.get(`/api/sessions/${roomCode}`);
        setSession(data.session);
      } catch (err) {
        console.error(err);
        setError('Failed to load session results.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [roomCode]);

  if (loading) return <div className="h-screen flex flex-col"><Navbar /><Loading message="Tallying final results..." /></div>;
  if (error) return <div className="h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center text-red-400">{error}</div></div>;
  if (!session) return null;

  const sortedParticipants = [...session.participants].sort((a, b) => b.score - a.score);
  const winner = sortedParticipants.length > 0 ? sortedParticipants[0] : null;

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 animate-in space-y-8">
        
        {/* Banner */}
        <div className="card p-10 text-center relative overflow-hidden border-indigo-500/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">Study Session Complete!</h1>
          <p className="text-gray-400 mb-8">{session.roomName} • {session.roomCode}</p>

          {winner && winner.score > 0 && (
            <div className="inline-block bg-[#161b27] border border-yellow-500/30 px-8 py-6 rounded-2xl animate-pulse-glow">
              <div className="text-4xl mb-2">👑</div>
              <p className="text-sm font-semibold text-yellow-500 tracking-wider uppercase mb-1">Quiz Champion</p>
              <p className="text-3xl font-bold text-white mb-2">{winner.username}</p>
              <p className="text-2xl font-mono text-indigo-300">{winner.score} pts</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🏆 Final Leaderboard</h2>
              <div className="space-y-2">
                {sortedParticipants.map((p, i) => (
                  <div key={i} className="flex justify-between p-4 bg-[#161b27] rounded-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 font-bold w-4">{i + 1}.</span>
                      <span className="font-semibold text-gray-200">{p.username}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-400">{p.score} pt</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 border-red-500/20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">⚠️ Weak Topics to Review</h2>
              {session.weakTopics?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {session.weakTopics.map((topic, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-300 text-sm font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No specific weak topics detected. Great job!</p>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="card p-6 bg-indigo-900/10 mb-8">
               <h2 className="text-xl font-bold mb-6">📊 Global Stats</h2>
               <div className="space-y-6">
                 <div>
                   <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Pomodoros</p>
                   <p className="text-4xl font-light font-mono text-white">{session.totalPomodoros}</p>
                 </div>
                 <div>
                   <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Study Minutes</p>
                   <p className="text-4xl font-light font-mono text-white">{session.totalStudyMins}</p>
                 </div>
                 <div>
                   <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Participants</p>
                   <p className="text-4xl font-light font-mono text-white">{session.participants.length}</p>
                 </div>
               </div>
            </div>

            <button onClick={() => navigate('/')} className="btn btn-primary w-full py-4 text-base">
              Create New Room
            </button>
            <button onClick={() => navigate('/')} className="btn btn-ghost w-full py-4 text-base mt-4">
              Back to Home
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
