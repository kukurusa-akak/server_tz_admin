import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { changePassword, getDoctorById, updateDoctor, uploadImage, type Doctor, type Branch, getBranches } from "../lib/api";
import { Save, User, Stethoscope, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function MyInfoPage() {
    const { user } = useAuth();
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Profile edit state
    const [profile, setProfile] = useState<Partial<Doctor> | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setProfileLoading(true);
            try {
                const branchesData = await getBranches();
                setBranches(branchesData);

                if (user.doctor?.id) {
                    const doctorData = await getDoctorById(user.doctor.id);
                    const initialHireDate = doctorData.hireDate ? new Date(doctorData.hireDate).toISOString().split('T')[0] : '';
                    const initialResignationDate = doctorData.resignationDate ? new Date(doctorData.resignationDate).toISOString().split('T')[0] : '';
                    setProfile({ ...doctorData, hireDate: initialHireDate, resignationDate: initialResignationDate, imageUrls: doctorData.imageUrls || [] });
                }
                // TODO: Add logic for 'employee' role if needed
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        if (newPassword !== confirmPassword) {
            setPasswordError("새 비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!user) {
            setPasswordError("사용자 정보를 찾을 수 없습니다.");
            return;
        }
        setIsSavingPassword(true);
        try {
            await changePassword(user.id, currentPassword, newPassword);
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.message || "비밀번호 변경에 실패했습니다.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!profile || !user?.doctor?.id) return;
        setIsSavingProfile(true);
        try {
            const dataToSave = { 
                ...profile, 
                branchId: Number(profile.branchId), 
                hireDate: profile.hireDate ? new Date(profile.hireDate).toISOString() : null,
                resignationDate: profile.resignationDate ? new Date(profile.resignationDate).toISOString() : null,
            };
            await updateDoctor(user.doctor.id, dataToSave);
            alert("프로필이 성공적으로 업데이트되었습니다.");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("프로필 정보 저장에 실패했습니다.");
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    const handleImageSlotClick = (index: number) => {
        setEditingImageIndex(index);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingImageIndex !== null) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const response = await uploadImage(file);
                const newImageUrls = [...(profile?.imageUrls || [])];
                newImageUrls[editingImageIndex] = response.imageUrl;
                setProfile(prev => ({ ...prev, imageUrls: newImageUrls }));
            } catch (error) { console.error("Image upload failed:", error); alert("이미지 업로드에 실패했습니다."); }
            finally { 
                setIsUploading(false);
                setEditingImageIndex(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newImageUrls = [...(profile?.imageUrls || [])];
        newImageUrls.splice(index, 1);
        setProfile(prev => ({ ...prev, imageUrls: newImageUrls }));
    };

    const renderProfileForm = () => {
        if (profileLoading) return <p>프로필 정보를 불러오는 중...</p>;
        if (!profile) return <p>연결된 프로필 정보가 없습니다.</p>;

        return (
            <form id="doctor-hr-form" onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>프로필 사진 (최대 3개)</Label>
                    <div className="flex items-center justify-center gap-8 p-4 border rounded-lg bg-slate-50/50">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        {Array.from({ length: 3 }).map((_, index) => {
                            const imageUrl = profile.imageUrls?.[index];
                            return (
                                <div key={index} className="relative w-24 h-32 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary bg-white" onClick={() => !imageUrl && handleImageSlotClick(index)}>
                                    {imageUrl ? (
                                        <>
                                            <img src={imageUrl} alt={`프로필 사진 ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                            <button type="button" onClick={(e) => handleRemoveImage(e, index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/75"><X size={12} /></button>
                                        </>
                                    ) : (
                                        <div className="text-gray-400"><Plus size={24} /></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">이름</Label><Input id="name" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="position">직책</Label><Input id="position" value={profile.position || ''} onChange={(e) => setProfile({ ...profile, position: e.target.value })} placeholder="예: 원장, 대표원장" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="employeeId">사번</Label><Input id="employeeId" value={profile.employeeId || ''} onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="hireDate">입사일</Label><Input id="hireDate" type="date" value={profile.hireDate || ''} onChange={(e) => setProfile({ ...profile, hireDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="status">재직 상태</Label><select id="status" value={profile.status} onChange={(e) => setProfile({ ...profile, status: e.target.value as Doctor['status'] })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="ACTIVE">재직중</option><option value="ON_LEAVE">휴직</option><option value="RESIGNED">퇴사</option></select></div>
                </div>
                {profile.status === 'RESIGNED' && (
                    <div className="space-y-2"><Label htmlFor="resignationDate">퇴사일</Label><Input id="resignationDate" type="date" value={profile.resignationDate || ''} onChange={(e) => setProfile({ ...profile, resignationDate: e.target.value })} /></div>
                )}
                <div className="space-y-2"><Label htmlFor="branchId">소속 지점</Label><select id="branchId" value={profile.branchId} onChange={(e) => setProfile({ ...profile, branchId: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="internalContact">내부 연락처</Label><Input id="internalContact" value={profile.internalContact || ''} onChange={(e) => setProfile({ ...profile, internalContact: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="privateNotes">인사 관련 메모</Label><Textarea id="privateNotes" value={profile.privateNotes || ''} onChange={(e) => setProfile({ ...profile, privateNotes: e.target.value })} rows={4} /></div>
                <div className="flex justify-end pt-2">
                    <Button type="submit" form="doctor-hr-form" disabled={isSavingProfile || isUploading}>
                        {isUploading ? "업로드 중..." : (isSavingProfile ? "저장 중..." : "프로필 저장")}
                    </Button>
                </div>
            </form>
        );
    };

    return (
        <div className="p-6 sm:p-10 bg-white min-h-full">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">내 정보 관리</h2>
                <p className="text-slate-500 mt-2">계정 및 프로필 정보를 관리합니다.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Account Info Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 h-fit">
                    <h3 className="font-semibold text-lg mb-4 flex items-center"><User size={20} className="mr-2" /> 계정 정보</h3>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-sm font-semibold text-slate-500">아이디</label>
                            <p className="font-mono p-2 bg-slate-100 rounded-md mt-1">{user?.username}</p>
                        </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-4 border-t pt-6">비밀번호 변경</h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-600 mb-1">현재 비밀번호</Label>
                            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-600 mb-1">새 비밀번호</Label>
                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-600 mb-1">새 비밀번호 확인</Label>
                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={isSavingPassword}>
                                <Save size={16} className="mr-2"/> {isSavingPassword ? '저장 중...' : '비밀번호 저장'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Profile Edit Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                        <Stethoscope size={20} className="mr-2" /> 프로필 편집
                    </h3>
                    {renderProfileForm()}
                </div>
            </div>
        </div>
    );
}
