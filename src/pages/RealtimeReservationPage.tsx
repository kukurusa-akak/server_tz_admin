// src/pages/RealtimeReservationPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, User, Phone, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReservationChangeModal } from '../components/ReservationChangeModal';
import { CustomDateInput, type CustomDateInputRef } from '../components/CustomDateInput';
import { isSameDay, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

type ReservationStatus = '예약 요청' | '예약 확정' | '진료중' | '진료완료' | '노쇼' | '예약취소' | '연락 부재';
type ActionType = '요청' | '확정' | '변경' | '취소' | '부재';

interface Treatment {
  name: string;
  price: number;
}

interface ActionLog {
  action: ActionType;
  employeeName: string;
  timestamp: string;
  memo?: string;
  changes?: {
    from: string;
    to: string;
  };
}

interface Reservation {
  id: number;
  receptionTimestamp: string;
  desiredTimestamp: string;
  name: string;
  phone: string;
  treatments: Treatment[];
  status: ReservationStatus;
  notes?: string;
  history: ActionLog[];
}

const today = new Date();
const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
const yesterday = new Date(new Date().setDate(today.getDate() - 1));

// New simplified sample data
const initialReservations: Reservation[] = [
  { id: 1, receptionTimestamp: today.toISOString(), desiredTimestamp: `${today.toISOString().split('T')[0]}T14:30`, name: '김예약', phone: '010-1111-2222', treatments: [{name: '상담', price: 0}], status: '예약 요청', notes: '첫 방문 상담', history: [ { action: '요청', employeeName: '고객', timestamp: today.toISOString() } ] },
  { id: 2, receptionTimestamp: yesterday.toISOString(), desiredTimestamp: `${today.toISOString().split('T')[0]}T15:00`, name: '이확정', phone: '010-2222-3333', treatments: [{name: '피부관리', price: 150000}], status: '예약 확정', history: [ { action: '요청', employeeName: '고객', timestamp: yesterday.toISOString() }, { action: '확정', employeeName: '박매니저', timestamp: yesterday.toISOString() } ] },
  { id: 3, receptionTimestamp: yesterday.toISOString(), desiredTimestamp: `${yesterday.toISOString().split('T')[0]}T11:00`, name: '박취소', phone: '010-3333-4444', treatments: [{name: '레이저', price: 250000}], status: '예약취소', notes: '고객 개인 사정으로 취소', history: [ { action: '요청', employeeName: '고객', timestamp: yesterday.toISOString() }, { action: '확정', employeeName: '김관리자', timestamp: yesterday.toISOString() }, { action: '취소', employeeName: '김관리자', timestamp: today.toISOString(), memo: '고객 요청으로 취소 처리' } ] },
  { id: 4, receptionTimestamp: today.toISOString(), desiredTimestamp: `${tomorrow.toISOString().split('T')[0]}T10:00`, name: '최부재', phone: '010-4444-5555', treatments: [{name: '보톡스', price: 120000}], status: '연락 부재', notes: '확인 전화 부재중', history: [ { action: '요청', employeeName: '고객', timestamp: today.toISOString() }, { action: '부재', employeeName: '박매니저', timestamp: today.toISOString(), memo: '3회 통화 시도했으나 받지 않음.' } ] },
];

const filterStatusOptions: ReservationStatus[] = ['예약 요청', '예약 확정', '예약취소', '연락 부재'];

const statusColors: { [key in ReservationStatus]: string } = {
  '예약 요청': 'bg-yellow-100 text-yellow-800',
  '예약 확정': 'bg-blue-100 text-blue-800',
  '진료중': 'bg-green-100 text-green-800',
  '진료완료': 'bg-slate-100 text-slate-600',
  '노쇼': 'bg-red-100 text-red-800',
  '예약취소': 'bg-gray-100 text-gray-500',
  '연락 부재': 'bg-orange-100 text-orange-800',
};

const initialFilterState = {
    receptionDateRange: { start: null as Date | null, end: null as Date | null },
    selectedStatuses: [] as ReservationStatus[],
};

export function RealtimeReservationPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState(initialReservations);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [reservationToChange, setReservationToChange] = useState<Reservation | null>(null);
  const [notificationOptions, setNotificationOptions] = useState({ alimTalk: false, sms: false });

  const startDateRef = useRef<CustomDateInputRef>(null);
  const endDateRef = useRef<CustomDateInputRef>(null);

  const [tempFilters, setTempFilters] = useState(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterState);

  useEffect(() => {
    let timerId: number;
    const fetchTime = async () => {
        try {
          const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Seoul');
          if (!response.ok) throw new Error('Network response was not ok.');
          const data = await response.json();
          const initialTime = new Date(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds);
          setCurrentTime(initialTime);
  
          timerId = window.setInterval(() => {
            setCurrentTime(prevTime => prevTime ? new Date(prevTime.getTime() + 1000) : null);
          }, 1000);
  
        } catch (error) {
          console.error("Failed to fetch Korean time, falling back to local time.", error);
          setCurrentTime(new Date());
          timerId = window.setInterval(() => {
              setCurrentTime(new Date());
          }, 1000);
        }
      };
  
      fetchTime();
  
      return () => {
        clearInterval(timerId);
      };
  }, []);

  const handleStatusChange = (status: ReservationStatus) => {
    setTempFilters(prev => ({
        ...prev,
        selectedStatuses: prev.selectedStatuses.includes(status)
            ? prev.selectedStatuses.filter(s => s !== status)
            : [...prev.selectedStatuses, status]
    }));
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const receptionDate = new Date(res.receptionTimestamp);
      const startDate = appliedFilters.receptionDateRange.start;
      const endDate = appliedFilters.receptionDateRange.end;

      const receptionDateStartMatch = !startDate || isAfter(receptionDate, startOfDay(startDate)) || isSameDay(receptionDate, startDate);
      const receptionDateEndMatch = !endDate || isBefore(receptionDate, endOfDay(endDate)) || isSameDay(receptionDate, endDate);
      
      const statusMatch = appliedFilters.selectedStatuses.length === 0 || appliedFilters.selectedStatuses.includes(res.status);
      
      return receptionDateStartMatch && receptionDateEndMatch && statusMatch;
    });
  }, [reservations, appliedFilters]);

  useEffect(() => {
    if (filteredReservations.length > 0 && expandedRowId === null) {
      setExpandedRowId(filteredReservations[0].id);
    }
    if (expandedRowId && !filteredReservations.some(r => r.id === expandedRowId)) {
      setExpandedRowId(null);
    }
  }, [filteredReservations]);

  const handleApplyFilters = () => {
    if (!startDateRef.current?.validate() || !endDateRef.current?.validate()) {
      alert('날짜를 올바르게 입력해주세요.');
      return;
    }

    const { start, end } = tempFilters.receptionDateRange;

    if (start && !end) {
      if (!currentTime) {
        alert('현재 서버 시간을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const newFilters = {
        ...tempFilters,
        receptionDateRange: { start, end: currentTime },
      };
      setTempFilters(newFilters);
      setAppliedFilters(newFilters);
      return;
    }

    if (start && end && isBefore(end, start)) {
      alert('종료 날짜는 시작 날짜보다 이전일 수 없습니다.');
      return;
    }

    setAppliedFilters(tempFilters);
  };

  const handleResetFilters = () => {
    setTempFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
  };

  const formatDateTime = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const timeString = date.toLocaleTimeString('ko-KR', { hour12: false });
    const dateString = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const dayString = days[date.getDay()] + '요일';
    return { timeString, dateString, dayString };
  };

  const handleRowClick = (id: number) => {
    const newId = expandedRowId === id ? null : id;
    setExpandedRowId(newId);
    setMemo('');
    setNotificationOptions({ alimTalk: false, sms: false });
  };

  const handleReservationAction = (reservationId: number, action: ActionType, details?: any) => {
    if (!user) {
      alert('로그인 정보가 없습니다.');
      return;
    }
    if (confirm(`이 예약을 '${action}' 처리하시겠습니까?`)) {
      if (action === '부재' && (notificationOptions.alimTalk || notificationOptions.sms)) {
        console.log(`Sending notifications for absent contact:`, notificationOptions);
      }

      setReservations(prev => prev.map(res => {
        if (res.id === reservationId) {
          const newLog: ActionLog = {
            action,
            employeeName: user.username,
            timestamp: new Date().toISOString(),
            memo: memo || undefined,
          };

          let newStatus = res.status;
          let newDesiredTimestamp = res.desiredTimestamp;

          if (action === '확정') newStatus = '예약 확정';
          if (action === '취소') newStatus = '예약취소';
          if (action === '부재') newStatus = '연락 부재';
          if (action === '변경' && details) {
            newDesiredTimestamp = `${details.newDate}T${details.newTime}`;
            newLog.changes = {
              from: res.desiredTimestamp,
              to: newDesiredTimestamp,
            };
          }
          
          return {
            ...res,
            status: newStatus,
            desiredTimestamp: newDesiredTimestamp,
            history: [...res.history, newLog],
          };
        }
        return res;
      }));
      setExpandedRowId(null);
      setMemo('');
    }
  };

  const openChangeModal = (reservation: Reservation) => {
    setReservationToChange(reservation);
    setIsChangeModalOpen(true);
  };

  const handleSaveChange = (newDate: string, newTime: string) => {
    if (reservationToChange) {
      handleReservationAction(reservationToChange.id, '변경', { newDate, newTime });
    }
  };

  const formatTimestamp = (ts: string) => {
    const [date, time] = ts.split('T');
    return { date, time: time.substring(0, 5) };
  };

  return (
    <div className="p-10 bg-white min-h-full">
      {isChangeModalOpen && reservationToChange && (
        <ReservationChangeModal
          initialDate={formatTimestamp(reservationToChange.desiredTimestamp).date}
          initialTime={formatTimestamp(reservationToChange.desiredTimestamp).time}
          onClose={() => setIsChangeModalOpen(false)}
          onSave={handleSaveChange}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">실시간 예약 현황</h1>
        {currentTime ? (
          <div className="flex items-center text-slate-600 bg-white px-4 py-2 rounded-lg border">
            <Clock className="w-6 h-6 mr-3 text-theme-primary" />
            <div>
                <p className="text-xl font-semibold">{formatDateTime(currentTime).timeString}</p>
                <p className="text-xs text-slate-500 -mt-0.5">{`${formatDateTime(currentTime).dateString} ${formatDateTime(currentTime).dayString}`}</p>
            </div>
          </div>
        ) : (
          <div className="h-12 w-64 bg-slate-200 animate-pulse rounded-lg"></div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border mb-8 space-y-4">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 w-20">접수 날짜:</label>
                <CustomDateInput 
                    ref={startDateRef}
                    value={tempFilters.receptionDateRange.start}
                    onChange={date => setTempFilters(p => ({...p, receptionDateRange: {...p.receptionDateRange, start: date}}))}
                />
                <span className="text-slate-500">~</span>
                <CustomDateInput 
                    ref={endDateRef}
                    value={tempFilters.receptionDateRange.end}
                    onChange={date => setTempFilters(p => ({...p, receptionDateRange: {...p.receptionDateRange, end: date}}))}
                />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 w-20 shrink-0">상태:</span>
            <div className="flex items-center gap-2 flex-wrap">
            {filterStatusOptions.map(status => (
                <button 
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${statusColors[status]} ${tempFilters.selectedStatuses.includes(status) ? 'ring-2 ring-offset-1 ring-theme-primary' : 'opacity-60 hover:opacity-100'}`}
                >
                    {status}
                </button>
            ))}
            </div>
        </div>
        <div className="flex justify-start items-center gap-3 pt-4 border-t border-slate-200">
            <button onClick={handleApplyFilters} className="btn-primary">
                설정 완료
            </button>
            <button onClick={handleResetFilters} className="flex items-center gap-2 text-sm btn-secondary">
                <RefreshCw className="w-4 h-4" />
                초기화
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 w-12 border-b-2 border-slate-200"></th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">접수시간</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">희망예약시간</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">고객 정보</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">상태</th>
            </tr>
          </thead>
          <tbody className="divide-slate-200">
            {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => (
                <React.Fragment key={res.id}>
                    <tr 
                        className={`
                          ${expandedRowId === res.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50 border-b'}
                          cursor-pointer transition-colors duration-150
                        `}
                        onClick={() => handleRowClick(res.id)}
                    >
                        <td className="p-4">
                            <ChevronDown className={`w-5 h-5 text-theme-primary transition-transform duration-200 ${expandedRowId === res.id ? 'rotate-180' : ''}`} />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-base font-medium text-slate-800">{formatTimestamp(res.receptionTimestamp).time}</div>
                          <div className="text-sm text-slate-500">{formatTimestamp(res.receptionTimestamp).date}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-base font-medium text-slate-800">{formatTimestamp(res.desiredTimestamp).time}</div>
                          <div className="text-sm text-slate-500">{formatTimestamp(res.desiredTimestamp).date}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="text-base font-medium text-slate-800">{res.name}</span>
                        </div>
                        <div className="flex items-center mt-1">
                            <Phone className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="text-base text-slate-500">{res.phone}</span>
                        </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColors[res.status]}`}>
                            {res.status}
                        </span>
                        </td>
                    </tr>
                    {expandedRowId === res.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={5} className="p-6">
                                <div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-semibold text-base text-slate-800 mb-2">시술 내역</h4>
                                            <ul className="text-base text-slate-600 space-y-1">
                                                {res.treatments.map((t, i) => (
                                                    <li key={i} className="flex justify-between">
                                                        <span>{t.name}</span>
                                                        <span className="font-medium">{t.price.toLocaleString()}원</span>
                                                    </li>
                                                ))}
                                                <li className="flex justify-between pt-1 mt-1 font-bold text-slate-700">
                                                    <span>총액</span>
                                                    <span>{res.treatments.reduce((acc, t) => acc + t.price, 0).toLocaleString()}원</span>
                                                </li>
                                            </ul>
                                            <h4 className="font-semibold text-base text-slate-800 mt-4 mb-2 pt-4 border-t">고객 메모</h4>
                                            <p className="text-base text-slate-600">{res.notes || '특이사항 없음'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-base text-slate-800 mb-2">예약 이력</h4>
                                            <ul className="text-sm text-slate-600 space-y-2 border-b pb-2">
                                                {res.history.slice().reverse().map((log, i) => (
                                                    <li key={i} className="pb-1">
                                                        <p className="font-medium text-xs">[{log.action}] {log.employeeName} <span className="text-[11px] text-slate-500">({new Date(log.timestamp).toLocaleString('ko-KR')})</span></p>
                                                        {log.memo && <p className="text-[11px] pl-2">ㄴ 메모: {log.memo}</p>}
                                                        {log.changes && <p className="text-[11px] pl-2">ㄴ 변경: {formatTimestamp(log.changes.from).date} {formatTimestamp(log.changes.from).time} → {formatTimestamp(log.changes.to).date} {formatTimestamp(log.changes.to).time}</p>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200/80">
                                        <label className="font-semibold text-base text-slate-800 mb-2 block">직원 메모</label>
                                        <textarea
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            className="input w-full text-sm"
                                            rows={2}
                                            placeholder="확정/변경/취소 시 메모를 남길 수 있습니다..."
                                        />
                                        <div className="mt-4 flex justify-between items-end">
                                            <div className="flex items-end gap-3 flex-wrap">
                                                <button onClick={() => handleReservationAction(res.id, '확정')} className="text-sm px-4 py-2 font-medium rounded-md transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">예약 확정</button>
                                                <button onClick={() => openChangeModal(res)} className="text-sm px-4 py-2 font-medium rounded-md transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap">예약 변경</button>
                                                <button onClick={() => handleReservationAction(res.id, '취소')} className="text-sm px-4 py-2 font-medium rounded-md transition-colors bg-red-100 text-red-700 hover:bg-red-200 whitespace-nowrap">예약 취소</button>
                                                
                                                <div className="flex items-end gap-3 border-l pl-3 ml-3 border-slate-300">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                                                                <input type="checkbox" className="checkbox" checked={notificationOptions.alimTalk} onChange={() => setNotificationOptions(p => ({...p, alimTalk: !p.alimTalk}))} />
                                                                알림톡
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                                                                <input type="checkbox" className="checkbox" checked={notificationOptions.sms} onChange={() => setNotificationOptions(p => ({...p, sms: !p.sms}))} />
                                                                SMS
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">선택시 부재중 안내메세지 발송</p>
                                                    </div>
                                                    <button onClick={() => handleReservationAction(res.id, '부재')} className="text-sm px-4 py-2 font-medium rounded-md transition-colors bg-orange-100 text-orange-800 hover:bg-orange-200 whitespace-nowrap">연락 부재</button>
                                                </div>
                                            </div>
                                            
                                            {res.history.slice().reverse().find(h => h.action !== '요청') && (
                                                <p className="text-sm text-slate-500">
                                                    <span className="font-medium text-slate-600">최종 확인:</span> {res.history.slice().reverse().find(h => h.action !== '요청')?.employeeName}
                                                    <span className="text-xs ml-2">
                                                        ({new Date(res.history.slice().reverse().find(h => h.action !== '요청')?.timestamp || '').toLocaleString('ko-KR')})
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                        해당 조건에 맞는 예약이 없습니다.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}