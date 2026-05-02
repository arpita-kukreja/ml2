import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRoom } from '../../context/RoomContext';

export default function QuizPanel({ startQuiz, nextQuestion, submitAnswer }) {
  const { roomCode, isHost, quizReady, quizStarted, currentQuestion, currentQuestionIdx, answerResult, quiz } = useRoom();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  if (!quizReady) {
    const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('roomCode', roomCode);

      setIsUploading(true);
      setUploadError('');
      
      try {
        await axios.post(`/api/rooms/${roomCode}/upload`, formData);
        // The server emits quiz:ready, so State will update automatically.
      } catch (err) {
        console.error(err);
        setUploadError(err.response?.data?.message || 'Failed to process PDF.');
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in">
        <h2 className="text-2xl font-bold mb-6">Upload Study Notes</h2>
        <div 
          className="w-full max-w-md border-2 border-dashed border-gray-600 rounded-2xl p-10 hover:border-indigo-500 transition-colors bg-[#161b27] cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-4">📄</div>
          <p className="text-white font-medium mb-1">Click or drag PDF here</p>
          <p className="text-gray-400 text-sm">Max 10MB. The AI will read it and generate a quiz.</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileChange} 
          />
        </div>
        
        {isUploading && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-medium">Reading notes and generating quiz... this takes a moment.</p>
          </div>
        )}

        {uploadError && <p className="mt-4 text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{uploadError}</p>}
      </div>
    );
  }

  // 2. Ready View
  if (quizReady && !quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in">
        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mb-6">✅</div>
        <h2 className="text-2xl font-bold mb-2">Quiz is Ready!</h2>
        <p className="text-gray-400 mb-8">The AI has prepared questions from the uploaded notes.</p>
        
        {isHost ? (
          <button className="btn btn-primary px-8 py-3" onClick={startQuiz}>
            Start Quiz Now
          </button>
        ) : (
          <p className="text-gray-400 italic bg-[#161b27] px-6 py-3 rounded-full">Waiting for host to start...</p>
        )}
      </div>
    );
  }

  // 3. Quiz Complete
  if (quizStarted && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in">
        <h2 className="text-3xl font-bold mb-4 text-white">Quiz Finished! 🎉</h2>
        <p className="text-gray-400 mb-8">Great job everyone. Check the leaderboard to see the final results.</p>
      </div>
    );
  }

  // 4. Question View
  // Start countdown on new question
  useEffect(() => {
    if (currentQuestion && !answerResult) {
      setSelectedAnswer(null);
      setTimeLeft(30);
      startTimeRef.current = Date.now();
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto submit if time ran out and hasn't answered
            if (selectedAnswer === null) {
              handleAnswer(-1); // -1 means missed
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestion, answerResult]);

  const handleAnswer = (idx) => {
    if (selectedAnswer !== null || answerResult !== null) return;
    
    setSelectedAnswer(idx);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    submitAnswer(currentQuestionIdx, idx, timeTaken);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getOptionClasses = (idx) => {
    let classes = "w-full text-left p-4 rounded-xl border-2 transition-all ";
    
    if (answerResult) {
      // Result revealed
      if (idx === answerResult.correctIndex) {
        classes += "bg-green-500/20 border-green-500 text-green-100";
      } else if (idx === selectedAnswer) {
        classes += "bg-red-500/20 border-red-500 text-red-100";
      } else {
        classes += "bg-[#161b27] border-gray-800 text-gray-500 opacity-50";
      }
    } else {
      // Voting
      if (idx === selectedAnswer) {
        classes += "bg-indigo-500/20 border-indigo-500 text-indigo-100";
      } else {
        classes += "bg-[#1e2535] border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-[#252d40]";
      }
    }
    return classes;
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-3xl mx-auto w-full animate-in">
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-400 font-medium tracking-wide">Question {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}</span>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#161b27] flex items-center justify-center border border-gray-700 font-mono font-bold">
            {timeLeft}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        ></div>
      </div>

      <h3 className="text-2xl font-bold leading-snug mb-8 text-white">
        {currentQuestion.question}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {currentQuestion.options.map((opt, i) => (
          <button 
            key={i} 
            className={getOptionClasses(i)}
            onClick={() => handleAnswer(i)}
            disabled={answerResult !== null}
          >
            {opt}
          </button>
        ))}
      </div>

      {answerResult && (
        <div className={`p-4 rounded-xl mb-6 ${answerResult.isCorrect ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          <p className="font-bold mb-1">{answerResult.isCorrect ? '✨ Correct! +10 Points' : '❌ Incorrect'}</p>
          <p className="text-sm opacity-90">{answerResult.explanation}</p>
        </div>
      )}

      {isHost && answerResult !== null && (
        <div className="mt-auto text-right border-t border-gray-800 pt-4">
          <button 
            className="btn btn-primary px-8"
            onClick={() => nextQuestion(currentQuestionIdx + 1)}
          >
            {currentQuestionIdx + 1 >= currentQuestion.totalQuestions ? 'Finish Quiz' : 'Next Question ➡'}
          </button>
        </div>
      )}

    </div>
  );
}
