// src/components/CustomDateInput.tsx
import { useState, useEffect, forwardRef, useRef, useImperativeHandle } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

registerLocale('ko', ko);

interface CustomDateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export interface CustomDateInputRef {
  validate: () => boolean;
}

export const CustomDateInput = forwardRef<CustomDateInputRef, CustomDateInputProps>(({ value, onChange }, ref) => {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [isMonthValid, setIsMonthValid] = useState(true);
  const [isDayValid, setIsDayValid] = useState(true);

  const monthInputRef = useRef<HTMLInputElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    validate: () => {
      // Case 1: Partially filled
      if (month && !day) {
        setIsDayValid(false);
        dayInputRef.current?.focus();
        return false;
      }
      if (!month && day) {
        setIsMonthValid(false);
        monthInputRef.current?.focus();
        return false;
      }
      // Case 2: Invalid value exists
      if (!isMonthValid) {
        monthInputRef.current?.focus();
        return false;
      }
      if (!isDayValid) {
        dayInputRef.current?.focus();
        return false;
      }
      return true;
    }
  }));

  useEffect(() => {
    if (value) {
      setMonth(String(value.getMonth() + 1));
      setDay(String(value.getDate()));
      setIsMonthValid(true);
      setIsDayValid(true);
    } else {
      setMonth('');
      setDay('');
    }
  }, [value]);

  const handleDateChange = (newMonth: string, newDay: string) => {
    const monthNum = parseInt(newMonth, 10);
    const dayNum = parseInt(newDay, 10);

    const isMonthNumValid = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
    const isDayNumValid = !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31;
    
    setIsMonthValid(newMonth === '' || isMonthNumValid);
    setIsDayValid(newDay === '' || isDayNumValid);

    if (isMonthNumValid && isDayNumValid) {
      const year = value ? value.getFullYear() : new Date().getFullYear();
      onChange(new Date(year, monthNum - 1, dayNum));
    } else if (newMonth === '' && newDay === '') {
      onChange(null);
    }
  };

  const CustomTrigger = forwardRef<HTMLButtonElement, { onClick?: () => void }>(({ onClick }, ref) => (
    <button onClick={onClick} ref={ref} type="button" className="p-2 hover:bg-slate-100 rounded-md">
      <Calendar className="w-5 h-5 text-slate-500" />
    </button>
  ));

  return (
    <div className={`flex items-center gap-1 p-1 bg-white ${(!isMonthValid || !isDayValid) ? 'border-red-500' : 'border-slate-300'}`}>
      <input
        ref={monthInputRef}
        type="text"
        value={month}
        onChange={(e) => {
          const newMonth = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
          setMonth(newMonth);
          handleDateChange(newMonth, day);
          if (newMonth.length === 2) {
            dayInputRef.current?.focus();
          }
        }}
        placeholder="월"
        className={`w-10 text-center outline-none text-sm ${!isMonthValid ? 'text-red-500' : ''}`}
      />
      <span className="text-sm text-slate-500">월</span>
      <input
        ref={dayInputRef}
        type="text"
        value={day}
        onChange={(e) => {
          const newDay = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
          setDay(newDay);
          handleDateChange(month, newDay);
        }}
        placeholder="일"
        className={`w-10 text-center outline-none text-sm ${!isDayValid ? 'text-red-500' : ''}`}
      />
      <span className="text-sm text-slate-500">일</span>
      <DatePicker
        selected={value}
        onChange={(date) => {
            onChange(date);
            if (date) {
                setMonth(String(date.getMonth() + 1));
                setDay(String(date.getDate()));
                setIsMonthValid(true);
                setIsDayValid(true);
            }
        }}
        locale="ko"
        dateFormat="yyyy-MM-dd"
        customInput={<CustomTrigger />}
      />
    </div>
  );
});
