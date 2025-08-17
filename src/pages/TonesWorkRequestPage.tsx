// src/pages/TonesWorkRequestPage.tsx
import { ClipboardList } from 'lucide-react';

export function TonesWorkRequestPage() {
  return (
    <div className="p-10 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <ClipboardList className="w-8 h-8 text-theme-primary" />
        <h1 className="text-3xl font-bold text-slate-800">톤즈 업무요청</h1>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Request Form */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">신규 업무요청</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">요청 종류</label>
              <select className="input w-full">
                <option>디자인/마케팅</option>
                <option>인사/총무</option>
                <option>운영 지원</option>
                <option>기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">제목</label>
              <input type="text" className="input w-full" placeholder="예: 9월 신규 이벤트 배너 제작 요청" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">요청 내용</label>
              <textarea className="input w-full" rows={5} placeholder="필요한 업무 내용을 자세히 작성해주세요."></textarea>
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
              <p className="font-medium">9월 신규 이벤트 배너 제작 <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full ml-2">진행중</span></p>
              <p className="text-sm text-slate-500 mt-1">요청일: 2025-08-12</p>
            </li>
            <li className="py-3">
              <p className="font-medium">신규 직원 명함 제작 <span className="text-xs font-normal text-white bg-green-500 px-2 py-0.5 rounded-full ml-2">완료</span></p>
              <p className="text-sm text-slate-500 mt-1">요청일: 2025-08-10</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
