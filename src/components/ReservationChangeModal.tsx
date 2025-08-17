// src/components/ReservationChangeModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { TimeInput } from './ui/TimeInput';

interface ReservationChangeModalProps {
  initialDate: string;
  initialTime: string;
  onClose: () => void;
  onSave: (newDate: string, newTime: string) => void;
}

export function ReservationChangeModal({ initialDate, initialTime, onClose, onSave }: ReservationChangeModalProps) {
  const [newDate, setNewDate] = useState(initialDate);
  const [newTime, setNewTime] = useState(initialTime);

  const handleSave = () => {
    if (!newDate || !newTime) {
      alert('희망 날짜와 시간을 모두 입력해주세요.');
      return;
    }
    onSave(newDate, newTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">예약 변경</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 whitespace-nowrap">희망 날짜</label>
            <input 
              type="date" 
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 whitespace-nowrap">희망 시간</label>
            <TimeInput 
              value={newTime}
              onChange={setNewTime}
              className="w-full"
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">취소</button>
          <button onClick={handleSave} className="btn-primary">변경 저장</button>
        </div>
      </div>
    </div>
  );
}
