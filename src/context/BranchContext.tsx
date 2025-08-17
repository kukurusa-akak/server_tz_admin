import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface BranchContextType {
  branchSlug: string | null;
  setBranchSlug: (slug: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [branchSlug, setBranchSlugState] = useState<string | null>(() => {
    return localStorage.getItem('currentBranchSlug') || 'bupyeong';
  });

  useEffect(() => {
    if (branchSlug) {
      localStorage.setItem('currentBranchSlug', branchSlug);
    }
  }, [branchSlug]);

  const setBranchSlug = (slug: string) => {
    setBranchSlugState(slug);
  };

  return (
    <BranchContext.Provider value={{ branchSlug, setBranchSlug }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
