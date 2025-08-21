import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { getPartnershipInquiries, updatePartnershipInquiry, deletePartnershipInquiry, type PartnershipInquiry, type InquiryFilters } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { useDebounce } from "@/hooks/useDebounce";

const InquiryCard = ({ inquiry, onUpdateStatus, onDelete }: { inquiry: PartnershipInquiry; onUpdateStatus: (id: number, isResolved: boolean) => void; onDelete: (id: number) => void; }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{inquiry.name}</CardTitle>
        <CardDescription>{inquiry.contact}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{inquiry.inquiryContent}</p>
        <div className="flex justify-end space-x-2">
          <Button onClick={() => onUpdateStatus(inquiry.id, !inquiry.isResolved)}>
            {inquiry.isResolved ? "Mark as Unresolved" : "Mark as Resolved"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the inquiry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(inquiry.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export function PartnershipInquiryPage() {
    const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<InquiryFilters>({});
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    const fetchInquiries = useCallback(async () => {
      try {
        setIsLoading(true);
        const queryFilters: InquiryFilters = {
          ...filters,
          searchTerm: debouncedSearchTerm,
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        };
        const data = await getPartnershipInquiries(queryFilters);
        setInquiries(data);
      } catch (error) { console.error("Failed to fetch inquiries:", error); }
      finally { setIsLoading(false); }
    }, [filters, dateRange, debouncedSearchTerm]);
  
    useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

    const handleFilterChange = <K extends keyof InquiryFilters>(key: K, value: InquiryFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
      setFilters({});
      setDateRange(undefined);
    };

    const handleUpdateStatus = async (id: number, isResolved: boolean) => {
      try { await updatePartnershipInquiry(id, { isResolved }); fetchInquiries(); }
      catch (error) { console.error("Failed to update inquiry status:", error); }
    };

    const handleDelete = async (id: number) => {
      try { await deletePartnershipInquiry(id); fetchInquiries(); }
      catch (error) { console.error("Failed to delete inquiry:", error); }
    };

    const totalPages = Math.ceil(inquiries.length / ITEMS_PER_PAGE);
    const paginatedInquiries = inquiries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
      <div className="p-6 sm:p-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>개원 문의 관리</CardTitle>
            <CardDescription>외부 채널을 통해 접수된 개원 파트너십 문의 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-slate-50/50">
              <Input placeholder="통합 검색..." value={filters.searchTerm || ''} onChange={e => handleFilterChange('searchTerm', e.target.value)} />
              <Select value={filters.isResolved === undefined ? 'all' : String(filters.isResolved)} onValueChange={v => handleFilterChange('isResolved', v === 'all' ? undefined : v === 'true')}>
                <SelectTrigger><SelectValue placeholder="처리 상태" /></SelectTrigger>
                <SelectContent><SelectItem value="all">전체 상태</SelectItem><SelectItem value="false">미처리</SelectItem><SelectItem value="true">처리 완료</SelectItem></SelectContent>
              </Select>
              <Select value={filters.hasDoctorLicense === undefined ? 'all' : String(filters.hasDoctorLicense)} onValueChange={v => handleFilterChange('hasDoctorLicense', v === 'all' ? undefined : v === 'true')}>
                <SelectTrigger><SelectValue placeholder="의사자격증 유무" /></SelectTrigger>
                <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="true">보유</SelectItem><SelectItem value="false">미보유</SelectItem></SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>접수일 범위 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
              </Popover>
            </div>
            <Button onClick={resetFilters} variant="ghost" className="w-full md:w-auto">필터 초기화</Button>
          </CardContent>
        </Card>

        {isLoading ? <div className="text-center py-10">로딩 중...</div> : paginatedInquiries.length > 0 ? (
          <div className="space-y-6">
            {paginatedInquiries.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">검색 결과가 없습니다.</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    );
}
