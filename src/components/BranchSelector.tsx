import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBranches, type Branch } from '../lib/api';
import { ChevronDown } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

export function BranchSelector() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { branchSlug, setBranchSlug } = useBranch();

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  const handleBranchChange = (newBranchSlug: string) => {
    if (newBranchSlug !== branchSlug) {
      setBranchSlug(newBranchSlug);
      
      const pathParts = window.location.pathname.split('/');
      const isGlobalPage = pathParts.length < 3 || pathParts[1] === 'branches' || pathParts[1] === 'permissions' || pathParts[1] === 'my-info' || pathParts[1] === 'developer' || pathParts[1] === 'search-management';

      if (isGlobalPage) {
        navigate(`/${newBranchSlug}`);
      } else {
        pathParts[1] = newBranchSlug;
        navigate(pathParts.join('/'));
      }
    }
    setIsOpen(false);
  };

  const currentBranch = branches.find(b => b.slug === branchSlug);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-outline justify-between min-w-[180px]"
      >
        {currentBranch?.name || branchSlug || '지점 선택'}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg py-1 z-10">
          {branches.map(branch => (
            <button
              key={branch.slug}
              onClick={() => handleBranchChange(branch.slug)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
