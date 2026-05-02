import { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';

export default function PomodoroTimer({ startTimer, pauseTimer, resumeTimer, completeTimer }) {
  const { timerState, isHost } = useRoom();
  const [showSettings, setShowSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);
  const [customType, setCustomType] = useState('focus');

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalSeconds = (timerState.duration || 25) * 60;
  const progress =
    timerState.isRunning || timerState.remainingSeconds < totalSeconds
      ? (totalSeconds - timerState.remainingSeconds) / totalSeconds
      : 0;

  useEffect(() => {
    if (timerState.remainingSeconds === 0 && timerState.isRunning) {
      if (isHost) {
        completeTimer();
      }
    }
  }, [timerState.remainingSeconds, timerState.isRunning, isHost, completeTimer]);

  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - progress * circumference;

  const handleStart = () => {
    startTimer(customDuration, customType);
    setShowSettings(false);
  };

  const handleSkip = () => {
    completeTimer();
    setShowSettings(true);
  };

  const presetDurations = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '25 min', value: 25 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '50 min', value: 50 },
    { label: '60 min', value: 60 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-prism-in">
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          {timerState.type === 'focus' ? '🎯 Focus Session' : '☕ Break Time'}
        </h2>
        <p className="text-gray-400 font-medium">Session #{timerState.sessionCount + 1}</p>
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center w-[300px] h-[300px] mb-12">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="150" cy="150" r={circleRadius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12" fill="transparent"
          />
          <circle
            cx="150" cy="150" r={circleRadius}
            stroke={timerState.type === 'focus' ? '#6366f1' : '#10b981'}
            strokeWidth="12" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: timerState.type === 'focus' 
                ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' 
                : 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-6xl text-white font-mono font-black tracking-tighter">
            {formatTime(timerState.remainingSeconds)}
          </span>
          <span className="text-xs text-gray-500 font-black uppercase tracking-widest mt-2">
            {timerState.type === 'focus' ? 'Focus' : 'Break'}
          </span>
        </div>
      </div>

      {isHost ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          
          {/* Settings Panel */}
          {showSettings && !timerState.isRunning && (
            <div className="w-full prism-card p-6 animate-prism-in bg-black/60">
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-widest">Timer Settings</h3>
              
              {/* Session Type */}
              <div className="mb-6">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Session Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCustomType('focus')}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      customType === 'focus'
                        ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400'
                        : 'bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    🎯 Focus Session
                  </button>
                  <button
                    onClick={() => setCustomType('break')}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      customType === 'break'
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-2 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    ☕ Break Time
                  </button>
                </div>
              </div>

              {/* Duration Presets */}
              <div className="mb-6">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {presetDurations.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setCustomDuration(preset.value)}
                      className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                        customDuration === preset.value
                          ? 'bg-indigo-500/20 border border-indigo-500 text-indigo-400'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Duration Input */}
              <div className="mb-6">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Custom Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="Enter minutes..."
                />
              </div>

              <button
                onClick={handleStart}
                className="w-full btn-prism btn-prism-primary py-4 text-base font-black uppercase tracking-widest"
              >
                Start {customDuration} min {customType === 'focus' ? 'Focus' : 'Break'}
              </button>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4">
            {!timerState.isRunning ? (
              <>
                {timerState.remainingSeconds > 0 && timerState.remainingSeconds < totalSeconds ? (
                  <button 
                    className="btn-prism btn-prism-primary px-10 py-4 text-lg font-black uppercase tracking-widest"
                    onClick={resumeTimer}
                  >
                    ▶ Resume
                  </button>
                ) : (
                  <button 
                    className="btn-prism btn-prism-primary px-10 py-4 text-lg font-black uppercase tracking-widest"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    {showSettings ? '✕ Close' : '⚙ Configure & Start'}
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  className="btn-prism btn-prism-secondary px-10 py-4 text-lg font-black uppercase tracking-widest border-2"
                  onClick={pauseTimer}
                >
                  ⏸ Pause
                </button>
                <button 
                  className="px-10 py-4 text-lg font-black uppercase tracking-widest rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  onClick={handleSkip}
                >
                  ⏭ Skip
                </button>
              </>
            )}
          </div>

          {!showSettings && !timerState.isRunning && timerState.remainingSeconds === totalSeconds && (
            <p className="text-gray-500 text-sm font-medium">
              Click "Configure & Start" to set up your timer
            </p>
          )}
        </div>
      ) : (
        <div className="prism-card px-8 py-4 bg-black/40 border-indigo-500/20">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            {timerState.isRunning ? '⏱ Timer is running' : '⏸ Waiting for host to start'}
          </p>
        </div>
      )}
      
    </div>
  );
}
