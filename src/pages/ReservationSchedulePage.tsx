// src/pages/ReservationSchedulePage.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, Settings, Loader2 } from 'lucide-react';
import { BulkScheduleDialog } from '../components/BulkScheduleDialog';
import { useBranch } from '../context/BranchContext';
import { getScheduleTemplate, getDailyOverrides, saveDailyOverride, deleteDailyOverride, ScheduleTemplate, DailyScheduleOverride } from '../lib/api';
import { DailyOverrideDialog } from '../components/DailyOverrideDialog';

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

// Helper function to generate time slots from a template
const generateSlotsFromTemplate = (template: ScheduleTemplate | null) => {
  if (!template) return [];
  const slots = [];
  let current = new Date(`1970-01-01T${template.startTime}:00`);
  const end = new Date(`1970-01-01T${template.endTime}:00`);

  while (current < end) {
    const timeString = current.toTimeString().substring(0, 5);
    const isExcluded = template.excludedTimes.some((ex: any) => {
      const exStart = new Date(`1970-01-01T${ex.start}:00`);
      const exEnd = new Date(`1970-01-01T${ex.end}:00`);
      return current >= exStart && current < exEnd;
    });
    if (!isExcluded) {
      slots.push(timeString);
    }
    current.setMinutes(current.getMinutes() + template.intervalMinutes);
  }
  return slots;
};

