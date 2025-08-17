import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { getHeroSections, createHeroSection, updateHeroSection, deleteHeroSection } from "../lib/api";

type HeroSection = { id: number; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; title: string; subtitle: string; isActive: boolean; };

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4 text-slate-800">{title}</h3>
                {children}
            </div>
        </div>
    );
};

const HeroForm = ({ section, onSubmit, onCancel }: { section?: HeroSection | null, onSubmit: (data: Omit<HeroSection, 'id' | 'branchSlug'>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        title: '', subtitle: '', mediaUrl: '', mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO', isActive: true,
    });

    useEffect(() => {
        if (section) {
            setFormData({
                title: section.title, subtitle: section.subtitle, mediaUrl: section.mediaUrl,
                mediaType: section.mediaType, isActive: section.isActive,
            });
        }
    }, [section]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-slate-600 mb-1">제목</label><input required name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md"/></div>
                <div><label className="block text-slate-600 mb-1">부제목</label><input required name="subtitle" value={formData.subtitle} onChange={handleChange} className="w-full p-2 border rounded-md"/></div>
                <div className="col-span-2"><label className="block text-slate-600 mb-1">미디어 URL</label><input required type="url" name="mediaUrl" value={formData.mediaUrl} onChange={handleChange} className="w-full p-2 border rounded-md"/></div>
                <div><label className="block text-slate-600 mb-1">미디어 타입</label><select name="mediaType" value={formData.mediaType} onChange={handleChange} className="w-full p-2 border rounded-md"><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select></div>
                <div className="flex items-center pt-6"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 mr-2"/><label>활성화</label></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-theme-primary text-white hover:bg-opacity-90">저장</button>
            </div>
        </form>
    );
};

export function HeroManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [sections, setSections] = useState<HeroSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<HeroSection | null>(null);

    const fetchSections = async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getHeroSections(branchSlug);
            setSections(data);
        } catch (error) { console.error("Failed to fetch hero sections:", error); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchSections(); }, [branchSlug]);

    const handleFormSubmit = async (data: Omit<HeroSection, 'id' | 'branchSlug'>) => {
        if (!branchSlug) return;
        try {
            const payload = { ...data, branchSlug };
            if (selectedSection) {
                await updateHeroSection(selectedSection.id, payload);
            } else {
                await createHeroSection(payload);
            }
            fetchSections();
            setIsDialogOpen(false);
        } catch (error) { console.error("Failed to save hero section:", error); }
    };

    const handleAddClick = () => { setSelectedSection(null); setIsDialogOpen(true); };
    const handleEditClick = (section: HeroSection) => { setSelectedSection(section); setIsDialogOpen(true); };
    const handleDeleteClick = async (id: number) => {
        if (window.confirm('정말로 이 섹션을 삭제하시겠습니까?')) {
            try { await deleteHeroSection(id); fetchSections(); } catch (error) { console.error("Failed to delete hero section:", error); }
        }
    };

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-3xl font-bold text-slate-800">Hero Section 관리</h2>
                    <button onClick={handleAddClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-primary text-white font-semibold rounded-lg hover:bg-opacity-90"><PlusCircle size={18} /> 새 섹션 추가</button>
                </div>
                <p className="text-slate-500">현재 <span className="font-semibold text-theme-primary">{branchSlug}</span> 지점의 Hero Section을 관리합니다.</p>
            </header>
            
            <div className="bg-white border border-slate-200 rounded-xl">
                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-100 text-xs text-slate-700 uppercase"><tr><th className="px-6 py-3">제목</th><th className="px-6 py-3">타입</th><th className="px-6 py-3">활성 상태</th><th className="px-6 py-3 text-center">관리</th></tr></thead>
                    <tbody className="divide-y divide-slate-200">{isLoading ? (<tr><td colSpan={4} className="text-center py-16 text-slate-500">로딩 중...</td></tr>) : sections.map(sec => (<tr key={sec.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-900">{sec.title}</td><td className="px-6 py-4">{sec.mediaType}</td><td className="px-6 py-4">{sec.isActive ? '활성' : '비활성'}</td><td className="px-6 py-4 text-center"><button onClick={() => handleEditClick(sec)} className="font-medium text-theme-primary/80 hover:text-theme-primary mr-4"><Edit size={16} /></button><button onClick={() => handleDeleteClick(sec.id)} className="font-medium text-slate-500 hover:text-red-600"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table></div>
            </div>

            <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={selectedSection ? 'Hero Section 수정' : '새 Hero Section 추가'}>
                <HeroForm section={selectedSection} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} />
            </Modal>
        </div>
    );
}
