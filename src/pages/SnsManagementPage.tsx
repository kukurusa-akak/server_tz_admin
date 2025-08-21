import React, { useState, useEffect } from "react";
import { getSiteSettings, updateSiteSettings } from "../lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Save } from "lucide-react";

export function SnsManagementPage() {
  const [settings, setSettings] = useState({
    sns_instagram_url: '',
    sns_youtube_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const siteSettings = await getSiteSettings();
        const instagramUrl = siteSettings.find((s: {key: string}) => s.key === 'sns_instagram_url')?.value || '';
        const youtubeUrl = siteSettings.find((s: {key: string}) => s.key === 'sns_youtube_url')?.value || '';
        setSettings({
          sns_instagram_url: instagramUrl,
          sns_youtube_url: youtubeUrl,
        });
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteSettings(settings);
      alert("SNS 링크가 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save SNS links:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 min-h-full">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">SNS 링크 관리</h2>
        <p className="text-slate-500 mt-2">포털 푸터 영역에 표시될 SNS 링크를 관리합니다.</p>
      </header>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>SNS 링크 설정</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>로딩 중...</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sns_instagram_url" className="text-lg font-medium">인스타그램</Label>
                <Input
                  id="sns_instagram_url"
                  name="sns_instagram_url"
                  type="url"
                  value={settings.sns_instagram_url}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sns_youtube_url" className="text-lg font-medium">유튜브</Label>
                <Input
                  id="sns_youtube_url"
                  name="sns_youtube_url"
                  type="url"
                  value={settings.sns_youtube_url}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/..."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}