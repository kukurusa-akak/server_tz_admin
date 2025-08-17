// src/pages/TonesResourceCenterPage.tsx
import { FolderArchive, Download } from 'lucide-react';

const resources = [
  { id: 1, category: "마케팅 가이드", name: "SNS 채널별 홍보 가이드라인 v2.1.pdf", size: "2.5 MB", date: "2025-08-01" },
  { id: 2, category: "마케팅 가이드", name: "블로그 포스팅용 이미지 소스 모음.zip", size: "58.1 MB", date: "2025-07-20" },
  { id: 3, category: "인사/총무", name: "2025년 연차 사용 촉진 공문.docx", size: "128 KB", date: "2025-07-15" },
  { id: 4, category: "인사/총무", name: "경조사 지원 신청서 양식.hwp", size: "88 KB", date: "2025-06-30" },
  { id: 5, category: "운영 메뉴얼", name: "신규 예약 시스템 운영 메뉴얼.pdf", size: "5.2 MB", date: "2025-08-05" },
];

export function TonesResourceCenterPage() {
  return (
    <div className="p-10 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <FolderArchive className="w-8 h-8 text-theme-primary" />
        <h1 className="text-3xl font-bold text-slate-800">톤즈 자료실</h1>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">카테고리</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">파일명</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">업로드 날짜</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">파일 크기</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {resources.map(file => (
              <tr key={file.id} className="hover:bg-slate-50/50">
                <td className="p-4 text-sm font-medium text-slate-600">{file.category}</td>
                <td className="p-4 font-medium text-slate-800">{file.name}</td>
                <td className="p-4 text-sm text-slate-600">{file.date}</td>
                <td className="p-4 text-sm text-slate-600">{file.size}</td>
                <td className="p-4">
                  <button className="flex items-center gap-2 text-sm btn-secondary py-1.5 px-3">
                    <Download className="w-4 h-4" />
                    <span>다운로드</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
