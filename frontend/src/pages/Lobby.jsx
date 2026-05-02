import { useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { useNavigate } from 'react-router-dom';

export default function Lobby({ onStartSession }) {
  const { roomName, roomCode, members, isHost, myUsername } = useRoom();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
      <div className="card max-w-2xl w-full p-8 text-center animate-in">
        
        <div className="inline-block bg-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-sm font-semibold tracking-widest mb-4">
          WAITING FOR OTHERS
        </div>
        
        <h1 className="text-4xl font-bold mb-2">{roomName}</h1>
        
        <div className="flex items-center justify-center gap-4 my-8 bg-[#161b27] py-6 rounded-2xl border border-gray-800">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Room Code</p>
            <p className="text-5xl font-mono tracking-widest font-bold text-white">{roomCode}</p>
          </div>
        </div>

        <div className="mb-10 text-left">
          <p className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Who's Here ({members.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div 
                key={m.socketId || m.username} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${m.username === myUsername ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-gray-800/50'}`}
              >
                <div className={`w-2 h-2 rounded-full ${m.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{m.username}</span>
                {m.username === myUsername && <span className="text-xs text-indigo-400 ml-1">(You)</span>}
              </div>
            ))}
            {members.length === 1 && (
              <div className="px-4 py-2 rounded-xl border border-dashed border-gray-700 text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-gray-500 animate-spin"></div>
                Waiting for friends...
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800">
          {isHost ? (
            <button onClick={onStartSession} className="btn btn-primary w-full py-4 text-lg">
              Start Study Session
            </button>
          ) : (
            <div className="text-gray-400 font-medium py-2">
              Waiting for the host to start the session...
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
