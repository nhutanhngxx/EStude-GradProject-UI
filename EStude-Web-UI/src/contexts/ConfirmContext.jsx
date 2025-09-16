import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmModal from "../components/common/ConfirmModal";

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        onConfirm: (result) => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(result);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={() => modalState.onConfirm(true)}
        onCancel={() => modalState.onConfirm(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
