// src/pages/DashboardPage.tsx
import React from 'react';

const StatCard: React.FC<{ title: string; value: string; change: string }> = ({ title, value, change }) => (
  <div className="bg-white p-6 rounded-lg border">
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
  </div>
);

export function DashboardPage() {
  return (
    <div className="p-10 min-h-full">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">운영 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="오늘 예약 건수" value="128" change="+5.2% vs yesterday" />
        <StatCard title="이번 주 예약 건수" value="750" change="-1.8% vs last week" />
        <StatCard title="월간 활성 사용자" value="12,450" change="+12% vs last month" />
        <StatCard title="신규 개원 문의" value="6" change="+2 this week" />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">시간대별 예약 현황</h2>
          {/* Placeholder for a chart */}
          <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
            <p className="text-slate-400">시간대별 예약 차트가 여기에 표시됩니다.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">최근 예약 목록</h2>
          <ul>
            <li className="flex justify-between py-3 border-b"><span>김민준님 (010-1234-5678)</span><span className="text-slate-500">14:30 - 리프팅</span></li>
            <li className="flex justify-between py-3 border-b"><span>이서연님 (010-9876-5432)</span><span className="text-slate-500">15:00 - 피부관리</span></li>
            <li className="flex justify-between py-3 border-b"><span>박도윤님 (010-5555-8888)</span><span className="text-slate-500">16:00 - 상담</span></li>
            <li className="flex justify-between py-3"><span>최지아님 (010-1111-2222)</span><span className="text-slate-500">16:30 - 제모</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
