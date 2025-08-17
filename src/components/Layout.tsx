import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, GitMerge, ChevronDown, UserCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { BranchSelector } from "./BranchSelector";
import { useAuth } from "../context/AuthContext";
import { getNavigationLinks, type NavigationLink } from "../lib/api";
import { useState, useEffect } from "react";

const NavItem = ({ item, isCollapsed, onExpand }: { item: NavigationLink, isCollapsed: boolean, onExpand: () => void }) => {
  const [isOpen, setIsOpen] = useState(true); 
  const location = useLocation();
  const navigate = useNavigate();
  const IconComponent = item.icon ? (LucideIcons[item.icon as keyof typeof LucideIcons]) : GitMerge;
  const Icon = IconComponent || GitMerge; // Fallback to a default icon if not found
  if (!IconComponent && item.icon) {
    console.warn(`[Layout] Icon not found for key: "${item.icon}". Using default.`);
  }

  const homepageChild = item.children?.find(child => child.isHomepage);
  const isParentActive = item.children?.some(child => location.pathname.endsWith(child.path)) || false;

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  const handleParentClick = () => {
    if (isCollapsed) {
      onExpand();
      setIsOpen(true);
    } else {
      if (homepageChild) {
        navigate(homepageChild.path);
      } else {
        setIsOpen(!isOpen);
      }
    }
  };

  if (item.children && item.children.length > 0) {
    const parentContent = (
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <Icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>}
      </div>
    );

    return (
      <div>
        <button 
          onClick={handleParentClick}
          className={`w-full flex items-center justify-between px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isParentActive ? "text-theme-primary" : "text-slate-500 hover:bg-theme-primary/5 hover:text-theme-primary"}`}
        >
          {parentContent}
          {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
        </button>
        {isOpen && !isCollapsed && (
          <ul
            className="pl-4 border-l border-slate-200 ml-4"
          >
            {item.children.map(child => {
              const ChildIcon = (LucideIcons[child.icon as keyof typeof LucideIcons] || GitMerge) as any;
              return (
                <li key={child.path}>
                  <NavLink 
                    to={child.path} 
                    end 
                    className={({ isActive }) => `flex items-center px-4 py-2 my-1 rounded-lg transition-colors duration-200 text-sm ${isActive ? "bg-theme-primary text-white" : "text-slate-500 hover:bg-theme-primary/5 hover:text-theme-primary"}`}
                  >
                    <ChildIcon className="w-4 h-4 mr-3" />
                    {child.title}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <li>
      <NavLink 
        to={item.path} 
        end 
        onClick={() => { if (isCollapsed) onExpand() }}
        className={({ isActive }) => `flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? "bg-theme-primary text-white" : "text-slate-500 hover:bg-theme-primary/5 hover:text-theme-primary"} ${isCollapsed ? 'justify-center' : ''}`}
      >
        <Icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>}
      </NavLink>
    </li>
  );
};

export function Layout({ navLinks }: { navLinks: NavigationLink[] }) {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const profile = user?.doctor || user?.employee;
  const profileName = profile?.name;
  const profilePosition = profile?.position;
  const branchName = user?.branch?.name;

  return (
    <div className="h-screen w-full flex justify-center font-sans">
      <div className="flex w-full max-w-[1600px] border-r border-l border-slate-200">
        <aside className={`relative flex-shrink-0 bg-white flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="absolute top-24 -right-5 z-10 w-5 h-24 bg-theme-primary hover:bg-opacity-90 text-white rounded-r-md flex items-center justify-center transition-colors"
          >
            <span className="text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>
              {isSidebarCollapsed ? '펼치기' : '접기'}
            </span>
          </button>
          <div className={`h-20 flex items-center justify-center ${!isSidebarCollapsed ? 'border-b border-slate-200' : ''}`}>
            <NavLink to="." className="text-2xl font-bold text-theme-primary tracking-tighter">
              {isSidebarCollapsed ? 'T' : "TONE'S ADMIN"}
            </NavLink>
          </div>
          <nav className="px-4 py-6 flex-1 overflow-y-auto">
            <ul>
              {navLinks.map((item) => (
                <NavItem key={item.id} item={item} isCollapsed={isSidebarCollapsed} onExpand={() => setIsSidebarCollapsed(false)} />
              ))}
            </ul>
          </nav>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 bg-white">
            <div className="flex-1 flex items-center justify-start">
              <BranchSelector />
            </div>
            <div className="flex-1 flex justify-center" />
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-4">
                <NavLink to="my-info" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
                  <UserCircle size={20} />
                  <span className="font-semibold whitespace-nowrap">
                    {profile ? (
                      `${branchName || ''} ${profileName || ''} ${profilePosition || ''} (${user?.username || ''})`
                    ) : (
                      user?.username
                    )}
                  </span>
                </NavLink>
                <button onClick={logout} className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">
                  <LogOut size={16}/>
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-white">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
