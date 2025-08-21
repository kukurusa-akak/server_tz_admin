import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, UploadCloud } from "lucide-react";
import { getEventsByBranch, createEvent, updateEvent, deleteEvent, uploadImage, type Event, getTreatmentsByBranch, type Treatment, getTreatmentCategories, type TreatmentCategory } from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

const formatDateForInput = (date: string | Date): string => {
    return new Date(date).toISOString().split('T')[0];
};

// --- Event-specific Treatment Modal ---
const EventTreatmentModal = ({
    branchSlug,
    initialData,
    onSave,
    onCancel,
    categories
}: {
    branchSlug: string;
    initialData: any;
    onSave: (data: any) => void;
    onCancel: () => void;
    categories: TreatmentCategory[];
}) => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // States for filter inputs
    const [tempSearchTerm, setTempSearchTerm] = useState("");
    const [tempCategoryId, setTempCategoryId] = useState<string | null>(null);

    // States for applied filters
    const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
    const [appliedCategoryId, setAppliedCategoryId] = useState<string | null>(null);

    const [formData, setFormData] = useState(initialData || {});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        const fetchTreatments = async () => {
            try {
                setIsLoading(true);
                const data = await getTreatmentsByBranch(branchSlug);
                setTreatments(data);
            } catch (error) {
                console.error("Failed to fetch treatments:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTreatments();
    }, [branchSlug]);

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSelectTemplate = (treatment: Treatment) => {
        const category = categories.find(c => c.id === treatment.treatmentCategoryId);
        setFormData({
            name: treatment.name,
            category: treatment.category,
            treatmentCategoryName: category ? category.name : '',
            price: treatment.price,
            description: treatment.description,
        });
    };

    const handleSave = async () => {
        onSave(formData);
    };

    const handleApplyFilters = () => {
        setAppliedSearchTerm(tempSearchTerm);
        setAppliedCategoryId(tempCategoryId);
        setCurrentPage(1); // Reset to first page on new search
    };

    const filteredTreatments = useMemo(() =>
        treatments.filter(t => {
            const nameMatch = t.name.toLowerCase().includes(appliedSearchTerm.toLowerCase());
            const categoryMatch = !appliedCategoryId || t.treatmentCategoryId === parseInt(appliedCategoryId);
            return nameMatch && categoryMatch;
        }),
        [treatments, appliedSearchTerm, appliedCategoryId]
    );

    const paginatedTreatments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTreatments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTreatments, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredTreatments.length / itemsPerPage));

    return (
        <DialogContent className="max-w-4xl max-h-[85vh] h-auto flex flex-col p-4 sm:p-6">
            <DialogHeader className="p-0">
                <DialogTitle>이벤트용 시술 정보 관리</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 flex-grow overflow-hidden">
                <div className="flex flex-col h-full">
                    <h3 className="text-base font-semibold mb-2 text-slate-700">이벤트용 시술 정보 입력</h3>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-3">
                        <div className="space-y-1"><Label>시술명</Label><Input name="name" value={formData.name || ''} onChange={handleFormChange} /></div>
                        <div className="space-y-1"><Label>제품명</Label><Input name="category" value={formData.category || ''} onChange={handleFormChange} placeholder="예: 원더톡스" /></div>
                        <div className="space-y-1"><Label>시술 종류(그룹)</Label><Input name="treatmentCategoryName" value={formData.treatmentCategoryName || ''} onChange={handleFormChange} placeholder="예: 보톡스" /></div>
                        <div className="space-y-1"><Label>가격 (원)</Label><Input name="price" type="number" value={formData.price || ''} onChange={handleFormChange} /></div>
                        <div className="space-y-1"><Label>할인가 (원)</Label><Input name="discountPrice" type="number" value={formData.discountPrice || ''} onChange={handleFormChange} /></div>
                        <div className="space-y-1"><Label>설명</Label><Textarea name="description" value={formData.description || ''} onChange={handleFormChange} rows={3} /></div>
                    </div>
                </div>
                <div className="flex flex-col h-full border rounded-lg p-3 bg-slate-50/50">
                    <h3 className="text-base font-semibold mb-2 text-slate-700">기존 시술에서 불러오기 (선택)</h3>
                    <div className="flex items-center gap-1 mb-2">
                        <Select onValueChange={value => setTempCategoryId(value === 'all' ? null : value)} defaultValue="all">
                            <SelectTrigger className="flex-shrink-0 w-[120px]">
                                <SelectValue placeholder="전체 그룹" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 그룹</SelectItem>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input 
                            placeholder="시술명 검색..." 
                            value={tempSearchTerm} 
                            onChange={(e) => setTempSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                            className="flex-grow"
                        />
                        <Button onClick={handleApplyFilters} className="flex-shrink-0">검색</Button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-3 space-y-2">
                        {isLoading ? <p className="text-center text-sm text-slate-500">로딩 중...</p> : paginatedTreatments.map(t => {
                            const category = categories.find(c => c.id === t.treatmentCategoryId);
                            return (
                                <div key={t.id} onClick={() => handleSelectTemplate(t)} className="p-3 border rounded-md bg-white hover:bg-[#BB2649]/5 hover:border-[#BB2649] cursor-pointer transition-colors">
                                    <p className="font-semibold text-base text-slate-800">{t.name}</p>
                                    <p className="text-sm font-medium text-slate-600 mt-1">{t.price.toLocaleString()}원</p>
                                    <div className="text-sm text-slate-500 mt-2 space-y-1">
                                        {t.category && <p><span className="font-semibold w-20 inline-block">제품명:</span> {t.category}</p>}
                                        {category && <p><span className="font-semibold w-20 inline-block">시술 그룹:</span> {category.name}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2 mt-2 border-t">
                        <Button size="sm" variant="ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>이전</Button>
                        <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                        <Button size="sm" variant="ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>다음</Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
                <Button type="button" onClick={handleSave} className="bg-[#BB2649] hover:bg-[#a1203e] text-white">저장</Button>
            </div>
        </DialogContent>
    );
};


// --- Event Form Component ---
const EventForm = ({ event, onSubmit, onCancel, branchSlug, categories, onDelete }: { event?: Event | null; onSubmit: (data: Omit<Event, 'id'> | Partial<Event>) => void; onCancel: () => void; branchSlug: string; categories: TreatmentCategory[]; onDelete: (eventId: number) => void; }) => {
    const [formData, setFormData] = useState({
        branchSlug: branchSlug, title: '', description: '', imageUrl: '',
        startDate: formatDateForInput(new Date()), endDate: formatDateForInput(new Date()),
        status: '진행중', items: [] as any[], showOnMainPromotion: false, showOnMainSignature: false, showOnMainSearchRanking: false,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<{ index: number; data: any } | null>(null);

    useEffect(() => {
        if (event) {
            const eventItems = Array.isArray(event.items) ? event.items : (event.items ? [event.items] : []);
            setFormData({
                branchSlug: event.branchSlug, title: event.title, description: event.description ?? '',
                imageUrl: event.imageUrl, startDate: formatDateForInput(event.startDate), endDate: formatDateForInput(event.endDate),
                status: event.status, items: eventItems, showOnMainPromotion: event.showOnMainPromotion || false,
                showOnMainSignature: event.showOnMainSignature || false, showOnMainSearchRanking: event.showOnMainSearchRanking || false,
            });
            setPreviewUrl(event.imageUrl);
            setSelectedFile(null);
        } else {
            setFormData({
                branchSlug: branchSlug, title: '', description: '', imageUrl: '',
                startDate: formatDateForInput(new Date()), endDate: formatDateForInput(new Date()),
                status: '진행중', items: [], showOnMainPromotion: false, showOnMainSignature: false, showOnMainSearchRanking: false,
            });
            setPreviewUrl(null);
            setSelectedFile(null);
        }
    }, [event, branchSlug]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenTreatmentModal = (treatmentData: any | null = null, index: number | null = null) => {
        setEditingTreatment(index !== null ? { index, data: treatmentData } : null);
        setIsTreatmentModalOpen(true);
    };

    const handleTreatmentSave = (treatmentData: any) => {
        const newItems = [...formData.items];
        if (editingTreatment !== null) {
            newItems[editingTreatment.index] = treatmentData;
        } else {
            newItems.push(treatmentData);
        }
        setFormData(prev => ({ ...prev, items: newItems }));
        setIsTreatmentModalOpen(false);
        setEditingTreatment(null);
    };

    const handleTreatmentDelete = (indexToDelete: number) => {
        if (window.confirm("정말로 이 시술 정보를 삭제하시겠습니까?")) {
            const newItems = formData.items.filter((_, index) => index !== indexToDelete);
            setFormData(prev => ({ ...prev, items: newItems }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let finalImageUrl = formData.imageUrl;

        try {
            if (selectedFile) {
                const uploadResponse = await uploadImage(selectedFile);
                finalImageUrl = uploadResponse.imageUrl;
            }

            await onSubmit({
                ...formData,
                imageUrl: finalImageUrl,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            });
        } catch (error) {
            console.error("File upload or form submission failed:", error);
            alert("이미지 업로드 또는 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2"><Label>이벤트명</Label><Input required name="title" value={formData.title} onChange={handleChange} /></div>
                <div className="col-span-2">
                    <Label>대표 이미지</Label>
                    <div className="mt-1 flex items-center gap-4">
                        {previewUrl && <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />}
                        <div className="w-full">
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">클릭하여 업로드</span> 또는 드래그</p>
                                    <p className="text-xs text-slate-500">PNG, JPG, GIF (MAX. 800x400px)</p>
                                </div>
                                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                </div>
                <div><Label>시작일</Label><Input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} /></div>
                <div><Label>종료일</Label><Input required type="date" name="endDate" value={formData.endDate} onChange={handleChange} /></div>
                <div className="col-span-2"><Label>설명</Label><Textarea name="description" value={formData.description ?? ''} onChange={handleChange} rows={4} /></div>
                <div>
                    <Label>상태</Label>
                    <div className="flex w-full rounded-md border mt-1">
                        <button
                            type="button"
                            className={`flex-1 p-2 text-sm transition-colors rounded-l-sm ${formData.status !== '종료' ? 'bg-[#BB2649]/10 text-[#BB2649] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => handleSelectChange('status', '진행중')}
                        >
                            오픈
                        </button>
                        <button
                            type="button"
                            className={`flex-1 p-2 text-sm transition-colors rounded-r-sm border-l ${formData.status === '종료' ? 'bg-[#BB2649]/10 text-[#BB2649] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => handleSelectChange('status', '종료')}
                        >
                            종료
                        </button>
                    </div>
                </div>
                <div className="col-span-2">
                    <Label>연결 시술 정보 (이벤트 전용)</Label>
                    <div className="mt-2 p-3 border rounded-md bg-slate-50 space-y-3">
                        <Button type="button" className="w-full" variant="outline" onClick={() => handleOpenTreatmentModal()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            시술 정보 추가
                        </Button>
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-white">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-slate-600">{item.price?.toLocaleString()}원</p>
                                </div>
                                <div className="space-x-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => handleOpenTreatmentModal(item, index)}>수정</Button>
                                    <Button type="button" size="sm" variant="outline" className="text-[#BB2649] border-[#BB2649] hover:bg-[#BB2649] hover:text-white" onClick={() => handleTreatmentDelete(index)}>삭제</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Dialog open={isTreatmentModalOpen} onOpenChange={setIsTreatmentModalOpen}>
                        <EventTreatmentModal
                            branchSlug={branchSlug}
                            initialData={editingTreatment ? editingTreatment.data : {}}
                            onSave={handleTreatmentSave}
                            onCancel={() => {
                                setIsTreatmentModalOpen(false);
                                setEditingTreatment(null);
                            }}
                            categories={categories}
                        />
                    </Dialog>
                </div>
            </div>
            <div className="mt-6 border-t pt-4 flex justify-between items-center">
                <div>
                    {event && (
                        <Button variant="outline" className="text-[#BB2649] border-[#BB2649] hover:bg-[#BB2649] hover:text-white" onClick={() => onDelete(event.id)}>
                            이벤트 삭제
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>취소</Button>
                    <Button type="submit" form="event-form" disabled={isSubmitting} className="bg-[#BB2649] hover:bg-[#a1203e] text-white">
                        {isSubmitting ? '저장 중...' : (event ? '변경사항 저장' : '이벤트 생성')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export function EventManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [events, setEvents] = useState<Event[]>([]);
    const [categories, setCategories] = useState<TreatmentCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    const fetchData = async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const [eventData, categoryData] = await Promise.all([
                getEventsByBranch(branchSlug),
                getTreatmentCategories()
            ]);
            setEvents(eventData);
            setCategories(categoryData);
        } catch (error) { console.error("Failed to fetch data:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { if (branchSlug) { fetchData(); } }, [branchSlug]);

    const handleFormSubmit = async (data: Omit<Event, 'id'> | Partial<Event>) => {
        if (!branchSlug) return;
        try {
            if (selectedEvent) {
                await updateEvent(selectedEvent.id, data);
            } else {
                await createEvent({ ...data, branchSlug } as Omit<Event, 'id'>);
            }
            await fetchData();
            setSelectedEvent(null);
            setIsCreating(false);
            alert("변경사항이 저장되었습니다.");
        } catch (error) { 
            console.error("Failed to save event:", error); 
            alert("저장에 실패했습니다.");
        }
    };

    const handleAddNew = () => { setSelectedEvent(null); setIsCreating(true); };
    const handleSelectEvent = (event: Event) => { setIsCreating(false); setSelectedEvent(event); };
    const handleCancel = () => { setSelectedEvent(null); setIsCreating(false); };

    const handleDeleteEvent = async (eventId: number) => {
        if (window.confirm("정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            try {
                await deleteEvent(eventId);
                await fetchData();
                handleCancel();
                alert("이벤트가 삭제되었습니다.");
            } catch (error) {
                console.error("Failed to delete event:", error);
                alert("이벤트 삭제에 실패했습니다.");
            }
        }
    };

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const titleMatch = event.title.toLowerCase().includes(searchTerm.toLowerCase());

            if (!dateRange.start || !dateRange.end) {
                return titleMatch;
            }

            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            const rangeStart = new Date(dateRange.start);
            const rangeEnd = new Date(dateRange.end);
            
            rangeEnd.setHours(23, 59, 59, 999);

            const dateMatch = eventStart <= rangeEnd && eventEnd >= rangeStart;

            return titleMatch && dateMatch;
        });
    }, [events, searchTerm, dateRange]);

    const EventListItem = ({ event }: { event: Event }) => {
        const displayStatus = (status: string) => {
            if (status === '종료') {
                return { text: '종료', className: 'bg-slate-100 text-slate-600' };
            }
            return { text: '오픈', className: 'bg-green-100 text-green-800' };
        };
        const statusInfo = displayStatus(event.status);
        const itemsCount = Array.isArray(event.items) ? event.items.length : 0;

        return (
            <div
                key={event.id}
                className={`p-3 rounded-lg cursor-pointer border flex items-center gap-4 ${selectedEvent?.id === event.id ? 'bg-slate-100 border-theme-primary' : 'hover:bg-slate-50 border-transparent'}`}
                onClick={() => handleSelectEvent(event)}
            >
                <img src={event.imageUrl} alt={event.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div className="font-semibold text-slate-800">{event.title}</div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.className}`}>{statusInfo.text}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{formatDateForInput(event.startDate)} ~ {formatDateForInput(event.endDate)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-600">연결 시술:</span> {itemsCount}개
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">이벤트 관리</h2>
                <p className="text-sm text-slate-500"><span className="font-semibold text-theme-primary">{branchSlug}</span> 지점의 이벤트를 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">이벤트 목록</CardTitle>
                            <Button size="sm" onClick={handleAddNew} className="bg-[#BB2649] hover:bg-[#a1203e] text-white">
                                <PlusCircle size={16} className="mr-2" /> 추가
                            </Button>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="이벤트 검색..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-grow"
                                />
                                <Input 
                                    type="date" 
                                    value={dateRange.start} 
                                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-auto"
                                />
                                <span className="text-slate-500">-</span>
                                <Input 
                                    type="date" 
                                    value={dateRange.end} 
                                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-auto"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-2">
                        {isLoading ? <p className="text-center text-slate-500">로딩 중...</p> :
                            filteredEvents.length > 0 ? filteredEvents.map(event => <EventListItem key={event.id} event={event} />) :
                            <p className="text-center text-slate-500 py-8">표시할 이벤트가 없습니다.</p>
                        }
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{isCreating ? "새 이벤트 추가" : selectedEvent ? "이벤트 수정" : "이벤트 정보"}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto">
                        {isCreating || selectedEvent ? (
                            <EventForm 
                                event={selectedEvent} 
                                onSubmit={handleFormSubmit} 
                                onCancel={handleCancel} 
                                branchSlug={branchSlug!} 
                                categories={categories}
                                onDelete={handleDeleteEvent}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <p>왼쪽 목록에서 이벤트를 선택하거나<br />새 이벤트를 추가하세요.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
