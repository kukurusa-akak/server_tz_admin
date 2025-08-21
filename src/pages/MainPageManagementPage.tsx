import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { X, Save, LayoutTemplate, PlusCircle, GripVertical, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { 
    getEvents, getAllTreatments, updateEventDisplay, updateTreatmentDisplay, type Event, type Treatment, 
    uploadImage, 
    getHeroSections, createHeroSection, updateHeroSection, 
    getBrandExperiences, createBrandExperience, updateBrandExperience, deleteBrandExperience, type BrandExperience, 
    getBrandValues, createBrandValue, updateBrandValue, deleteBrandValue, type BrandValue,
    getBranchBySlug, type Branch,
    updateBranch,
    getSearchRankingGroups, 
    createSearchRankingGroup, 
    updateSearchRankingGroup, 
    deleteSearchRankingGroup, 
    updateSearchRankingGroupItems, 
    type SearchRankingGroup,
    type SearchRankingItem,
    getNewPromotionItems,
    updateNewPromotionItems,
    type NewPromotionItem,
    getSignatureItems,
    updateSignatureItems,
    type SignatureItem,
    getSiteSettings,
    updateSiteSettings,
} from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmationDialog } from "../components/ConfirmationDialog";

// (Keep all existing components from HeroSectionEditor down to ContactInfoViewer)
type HeroSection = { id: number; branchSlug: string; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; title: string; subtitle: string; isActive: boolean; };

type DisplayItem = {
    id: number;
    type: 'event' | 'treatment';
    originalTitle: string;
    originalDescription?: string | null;
    originalImageUrl: string;
    useOverride: boolean;
    overrideTitle: string;
    overrideDescription: string;
    overrideImageUrl: string;
    newImageFile?: File | null;
};

type HeroFormProps = {
    section?: HeroSection | null;
    onSubmit: (data: Omit<HeroSection, 'id' | 'branchSlug'>, newImageFile?: File) => void;
};

const MediaTypeSelector = ({ value, onChange }: { value: 'IMAGE' | 'VIDEO', onChange: (value: 'IMAGE' | 'VIDEO') => void }) => {
    return (
        <div className="flex w-full rounded-md border border-slate-300 p-1 bg-slate-100">
            <button type="button" onClick={() => onChange('IMAGE')} className={`flex-1 text-sm py-1.5 rounded ${value === 'IMAGE' ? 'bg-white text-slate-800 border border-slate-200' : 'bg-transparent text-slate-500'}`}>
                이미지
            </button>
            <button type="button" onClick={() => onChange('VIDEO')} className={`flex-1 text-sm py-1.5 rounded ${value === 'VIDEO' ? 'bg-white text-slate-800 border border-slate-200' : 'bg-transparent text-slate-500'}`}>
                비디오
            </button>
        </div>
    );
};

const HeroForm = ({ section, onSubmit }: HeroFormProps) => {
    const [formData, setFormData] = useState({
        mediaUrl: '',
        mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    });
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);


    useEffect(() => {
        if (section) {
            setFormData({
                mediaUrl: section.mediaUrl,
                mediaType: section.mediaType,
            });
            if (section.mediaType === 'IMAGE') {
                setPreviewUrl(section.mediaUrl);
            }
        } else {
            // Reset for new form
            setFormData({ mediaUrl: '', mediaType: 'IMAGE' });
            setNewImageFile(null);
            setPreviewUrl(null);
        }
    }, [section]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMediaTypeChange = (type: 'IMAGE' | 'VIDEO') => {
        setFormData(prev => ({ ...prev, mediaType: type, mediaUrl: '' }));
        setNewImageFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            const newPreviewUrl = URL.createObjectURL(file);
            setPreviewUrl(newPreviewUrl);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, title: '', subtitle: '', isActive: true };
        onSubmit(finalData, newImageFile || undefined);
    };

    return (
        <form id="hero-form" onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-4">
                <div>
                    <Label className="mb-2 block">미디어 타입</Label>
                    <MediaTypeSelector value={formData.mediaType} onChange={handleMediaTypeChange} />
                </div>

                <div>
                    <Label className="mb-2 block">{formData.mediaType === 'IMAGE' ? '이미지 파일' : '비디오 URL'}</Label>
                    {formData.mediaType === 'IMAGE' ? (
                        <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                            {previewUrl && <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-md border" />}
                            <div className="flex-1">
                                <Input required={!previewUrl} type="file" onChange={handleFileChange} accept="image/*" />
                                <p className="text-xs text-slate-500 mt-1">새 이미지를 업로드하여 현재 배너를 교체하세요.</p>
                            </div>
                        </div>
                    ) : (
                        <Input required type="url" name="mediaUrl" placeholder="https://www.youtube.com/watch?v=..." value={formData.mediaUrl} onChange={handleChange} />
                    )}
                </div>
            </div>
        </form>
    );
};


const HeroSectionEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [allSections, setAllSections] = useState<HeroSection[]>([]);
    const [activeSection, setActiveSection] = useState<HeroSection | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSections = useCallback(async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getHeroSections(branchSlug);
            setAllSections(data);
            setActiveSection(data.find((s: HeroSection) => s.isActive) || null);
        } catch (error) { console.error("Failed to fetch hero sections:", error); }
        finally { setIsLoading(false); }
    }, [branchSlug]);

    useEffect(() => { 
        fetchSections();
    }, [fetchSections]);

    const handleFormSubmit = async (data: Omit<HeroSection, 'id' | 'branchSlug'>, newImageFile?: File) => {
        if (!branchSlug) return;
        try {
            let mediaUrl = data.mediaUrl;
            if (data.mediaType === 'IMAGE' && newImageFile) {
                const uploadResult = await uploadImage(newImageFile);
                mediaUrl = uploadResult.imageUrl;
            }

            const payload = { ...data, branchSlug, mediaUrl, isActive: true };
            
            const deactivationPromises = allSections
                .filter((s: HeroSection) => s.id !== activeSection?.id)
                .map((s: HeroSection) => updateHeroSection(s.id, { ...s, isActive: false }));
            await Promise.all(deactivationPromises);

            if (activeSection) {
                await updateHeroSection(activeSection.id, payload);
            } else {
                await createHeroSection(payload);
            }
            
            fetchSections();
            toast.success("저장 완료", { description: "메인 배너 정보가 성공적으로 저장되었습니다." });
        } catch (error) { 
            console.error("Failed to save hero section:", error); 
            toast.error("저장 실패", { description: "오류가 발생했습니다. 다시 시도해주세요." });
        }
    };

    

    const renderPreview = () => {
        if (isLoading) return <div className="text-center text-slate-500 py-8">로딩 중...</div>;
        if (!activeSection) return <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg h-full flex items-center justify-center">설정된 배너가 없습니다.</div>;

        if (activeSection.mediaType === 'VIDEO') {
            return (
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <p className="text-white">비디오 URL: <a href={activeSection.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline">{activeSection.mediaUrl}</a></p>
                </div>
            );
        }
        return <img src={activeSection.mediaUrl} alt="Current Banner" className="w-full aspect-video object-cover rounded-lg" />;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>메인 배너</CardTitle>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={fetchSections}><X size={16} className="mr-2" /> 취소</Button>
                    <Button type="submit" form="hero-form"><Save size={16} className="mr-2" /> 저장</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label>미리보기</Label>
                        {renderPreview()}
                    </div>
                    <div className="space-y-2">
                        <Label>{activeSection ? '배너 변경' : '새 배너 등록'}</Label>
                        <HeroForm section={activeSection} onSubmit={handleFormSubmit} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

type SectionKey = 'hero' | 'promotion' | 'signature' | 'ranking' | 'brandValue' | 'experience' | 'contents' | 'contact';

const SECTIONS: { key: SectionKey; title: string; subtitle: string; active: boolean; }[] = [
    { key: 'hero', title: '메인 배너', subtitle: '사진 또는 영상', active: true },
    { key: 'promotion', title: 'TONE’S NEW PROMOTION', subtitle: 'BEST 시술', active: true },
    { key: 'signature', title: 'TONE’S SIGNATURE', subtitle: '시그니처 시술', active: true },
    { key: 'ranking', title: 'TONE’S SEARCH RANKING', subtitle: '톤즈의원 인기 시술', active: true },
    { key: 'brandValue', title: 'TONE’S BRAND VALUE', subtitle: '톤즈의원만의 가치', active: true },
    { key: 'experience', title: 'TONE’S EXPERIENCE', subtitle: '톤즈의원 장점', active: true },
    { key: 'contents', title: 'TONE’S CONTENTS', subtitle: '톤즈의원만의 TIP', active: true },
    { key: 'contact', title: 'CONTACT US', subtitle: '찾아오시는 길', active: true },
];

const LayoutPreview = ({ sectionKey }: { sectionKey: SectionKey }) => {
    const baseBoxClasses = "bg-slate-200 border-2 border-dashed border-slate-400 rounded-md flex items-center justify-center text-slate-500 text-xs";

    const renderContent = () => {
        switch (sectionKey) {
            case 'hero':
                return <div className={`${baseBoxClasses} h-24 w-full`}>메인 사진 또는 영상</div>;
            case 'promotion':
                return (
                    <div className="flex items-center justify-center w-full gap-1">
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                        <div className="grid grid-cols-4 gap-2 flex-1">
                            <div className={`${baseBoxClasses} aspect-square`}>1</div>
                            <div className={`${baseBoxClasses} aspect-square`}>2</div>
                            <div className={`${baseBoxClasses} aspect-square`}>3</div>
                            <div className={`${baseBoxClasses} aspect-square`}>4</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                );
            case 'signature':
                return (
                    <div className="flex items-center justify-center w-full gap-1">
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                        <div className="grid grid-cols-3 gap-2 flex-1">
                            <div className={`${baseBoxClasses} aspect-square`}>1</div>
                            <div className={`${baseBoxClasses} aspect-square`}>2</div>
                            <div className={`${baseBoxClasses} aspect-square`}>3</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                );
            case 'ranking':
                 return (
                    <div className="flex flex-col w-full gap-2">
                        <div className="grid grid-cols-3 gap-2 w-1/2">
                            <div className={`${baseBoxClasses} h-7`} style={{ width: '100%'}} >그룹</div>
                            <div className={`${baseBoxClasses} h-7`} style={{ width: '100%'}} >그룹</div>
                            <div className={`${baseBoxClasses} h-7`} style={{ width: '100%'}} >그룹</div>
                        </div>
                        <div className="flex items-center justify-center w-full gap-1">
                            <ChevronLeft className="w-4 h-4 text-slate-400" />
                            <div className="grid grid-cols-5 gap-2 flex-1">
                                <div className={`${baseBoxClasses} aspect-square`}>1</div>
                                <div className={`${baseBoxClasses} aspect-square`}>2</div>
                                <div className={`${baseBoxClasses} aspect-square`}>3</div>
                                <div className={`${baseBoxClasses} aspect-square`}>4</div>
                                <div className={`${baseBoxClasses} aspect-square`}>5</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                );
            case 'brandValue':
                return (
                    <div className="w-full flex flex-col items-center justify-center">
                        <div className="w-full relative flex justify-between items-center px-2">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="relative z-10 w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></div>
                            ))}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-400 transform -translate-y-1/2"></div>
                        </div>
                        <div className="w-full flex justify-between items-start mt-2 px-2">
                        <div className="text-center text-[10px] leading-tight w-1/4">톤즈의원<br />SINCE</div>
                        <div className="text-center text-[10px] leading-tight w-1/4">전국 지점 수</div>
                        <div className="text-center text-[10px] leading-tight w-1/4">홈페이지<br />방문자 수</div>
                        <div className="text-center text-[10px] leading-tight w-1/4">예약자 수</div>
                        </div>
                    </div>
                );
            case 'experience':
                return (
                    <div className="w-full flex flex-col gap-2 text-[10px] text-left">
                        {/* Expanded Item */}
                        <div className="border border-slate-400 rounded-md p-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex gap-1">
                                    <span className="font-bold text-slate-300">01</span>
                                    <div>
                                        <p className="font-bold text-slate-600">Title</p>
                                        <p className="text-slate-400">Description text goes here...</p>
                                    </div>
                                </div>
                                <div className={`${baseBoxClasses} aspect-video`}>Img</div>
                            </div>
                        </div>
                        {/* Collapsed Item */}
                        <div className="border border-slate-400 rounded-md p-2 flex justify-between items-center">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-300">02</span>
                                <p className="text-slate-500">Title</p>
                            </div>
                            <div className="text-slate-600 font-bold">+</div>
                        </div>
                    </div>
                );
            case 'contents':
                return (
                    <div className="flex w-full justify-center gap-4">
                        <div className={`${baseBoxClasses} w-[60px] h-[80px]`}>instagram</div>
                        <div className={`${baseBoxClasses} w-[60px] h-[80px]`}>youtube</div>
                    </div>
                );
            case 'contact':
                return (
                    <div className="grid grid-cols-2 gap-2 w-full p-4">
                        <div className={`${baseBoxClasses} aspect-square flex-col`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-400 mb-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Map
                        </div>
                        <div className="flex flex-col justify-center gap-1.5 text-left text-[10px]">
                            <p className="font-bold text-slate-600">Address</p>
                            <div className="h-2 w-full bg-slate-300 rounded-sm" />
                            <div className="h-2 w-4/5 bg-slate-300 rounded-sm" />
                            <p className="font-bold text-slate-600 mt-2">Time</p>
                            <div className="h-2 w-full bg-slate-300 rounded-sm" />
                            <div className="h-2 w-full bg-slate-300 rounded-sm" />
                        </div>
                    </div>
                );
            default:
                return <div className="text-center text-sm text-slate-400 py-4">미리보기가 제공되지 않는 섹션입니다.</div>;
        }
    };

    return (
        <div className="border-b border-slate-200">
            <div className="bg-slate-50 px-2 rounded-lg min-h-[160px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    );
};

const ItemEditor = ({ item, onUpdate, onRemove }: { item: DisplayItem; onUpdate: (updatedItem: DisplayItem) => void; onRemove: (item: DisplayItem) => void; }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(item.overrideImageUrl || item.originalImageUrl);

    const handleFieldChange = (field: keyof DisplayItem, value: any) => {
        onUpdate({ ...item, [field]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            handleFieldChange('newImageFile', file);
            const newPreviewUrl = URL.createObjectURL(file);
            setPreviewUrl(newPreviewUrl);
            handleFieldChange('overrideImageUrl', newPreviewUrl);
        }
    };

    return (
        <Card className="p-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => onRemove(item)}><X className="h-4 w-4" /></Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-2">
                    <Label>원본 정보</Label>
                    <div className="p-2 bg-slate-50 rounded-md border text-xs">
                        <p className="font-semibold truncate">{item.originalTitle}</p>
                        <p className="text-slate-500 truncate">{item.originalDescription}</p>
                    </div>
                    <img src={item.originalImageUrl} alt="Original" className="w-full h-24 object-cover rounded-md" />
                </div>
                <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-2">
                        <Switch id={`override-${item.id}-${item.type}`} checked={item.useOverride} onCheckedChange={(checked) => handleFieldChange('useOverride', checked)} />
                        <Label htmlFor={`override-${item.id}-${item.type}`}>노출 내용 수정</Label>
                    </div>
                    <div className={`space-y-2 transition-opacity ${item.useOverride ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div><Label>제목</Label><Input value={item.overrideTitle} onChange={(e) => handleFieldChange('overrideTitle', e.target.value)} /></div>
                        <div><Label>설명</Label><Textarea value={item.overrideDescription} onChange={(e) => handleFieldChange('overrideDescription', e.target.value)} rows={2} /></div>
                        <div>
                            <Label>이미지</Label>
                            <div className="flex items-center gap-2">
                                {previewUrl && <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />}
                                <Input type="file" onChange={handleFileChange} accept="image/*" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const SelectionDialog = ({ title, allItems, selectedIds, onSave, isOpen, onOpenChange }: { title: string; allItems: (Event | Treatment)[]; selectedIds: Set<string>; onSave: (newIds: Set<number>) => void; isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) => {
    const [currentSelection, setCurrentSelection] = useState(selectedIds);

    useEffect(() => {
        if (isOpen) {
            setCurrentSelection(selectedIds);
        }
    }, [isOpen, selectedIds]);

    const handleSave = () => { 
        const numericIds = new Set(Array.from(currentSelection).map(k => parseInt(k.split('-')[1])));
        onSave(numericIds); 
        onOpenChange(false); 
    };

    const events = allItems.filter(item => 'title' in item) as Event[];
    const treatments = allItems.filter(item => 'name' in item) as Treatment[];

    const renderList = (items: (Event | Treatment)[], type: 'event' | 'treatment', listTitle: string) => (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 my-3 sticky top-0 bg-white py-2 border-b">{listTitle}</h3>
            <ul className="space-y-2">
                {items.map(item => {
                    const itemKey = `${type}-${item.id}`;
                    const name = type === 'event' ? (item as Event).title : (item as Treatment).name;
                    const isSelected = currentSelection.has(itemKey);
                    return (
                        <li key={itemKey} className={`flex items-center p-2 rounded-md cursor-pointer ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}`} onClick={() => {
                            const newSet = new Set(currentSelection);
                            if (isSelected) newSet.delete(itemKey); else newSet.add(itemKey);
                            setCurrentSelection(newSet);
                        }}>
                            <Checkbox checked={isSelected} className="mr-4" />
                            <img src={item.imageUrl} alt={name} className="w-12 h-12 object-cover rounded-md mr-4" />
                            <span className="font-semibold">{name}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{title} 선택</DialogTitle></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {events.length > 0 && renderList(events, 'event', '의료정보 (이벤트)')}
                    {treatments.length > 0 && renderList(treatments, 'treatment', '시술')}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
                    <Button onClick={handleSave}>선택 완료</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

type BrandValueDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    brandValue: BrandValue | null;
    onSubmit: (formData: Omit<BrandValue, 'id' | 'branchSlug'>) => void;
};

const BrandValueDialog = ({ isOpen, onClose, brandValue, onSubmit }: BrandValueDialogProps) => {
    const [formData, setFormData] = useState({ label: '', value: '', displayOrder: 0 });

    useEffect(() => {
        if (isOpen) {
            if (brandValue) {
                setFormData({
                    label: brandValue.label,
                    value: brandValue.value,
                    displayOrder: brandValue.displayOrder,
                });
            } else {
                setFormData({ label: '', value: '', displayOrder: 0 });
            }
        }
    }, [isOpen, brandValue]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{brandValue ? '항목 수정' : '새 항목 추가'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Label (예: 설립일)</Label>
                        <Input value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} required />
                    </div>
                    <div>
                        <Label>Value (예: 2023년 10월)</Label>
                        <Input value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} required />
                    </div>
                    <div>
                        <Label>표시 순서</Label>
                        <Input type="number" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                        <Button type="submit">저장</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const BrandValueEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [values, setValues] = useState<BrandValue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<BrandValue | null>(null);

    const fetchValues = useCallback(async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getBrandValues(branchSlug);
            setValues(data);
        } catch (error) {
            console.error("Failed to fetch brand values:", error);
            toast.error("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [branchSlug]);

    useEffect(() => {
        fetchValues();
    }, [fetchValues]);

    const handleFormSubmit = async (formData: Omit<BrandValue, 'id' | 'branchSlug'>) => {
        if (!branchSlug) return;
        try {
            const payload = { ...formData, branchSlug };
            if (selectedValue) {
                await updateBrandValue(selectedValue.id, payload);
                toast.success("성공적으로 수정되었습니다.");
            } else {
                await createBrandValue(payload);
                toast.success("성공적으로 추가되었습니다.");
            }
            fetchValues();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save brand value:", error);
            toast.error("저장에 실패했습니다.");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
            try {
                await deleteBrandValue(id);
                toast.success("성공적으로 삭제되었습니다.");
                fetchValues();
            } catch (error) {
                console.error("Failed to delete brand value:", error);
                toast.error("삭제에 실패했습니다.");
            }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>TONE’S BRAND VALUE 관리</CardTitle>
                <Button onClick={() => { setSelectedValue(null); setIsDialogOpen(true); }}>
                    <PlusCircle size={16} className="mr-2" /> 새 항목 추가
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>로딩 중...</p>
                ) : (
                    <div className="space-y-4">
                        {values.map(v => (
                            <Card key={v.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">{v.label}</h4>
                                    <p className="text-sm text-slate-600">{v.value}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedValue(v); setIsDialogOpen(true); }}>수정</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(v.id)}>삭제</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
            <BrandValueDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                brandValue={selectedValue}
                onSubmit={handleFormSubmit}
            />
        </Card>
    );
};


const BrandExperienceEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [experiences, setExperiences] = useState<BrandExperience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExperience, setSelectedExperience] = useState<BrandExperience | null>(null);

    const fetchExperiences = useCallback(async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getBrandExperiences(branchSlug);
            setExperiences(data);
        } catch (error) {
            console.error("Failed to fetch brand experiences:", error);
            toast.error("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [branchSlug]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    const handleFormSubmit = async (formData: Omit<BrandExperience, 'id' | 'branchSlug'>, newImageFile?: File) => {
        if (!branchSlug) return;
        try {
            let imageUrl = formData.imageUrl;
            if (newImageFile) {
                const uploadResult = await uploadImage(newImageFile);
                imageUrl = uploadResult.imageUrl;
            }

            const payload = { ...formData, branchSlug, imageUrl };

            if (selectedExperience) {
                await updateBrandExperience(selectedExperience.id, payload);
                toast.success("성공적으로 수정되었습니다.");
            } else {
                await createBrandExperience(payload);
                toast.success("성공적으로 추가되었습니다.");
            }
            fetchExperiences();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save brand experience:", error);
            toast.error("저장에 실패했습니다.");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
            try {
                await deleteBrandExperience(id);
                toast.success("성공적으로 삭제되었습니다.");
                fetchExperiences();
            } catch (error) {
                console.error("Failed to delete brand experience:", error);
                toast.error("삭제에 실패했습니다.");
            }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>TONE’S EXPERIENCE 관리</CardTitle>
                <Button onClick={() => { setSelectedExperience(null); setIsDialogOpen(true); }}>
                    <PlusCircle size={16} className="mr-2" /> 새 항목 추가
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>로딩 중...</p>
                ) : (
                    <div className="space-y-4">
                        {experiences.map(exp => (
                            <Card key={exp.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={exp.imageUrl} alt={exp.title} className="w-20 h-20 object-cover rounded-md" />
                                    <div>
                                        <h4 className="font-semibold">{exp.title}</h4>
                                        <p className="text-sm text-slate-600">{exp.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedExperience(exp); setIsDialogOpen(true); }}>수정</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(exp.id)}>삭제</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
            <BrandExperienceDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                experience={selectedExperience}
                onSubmit={handleFormSubmit}
            />
        </Card>
    );
};

type BrandExperienceDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    experience: BrandExperience | null;
    onSubmit: (formData: Omit<BrandExperience, 'id' | 'branchSlug'>, newImageFile?: File) => void;
};

const BrandExperienceDialog = ({ isOpen, onClose, experience, onSubmit }: BrandExperienceDialogProps) => {
    const [formData, setFormData] = useState({ title: '', description: '', imageUrl: '', displayOrder: 0 });
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (experience) {
                setFormData({
                    title: experience.title,
                    description: experience.description,
                    imageUrl: experience.imageUrl,
                    displayOrder: experience.displayOrder,
                });
                setPreviewUrl(experience.imageUrl);
            } else {
                setFormData({ title: '', description: '', imageUrl: '', displayOrder: 0 });
                setPreviewUrl(null);
            }
            setNewImageFile(null);
        }
    }, [isOpen, experience]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData, newImageFile || undefined);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{experience ? '항목 수정' : '새 항목 추가'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>제목</Label>
                        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div>
                        <Label>설명</Label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                    </div>
                    <div>
                        <Label>이미지</Label>
                        {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-md my-2" />}
                        <Input type="file" onChange={handleFileChange} accept="image/*" required={!experience} />
                    </div>
                    <div>
                        <Label>표시 순서</Label>
                        <Input type="number" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                        <Button type="submit">저장</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ContactInfoEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [branch, setBranch] = useState<Partial<Branch> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
    const addressSearchRef = useRef<HTMLDivElement>(null);

    const fetchBranchData = useCallback(async () => {
        if (branchSlug) {
            setIsLoading(true);
            try {
                const data = await getBranchBySlug(branchSlug);
                setBranch(data);
            } catch (error) {
                console.error(error);
                toast.error("지점 정보를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    }, [branchSlug]);

    useEffect(() => {
        fetchBranchData();
    }, [fetchBranchData]);

    useEffect(() => {
        if (isAddressSearchOpen && addressSearchRef.current) {
            addressSearchRef.current.innerHTML = '';
            new window.daum.Postcode({
                oncomplete: function(data: any) {
                    setBranch(prev => ({ ...prev, postcode: data.zonecode, address: data.roadAddress }));
                    setIsAddressSearchOpen(false);
                },
                width: '100%', height: '100%'
            }).embed(addressSearchRef.current);
        }
    }, [isAddressSearchOpen]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBranch(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!branch || !branch.id) return;
        setIsSaving(true);
        try {
            await updateBranch(branch.id, branch);
            toast.success("지점 정보가 성공적으로 저장되었습니다.");
            fetchBranchData();
        } catch (error) {
            console.error("Failed to save branch info:", error);
            toast.error("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (!branch) return <p>지점 정보를 찾을 수 없습니다.</p>;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>CONTACT US 정보 수정</CardTitle>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save size={16} className="mr-2" /> {isSaving ? '저장 중...' : '저장'}
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                    <div className="p-3 bg-amber-100 text-amber-800 rounded-md text-sm text-center">
                        <p><strong>주의:</strong> 여기에 입력된 정보는 <strong>조직관리 &gt; 지점관리</strong> 메뉴의 데이터와 직접 연동됩니다.</p>
                        <p>변경사항은 해당 지점의 전체 정보에 반영됩니다.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                        <p className="text-slate-500">네이버 지도 API 연동 예정</p>
                    </div>
                     <div>
                        <Label>우편번호</Label>
                        <div className="flex gap-2">
                            <Input readOnly name="postcode" value={branch.postcode || ''} className="bg-slate-100" />
                            <Button type="button" onClick={() => setIsAddressSearchOpen(!isAddressSearchOpen)} variant="outline">
                                {isAddressSearchOpen ? '닫기' : '주소 검색'}
                            </Button>
                        </div>
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAddressSearchOpen ? 'h-96 mt-2 opacity-100' : 'h-0 mt-0 opacity-0'}`}><div ref={addressSearchRef} className="w-full h-full border rounded-md"></div></div>
                    <div><Label>주소</Label><Input readOnly name="address" value={branch.address || ''} className="bg-slate-100" /></div>
                    <div><Label>상세주소</Label><Input name="addressDetail" value={branch.addressDetail || ''} onChange={handleChange} /></div>
                </div>
                <div className="space-y-4">
                    <div><Label>대표번호</Label><Input name="phone" value={branch.phone || ''} onChange={handleChange} /></div>
                    <div><Label>평일 진료시간</Label><Input name="hoursWeekday" value={branch.hoursWeekday || ''} onChange={handleChange} /></div>
                    <div><Label>토요일 진료시간</Label><Input name="hoursSaturday" value={branch.hoursSaturday || ''} onChange={handleChange} /></div>
                    <div><Label>점심시간</Label><Input name="lunchTime" value={branch.lunchTime || ''} onChange={handleChange} /></div>
                    <div><Label>휴진일</Label><Input name="closedDays" value={branch.closedDays || ''} onChange={handleChange} /></div>
                    <div><Label>진료시간 메모</Label><Textarea name="hoursMemo" value={branch.hoursMemo || ''} onChange={handleChange} /></div>
                </div>
            </CardContent>
        </Card>
    );
};

const ItemSelectionDialog = ({ isOpen, onClose, group, allItems, onSave, isSaving }: { isOpen: boolean; onClose: () => void; group: SearchRankingGroup; allItems: (Event | Treatment)[]; onSave: (items: { type: 'event' | 'treatment', id: number }[]) => void; isSaving: boolean; }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Always start with a fresh selection when the dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    const handleSave = () => {
        const items = Array.from(selectedIds).map(id => {
            const [type, numId] = id.split('-');
            return { type: type as 'event' | 'treatment', id: parseInt(numId) };
        });
        onSave(items);
    };

    const events = allItems.filter(item => 'title' in item) as Event[];
    const treatments = allItems.filter(item => 'name' in item) as Treatment[];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>'{group.name}' 그룹에 항목 추가</DialogTitle></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 my-3 sticky top-0 bg-white py-2 border-b">의료정보 (이벤트)</h3>
                        <ul className="space-y-2">
                            {events.map(item => {
                                const key = `event-${item.id}`;
                                const isSelected = selectedIds.has(key);
                                return (
                                    <li key={key} onClick={() => {
                                        const newSet = new Set(selectedIds);
                                        if (isSelected) newSet.delete(key); else newSet.add(key);
                                        setSelectedIds(newSet);
                                    }} className={`flex items-center p-2 rounded-md cursor-pointer ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <Checkbox checked={isSelected} className="mr-4" />
                                        <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-md mr-4" />
                                        <span className="font-semibold">{item.title}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 my-3 sticky top-0 bg-white py-2 border-b">시술</h3>
                        <ul className="space-y-2">
                            {treatments.map(item => {
                                const key = `treatment-${item.id}`;
                                const isSelected = selectedIds.has(key);
                                return (
                                    <li key={key} onClick={() => {
                                        const newSet = new Set(selectedIds);
                                        if (isSelected) newSet.delete(key); else newSet.add(key);
                                        setSelectedIds(newSet);
                                    }} className={`flex items-center p-2 rounded-md cursor-pointer ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <Checkbox checked={isSelected} className="mr-4" />
                                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-4" />
                                        <span className="font-semibold">{item.name}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>취소</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? '저장 중...' : '추가'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SortableItem = ({ item, children }: { item: SearchRankingItem; children: (listeners: any) => React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
};

type ItemEditDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    item: SearchRankingItem | NewPromotionItem | SignatureItem | null;
    onSave: (item: SearchRankingItem | NewPromotionItem | SignatureItem, data: { title: string; description: string; }, newImageFile?: File) => Promise<void>;
};

const ItemEditDialog = ({ isOpen, onClose, item, onSave }: ItemEditDialogProps) => {
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            setFormData({
                title: item.title,
                description: item.description || '',
            });
            setPreviewUrl(item.imageUrl);
            setNewImageFile(null);
        }
    }, [isOpen, item]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!item) return;
        setIsSaving(true);
        try {
            await onSave(item, formData, newImageFile || undefined);
            onClose();
        } catch (error) {
            toast.error("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>항목 노출 정보 수정</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>제목</Label>
                        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div>
                        <Label>설명</Label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                        <Label>이미지</Label>
                        {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-md my-2" />}
                        <Input type="file" onChange={handleFileChange} accept="image/*" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? '저장 중...' : '저장'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const NewPromotionEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [editableItems, setEditableItems] = useState<NewPromotionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isItemAddDialogOpen, setIsItemAddDialogOpen] = useState(false);
    const [isItemEditDialogOpen, setIsItemEditDialogOpen] = useState(false);
    const [selectedItemToEdit, setSelectedItemToEdit] = useState<NewPromotionItem | null>(null);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [itemToDelete, setItemToDelete] = useState<NewPromotionItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchData = useCallback(async () => {
        if (!branchSlug) return;
        setIsLoading(true);
        try {
            const [itemsData, eventsData, treatmentsData] = await Promise.all([
                getNewPromotionItems(branchSlug),
                getEvents(),
                getAllTreatments()
            ]);
            setEditableItems(itemsData.sort((a, b) => a.displayOrder - b.displayOrder));
            setAllEvents(eventsData);
            setAllTreatments(treatmentsData);
        } catch (error) {
            console.error("Failed to fetch new promotion data:", error);
            toast.error("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [branchSlug]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleItemEditSave = async (item: NewPromotionItem, data: { title: string; description: string; }, newImageFile?: File) => {
        setEditableItems(prevItems =>
            prevItems.map(currentItem => {
                if (currentItem.id === item.id) {
                    let newImageUrl = currentItem.imageUrl;
                    if (newImageFile) {
                        newImageUrl = URL.createObjectURL(newImageFile);
                    }
                    return {
                        ...currentItem,
                        title: data.title,
                        description: data.description,
                        imageUrl: newImageUrl,
                        newImageFile: newImageFile || currentItem.newImageFile,
                    };
                }
                return currentItem;
            })
        );
        toast.success("항목이 임시 수정되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleRemoveItem = (itemToRemove: NewPromotionItem) => {
        setEditableItems(prev => prev.filter(item => item.id !== itemToRemove.id));
        toast.success("항목이 임시 삭제되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleItemDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setEditableItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveAllChanges = async () => {
        if (!branchSlug) return;
        setIsSaving(true);
        try {
            const itemsToUpdate = await Promise.all(
                editableItems.map(async (item, index) => {
                    let imageUrl = item.imageUrl;
                    if (item.newImageFile) {
                        const uploadResult = await uploadImage(item.newImageFile);
                        imageUrl = uploadResult.imageUrl;
                    }
                    const { id, newImageFile, ...rest } = item;
                    return { ...rest, imageUrl, displayOrder: index + 1 };
                })
            );
            await updateNewPromotionItems(branchSlug, itemsToUpdate);
            toast.success("프로모션 정보가 성공적으로 저장되었습니다.");
            fetchData();
        } catch (error) {
            console.error("Failed to save changes:", error);
            toast.error("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleItemSelectionSave = (itemsToAdd: { type: 'event' | 'treatment', id: number }[]) => {
        const newItems = itemsToAdd.map((item, index) => {
            const content = item.type === 'event'
                ? allEvents.find(e => e.id === item.id)
                : allTreatments.find(t => t.id === item.id);
            if (!content) return null;
            const tempId = Date.now() + Math.floor(Math.random() * 10000) + index;
            return {
                id: tempId,
                displayOrder: 0,
                title: ('title' in content ? content.title : content.name),
                description: content.description || '',
                imageUrl: content.imageUrl,
                linkUrl: `/${item.type}/${item.id}`,
            } as NewPromotionItem;
        }).filter((item): item is NewPromotionItem => item !== null);

        setEditableItems(prev => [...prev, ...newItems]);
        setIsItemAddDialogOpen(false);
        toast.success(`${itemsToAdd.length}개의 항목이 추가되었습니다.`, { description: "전체 변경 사항을 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    if (isLoading) return <p>로딩 중...</p>;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>TONE’S NEW PROMOTION</CardTitle>
                    <p className="text-sm text-slate-500">BEST 시술</p>
                </div>
                <Button onClick={handleSaveAllChanges} disabled={isSaving}>
                    <Save size={16} className="mr-2" /> {isSaving ? '저장 중...' : '모든 변경사항 저장'}
                </Button>
            </CardHeader>
            <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                    <SortableContext items={editableItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {editableItems.map((item, index) => (
                                <SortableItem key={item.id} item={item as any}>
                                    {(itemDragListeners: any) => (
                                        <div className="border rounded-lg bg-white flex flex-col h-full">
                                            <div {...itemDragListeners} className="w-full cursor-grab bg-slate-100 rounded-t-lg p-1 text-xs h-auto flex items-center justify-center">
                                                <span className="font-bold mr-2">{index + 1}</span>
                                                <GripVertical className="h-4 w-4 mr-1" />
                                                끌어서 이동
                                            </div>
                                            <div className="p-2 text-center text-sm flex-1 flex flex-col relative">
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                                <p className="font-semibold truncate mt-auto">{item.title}</p>
                                            </div>
                                            <div className="flex items-center justify-center border-t mt-auto p-1 gap-1">
                                                <Button variant="outline" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => { setSelectedItemToEdit(item); setIsItemEditDialogOpen(true); }}>
                                                    <Edit className="h-3 w-3 mr-1" /> 수정
                                                </Button>
                                                <Button variant="destructive" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setItemToDelete(item)}>
                                                    <Trash2 className="h-3 w-3 mr-1" /> 삭제
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </SortableItem>
                            ))}
                            <Button variant="outline" className="w-full h-full min-h-[140px] flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200" onClick={() => setIsItemAddDialogOpen(true)}>
                                <PlusCircle className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-slate-500">항목 추가</span>
                            </Button>
                        </div>
                    </SortableContext>
                </DndContext>
                 {editableItems.length === 0 && (
                    <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg">
                        <p>표시할 항목이 없습니다. '항목 추가'를 클릭하여 시작하세요.</p>
                    </div>
                )}
            </CardContent>
            <ItemSelectionDialog
                isOpen={isItemAddDialogOpen}
                onClose={() => setIsItemAddDialogOpen(false)}
                group={{ name: "프로모션" } as any}
                allItems={[...allEvents, ...allTreatments]}
                onSave={handleItemSelectionSave}
                isSaving={isSaving}
            />
            <ItemEditDialog
                isOpen={isItemEditDialogOpen}
                onClose={() => setIsItemEditDialogOpen(false)}
                item={selectedItemToEdit}
                onSave={handleItemEditSave as any}
            />
            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) {
                        handleRemoveItem(itemToDelete);
                        setItemToDelete(null);
                    }
                }}
                title="항목 삭제 확인"
                description="이 항목을 목록에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 최종 저장을 해야 서버에 반영됩니다."
                confirmText="삭제"
            />
        </Card>
    );
};

const SignatureEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [editableItems, setEditableItems] = useState<SignatureItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isItemAddDialogOpen, setIsItemAddDialogOpen] = useState(false);
    const [isItemEditDialogOpen, setIsItemEditDialogOpen] = useState(false);
    const [selectedItemToEdit, setSelectedItemToEdit] = useState<SignatureItem | null>(null);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [itemToDelete, setItemToDelete] = useState<SignatureItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchData = useCallback(async () => {
        if (!branchSlug) return;
        setIsLoading(true);
        try {
            const [itemsData, eventsData, treatmentsData] = await Promise.all([
                getSignatureItems(branchSlug),
                getEvents(),
                getAllTreatments()
            ]);
            setEditableItems(itemsData.sort((a, b) => a.displayOrder - b.displayOrder));
            setAllEvents(eventsData);
            setAllTreatments(treatmentsData);
        } catch (error) {
            console.error("Failed to fetch signature data:", error);
            toast.error("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [branchSlug]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleItemEditSave = async (item: SignatureItem, data: { title: string; description: string; }, newImageFile?: File) => {
        setEditableItems(prevItems =>
            prevItems.map(currentItem => {
                if (currentItem.id === item.id) {
                    let newImageUrl = currentItem.imageUrl;
                    if (newImageFile) {
                        newImageUrl = URL.createObjectURL(newImageFile);
                    }
                    return {
                        ...currentItem,
                        title: data.title,
                        description: data.description,
                        imageUrl: newImageUrl,
                        newImageFile: newImageFile || currentItem.newImageFile,
                    };
                }
                return currentItem;
            })
        );
        toast.success("항목이 임시 수정되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleRemoveItem = (itemToRemove: SignatureItem) => {
        setEditableItems(prev => prev.filter(item => item.id !== itemToRemove.id));
        toast.success("항목이 임시 삭제되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleItemDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setEditableItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveAllChanges = async () => {
        if (!branchSlug) return;
        setIsSaving(true);
        try {
            const itemsToUpdate = await Promise.all(
                editableItems.map(async (item, index) => {
                    let imageUrl = item.imageUrl;
                    if (item.newImageFile) {
                        const uploadResult = await uploadImage(item.newImageFile);
                        imageUrl = uploadResult.imageUrl;
                    }
                    const { id, newImageFile, ...rest } = item;
                    return { ...rest, imageUrl, displayOrder: index + 1 };
                })
            );
            await updateSignatureItems(branchSlug, itemsToUpdate);
            toast.success("시그니처 정보가 성공적으로 저장되었습니다.");
            fetchData();
        } catch (error) {
            console.error("Failed to save changes:", error);
            toast.error("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleItemSelectionSave = (itemsToAdd: { type: 'event' | 'treatment', id: number }[]) => {
        const newItems = itemsToAdd.map((item, index) => {
            const content = item.type === 'event'
                ? allEvents.find(e => e.id === item.id)
                : allTreatments.find(t => t.id === item.id);
            if (!content) return null;
            const tempId = Date.now() + Math.floor(Math.random() * 10000) + index;
            return {
                id: tempId,
                displayOrder: 0,
                title: ('title' in content ? content.title : content.name),
                description: content.description || '',
                imageUrl: content.imageUrl,
                linkUrl: `/${item.type}/${item.id}`,
            } as SignatureItem;
        }).filter((item): item is SignatureItem => item !== null);

        setEditableItems(prev => [...prev, ...newItems]);
        setIsItemAddDialogOpen(false);
        toast.success(`${itemsToAdd.length}개의 항목이 추가되었습니다.`, { description: "전체 변경 사항을 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    if (isLoading) return <p>로딩 중...</p>;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>TONE’S SIGNATURE</CardTitle>
                    <p className="text-sm text-slate-500">시그니처 시술</p>
                </div>
                <Button onClick={handleSaveAllChanges} disabled={isSaving}>
                    <Save size={16} className="mr-2" /> {isSaving ? '저장 중...' : '모든 변경사항 저장'}
                </Button>
            </CardHeader>
            <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                    <SortableContext items={editableItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {editableItems.map((item, index) => (
                                <SortableItem key={item.id} item={item as any}>
                                    {(itemDragListeners: any) => (
                                        <div className="border rounded-lg bg-white flex flex-col h-full">
                                            <div {...itemDragListeners} className="w-full cursor-grab bg-slate-100 rounded-t-lg p-1 text-xs h-auto flex items-center justify-center">
                                                <span className="font-bold mr-2">{index + 1}</span>
                                                <GripVertical className="h-4 w-4 mr-1" />
                                                끌어서 이동
                                            </div>
                                            <div className="p-2 text-center text-sm flex-1 flex flex-col relative">
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                                <p className="font-semibold truncate mt-auto">{item.title}</p>
                                            </div>
                                            <div className="flex items-center justify-center border-t mt-auto p-1 gap-1">
                                                <Button variant="outline" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => { setSelectedItemToEdit(item); setIsItemEditDialogOpen(true); }}>
                                                    <Edit className="h-3 w-3 mr-1" /> 수정
                                                </Button>
                                                <Button variant="destructive" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setItemToDelete(item)}>
                                                    <Trash2 className="h-3 w-3 mr-1" /> 삭제
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </SortableItem>
                            ))}
                            <Button variant="outline" className="w-full h-full min-h-[140px] flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200" onClick={() => setIsItemAddDialogOpen(true)}>
                                <PlusCircle className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-slate-500">항목 추가</span>
                            </Button>
                        </div>
                    </SortableContext>
                </DndContext>
                 {editableItems.length === 0 && (
                    <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg">
                        <p>표시할 항목이 없습니다. '항목 추가'를 클릭하여 시작하세요.</p>
                    </div>
                )}
            </CardContent>
            <ItemSelectionDialog
                isOpen={isItemAddDialogOpen}
                onClose={() => setIsItemAddDialogOpen(false)}
                group={{ name: "시그니처" } as any}
                allItems={[...allEvents, ...allTreatments]}
                onSave={handleItemSelectionSave}
                isSaving={isSaving}
            />
            <ItemEditDialog
                isOpen={isItemEditDialogOpen}
                onClose={() => setIsItemEditDialogOpen(false)}
                item={selectedItemToEdit}
                onSave={handleItemEditSave as any}
            />
            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) {
                        handleRemoveItem(itemToDelete);
                        setItemToDelete(null);
                    }
                }}
                title="항목 삭제 확인"
                description="이 항목을 목록에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 최종 저장을 해야 서버에 반영됩니다."
                confirmText="삭제"
            />
        </Card>
    );
};

const SortableGroupTab = ({ group, index, activeGroupId, setActiveGroupId, editingGroupId, setEditingGroupId, handleGroupChange, removeGroup }: {
    group: SearchRankingGroup;
    index: number;
    activeGroupId: number | null;
    setActiveGroupId: (id: number) => void;
    editingGroupId: number | null;
    setEditingGroupId: (id: number | null) => void;
    handleGroupChange: (id: number, value: string) => void;
    removeGroup: (id: number) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = activeGroupId === group.id;
    const isEditing = editingGroupId === group.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center flex-shrink-0 bg-white rounded-md border h-9 transition-shadow ${isActive ? 'ring-1 ring-[#BB2649]' : ''}`}
        >
            <div className="flex items-center justify-center w-8 h-full rounded-l-md text-slate-600 font-bold text-sm bg-slate-100">
                {index + 1}
            </div>
            <div {...attributes} {...listeners} className="cursor-grab p-2 text-slate-400 hover:bg-slate-50 h-full flex items-center bg-slate-100">
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-shrink-0">
                {isEditing ? (
                    <Input
                        autoFocus
                        value={group.name}
                        onChange={e => handleGroupChange(group.id, e.target.value)}
                        onBlur={() => setEditingGroupId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingGroupId(null)}
                        className="w-28 h-full rounded-none border-0 focus-visible:ring-0"
                    />
                ) : (
                    <Button
                        variant={isActive ? "secondary" : "ghost"}
                        onClick={() => setActiveGroupId(group.id)}
                        className="group h-full rounded-none rounded-r-md px-3 bg-slate-100"
                    >
                        {group.name}
                        <Edit className="h-3 w-3 ml-2 text-slate-500 hover:text-slate-800 transition-colors" onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); }} />
                        <Trash2 className="h-3 w-3 ml-1 text-slate-500 hover:text-slate-800 transition-colors" onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} />
                    </Button>
                )}
            </div>
        </div>
    );
};

const SearchRankingEditor = () => {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [editableGroups, setEditableGroups] = useState<SearchRankingGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    
    const [isItemAddDialogOpen, setIsItemAddDialogOpen] = useState(false);
    const [isItemEditDialogOpen, setIsItemEditDialogOpen] = useState(false);
    const [selectedItemToEdit, setSelectedItemToEdit] = useState<SearchRankingItem | null>(null);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [itemToDelete, setItemToDelete] = useState<{groupId: number, itemId: number} | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchData = useCallback(async () => {
        if (!branchSlug) return;
        setIsLoading(true);
        try {
            const [groupsData, eventsData, treatmentsData] = await Promise.all([
                getSearchRankingGroups(branchSlug),
                getEvents(),
                getAllTreatments()
            ]);
            const sortedGroups = groupsData.sort((a, b) => a.displayOrder - b.displayOrder);
            setEditableGroups(sortedGroups);
            if (sortedGroups.length > 0) {
                setActiveGroupId(sortedGroups[0].id);
            } else {
                setActiveGroupId(null);
            }
            setAllEvents(eventsData);
            setAllTreatments(treatmentsData);
        } catch (error) {
            console.error("Failed to fetch search ranking data:", error);
            toast.error("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [branchSlug]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGroupChange = (id: number, value: string) => {
        setEditableGroups(prev => prev.map(g => g.id === id ? { ...g, name: value } : g));
    };

    const addNewGroup = () => {
        if (editableGroups.length >= 20) {
            toast.error("그룹은 최대 20개까지 추가할 수 있습니다.");
            return;
        }
        const newId = Date.now();
        const maxOrder = editableGroups.reduce((max, g) => Math.max(max, g.displayOrder), 0);
        const newGroup = { id: newId, name: '새 그룹', displayOrder: maxOrder + 1, branchSlug: branchSlug!, items: [] };
        setEditableGroups(prev => [...prev, newGroup]);
        setActiveGroupId(newId);
        setEditingGroupId(newId);
    };

    const removeGroup = (id: number) => {
        setEditableGroups(prev => {
            const newGroups = prev.filter(g => g.id !== id);
            if (activeGroupId === id) {
                setActiveGroupId(newGroups.length > 0 ? newGroups[0].id : null);
            }
            return newGroups;
        });
    };
    
    const handleItemEditSave = async (item: SearchRankingItem, data: { title: string; description: string; }, newImageFile?: File) => {
        setEditableGroups(prevGroups => 
            prevGroups.map(group => ({
                ...group,
                items: group.items.map(currentItem => {
                    if (currentItem.id === item.id) {
                        let newImageUrl = currentItem.imageUrl;
                        if (newImageFile) {
                            newImageUrl = URL.createObjectURL(newImageFile);
                        }
                        return { ...currentItem, title: data.title, description: data.description, imageUrl: newImageUrl, newImageFile: newImageFile || currentItem.newImageFile };
                    }
                    return currentItem;
                })
            }))
        );
        toast.success("항목이 임시 수정되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleRemoveItem = (groupId: number, itemId: number) => {
        setEditableGroups(prevGroups => prevGroups.map(group => {
            if (group.id === groupId) {
                return { ...group, items: group.items.filter(item => item.id !== itemId) };
            }
            return group;
        }));
        toast.success("항목이 임시 삭제되었습니다.", { description: "변경 사항을 최종 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const handleItemDragEnd = (groupId: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setEditableGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    const oldIndex = group.items.findIndex(item => item.id === active.id);
                    const newIndex = group.items.findIndex(item => item.id === over.id);
                    const newItems = arrayMove(group.items, oldIndex, newIndex);
                    return { ...group, items: newItems.map((item, index) => ({ ...item, displayOrder: index + 1 })) };
                }
                return group;
            }));
        }
    };

    const handleGroupDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setEditableGroups((groups) => {
                const oldIndex = groups.findIndex((g) => g.id === active.id);
                const newIndex = groups.findIndex((g) => g.id === over.id);
                const reorderedGroups = arrayMove(groups, oldIndex, newIndex);
                return reorderedGroups.map((g, index) => ({ ...g, displayOrder: index + 1 }));
            });
        }
    };

    const handleSaveAllChanges = async () => {
        if (!branchSlug) return;
        setIsSaving(true);
        try {
            const originalGroups = await getSearchRankingGroups(branchSlug);
            const originalGroupsMap = new Map(originalGroups.map(g => [g.id, g]));
            const finalGroups = editableGroups.map((group, index) => ({ ...group, displayOrder: index + 1 }));

            const deletedGroupIds = originalGroups
                .filter(og => !finalGroups.some(fg => fg.id === og.id))
                .map(g => g.id);
            await Promise.all(deletedGroupIds.map(id => deleteSearchRankingGroup(id)));

            for (const group of finalGroups) {
                const isNewGroup = !originalGroupsMap.has(group.id) || group.id > 1000000000;
                let groupId = group.id;

                if (isNewGroup) {
                    const newGroup = await createSearchRankingGroup({ name: group.name, displayOrder: group.displayOrder, branchSlug });
                    groupId = newGroup.id;
                } else {
                    const originalGroup = originalGroupsMap.get(group.id)!;
                    if (originalGroup.name !== group.name || originalGroup.displayOrder !== group.displayOrder) {
                        await updateSearchRankingGroup(group.id, { name: group.name, displayOrder: group.displayOrder });
                    }
                }
                
                const itemsWithUploadedImages = await Promise.all(group.items.map(async (item, index) => {
                    let imageUrl = item.imageUrl;
                    if (item.newImageFile) {
                        const uploadResult = await uploadImage(item.newImageFile);
                        imageUrl = uploadResult.imageUrl;
                    }
                    return { ...item, imageUrl, displayOrder: index + 1 };
                }));

                const finalItemsPayload = itemsWithUploadedImages.map(item => ({
                    type: item.linkUrl?.includes('event') ? 'event' : 'treatment',
                    id: parseInt(item.linkUrl!.split('/')[2]),
                    title: item.title,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    linkUrl: item.linkUrl,
                    displayOrder: item.displayOrder,
                }));
                
                await updateSearchRankingGroupItems(groupId, finalItemsPayload as any);
            }
            toast.success("검색 순위가 성공적으로 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save changes:", error);
            toast.error("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
            fetchData();
        }
    };
    
    const handleItemSelectionSave = (itemsToAdd: { type: 'event' | 'treatment', id: number }[]) => {
        if (!activeGroupId) return;
        const newItems = itemsToAdd.map((item, index) => {
            const content = item.type === 'event' ? allEvents.find(e => e.id === item.id) : allTreatments.find(t => t.id === item.id);
            if (!content) return null;
            const tempId = Date.now() + Math.floor(Math.random() * 10000) + index;
            return {
                id: tempId,
                displayOrder: 0,
                title: ('title' in content ? content.title : content.name),
                description: content.description || '',
                imageUrl: content.imageUrl,
                linkUrl: `/${item.type}/${item.id}`,
            } as SearchRankingItem;
        }).filter((item): item is SearchRankingItem => item !== null);

        setEditableGroups(prev => prev.map(g => {
            if (g.id === activeGroupId) {
                const combinedItems = [...g.items, ...newItems];
                return { ...g, items: combinedItems.map((item, index) => ({ ...item, displayOrder: index + 1 })) };
            }
            return g;
        }));
        
        setIsItemAddDialogOpen(false);
        toast.success(`${itemsToAdd.length}개의 항목이 추가되었습니다.`, { description: "전체 변경 사항을 저장하려면 상단의 저장 버튼을 클릭하세요." });
    };

    const activeGroup = editableGroups.find(g => g.id === activeGroupId);

    if (isLoading) return <p>로딩 중...</p>;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>TONE’S SEARCH RANKING</CardTitle>
                    <p className="text-sm text-slate-500">톤즈의원 인기 시술</p>
                </div>
                <Button onClick={handleSaveAllChanges} disabled={isSaving}>
                    <Save size={16} className="mr-2" /> {isSaving ? '저장 중...' : '모든 변경사항 저장'}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
                    <SortableContext items={editableGroups.map(g => g.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex items-center border-b p-2 mb-4 space-x-2 overflow-x-auto">
                            {editableGroups.map((group, index) => (
                                <SortableGroupTab
                                    key={group.id}
                                    group={group}
                                    index={index}
                                    activeGroupId={activeGroupId}
                                    setActiveGroupId={setActiveGroupId}
                                    editingGroupId={editingGroupId}
                                    setEditingGroupId={setEditingGroupId}
                                    handleGroupChange={handleGroupChange}
                                    removeGroup={removeGroup}
                                />
                            ))}
                            <Button variant="outline" size="sm" onClick={addNewGroup} className="h-9 flex-shrink-0">
                                <PlusCircle size={16} className="mr-2" /> 그룹 추가
                            </Button>
                        </div>
                    </SortableContext>
                </DndContext>

                {activeGroup ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleItemDragEnd(activeGroup.id, e)}>
                        <SortableContext items={activeGroup.items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {activeGroup.items.map((item, index) => (
                                    <SortableItem key={item.id} item={item as any}>
                                        {(itemDragListeners: any) => (
                                            <div className="border rounded-lg bg-white flex flex-col h-full">
                                                <div {...itemDragListeners} className="w-full cursor-grab bg-slate-100 rounded-t-lg p-1 text-xs h-auto flex items-center justify-center">
                                                    <span className="font-bold mr-2">{index + 1}</span>
                                                    <GripVertical className="h-4 w-4 mr-1" /> 끌어서 이동
                                                </div>
                                                <div className="p-2 text-center text-sm flex-1 flex flex-col relative">
                                                    <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                                    <p className="font-semibold truncate mt-auto">{item.title}</p>
                                                </div>
                                                <div className="flex items-center justify-center border-t mt-auto p-1 gap-1">
                                                    <Button variant="outline" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => { setSelectedItemToEdit(item); setIsItemEditDialogOpen(true); }}>
                                                        <Edit className="h-3 w-3 mr-1" /> 수정
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setItemToDelete({ groupId: activeGroup.id, itemId: item.id })}>
                                                        <Trash2 className="h-3 w-3 mr-1" /> 삭제
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </SortableItem>
                                ))}
                                <Button variant="outline" className="w-full h-full min-h-[140px] flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200" onClick={() => setIsItemAddDialogOpen(true)}>
                                    <PlusCircle className="h-8 w-8 text-slate-400 mb-2" />
                                    <span className="text-slate-500">항목 추가</span>
                                </Button>
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg">
                        <p>그룹을 추가하여 시작하세요.</p>
                    </div>
                )}
            </CardContent>
            
            {activeGroup && (
                <ItemSelectionDialog
                    isOpen={isItemAddDialogOpen}
                    onClose={() => setIsItemAddDialogOpen(false)}
                    group={activeGroup}
                    allItems={[...allEvents, ...allTreatments]}
                    onSave={handleItemSelectionSave}
                    isSaving={isSaving}
                />
            )}

            <ItemEditDialog
                isOpen={isItemEditDialogOpen}
                onClose={() => setIsItemEditDialogOpen(false)}
                item={selectedItemToEdit}
                onSave={handleItemEditSave as any}
            />

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) {
                        handleRemoveItem(itemToDelete.groupId, itemToDelete.itemId);
                        setItemToDelete(null);
                    }
                }}
                title="항목 삭제 확인"
                description="이 항목을 목록에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 최종 저장을 해야 서버에 반영됩니다."
                confirmText="삭제"
            />
        </Card>
    );
};

const ContentsEditor = () => {
    const [settings, setSettings] = useState({
        sns_instagram_url: '',
        sns_youtube_url: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const siteSettings = await getSiteSettings();
                const instagramUrl = siteSettings.find((s: { key: string }) => s.key === 'sns_instagram_url')?.value || '';
                const youtubeUrl = siteSettings.find((s: { key: string }) => s.key === 'sns_youtube_url')?.value || '';
                setSettings({
                    sns_instagram_url: instagramUrl,
                    sns_youtube_url: youtubeUrl,
                });
            } catch (error) {
                console.error("Failed to fetch site settings:", error);
                toast.error("SNS 링크를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSiteSettings(settings);
            toast.success("SNS 링크가 성공적으로 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save SNS links:", error);
            toast.error("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>TONE’S CONTENTS</CardTitle>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save size={16} className="mr-2" /> {isSaving ? '저장 중...' : '저장'}
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>로딩 중...</p>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="sns_instagram_url">인스타그램 URL</Label>
                            <Input
                                id="sns_instagram_url"
                                name="sns_instagram_url"
                                type="url"
                                value={settings.sns_instagram_url}
                                onChange={handleChange}
                                placeholder="https://www.instagram.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sns_youtube_url">유튜브 URL</Label>
                            <Input
                                id="sns_youtube_url"
                                name="sns_youtube_url"
                                type="url"
                                value={settings.sns_youtube_url}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/..."
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export function MainPageManagementPage() {
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const [activeSection, setActiveSection] = useState<SectionKey>('hero');

    const [sectionItems, setSectionItems] = useState<Record<string, DisplayItem[]>>({ promotion: [], signature: [] });
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [currentSectionForSelection, setCurrentSectionForSelection] = useState<SectionKey | null>(null);


    const mapToDisplayItem = (item: Event | Treatment, type: 'event' | 'treatment', section: SectionKey): DisplayItem => {
        const name = type === 'event' ? (item as Event).title : (item as Treatment).name;
        let useOverride = false;
        let overrideTitle = '', overrideDescription = '', overrideImageUrl = '';

        if (section === 'promotion' && item.promotionTitle) { useOverride = true; overrideTitle = item.promotionTitle; overrideDescription = item.promotionDescription || ''; overrideImageUrl = item.promotionImageUrl || item.imageUrl; }
        if (section === 'signature' && item.signatureTitle) { useOverride = true; overrideTitle = item.signatureTitle; overrideDescription = item.signatureDescription || ''; overrideImageUrl = item.signatureImageUrl || item.imageUrl; }
        
        return {
            id: item.id, type, originalTitle: name, originalDescription: item.description, originalImageUrl: item.imageUrl,
            useOverride, overrideTitle: useOverride ? overrideTitle : name, overrideDescription: useOverride ? overrideDescription : item.description || '', overrideImageUrl: useOverride ? overrideImageUrl : item.imageUrl,
        };
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [eventsData, treatmentsData] = await Promise.all([getEvents(), getAllTreatments()]);
            setAllEvents(eventsData);
            setAllTreatments(treatmentsData);

            setSectionItems({
                promotion: [...eventsData.filter(e => e.showOnMainPromotion).map(e => mapToDisplayItem(e, 'event', 'promotion')), ...treatmentsData.filter(t => t.showOnMainPromotion).map(t => mapToDisplayItem(t, 'treatment', 'promotion'))],
                signature: [...eventsData.filter(e => e.showOnMainSignature).map(e => mapToDisplayItem(e, 'event', 'signature')), ...treatmentsData.filter(t => t.showOnMainSignature).map(t => mapToDisplayItem(t, 'treatment', 'signature'))],
            });
        } catch (error) { console.error("Failed to fetch data:", error); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveSection = async (sectionKey: SectionKey) => {
        const items = sectionItems[sectionKey];
        setIsSaving(prev => ({ ...prev, [sectionKey]: true }));
        try {
            const processItems = (filteredItems: DisplayItem[]) => Promise.all(filteredItems.map(async item => {
                let finalImageUrl = item.overrideImageUrl;
                if (item.newImageFile) { finalImageUrl = (await uploadImage(item.newImageFile)).imageUrl; }
                return { 
                    id: item.id, 
                    title: item.useOverride ? item.overrideTitle : item.originalTitle, 
                    description: item.useOverride ? item.overrideDescription : null, 
                    imageUrl: item.useOverride ? finalImageUrl : null 
                };
            }));

            const eventPayload = await processItems(items.filter(i => i.type === 'event'));
            const treatmentPayload = await processItems(items.filter(i => i.type === 'treatment'));

            await Promise.all([ updateEventDisplay(sectionKey, eventPayload), updateTreatmentDisplay(sectionKey, treatmentPayload) ]);
            toast.success("저장 완료", { description: `'${SECTIONS.find(s => s.key === sectionKey)?.title}' 섹션이 성공적으로 저장되었습니다.` });
            fetchData();
        } catch (error) { console.error(`Failed to save ${sectionKey} section:`, error); toast.error("저장 실패", { description: "저장에 실패했습니다." }); }
        finally { setIsSaving(prev => ({ ...prev, [sectionKey]: false })); }
    };

    const renderSectionEditor = (sectionKey: SectionKey) => {
        if (sectionKey === 'hero') return <HeroSectionEditor />;
        if (sectionKey === 'promotion') return <NewPromotionEditor />;
        if (sectionKey === 'signature') return <SignatureEditor />;
        if (sectionKey === 'brandValue') return <BrandValueEditor />;
        if (sectionKey === 'experience') return <BrandExperienceEditor />;
        if (sectionKey === 'contact') return <ContactInfoEditor />;
        if (sectionKey === 'ranking') return <SearchRankingEditor />;
        if (sectionKey === 'contents') return <ContentsEditor />;

        const section = SECTIONS.find(s => s.key === sectionKey)!;
        const items = sectionItems[sectionKey];
        const setItems = (newItems: DisplayItem[] | ((prev: DisplayItem[]) => DisplayItem[])) => {
            setSectionItems(prev => ({ ...prev, [sectionKey]: typeof newItems === 'function' ? newItems(prev[sectionKey]) : newItems }));
        };
        const source = [...allEvents, ...allTreatments];

        // Fallback for other sections
        const handleUpdate = (updated: DisplayItem) => setItems(prev => prev.map(i => i.id === updated.id && i.type === updated.type ? updated : i));
        const handleRemove = (toRemove: DisplayItem) => setItems(prev => prev.filter(i => !(i.id === toRemove.id && i.type === toRemove.type)));
        const handleSelectionSave = (newIds: Set<number>) => {
            const newItems = source.filter(s => newIds.has(s.id)).map(s => mapToDisplayItem(s, 'title' in s ? 'event' : 'treatment', sectionKey));
            setItems(newItems);
            setIsSelectionOpen(false);
        };

        return (
            <>
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>{section.title} {section.subtitle && <span className="text-sm font-normal text-slate-500">{section.subtitle}</span>}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => { setCurrentSectionForSelection(sectionKey); setIsSelectionOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> 추가
                            </Button>
                            <Button onClick={() => handleSaveSection(sectionKey)} disabled={isSaving[sectionKey]}>
                                <Save size={16} className="mr-2" /> {isSaving[sectionKey] ? '저장 중...' : '저장'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.length > 0 ? items.map(item => <ItemEditor key={`${item.type}-${item.id}`} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />) : <p className="text-center text-slate-500 py-8">표시할 항목이 없습니다.</p>}
                    </CardContent>
                </Card>
                {currentSectionForSelection === sectionKey && (
                    <SelectionDialog 
                        title={section.title} 
                        allItems={source} 
                        selectedIds={new Set(items.map(i => `${i.type}-${i.id}`))} 
                        onSave={handleSelectionSave}
                        isOpen={isSelectionOpen}
                        onOpenChange={setIsSelectionOpen}
                    />
                )}
            </>
        );
    };

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">메인페이지 관리</h2>
                <p className="text-slate-500 mt-2">메인페이지의 각 섹션에 표시될 컨텐츠를 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-1 lg:sticky top-24">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate size={20} /> 레이아웃 구조</CardTitle></CardHeader>
                        <LayoutPreview sectionKey={activeSection} />
                        <CardContent className="p-2">
                            <div className="divide-y divide-slate-200">
                                {SECTIONS.map(section => (
                                    <div key={section.key} className="py-1 first:pt-0 last:pb-0">
                                        <Button 
                                            variant={activeSection === section.key ? "secondary" : "ghost"} 
                                            className={`w-full justify-start text-left h-auto py-3 transition-all ${activeSection === section.key ? 'ring-2 ring-offset-2 ring-primary' : ''}`} 
                                            onClick={() => setActiveSection(section.key)}
                                            disabled={!section.active}
                                        >
                                            <div>
                                                <span className="font-semibold">{section.title}</span>
                                                {section.subtitle && <span className="block text-xs text-slate-500">{section.subtitle}</span>}
                                            </div>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    {renderSectionEditor(activeSection)}
                </div>
            </div>
        </div>
    );
}
