import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers, updateUserRole, getBranches, type User, type Branch } from "../lib/api";
import { Edit } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4 text-slate-800">{title}</h3>
                {children}
            </div>
        </div>
    );
};

const RoleEditForm = ({ user, branches, onSubmit, onCancel }: { user: User, branches: Branch[], onSubmit: (role: User['role'], branchId?: number | null) => void, onCancel: () => void }) => {
    const [selectedRole, setSelectedRole] = useState(user.role);
    const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(user.branchId || undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(selectedRole, selectedRole === 'BRANCH_ADMIN' ? selectedBranchId : null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">역할</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as User['role'])} className="w-full p-2 border border-slate-300 rounded-md">
                    <option value="USER">USER</option>
                    <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                </select>
            </div>
            {selectedRole === 'BRANCH_ADMIN' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">소속 지점</label>
                    <select value={selectedBranchId || ''} onChange={e => setSelectedBranchId(parseInt(e.target.value))} required className="w-full p-2 border border-slate-300 rounded-md">
                        <option value="" disabled>지점을 선택하세요</option>
                        {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-theme-primary text-white hover:bg-opacity-90">저장</button>
            </div>
        </form>
    );
};

export function PermissionManagementPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersData, branchesData] = await Promise.all([getUsers(), getBranches()]);
            setUsers(usersData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'SUPER_ADMIN' || user?.role === 'DEVELOPER') {
            fetchData();
        }
    }, [user]);

    const handleEditClick = (userToEdit: User) => {
        setSelectedUser(userToEdit);
        setIsDialogOpen(true);
    };

    const handleFormSubmit = async (role: User['role'], branchId?: number | null) => {
        if (!selectedUser) return;
        try {
            await updateUserRole(selectedUser.id, role, branchId);
            fetchData();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to update role:", error);
            alert("역할 업데이트에 실패했습니다.");
        }
    };

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'DEVELOPER') {
        return <div className="p-10 text-center text-red-500">이 페이지에 접근할 권한이 없습니다.</div>;
    }

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">권한 관리</h2>
                <p className="text-slate-500 mt-2">사용자 역할을 관리하고 지점 관리자에게 지점을 할당합니다.</p>
            </header>
            <div className="bg-white border border-slate-200 rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-100 text-xs text-slate-700 uppercase">
                            <tr>
                                <th className="px-6 py-3">Username</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Assigned Branch</th>
                                <th className="px-6 py-3 text-center">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (<tr><td colSpan={4} className="text-center py-16 text-slate-500">사용자 목록을 불러오는 중...</td></tr>) : 
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold text-slate-900">{u.username}</td>
                                    <td className="px-6 py-4"><span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded-md">{u.role}</span></td>
                                    <td className="px-6 py-4">{u.branch?.name || <span className="text-slate-400">N/A</span>}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleEditClick(u)} className="font-medium text-theme-primary/80 hover:text-theme-primary">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedUser && (
                <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={`${selectedUser.username} 역할 변경`}>
                    <RoleEditForm user={selectedUser} branches={branches} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} />
                </Modal>
            )}
        </div>
    );
}
