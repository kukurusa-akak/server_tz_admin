import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, Search, UploadCloud, X } from "lucide-react";
import { getEventsByBranch, createEvent, updateEvent, deleteEvent, uploadImage, type Event } from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatDateForInput = (date: string | Date): string => {
    return new Date(date).toISOString().split('T')[0];
};

// --- Event Form Component ---
const EventForm = ({ event, onSubmit, onCancel, branchSlug }: { event?: Event | null; onSubmit: (data: Omit<Event, 'id'> | Partial<Event>) => void; onCancel: () => void; branchSlug: string; }) => {
    const [formData, setFormData] = useState({
        branchSlug: branchSlug, title: '', description: '', imageUrl: '',
        startDate: formatDateForInput(new Date()), endDate: formatDateForInput(new Date()),
        status: '진행중', items: {}, showOnMainPromotion: false, showOnMainSignature: false, showOnMainSearchRanking: false,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                branchSlug: event.branchSlug, title: event.title, description: event.description ?? '',
                imageUrl: event.imageUrl, startDate: formatDateForInput(event.startDate), endDate: formatDateForInput(event.endDate),
                status: event.status, items: event.items ?? {}, showOnMainPromotion: event.showOnMainPromotion || false,
                showOnMainSignature: event.showOnMainSignature || false, showOnMainSearchRanking: event.showOnMainSearchRanking || false,
            });
            setPreviewUrl(event.imageUrl);
            setSelectedFile(null);
        } else {
            setFormData({
                branchSlug: branchSlug, title: '', description: '', imageUrl: '',
                startDate: formatDateForInput(new Date()), endDate: formatDateForInput(new Date()),
                status: '진행중', items: {}, showOnMainPromotion: false, showOnMainSignature: false, showOnMainSearchRanking: false,
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        let finalImageUrl = formData.imageUrl;

        try {
            if (selectedFile) {
                const uploadResponse = await uploadImage(selectedFile);
                finalImageUrl = uploadResponse.imageUrl;
            }

            onSubmit({
                ...formData,
                imageUrl: finalImageUrl,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            });
        } catch (error) {
            console.error("File upload or form submission failed:", error);
            alert("이미지 업로드 또는 저장에 실패했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="col-span-2"><Label>설명</Label><Textarea name="description" value={formData.description} onChange={handleChange} rows={4} /></div>
                <div>
                    <Label>상태</Label>
                    <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                        <SelectTrigger><SelectValue placeholder="상태 선택" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="진행중">진행중</SelectItem>
                            <SelectItem value="예정">예정</SelectItem>
                            <SelectItem value="종료">종료</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>취소</Button>
                <Button type="submit" disabled={isUploading}>{isUploading ? '저장 중...' : (event ? '변경사항 저장' : '이벤트 생성')}</Button>
            </div>
        </form>
    );
};

export function EventManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchEvents = async () => {
        if (!branchSlug) return;
        try {
            setIsLoading(true);
            const data = await getEventsByBranch(branchSlug);
            setEvents(data);
        } catch (error) { console.error("Failed to fetch events:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { if (branchSlug) { fetchEvents(); } }, [branchSlug]);

    const handleFormSubmit = async (data: Omit<Event, 'id'> | Partial<Event>) => {
        if (!branchSlug) return;
        try {
            if (selectedEvent) {
                await updateEvent(selectedEvent.id, data);
            } else {
                await createEvent({ ...data, branchSlug } as Omit<Event, 'id'>);
            }
            await fetchEvents();
            setSelectedEvent(null);
            setIsCreating(false);
        } catch (error) { console.error("Failed to save event:", error); }
    };

    const handleAddNew = () => { setSelectedEvent(null); setIsCreating(true); };
    const handleSelectEvent = (event: Event) => { setIsCreating(false); setSelectedEvent(event); };
    const handleCancel = () => { setSelectedEvent(null); setIsCreating(false); };
    const handleDelete = async (id: number) => {
        if (window.confirm('정말로 이 이벤트를 삭제하시겠습니까?')) {
            try {
                await deleteEvent(id);
                await fetchEvents();
                if (selectedEvent?.id === id) { setSelectedEvent(null); }
            } catch (error) { console.error("Failed to delete event:", error); }
        }
    };

    const filteredEvents = useMemo(() => events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase())), [events, searchTerm]);

    const EventListItem = ({ event }: { event: Event }) => (
        <div
            key={event.id}
            className={`p-3 rounded-lg cursor-pointer border flex items-center gap-4 ${selectedEvent?.id === event.id ? 'bg-slate-100 border-theme-primary' : 'hover:bg-slate-50 border-transparent'}`}
            onClick={() => handleSelectEvent(event)}
        >
            <img src={event.imageUrl} alt={event.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div className="font-semibold text-slate-800">{event.title}</div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${event.status === '진행중' ? 'bg-green-100 text-green-800' : event.status === '예정' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{event.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{formatDateForInput(event.startDate)} ~ {formatDateForInput(event.endDate)}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">이벤트 관리</h2>
                <p className="text-sm text-slate-500"><span className="font-semibold text-theme-primary">{branchSlug}</span> 지점의 이벤트를 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">이벤트 목록</CardTitle>
                            <Button size="sm" onClick={handleAddNew}><PlusCircle size={16} className="mr-2" /> 추가</Button>
                        </div>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="이벤트 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-2">
                        {isLoading ? <p className="text-center text-slate-500">로딩 중...</p> :
                            filteredEvents.length > 0 ? filteredEvents.map(event => <EventListItem key={event.id} event={event} />) :
                            <p className="text-center text-slate-500 py-8">표시할 이벤트가 없습니다.</p>
                        }
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">{isCreating ? "새 이벤트 추가" : selectedEvent ? "이벤트 수정" : "이벤트 정보"}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto">
                        {isCreating || selectedEvent ? (
                            <EventForm event={selectedEvent} onSubmit={handleFormSubmit} onCancel={handleCancel} branchSlug={branchSlug!} />
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