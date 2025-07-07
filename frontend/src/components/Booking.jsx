import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import './Booking.css';
import { reservationAPI, consultationAPI, ticketAPI } from "../services/api";

const Booking = ({ mentor, onBack, onBooking }) => {
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  });
  const [consultationStartAt, setConsultationStartAt] = useState(null);
  const [consultationEndAt, setConsultationEndAt] = useState(null);
  const [consultationTimesByDate, setConsultationTimesByDate] = useState({});
  const [consultationSlots, setConsultationSlots] = useState([]);
  const [availableEndTimes, setAvailableEndTimes] = useState([]);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 티켓(이용권) 목록 불러오기
  useEffect(() => {
    setLoading(true);
    ticketAPI.getTickets() // ticketAPI에서 id 파라미터 없이 전체 목록 조회
    .then(res => {
      setServiceOptions(res.data.data);
      setLoading(false);
    })
    .catch(err => {
      setError('이용권 정보를 불러오는 데 실패했습니다.');
      setLoading(false);
    });
  }, []);


  useEffect(() => {
    console.log("Booking mentor prop:", mentor); // <- id/userId가 실제로 찍히는지 확인
    // ...
  }, [mentor]);

  // 2. 날짜 선택 시 해당 날짜의 예약 가능 시간 계산 (백엔드에서 이미 예약 현황 고려)
  useEffect(() => {
    if (!selectedDate || !mentor?.userId) {
      setConsultationSlots([]);
      setSelectedStartTime('');
      setSelectedEndTime('');
      return;
    }

    console.log(`🔍 날짜 선택됨 - 멘토ID: ${mentor.userId}, 날짜: ${selectedDate}`);

    // 기존 선택된 시간 초기화
    setSelectedStartTime('');
    setSelectedEndTime('');
    setAvailableEndTimes([]); // 종료 시간 옵션도 초기화

    console.log(`🔍 상담 가능 시간 API 호출: 멘토ID=${mentor.userId}, 날짜=${selectedDate}`);

    // 백엔드에서 이미 예약된 시간 제외하고 10분 단위로 잘라진 리스트를 준다고 가정
    consultationAPI.getAvailableConsultationSlots(mentor.userId, selectedDate)
    .then(consultationRes => {
      console.log("🔍 멘토 상담 가능 시간 API 응답:", consultationRes);
      console.log("🔍 멘토 상담 가능 시간 API 응답 전체 구조:", JSON.stringify(consultationRes.data, null, 2));

      // 백엔드 응답에서 10분 단위의 상담 가능 슬롯 리스트를 직접 추출
      let available10MinSlots = [];
      if (consultationRes.data && (Array.isArray(consultationRes.data) || Array.isArray(consultationRes.data.data))) {
        available10MinSlots = consultationRes.data.data || consultationRes.data;
      }

      // availableStartAt, availableEndAt 필드를 가진 객체 리스트라고 가정하고,
      // 이를 HH:mm 문자열 리스트로 변환 (UI 표시용)
      const formattedSlots = available10MinSlots
      .filter(slot => slot.availableStartAt) // 유효한 시작 시간만 필터링
      .map(slot => slot.availableStartAt);   // 'HH:mm' 형태의 문자열만 추출

      console.log(`✅ ${selectedDate}에 백엔드에서 받은 10분 단위 가용 슬롯:`, formattedSlots);

      // 중복 제거 및 시간 순 정렬 (백엔드에서 정렬되어 온다면 필요 없을 수 있음)
      const uniqueSortedSlots = [...new Set(formattedSlots)].sort();

      setConsultationSlots(uniqueSortedSlots); // 이 변수가 이제 10분 단위 시작 시간 목록

      // 상담 가능한 전체 시간 범위도 이 슬롯들을 기반으로 설정
      if (uniqueSortedSlots.length > 0) {
        const earliestStart = uniqueSortedSlots[0];
        // 마지막 슬롯의 시작 시간에 10분을 더해야 실제 종료 시간
        const lastSlotStart = uniqueSortedSlots[uniqueSortedSlots.length - 1];
        const [lastHour, lastMinute] = lastSlotStart.split(':').map(Number);
        const lastSlotEnd = new Date(0, 0, 0, lastHour, lastMinute + 10);
        const latestEnd = `${lastSlotEnd.getHours().toString().padStart(2, '0')}:${lastSlotEnd.getMinutes().toString().padStart(2, '0')}`;

        // consultationStartAt과 consultationEndAt은 이제 해당 날짜의 멘토의 전체 가용 범위(UI 표시용)
        setConsultationStartAt(`${selectedDate}T${earliestStart}:00`);
        setConsultationEndAt(`${selectedDate}T${latestEnd}:00`);

        // 날짜별 상담 시간 캐시 업데이트 (선택 사항)
        setConsultationTimesByDate(prev => ({
          ...prev,
          [selectedDate]: {
            startAt: `${selectedDate}T${earliestStart}:00`,
            endAt: `${selectedDate}T${latestEnd}:00`,
            availableSlots: uniqueSortedSlots // 10분 단위 슬롯
          }
        }));

      } else {
        // 해당 날짜에 상담 가능한 슬롯이 없으면 관련 상태 초기화
        console.log(`❌ ${selectedDate}에는 상담 가능한 슬롯이 없습니다.`);
        setConsultationStartAt(null);
        setConsultationEndAt(null);
        setConsultationTimesByDate(prev => {
          const updated = { ...prev };
          delete updated[selectedDate];
          return updated;
        });
      }
    })
    .catch(err => {
      console.error(`❌ ${selectedDate} 상담 가능 시간 조회 실패:`, err);
      setError(`상담 가능 시간을 불러오는 데 실패했습니다: ${err.message}`);

      // 에러 발생 시 관련 상태 초기화
      setConsultationSlots([]);
      setConsultationStartAt(null);
      setConsultationEndAt(null);
      setConsultationTimesByDate(prev => {
        const updated = { ...prev };
        delete updated[selectedDate];
        return updated;
      });
    });
  }, [mentor?.userId, selectedDate]);

  // 3. 시작시간이 선택되면 이용권 시간을 바탕으로 종료시간 자동 계산
  useEffect(() => {
    if (!selectedStartTime || !selectedService) {
      setSelectedEndTime('');
      return;
    }

    // 선택된 서비스 ID로 실제 서비스 객체 찾기
    const selectedServiceObject = serviceOptions.find(option => option.id === selectedService);
    
    if (!selectedServiceObject) {
      console.warn('선택된 서비스를 찾을 수 없습니다:', selectedService);
      return;
    }

    console.log('선택된 서비스 객체:', selectedServiceObject);

    // 이용권 시간을 분 단위로 변환
    const serviceDurationMinutes = convertTicketTimeToMinutes(selectedServiceObject.ticketTime);
    
    if (serviceDurationMinutes) {
      // 시작시간 + 이용권 시간 = 종료시간 계산
      const [startHour, startMinute] = selectedStartTime.split(':').map(Number);
      const startDate = new Date(0, 0, 0, startHour, startMinute);
      const endDate = new Date(startDate.getTime() + serviceDurationMinutes * 60000);
      
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      setSelectedEndTime(endTime);
      
      console.log(`✅ 자동 계산된 종료시간: ${selectedStartTime} + ${serviceDurationMinutes}분 = ${endTime}`);
    } else {
      console.warn('이용권 시간을 분 단위로 변환할 수 없습니다:', selectedServiceObject.ticketTime);
    }
  }, [selectedStartTime, selectedService, serviceOptions]);

  // --- 함수들 (간결화) ---

  // 이용권 시간을 분 단위로 변환하는 함수
  const convertTicketTimeToMinutes = (ticketTime) => {
    switch (ticketTime) {
      case 'MINUTES_20': return 20;
      case 'MINUTES_30': return 30;
      case 'MINUTES_40': return 40;
      case 'MINUTES_60': return 60;
      default: 
        console.warn('알 수 없는 티켓 시간:', ticketTime);
        return null;
    }
  };

  // 10분 단위 시작 시간으로 가능한 종료 시간 목록을 계산 (예약 정보는 이미 백엔드에서 처리됨)
  // `available10MinSlots`는 'HH:mm' 형태의 문자열 배열
  function calculateAvailableEndTimes(selectedStartTime, available10MinSlots) {
    const result = [];

    // 선택된 시작 시간의 인덱스를 찾음
    const startIndex = available10MinSlots.indexOf(selectedStartTime);
    if (startIndex === -1) {
      console.warn(`선택된 시작 시간 ${selectedStartTime}이(가) 가용 슬롯에 없습니다.`);
      return [];
    }

    // 선택된 시작 시간부터 순회하며 연속되는 슬롯 찾기
    for (let i = startIndex; i < available10MinSlots.length; i++) {
      const currentSlotStart = available10MinSlots[i];
      const nextSlotStart = available10MinSlots[i + 1];

      // 현재 슬롯의 끝 시간 (현재 슬롯 시작 시간 + 10분)
      const [currentHour, currentMinute] = currentSlotStart.split(':').map(Number);
      const currentSlotEnd = new Date(0, 0, 0, currentHour, currentMinute + 10);
      const currentSlotEndStr = `${currentSlotEnd.getHours().toString().padStart(2, '0')}:${currentSlotEnd.getMinutes().toString().padStart(2, '0')}`;

      // 가능한 종료 시간은 현재 슬롯의 '끝 시간' (예: 09:00 슬롯의 끝은 09:10)
      // 단, 최소 20분 이상이어야 함
      const [selStartHour, selStartMinute] = selectedStartTime.split(':').map(Number);
      const selStartTotalMinutes = selStartHour * 60 + selStartMinute;
      const currentEndTotalMinutes = currentSlotEnd.getHours() * 60 + currentSlotEnd.getMinutes();
      const durationMinutes = currentEndTotalMinutes - selStartTotalMinutes;

      if (durationMinutes >= 20) {
        result.push(currentSlotEndStr);
      }

      // 다음 슬롯이 없고, 현재 슬롯이 마지막 슬롯이라면 루프 종료
      if (!nextSlotStart) {
        break;
      }

      // 현재 슬롯의 '끝 시간'이 다음 슬롯의 '시작 시간'과 일치하지 않으면 (연속되지 않으면) 중단
      // 즉, 중간에 끊긴 구간이 있다면 더 이상 긴 시간은 불가능
      if (currentSlotEndStr !== nextSlotStart) {
        break;
      }
    }
    console.log(`✅ ${selectedStartTime}부터 가능한 종료시간 (최소 20분):`, result);
    return result;
  }

  // 달력 함수들
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (year, month, day) => `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const isToday = (year, month, day) => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  };
  const isSelected = (year, month, day) => {
    if (!selectedDate) return false;
    return selectedDate === formatDate(year, month, day);
  };
  const isPastDate = (year, month, day) => {
    const today = new Date();
    const dateToCheck = new Date(year, month, day);
    today.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  // 달력 렌더링 함수
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayHeaders = dayNames.map(day => (
        <div key={day} className="calendar-day-header">{day}</div>
    ));

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(year, month, day);
      const isSelectedDay = isSelected(year, month, day);
      const isPast = isPastDate(year, month, day);

      // 선택된 날짜가 있으면 오늘 표시를 하지 않음 (어떤 날짜든 선택되면 today 스타일 제거)
      const shouldShowToday = isCurrentDay && !selectedDate;

      days.push(
          <div
              key={day}
              className={`calendar-day ${shouldShowToday ? 'today' : ''} ${isSelectedDay ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
              onClick={() => !isPast && setSelectedDate(formatDate(year, month, day))}
              style={isPast ? { cursor: 'not-allowed', opacity: 0.5 } : { cursor: 'pointer' }}
          >
            {day}
          </div>
      );
    }

    return (
        <div className="calendar">
          <div className="calendar-header">
            <button className="calendar-nav" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
              <ChevronLeft size={20} />
            </button>
            <h3>{month + 1}월 {year}</h3>
            <button className="calendar-nav" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="calendar-grid">
            {dayHeaders}
            {days}
          </div>
        </div>
    );
  };

  // 예약 버튼 클릭 시 실행
  const handleBooking = async () => {
    // 1. 필수 입력값 검증
    if (!selectedDate || !selectedStartTime || !selectedEndTime || !selectedService) {
      alert('모든 항목을 선택해주세요.');
      return;
    }

    // 2. 멘토 정보 검증
    if (!mentor?.userId && !mentor?.id) {
      alert('멘토 정보가 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    // 3. 시간 유효성 검증
    if (selectedStartTime >= selectedEndTime) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    // 4. 과거 시간 예약 방지
    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);

    if (selectedDateTime <= now) {
      alert('과거 시간에는 예약할 수 없습니다. 현재 시간 이후의 시간을 선택해주세요.');
      return;
    }

    // 5. 로그인 상태 확인
    const token = localStorage?.getItem("accessToken") || sessionStorage?.getItem("accessToken");
    if (!token) {
      alert('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    try {
      // 선택한 ticketId로 티켓 상세 정보 찾기
      const selectedTicket = serviceOptions.find(option => option.id === selectedService);

      if (!selectedTicket) {
        alert('선택된 서비스 정보를 찾을 수 없습니다.');
        return;
      }

      console.log('🎯 예약 시작 - 선택된 정보:', {
        멘토: mentor?.name || mentor?.userId,
        날짜: selectedDate,
        시간: `${selectedStartTime} ~ ${selectedEndTime}`,
        서비스: selectedTicket.name,
        가격: selectedTicket.price
      });

      // 1. 먼저 예약을 생성
      // 날짜와 시간을 LocalDateTime 형식으로 변환 (초 단위까지 명시)
      const startDateTime = `${selectedDate}T${selectedStartTime}:00.000`;
      const endDateTime = `${selectedDate}T${selectedEndTime}:00.000`;

      const reservationData = {
        mentor: mentor?.userId || mentor?.id,
        ticket: selectedService,
        reservationStatus: "REQUESTED", // 예약 요청 상태
        reservationStartAt: startDateTime,
        reservationEndAt: endDateTime
      };

      console.log('🔄 예약 생성 중...', reservationData);

      let createdReservationId;

      // 실제 예약 API 호출
      try {
        const reservationResponse = await reservationAPI.createReservation(reservationData);

        // 응답 구조 확인 및 ID 추출
        console.log('📋 예약 생성 응답:', reservationResponse);

        if (reservationResponse.data) {
          // 일반적인 응답 구조: { success: true, data: { id: 1, ... } }
          createdReservationId = reservationResponse.data.data?.id || reservationResponse.data.id;
        } else {
          // 직접 응답 구조: { id: 1, ... }
          createdReservationId = reservationResponse.id;
        }

        if (!createdReservationId) {
          throw new Error('예약 ID를 찾을 수 없습니다. 응답 구조를 확인해주세요.');
        }

        console.log('✅ 예약 생성 완료. 예약 ID:', createdReservationId);

      } catch (error) {
        console.error('❌ 예약 생성 실패:', error);

        // 구체적인 오류 메시지 표시
        let errorMessage = '예약 생성에 실패했습니다.';

        if (error.response?.data?.message) {
          errorMessage += ` (${error.response.data.message})`;
        } else if (error.message) {
          errorMessage += ` (${error.message})`;
        }

        // 인증 오류인 경우
        if (error.response?.status === 401) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        }
        // 중복 예약인 경우
        else if (error.response?.status === 409 || error.message.includes('중복')) {
          errorMessage = '이미 예약된 시간입니다. 다른 시간을 선택해주세요.';
        }
        // 권한 오류인 경우
        else if (error.response?.status === 403) {
          errorMessage = '예약 권한이 없습니다.';
        }

        alert(errorMessage);
        return; // 예약 생성 실패 시 함수 종료
      }

      // 2. 예약 완료 후 결제 데이터 구성
      const bookingData = {
        mentor: mentor,
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        ticketId: selectedService,
        reservationId: createdReservationId, // 🎯 실제 생성된 예약 ID 사용
        ticket: {
          id: selectedTicket.id,
          name: selectedTicket.name,
          duration: selectedTicket.duration,
          price: selectedTicket.price
        },
        serviceName: selectedTicket.duration || selectedTicket.name?.replace(" 이용권", "") || "선택된 서비스",
        servicePrice: selectedTicket.price || 0,
        // 예약 생성 시간 추가 (디버깅용)
        createdAt: new Date().toISOString(),
        // 예약 시간 정보 추가
        reservationStartAt: `${selectedDate}T${selectedStartTime}:00`,
        reservationEndAt: `${selectedDate}T${selectedEndTime}:00`
      };

      console.log('📦 최종 예약 데이터:', bookingData);
      console.log('🎉 예약 성공! 결제 페이지로 이동합니다.');

      if (onBooking) onBooking(bookingData);

    } catch (error) {
      console.error('❌ 예약 처리 중 오류:', error);
      alert('예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };


  return (
      <div className="booking-container">
        <div className="booking-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft className="icon" />
          </button>
          <h1>예약하기</h1>
        </div>

        <div className="booking-content">
          {/* 서비스(이용권) 선택 */}
          <div className="booking-section">
            <h3><Clock className="icon" /> 서비스 시간 선택</h3>
            {loading ? (
                <div>이용권 정보를 불러오는 중...</div>
            ) : error ? (
                <div style={{ color: 'red' }}>{error}</div>
            ) : (
                <div className="service-options">
                  {serviceOptions.length === 0 && <div>이용 가능한 서비스가 없습니다.</div>}
                  {serviceOptions.map(option => (
                      <label key={option.id} className="service-option">
                        <input
                            type="radio"
                            name="service"
                            value={option.id}
                            checked={selectedService === option.id}
                            onChange={() => setSelectedService(option.id)}
                            style={{ display: 'none' }}
                        />
                        <span>
                    {option.duration
                        ? option.duration
                        : option.name
                            ? option.name.replace(" 이용권", "")
                            : ""}
                  </span>
                        <span className="price">
                    {option.price ? option.price.toLocaleString() + '원' : ''}
                  </span>
                      </label>
                  ))}
                </div>
            )}
          </div>

          {/* 날짜(캘린더) 선택 */}
          <div className="booking-section">
            <h3><Calendar className="icon" /> 가능한 일자를 선택해주세요.</h3>
            {renderCalendar()}
            {selectedDate && (
                <div className="selected-date-info">
                  * 해당 일자의 가능한 시간대
                  <div className="available-time">
                    {consultationSlots.length > 0
                        ? `${consultationSlots[0]} ~ ${consultationEndAt ? new Date(consultationEndAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', hour12: false}) : consultationSlots[consultationSlots.length-1]}`
                        : "상담 가능 시간이 없습니다."}
                  </div>
                </div>
            )}
          </div>

          {/* 시간 구간 선택 */}
          <div className="booking-section">
            <h3>시작 시간을 선택해주세요. (종료 시간은 이용권 시간에 따라 자동 계산됩니다)</h3>
            <div className="time-selector">
              <div className="time-dropdown">
                <select
                    value={selectedStartTime}
                    onChange={e => setSelectedStartTime(e.target.value)}
                    className="time-select"
                    disabled={consultationSlots.length === 0}
                >
                  <option value="">시작 시간</option>
                  {consultationSlots.map((slot, idx) => (
                      <option key={idx} value={slot}>{slot}</option>
                  ))}
                </select>
                <ChevronDown className="dropdown-icon" />
              </div>
              <span className="time-separator">~</span>
              <div className="time-dropdown">
                <select
                    value={selectedEndTime || ''}
                    className="time-select auto-calculated"
                    disabled
                >
                  <option value="">종료 시간</option>
                  {selectedEndTime && (
                    <option value={selectedEndTime}>{selectedEndTime}</option>
                  )}
                </select>
                <ChevronDown className="dropdown-icon disabled" />
              </div>
            </div>
          </div>

          <button className="booking-button" onClick={handleBooking}>
            예약하기
          </button>
        </div>
      </div>
  );
};

export default Booking;

