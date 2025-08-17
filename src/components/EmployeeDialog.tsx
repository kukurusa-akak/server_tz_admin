import { useState, useEffect, FormEvent } from "react";
import { type Employee, type Branch, createEmployee, updateEmployee } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

export const EmployeeDialog = ({
  employee,
  branches,
  onSave,
  isOpen,
  setIsOpen,
}: {
  employee?: Employee | null;
  branches: Branch[];
  onSave: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (isOpen) {
      const initialHireDate = employee?.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const initialResignationDate = employee?.resignationDate ? new Date(employee.resignationDate).toISOString().split('T')[0] : '';
      
      if (employee) {
        setFormData({ ...employee, hireDate: initialHireDate, resignationDate: initialResignationDate });
      } else {
        setFormData({
          branchId: branches.length > 0 ? branches[0].id : 0,
          name: "",
          hireDate: initialHireDate,
          resignationDate: '',
          status: 'ACTIVE',
        });
      }
    }
  }, [isOpen, employee, branches]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { 
          ...formData, 
          branchId: Number(formData.branchId), 
          hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
          resignationDate: formData.resignationDate ? new Date(formData.resignationDate).toISOString() : null,
      };
      if (employee) {
        await updateEmployee(employee.id, dataToSave);
      } else {
        await createEmployee(dataToSave as any);
      }
      onSave();
      setIsOpen(false);
    } catch (error) { console.error("Failed to save employee:", error); alert("직원 정보 저장에 실패했습니다."); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-4 border-b"><DialogTitle className="text-2xl font-bold">{employee ? "직원 HR 정보 수정" : "신규 직원 등록"}</DialogTitle></DialogHeader>
        <form id="employee-hr-form" onSubmit={handleSubmit} className="max-h-[60vh] overflow-y-auto pr-2 py-4 space-y-4">
            <div className="space-y-2"><Label htmlFor="name">이름</Label><Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            {!employee && (
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-semibold mb-2 text-gray-700">사용자 계정 생성</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">사용자 ID</Label>
                    <Input 
                      id="username" 
                      value={formData.username || ''} 
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                      placeholder="계정으로 사용할 ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password || ''} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      placeholder="6자 이상"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  사용자 계정을 만들려면 ID와 비밀번호를 모두 입력하세요. 비워두면 직원 정보만 등록됩니다.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="employeeId">사번</Label><Input id="employeeId" value={formData.employeeId || ''} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="hireDate">입사일</Label><Input id="hireDate" type="date" value={formData.hireDate || ''} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="status">재직 상태</Label><select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="ACTIVE">재직중</option><option value="ON_LEAVE">휴직</option><option value="RESIGNED">퇴사</option></select></div>
            </div>
            {formData.status === 'RESIGNED' && (
                <div className="space-y-2"><Label htmlFor="resignationDate">퇴사일</Label><Input id="resignationDate" type="date" value={formData.resignationDate || ''} onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })} /></div>
            )}
            <div className="space-y-2"><Label htmlFor="branchId">소속 지점</Label><select id="branchId" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="position">직책</Label><Input id="position" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="internalContact">내부 연락처</Label><Input id="internalContact" value={formData.internalContact || ''} onChange={(e) => setFormData({ ...formData, internalContact: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="privateNotes">인사 관련 메모</Label><Textarea id="privateNotes" value={formData.privateNotes || ''} onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })} rows={4} /></div>
        </form>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button type="submit" form="employee-hr-form">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
