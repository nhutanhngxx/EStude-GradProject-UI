// contexts/SubmissionContext.js
import React, { createContext, useContext, useState } from "react";

const defaultState = {
  submissionId: null,
  score: null,
  totalQuestions: null,
  correctCount: null,
  accuracy: null,
  aiResult: null,
  isAnalyzing: false,
  feedback: [],
  recommendations: null,
};

const SubmissionContext = createContext(undefined);

export const SubmissionProvider = ({ children }) => {
  const [state, setState] = useState(defaultState);

  const setResult = (data) => {
    setState((prev) => ({ ...prev, ...data }));
  };

  const reset = () => {
    setState(defaultState);
  };

  return (
    <SubmissionContext.Provider value={{ ...state, setResult, reset }}>
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmission = () => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error("useSubmission must be used within SubmissionProvider");
  }
  return context;
};
