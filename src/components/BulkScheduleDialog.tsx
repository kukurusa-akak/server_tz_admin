// src/components/BulkScheduleDialog.tsx
import { useState, useMemo, useEffect } from 'react';
import { X, Trash2, Loader2, Plus } from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { getScheduleTemplate, saveScheduleTemplate, ScheduleTemplate } from '../lib/api';
import { TimeInput } from './ui/TimeInput';

interface BulkScheduleDialogProps {
  onClose: () => void;
}

export function BulkScheduleDialog({ onClose }: BulkScheduleDialogProps) {
  const { branchSlug } = useBranch();
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('19:00');
  const [interval, setInterval] = useState(15);
  const [exclusions, setExclusions] = useState<{ start: string; end: string }[]>([
    { start: '13:00', end: '14:00' },
  ]);
  const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([]);
  const [newExclusion, setNewExclusion] = useState({ start: '', end: '' });
  const [isAddingExclusion, setIsAddingExclusion] = useState(false);

  useEffect(() => {
    if (branchSlug) {
      getScheduleTemplate(branchSlug)
        .then(data => {
          if (data) {
            setStartTime(data.startTime);
            setEndTime(data.endTime);
            setInterval(data.intervalMinutes);
            setExclusions(data.excludedTimes as any);
            setWeeklyHolidays(data.weeklyHolidays || []);
          }
        })
        .catch(() => {
          console.info('No schedule template found for this branch, using defaults.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [branchSlug]);

  const generatedSlots = useMemo(() => {
    if (!startTime || !endTime || !interval) return [];
    
    const slots = [];
    let current = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    while (current < end) {
      const timeString = current.toTimeString().substring(0, 5);
      const isExcluded = exclusions.some(ex => {
        const exStart = new Date(`1970-01-01T${ex.start}:00`);
        const exEnd = new Date(`1970-01-01T${ex.end}:00`);
        return current >= exStart && current < exEnd;
      });

      if (!isExcluded) {
        slots.push(timeString);
      }
      current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
  }, [startTime, endTime, interval, exclusions]);

  const handleAddExclusion = () => {
    if (newExclusion.start && newExclusion.end) {
      setExclusions([...exclusions, newExclusion]);
      setNewExclusion({ start: '', end: '' });
      setIsAddingExclusion(false);
    } else {
      alert("시작 시간과 종료 시간을 모두 입력해주세요.");
    }
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const handleWeeklyHolidayChange = (day: number) => {
    setWeeklyHolidays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!branchSlug) return;
    const templateData: Omit<ScheduleTemplate, 'branchSlug'> = {
      startTime,
      endTime,
      intervalMinutes: interval,
      excludedTimes: exclusions,
      weeklyHolidays,
    };
    try {
      await saveScheduleTemplate(branchSlug, templateData);
      alert('일괄 시간이 성공적으로 등록되었습니다.');
      onClose();
    } catch (error) {
      console.error('Failed to save schedule template:', error);
      alert('저장에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border w-full max-w-3xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">일괄 시간 등록</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
            {/* Left: Settings */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-4">기본 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">운영 시간</label>
                  <div className="flex items-center gap-2">
                    <TimeInput value={startTime} onChange={setStartTime} />
                    <span>~</span>
                    <TimeInput value={endTime} onChange={setEndTime} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">예약 간격 (분)</label>
                  <select value={interval} onChange={e => setInterval(Number(e.target.value))} className="input w-full">
                    <option value={10}>10분</option>
                    <option value={15}>15분</option>
                    <option value={20}>20분</option>
                    <option value={30}>30분</option>
                  </select>
                </div>
              </div>

              <h3 className="font-semibold text-slate-700 mt-8 mb-4">주간 정기 휴무</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input type="checkbox" checked={weeklyHolidays.includes(0)} onChange={() => handleWeeklyHolidayChange(0)} className="checkbox" />
                  일요일
                </label>
                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input type="checkbox" checked={weeklyHolidays.includes(6)} onChange={() => handleWeeklyHolidayChange(6)} className="checkbox" />
                  토요일
                </label>
              </div>

              <h3 className="font-semibold text-slate-700 mt-8 mb-4">예약 제외 시간 (점심시간 등)</h3>
              <div className="space-y-2">
                {exclusions.map((ex, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TimeInput value={ex.start} onChange={val => {
                      const newExclusions = [...exclusions];
                      newExclusions[index].start = val;
                      setExclusions(newExclusions);
                    }} />
                    <span>~</span>
                    <TimeInput value={ex.end} onChange={val => {
                      const newExclusions = [...exclusions];
                      newExclusions[index].end = val;
                      setExclusions(newExclusions);
                    }} />
                    <button onClick={() => handleRemoveExclusion(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {isAddingExclusion && (
                  <div className="flex items-center gap-2 pt-2">
                    <TimeInput value={newExclusion.start} onChange={val => setNewExclusion({...newExclusion, start: val})} />
                    <span>~</span>
                    <TimeInput value={newExclusion.end} onChange={val => setNewExclusion({...newExclusion, end: val})} />
                    <button onClick={handleAddExclusion} className="btn-outline-green py-2 px-3 text-sm whitespace-nowrap">
                      적용
                    </button>
                  </div>
                )}
                <button onClick={() => setIsAddingExclusion(true)} className="w-full mt-2 flex items-center justify-center gap-2 text-green-600 font-semibold py-2 rounded-md hover:bg-green-50 whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
            </div>

            {/* Right: Preview */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-4">미리보기 ({generatedSlots.length}개 슬롯)</h3>
              <div className="bg-slate-50 p-4 rounded-lg h-96 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {generatedSlots.map(slot => (
                    <div key={slot} className="bg-white text-center py-1.5 rounded border border-slate-200 text-sm text-slate-700">
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">취소</button>
          <button onClick={handleSave} className="btn-primary">저장</button>
        </div>
      </div>
    </div>
  );
}