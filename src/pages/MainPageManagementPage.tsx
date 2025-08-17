import { useState, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, PlusCircle, X, Save, Image as ImageIcon, Edit3, LayoutTemplate } from "lucide-react";
import { getEvents, getAllTreatments, updateEventDisplay, updateTreatmentDisplay, type Event, type Treatment, uploadImage } from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";

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

type SectionKey = 'promotion' | 'signature' | 'ranking';

const SECTIONS: { key: SectionKey; title: string }[] = [
    { key: 'promotion', title: '프로모션 영역' },
    { key: 'signature', title: '시그니처 시술 영역' },
    { key: 'ranking', title: '인기 시술 랭킹 영역' },
];

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
                        <Label htmlFor={`override-${item.id}-${item.type}`}>메인페이지용 내용 덮어쓰기</Label>
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

const SelectionDialog = ({ title, allItems, selectedIds, onSave }: { title: string; allItems: (Event | Treatment)[]; selectedIds: Set<number>; onSave: (newIds: Set<number>) => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSelection, setCurrentSelection] = useState(selectedIds);

    useEffect(() => {
        if (isOpen) {
            setCurrentSelection(selectedIds);
        }
    }, [isOpen, selectedIds]);

    const handleSave = () => { onSave(currentSelection); setIsOpen(false); };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="outline"><Edit3 className="mr-2 h-4 w-4" /> 항목 변경</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{title} 선택</DialogTitle></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    <ul className="space-y-2">
                        {allItems.map(item => {
                            const name = 'title' in item ? item.title : item.name;
                            const isSelected = currentSelection.has(item.id);
                            return (
                                <li key={`${'title' in item ? 'event' : 'treatment'}-${item.id}`} className={`flex items-center p-2 rounded-md ${isSelected ? 'bg-slate-100' : ''}`} onClick={() => {
                                    const newSet = new Set(currentSelection);
                                    if (isSelected) newSet.delete(item.id); else newSet.add(item.id);
                                    setCurrentSelection(newSet);
                                }}>
                                    <Checkbox checked={isSelected} className="mr-4" />
                                    <img src={item.imageUrl} alt={name} className="w-12 h-12 object-cover rounded-md mr-4" />
                                    <div>
                                        <span className="font-semibold">{name}</span>
                                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${'title' in item ? 'bg-cyan-100 text-cyan-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                            {'title' in item ? '이벤트' : '시술'}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>취소</Button>
                    <Button onClick={handleSave}>선택 완료</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function MainPageManagementPage() {
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const [activeSection, setActiveSection] = useState<SectionKey>('promotion');
    const { showToast } = useToast();

    const [sectionItems, setSectionItems] = useState<Record<SectionKey, DisplayItem[]>>({ promotion: [], signature: [], ranking: [] });

    const mapToDisplayItem = (item: Event | Treatment, type: 'event' | 'treatment', section: SectionKey): DisplayItem => {
        const name = type === 'event' ? (item as Event).title : (item as Treatment).name;
        let useOverride = false;
        let overrideTitle = '', overrideDescription = '', overrideImageUrl = '';

        if (section === 'promotion' && item.promotionTitle) { useOverride = true; overrideTitle = item.promotionTitle; overrideDescription = item.promotionDescription || ''; overrideImageUrl = item.promotionImageUrl || item.imageUrl; }
        if (section === 'signature' && item.signatureTitle) { useOverride = true; overrideTitle = item.signatureTitle; overrideDescription = item.signatureDescription || ''; overrideImageUrl = item.signatureImageUrl || item.imageUrl; }
        if (section === 'ranking' && item.searchRankingTitle) { useOverride = true; overrideTitle = item.searchRankingTitle; overrideDescription = item.searchRankingDescription || ''; overrideImageUrl = item.searchRankingImageUrl || item.imageUrl; }

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
                ranking: [...eventsData.filter(e => e.showOnMainSearchRanking).map(e => mapToDisplayItem(e, 'event', 'ranking')), ...treatmentsData.filter(t => t.showOnMainSearchRanking).map(t => mapToDisplayItem(t, 'treatment', 'ranking'))],
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
                return { id: item.id, title: item.useOverride ? item.overrideTitle : null, description: item.useOverride ? item.overrideDescription : null, imageUrl: item.useOverride ? finalImageUrl : null };
            }));

            const eventPayload = await processItems(items.filter(i => i.type === 'event'));
            const treatmentPayload = await processItems(items.filter(i => i.type === 'treatment'));

            await Promise.all([ updateEventDisplay(sectionKey, eventPayload), updateTreatmentDisplay(sectionKey, treatmentPayload) ]);
            alert(`'${SECTIONS.find(s => s.key === sectionKey)?.title}' 섹션이 성공적으로 저장되었습니다.`);
            fetchData();
        } catch (error) { console.error(`Failed to save ${sectionKey} section:`, error); alert("저장에 실패했습니다."); }
        finally { setIsSaving(prev => ({ ...prev, [sectionKey]: false })); }
    };

    const renderSectionEditor = (sectionKey: SectionKey) => {
        const section = SECTIONS.find(s => s.key === sectionKey)!;
        const items = sectionItems[sectionKey];
        const setItems = (newItems: DisplayItem[] | ((prev: DisplayItem[]) => DisplayItem[])) => {
            setSectionItems(prev => ({ ...prev, [sectionKey]: typeof newItems === 'function' ? newItems(prev[sectionKey]) : newItems }));
        };
        
        const source = sectionKey === 'promotion' ? [...allEvents, ...allTreatments] : allTreatments;
        
        const handleUpdate = (updated: DisplayItem) => setItems(prev => prev.map(i => i.id === updated.id && i.type === updated.type ? updated : i));
        const handleRemove = (toRemove: DisplayItem) => setItems(prev => prev.filter(i => !(i.id === toRemove.id && i.type === toRemove.type)));
        const handleSelectionSave = (newIds: Set<number>) => {
            const newItems = source.filter(s => newIds.has(s.id)).map(s => mapToDisplayItem(s, 'title' in s ? 'event' : 'treatment', sectionKey));
            setItems(newItems);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{section.title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <SelectionDialog title={section.title} allItems={source} selectedIds={new Set(items.map(i => i.id))} onSave={handleSelectionSave} />
                        <Button onClick={() => handleSaveSection(sectionKey)} disabled={isSaving[sectionKey]}>
                            <Save size={16} className="mr-2" /> {isSaving[sectionKey] ? '저장 중...' : '저장'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.length > 0 ? items.map(item => <ItemEditor key={`${item.type}-${item.id}`} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />) : <p className="text-center text-slate-500 py-8">표시할 항목이 없습니다.</p>}
                </CardContent>
            </Card>
        );
    };

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">메인페이지 관리</h2>
                <p className="text-slate-500 mt-2">메인페이지의 각 섹션에 표시될 컨텐츠를 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-1 lg:sticky top-24">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate size={20} /> 레이아웃 구조</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {SECTIONS.map(section => (
                                <Button key={section.key} variant={activeSection === section.key ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection(section.key)}>
                                    {section.title}
                                </Button>
                            ))}
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