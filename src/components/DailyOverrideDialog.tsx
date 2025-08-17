// src/components/DailyOverrideDialog.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { saveDailyOverride } from '../lib/api';

interface DailyOverrideDialogProps {
  selectedDate: Date;
  initialSlots: string[];
  templateSlots: string[];
  onClose: () => void;
  onSave: () => void;
}

export function DailyOverrideDialog({ selectedDate, initialSlots, templateSlots, onClose, onSave }: DailyOverrideDialogProps) {
  const { branchSlug } = useBranch();
  const [slots, setSlots] = useState<string[]>(initialSlots);
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('');
  const newTimeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      newTimeInputRef.current?.focus();
    }
  }, [isAdding]);

  const handleAddTime = () => {
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime) && !slots.includes(newTime)) {
      setSlots([...slots, newTime].sort());
    } else if (newTime) {
      alert("시간 형식이 올바르지 않습니다. 'HH:MM' 형식으로 입력해주세요.");
    }
    setNewTime('');
    setIsAdding(false);
  };

  const handleRemoveTime = (slotToRemove: string) => {
    setSlots(slots.filter(slot => slot !== slotToRemove));
  };

  const handleResetToTemplate = () => {
    setSlots(templateSlots);
  };

  const handleSave = async () => {
    if (!branchSlug) return;
    try {
      const date = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
      await saveDailyOverride(branchSlug, {
        date: date.toISOString(),
        timeSlots: slots,
      });
      alert('해당 날짜의 시간이 저장되었습니다.');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save daily override:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const formattedDate = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">일별 시간 수정</h2>
            <p className="text-sm text-slate-500">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-end mb-4">
            <button onClick={handleResetToTemplate} className="btn-secondary">초기화</button>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-600 mb-2">예약 가능 시간 ({slots.length}개)</p>
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <div key={slot} className="relative group">
                  <div className="bg-white text-center py-1.5 rounded border border-slate-200 text-sm text-slate-700">
                    {slot}
                  </div>
                  <button 
                    onClick={() => handleRemoveTime(slot)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {isAdding ? (
                <input
                  ref={newTimeInputRef}
                  type="text"
                  placeholder="18:00"
                  maxLength={5}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  onBlur={handleAddTime}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTime();
                      if (e.key === 'Escape') {
                        setNewTime('');
                        setIsAdding(false);
                      }
                  }}
                  className="input text-center py-1.5 text-sm"
                />
              ) : (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-center py-1.5 rounded border border-dashed border-slate-300 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">취소</button>
          <button onClick={handleSave} className="btn-primary">저장</button>
        </div>
      </div>
    </div>
  );
}