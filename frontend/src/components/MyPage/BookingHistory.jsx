import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { reservationAPI, userAPI, ticketAPI } from '../../services/api';
import './BookingHistory.css';

const BookingHistory = ({ userInfo }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
      fetchReservations(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]); // searchParams가 변경될 때마다 실행

  const fetchReservations = async (page = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reservationAPI.getReservations({
        page: page,
        size: 10
      });
      
      const responseData = response.data.data;
      const rawReservations = responseData.content;
      
      // 페이지네이션 정보 업데이트
      setCurrentPage(page);
      setTotalPages(responseData.totalPages);
      setTotalElements(responseData.totalElements);
      setHasNext(responseData.hasNext);
      setHasPrevious(responseData.hasPrevious);

      // 1. 필요한 모든 멘토, 멘티, 티켓 ID를 수집
      const uniqueMentorIds = new Set();
      const uniqueMenteeIds = new Set();
      const uniqueTicketIds = new Set();

      rawReservations.forEach(reservation => {
        uniqueMentorIds.add(reservation.mentor);
        uniqueMenteeIds.add(reservation.mentee);
        uniqueTicketIds.add(reservation.ticket);
      });

      // 2. 각 고유 ID에 대해 한 번씩만 API 호출 (Promise.all 사용)
      const mentorPromises = Array.from(uniqueMentorIds).map(
        id => userAPI.getUserById(id)
      );
      const menteePromises = Array.from(uniqueMenteeIds).map(
        id => userAPI.getUserById(id)
      );
      const ticketPromises = Array.from(uniqueTicketIds).map(
        id => ticketAPI.getTicket(id)
      );

      const [mentorResponses, menteeResponses, ticketResponses] = await Promise.all([
        Promise.all(mentorPromises),
        Promise.all(menteePromises),
        Promise.all(ticketPromises)
      ]);

      // 3. ID를 키로 하는 Map을 생성하여 빠른 조회를 가능하게 함
      const mentorMap = new Map(
        mentorResponses.map(res => [res.data.data.id, res.data.data.name])
      );
      const menteeMap = new Map(
        menteeResponses.map(res => [res.data.data.id, res.data.data.name])
      );
      const ticketMap = new Map(
        ticketResponses.map(res => [
          res.data.data.id,
          {
            name: res.data.data.name,
            price: res.data.data.price,
            time: res.data.data.ticketTime
          }
        ])
      );

      // 4. 원본 예약 데이터와 조회된 정보들을 조합
      const fetchedReservations = rawReservations.map(reservation => {
        const mentorName = mentorMap.get(reservation.mentor) || '알 수 없음';
        const menteeName = menteeMap.get(reservation.mentee) || '알 수 없음';
        const ticketInfo = ticketMap.get(reservation.ticket);

        return {
          id: reservation.id,
          mentorId: reservation.mentor, // 멘토 ID 추가
          menteeId: reservation.mentee, // 멘티 ID 추가
          mentor: mentorName,
          mentee: menteeName,
          ticketName: ticketInfo ? ticketInfo.name : '알 수 없음',
          ticketPrice: ticketInfo ? ticketInfo.price : 0,
          ticketTime: ticketInfo ? ticketInfo.time : 0,
          status: reservation.reservationStatus,
          startTime: reservation.reservationStartAt,
          endTime: reservation.reservationEndAt
        };
      });

      setReservations(fetchedReservations);
    } catch (err) {
      console.error("예약 내역을 불러오는 데 실패했습니다:", err);
      setError("예약 내역을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const formatTicketTime = (time) => {
    if (typeof time === 'string' && time.startsWith('MINUTES_')) {
      return time.replace('MINUTES_', '');
    }
    return time;
  };

  const handleRetry = () => {
    setError(null);
    fetchReservations(0);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', newPage.toString());
      setSearchParams(newSearchParams);
    }
  };

  // 페이지 번호 생성 로직
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // 총 페이지가 5개 이하면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 총 페이지가 5개 초과면 현재 페이지 기준으로 표시
      let startPage = Math.max(0, currentPage - 2);
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // 리뷰 작성 페이지로 이동
  const handleWriteReview = (reservation) => {
    const queryParams = new URLSearchParams({
      mentorId: reservation.mentorId || '', // 멘토 ID도 함께 전달
      mentorName: reservation.mentor || '',
      reservationId: reservation.id,
    });
    
    navigate(`/review/write?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="bookings-tab">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>예약 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-tab">
        <div className="error-state">
          <BookOpen className="error-icon" />
          <h4>오류가 발생했습니다</h4>
          <p>{error}</p>
          <button className="retry-btn" onClick={handleRetry}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-tab">
      <div className="section-header">
        <h3>{userInfo.userRole === 'MENTOR' ? '예정된 예약' : '예약 내역'}</h3>
        <p>
          {userInfo.userRole === 'MENTOR'
            ? '예정된 멘토링 세션을 확인하고 관리하세요'
            : '멘토링 예약 및 이용 내역을 확인하세요'}
        </p>
        {totalElements > 0 && (
          <div className="total-count">
            총 <span className="count-number">{totalElements.toLocaleString()}</span>개의 예약
          </div>
        )}
      </div>

      {reservations.length > 0 ? (
        <>
          <div className="reservations-scroll-container">
            <div className="reservations-container">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-header">
                    <div className="reservation-title">
                      <h4>{reservation.ticketName}</h4>
                      <span
                        className={`status-badge ${reservation.status.toLowerCase()}`}
                      >
                        {reservation.status === 'PAID' ? '예약 확정' :
                         reservation.status === 'COMPLETED' ? '예약 완료' :
                         reservation.status === 'CANCELED' ? '예약 취소' :
                         reservation.status}
                      </span>
                    </div>
                    <div className="reservation-price">
                      ₩{reservation.ticketPrice.toLocaleString()}
                    </div>
                  </div>

                  <div className="reservation-body">
                    <div className="reservation-info">
                      <div className="info-row">
                        <span className="info-label">
                          {userInfo.userRole === 'MENTOR' ? '멘티' : '멘토'}
                        </span>
                        <span className="info-value">
                          {userInfo.userRole === 'MENTOR' 
                            ? reservation.mentee 
                            : reservation.mentor}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">이용 시간</span>
                        <span className="info-value">{formatTicketTime(reservation.ticketTime)}분</span>
                      </div>
                    </div>

                    <div className="reservation-schedule">
                      <div className="schedule-item">
                        <Clock className="schedule-icon" />
                        <div className="schedule-details">
                          <div className="schedule-date">
                            {new Date(reservation.startTime).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </div>
                          <div className="schedule-time">
                            {new Date(reservation.startTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} ~ {new Date(reservation.endTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="reservation-actions">
                    {reservation.status === 'CONFIRMED' && (
                      <button className="action-btn primary">
                        <BookOpen size={16} />
                        상담 시작
                      </button>
                    )}
                    {reservation.status === 'COMPLETED' && (
                      <button 
                        className="action-btn secondary"
                        onClick={() => handleWriteReview(reservation)}
                      >
                        <FileText size={16} />
                        리뷰 작성
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 고급스러운 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-container">
                {/* 이전 페이지 버튼 */}
                <button
                  className={`pagination-btn prev-btn ${!hasPrevious ? 'disabled' : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft size={18} />
                  <span>이전</span>
                </button>

                {/* 페이지 번호들 */}
                <div className="pagination-numbers">
                  {/* 첫 페이지로 가는 버튼 (현재 페이지가 3 이상일 때만) */}
                  {currentPage > 2 && totalPages > 5 && (
                    <>
                      <button
                        className="pagination-number"
                        onClick={() => handlePageChange(0)}
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                    </>
                  )}

                  {/* 메인 페이지 번호들 */}
                  {generatePageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => {
                        console.log('버튼 클릭!')
                        handlePageChange(pageNum)
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  ))}

                  {/* 마지막 페이지로 가는 버튼 (현재 페이지가 끝에서 3번째 이전일 때만) */}
                  {currentPage < totalPages - 3 && totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 4 && <span className="pagination-ellipsis">...</span>}
                      <button
                        className="pagination-number"
                        onClick={() => handlePageChange(totalPages - 1)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* 다음 페이지 버튼 */}
                <button
                  className={`pagination-btn next-btn ${!hasNext ? 'disabled' : ''}`}
                  onClick={() => {
                    console.log('버튼 클릭!')
                    handlePageChange(currentPage + 1)
                  }}
                  disabled={!hasNext}
                >
                  <span>다음</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 페이지 정보 */}
              <div className="pagination-info">
                <span>
                  {currentPage + 1} / {totalPages} 페이지 
                  <span className="total-items">
                    (총 {totalElements.toLocaleString()}개)
                  </span>
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <h4>
            {userInfo.userRole === 'MENTOR'
              ? '아직 예정된 예약이 없습니다'
              : '아직 예약 내역이 없습니다'}
          </h4>
          <p>
            {userInfo.userRole === 'MENTOR'
              ? '멘티들이 예약을 하면 여기에서 확인할 수 있어요!'
              : '멘토링을 예약하고 성장해보세요!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
