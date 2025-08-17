import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, Search, UploadCloud } from "lucide-react";
import { getTreatmentsByBranch, createTreatment, updateTreatment, deleteTreatment, uploadImage, type Treatment } from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

const TreatmentForm = ({ treatment, onSubmit, onCancel, branchSlug }: { treatment?: Treatment | null; onSubmit: (data: Omit<Treatment, 'id'> | Partial<Treatment>) => void; onCancel: () => void; branchSlug: string; }) => {
    const [formData, setFormData] = useState({ branchSlug: branchSlug, name: '', category: '', price: 0, description: '', imageUrl: '', });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (treatment) {
            setFormData({ branchSlug: treatment.branchSlug, name: treatment.name, category: treatment.category ?? '', price: treatment.price, description: treatment.description ?? '', imageUrl: treatment.imageUrl });
            setPreviewUrl(treatment.imageUrl);
            setSelectedFile(null);
        } else {
            setFormData({ branchSlug: branchSlug, name: '', category: '', price: 0, description: '', imageUrl: '' });
            setPreviewUrl(null);
            setSelectedFile(null);
        }
    }, [treatment, branchSlug]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        let finalImageUrl = formData.imageUrl;
        try {
            if (selectedFile) {
                finalImageUrl = (await uploadImage(selectedFile)).imageUrl;
            }
            onSubmit({ ...formData, imageUrl: finalImageUrl });
        } catch (error) {
            console.error("File upload or form submission failed:", error);
            alert("이미지 업로드 또는 저장에 실패했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>시술명</Label><Input required name="name" value={formData.name} onChange={handleChange} /></div>
                <div><Label>제품명</Label><Input name="category" value={formData.category ?? ''} onChange={handleChange} placeholder="예: 원더톡스" /></div>
                <div><Label>가격 (원)</Label><Input required type="number" name="price" value={formData.price} onChange={handleChange} /></div>
            </div>
            <div className="space-y-2">
                <Label>대표 이미지</Label>
                <div className="mt-1 flex items-center gap-4">
                    {previewUrl && <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />}
                    <div className="w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">클릭하여 업로드</span> 또는 드래그</p>
                            </div>
                            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label>설명</Label>
                <Textarea name="description" value={formData.description ?? ''} onChange={handleChange} rows={4} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>취소</Button>
                <Button type="submit" disabled={isUploading}>{isUploading ? '저장 중...' : (treatment ? '변경사항 저장' : '시술 생성')}</Button>
            </div>
        </form>
    );
};

export function TreatmentManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTreatments = useCallback(async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getTreatmentsByBranch(branchSlug);
            setTreatments(data);
        } catch (error) { console.error("Failed to fetch treatments:", error); } 
        finally { setIsLoading(false); }
    }, [branchSlug]);

    useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

    const handleFormSubmit = async (data: Omit<Treatment, 'id'> | Partial<Treatment>) => {
        if (!branchSlug) return;
        try {
            if (selectedTreatment) {
                await updateTreatment(selectedTreatment.id, data);
            } else {
                await createTreatment({ ...data, branchSlug } as Omit<Treatment, 'id'>);
            }
            await fetchTreatments();
            setSelectedTreatment(null);
            setIsCreating(false);
        } catch (error) { console.error("Failed to save treatment:", error); }
    };

    const handleAddNew = () => { setSelectedTreatment(null); setIsCreating(true); };
    const handleSelectTreatment = (treatment: Treatment) => { setIsCreating(false); setSelectedTreatment(treatment); };
    const handleCancel = () => { setSelectedTreatment(null); setIsCreating(false); };

    const filteredTreatments = useMemo(() => treatments.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [treatments, searchTerm]);

    const TreatmentListItem = ({ treatment }: { treatment: Treatment }) => (
        <div className={`p-3 rounded-lg cursor-pointer border flex items-center gap-4 ${selectedTreatment?.id === treatment.id ? 'bg-slate-100 border-theme-primary' : 'hover:bg-slate-50 border-transparent'}`} onClick={() => handleSelectTreatment(treatment)}>
            <img src={treatment.imageUrl} alt={treatment.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            <div className="flex-grow">
                <div className="font-semibold text-slate-800">{treatment.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold">{treatment.price.toLocaleString()}원</span>
                    {treatment.category && <span className="ml-2 inline-block bg-slate-200 px-2 py-0.5 rounded-full">{treatment.category}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">시술 관리</h2>
                <p className="text-sm text-slate-500"><span className="font-semibold text-theme-primary">{branchSlug}</span> 지점의 시술 항목을 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">시술 목록</CardTitle>
                            <Button size="sm" onClick={handleAddNew}><PlusCircle size={16} className="mr-2" /> 추가</Button>
                        </div>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="시술 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-2">
                        {isLoading ? <p className="text-center text-slate-500">로딩 중...</p> :
                            filteredTreatments.length > 0 ? filteredTreatments.map(t => <TreatmentListItem key={t.id} treatment={t} />) :
                            <p className="text-center text-slate-500 py-8">표시할 시술이 없습니다.</p>
                        }
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader><CardTitle className="text-lg">{isCreating ? "새 시술 추가" : selectedTreatment ? "시술 수정" : "시술 정보"}</CardTitle></CardHeader>
                    <CardContent className="flex-grow overflow-y-auto">
                        {isCreating || selectedTreatment ? (
                            <TreatmentForm treatment={selectedTreatment} onSubmit={handleFormSubmit} onCancel={handleCancel} branchSlug={branchSlug!} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-slate-500"><p>왼쪽 목록에서 시술을 선택하거나<br />새 시술을 추가하세요.</p></div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}