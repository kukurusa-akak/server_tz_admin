// Prisma 스키마에서 파생된 타입을 포함하여 프로젝트의 모든 공통 타입을 정의하고 관리합니다.
// 예: export type User = { id: string; name: string; };

export type NavigationLink = {
  id: number;
  title: string;
  path: string;
  order: number;
  type: 'PORTAL' | 'ADMIN';
  icon?: string;
  category?: string;
};
