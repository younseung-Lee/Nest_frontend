import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Send, Clock, Calendar, MessageCircle, User } from 'lucide-react';
import './ReviewWrite.css';
import axios from 'axios';
import { accessTokenUtils } from '../utils/tokenUtils';
import { reservationAPI, userAPI, ticketAPI, messageAPI, reviewAPI } from '../services/api';

const ReviewWrite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL 파라미터에서 정보 추출
  const mentorId = searchParams.get('mentorId');
  const mentorName = searchParams.get('mentorName');
  const chatRoomId = searchParams.get('chatRoomId');
  const reservationId = searchParams.get('reservationId'); // 예약 ID 추가
  // 상태 관리

  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [mentorProfileImage, setMentorProfileImage] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [reservationInfo, setReservationInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 멘토 정보, 세션 정보, 예약 정보 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. 멘토 정보 조회
        if (mentorId) {
          try {
            // userAPI를 사용해서 멘토 정보 조회
            const mentorResponse = await userAPI.getUserById(mentorId);
            console.log('👤 멘토 정보 API 응답:', mentorResponse);
            setMentorInfo(mentorResponse.data.data || mentorResponse.data);

            // 멘토 프로필 이미지 조회
            try {
              const profileImageResponse = await userAPI.getUserProfileImage(mentorId);
              console.log('🖼️ 멘토 프로필 이미지 API 응답:', profileImageResponse);
              console.log('🖼️ 전체 응답 데이터:', JSON.stringify(profileImageResponse.data, null, 2));
              
              // 다양한 응답 구조에 대응
              const imageUrl = profileImageResponse.data?.imgUrl || 
                              profileImageResponse.data?.data?.imgUrl;
              
              console.log('🖼️ 추출된 이미지 URL:', imageUrl);
              setMentorProfileImage(imageUrl || null);
            } catch (imageError) {
              console.warn('멘토 프로필 이미지 조회 실패:', imageError);
              console.warn('🖼️ 에러 응답:', imageError.response?.data);
              setMentorProfileImage(null);
            }
          } catch (error) {
            console.warn('멘토 정보 조회 실패:', error);
            // 실패 시 URL 파라미터의 이름 사용
            setMentorInfo({ name: mentorName || '멘토' });
            setMentorProfileImage(null);
          }
        }

        // 2. 예약 정보 조회 (reservationId가 있는 경우)
        if (reservationId) {
          try {
            console.log('🔍 예약 정보 조회 시작 - reservationId:', reservationId);
            const reservationResponse = await reservationAPI.getReservation(reservationId);
            console.log('📋 예약 API 응답:', reservationResponse);
            
            const reservation = reservationResponse.data.data || reservationResponse.data;
            console.log('📋 예약 데이터:', reservation);
            
            // 티켓 정보도 함께 조회
            let ticketInfo = null;
            if (reservation.ticket || reservation.ticketId) {
              try {
                const ticketId = reservation.ticket || reservation.ticketId;
                console.log('🎫 티켓 정보 조회 시작 - ticketId:', ticketId);
                const ticketResponse = await ticketAPI.getTicket(ticketId);
                console.log('🎫 티켓 API 응답:', ticketResponse);
                ticketInfo = ticketResponse.data.data || ticketResponse.data;
                console.log('🎫 티켓 데이터:', ticketInfo);
              } catch (ticketError) {
                console.warn('티켓 정보 조회 실패:', ticketError);
              }
            }

            const finalReservationInfo = {
              ...reservation,
              ticketInfo
            };
            console.log('✅ 최종 예약 정보:', finalReservationInfo);
            setReservationInfo(finalReservationInfo);
          } catch (error) {
            console.warn('예약 정보 조회 실패:', error);
          }
        }

        // 3. 채팅룸 세션 정보 조회 (chatRoomId가 있는 경우)
        if (chatRoomId) {
          try {
            // 메시지 API를 사용해서 세션 정보 구성
            console.log('💬 채팅룸 메시지 정보 조회 시작 - chatRoomId:', chatRoomId);
            const messagesResponse = await messageAPI.getMessages(chatRoomId, { size: 100 });
            console.log('💬 메시지 API 응답:', messagesResponse);
            
            const messages = messagesResponse.data.content || messagesResponse.data || [];
            
            if (messages.length > 0) {
              // 메시지 데이터를 기반으로 세션 정보 구성
              const firstMessage = messages[0];
              const lastMessage = messages[messages.length - 1];
              const messageCount = messages.length;
              
              // 실제 채팅 지속 시간 계산 (분 단위)
              const startTime = new Date(firstMessage.sentAt);
              const endTime = new Date(lastMessage.sentAt);
              const durationMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));
              
              const sessionInfo = {
                createdAt: firstMessage.sentAt,
                duration: durationMinutes,
                messageCount: messageCount,
                topic: '채팅 멘토링', // 기본 주제
                startTime: firstMessage.sentAt,
                endTime: lastMessage.sentAt
              };
              
              console.log('✅ 구성된 세션 정보:', sessionInfo);
              setSessionInfo(sessionInfo);
            }
          } catch (sessionError) {
            console.warn('세션 정보 조회 실패:', sessionError);
            // 세션 정보가 없어도 리뷰 작성은 가능하므로 에러를 무시
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


  // 리뷰 제출
  const handleSubmit = async () => {

    if (!reviewText.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    // reservationId가 없으면 리뷰 제출 불가
    if (!reservationId) {
      alert('예약 정보가 없어 리뷰를 제출할 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // ReviewRequestDto에 맞는 데이터 구조
      const reviewData = {
        content: reviewText.trim()
        // mentor와 mentee는 백엔드에서 자동으로 설정됨
        // rating 필드는 ReviewRequestDto에 있는지 확인 필요
      };

      console.log('리뷰 제출 데이터:', reviewData);
      console.log('리뷰 제출 URL:', `/api/reservations/${reservationId}/reviews`);

      // reviewAPI 사용하여 리뷰 제출
      const response = await reviewAPI.createReview(reservationId, reviewData);

      console.log('리뷰 제출 성공:', response.data);
      
      // 리뷰 제출 완료를 localStorage에 저장 (다른 탭/창에서도 확인 가능)
      const reviewCompletedKey = `review_completed_${reservationId}`;
      localStorage.setItem(reviewCompletedKey, 'true');
      console.log(`✅ localStorage에 리뷰 완료 상태 저장: ${reviewCompletedKey} = true`);

      console.log('리뷰 제출 성공:', response.data);

      alert('리뷰가 성공적으로 제출되었습니다! 감사합니다!');
      
      // 채팅 목록으로 이동
      navigate('/chat');
      
    } catch (error) {
      console.error('리뷰 제출 실패:', error);
      
      // 409 에러(이미 리뷰 존재)는 성공으로 처리
      if (error.response?.status === 409) {
        console.log('✅ 이미 리뷰가 존재합니다. 리뷰 완료로 처리합니다.');
        console.log('🔍 현재 reservationId:', reservationId);
        
        // 리뷰 제출 완료를 localStorage에 저장
        const reviewCompletedKey = `review_completed_${reservationId}`;
        localStorage.setItem(reviewCompletedKey, 'true');
        console.log(`✅ localStorage에 리뷰 완료 상태 저장: ${reviewCompletedKey} = true`);
        
        // 저장 확인
        const savedValue = localStorage.getItem(reviewCompletedKey);
        console.log(`🔍 저장 확인: ${reviewCompletedKey} = ${savedValue}`);
        
        // 성공 메시지 표시
        alert('이미 리뷰를 작성하셨습니다! 감사합니다!');
        
        // 채팅 목록으로 이동
        navigate('/chat');
        
        return; // 에러 처리 로직 실행하지 않고 종료
      }
      
      // 구체적인 에러 메시지 표시
      let errorMessage = '리뷰 제출에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage += ` (${error.response.data.message})`;
      } else if (error.response?.status === 400) {
        errorMessage = '잘못된 요청입니다. 예약 정보를 확인해주세요.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.response?.status === 403) {
        errorMessage = '리뷰 작성 권한이 없습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '예약 정보를 찾을 수 없습니다.';
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 뒤로가기
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
          <span>멘토 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="review-write-container">
      {/* 헤더 */}
      <header className="review-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft className="icon" />
        </button>
        <h1 className="page-title">리뷰 작성</h1>
        <div className="header-spacer"></div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="review-content">
        {/* 멘토 정보 */}
        <section className="mentor-section">
          <div className="mentor-card">
            <div className="mentor-avatar">
              {mentorProfileImage && typeof mentorProfileImage === 'string' ? (
                <img 
                  src={mentorProfileImage} 
                  alt={`${mentorInfo?.name || mentorName || '멘토'} 프로필`}
                  onError={(e) => {
                    console.error('🖼️ 이미지 로드 실패:', mentorProfileImage);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-placeholder"
                style={{ display: mentorProfileImage && typeof mentorProfileImage === 'string' ? 'none' : 'flex' }}
              >
                {(mentorInfo?.name || mentorName || '멘토')[0]}
              </div>
            </div>
            <div className="mentor-details">
              <h2 className="mentor-name">{mentorInfo?.name || mentorName || '멘토'}님</h2>
              <p className="mentor-description">멘토링에 대한 솔직한 후기를 남겨주세요</p>
              {mentorInfo?.field && (
                <p className="mentor-field">{mentorInfo.field}</p>
              )}
            </div>
          </div>
        </section>

        {/* 예약 정보 */}
        {reservationInfo && (
          <section className="reservation-section">
            <div className="reservation-card">
              <h3 className="section-title">
                <Calendar className="section-icon" />
                예약 정보
              </h3>
              <div className="reservation-details">
                <div className="reservation-item">
                  <Calendar className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">예약 날짜</span>
                    <span className="item-value">
                      {reservationInfo.reservationStartAt 
                        ? new Date(reservationInfo.reservationStartAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })
                        : '정보 없음'}
                    </span>
                  </div>
                </div>
                
                <div className="reservation-item">
                  <Clock className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">진행 시간</span>
                    <span className="item-value">
                      {reservationInfo.reservationStartAt && reservationInfo.reservationEndAt ? (
                        <>
                          {new Date(reservationInfo.reservationStartAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} ~ {new Date(reservationInfo.reservationEndAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </>
                      ) : '정보 없음'}
                    </span>
                  </div>
                </div>

                {reservationInfo.ticketInfo ? (
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
                          {reservationInfo.ticketInfo.ticketTime 
                            ? (typeof reservationInfo.ticketInfo.ticketTime === 'string' && reservationInfo.ticketInfo.ticketTime.startsWith('MINUTES_')
                                ? `${reservationInfo.ticketInfo.ticketTime.replace('MINUTES_', '')}분`
                                : `${reservationInfo.ticketInfo.ticketTime}분`)
                            : '정보 없음'}
                        </span>
                      </div>
                    </div>

                    <div className="reservation-item">
                      <MessageCircle className="item-icon" />
                      <div className="item-content">
                        <span className="item-label">결제 금액</span>
                        <span className="item-value">
                          {reservationInfo.ticketInfo.price 
                            ? `${reservationInfo.ticketInfo.price.toLocaleString()}원`
                            : '정보 없음'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="reservation-item">
                    <User className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">이용권 정보</span>
                      <span className="item-value">정보를 불러올 수 없습니다</span>
                    </div>
                  </div>
                )}

                <div className="reservation-item">
                  <MessageCircle className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">예약 상태</span>
                    <span className={`item-value status-${reservationInfo.reservationStatus?.toLowerCase()}`}>
                      {reservationInfo.reservationStatus === 'CONFIRMED' ? '확정' :
                       reservationInfo.reservationStatus === 'COMPLETED' ? '완료' :
                       reservationInfo.reservationStatus === 'PENDING' ? '대기중' :
                       reservationInfo.reservationStatus === 'REQUESTED' ? '요청됨' :
                       reservationInfo.reservationStatus === 'CANCELLED' ? '취소됨' :
                       reservationInfo.reservationStatus || '알 수 없음'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 세션 정보 */}
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
                      {new Date(sessionInfo.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                  </div>
                </div>
                
                {sessionInfo.duration && (
                  <div className="session-item">
                    <Clock className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">멘토링 시간</span>
                      <span className="item-value">{sessionInfo.duration}분</span>
                    </div>
                  </div>
                )}
                
                {sessionInfo.topic && (
                  <div className="session-item">
                    <User className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">상담 주제</span>
                      <span className="item-value">{sessionInfo.topic}</span>
                    </div>
                  </div>
                )}
                
                {sessionInfo.messageCount && (
                  <div className="session-item">
                    <MessageCircle className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">주고받은 메시지</span>
                      <span className="item-value">{sessionInfo.messageCount}개</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 기본 정보 (예약 정보와 세션 정보가 모두 없을 때) */}
        {!reservationInfo && !sessionInfo && (
          <section className="booking-section">
            <div className="booking-card">
              <h3 className="section-title">
                <Calendar className="section-icon" />
                멘토링 정보
              </h3>
              <div className="booking-details">
                <div className="booking-item">
                  <Clock className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">멘토링 유형</span>
                    <span className="item-value">채팅 멘토링</span>
                  </div>
                </div>
                
                <div className="booking-item">
                  <Calendar className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">진행 날짜</span>
                    <span className="item-value">
                      {new Date().toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="booking-item">
                  <User className="item-icon" />
                  <div className="item-content">
                    <span className="item-label">멘토</span>
                    <span className="item-value">{mentorInfo?.name || mentorName || '멘토'}님</span>
                  </div>
                </div>

                {chatRoomId && (
                  <div className="booking-item">
                    <MessageCircle className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">채팅방 ID</span>
                      <span className="item-value">{chatRoomId}</span>
                    </div>
                  </div>
                )}

                {reservationId && (
                  <div className="booking-item">
                    <MessageCircle className="item-icon" />
                    <div className="item-content">
                      <span className="item-label">예약 ID</span>
                      <span className="item-value">{reservationId}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 리뷰 텍스트 섹션 */}
        <section className="review-text-section">
          <h3 className="section-title">상세 후기</h3>
          <div className="textarea-container">
            <textarea
              className="review-textarea"
              placeholder="멘토링에서 좋았던 점, 아쉬웠던 점, 개선할 점 등을 자유롭게 작성해주세요.&#10;&#10;• 멘토의 전문성은 어떠셨나요?&#10;• 설명이 이해하기 쉬웠나요?&#10;• 질문에 대한 답변은 만족스러웠나요?&#10;• 추천하고 싶은 멘토인가요?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="character-count">
              {reviewText.length}/1000
            </div>
          </div>
        </section>

        {/* 제출 버튼 */}
        <section className="submit-section">
          {!reservationId ? (
            <div className="submit-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h4>예약 정보가 필요합니다</h4>
                <p>리뷰 작성을 위해서는 예약 정보가 필요합니다.<br />
                   예약 내역에서 리뷰 작성 버튼을 통해 접근해주세요.</p>
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
              ? '제출된 리뷰는 수정할 수 없으니 신중하게 작성해주세요.'
              : '마이페이지 > 예약 내역에서 완료된 예약의 리뷰 작성 버튼을 이용해주세요.'
            }
          </p>
        </section>
      </main>
    </div>
  );
};

export default ReviewWrite;
