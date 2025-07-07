import React, {useEffect, useState} from 'react';
import './Payment.css';
import './TossPayment.css';
import { paymentAPI } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 결제 성공 컴포넌트
function TossPaymentSuccess({paymentData, onHome, onBack, onTossSuccess}) {
  const [paymentInfo, setPaymentInfo] = useState({
    paymentKey: "",
    orderId: "",
    amount: "",
    reservationId: "",
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey") || "";
    const orderId = params.get("orderId") || "";
    const amount = params.get("amount") || "";

    // sessionStorage에서 결제 데이터 복원
    const savedPaymentData = sessionStorage.getItem('tossPaymentData');
    let reservationId = "";
    let finalAmount = amount; // URL 파라미터의 amount (할인 전 원가)

    if (savedPaymentData) {
      try {
        const parsedData = JSON.parse(savedPaymentData);
        reservationId = parsedData.reservationId || "";

        // ✅ 중요: sessionStorage에 저장된 할인된 금액을 우선 사용
        if (parsedData.amount) {
          finalAmount = parsedData.amount.toString();
          console.log('🔍 금액 우선순위 - sessionStorage:', parsedData.amount, 'URL 파라미터:', amount);
        }
        
        // URL에서 orderId가 없으면 저장된 데이터 사용
        if (!orderId && parsedData.orderId) {
          setPaymentInfo(prev => ({...prev, orderId: parsedData.orderId}));
        }
      } catch (e) {
        console.error('저장된 결제 데이터 파싱 실패:', e);
      }
    }

    const tokenFromStorage = localStorage?.getItem("accessToken")
        || sessionStorage?.getItem("accessToken");

    setJwtToken(tokenFromStorage || "");
    
    // ✅ finalAmount 사용 (할인된 금액)
    setPaymentInfo({paymentKey, orderId, amount: finalAmount, reservationId});
    
    console.log('📋 최종 결제 정보 설정:', {
      paymentKey,
      orderId, 
      amount: finalAmount,
      reservationId,
      urlAmount: amount,
      savedAmount: savedPaymentData ? JSON.parse(savedPaymentData).amount : 'none'
    });
  }, []);

  // 🚀 자동 승인 처리 - 결제 정보가 준비되면 즉시 실행
  useEffect(() => {
    const autoConfirmPayment = async () => {
      // 필수 정보가 모두 있고, JWT 토큰이 있으면 자동 승인
      if (paymentInfo.paymentKey &&
          paymentInfo.orderId &&
          paymentInfo.amount &&
          jwtToken &&
          !isConfirming &&
          !confirmResult) {

        await handleConfirmPayment();
      }
    };

    autoConfirmPayment();
  }, [paymentInfo, jwtToken, isConfirming, confirmResult]);

  const handleConfirmPayment = async () => {
    if (!paymentInfo.paymentKey || !paymentInfo.orderId
        || !paymentInfo.amount) {
      return alert("결제 정보가 없습니다.");
    }
    if (!jwtToken) {
      return alert("로그인이 필요합니다.");
    }

    setIsConfirming(true);
    setConfirmResult(null);

    try {
      const data = await paymentAPI.confirmPayment({
        paymentKey: paymentInfo.paymentKey,
        orderId: paymentInfo.orderId,
        amount: Number(paymentInfo.amount),
        reservationId: Number(paymentInfo.reservationId),
      });

      if (data) {
        setConfirmResult({success: true, data});

        // 🔥 sessionStorage에서 원본 예약 데이터 백업
        const backupPaymentData = sessionStorage.getItem('tossPaymentData');
        let backupData = null;
        if (backupPaymentData) {
          try {
            backupData = JSON.parse(backupPaymentData);
          } catch (e) {
            console.error('백업 데이터 파싱 실패:', e);
          }
        }

        // 🚀 결제 승인 완료 후 PaymentComplete로 이동
        setTimeout(() => {
          if (onTossSuccess && typeof onTossSuccess === 'function') {
            // 다양한 가능한 데이터 구조 확인
            const paymentData = data.payment || data.data || data;

            // 실제 승인된 결제 정보 전달
            const completePaymentData = {
              // 토스 API에서 직접 온 데이터 - 다양한 필드명 시도
              paymentKey: data.paymentKey || data.payment_key
                  || paymentData.paymentKey || paymentData.payment_key,
              orderId: data.orderId || data.order_id || paymentData.orderId
                  || paymentData.order_id || paymentInfo.orderId,
              amount: data.amount || data.totalAmount || paymentData.amount
                  || paymentData.totalAmount || Number(paymentInfo.amount) || 0,
              method: data.method || paymentData.method || '토스페이먼츠',
              approvedAt: data.approvedAt || data.approved_at
                  || paymentData.approvedAt || paymentData.approved_at
                  || new Date().toISOString(),
              status: data.status || paymentData.status || 'DONE',

              // 🔥 API 응답에서 예약 정보 추출
              reservationId: data.reservationId || data.reservation?.id
                  || Number(paymentInfo.reservationId),

              // 🔥 실제 예약 정보 (API 응답에서 추출) - PaymentComplete가 data.로 접근
              data: {
                mentor: data.mentor || data.reservation?.mentor
                    || backupData?.bookingData?.mentor,
                reservation: data.reservation || data.reservationInfo,
                ticket: data.ticket || data.ticketInfo,
                reservationDate: data.reservation?.date || data.reservationDate
                    || backupData?.bookingData?.date,
                reservationTime: data.reservation?.time || data.reservationTime
                    ||
                    (backupData?.bookingData?.startTime
                    && backupData?.bookingData?.endTime ?
                        `${backupData.bookingData.startTime} - ${backupData.bookingData.endTime}`
                        : null),
                ticketName: data.ticket?.name || data.ticketName
                    || backupData?.bookingData?.serviceName
                    || backupData?.bookingData?.orderName,
                originalAmount: data.originalAmount || data.baseAmount
                    || backupData?.bookingData?.servicePrice,
                discountAmount: data.discountAmount || data.couponDiscount
                    || backupData?.bookingData?.couponDiscount || 0
              },

              // 🔥 실제 예약 정보 (API 응답에서 추출) - 원본 구조도 유지
              apiBookingData: {
                reservation: data.reservation,
                booking: data.booking,
                mentor: data.mentor,
                ticket: data.ticket,
                reservationInfo: data.reservationInfo
              },

              // 🔥 원본 예약 데이터 (sessionStorage에서 복원)
              originalBookingData: backupData?.bookingData,

              // 원본 응답 데이터도 함께 전달
              originalResponse: data,

              // 고객 정보 (세션에서 복원)
              customerInfo: backupData?.customerInfo || {}
            };

            // 🔥 데이터 전달 후 sessionStorage 정리
            sessionStorage.removeItem('tossPaymentData');

            onTossSuccess(completePaymentData);
          } else {
            // onTossSuccess가 없으면 직접 페이지 이동 또는 다른 처리
            if (onHome && typeof onHome === 'function') {
              onHome(); // 홈으로 이동
            } else {
              // 최후의 수단: 페이지 새로고침 또는 특정 URL로 이동
              window.location.href = '/'; // 또는 원하는 페이지 경로
            }
          }
        }, 1500); // 1.5초 후 이동 (사용자가 완료 메시지를 볼 수 있도록)
      } else {
        throw new Error("결제 승인 실패");
      }
    } catch (error) {
      console.error('결제 승인 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || "결제 승인 실패";
      setConfirmResult({success: false, error: errorMessage});
      
      if (errorMessage.includes("인증") || error.response?.status === 401) {
        localStorage?.removeItem("accessToken");
        sessionStorage?.removeItem("accessToken");
        setJwtToken("");
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
      <div className="payment-container">
        <div className="payment-header">
          <button className="back-button" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1>결제 성공</h1>
        </div>

        <div className="payment-content">
          <div className="payment-section">
            <div className="toss-success-content">
              <div className="payment-status-icon payment-status-success">
                <svg
                    width={34}
                    height={34}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38d39f"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <polyline points="20 6 10 18 4 12"/>
                </svg>
              </div>
              <h2 className="toss-success-title">
                결제 성공
              </h2>
              <div className="toss-success-desc">
                결제가 정상적으로 완료되었습니다.
              </div>
            </div>
            {/* 자동 승인 처리 상태 표시 */}
            {isConfirming && (
                <div className="payment-button processing">
                  <div className="spinner"></div>
                  승인 처리 중...
                </div>
            )}
            {confirmResult && (
                <div className="toss-confirm-result">
                  {confirmResult.success ? (
                      <>
                        <div>✅ 승인이 완료되었습니다!</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#666',
                          marginTop: '8px'
                        }}>
                          잠시 후 결제 완료 페이지로 이동합니다...
                        </div>
                      </>
                  ) : (
                      "❌ 승인이 실패하였습니다."
                  )}
                </div>
            )}
            {/* 승인 실패 시에만 버튼 표시 */}
            {confirmResult && !confirmResult.success && (
                <div className="toss-action-buttons">
                  <button
                      onClick={onHome}
                      className="toss-action-button"
                  >
                    홈으로
                  </button>
                  <span className="toss-action-divider">|</span>
                  <button
                      onClick={onBack}
                      className="toss-action-button"
                  >
                    다시 시도
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default TossPaymentSuccess;
