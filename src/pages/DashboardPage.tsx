import React, { useState } from 'react';
import { Calendar, UserX, UserCheck, PhoneOff, Crown, Send, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import EmojiPicker, { EmojiClickData, Categories } from 'emoji-picker-react';

// --- Reusable Components ---

const StatCard = ({ icon: Icon, title, value, change, changeType, changeColor }: { icon: React.ElementType, title: string, value: string, change: string, changeType: 'increase' | 'decrease', changeColor?: string }) => {
  const changeParts = change.split(' ');
  const changeValue = changeParts[0];
  const changeText = changeParts.slice(1).join(' ');

  const colorClass = changeColor 
    ? changeColor 
    : changeType === 'increase' ? 'text-green-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="h-5 w-5 text-slate-400" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-xs">
            <span className={`font-semibold ${colorClass}`}>{changeValue}</span>
            <span className="text-slate-500"> {changeText}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const sampleHourlyData = [
    { name: '10', value: 12 }, { name: '11', value: 19 }, { name: '12', value: 8 }, 
    { name: '13', value: 15 }, { name: '14', value: 25 }, { name: '15', value: 32 }, 
    { name: '16', value: 28 }, { name: '17', value: 22 }, { name: '18', value: 15 },
];

const HourlyReservationChart = () => {
  const width = 500;
  const height = 250;
  const padding = 30;
  const data = sampleHourlyData;
  const maxX = data.length - 1;
  const maxY = Math.max(...data.map(d => d.value)) * 1.1;

  const getX = (index: number) => padding + (index / maxX) * (width - 2 * padding);
  const getY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding);

  const linePath = data.map((p, i) => (i === 0 ? 'M' : 'L') + `${getX(i)} ${getY(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${getX(maxX)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-700">8월 시간대별 예약 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="hourlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BB2649" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#BB2649" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {data.map((p, i) => (
            <text key={i} x={getX(i)} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {p.name}시
            </text>
          ))}

          <path d={areaPath} fill="url(#hourlyAreaGradient)" />
          <path d={linePath} fill="none" stroke="#BB2649" strokeWidth="2" />

          {data.map((p, i) => (
            <g key={i} className="group">
              <circle cx={getX(i)} cy={getY(p.value)} r="4" fill="#BB2649" className="cursor-pointer" />
              <rect x={getX(i) - 20} y={getY(p.value) - 30} width="40" height="20" rx="4" fill="#1e2b3b" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              <text x={getX(i)} y={getY(p.value) - 16} textAnchor="middle" fontSize="10" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">{p.value}건</text>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};

const sampleLineData = [
  { x: 0, y: 20 }, { x: 1, y: 45 }, { x: 2, y: 30 },
  { x: 3, y: 50 }, { x: 4, y: 65 }, { x: 5, y: 55 },
  { x: 6, y: 80 }, { x: 7, y: 90 },
];

const CustomLineChart = () => {
  const width = 500;
  const height = 250;
  const padding = 30;
  const maxX = Math.max(...sampleLineData.map(d => d.x));
  const maxY = 100;

  const getX = (x: number) => padding + (x / maxX) * (width - 2 * padding);
  const getY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding);

  const linePath = sampleLineData.map((p, i) => (i === 0 ? 'M' : 'L') + `${getX(p.x)} ${getY(p.y)}`).join(' ');
  const areaPath = `${linePath} L ${getX(maxX)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-700">일별 예약 현황 (최근 1주일)</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A90E2" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4A90E2" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {[0, 25, 50, 75, 100].map(y => (
            <g key={y}>
              <line x1={padding} y1={getY(y)} x2={width - padding} y2={getY(y)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding - 10} y={getY(y) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{y}</text>
            </g>
          ))}

          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#4A90E2" strokeWidth="2" />

          {sampleLineData.map((p, i) => (
            <g key={i} className="group">
              <circle cx={getX(p.x)} cy={getY(p.y)} r="4" fill="#4A90E2" className="cursor-pointer" />
              <rect x={getX(p.x) - 20} y={getY(p.y) - 30} width="40" height="20" rx="4" fill="#1e2b3b" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              <text x={getX(p.x)} y={getY(p.y) - 16} textAnchor="middle" fontSize="10" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">{p.y}건</text>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};

const doughnutData = [
  { name: '리프팅', value: 40, color: '#4A90E2' },
  { name: '피부관리', value: 25, color: '#50E3C2' },
  { name: '보톡스', value: 20, color: '#F5A623' },
  { name: '기타', value: 15, color: '#BD10E0' },
];

const DoughnutChart = () => {
  const size = 200;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-700">TOP 4 시술 카테고리 분포</CardTitle>
        <p className="text-xs text-slate-400 pt-1">(온라인 예약 기준)</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
              {doughnutData.map((item, index) => {
                const strokeDashoffset = circumference - (accumulatedPercentage / 100) * circumference;
                accumulatedPercentage += item.value;
                return (
                  <circle
                    key={index}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">432</span>
              <span className="text-sm text-slate-500">총 시술</span>
            </div>
          </div>
          <div className="space-y-2">
            {doughnutData.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm text-slate-600">{item.name}</span>
                <span className="ml-auto text-sm font-semibold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const employeePerformanceData = [
  { name: '김현수 원장', value: 85, imageUrl: 'https://i.pravatar.cc/40?u=1' },
  { name: '이민아 원장', value: 72, imageUrl: 'https://i.pravatar.cc/40?u=2' },
  { name: '박서준 실장', value: 60, imageUrl: 'https://i.pravatar.cc/40?u=3' },
  { name: '최유리 팀장', value: 45, imageUrl: 'https://i.pravatar.cc/40?u=4' },
];

const EmployeeConsultationChart = () => {
  const maxValue = Math.max(...employeePerformanceData.map(d => d.value));
  const crownColors = ['text-yellow-400', 'text-pink-300', 'text-orange-400', 'text-indigo-500'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-700">TOP 4 직원별 월간 상담 현황</CardTitle>
        <p className="text-xs text-slate-400 pt-1">( 전화, 현장 예약 등이 제외된 온라인 접수 건입니다)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {employeePerformanceData.map((employee, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="relative">
              <img src={employee.imageUrl} alt={employee.name} className="w-10 h-10 rounded-full" />
              <div className={`absolute -top-2 -left-2 transform -rotate-12 ${crownColors[index]}`}>
                <Crown className="w-5 h-5" fill="currentColor" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-700">{employee.name}</p>
                <p className="text-sm font-bold text-slate-800">{employee.value}건</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-[#50E3C2] h-2.5 rounded-full" style={{ width: `${(employee.value / maxValue) * 100}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const sampleComments = [
    { id: 1, name: '김민준', position: '원장', branch: '부평점', imageUrl: 'https://i.pravatar.cc/40?u=a', content: '오늘 신규 환자분들 많네요! 다들 화이팅입니다! 💪', timestamp: '10분 전' },
    { id: 2, name: '이서연', position: '실장', branch: '강남점', imageUrl: 'https://i.pravatar.cc/40?u=b', content: '강남점은 오늘 한가한 편... 부럽습니다 🥹', timestamp: '8분 전' },
    { id: 3, name: '박도윤', position: '팀장', branch: '부평점', imageUrl: 'https://i.pravatar.cc/40?u=c', content: '민준님, 곧 점심시간인데 식사 맛있게 하세요!', timestamp: '5분 전' },
];

const AllBranchComments = () => {
    const [comment, setComment] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const onEmojiClick = (emojiObject: EmojiClickData) => {
        setComment(prevComment => prevComment + emojiObject.emoji);
    };

    const handleCommentSubmit = () => {
        if (comment.trim() === '') return;
        console.log('Submitting comment:', comment);
        // Here you would typically call an API to save the comment
        setComment('');
        setShowPicker(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleCommentSubmit();
        }
    };

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-700">TONES 전지점 댓글</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-4">
                    {sampleComments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <img src={comment.imageUrl} alt={comment.name} className="w-9 h-9 rounded-full mt-1" />
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <p className="font-semibold text-sm text-slate-800">{comment.name}</p>
                                    <p className="text-xs text-slate-600">{comment.position}</p>
                                    <p className="text-xs text-slate-500">{comment.branch}</p>
                                </div>
                                <div className="mt-1 p-3 rounded-lg rounded-tl-none bg-slate-100 text-sm text-slate-700">
                                    {comment.content}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{comment.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <div className="flex w-full items-start gap-3">
                    <img src="https://i.pravatar.cc/40?u=me" alt="My Profile" className="w-9 h-9 rounded-full" />
                    <div className="flex-1 relative">
                        <Textarea 
                            placeholder="전 지점 직원들에게 메시지를 남겨보세요..." 
                            className="pr-28" 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setShowPicker(val => !val)} className="w-10 h-10 rounded-full">
                                <Smile className="w-5 h-5 text-slate-500" />
                            </Button>
                            <Button size="icon" className="w-10 h-10 bg-[#BB2649] hover:bg-[#a1203e]" onClick={handleCommentSubmit}>
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        {showPicker && (
                            <div className="absolute bottom-14 right-0 z-10">
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick}
                                    width={280}
                                    height={300}
                                    searchDisabled
                                    previewConfig={{ showPreview: false }}
                                    categories={[
                                        {
                                            name: "",
                                            category: Categories.SMILEYS_PEOPLE
                                        }
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}


// --- Main Dashboard Page ---

export function DashboardPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const currentBranchName = branchSlug ? (branchSlug.charAt(0).toUpperCase() + branchSlug.slice(1)) : "지점";

  return (
    <div className="p-6 sm:p-10 min-h-full bg-slate-50/50">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{currentBranchName} 운영 대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">선택된 지점의 핵심 지표를 요약하여 보여줍니다.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Calendar} title="8월 총 예약" value="1,230 건" change="+12.5% vs 7월" changeType="increase" />
        <StatCard icon={UserCheck} title="8월 예약 확정" value="1,150 건" change="+11.8% vs 7월" changeType="increase" />
        <StatCard icon={PhoneOff} title="8월 연락 부재" value="56 건" change="-5.1% vs 7월" changeType="increase" changeColor="text-orange-500" />
        <StatCard icon={UserX} title="8월 예약 취소" value="24 건" change="+3.5% vs 7월" changeType="decrease" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CustomLineChart />
        </div>
        <div>
          <HourlyReservationChart />
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DoughnutChart />
        <EmployeeConsultationChart />
      </div>

      <AllBranchComments />
    </div>
  );
}

