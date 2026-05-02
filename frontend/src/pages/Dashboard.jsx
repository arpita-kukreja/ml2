import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get('/api/rooms/user');
        setRooms(data.rooms);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  if (loading || fetching) return <div className="h-screen flex flex-col"><Navbar /><Loading message="Loading dashboard..." /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 animate-in space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Welcome, {user.username} 👋</h1>
            <p className="text-gray-400">Your study dashboard and saved sessions.</p>
          </div>
          <Link to="/" className="btn btn-primary px-8">Create New Room</Link>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            📚 Hosted Study Sessions
          </h2>
          
          {rooms.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-gray-700 bg-transparent flex flex-col items-center justify-center">
              <div className="text-5xl mb-4 opacity-50">🪴</div>
              <h3 className="text-xl font-bold text-gray-300">No rooms yet</h3>
              <p className="text-gray-500 mt-2 max-w-md">You haven't hosted any study sessions. Click 'Create New Room' to start learning collaboratively.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <div key={room._id} className="card p-6 border-gray-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-gray-400 rounded-md tracking-wider">
                        {new Date(room.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">
                        {room.roomCode}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors">
                      {room.roomName}
                    </h3>
                    
                    <p className="text-sm text-gray-400 mb-6 truncate leading-relaxed">
                       {room.pdfText ? 'Includes PDF notes & AI Quiz.' : 'No notes uploaded.'} <br/>
                       {room.chatHistory?.length || 0} discussion messages.
                     </p>
                  </div>
                  
                  <Link to={`/room/${room.roomCode}/results`} className="btn bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm py-2">
                    Review Notes & Quiz
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
