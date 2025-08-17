// src/components/ui/TimeInput.tsx
import React, { useState, useEffect, forwardRef } from 'react';

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const digits = rawValue.replace(/\D/g, '');
      
      if (digits.length > 4) {
        return; // Prevent more than 4 digits
      }

      let formattedValue = digits;
      if (digits.length > 2) {
        formattedValue = `${digits.slice(0, 2)}:${digits.slice(2)}`;
      }
      
      setInputValue(formattedValue);
    };

    const handleBlur = () => {
      const [hoursStr, minutesStr] = inputValue.split(':');
      let finalValue = '';

      if (hoursStr) {
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr || '0', 10);

        if (!isNaN(hours) && hours >= 0 && hours <= 23 && !isNaN(minutes) && minutes >= 0 && minutes <= 59) {
          finalValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
      
      // If valid, update parent state. Otherwise, revert to last valid value.
      if (finalValue) {
        onChange(finalValue);
      } else {
        setInputValue(value); 
      }
    };

    return (
      <input
        type="text"
        ref={ref}
        {...props}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        maxLength={5}
        placeholder={props.placeholder || 'HH:MM'}
        className={`input ${props.className || ''}`}
      />
    );
  }
);
