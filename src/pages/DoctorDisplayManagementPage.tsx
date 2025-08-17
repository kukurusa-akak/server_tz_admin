import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getDoctorsByBranch, updateDoctor, type Doctor } from "@/lib/api";
import { getBranches, type Branch } from "@/lib/api";


export function DoctorDisplayManagementPage() {
    const { branchSlug } = useParams<{ branchSlug: string }>();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getBranches().then(setBranches);
    }, []);

    useEffect(() => {
        if (branchSlug && branches.length > 0) {
            const foundBranch = branches.find(b => b.slug === branchSlug);
            setCurrentBranch(foundBranch || null);
        }
    }, [branchSlug, branches]);

    const fetchDoctors = async () => {
        if (!currentBranch) return;
        setIsLoading(true);
        try {
            const data = await getDoctorsByBranch(currentBranch.id);
            setDoctors(data.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)));
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentBranch) {
            fetchDoctors();
        }
    }, [currentBranch]);

    const handleSave = async () => {
        try {
            await Promise.all(doctors.map(doc => updateDoctor(doc.id, {
                position: doc.position,
                specialty: doc.specialty,
                description: doc.description,
                displayOrder: doc.displayOrder,
            })));
            alert("저장되었습니다.");
            fetchDoctors();
        } catch (error) {
            console.error("Failed to save doctors display info", error);
            alert("저장에 실패했습니다.");
        }
    };
    
    const handleDoctorChange = (id: number, field: keyof Doctor, value: any) => {
        setDoctors(prev => prev.map(doc => doc.id === id ? { ...doc, [field]: value } : doc));
    };

    return (
        <div className="p-6 sm:p-10 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>의료진 노출 관리 ({currentBranch?.name})</CardTitle>
                    <Button onClick={handleSave}>변경사항 저장</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <p>로딩 중...</p> : (
                        <div className="space-y-4">
                            {doctors.map((doc) => (
                                <Card key={doc.id} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <img src={doc.imageUrls?.[0] || 'https://via.placeholder.com/80'} alt={doc.name} className="w-20 h-20 rounded-md object-cover" />
                                        <div className="flex-1 space-y-2">
                                            <h3 className="font-bold text-lg">{doc.name}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="text-sm font-medium">직책</label><Input value={doc.position || ''} onChange={e => handleDoctorChange(doc.id, 'position', e.target.value)} /></div>
                                                <div><label className="text-sm font-medium">노출 순서</label><Input type="number" value={doc.displayOrder || 0} onChange={e => handleDoctorChange(doc.id, 'displayOrder', parseInt(e.target.value) || 0)} /></div>
                                            </div>
                                            <div><label className="text-sm font-medium">전문 분야</label><Textarea value={doc.specialty || ''} onChange={e => handleDoctorChange(doc.id, 'specialty', e.target.value)} rows={2} /></div>
                                            <div><label className="text-sm font-medium">소개</label><Textarea value={doc.description || ''} onChange={e => handleDoctorChange(doc.id, 'description', e.target.value)} rows={4} /></div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
