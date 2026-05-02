import { useState, useRef, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import axios from 'axios';

export default function GroupChat({ sendChatMessage }) {
  const { chatMessages, myUsername, roomCode } = useRoom();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput('');
    sendChatMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-[#161b27] animate-in">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">
            Say hello to start the chat!
          </div>
        ) : (
          chatMessages
            .filter(msg => !msg.isAI)
            .map((msg, i) => {
            const isMe = msg.sender === myUsername;
            
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-500 mb-1 mx-1">{msg.sender}</span>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words text-sm ${
                  isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-[#0f1117]">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="input flex-1 bg-[#161b27]" 
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary px-4 aspect-square flex items-center justify-center p-0 rounded-xl"
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}
