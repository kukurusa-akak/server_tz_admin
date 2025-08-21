import { Link, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();

  return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-slate-50">
      <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
      <h1 className="text-4xl font-bold text-slate-800">404 - Page Not Found</h1>
      <p className="text-slate-600 mt-2">요청하신 페이지를 찾을 수 없습니다.</p>
      <div className="mt-6 flex items-center gap-4">
        {branchSlug ? (
          <>
            <Link 
              to={`/${branchSlug}/branches`}
              className="px-5 py-2.5 bg-theme-primary text-white font-semibold rounded-lg hover:bg-opacity-90"
            >
              '{branchSlug}' 지점 관리로 돌아가기
            </Link>
            <Link 
              to={`/${branchSlug}/tones/tech-support`}
              className="px-5 py-2.5 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700"
            >
              기술 지원 문의
            </Link>
          </>
        ) : (
          <Link 
            to="/"
            className="px-5 py-2.5 bg-theme-primary text-white font-semibold rounded-lg hover:bg-opacity-90"
          >
            홈으로 돌아가기
          </Link>
        )}
      </div>
    </div>
  );
}
