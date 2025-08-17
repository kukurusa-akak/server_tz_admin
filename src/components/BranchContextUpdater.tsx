import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useBranch } from '../context/BranchContext';

export const BranchContextUpdater = () => {
  const { branchSlug: urlSlug } = useParams<{ branchSlug: string }>();
  const { branchSlug: contextSlug, setBranchSlug } = useBranch();

  useEffect(() => {
    if (urlSlug && urlSlug !== contextSlug) {
      setBranchSlug(urlSlug);
    }
  }, [urlSlug, contextSlug, setBranchSlug]);

  return <Outlet />;
};
