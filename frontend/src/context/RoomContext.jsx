import { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [members, setMembers] = useState([]);
  const [timerState, setTimerState] = useState({
    isRunning: false,
    remainingSeconds: 25 * 60,
    duration: 25,
    type: 'focus',
    sessionCount: 0,
  });
  const [quiz, setQuiz] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [myUsername, setMyUsername] = useState('');
  const [quizReady, setQuizReady] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answerResult, setAnswerResult] = useState(null); // { isCorrect, correctIndex, explanation }
  const [pdfText, setPdfText] = useState(''); // Track if PDF has been uploaded

  const appendChat = (msg) =>
    setChatMessages((prev) => [...prev, msg]);

  return (
    <RoomContext.Provider
      value={{
        roomCode, setRoomCode,
        roomName, setRoomName,
        members, setMembers,
        timerState, setTimerState,
        quiz, setQuiz,
        currentQuestion, setCurrentQuestion,
        currentQuestionIdx, setCurrentQuestionIdx,
        leaderboard, setLeaderboard,
        chatMessages, setChatMessages, appendChat,
        isHost, setIsHost,
        myUsername, setMyUsername,
        quizReady, setQuizReady,
        quizStarted, setQuizStarted,
        answerResult, setAnswerResult,
        pdfText, setPdfText,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}
