import { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, Search, UploadCloud, Edit, Trash2, Save } from "lucide-react";
import { 
    getTreatmentsByBranch, createTreatment, updateTreatment, deleteTreatment, uploadImage, type Treatment,
    getTreatmentCategories, createTreatmentCategory, updateTreatmentCategory, deleteTreatmentCategory, type TreatmentCategory
} from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";

// --- Category Management Modal ---
const CategoryManager = ({ onUpdate }: { onUpdate: () => void }) => {
    const [categories, setCategories] = useState<TreatmentCategory[]>([]);
    const [editingCategory, setEditingCategory] = useState<Partial<TreatmentCategory> | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    const fetchCategories = useCallback(async () => {
        const data = await getTreatmentCategories();
        setCategories(data);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = async (category: Partial<TreatmentCategory>) => {
        if (!category.name) return;
        if (category.id) {
            await updateTreatmentCategory(category.id, { name: category.name, displayOrder: category.displayOrder || 0 });
        }
        setEditingCategory(null);
        await fetchCategories();
        onUpdate();
    };

    const handleCreate = async () => {
        if (!newCategoryName) return;
        await createTreatmentCategory({ name: newCategoryName, displayOrder: categories.length });
        setNewCategoryName("");
        await fetchCategories();
        onUpdate();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("정말로 이 카테고리를 삭제하시겠습니까? 해당 카테고리의 시술들은 '미분류'로 변경됩니다.")) {
            await deleteTreatmentCategory(id);
            await fetchCategories();
            onUpdate();
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>시술 종류 (그룹) 관리</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="새 그룹명 입력" />
                    <Button onClick={handleCreate}>추가</Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 p-2 border rounded-md">
                            {editingCategory?.id === cat.id ? (
                                <Input value={editingCategory.name || ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                            ) : (
                                <span className="flex-grow">{cat.name}</span>
                            )}
                            {editingCategory?.id === cat.id ? (
                                <Button size="icon" variant="ghost" onClick={() => handleSave(editingCategory!)}><Save className="h-4 w-4" /></Button>
                            ) : (
                                <Button size="icon" variant="ghost" onClick={() => setEditingCategory(cat)}><Edit className="h-4 w-4" /></Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                </div>
            </div>
        </DialogContent>
    );
};


// --- Treatment Form ---
const TreatmentForm = ({ treatment, onSubmit, onCancel, branchSlug, categories, onCategoriesUpdate, onDelete }: { treatment?: Treatment | null; onSubmit: (data: any) => void; onCancel: () => void; branchSlug: string; categories: TreatmentCategory[], onCategoriesUpdate: () => void; onDelete: (id: number) => void; }) => {
    const [formData, setFormData] = useState({ branchSlug, name: '', category: '', price: 0, description: '', imageUrl: '', treatmentCategoryId: null as number | null });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (treatment) {
            setFormData({
                branchSlug: treatment.branchSlug, name: treatment.name, category: treatment.category ?? '',
                price: treatment.price, description: treatment.description ?? '', imageUrl: treatment.imageUrl,
                treatmentCategoryId: treatment.treatmentCategoryId || null
            });
            setPreviewUrl(treatment.imageUrl);
            setSelectedFile(null);
        } else {
            setFormData({ branchSlug, name: '', category: '', price: 0, description: '', imageUrl: '', treatmentCategoryId: null });
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
    
    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, treatmentCategoryId: parseInt(value) || null }));
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
                <div className="col-span-2">
                    <Label>시술 종류 (그룹)</Label>
                    <div className="flex items-center gap-2">
                        <Select value={formData.treatmentCategoryId?.toString()} onValueChange={handleCategoryChange}>
                            <SelectTrigger><SelectValue placeholder="그룹 선택" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Dialog>
                            <DialogTrigger asChild><Button type="button" variant="outline">관리</Button></DialogTrigger>
                            <CategoryManager onUpdate={onCategoriesUpdate} />
                        </Dialog>
                    </div>
                </div>
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
                {treatment && (
                    <Button type="button" variant="outline" className="mr-auto text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(treatment.id)} disabled={isUploading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>취소</Button>
                <Button type="submit" disabled={isUploading}>{isUploading ? '저장 중...' : (treatment ? '변경사항 저장' : '시술 생성')}</Button>
            </div>
        </form>
    );
};

// --- Main Component ---
export function TreatmentManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [categories, setCategories] = useState<TreatmentCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        if (!branchSlug) return;
        try {
            const [treatmentData, categoryData] = await Promise.all([
                getTreatmentsByBranch(branchSlug),
                getTreatmentCategories()
            ]);
            setTreatments(treatmentData);
            setCategories(categoryData);
        } catch (error) { 
            console.error("Failed to fetch data:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [branchSlug]);

    const fetchCategoriesOnly = useCallback(async () => {
        try {
            const categoryData = await getTreatmentCategories();
            setCategories(categoryData);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    }, []);

    useEffect(() => { 
        setIsLoading(true);
        fetchData(); 
    }, [fetchData]);

    const handleFormSubmit = async (data: any) => {
        if (!branchSlug) return;
        const payload = { ...data };
        
        try {
            if (selectedTreatment) {
                await updateTreatment(selectedTreatment.id, payload);
            } else {
                await createTreatment({ ...payload, branchSlug, showOnMainPromotion: false, showOnMainSignature: false, showOnMainSearchRanking: false });
            }
            alert("시술 정보가 성공적으로 저장되었습니다.");
            await fetchData();
            setSelectedTreatment(null);
            setIsCreating(false);
        } catch (error) { 
            console.error("Failed to save treatment:", error); 
            alert("저장에 실패했습니다.");
        }
    };

    const handleAddNew = () => { setSelectedTreatment(null); setIsCreating(true); };
    const handleSelectTreatment = (treatment: Treatment) => { setIsCreating(false); setSelectedTreatment(treatment); };
    const handleCancel = () => { setSelectedTreatment(null); setIsCreating(false); };

    const handleDeleteTreatment = async (treatmentId: number) => {
        if (!window.confirm("정말로 이 시술을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
        
        try {
            await deleteTreatment(treatmentId);
            alert("시술이 성공적으로 삭제되었습니다.");
            fetchData();
            handleCancel();
        } catch (error) {
            console.error("Failed to delete treatment:", error);
            alert("삭제에 실패했습니다.");
        }
    };

    const treatmentsWithCategory = useMemo(() => {
        return treatments.map(t => ({
            ...t,
            treatmentCategory: categories.find(c => c.id === t.treatmentCategoryId)
        }));
    }, [treatments, categories]);

    const filteredTreatments = useMemo(() => 
        treatmentsWithCategory.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.treatmentCategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), 
    [treatmentsWithCategory, searchTerm]);

    const groupedTreatments = useMemo(() => {
        return filteredTreatments.reduce((acc, treatment) => {
            const categoryName = treatment.treatmentCategory?.name || '미분류';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(treatment);
            return acc;
        }, {} as Record<string, (Treatment & { treatmentCategory?: TreatmentCategory | null })[]>);
    }, [filteredTreatments]);

    const TreatmentListItem = ({ treatment }: { treatment: Treatment & { treatmentCategory?: TreatmentCategory | null } }) => (
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
                            <Input placeholder="시술 또는 그룹 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-4">
                        {isLoading ? <p className="text-center text-slate-500">로딩 중...</p> :
                            Object.keys(groupedTreatments).length > 0 ? 
                            Object.entries(groupedTreatments).map(([category, treatmentsInCategory]) => (
                                <div key={category}>
                                    <h3 className="text-md font-semibold text-slate-600 mb-2 px-2">{category}</h3>
                                    <div className="space-y-2">
                                        {treatmentsInCategory.map(t => <TreatmentListItem key={t.id} treatment={t} />)}
                                    </div>
                                </div>
                            )) :
                            <p className="text-center text-slate-500 py-8">표시할 시술이 없습니다.</p>
                        }
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader><CardTitle className="text-lg">{isCreating ? "새 시술 추가" : selectedTreatment ? "시술 수정" : "시술 정보"}</CardTitle></CardHeader>
                    <CardContent className="flex-grow overflow-y-auto">
                        {isCreating || selectedTreatment ? (
                            <TreatmentForm 
                                treatment={selectedTreatment} 
                                onSubmit={handleFormSubmit} 
                                onCancel={handleCancel} 
                                branchSlug={branchSlug!}
                                categories={categories}
                                onCategoriesUpdate={fetchCategoriesOnly}
                                onDelete={handleDeleteTreatment}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-slate-500"><p>왼쪽 목록에서 시술을 선택하거나<br />새 시술을 추가하세요.</p></div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}