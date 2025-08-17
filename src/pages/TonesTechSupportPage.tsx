// src/pages/TonesTechSupportPage.tsx
import { Wrench } from 'lucide-react';

export function TonesTechSupportPage() {
  return (
    <div className="p-10 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <Wrench className="w-8 h-8 text-theme-primary" />
        <h1 className="text-3xl font-bold text-slate-800">톤즈 기술지원</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Request Form */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">신규 요청 등록</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">제목</label>
              <input type="text" className="input w-full" placeholder="예: 예약 시스템 로그인 오류" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">긴급도</label>
              <select className="input w-full">
                <option>보통</option>
                <option>긴급</option>
                <option>매우 긴급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">상세 내용</label>
              <textarea className="input w-full" rows={5} placeholder="문제 상황을 자세히 설명해주세요."></textarea>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-primary">요청 제출</button>
            </div>
          </form>
        </div>
        {/* Request List */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">내 요청 목록</h2>
          <ul className="divide-y divide-slate-200">
            <li className="py-3">
              <p className="font-medium">예약 시스템 로그인 오류 <span className="text-xs font-normal text-white bg-green-500 px-2 py-0.5 rounded-full ml-2">처리 완료</span></p>
              <p className="text-sm text-slate-500 mt-1">2025-08-15</p>
            </li>
            <li className="py-3">
              <p className="font-medium">네트워크 프린터 연결 문제 <span className="text-xs font-normal text-white bg-yellow-500 px-2 py-0.5 rounded-full ml-2">접수됨</span></p>
              <p className="text-sm text-slate-500 mt-1">2025-08-16</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
