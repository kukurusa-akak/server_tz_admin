// src/pages/ReservationPatientManagementPage.tsx
import { useState, useEffect } from 'react';
import { Search, User, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchPatients, getPatientDetails, addConsultationMemo, Patient, ConsultationMemo } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

export function ReservationPatientManagementPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMemo, setNewMemo] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      searchPatients({ name: debouncedSearchTerm }) // Simple search by name for now
        .then(setSearchResults)
        .finally(() => setIsLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const handleSelectPatient = (patientId: number) => {
    setIsLoading(true);
    getPatientDetails(patientId)
      .then(setSelectedPatient)
      .finally(() => setIsLoading(false));
  };

  const handleAddMemo = async () => {
    if (!selectedPatient || !newMemo.trim() || !user) return;
    try {
      await addConsultationMemo(selectedPatient.id, newMemo, user.username);
      setNewMemo('');
      // Refresh patient details to show the new memo
      handleSelectPatient(selectedPatient.id);
    } catch (error) {
      console.error("Failed to add memo:", error);
      alert("메모 추가에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Panel: Search and Results */}
      <div className="w-1/3 border-r bg-white h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800 mb-4">예약자 검색</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="환자 이름 또는 연락처로 검색..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && searchResults.length === 0 && <p className="p-4 text-slate-500">검색 중...</p>}
          {!isLoading && searchTerm && searchResults.length === 0 && <p className="p-4 text-slate-500">검색 결과가 없습니다.</p>}
          <ul>
            {searchResults.map(patient => (
              <li key={patient.id} onClick={() => handleSelectPatient(patient.id)}
                className={`p-4 border-b cursor-pointer hover:bg-slate-50 ${selectedPatient?.id === patient.id ? 'bg-theme-primary/10' : ''}`}>
                <p className="font-semibold text-slate-800">{patient.name}</p>
                <p className="text-sm text-slate-500">{patient.phone}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel: Patient Details */}
      <div className="w-2/3 h-full overflow-y-auto p-8">
        {isLoading && !selectedPatient && <p className="text-slate-500">로딩 중...</p>}
        {!selectedPatient ? (
          <div className="text-center text-slate-500 pt-20">
            <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold">환자를 선택해주세요</h3>
            <p>왼쪽에서 환자를 검색하고 선택하여 상세 정보를 확인하세요.</p>
          </div>
        ) : (
          <div>
            <div className="pb-6 border-b mb-6">
              <h1 className="text-2xl font-bold text-slate-800">{selectedPatient.name}</h1>
              <p className="text-slate-600 mt-1">{selectedPatient.phone}</p>
            </div>
            
            <div className="space-y-8">
              {/* Consultation Memos */}
              <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2" />상담 메모</h3>
                <div className="bg-white p-4 rounded-lg border">
                  <textarea
                    className="input w-full text-sm"
                    rows={3}
                    placeholder={`${user?.username} (으)로 메모를 남깁니다...`}
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                  />
                  <div className="text-right mt-2">
                    <button onClick={handleAddMemo} className="btn-primary">메모 저장</button>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {selectedPatient.consultationMemos?.map((memo: ConsultationMemo) => (
                      <li key={memo.id} className="text-sm border-t pt-3">
                        <p className="text-slate-600">{memo.content}</p>
                        <p className="text-xs text-slate-400 text-right mt-1">
                          - by {memo.employeeName}, {new Date(memo.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reservation History */}
              <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2" />예약 이력</h3>
                <div className="bg-white p-4 rounded-lg border space-y-4">
                  {selectedPatient.reservations?.map((res: any) => (
                    <div key={res.id} className="border-b pb-3">
                      <p className="font-semibold">{new Date(res.desiredTimestamp).toLocaleString('ko-KR')} - <span className="font-bold">{res.status}</span></p>
                      <ul className="text-sm text-slate-500 mt-1">
                        {(res.treatments as any[]).map((t, i) => <li key={i}>- {t.name} ({t.price.toLocaleString()}원)</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
