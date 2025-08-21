export function DeveloperPage() {
    return (
        <div className="p-6 sm:p-10 min-h-full">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Developer Tools</h2>
                <p className="text-slate-500 mt-2">개발자 전용 도구 및 정보 페이지입니다.</p>
            </header>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-lg">System Info</h3>
                <p className="text-sm text-slate-600">Component tests, API status, etc.</p>
            </div>
        </div>
    );
}
