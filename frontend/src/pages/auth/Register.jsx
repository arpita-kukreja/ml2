import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return setError('All fields are required.');
    
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1117]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in">
        
        <div className="card max-w-md w-full p-8 border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-white text-center">Create an Account</h2>
          <p className="text-gray-400 text-center mb-8 text-sm">Sign up to host rooms, save your history, and review AI generated notes.</p>
          
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input 
                type="text" 
                className="input" 
                placeholder="StudyBuddy99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input 
                type="email" 
                className="input" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3 mt-4" disabled={loading}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
