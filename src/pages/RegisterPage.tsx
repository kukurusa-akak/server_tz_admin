import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:4000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) throw new Error('Registration failed');
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            alert('회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">Register Admin</h2>
                <div className="space-y-4">
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full p-3 border rounded-md"/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 border rounded-md"/>
                </div>
                <button type="submit" className="w-full mt-6 p-3 bg-theme-primary text-white rounded-md font-semibold">Register</button>
                 <p className="text-center text-xs text-slate-500 mt-4">
                    Already have an account? <Link to="/login" className="font-semibold text-theme-primary">Login</Link>
                </p>
            </form>
        </div>
    );
}