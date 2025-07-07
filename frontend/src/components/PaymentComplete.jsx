import React, { useState } from 'react';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  CreditCard,
  Home,
  Receipt,
  ArrowLeft
} from 'lucide-react';
import './PaymentComplete.css'; // PaymentComplete 전용 CSS 사용
import ReceiptModal from './ReceiptModal'; // 영수증 모달 컴포넌트 import

const PaymentComplete = ({paymentData, onHome, onPaymentHistory}) => {
  // 영수증 모달 상태 관리
  const [showReceipt, setShowReceipt] = useState(false);
  
  // 🔍 받은 데이터 구조 확인 (개발 모드에서만)
  if (import.meta.env.DEV && paymentData) {
    console.group('🔍 PaymentComplete 받은 데이터 구조');
    console.log('전체 paymentData:', paymentData);
    console.log('paymentData.data:', paymentData.data);
    console.log('paymentData.originalBookingData:', paymentData.originalBookingData);
    console.log('paymentData.apiBookingData:', paymentData.apiBookingData);
    // paymentResult 객체 구조도 확인 추가
    console.log('paymentData.paymentResult:', paymentData.paymentResult);
    console.log('paymentData.paymentResult?.booking:', paymentData.paymentResult?.booking);
    console.groupEnd();
  }

  // 안전한 숫자 포맷팅 함수
  const safeFormatNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue.toLocaleString();
    const numValue = Number(value);
    if (isNaN(numValue)) return defaultValue.toLocaleString();
    return numValue.toLocaleString();
  };

  // 안전한 숫자 검증 함수
  const safeNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const numValue = Number(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  const formatDate = (dateString) => {
    // 유효한 날짜 문자열이 아닐 경우 현재 시간 반환
    if (!dateString || dateString === '날짜 미정' || dateString === '시간 미정') {
      return new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    const date = new Date(dateString);
    // Date 객체가 유효한지 확인 (Invalid Date 방지)
    if (isNaN(date.getTime())) {
      console.warn('⚠️ 유효하지 않은 날짜 형식:', dateString);
      return new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = () => {
    // 영수증 모달 열기
    setShowReceipt(true);
  };

  // 예약 정보 추출 함수
  const getBookingInfo = () => {
    if (!paymentData) {
      return {};
    }

    // 다양한 데이터 소스에서 예약 정보 추출
    // paymentData.paymentResult?.booking을 더 명시적으로 추가했습니다.
    const sources = [
      paymentData.data,
      paymentData.originalBookingData,
      paymentData.apiBookingData?.reservation,
      paymentData.apiBookingData?.booking,
      paymentData.originalResponse,
      paymentData.paymentResult?.booking // 여기에 추가
    ];

    const info = {};

    // 멘토 정보
    for (const source of sources) {
      // source?.mentor?.name이 유효하고 '멘토 정보 없음'이 아닐 때만 할당
      if (source?.mentor?.name && source.mentor.name !== '멘토 정보 없음' && !info.mentorName) {
        info.mentorName = source.mentor.name;
      }
      // 직접 mentorName 필드가 있는 경우 (예: paymentResult.booking.mentorName)
      if (source?.mentorName && source.mentorName !== '멘토 정보 없음' && !info.mentorName) {
        info.mentorName = source.mentorName;
      }
    }

    // 예약 날짜
    for (const source of sources) {
      // source?.date가 유효하고 '날짜 미정'이 아닐 때만 할당
      if (source?.date && source.date !== '날짜 미정' && !info.reservationDate) {
        info.reservationDate = source.date;
      }
      if (source?.reservationDate && source.reservationDate !== '날짜 미정' && !info.reservationDate) {
        info.reservationDate = source.reservationDate;
      }
    }

    // 예약 시간
    for (const source of sources) {
      // source?.time이 유효하고 '시간 미정'이 아닐 때만 할당
      if (source?.time && source.time !== '시간 미정' && !info.reservationTime) {
        info.reservationTime = source.time;
      }
      if (source?.reservationTime && source.reservationTime !== '시간 미정' && !info.reservationTime) {
        info.reservationTime = source.reservationTime;
      }
      // startTime과 endTime이 모두 유효하고 '시간 미정'이 아닐 때만 할당
      if (source?.startTime && source?.endTime &&
          source.startTime !== '시간 미정' && source.endTime !== '시간 미정' &&
          !info.reservationTime) {
        info.reservationTime = `${source.startTime} - ${source.endTime}`;
      }
    }

    // 서비스명 (ticketName으로 통일)
    for (const source of sources) {
      // source?.service가 유효하고 '멘토링 서비스'가 아닐 때만 할당 (기본값 제외)
      if (source?.service && source.service !== '멘토링 서비스' && !info.ticketName) {
        info.ticketName = source.service;
      }
      if (source?.serviceName && !info.ticketName) {
        info.ticketName = source.serviceName;
      }
      if (source?.orderName && !info.ticketName) {
        info.ticketName = source.orderName;
      }
      if (source?.ticket?.name && !info.ticketName) {
        info.ticketName = source.ticket.name;
      }
      if (source?.ticketName && !info.ticketName) {
        info.ticketName = source.ticketName;
      }
    }

    // 원본 금액
    for (const source of sources) {
      if (source?.servicePrice && !info.originalAmount) {
        info.originalAmount = source.servicePrice;
      }
      if (source?.originalAmount && !info.originalAmount) {
        info.originalAmount = source.originalAmount;
      }
    }

    // 할인 금액
    for (const source of sources) {
      if (source?.couponDiscount && !info.discountAmount) {
        info.discountAmount = source.couponDiscount;
      }
      if (source?.discountAmount && !info.discountAmount) {
        info.discountAmount = source.discountAmount;
      }
    }

    return info;
  };

  const bookingInfo = getBookingInfo();

  // paymentData가 없는 경우 에러 처리
  if (!paymentData) {
    console.error('❌ PaymentComplete: paymentData가 전달되지 않았습니다.');
    return (
        <div className="payment-complete-container">
          <div className="payment-complete-content">
            <div className="error-section">
              <h2>결제 정보를 찾을 수 없습니다</h2>
              <p>결제는 정상적으로 처리되었지만, 상세 정보를 불러올 수 없습니다.</p>
              <button onClick={onHome} className="home-button">
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="payment-complete-container">
        <div className="payment-complete-content">
          {/* 성공 아이콘 및 메시지 */}
          <div className="payment-section">
            <div className="payment-complete-success-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="payment-success-icon" style={{ marginBottom: '1rem' }}>
                <CheckCircle size={80} style={{ color: '#22c55e' }}/>
              </div>
              <h2 className="success-title" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>결제가 완료되었습니다!</h2>
              <p className="success-subtitle" style={{ color: '#6b7280' }}>멘토링 예약이 성공적으로 완료되었습니다.</p>
            </div>
          </div>

          {/* 결제 정보 카드 */}
          <div className="payment-section">
            <h3><CreditCard className="icon" /> 결제 정보</h3>
            <div className="booking-summary">
              <div className="summary-item">
                <Receipt className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">주문번호</span>
                  <span className="summary-value">{paymentData?.orderId || '주문번호 없음'}</span>
                </div>
              </div>
              <div className="summary-item">
                <CreditCard className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">결제금액</span>
                  <span className="summary-value">{safeFormatNumber(paymentData?.amount)}원</span>
                </div>
              </div>
              <div className="summary-item">
                <CreditCard className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">결제방법</span>
                  <span className="summary-value">토스페이</span>
                </div>
              </div>
              <div className="summary-item">
                <Clock className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">결제일시</span>
                  <span className="summary-value">{formatDate(paymentData?.approvedAt)}</span>
                </div>
              </div>
            </div>
            <button className="payment-button" onClick={handleDownloadReceipt} style={{ marginTop: '1rem' }}>
              <Receipt className="icon" />
              영수증 보기
            </button>
          </div>

          {/* 예약 정보 카드 */}
          <div className="payment-section">
            <h3><Calendar className="icon" /> 예약 정보</h3>
            <div className="booking-summary">
              <div className="summary-item">
                <User className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">멘토</span>
                  <span className="summary-value">{bookingInfo.mentorName || '멘토 정보 없음'}</span>
                </div>
              </div>
              <div className="summary-item">
                <Calendar className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">예약 날짜</span>
                  <span className="summary-value">{bookingInfo.reservationDate || '예약 날짜 미정'}</span>
                </div>
              </div>
              <div className="summary-item">
                <Clock className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">예약 시간</span>
                  <span className="summary-value">{bookingInfo.reservationTime || '예약 시간 미정'}</span>
                </div>
              </div>
              <div className="summary-item">
                <User className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-label">서비스</span>
                  <span className="summary-value">{bookingInfo.ticketName || '멘토링 서비스 미정'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 결제 내역 상세 */}
          <div className="payment-section">
            <h3>💰 결제 내역</h3>
            <div className="price-breakdown">
              <div className="price-item">
                <span>서비스 이용료</span>
                <span>{safeFormatNumber(bookingInfo.originalAmount || paymentData?.amount)}원</span>
              </div>
              {safeNumber(bookingInfo.discountAmount) > 0 && (
                  <div className="price-item discount">
                    <span>🎫 쿠폰 할인</span>
                    <span>-{safeFormatNumber(bookingInfo.discountAmount)}원</span>
                  </div>
              )}
              <div className="price-item total">
                <span>총 결제금액</span>
                <span>{safeFormatNumber(paymentData?.amount)}원</span>
              </div>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="payment-section">
            <h3>📋 안내사항</h3>
            <div className="payment-info">
              <p><strong>채팅방</strong>은 멘토링 시작 시간에 자동으로 생성되며, 알림을 통해 안내드립니다.</p>
              <p><strong>예약 취소</strong>는 멘토링 시작 2시간 전까지 가능하며, 취소 시 전액 환불됩니다.</p>
              <p>멘토링 진행 중 기술적 문제가 발생하면 <strong>문의 하기</strong>로 문의 부탁드립니다.</p>
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div className="payment-section">
            <h3>🚀 다음 단계</h3>
            <div className="booking-summary">
              <div className="summary-item">
                <div className="summary-icon" style={{ 
                  backgroundColor: '#FF8F00',
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>1</div>
                <div className="summary-info">
                  <span className="summary-label">준비하기</span>
                  <span className="summary-value">멘토링 전 질문을 미리 준비해보세요</span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon" style={{ 
                  backgroundColor: '#FF8F00',
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>2</div>
                <div className="summary-info">
                  <span className="summary-label">채팅방 입장</span>
                  <span className="summary-value">멘토링 시작 시간에 채팅방 생성 알림을 받고 입장하세요</span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon" style={{ 
                  backgroundColor: '#FF8F00',
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>3</div>
                <div className="summary-info">
                  <span className="summary-label">리뷰하기</span>
                  <span className="summary-value">멘토링 후 소중한 후기를 남겨주세요</span>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={onHome} className="payment-home-button" style={{ flex: 1 }}>
              <Home className="icon" />
              홈으로 돌아가기
            </button>
            {onPaymentHistory && (
                <button className="payment-secondary-button" onClick={onPaymentHistory} style={{
                  flex: 1
                }}>
                  <Calendar className="icon" />
                  마이 페이지로 가기
                </button>
            )}
          </div>
        </div>

        {/* 영수증 모달 */}
        <ReceiptModal 
          isOpen={showReceipt} 
          onClose={() => setShowReceipt(false)} 
          paymentData={paymentData}
          bookingInfo={bookingInfo}
        />
      </div>
  );
};

export default PaymentComplete;
