import { useState, useEffect, FormEvent } from "react";
import { type Recruitment, type Branch, type Education, type WorkExperience, createRecruitment, updateRecruitment } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PlusCircle, Trash2 } from "lucide-react";

const statusMap: { [key in Recruitment['status']]: string } = {
  APPLIED: '지원 완료', SCREENING: '서류 검토', INTERVIEW: '면접',
  OFFERED: '처우 협의', HIRED: '채용 확정', REJECTED: '불합격',
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-4 p-1">
    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">{title}</h3>
    {children}
  </div>
);

export const RecruitmentDialog = ({ recruitment, branches, onSave, isOpen, setIsOpen }: { recruitment?: Recruitment | null; branches: Branch[]; onSave: () => void; isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }) => {
  const [formData, setFormData] = useState<Partial<Recruitment>>({});

  useEffect(() => {
    if (isOpen) {
      const initialData: Partial<Recruitment> = {
        branchId: branches.length > 0 ? branches[0].id : 0,
        name: "", position: "", status: 'APPLIED',
        appliedDate: new Date().toISOString().split('T')[0],
        education: [], workExperience: [], certifications: [],
      };
      
      if (recruitment) {
        setFormData({
          ...recruitment,
          appliedDate: recruitment.appliedDate ? new Date(recruitment.appliedDate).toISOString().split('T')[0] : '',
          dateOfBirth: recruitment.dateOfBirth ? new Date(recruitment.dateOfBirth).toISOString().split('T')[0] : '',
          education: typeof recruitment.education === 'string' ? JSON.parse(recruitment.education) : recruitment.education || [],
          workExperience: typeof recruitment.workExperience === 'string' ? JSON.parse(recruitment.workExperience) : recruitment.workExperience || [],
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, recruitment, branches]);

  const handleDynamicListChange = <T,>(listName: 'education' | 'workExperience', index: number, field: keyof T, value: any) => {
    const list = (formData[listName] as T[] | undefined) || [];
    const updatedList = [...list];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setFormData(prev => ({ ...prev, [listName]: updatedList }));
  };

  const addDynamicListItem = (listName: 'education' | 'workExperience') => {
    const newItem = listName === 'education' 
      ? { school: '', major: '', status: '졸업' } 
      : { company: '', position: '', startDate: '', endDate: '', description: '' };
    const list = (formData[listName] || []) as any[];
    setFormData(prev => ({ ...prev, [listName]: [...list, newItem] }));
  };

  const removeDynamicListItem = (listName: 'education' | 'workExperience', index: number) => {
    const list = (formData[listName] || []) as any[];
    setFormData(prev => ({ ...prev, [listName]: list.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { 
          ...formData, 
          branchId: Number(formData.branchId),
          appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : new Date().toISOString(),
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
          desiredSalary: formData.desiredSalary ? Number(formData.desiredSalary) : null,
          education: formData.education,
          workExperience: formData.workExperience,
      };
      if (recruitment) {
        await updateRecruitment(recruitment.id, dataToSave);
      } else {
        await createRecruitment(dataToSave as any);
      }
      onSave();
      setIsOpen(false);
    } catch (error) { console.error("Failed to save recruitment:", error); alert("지원자 정보 저장에 실패했습니다."); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pb-4 border-b"><DialogTitle className="text-2xl font-bold">{recruitment ? "지원자 상세 정보" : "신규 지원자 등록"}</DialogTitle></DialogHeader>
        <form id="recruitment-form" onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto pr-2 py-4">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="personal">인적사항</TabsTrigger>
              <TabsTrigger value="education">학력</TabsTrigger>
              <TabsTrigger value="experience">경력</TabsTrigger>
              <TabsTrigger value="skills">자격증/기술</TabsTrigger>
              <TabsTrigger value="coverLetter">자기소개서</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="min-h-[400px]">
              <Section title="기본 정보">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label htmlFor="name">이름</Label><Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label htmlFor="dateOfBirth">생년월일</Label><Input id="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                  <div className="space-y-2"><Label>성별</Label><Select value={formData.gender || ''} onValueChange={(v) => setFormData({ ...formData, gender: v })}><SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger><SelectContent><SelectItem value="남성">남성</SelectItem><SelectItem value="여성">여성</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="phone">연락처</Label><Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="email">이메일</Label><Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                  <div className="space-y-2 col-span-full"><Label htmlFor="address">주소</Label><Input id="address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                </div>
              </Section>
              <Section title="지원 정보">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label htmlFor="position">지원 포지션</Label><Input id="position" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>소속 지점</Label><Select value={String(formData.branchId)} onValueChange={(v) => setFormData({ ...formData, branchId: Number(v) })}><SelectTrigger><SelectValue placeholder="지점 선택" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>채용 상태</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Recruitment['status'] })}><SelectTrigger><SelectValue placeholder="상태 선택" /></SelectTrigger><SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="appliedDate">지원일</Label><Input id="appliedDate" type="date" value={formData.appliedDate || ''} onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="desiredSalary">희망 연봉(만원)</Label><Input id="desiredSalary" type="number" value={formData.desiredSalary || ''} onChange={(e) => setFormData({ ...formData, desiredSalary: Number(e.target.value) })} /></div>
                </div>
              </Section>
            </TabsContent>
            <TabsContent value="education" className="min-h-[400px]">
              <Section title="학력 사항">
                {formData.education?.map((edu, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-md relative">
                    <Input placeholder="학교명" value={edu.school} onChange={(e) => handleDynamicListChange<Education>('education', index, 'school', e.target.value)} />
                    <Input placeholder="전공" value={edu.major} onChange={(e) => handleDynamicListChange<Education>('education', index, 'major', e.target.value)} />
                    <Select value={edu.status} onValueChange={(v) => handleDynamicListChange<Education>('education', index, 'status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="재학">재학</SelectItem><SelectItem value="휴학">휴학</SelectItem><SelectItem value="수료">수료</SelectItem><SelectItem value="졸업">졸업</SelectItem><SelectItem value="중퇴">중퇴</SelectItem></SelectContent></Select>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8 text-destructive" onClick={() => removeDynamicListItem('education', index)}><Trash2 size={16} /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addDynamicListItem('education')} className="w-full mt-2"><PlusCircle size={16} className="mr-2" /> 학력 추가</Button>
              </Section>
            </TabsContent>
            <TabsContent value="experience" className="min-h-[400px]">
              <Section title="경력 사항">
                {formData.workExperience?.map((exp, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-md relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input placeholder="회사명" value={exp.company} onChange={(e) => handleDynamicListChange<WorkExperience>('workExperience', index, 'company', e.target.value)} />
                      <Input placeholder="직책" value={exp.position} onChange={(e) => handleDynamicListChange<WorkExperience>('workExperience', index, 'position', e.target.value)} />
                      <Input type="date" value={exp.startDate} onChange={(e) => handleDynamicListChange<WorkExperience>('workExperience', index, 'startDate', e.target.value)} />
                      <Input type="date" value={exp.endDate} onChange={(e) => handleDynamicListChange<WorkExperience>('workExperience', index, 'endDate', e.target.value)} />
                    </div>
                    <Textarea placeholder="주요 업무 및 성과" value={exp.description} onChange={(e) => handleDynamicListChange<WorkExperience>('workExperience', index, 'description', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8 text-destructive" onClick={() => removeDynamicListItem('workExperience', index)}><Trash2 size={16} /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addDynamicListItem('workExperience')} className="w-full mt-2"><PlusCircle size={16} className="mr-2" /> 경력 추가</Button>
              </Section>
            </TabsContent>
            <TabsContent value="skills" className="min-h-[400px]">
              <Section title="자격증 및 기술">
                <Textarea placeholder="예: 간호조무사, 피부관리사 자격증, MS Office 능숙" value={formData.certifications?.join('\n') || ''} onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split('\n') })} rows={5} />
              </Section>
            </TabsContent>
            <TabsContent value="coverLetter" className="min-h-[400px]">
              <Section title="자기소개서 및 메모">
                <div className="space-y-2"><Label>자기소개서</Label><Textarea value={formData.coverLetter || ''} onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })} rows={8} /></div>
                <div className="space-y-2"><Label>관리자 메모</Label><Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} /></div>
              </Section>
            </TabsContent>
          </Tabs>
        </form>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
          <Button type="submit" form="recruitment-form">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};