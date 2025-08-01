import { useState, useEffect } from 'react';

interface UseTimerReturn {
  timeLeft: number;
  isActive: boolean;
  start: () => void;
  pause: () => void;
  reset: (initialTime?: number) => void;
}

const useTimer = (initialTime: number = 0): UseTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const start = () => {
    setIsActive(true);
  };

  const pause = () => {
    setIsActive(false);
  };

  const reset = (newInitialTime?: number) => {
    const timeToReset = newInitialTime !== undefined ? newInitialTime : initialTime;
    setTimeLeft(timeToReset);
    setIsActive(false);
  };

  return { timeLeft, isActive, start, pause, reset };
};

export default useTimer; 