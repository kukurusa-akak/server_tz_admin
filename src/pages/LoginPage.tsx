import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin } from '@/lib/api';

type DecodedToken = {
    role: 'BRANCH_ADMIN' | 'SUPER_ADMIN' | 'DEVELOPER';
    branchSlug?: string;
};

export function LoginPage() {
    const [username, setUsername] = useState('tons123');
    const [password, setPassword] = useState('tons123');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { token } = await apiLogin({ username, password });
            
            login(token);
            
            const decoded: DecodedToken = jwtDecode(token);
            if (decoded.role === 'BRANCH_ADMIN' && decoded.branchSlug) {
                navigate(`/${decoded.branchSlug}`);
            } else {
                const lastVisited = localStorage.getItem('currentBranchSlug') || 'bupyeong';
                navigate(`/${lastVisited}`);
            }

        } catch (error) {
            alert('로그인에 실패했습니다.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h2>
                <div className="space-y-4">
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full p-3 border rounded-md"/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 border rounded-md"/>
                </div>
                <button type="submit" className="w-full mt-6 p-3 bg-theme-primary text-white rounded-md font-semibold">로그인</button>
                <p className="text-center text-xs text-slate-500 mt-4">
                    로그인 버튼을 눌러주세요 <Link to="/register" className="font-semibold text-theme-primary">회원가입</Link>
                </p>
            </form>
        </div>
    );
}