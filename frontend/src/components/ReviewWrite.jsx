import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Clock,
  Calendar,
  MessageCircle,
  User
} from 'lucide-react';
import './ReviewWrite.css';
import { accessTokenUtils } from '../utils/tokenUtils';
import {
  reservationAPI,
  userAPI,
  ticketAPI,
  messageAPI,
  reviewAPI
} from '../services/api';

const ReviewWrite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mentorId = searchParams.get('mentorId');
  const mentorName = searchParams.get('mentorName');
  const chatRoomId = searchParams.get('chatRoomId');
  const reservationId = searchParams.get('reservationId');

  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [reservationInfo, setReservationInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (mentorId) {
          try {
            const mentorResponse = await userAPI.getUserById(mentorId);
            setMentorInfo(mentorResponse.data.data || mentorResponse.data);
          } catch (error) {
            console.warn('멘토 정보 조회 실패:', error);
            setMentorInfo({ name: mentorName || '멘토' });
          }
        }

        if (reservationId) {
          try {
            const reservationResponse = await reservationAPI.getReservation(reservationId);
            const reservation = reservationResponse.data.data || reservationResponse.data;

            let ticketInfo = null;
            if (reservation.ticket || reservation.ticketId) {
              const ticketId = reservation.ticket || reservation.ticketId;
              const ticketResponse = await ticketAPI.getTicket(ticketId);
              ticketInfo = ticketResponse.data.data || ticketResponse.data;
            }

            setReservationInfo({
              ...reservation,
              ticketInfo
            });
          } catch (error) {
            console.warn('예약 정보 조회 실패:', error);
          }
        }

        if (chatRoomId) {
          try {
            const messagesResponse = await messageAPI.getMessages(chatRoomId, { size: 100 });
            const messages = messagesResponse.data.content || messagesResponse.data || [];

            if (messages.length > 0) {
              const firstMessage = messages[0];
              const lastMessage = messages[messages.length - 1];
              const durationMinutes = Math.max(
                  1,
                  Math.round(
                      (new Date(lastMessage.sentAt) - new Date(firstMessage.sentAt)) / (1000 * 60)
                  )
              );

              setSessionInfo({
                createdAt: firstMessage.sentAt,
                duration: durationMinutes,
                messageCount: messages.length,
                topic: '채팅 멘토링'
              });
            }
          } catch (error) {
            console.warn('세션 정보 조회 실패:', error);
          }
        }
      } catch (error) {
        console.error('데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mentorId || reservationId || chatRoomId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [mentorId, mentorName, chatRoomId, reservationId]);

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    if (!reservationId) {
      alert('예약 정보가 없어 리뷰를 제출할 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData = {
        content: reviewText.trim()
      };

      const response = await reviewAPI.createReview(reservationId, reviewData);

      localStorage.setItem(`review_completed_${reservationId}`, 'true');
      alert('리뷰가 성공적으로 제출되었습니다! 감사합니다!');
      navigate('/chat');
    } catch (error) {
      if (error.response?.status === 409) {
        localStorage.setItem(`review_completed_${reservationId}`, 'true');
        alert('이미 리뷰를 작성하셨습니다.');
        navigate('/chat');
        return;
      }

      let errorMessage = '리뷰 제출에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage += ` (${error.response.data.message})`;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (chatRoomId) {
      navigate(`/chat/${chatRoomId}`);
    } else {
      navigate('/chat');
    }
  };

  if (loading) {
    return (
        <div className="review-write-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>데이터를 불러오는 중...</span>
          </div>
        </div>
    );
  }

  return (
      <div className="review-write-container">
        <header className="review-header">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft className="icon" />
          </button>
          <h1 className="page-title">리뷰 작성</h1>
          <div className="header-spacer"></div>
        </header>

        <main className="review-content">
          <section className="mentor-section">
            <div className="mentor-card">
              <div className="mentor-avatar">
                {mentorInfo?.profileImage ? (
                    <img src={mentorInfo.profileImage} alt={`${mentorInfo.name} 프로필`} />
                ) : (
                    <div className="avatar-placeholder">
                      {(mentorInfo?.name || mentorName || '멘토')[0]}
                    </div>
                )}
              </div>
              <div className="mentor-details">
                <h2 className="mentor-name">{mentorInfo?.name || mentorName || '멘토'}님</h2>
                <p className="mentor-description">멘토링에 대한 솔직한 후기를 남겨주세요</p>
                {mentorInfo?.field && <p className="mentor-field">{mentorInfo.field}</p>}
              </div>
            </div>
          </section>

          <section className="reservation-section">
            <div className="reservation-card">
              <h3 className="review-section-title">
                <Calendar className="section-icon" />
                예약 정보
              </h3>
              <div className="reservation-details">
                <div className="reservation-item">
                  <Calendar className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">예약 날짜</span>
                    <span className="item-value">
                      {reservationInfo?.reservationStartAt ? 
                        new Date(reservationInfo.reservationStartAt).toLocaleDateString('ko-KR', {
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric', 
                          weekday: 'short'
                        }) : '정보 없음'}
                    </span>
                  </div>
                </div>
                
                <div className="reservation-item">
                  <Clock className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">진행 시간</span>
                    <span className="item-value">
                      {reservationInfo?.reservationStartAt && reservationInfo?.reservationEndAt ? 
                        `${new Date(reservationInfo.reservationStartAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})} ~ ${new Date(reservationInfo.reservationEndAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}` 
                        : '정보 없음'}
                    </span>
                  </div>
                </div>
                
                <div className="reservation-item">
                  <MessageCircle className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">예약 상태</span>
                    <span className={`item-value status-${reservationInfo?.reservationStatus?.toLowerCase()}`}>
                      {reservationInfo?.reservationStatus === 'CONFIRMED' ? '확정' :
                       reservationInfo?.reservationStatus === 'COMPLETED' ? '완료' :
                       reservationInfo?.reservationStatus === 'PENDING' ? '대기중' :
                       reservationInfo?.reservationStatus === 'REQUESTED' ? '요청됨' :
                       reservationInfo?.reservationStatus === 'CANCELLED' ? '취소됨' :
                       reservationInfo?.reservationStatus || '알 수 없음'}
                    </span>
                  </div>
                </div>

                {reservationInfo?.ticketInfo && (
                  <>
                    <div className="reservation-item">
                      <User className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">이용권</span>
                        <span className="item-value">{reservationInfo.ticketInfo.name || '정보 없음'}</span>
                      </div>
                    </div>
                    
                    <div className="reservation-item">
                      <Clock className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">이용 시간</span>
                        <span className="item-value">
                          {reservationInfo.ticketInfo.ticketTime ? 
                            (typeof reservationInfo.ticketInfo.ticketTime === 'string' && reservationInfo.ticketInfo.ticketTime.startsWith('MINUTES_') ? 
                              `${reservationInfo.ticketInfo.ticketTime.replace('MINUTES_', '')}분` : 
                              `${reservationInfo.ticketInfo.ticketTime}분`) : '정보 없음'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="reservation-item">
                      <MessageCircle className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">결제 금액</span>
                        <span className="item-value">
                          {reservationInfo.ticketInfo.price ? 
                            `${reservationInfo.ticketInfo.price.toLocaleString()}원` : '정보 없음'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {sessionInfo && (
              <section className="session-section">
                <div className="session-card">
                  <h3 className="section-title">
                    <MessageCircle className="section-icon" />
                    멘토링 세션 정보
                  </h3>
                  <div className="session-details">
                    <div className="session-item">
                      <Calendar className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">세션 날짜</span>
                        <span className="item-value">
                          {new Date(sessionInfo.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className="session-item">
                      <Clock className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">멘토링 시간</span>
                        <span className="item-value">{sessionInfo.duration}분</span>
                      </div>
                    </div>
                    <div className="session-item">
                      <MessageCircle className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">주고받은 메시지</span>
                        <span className="item-value">{sessionInfo.messageCount}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
          )}

          <section className="review-text-section">
            <h3 className="review-section-title">상세 후기</h3>
            <div className="textarea-container">
              <textarea
                  className="review-textarea"
                  placeholder="멘토링에서 좋았던 점, 아쉬웠던 점, 개선할 점 등을 자유롭게 작성해주세요.&#10;&#10;• 멘토의 전문성은 어떠셨나요?&#10;• 설명이 이해하기 쉬웠나요?&#10;• 질문에 대한 답변은 만족스러웠나요?&#10;• 추천하고 싶은 멘토인가요?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={1000}
              />
              <div className="character-count">{reviewText.length}/1000</div>
            </div>
          </section>

          <section className="submit-section">
            {!reservationId ? (
                <div className="submit-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h4>예약 정보가 필요합니다</h4>
                    <p>리뷰 작성은 예약 내역에서 가능합니다.</p>
                  </div>
                </div>
            ) : (
                <button
                    className={`submit-button ${reviewText.trim() ? 'active' : ''}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reviewText.trim()}
                >
                  {isSubmitting ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>제출 중...</span>
                      </>
                  ) : (
                      <>
                        <Send className="icon" />
                        <span>리뷰 제출하기</span>
                      </>
                  )}
                </button>
            )}
            <p className="submit-note">
              {reservationId
                  ? '제출된 리뷰는 수정할 수 없습니다.'
                  : '마이페이지에서 완료된 예약에 리뷰 작성이 가능합니다.'}
            </p>
          </section>
        </main>
      </div>
  );
};

export default ReviewWrite;