import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const pathParts = window.location.pathname.split('/');
      const branchSlug = pathParts[1];

      return (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-red-50 py-20">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-red-800">오류가 발생했습니다.</h1>
          <p className="text-red-600 mt-2">애플리케이션에 예상치 못한 오류가 발생했습니다.</p>
          <div className="mt-6 flex items-center gap-4">
            <Button 
              onClick={() => window.location.reload()}
              variant="destructive"
            >
              다시 시도
            </Button>
            {branchSlug && (
               <a 
                href={`/${branchSlug}/tones/tech-support`}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
              >
                기술 지원 문의
              </a>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
