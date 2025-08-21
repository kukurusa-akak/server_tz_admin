import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { LogOut, GitMerge, ChevronDown, UserCircle, Bell, CalendarPlus, UserX } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { BranchSelector } from "./BranchSelector";
import { NoticeTicker } from "./NoticeTicker";
import { useAuth } from "../context/AuthContext";
import { getNavigationLinks, type NavigationLink } from "../lib/api";
import { useState, useEffect, useRef } from "react";

const sampleNotifications = [
  { id: 1, type: 'new_reservation', icon: CalendarPlus, message: '부평점: 김민준님 신규 예약 (14:30)', timestamp: '방금 전', isRead: false },
  { id: 2, type: 'cancellation', icon: UserX, message: '강남점: 이서연님 예약 취소 (11:00)', timestamp: '5분 전', isRead: false },
  { id: 3, type: 'new_reservation', icon: CalendarPlus, message: '부평점: 박도윤님 신규 예약 (18:00)', timestamp: '1시간 전', isRead: true },
];

const NavItem = ({ item, isCollapsed, onExpand, branchSlug }: { item: NavigationLink, isCollapsed: boolean, onExpand: () => void, branchSlug: string | undefined }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const Icon = (item.icon ? LucideIcons[item.icon as keyof typeof LucideIcons] : GitMerge) as any;

  if (!Icon && item.icon) {
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
        navigate(`/${branchSlug}/${homepageChild.path}`);
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
                    to={`/${branchSlug}/${child.path}`}
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
        to={`/${branchSlug}/${item.path}`}
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

export function Layout() {
  const { user, logout } = useAuth();
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const [navLinks, setNavLinks] = useState<NavigationLink[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNavigationLinks()
      .then(data => {
        setNavLinks(data.filter(link => link.type === 'ADMIN'));
      })
      .catch(err => console.error("Failed to fetch nav links for layout:", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);
  
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
            <NavLink to={branchSlug ? `/${branchSlug}` : '/'} className="text-2xl font-bold text-theme-primary tracking-tighter">
              {isSidebarCollapsed ? 'T' : "TONE'S ADMIN"}
            </NavLink>
          </div>
          <nav className="px-4 py-6 flex-1 overflow-y-auto">
            <ul>
              {navLinks.map((item) => (
                <NavItem key={item.id} item={item} isCollapsed={isSidebarCollapsed} onExpand={() => setIsSidebarCollapsed(false)} branchSlug={branchSlug} />
              ))}
            </ul>
          </nav>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 bg-white">
            <div className="flex-1 flex items-center justify-start gap-4">
              <BranchSelector />
              <NoticeTicker />
            </div>
            <div className="flex-1 flex justify-center" />
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-4">
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setIsNotificationOpen(prev => !prev);
                      setHasNotification(false);
                    }}
                    className="relative p-4 text-slate-600 hover:bg-slate-100 rounded-full"
                  >
                    <Bell size={24} className={hasNotification ? 'animate-bell-shake' : ''} />
                    {hasNotification && (
                      <div className="absolute top-0 right-0">
                        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#BB2649] text-xs font-bold text-white">3</span>
                      </div>
                    )}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                      <ul className="max-h-96 overflow-y-auto">
                        {sampleNotifications.map(notif => (
                          <li key={notif.id} className={`flex items-start gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 ${!notif.isRead ? 'bg-rose-50' : ''}`}>
                            <div className={`mt-1 ${notif.type === 'new_reservation' ? 'text-green-500' : 'text-red-500'}`}>
                              <notif.icon size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{notif.timestamp}</p>
                            </div>
                            {!notif.isRead && <div className="w-2 h-2 bg-theme-primary rounded-full mt-2"></div>}
                          </li>
                        ))}
                      </ul>
                      <div className="p-2 text-center">
                        <button className="text-sm text-slate-500 hover:text-theme-primary">모든 알림 보기</button>
                      </div>
                    </div>
                  )}
                </div>
                <NavLink to={`/${branchSlug}/my-info`} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
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