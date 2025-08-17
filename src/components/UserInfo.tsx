import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon } from 'lucide-react';

export function UserInfo() {
    const { user, logout } = useAuth();

    return (
        <div className="flex items-center gap-4">
            <NavLink to="/my-info" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-theme-primary">
                <UserIcon size={16} />
                {user?.username}
            </NavLink>
            <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500">
                <LogOut size={16} />
                Logout
            </button>
        </div>
    );
}
