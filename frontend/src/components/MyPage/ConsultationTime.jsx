import React, { useState, useEffect } from 'react';
import './ConsultationTime.css';
import { consultationAPI } from '../../services/api';
import dayjs from 'dayjs';

const days = ['일', '월', '화', '수', '목', '금', '토'];
const dayMap = {
  SUNDAY: '일',
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
};
const dayToIndex = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
const timeOptions = Array.from({ length: 49 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const dayToDate = {
  '일': '2024-06-23', // 임의의 일요일 날짜(고정)
  '월': '2024-06-24',
  '화': '2024-06-25',
  '수': '2024-06-26',
  '목': '2024-06-27',
  '금': '2024-06-28',
  '토': '2024-06-29',
};

const korToEngDay = {
  '일': 'SUNDAY',
  '월': 'MONDAY',
  '화': 'TUESDAY',
  '수': 'WEDNESDAY',
  '목': 'THURSDAY',
  '금': 'FRIDAY',
  '토': 'SATURDAY',
};

const ConsultationTime = ({ userInfo }) => {
  // 요일별 상담 시간 state
  const [consultationTimes, setConsultationTimes] = useState(
    days.reduce((acc, day) => ({ ...acc, [day]: { start: '', end: '' } }), {})
  );
  const [editDay, setEditDay] = useState(null);
  const [editStart, setEditStart] = useState('09:00');
  const [editEnd, setEditEnd] = useState('24:00');

  const [refreshTime, setRefreshTime] = useState(false);

  // 상담 가능 시간 불러오기 (API 응답 구조에 맞게 변환)
  useEffect(() => {
    if (!userInfo?.userRole || userInfo.userRole !== 'MENTOR') return;
    const mentorId = userInfo.id;
    consultationAPI.getConsultations({ mentorId })
      .then(res => {
        const data = res.data?.data; // 실제 데이터 배열
        if (Array.isArray(data)) {
          const newTimes = days.reduce((acc, day) => ({ ...acc, [day]: { start: '', end: '' } }), {});
          data.forEach(item => {
            // dayOfWeek(영문) → 한글 요일로 변환
            const korDay = dayMap[item.dayOfWeek];
            if (korDay) {
              // 시간만 추출 (앞 5자리: HH:mm)
              const start = item.startAt ? item.startAt.slice(0, 5) : '';
              const end = item.endAt ? item.endAt.slice(0, 5) : '';
              newTimes[korDay] = { id: item.id, start, end };
            }
          });
          setConsultationTimes(newTimes);
        }
      })
      .catch(err => {
        console.error('상담 가능 시간 불러오기 실패:', err);
      });
  }, [userInfo, refreshTime]);

  // 수정 버튼 클릭
  const handleEdit = (day) => {
    setEditDay(day);
    setEditStart(consultationTimes[day].start || '09:00');
    setEditEnd(consultationTimes[day].end || '24:00');
  };

  // 삭제 버튼 클릭
  const handleDelete = async (day) => {
    const consultationId = consultationTimes[day]?.id;
    if (!consultationId) {
      setConsultationTimes(prev => ({ ...prev, [day]: { start: '', end: '' } }));
      if (editDay === day) setEditDay(null);
      return;
    }
    try {
      await consultationAPI.deleteConsultation(consultationId);
      setRefreshTime(prev => !prev);
      setConsultationTimes(prev => ({ ...prev, [day]: { start: '', end: '' } }));
      if (editDay === day) setEditDay(null);
    } catch (err) {
      console.error('상담 가능 시간 삭제 실패:', err);
    }
  };

  // 확인 버튼 클릭 (하나씩 등록)
  const handleConfirm = async () => {
    setConsultationTimes(prev => ({ ...prev, [editDay]: { start: editStart, end: editEnd } }));
    // 매주 반복 기준일로 날짜 고정
    const targetDate = dayToDate[editDay];
    const startAt = `${targetDate}T${editStart}:00`;
    const endAt = `${targetDate}T${editEnd}:00`;
    const dayOfWeek = korToEngDay[editDay];
    try {
      await consultationAPI.createConsultation({ dayOfWeek, startAt, endAt });
      // 성공 시 알림 등 추가 가능
      setRefreshTime(prev => !prev);
    } catch (err) {
      console.error('상담 가능 시간 등록 실패:', err);
      // 에러 처리
    }
    setEditDay(null);
  };

  // 취소 버튼 클릭
  const handleCancel = () => {
    setEditDay(null);
  };

  // 멘토가 아닌 경우 렌더링하지 않음
  if (userInfo?.userRole !== 'MENTOR') {
    return null;
  }

  return (
    <div className="consult-table-container">
      <h3 className="consult-table-title">가능한 일정</h3>
      <p className="consult-table-desc">요일별 가능한 시간을 등록해주세요.</p>
      <table className="consult-table">
        <thead>
          <tr>
            <th>요일</th>
            <th>시간</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td>{day}</td>
              <td>
                {editDay === day ? (
                  <div className="consult-edit-row">
                    <select value={editStart} onChange={e => setEditStart(e.target.value)} className="consult-time-select">
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="consult-tilde">-</span>
                    <select value={editEnd} onChange={e => setEditEnd(e.target.value)} className="consult-time-select">
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : consultationTimes[day].start ? (
                  <span className="consult-time-badge">
                    {consultationTimes[day].start} ~ {consultationTimes[day].end}
                    <button className="consult-del-btn" onClick={() => handleDelete(day)}>&times;</button>
                  </span>
                ) : null}
              </td>
              <td>
                {editDay === day ? (
                  <div className="consult-edit-btns">
                    <button className="consult-cancel-btn" onClick={handleCancel}>취소</button>
                    <button className="consult-confirm-btn" onClick={handleConfirm}>확인</button>
                  </div>
                ) : (
                  <button className="consult-edit-btn" onClick={() => handleEdit(day)}>
                    <span role="img" aria-label="edit">✏️</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultationTime;
