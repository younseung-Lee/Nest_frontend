import React, {useCallback, useEffect, useState} from 'react';
import { ArrowLeft, CreditCard, Calendar, Clock, User, Shield, CheckCircle, Gift, X } from 'lucide-react';
import './Payment.css';
import { ticketAPI, userCouponAPI, userAPI, reservationAPI } from "../services/api";

const Payment = ({ bookingData, onBack, onTossPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState('tosspay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponFetchError, setCouponFetchError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await userAPI.getUser();
        const userData = response.data.data || response.data;
        setUserInfo(userData);
        console.log('✅ 사용자 정보 로드 완료:', userData);
      } catch (error) {
        console.error('❌ 사용자 정보 로드 실패:', error);
        // 기본값 설정하지 않고 null로 유지
        setUserInfo(null);
      }
    };

    fetchUserInfo();
  }, []);

  // 쿠폰 정보 가져오기
  useEffect(() => {
    const fetchedCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const response = await userCouponAPI.getUserCoupons();
        
        // Backend에서 페이징 응답을 받음
        const couponsData = response.data.data; // PagingResponse의 data 필드
        
        // UserCouponResponseDto를 Frontend 쿠폰 객체로 변환
        const transformedCoupons = couponsData.content.map(userCoupon => {
          // 유효기간 포맷팅
          const validTo = new Date(userCoupon.validTo);
          const formattedExpiryDate = validTo.toLocaleDateString('ko-KR');
          
          return {
            id: userCoupon.couponId,
            name: userCoupon.couponName,
            type: 'fixed', // 현재 Backend에서는 고정 할인만 지원
            discount: userCoupon.discountAmount,
            description: `${userCoupon.discountAmount.toLocaleString()}원 할인 쿠폰`,
            minAmount: 0, // Backend에서 최소 주문금액 정보가 없어서 0으로 설정
            expiryDate: formattedExpiryDate,
            maxDiscount: null, // 고정 할인이므로 null
            useStatus: userCoupon.useStatus,
            validFrom: userCoupon.validFrom,
            validTo: userCoupon.validTo
          };
        });
        
        // 사용 가능한 쿠폰만 필터링 (UNUSED 상태 + 유효기간 내)
        const now = new Date();
        const availableCoupons = transformedCoupons.filter(coupon => {
          const isUnused = coupon.useStatus === 'UNUSED';
          const isValid = new Date(coupon.validFrom) <= now && now <= new Date(coupon.validTo);
          return isUnused && isValid;
        });
        
        setAvailableCoupons(availableCoupons);
        console.log('✅ 사용자 쿠폰 조회 성공:', availableCoupons);
      } catch (error) {
        console.error('❌ 사용자 쿠폰을 불러오는 데 실패했습니다:', error);
        setCouponFetchError(error);
        
        // 에러 발생 시 기존 티켓 API로 폴백 (임시)
        try {
          const fallbackResponse = await ticketAPI.getTickets();
          const transformedTickets = fallbackResponse.data.map(ticket => ({
            id: ticket.id,
            name: ticket.name,
            type: 'fixed',
            discount: ticket.price || 0,
            description: ticket.description,
            minAmount: 0,
            expiryDate: '2024-12-31',
            useStatus: 'UNUSED'
          }));
          setAvailableCoupons(transformedTickets);
          console.log('⚠️ 폴백으로 티켓 데이터 사용:', transformedTickets);
        } catch (fallbackError) {
          console.error('❌ 폴백 티켓 API도 실패:', fallbackError);
        }
      } finally {
        setLoadingCoupons(false);
      }
    };

    fetchedCoupons();
  }, []);

  // 가격 정보 (Booking에서 전달받은 실제 티켓 가격 사용)
  const servicePrice = bookingData?.servicePrice || bookingData?.ticket?.price || 0;
  const serviceName = bookingData?.serviceName || bookingData?.ticket?.duration || 
                     bookingData?.ticket?.name || '선택된 서비스';

  // 쿠폰 할인 계산
  const calculateCouponDiscount = () => {
    if (!selectedCoupon) return 0;

    if (selectedCoupon.type === 'fixed') {
      return selectedCoupon.discount;
    } else {
      const percentDiscount = Math.round(servicePrice * (selectedCoupon.discount / 100));
      return selectedCoupon.maxDiscount ?
        Math.min(percentDiscount, selectedCoupon.maxDiscount) :
        percentDiscount;
    }
  };

  const couponDiscount = calculateCouponDiscount();
  const totalPrice = servicePrice - couponDiscount;

  // 사용 가능한 쿠폰 필터링 (최소 주문 금액 조건 + 사용 가능 상태 + 유효기간)
  const getUsableCoupons = () => {
    const now = new Date();
    return availableCoupons.filter(coupon => {
      const meetsMinAmount = servicePrice >= coupon.minAmount;
      const isUnused = coupon.useStatus === 'UNUSED';
      const isValid = coupon.validFrom && coupon.validTo ? 
        new Date(coupon.validFrom) <= now && now <= new Date(coupon.validTo) : true;
      
      return meetsMinAmount && isUnused && isValid;
    });
  };

  const handleCouponSelect = (coupon) => {
    setSelectedCoupon(coupon);
    setIsCouponModalOpen(false);
  };

  const handleCouponRemove = () => {
    setSelectedCoupon(null);
  };

  const deleteReservation = useCallback(async () => {
    if (!bookingData.reservationId) return;
    try {
      await reservationAPI.cancelReservation(bookingData.reservationId);
    } catch (error) {
      console.error('❌ 예약 삭제 실패:', error);
    }
  }, [bookingData.reservationId]);

  const handleBack = async () => {
    try {
      // 확인 다이얼로그 표시
      const confirmed = window.confirm('결제를 취소하고 예약 선택으로 돌아가시겠습니까? 현재 예약이 취소됩니다.');
      
      if (confirmed) {
        // 예약 삭제 API 호출

        console.log('🗑️ 예약 삭제 시작:');
        await deleteReservation();
        
        // 부모 컴포넌트의 onBack 호출
        onBack();
      }
    } catch (error) {
      console.error('❌ 예약 삭제 실패:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  // 🚨 브라우저 뒤로가기 및 페이지 이탈 감지 로직
  useEffect(() => {
    // 사용자가 페이지를 벗어나려 할 때 실행될 함수
    const handleBeforeUnload = async (event) => {
      if (!isProcessing && bookingData.reservationId) {
        await deleteReservation();

        const confirmationMessage = '결제를 취소하고 페이지를 떠나시겠습니까? 현재 예약이 삭제됩니다.';
        event.returnValue = confirmationMessage; // 표준
        return confirmationMessage; // 일부 브라우저 호환성
      }
    };

    // 브라우저 뒤로가기/URL 변경을 감지하기 위한 popstate 이벤트 리스너
    // history.pushState로 변경된 URL 이동에는 직접적으로 반응하지 않을 수 있습니다.
    // 하지만 브라우저의 '뒤로/앞으로' 버튼에는 반응합니다.
    const handlePopstate = async () => {
      if (!isProcessing && bookingData.reservationId) {
        await deleteReservation();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopstate); // 브라우저 뒤로가기/앞으로가기 버튼

    // 컴포넌트 언마운트 시 클린업 함수
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [isProcessing, deleteReservation]);

  const handleTossPayment = () => {
    console.log('🚀 토스 결제 버튼 클릭됨');
    
    // 🔍 현재 bookingData 상태 확인
    console.log('🔍 [디버깅] Payment.js의 bookingData:', {
      bookingData,
      hasReservationId: !!(bookingData?.reservationId),
      hasReservationObject: !!(bookingData?.reservation?.id),
      hasTicketId: !!(bookingData?.ticketId),
      hasTicketObject: !!(bookingData?.ticket?.id),
      servicePrice,
      totalPrice,
      selectedCoupon,
      couponDiscount
    });
    
    // 🔍 onTossPayment prop 확인
    console.log('🔍 [디버깅] onTossPayment prop 상태:', {
      onTossPaymentExists: !!onTossPayment,
      onTossPaymentType: typeof onTossPayment
    });
    
    // 필수 데이터 검증
    if (!bookingData?.reservationId && !bookingData?.reservation?.id) {
      console.error('❌ reservationId 누락:', bookingData);
      alert('예약 정보가 없습니다. 다시 예약해주세요.');
      return;
    }
    
    if (!bookingData?.ticketId && !bookingData?.ticket?.id) {
      console.error('❌ ticketId 누락:', bookingData);
      alert('티켓 정보가 없습니다. 다시 선택해주세요.');
      return;
    }
    
    console.log('✅ 필수 데이터 검증 통과');
    
    // 토스 결제에 필요한 데이터 준비
    const tossPaymentData = {
      // 🔥 기존 예약 데이터 유지
      ...bookingData,
      
      // 🔥 필수 ID 명시적 전달
      reservationId: bookingData.reservationId || bookingData.reservation?.id,
      ticketId: bookingData.ticketId || bookingData.ticket?.id,
      
      // 🔥 결제 금액 정보 (할인된 최종 금액 전달)
      servicePrice: totalPrice,   // 할인된 최종 금액 (백엔드 결제 진행용)
      originalPrice: servicePrice, // 원가 (표시용)
      finalPrice: totalPrice,     // 최종 금액 (할인 후) - 표시용
      serviceName,
      selectedCoupon,
      couponDiscount,
      customer: {
        name: userInfo?.name || bookingData?.mentor?.name || '',
        email: userInfo?.email || '',
        phone: userInfo?.phone || ''
      }
    };

    console.log('💳 토스 결제 데이터 (Payment.js → App.js):', tossPaymentData);
    console.log('🔍 필수 데이터 최종 확인:', {
      reservationId: tossPaymentData.reservationId,
      ticketId: tossPaymentData.ticketId,
      servicePrice: tossPaymentData.servicePrice,
      finalPrice: tossPaymentData.finalPrice,
      customerInfo: tossPaymentData.customer
    });
    
    if (onTossPayment) {
      console.log('🎯 onTossPayment 호출 - App.js로 데이터 전달');
      
      // 🔥 isProcessing 상태를 설정해서 버튼 비활성화
      setIsProcessing(true);
      
      try {
        onTossPayment(tossPaymentData);
        console.log('✅ onTossPayment 호출 완료');
      } catch (error) {
        console.error('❌ onTossPayment 호출 중 오류:', error);
        setIsProcessing(false);
      }
    } else {
      console.error('❌ onTossPayment prop이 없습니다!');
      alert('결제 시스템 연결에 문제가 있습니다. 페이지를 새로고침해주세요.');
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button className="payment-back-button" onClick={handleBack}>
          <ArrowLeft className="icon" />
        </button>
        <h1>결제하기</h1>
      </div>

      <div className="payment-content">
        {/* 예약 정보 확인 */}
        <div className="payment-section">
          <h3><CheckCircle className="icon" /> 예약 정보 확인</h3>
          <div className="payment-booking-summary">
            <div className="payment-summary-item">
              <User className="payment-summary-icon" />
              <div className="payment-summary-info">
                <span className="payment-summary-label">멘토</span>
                <span className="payment-summary-value">{bookingData?.mentor?.name || '선택된 멘토'}</span>
              </div>
            </div>

            <div className="payment-summary-item">
              <Calendar className="payment-summary-icon" />
              <div className="payment-summary-info">
                <span className="payment-summary-label">날짜</span>
                <span className="payment-summary-value">{bookingData?.date}</span>
              </div>
            </div>

            <div className="payment-summary-item">
              <Clock className="payment-summary-icon" />
              <div className="payment-summary-info">
                <span className="payment-summary-label">시간</span>
                <span className="payment-summary-value">
                  {bookingData?.startTime} - {bookingData?.endTime}
                </span>
              </div>
            </div>

            <div className="payment-summary-item">
              <Clock className="payment-summary-icon" />
              <div className="payment-summary-info">
                <span className="payment-summary-label">서비스</span>
                <span className="payment-summary-value">{serviceName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="payment-section">
          <h3>결제 금액</h3>
          <div className="payment-price-breakdown">
            <div className="payment-price-item">
              <span>서비스 이용료</span>
              <span>{servicePrice.toLocaleString()}원</span>
            </div>
            {couponDiscount > 0 && (
              <div className="payment-price-item discount">
                <span>쿠폰 할인</span>
                <span>-{couponDiscount.toLocaleString()}원</span>
              </div>
            )}
            <div className="payment-price-item total">
              <span>총 결제금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 쿠폰 선택 */}
        <div className="payment-section">
          <h3><Gift className="icon" /> 쿠폰 사용</h3>
          <div className="payment-coupon-section">
            {selectedCoupon ? (
              <div className="payment-coupon-selected">
                <div className="payment-coupon-info">
                  <div className="payment-coupon-name">{selectedCoupon.name}</div>
                  <div className="payment-coupon-discount">
                    {selectedCoupon.type === 'fixed'
                      ? `${selectedCoupon.discount.toLocaleString()}원 할인`
                      : `${selectedCoupon.discount}% 할인 (최대 ${selectedCoupon.maxDiscount?.toLocaleString() || '무제한'}원)`
                    }
                  </div>
                </div>
                <button className="payment-coupon-remove-btn" onClick={handleCouponRemove}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                className="payment-coupon-select-btn"
                onClick={() => setIsCouponModalOpen(true)}
              >
                <Gift className="payment-coupon-icon" />
                사용 가능한 쿠폰 선택하기
              </button>
            )}
          </div>
        </div>

        {/* 결제 방법 선택 */}
        <div className="payment-section">
          <h3><CreditCard className="icon" /> 결제 방법</h3>
          <div className="payment-methods">
            <div className="payment-method selected">
              <div className="payment-toss-logo">
                <div className="payment-toss-circle"></div>
                <span className="payment-toss-text">toss</span>
              </div>
              <span>토스페이</span>
            </div>
          </div>
          <div className="payment-info">
            <p>🔒 토스페이로 안전하고 간편하게 결제하세요</p>
            <p>• 카드, 계좌이체, 휴대폰 결제 모두 가능</p>
            <p>• 별도 앱 설치 없이 바로 결제</p>
          </div>
        </div>

        {/* 토스 결제하기 버튼 */}
        <button
          className={`payment-button ${isProcessing ? 'processing' : ''}`}
          onClick={handleTossPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="spinner"></div>
              결제 진행중...
            </>
          ) : (
            `🚀 ${totalPrice.toLocaleString()}원 토스 결제하기`
          )}
        </button>
      </div>

      {/* 쿠폰 선택 모달 */}
      {isCouponModalOpen && (
        <div className="payment-modal-overlay" onClick={() => setIsCouponModalOpen(false)}>
          <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>사용 가능한 쿠폰</h3>
              <button
                className="payment-modal-close"
                onClick={() => setIsCouponModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="payment-modal-body">
              {getUsableCoupons().length > 0 ? (
                <div className="payment-coupon-list">
                  {getUsableCoupons().map(coupon => (
                    <div
                      key={coupon.id}
                      className="payment-coupon-item"
                      onClick={() => handleCouponSelect(coupon)}
                    >
                      <div className="payment-coupon-content">
                        <div className="payment-coupon-header">
                          <span className="payment-coupon-name">{coupon.name}</span>
                          <span className="payment-coupon-value">
                            {coupon.type === 'fixed'
                              ? `${coupon.discount.toLocaleString()}원`
                              : `${coupon.discount}%`
                            }
                          </span>
                        </div>
                        <div className="payment-coupon-description">{coupon.description}</div>
                        <div className="payment-coupon-details">
                          <span>최소 주문금액: {coupon.minAmount.toLocaleString()}원</span>
                          <span>만료일: {coupon.expiryDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="payment-no-coupons">
                  <Gift size={48} className="payment-no-coupon-icon" />
                  <p>사용 가능한 쿠폰이 없습니다.</p>
                  <p className="payment-no-coupon-desc">
                    현재 주문 금액({servicePrice.toLocaleString()}원)으로는<br />
                    사용할 수 있는 쿠폰이 없어요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
