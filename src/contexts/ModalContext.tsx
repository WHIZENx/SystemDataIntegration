import { createContext, useState, useContext, ReactNode } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

interface ModalContextType {
  showConfirmation: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    resolveRef: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    resolveRef: null,
  });

  const showConfirmation = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolveRef: resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.resolveRef) {
      modalState.resolveRef(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolveRef: null }));
  };

  const handleCancel = () => {
    if (modalState.resolveRef) {
      modalState.resolveRef(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolveRef: null }));
  };

  return (
    <ModalContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        type={modalState.type}
      />
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
