import { Link, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { roomCode } = useRoom();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0f1117] sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-white no-underline hover:text-white">
          <span className="text-2xl">🧠</span> BrainRoom
        </Link>
        {roomCode && (
          <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">In Room: {roomCode}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dashboard</Link>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-400">Logout</button>
          </>
        ) : (
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Log In</Link>
        )}
        <Link to="/" className="btn btn-primary text-sm py-2 px-4 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
          Create Room
        </Link>
      </div>
    </nav>
  );
}
