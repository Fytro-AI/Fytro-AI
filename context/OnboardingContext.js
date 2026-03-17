import React, { createContext, useState } from 'react';

export const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [prefs, setPrefs] = useState({
    age: '',
    weight: '',
    gender: '',
    level: '',
    goal: '',
    trainingDays: [],
    split: '',
    access: '',
    custom: '',
  });
  return (
    <OnboardingContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </OnboardingContext.Provider>
  );
}
