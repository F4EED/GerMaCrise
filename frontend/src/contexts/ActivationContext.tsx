import { createContext, useContext, useState, ReactNode } from 'react';

  export interface Activation {
    id: number;
    titre: string;
    type?: string;
    date_creation?: string;
    date_cloture?: string;
    status?: string;
    responsable?: string;
    redacteur?: string;
    structure_implique?: string;
    commune?: string;
    code_departement?: string;
    code_commune?: string;
    secteur?: string;
    description_creation_activation?: string;
    actif: boolean;
  }

interface ActivationContextType {
  selectedActivation: Activation | null;
  setSelectedActivation: (activation: Activation | null) => void;
  clearSelectedActivation: () => void;
}

const ActivationContext = createContext<ActivationContextType | undefined>(undefined);

export const ActivationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedActivation, setSelectedActivation] = useState<Activation | null>(() => {
    // Charger depuis localStorage au démarrage
    const saved = localStorage.getItem('selectedActivation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleSetSelectedActivation = (activation: Activation | null) => {
    setSelectedActivation(activation);
    // Sauvegarder dans localStorage pour persister entre les sessions
    if (activation) {
      localStorage.setItem('selectedActivation', JSON.stringify(activation));
    } else {
      localStorage.removeItem('selectedActivation');
    }
  };

  const clearSelectedActivation = () => {
    setSelectedActivation(null);
    localStorage.removeItem('selectedActivation');
  };

  return (
    <ActivationContext.Provider
      value={{
        selectedActivation,
        setSelectedActivation: handleSetSelectedActivation,
        clearSelectedActivation,
      }}
    >
      {children}
    </ActivationContext.Provider>
  );
};

export const useActivation = () => {
  const context = useContext(ActivationContext);
  if (context === undefined) {
    throw new Error('useActivation must be used within an ActivationProvider');
  }
  return context;
};

