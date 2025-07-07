import React from 'react';
import { CheckCircle, Calendar, Clock, User, CreditCard, Home, Receipt, Download } from 'lucide-react';
import './PaymentSuccess.css';

const PaymentSuccess = ({ paymentResult, onHome }) => {
  // 🐛 디버깅: PaymentSuccess에서 받은 데이터 확인
  React.useEffect(() => {
    console.group('🔍 PaymentSuccess 컴포넌트 데이터 확인');
    console.log('전체 paymentResult:', paymentResult);
    console.log('paymentResult.booking:', paymentResult?.booking);
    console.log('paymentResult.reservationId:', paymentResult?.reservationId);
    console.log('paymentResult.ticketId:', paymentResult?.ticketId);
    
    if (paymentResult?.booking) {
      console.log('멘토 이름:', paymentResult.booking.mentor?.name);
      console.log('멘토 전문분야:', paymentResult.booking.mentor?.title);
      console.log('예약 날짜:', paymentResult.booking.date);
      console.log('시작 시간:', paymentResult.booking.startTime);
      console.log('종료 시간:', paymentResult.booking.endTime);
      console.log('서비스명:', paymentResult.booking.service);
      console.log('소요시간:', paymentResult.booking.duration);
      console.log('진행방식:', paymentResult.booking.meetingType);
    } else {
      console.warn('❌ booking 데이터가 없습니다!');
    }
    console.groupEnd();
  }, [paymentResult]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = () => {
    // 실제로는 영수증 다운로드 API 호출
    alert('영수증을 다운로드합니다.');
  };

  return (
    <div className="payment-success-container">
      <div className="payment-success-content">
        {/* 성공 아이콘 및 메시지 */}
        <div className="payment-success-header">
          <div className="success-icon">
            <CheckCircle size={80} />
          </div>
          <h1 className="success-title">결제가 완료되었습니다!</h1>
          <p className="success-subtitle">멘토링 예약이 성공적으로 완료되었습니다.</p>
        </div>

        {/* 결제 정보 카드 */}
        <div className="info-card payment-info-card">
          <div className="card-header">
            <CreditCard className="header-icon" />
            <h3>결제 정보</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">주문번호</span>
                <span className="value">{paymentResult.orderId}</span>
              </div>
              <div className="info-item">
                <span className="label">결제금액</span>
                <span className="value amount">{paymentResult.amount.toLocaleString()}원</span>
              </div>
              <div className="info-item">
                <span className="label">결제방법</span>
                <span className="value">{paymentResult.method}</span>
              </div>
              <div className="info-item">
                <span className="label">결제일시</span>
                <span className="value">{formatDate(paymentResult.approvedAt)}</span>
              </div>
            </div>
            <button className="receipt-button" onClick={handleDownloadReceipt}>
              <Receipt className="button-icon" />
              영수증 다운로드
            </button>
          </div>
        </div>

        {/* 예약 정보 카드 */}
        <div className="info-card booking-info-card">
          <div className="card-header">
            <Calendar className="header-icon" />
            <h3>예약 정보</h3>
          </div>
          <div className="card-content">
            <div className="mentor-info">
              <div className="mentor-avatar">
                {paymentResult?.booking?.mentor?.name?.charAt(0) || '?'}
              </div>
              <div className="mentor-details">
                <span className="mentor-name">
                  {paymentResult?.booking?.mentor?.name || '멘토 정보 로딩 중...'}
                </span>
                <span className="mentor-title">
                  {paymentResult?.booking?.mentor?.title || '전문 멘토'}
                </span>
              </div>
            </div>
            <div className="booking-details">
              <div className="detail-item">
                <Calendar className="detail-icon" />
                <span>
                  {paymentResult?.booking?.date ? 
                    paymentResult.booking.date : 
                    '날짜 정보 로딩 중...'
                  }
                </span>
              </div>
              <div className="detail-item">
                <Clock className="detail-icon" />
                <span>
                  {paymentResult?.booking?.startTime && paymentResult?.booking?.endTime ? 
                    `${paymentResult.booking.startTime} - ${paymentResult.booking.endTime}` : 
                    '시간 정보 로딩 중...'
                  }
                </span>
              </div>
              <div className="detail-item">
                <User className="detail-icon" />
                <span>
                  {paymentResult?.booking?.service || '서비스 정보 로딩 중...'}
                </span>
              </div>
              {paymentResult?.booking?.duration && (
                <div className="detail-item">
                  <Clock className="detail-icon" />
                  <span>소요시간: {paymentResult.booking.duration}분</span>
                </div>
              )}
              {paymentResult?.booking?.meetingType && (
                <div className="detail-item">
                  <User className="detail-icon" />
                  <span>진행방식: {paymentResult.booking.meetingType}</span>
                </div>
              )}
              {paymentResult?.reservationId && (
                <div className="detail-item">
                  <Receipt className="detail-icon" />
                  <span>예약번호: {paymentResult.reservationId}</span>
                </div>
              )}
              {paymentResult?.ticketId && (
                <div className="detail-item">
                  <Receipt className="detail-icon" />
                  <span>티켓번호: {paymentResult.ticketId}</span>
                </div>
              )}
              
              {/* 🐛 디버깅용: 데이터가 없을 때 표시 */}
              {!paymentResult?.booking && (
                <div className="detail-item" style={{color: 'red'}}>
                  <User className="detail-icon" />
                  <span>⚠️ 예약 데이터를 불러올 수 없습니다</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 결제 내역 상세 */}
        <div className="info-card price-detail-card">
          <div className="card-header">
            <h3>💰 결제 내역</h3>
          </div>
          <div className="card-content">
            <div className="price-breakdown">
              <div className="price-item">
                <span>서비스 이용료</span>
                <span>{paymentResult.servicePrice.toLocaleString()}원</span>
              </div>
              <div className="price-item">
                <span>플랫폼 수수료</span>
                <span>{paymentResult.platformFee.toLocaleString()}원</span>
              </div>
              {paymentResult.couponDiscount > 0 && (
                <div className="price-item discount">
                  <span>쿠폰 할인 ({paymentResult.selectedCoupon?.name})</span>
                  <span>-{paymentResult.couponDiscount.toLocaleString()}원</span>
                </div>
              )}
              <div className="price-divider"></div>
              <div className="price-item total">
                <span>총 결제금액</span>
                <span>{paymentResult.amount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="info-card notice-card">
          <div className="card-header">
            <h3>📋 안내사항</h3>
          </div>
          <div className="card-content">
            <ul className="notice-list">
              <li>
                <strong>화상회의 링크</strong>는 멘토링 시작 10분 전에 이메일과 SMS로 발송됩니다.
              </li>
              <li>
                <strong>예약 취소</strong>는 멘토링 시작 2시간 전까지 가능하며, 취소 시 전액 환불됩니다.
              </li>
              <li>
                멘토링 진행 중 기술적 문제가 발생하면 <strong>고객센터 1588-1234</strong>로 연락주세요.
              </li>
              <li>
                멘토링 완료 후 <strong>리뷰 작성</strong>하시면 다음 멘토링에서 사용할 수 있는 쿠폰을 드립니다.
              </li>
            </ul>
          </div>
        </div>

        {/* 다음 단계 안내 */}
        <div className="next-steps">
          <h3>🚀 다음 단계</h3>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>준비하기</h4>
                <p>멘토링 전 질문을 미리 준비해보세요</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>참여하기</h4>
                <p>시간에 맞춰 화상회의에 참여하세요</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>리뷰하기</h4>
                <p>멘토링 후 소중한 후기를 남겨주세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button onClick={onHome} className="home-button">
            <Home className="button-icon" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;