import { useState, useEffect } from 'react';
import { getActiveNotices, type Notice } from '../lib/api';
import { Megaphone } from 'lucide-react';

export function NoticeTicker() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getActiveNotices()
      .then(setNotices)
      .catch(err => console.error("Failed to fetch notices:", err));
  }, []);

  useEffect(() => {
    if (notices.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % notices.length);
      }, 10000); // Change notice every 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [notices.length]);

  if (notices.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 h-10 overflow-hidden w-96">
      <Megaphone className="w-5 h-5 text-theme-primary flex-shrink-0 mr-3" />
      <div className="relative h-full flex-1">
        {notices.map((notice, index) => (
          <div
            key={notice.id}
            className="absolute w-full h-full transition-transform duration-1000"
            style={{
              transform: `translateY(${(index - currentIndex) * 100}%)`,
              opacity: index === currentIndex ? 1 : 0,
            }}
          >
            <p className="truncate text-sm text-slate-700 leading-6">
              {notice.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
