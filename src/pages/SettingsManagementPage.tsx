import { useState, useEffect, ChangeEvent } from "react";
import { Save } from "lucide-react";
import { getSiteSettings, updateSiteSettings } from "../lib/api";

type Settings = Record<string, string>;

export function SettingsManagementPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const data = await getSiteSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSiteSettings(settings);
            alert("설정이 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("설정 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">사이트 설정</h2>
                    <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-opacity-50">
                        <Save size={18} /> {isSaving ? '저장 중...' : '변경사항 저장'}
                    </button>
                </div>
                <p className="text-slate-500">사이트 전반에 적용되는 설정을 관리합니다.</p>
            </header>
            
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                {isLoading ? (
                    <p className="text-center text-slate-500">설정을 불러오는 중...</p>
                ) : (
                    <div className="space-y-4 max-w-2xl">
                        {Object.entries(settings).map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">{key}</label>
                                <input
                                    type="text"
                                    name={key}
                                    value={value}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-md font-mono text-xs"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
