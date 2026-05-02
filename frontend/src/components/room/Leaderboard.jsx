import { useRoom } from '../../context/RoomContext';

export default function Leaderboard() {
  const { leaderboard, myUsername } = useRoom();

  return (
    <div className="flex flex-col h-full bg-[#161b27] border-l border-gray-800 animate-in">
      <div className="p-4 border-b border-gray-800 bg-[#1e2535]">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🏆 Live Leaderboard
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leaderboard.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">No scores yet</p>
        )}
        
        {leaderboard.map((user, idx) => {
          const isMe = user.username === myUsername;
          const isFirst = idx === 0 && user.score > 0;
          
          return (
            <div 
              key={user.socketId || user.username}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isMe 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-[#1e2535] border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isFirst ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {isFirst ? '👑' : `#${idx + 1}`}
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {user.username}
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500 text-white leading-none">YOU</span>}
                  </div>
                  {!user.isConnected && <div className="text-xs text-red-400">Disconnected</div>}
                </div>
              </div>
              
              <div className="font-mono font-bold text-lg text-indigo-300">
                {user.score || 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
