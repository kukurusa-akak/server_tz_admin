import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { type BeforeAfter, uploadImage, createBeforeAfter, updateBeforeAfter } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Plus, X } from "lucide-react";

const ImageUploader = ({ imageUrl, onImageChange, onImageRemove, title }: { imageUrl?: string | null; onImageChange: (file: File) => void; onImageRemove: () => void; title: string; }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <div className="w-full h-48 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary bg-slate-50/50" onClick={() => fileInputRef.current?.click()}>
        {imageUrl ? (
          <div className="relative w-full h-full">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-md" />
            <button type="button" onClick={(e) => { e.stopPropagation(); onImageRemove(); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/75"><X size={16} /></button>
          </div>
        ) : (
          <div className="text-gray-400 text-center"><Plus size={24} /><p>이미지 업로드</p></div>
        )}
      </div>
    </div>
  );
};

export const BeforeAfterDialog = ({ post, onSave, isOpen, setIsOpen, branchSlug }: { post?: BeforeAfter | null; onSave: () => void; isOpen: boolean; setIsOpen: (isOpen: boolean) => void; branchSlug: string; }) => {
  const [formData, setFormData] = useState<Partial<BeforeAfter>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(post || { branchSlug });
    }
  }, [isOpen, post, branchSlug]);

  const handleImageChange = async (field: 'beforeImageUrl' | 'afterImageUrl', file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadImage(file);
      setFormData(prev => ({ ...prev, [field]: response.imageUrl }));
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.beforeImageUrl || !formData.afterImageUrl) {
      alert("전/후 이미지를 모두 등록해주세요.");
      return;
    }
    try {
      if (post) {
        await updateBeforeAfter(post.id, formData);
      } else {
        await createBeforeAfter(formData);
      }
      onSave();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save post:", error);
      alert("게시물 저장에 실패했습니다.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pb-4 border-b"><DialogTitle className="text-2xl font-bold">{post ? "전후사진 수정" : "새 전후사진 등록"}</DialogTitle></DialogHeader>
        <form id="before-after-form" onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto pr-2 py-4 space-y-6">
          <div className="space-y-2"><Label htmlFor="title">제목</Label><Input id="title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="description">설명</Label><Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ImageUploader title="Before 이미지" imageUrl={formData.beforeImageUrl} onImageChange={(file) => handleImageChange('beforeImageUrl', file)} onImageRemove={() => setFormData(prev => ({ ...prev, beforeImageUrl: undefined }))} />
              <Textarea placeholder="Before 의사 코멘트" value={formData.doctorBeforeComment || ''} onChange={(e) => setFormData({ ...formData, doctorBeforeComment: e.target.value })} />
            </div>
            <div className="space-y-4">
              <ImageUploader title="After 이미지" imageUrl={formData.afterImageUrl} onImageChange={(file) => handleImageChange('afterImageUrl', file)} onImageRemove={() => setFormData(prev => ({ ...prev, afterImageUrl: undefined }))} />
              <Textarea placeholder="After 의사 코멘트" value={formData.doctorAfterComment || ''} onChange={(e) => setFormData({ ...formData, doctorAfterComment: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="customerReview">고객 후기</Label><Textarea id="customerReview" value={formData.customerReview || ''} onChange={(e) => setFormData({ ...formData, customerReview: e.target.value })} /></div>
        </form>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
          <Button type="submit" form="before-after-form" disabled={isUploading}>{isUploading ? "업로드 중..." : "저장"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
