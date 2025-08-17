import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, PlusCircle, SlidersHorizontal } from "lucide-react";
import { getBranches, getRecruitments, deleteRecruitment, type Recruitment, type Branch, type WorkExperience, type RecruitmentFilters } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";
import { Input } from "@/components/ui/Input";
import { RecruitmentDialog } from "@/components/RecruitmentDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useDebounce } from "@/hooks/useDebounce"; // Assuming a debounce hook exists

const statusMap: { [key in Recruitment['status']]: string } = {
  APPLIED: '지원 완료', SCREENING: '서류 검토', INTERVIEW: '면접',
  OFFERED: '처우 협의', HIRED: '채용 확정', REJECTED: '불합격',
};

const calculateAge = (dateOfBirth: string | null | undefined) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const calculateTotalExperience = (experiences: WorkExperience[] | string | null | undefined) => {
  let parsedExperiences: WorkExperience[] = [];
  if (typeof experiences === 'string') {
    try {
      parsedExperiences = JSON.parse(experiences);
    } catch (e) {
      console.error("Failed to parse work experience:", e);
      return '오류';
    }
  } else if (Array.isArray(experiences)) {
    parsedExperiences = experiences;
  }

  if (!parsedExperiences || parsedExperiences.length === 0) return '신입';
  
  let totalMonths = 0;
  parsedExperiences.forEach(exp => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    totalMonths += months <= 0 ? 0 : months;
  });

  if (totalMonths === 0) return '신입';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return `${years > 0 ? `${years}년` : ''} ${months > 0 ? `${months}개월` : ''}`.trim();
};

export function RecruitmentManagementPage() {
    const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<RecruitmentFilters>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRecruitment, setSelectedRecruitment] = useState<Recruitment | null>(null);
    
    const debouncedFilters = useDebounce(filters, 500);

    const fetchRecruitmentsAndBranches = useCallback(async () => {
      try {
        setIsLoading(true);
        const [recruitmentsData, branchesData] = await Promise.all([
          getRecruitments(debouncedFilters), 
          getBranches()
        ]);
        setRecruitments(recruitmentsData);
        setBranches(branchesData);
      } catch (error) { console.error("Failed to fetch data:", error); }
      finally { setIsLoading(false); }
    }, [debouncedFilters]);
  
    useEffect(() => { fetchRecruitmentsAndBranches(); }, [fetchRecruitmentsAndBranches]);
  
    const handleFilterChange = <K extends keyof RecruitmentFilters>(key: K, value: RecruitmentFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const resetFilters = () => setFilters({});
    const handleDelete = async (id: number) => {
      try { await deleteRecruitment(id); fetchRecruitmentsAndBranches(); }
      catch (error) { console.error("Failed to delete recruitment:", error); }
    };
    const openDialog = (recruitment: Recruitment | null) => {
        setSelectedRecruitment(recruitment);
        setIsDialogOpen(true);
    }
  
    return (
      <div className="p-6 sm:p-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>채용 관리</CardTitle>
            <CardDescription>지원자를 검색하고 채용 단계를 관리합니다. 검색어는 이름, 포지션, 자기소개서, 메모, 자격증까지 포함하여 검색합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6 p-4 border rounded-lg bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input placeholder="통합 검색..." value={filters.searchTerm || ''} onChange={e => handleFilterChange('searchTerm', e.target.value)} />
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between"><span>나이</span><SlidersHorizontal className="ml-2 h-4 w-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">나이 범위</h4></div><div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="최소" value={filters.minAge || ''} onChange={e => handleFilterChange('minAge', e.target.value)} /><Input type="number" placeholder="최대" value={filters.maxAge || ''} onChange={e => handleFilterChange('maxAge', e.target.value)} /></div></div></PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between"><span>경력</span><SlidersHorizontal className="ml-2 h-4 w-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">경력 범위 (년)</h4></div><div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="최소" value={filters.minExp || ''} onChange={e => handleFilterChange('minExp', e.target.value)} /><Input type="number" placeholder="최대" value={filters.maxExp || ''} onChange={e => handleFilterChange('maxExp', e.target.value)} /></div></div></PopoverContent>
                </Popover>
                <Button onClick={resetFilters} variant="ghost">필터 초기화</Button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">{recruitments.length}명의 지원자가 검색되었습니다.</div>
              <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> 신규 지원자 등록</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>이름</TableHead><TableHead>나이</TableHead><TableHead>지원 포지션</TableHead><TableHead>총 경력</TableHead><TableHead>소속 지점</TableHead><TableHead>채용 상태</TableHead><TableHead>지원일</TableHead><TableHead className="text-right">관리</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={8} className="text-center">로딩 중...</TableCell></TableRow> : recruitments.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.name}</TableCell>
                    <TableCell>{calculateAge(rec.dateOfBirth) || 'N/A'}</TableCell>
                    <TableCell>{rec.position}</TableCell>
                    <TableCell>{calculateTotalExperience(rec.workExperience)}</TableCell>
                    <TableCell>{rec.branch?.name || 'N/A'}</TableCell>
                    <TableCell><span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{statusMap[rec.status]}</span></TableCell>
                    <TableCell>{new Date(rec.appliedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog(rec)}>상세보기 / 수정</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">삭제</DropdownMenuItem></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle><AlertDialogDescription>이 작업은 되돌릴 수 없습니다. {rec.name} 지원자의 정보가 서버에서 영구적으로 삭제됩니다.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(rec.id)}>삭제</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <RecruitmentDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} recruitment={selectedRecruitment} branches={branches} onSave={fetchRecruitmentsAndBranches} />
      </div>
    );
  }