export function ReservationSchedulePage() {
  const { branchSlug } = useBranch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
  const [overrides, setOverrides] = useState<DailyScheduleOverride[]>([]);
  
  const templateSlots = useMemo(() => generateSlotsFromTemplate(template), [template]);

  const fetchScheduleData = useCallback(async () => {
    if (!branchSlug) return;
    setIsLoading(true);
    
    const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const templatePromise = getScheduleTemplate(branchSlug).catch(err => {
      console.error("Failed to fetch schedule template:", err);
      return null;
    });

    const overridesPromise = getDailyOverrides(branchSlug, monthStr).catch(err => {
      console.error("Failed to fetch daily overrides:", err);
      return [];
    });

    const [templateData, overridesData] = await Promise.all([templatePromise, overridesPromise]);

    setTemplate(templateData);
    setOverrides(overridesData);
    setIsLoading(false);
  }, [branchSlug, currentDate]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const getSlotsForDate = useCallback((day: number) => {
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    const dateStr = date.toISOString().split('T')[0];
    
    const override = overrides.find(o => o.date.startsWith(dateStr));
    if (override) {
      return override.timeSlots;
    }
    
    if (template?.weeklyHolidays?.includes(date.getUTCDay())) {
      return [];
    }

    return templateSlots;
  }, [currentDate, overrides, templateSlots, template]);

  const handleOpenOverrideDialog = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsOverrideDialogOpen(true);
  };

  const handleSetHoliday = async (day: number) => {
    if (!branchSlug) return;
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    if (confirm(`${date.toLocaleDateString('ko-KR')}을 휴무일로 지정하시겠습니까?`)) {
        try {
            await saveDailyOverride(branchSlug, {
                date: date.toISOString(),
                timeSlots: [],
            });
            await fetchScheduleData();
        } catch (error) {
            console.error('Failed to set holiday:', error);
            alert('휴무일 지정에 실패했습니다.');
        }
    }
  };

  const handleCancelHoliday = async (day: number) => {
    if (!branchSlug) return;
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    if (confirm(`${date.toLocaleDateString('ko-KR')} 휴무일 지정을 취소하시겠습니까?`)) {
        try {
            await deleteDailyOverride(branchSlug, date.toISOString());
            await fetchScheduleData();
        } catch (error) {
            console.error('Failed to cancel holiday:', error);
            alert('휴무일 취소에 실패했습니다.');
        }
    }
  };

  const handleBulkHolidayAction = async (dayOfWeek: number, isHoliday: boolean) => {
    if (!branchSlug) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const datesToUpdate: Date[] = [];
    
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        if (date.getDay() === dayOfWeek) {
            datesToUpdate.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
    }

    const actionText = isHoliday ? '휴무일로 지정' : '휴무를 취소';
    if (confirm(`${daysOfWeek[dayOfWeek]}요일 전체를 ${actionText}하시겠습니까?`)) {
        try {
            if (isHoliday) {
                await Promise.all(datesToUpdate.map(d => saveDailyOverride(branchSlug, {
                    date: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString(),
                    timeSlots: []
                })));
            } else {
                await Promise.all(datesToUpdate.map(d => deleteDailyOverride(branchSlug, 
                    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
                )));
            }
            await fetchScheduleData();
        } catch (error) {
            console.error(`Failed to ${actionText} weekly holiday:`, error);
            alert(`주간 ${actionText}에 실패했습니다.`);
        }
    }
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border-t border-r border-slate-200"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const day = i;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = new Date().toDateString() === date.toDateString();
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    
    const slots = getSlotsForDate(day);
    const slotCount = slots.length;

    let dayBgClass = 'bg-white';
    if (isSunday) dayBgClass = 'bg-red-50';
    if (isSaturday) dayBgClass = 'bg-blue-50';

    let dayTextClass = 'text-slate-800';
    if (isSunday) dayTextClass = 'text-red-600';
    if (isSaturday) dayTextClass = 'text-blue-700';
    if (isToday) dayTextClass += ' font-bold text-lg';

    calendarDays.push(
      <div key={i} className={`border-t border-r border-slate-200 p-3 ${dayBgClass} flex flex-col`}>
        <div className={`text-base font-semibold ${dayTextClass}`}>{i}</div>
        <div className="mt-2 text-sm flex-1">
          {slotCount > 0 ? (
            <p className="text-green-700 font-semibold">오픈</p>
          ) : (
            <p className="text-slate-400 font-semibold">휴무일</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200/80 flex justify-end items-center text-xs gap-4">
            {slotCount > 0 ? (
                <>
                    <button onClick={() => handleOpenOverrideDialog(day)} className="text-slate-500 hover:text-slate-800 flex items-center font-medium">
                      <PlusCircle className="w-3 h-3 mr-1" /> 시간 수정
                    </button>
                    <button onClick={() => handleSetHoliday(day)} className="text-red-500 hover:text-red-700 font-medium">
                        휴무일 지정
                    </button>
                </>
            ) : (
                <button onClick={() => handleCancelHoliday(day)} className="text-blue-500 hover:text-blue-700 font-medium">
                    휴무 취소
                </button>
            )}
        </div>
      </div>
    );
  }

  const changeMonth = (amount: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1));
  };

  return (
    <>
      <div className="p-10 min-h-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">예약 날짜 관리</h1>
          <div className="flex items-center">
            <button 
              onClick={() => setIsBulkDialogOpen(true)}
              className="flex items-center bg-theme-primary text-white px-4 py-2 rounded-md hover:bg-theme-primary/90 mr-6"
            >
              <Settings className="w-4 h-4 mr-2" />
              일괄 시간 등록
            </button>
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-slate-200">
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <h2 className="text-2xl font-semibold text-slate-700 mx-4">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-slate-200">
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="grid grid-cols-7">
            {daysOfWeek.map((day, index) => (
              <div key={day} className={`text-center py-2 border-b border-slate-200`}>
                <p className={`font-bold text-base ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-slate-600'}`}>{day}</p>
                <div className="flex justify-center items-center gap-2 mt-1">
                    <button onClick={() => handleBulkHolidayAction(index, true)} className="text-xs text-slate-400 hover:text-red-500 font-normal">일괄 휴무</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleBulkHolidayAction(index, false)} className="text-xs text-slate-400 hover:text-blue-500 font-normal">휴무 취소</button>
                </div>
              </div>
            ))}
          </div>
          {isLoading ? (
            <div className="h-[70vh] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 h-[70vh] border-l border-b border-slate-200">
              {calendarDays}
            </div>
          )}
        </div>
      </div>
      {isBulkDialogOpen && <BulkScheduleDialog onClose={() => { setIsBulkDialogOpen(false); fetchScheduleData(); }} />}
      {isOverrideDialogOpen && selectedDate && (
        <DailyOverrideDialog 
          selectedDate={selectedDate}
          initialSlots={getSlotsForDate(selectedDate.getDate())}
          templateSlots={templateSlots}
          onClose={() => setIsOverrideDialogOpen(false)}
          onSave={fetchScheduleData}
        />
      )}
    </>
  );
}
