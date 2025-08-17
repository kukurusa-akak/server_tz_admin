import { useState, useEffect, useMemo } from "react";
import { MoreHorizontal, PlusCircle, ChevronDown, Calendar as CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { getBranches, getEmployees, deleteEmployee, type Employee, type Branch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/DropdownMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { EmployeeDialog } from "@/components/EmployeeDialog";

const DateRangePicker = ({ date, onDateChange, placeholder }: { date?: DateRange, onDateChange: (date?: DateRange) => void, placeholder: string }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={onDateChange}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}

export function EmployeeManagementPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [hireDateRange, setHireDateRange] = useState<DateRange | undefined>(undefined);
    const [resignationDateRange, setResignationDateRange] = useState<DateRange | undefined>(undefined);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const fetchEmployeesAndBranches = async () => {
      try {
        setIsLoading(true);
        const [employeesData, branchesData] = await Promise.all([getEmployees(), getBranches()]);
        setEmployees(employeesData);
        setBranches(branchesData);
      } catch (error) { console.error("Failed to fetch data:", error); }
      finally { setIsLoading(false); }
    };
  
    useEffect(() => { fetchEmployeesAndBranches(); }, []);
  
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const searchTermLower = searchTerm.toLowerCase();
            const nameMatch = emp.name.toLowerCase().includes(searchTermLower);
            const employeeIdMatch = emp.employeeId?.toLowerCase().includes(searchTermLower);
            const branchMatch = selectedBranches.length === 0 || selectedBranches.includes(emp.branchId);
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(emp.status);

            const hireDate = emp.hireDate ? new Date(emp.hireDate) : null;
            const hireFrom = hireDateRange?.from;
            const hireTo = hireDateRange?.to;
            const hireDateMatch = !hireDate || (!hireFrom || hireDate >= hireFrom) && (!hireTo || hireDate <= hireTo);

            const resignationDate = emp.resignationDate ? new Date(emp.resignationDate) : null;
            const resignFrom = resignationDateRange?.from;
            const resignTo = resignationDateRange?.to;
            const resignationDateMatch = !resignationDate || (!resignFrom || resignationDate >= resignFrom) && (!resignTo || resignationDate <= resignTo);

            return (nameMatch || employeeIdMatch) && branchMatch && statusMatch && hireDateMatch && resignationDateMatch;
        });
    }, [employees, searchTerm, selectedBranches, selectedStatuses, hireDateRange, resignationDateRange]);

    const handleBranchFilterChange = (branchId: number) => {
        setSelectedBranches(prev => prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]);
    };

    const handleStatusFilterChange = (status: string) => {
        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };
    
    const resetFilters = () => {
        setSelectedBranches([]);
        setSelectedStatuses([]);
        setSearchTerm("");
        setHireDateRange(undefined);
        setResignationDateRange(undefined);
    };

    const handleDelete = async (id: number) => {
      try { await deleteEmployee(id); fetchEmployeesAndBranches(); }
      catch (error) { console.error("Failed to delete employee:", error); }
    };

    const openDialog = (employee: Employee | null) => {
        setSelectedEmployee(employee);
        setIsDialogOpen(true);
    }

    const isFilterActive = selectedBranches.length > 0 || selectedStatuses.length > 0 || searchTerm !== "" || hireDateRange || resignationDateRange;
  
    return (
      <div className="p-6 sm:p-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>직원 관리 (HR)</CardTitle>
            <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-4">
                    <Label className="w-16 text-right shrink-0">지점 :</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-80 justify-between">
                                <span>{selectedBranches.length > 0 ? `${selectedBranches.length}개 지점 선택됨` : "전체 지점"}</span>
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full md:w-80">
                            {branches.map(branch => (
                                <DropdownMenuCheckboxItem key={branch.id} checked={selectedBranches.includes(branch.id)} onCheckedChange={() => handleBranchFilterChange(branch.id)}>
                                    {branch.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-4">
                    <Label className="w-16 text-right shrink-0">재직 상태 :</Label>
                    <div className="flex flex-wrap items-center gap-4">
                    {(['ACTIVE', 'ON_LEAVE', 'RESIGNED'] as const).map(status => (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox id={`status-${status}`} checked={selectedStatuses.includes(status)} onCheckedChange={() => handleStatusFilterChange(status)} />
                            <Label htmlFor={`status-${status}`} className="font-normal">
                                {status === 'ACTIVE' ? '재직중' : status === 'ON_LEAVE' ? '휴직' : '퇴사'}
                            </Label>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Label className="w-16 text-right shrink-0">입사일 :</Label>
                    <DateRangePicker date={hireDateRange} onDateChange={setHireDateRange} placeholder="입사일 범위 선택" />
                </div>
                <div className="flex items-center gap-4">
                    <Label className="w-16 text-right shrink-0">퇴사일 :</Label>
                    <DateRangePicker date={resignationDateRange} onDateChange={setResignationDateRange} placeholder="퇴사일 범위 선택" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2 pt-2">
                    <div className="relative flex-grow w-full md:w-auto">
                        <Input placeholder="이름 또는 사번으로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-10 text-muted-foreground">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="ghost" onClick={resetFilters} disabled={!isFilterActive} className="w-full">필터 초기화</Button>
                        <Button onClick={() => openDialog(null)} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> 신규 등록</Button>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">{filteredEmployees.length}명의 직원이 검색되었습니다.</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름/직책</TableHead>
                  <TableHead>소속 지점</TableHead>
                  <TableHead>재직 상태</TableHead>
                  <TableHead>입사일</TableHead>
                  <TableHead>퇴사일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">로딩 중...</TableCell></TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.id}</TableCell>
                      <TableCell className="font-medium">{emp.name}<p className="text-xs text-muted-foreground">{emp.position}</p></TableCell>
                      <TableCell>{emp.branch?.name || 'N/A'}</TableCell>
                      <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{emp.status === 'ACTIVE' ? '재직중' : emp.status === 'ON_LEAVE' ? '휴직' : '퇴사'}</span></TableCell>
                      <TableCell>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{emp.resignationDate ? new Date(emp.resignationDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(emp)}>수정</DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">삭제</DropdownMenuItem></AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle><AlertDialogDescription>이 작업은 되돌릴 수 없습니다. {emp.name} 직원의 정보가 서버에서 영구적으로 삭제됩니다.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(emp.id)}>삭제</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <EmployeeDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} employee={selectedEmployee} branches={branches} onSave={fetchEmployeesAndBranches} />
      </div>
    );
  }
