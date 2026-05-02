import { useState, useRef, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import axios from 'axios';

export default function AIChat() {
  const { roomCode } = useRoom();
  // Manage AI history separately from the group chat history if desired, 
  // or fetch room info. The backend `aiChat` endpoint returns the answer.
  // Wait, the backend currently pushes to `room.chatHistory` and broadcasts `chat:message`.
  // The Prompt requires AI chat to be distinct from normal chat, so displaying it perfectly.
  const [messages, setMessages] = useState([
    { sender: 'AI Tutor', content: 'Hi there! Im your AI Tutor. Ask me any questions about the uploaded study notes!', isAI: true }
  ]);
  const [input, setInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isAsking) return;

    const query = input.trim();
    setInput('');
    
    // Add User query locally
    setMessages(prev => [...prev, { sender: 'You', content: query, isAI: false }]);
    setIsAsking(true);

    try {
      // Hit the AI endpoint
      const { data } = await axios.post(`/api/rooms/${roomCode}/ai-chat`, { question: query });
      
      // Add the response from AI locally (the backend might broadcast it to the main chat too
      // but if the UI is separated, users can see it here)
      setMessages(prev => [...prev, { sender: 'AI Tutor', content: data.answer, isAI: true }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'AI Tutor', content: 'Sorry, I encountered an error. Is the PDF uploaded?', isAI: true, isError: true }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b27] animate-in relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, i) => {
          const isAI = msg.isAI;
          return (
            <div key={i} className={`flex flex-col ${!isAI ? 'items-end' : 'items-start'}`}>
              <span className={`text-xs mb-1 mx-1 font-bold ${isAI ? 'text-indigo-400 flex items-center gap-1' : 'text-gray-500'}`}>
                {isAI ? `✨ ${msg.sender}` : msg.sender}
              </span>
              <div className={`px-4 py-3 rounded-2xl max-w-[90%] break-words text-sm shadow-sm ${
                !isAI 
                  ? 'bg-purple-600 text-white rounded-tr-sm' 
                  : msg.isError 
                    ? 'bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-sm'
                    : 'bg-[#1e2535] border border-indigo-500/20 text-gray-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {isAsking && (
          <div className="flex flex-col items-start max-w-[90%]">
             <span className="text-xs text-indigo-400 font-bold mb-1 ml-1 flex items-center gap-1">✨ AI Tutor</span>
             <div className="bg-[#1e2535] border border-indigo-500/20 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-[#0f1117]">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="input flex-1 bg-[#161b27] border-indigo-500/30 focus:border-indigo-400 placeholder:text-indigo-300/30" 
            placeholder="Ask about the notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isAsking}
          />
          <button 
            type="submit" 
            className="btn bg-indigo-600 hover:bg-indigo-500 text-white px-4 aspect-square flex items-center justify-center p-0 rounded-xl"
            disabled={!input.trim() || isAsking}
          >
            ✨
          </button>
        </div>
      </form>
    </div>
  );
}
