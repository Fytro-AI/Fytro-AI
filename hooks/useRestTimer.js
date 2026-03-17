import { useState, useEffect, useRef } from "react";

export function useRestTimer(defaultSeconds = 120) {
  const [endTime, setEndTime] = useState(null);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || !endTime) return;

    intervalRef.current = setInterval(() => {
      const newRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setEndTime(null);
        setRemaining(defaultSeconds);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, endTime, defaultSeconds]);

  const start = (seconds = defaultSeconds) => {
    const newEnd = Date.now() + seconds * 1000;
    setEndTime(newEnd);
    setRemaining(seconds);
    setRunning(true);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(defaultSeconds);
    setEndTime(null);
  };

  return { remaining, running, start, reset };
}
