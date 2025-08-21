import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { getBranches, getBranchBySlug, createBranch, updateBranch, deleteBranch, type Branch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-5xl p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-6 text-slate-800">{title}</h3>
                {children}
            </div>
        </div>
    );
};

const BranchForm = ({ branch, onSubmit, onCancel }: { branch?: Branch | null, onSubmit: (data: Partial<Branch>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Branch>>({});
    const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
    const addressSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setFormData(branch || {}); }, [branch]);

    useEffect(() => {
        if (isAddressSearchOpen && addressSearchRef.current) {
            addressSearchRef.current.innerHTML = '';
            new window.daum.Postcode({
                oncomplete: function(data: any) {
                    setFormData(prev => ({ ...prev, postcode: data.zonecode, address: data.roadAddress }));
                    setIsAddressSearchOpen(false);
                },
                width: '100%', height: '100%'
            }).embed(addressSearchRef.current);
        }
    }, [isAddressSearchOpen]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const FormRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
        <div><label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>{children}</div>
    );

    const regions = ["서울", "경기", "인천", "강원", "대전", "세종", "충남", "충북", "부산", "울산", "경남", "경북", "대구", "광주", "전남", "전북", "제주"];

    return (
        <form onSubmit={handleSubmit} className="space-y-8 text-sm pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div id="branch-business-info" className="space-y-4 p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">사업자 및 주소 정보</h4>
                    <FormRow label="상호"><input required name="tradeName" value={formData.tradeName || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="톤즈의원 인천부평점"/></FormRow>
                    <FormRow label="대표자명"><input required name="representativeName" value={formData.representativeName || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="황아름"/></FormRow>
                    <FormRow label="사업자등록번호"><input name="businessNumber" value={formData.businessNumber || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="726-24-01354"/></FormRow>
                    <FormRow label="대표번호"><input required name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="032-710-9959"/></FormRow>
                    <hr className="my-4"/>
                    <FormRow label="우편번호">
                        <div className="flex gap-2">
                            <input readOnly name="postcode" value={formData.postcode || ''} className="w-full p-2 border rounded-md bg-slate-100" placeholder="12345"/>
                            <button type="button" onClick={() => setIsAddressSearchOpen(!isAddressSearchOpen)} className="flex-shrink-0 px-4 bg-slate-600 text-white rounded-md hover:bg-slate-700 inline-flex items-center gap-2"><Search size={14}/> <span>{isAddressSearchOpen ? '닫기' : '찾기'}</span></button>
                        </div>
                    </FormRow>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAddressSearchOpen ? 'h-96 mt-2 opacity-100' : 'h-0 mt-0 opacity-0'}`}><div ref={addressSearchRef} className="w-full h-full border rounded-md"></div></div>
                    <FormRow label="주소"><input readOnly name="address" value={formData.address || ''} className="w-full p-2 border rounded-md bg-slate-100" placeholder="도로명 주소"/></FormRow>
                    <FormRow label="상세주소"><input name="addressDetail" value={formData.addressDetail || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="13층 (접수)"/></FormRow>
                </div>
                <div id="branch-operating-info" className="space-y-4 p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">운영 정보</h4>
                    <FormRow label="지역"><select required name="region" value={formData.region || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-white"><option value="" disabled>지역을 선택하세요</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></FormRow>
                    <FormRow label="지점명 (노출용)"><input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="인천부평점"/></FormRow>
                    <FormRow label="Slug (URL 경로)"><input required name="slug" value={formData.slug || ''} onChange={handleChange} className="w-full p-2 border rounded-md font-mono text-xs" placeholder="bupyeong"/></FormRow>
                    <hr className="my-4"/>
                    <FormRow label="평일 진료시간"><input required name="hoursWeekday" value={formData.hoursWeekday || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="AM 10:00 - PM 20:30"/></FormRow>
                    <FormRow label="토요일 진료시간"><input required name="hoursSaturday" value={formData.hoursSaturday || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="AM 10:00 - PM 16:00"/></FormRow>
                    <FormRow label="점심시간"><input required name="lunchTime" value={formData.lunchTime || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="점심시간 없이 진료"/></FormRow>
                    <FormRow label="휴진일"><input required name="closedDays" value={formData.closedDays || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="일요일/공휴일"/></FormRow>
                    <FormRow label="진료시간 메모"><input name="hoursMemo" value={formData.hoursMemo || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="ㆍ점심시간 없이 진료합니다"/></FormRow>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-theme-primary text-white hover:bg-opacity-90">저장</button>
            </div>
        </form>
    );
};

const SuperAdminView = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    const fetchBranches = async () => { try { setIsLoading(true); const data = await getBranches(); setBranches(data); } catch (error) { console.error("Failed to fetch branches:", error); } finally { setIsLoading(false); } };
    useEffect(() => { fetchBranches(); }, []);

    const handleFormSubmit = async (data: Partial<Branch>) => {
        try {
            if (selectedBranch) { await updateBranch(selectedBranch.id, data); } else { await createBranch(data); }
            fetchBranches(); setIsDialogOpen(false);
        } catch (error) { console.error("Failed to save branch:", error); }
    };
    
    const handleEditClick = (branch: Branch) => { setSelectedBranch(branch); setIsDialogOpen(true); };
    const handleDeleteClick = async (id: number) => {
        if (window.confirm('정말로 이 지점을 삭제하시겠습니까?')) {
            try { await deleteBranch(id); fetchBranches(); } catch (error) { console.error("Failed to delete branch:", error); }
        }
    };
    
    useEffect(() => {
        const handleOpenModal = () => {
            setSelectedBranch(null);
            setIsDialogOpen(true);
        };
        document.addEventListener('openNewBranchModal', handleOpenModal);
        return () => document.removeEventListener('openNewBranchModal', handleOpenModal);
    }, []);

    return (
        <>
            <div id="branch-list" className="bg-white border border-slate-200 rounded-xl">
                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-100 text-xs text-slate-700 uppercase"><tr><th className="px-6 py-3">지점명</th><th className="px-6 py-3">Slug</th><th className="px-6 py-3">연락처</th><th className="px-6 py-3 text-center">관리</th></tr></thead>
                    <tbody className="divide-y divide-slate-200">{isLoading ? (<tr><td colSpan={4} className="text-center py-16 text-slate-500">로딩 중...</td></tr>) : branches.map(branch => (<tr key={branch.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-900">{branch.name}</td><td className="px-6 py-4 font-mono text-xs">{branch.slug}</td><td className="px-6 py-4">{branch.phone}</td><td className="px-6 py-4 text-center"><button onClick={() => handleEditClick(branch)} className="font-medium text-theme-primary/80 hover:text-theme-primary mr-4"><Edit size={16} /></button><button onClick={() => handleDeleteClick(branch.id)} className="font-medium text-slate-500 hover:text-red-600"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table></div>
            </div>
            <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={selectedBranch ? '지점 수정' : '새 지점 추가'}>
                <BranchForm branch={selectedBranch} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} />
            </Modal>
        </>
    );
};

const BranchAdminView = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (branchSlug) {
            setIsLoading(true);
            getBranchBySlug(branchSlug).then(setBranch).finally(() => setIsLoading(false));
        }
    }, [branchSlug]);

    const handleFormSubmit = async (data: Partial<Branch>) => {
        if (!branch) return;
        try {
            await updateBranch(branch.id, data);
            alert('지점 정보가 성공적으로 수정되었습니다.');
        } catch (error) { console.error("Failed to save branch:", error); }
    };

    if (isLoading) return <p className="text-center p-10">지점 정보를 불러오는 중...</p>;
    if (!branch) return <p className="text-center p-10 text-red-500">지점 정보를 찾을 수 없습니다.</p>;

    return <BranchForm branch={branch} onSubmit={handleFormSubmit} onCancel={() => {}} />;
};

export function BranchManagementPage() {
    const { user } = useAuth();
    const { branchSlug } = useParams<{ branchSlug: string }>();

    const handleAddClick = () => {
        const event = new CustomEvent('openNewBranchModal');
        document.dispatchEvent(event);
    };

    if (!user) {
        return <div className="p-10 text-center">사용자 정보를 불러오는 중...</div>;
    }

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">지점 관리</h2>
                    {user.role === 'SUPER_ADMIN' && (
                        <button onClick={handleAddClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-primary text-white font-semibold rounded-lg hover:bg-opacity-90">
                            <PlusCircle size={18} /> 새 지점 추가
                        </button>
                    )}
                </div>
                <p className="text-slate-500">
                    {user.role === 'SUPER_ADMIN' ? `전체 지점을 관리합니다. 현재 선택된 지점: ${branchSlug}` : `현재 지점(${branchSlug})의 정보를 수정합니다.`}
                </p>
            </header>
            
            {user.role === 'SUPER_ADMIN' ? <SuperAdminView /> : <BranchAdminView />}
        </div>
    );
}