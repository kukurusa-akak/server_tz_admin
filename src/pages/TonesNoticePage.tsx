// src/pages/TonesNoticePage.tsx
import { Megaphone } from 'lucide-react';

const notices = [
  { id: 1, title: "2025년 하반기 워크샵 일정 안내", author: "인사팀", date: "2025-08-10" },
  { id: 2, title: "새로운 예약 관리 시스템 도입 안내", author: "IT지원팀", date: "2025-08-05" },
  { id: 3, title: "하계 휴가철 지점별 단축 운영 안내", author: "운영팀", date: "2025-07-28" },
];

export function TonesNoticePage() {
  return (
    <div className="p-10 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <Megaphone className="w-8 h-8 text-theme-primary" />
        <h1 className="text-3xl font-bold text-slate-800">톤즈 공지사항</h1>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">제목</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">작성자</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">게시일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {notices.map(notice => (
              <tr key={notice.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-medium text-slate-800">{notice.title}</td>
                <td className="p-4 text-sm text-slate-600">{notice.author}</td>
                <td className="p-4 text-sm text-slate-600">{notice.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
