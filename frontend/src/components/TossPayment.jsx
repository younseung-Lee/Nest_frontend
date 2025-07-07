import React, {useEffect, useState, useCallback} from "react";
import './Payment.css'; // 기존 CSS 스타일 사용
import './TossPayment.css'; // 토스 전용 CSS 추가
import TossPaymentSuccess from './TossPaymentSuccess';
import TossPaymentFail from './TossPaymentFail';
import { userInfoUtils } from '../utils/tokenUtils'; // 사용자 정보 유틸 추가
import { paymentAPI, reservationAPI } from '../services/api';
import {useNavigate} from "react-router-dom";
import {navigate} from "jsdom/lib/jsdom/living/window/navigation.js"; // API 서비스 추가

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Payment.css의 스타일 클래스를 사용하므로 인라인 스타일 제거

function TossPaymentComponent({
  bookingData,
  onBack,
  onTossSuccess,
  onTossFail,
  onHome
}) {
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ❌ 하드코딩 제거: bookingData 없으면 에러 처리
  const [amount, setAmount] = useState(0);
  const [orderName, setOrderName] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    name: "",
    phone: "",
  });

  // 초기 검증: bookingData 필수
  useEffect(() => {
    if (!bookingData) {
      alert("예약 정보가 없습니다. 다시 시도해주세요.");
      onBack();
      return;
    }

    // 필수 필드 검증
    if (!bookingData.servicePrice && !bookingData.totalPrice) {
      alert("결제 금액 정보가 없습니다. 다시 예약해주세요.");
      onBack();
      return;
    }

    if (!bookingData.serviceName && !bookingData.orderName) {
      alert("상품 정보가 없습니다. 다시 예약해주세요.");
      onBack();
      return;
    }

  }, [bookingData, onBack]);

  // SDK 로드
  useEffect(() => {
    const loadTossPayments = () => {
      return new Promise((resolve, reject) => {
        if (window.TossPayments) {
          resolve(window.TossPayments);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://js.tosspayments.com/v2/standard";
        script.onload = () => resolve(window.TossPayments);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadTossPayments()
    .then(TossPayments => {
      const clientKey = "test_ck_DpexMgkW3679zj5XY0PJVGbR5ozO";
      const instance = TossPayments(clientKey);
      const paymentInstance = instance.payment({
        customerKey: generateCustomerKey(),
      });
      setPayment(paymentInstance);
    })
    .catch(() => {
      alert("결제 시스템 로드 실패. 새로고침해주세요.");
    });
  }, []);

  // 🔥 사용자 정보 API 조회 함수 추가
  const fetchUserInfo = async () => {
    try {
      const tokenFromStorage = localStorage?.getItem("accessToken") || sessionStorage?.getItem("accessToken");
      if (!tokenFromStorage) {
        return null;
      }

      const response = await fetch(`${BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenFromStorage}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 API에서 가져온 사용자 정보:', userData);
        return userData;
      } else {
        console.warn('⚠️ 사용자 정보 API 조회 실패:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 사용자 정보 API 조회 에러:', error);
      return null;
    }
  };

  // bookingData가 변경되면 폼 데이터 업데이트
  // bookingData가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    const initializeCustomerInfo = async () => {
      if (bookingData) {

        // ✅ 할인된 최종 금액 사용 (Payment.jsx에서 전달된 servicePrice는 이미 할인 적용됨)
        const dbAmount = bookingData.servicePrice || bookingData.finalPrice || bookingData.totalPrice;
        const dbOrderName = bookingData.serviceName || bookingData.orderName;

        if (!dbAmount) {
          alert('결제 금액 정보가 없습니다. 다시 예약해주세요.');
          onBack();
          return;
        }

        if (!dbOrderName) {
          alert('상품 정보가 없습니다. 다시 예약해주세요.');
          onBack();
          return;
        }

        setAmount(dbAmount);
        setOrderName(dbOrderName);

        // 🔥 현재 로그인한 사용자 정보에서 고객 정보 가져오기
        const currentUser = userInfoUtils.getUserInfo();
        console.log('🔍 현재 로그인한 사용자 정보 (토큰):', currentUser);

        // 🔥 API를 통해 더 정확한 사용자 정보 조회
        const apiUserInfo = await fetchUserInfo();
        console.log('🔍 API에서 가져온 사용자 정보:', apiUserInfo);

        // API 정보를 우선 사용, 없으면 토큰 정보 사용
        const userInfo = apiUserInfo || currentUser;

        // 🔍 사용자 정보 구조 상세 확인
        console.group('🔍 사용자 정보 구조 분석');
        console.log('userInfo 전체:', userInfo);
        console.log('userInfo 키들:', userInfo ? Object.keys(userInfo) : []);
        console.log('userInfo.name:', userInfo?.name);
        console.log('userInfo.username:', userInfo?.username);
        console.log('userInfo.nickname:', userInfo?.nickname);
        console.log('userInfo.phone:', userInfo?.phone);
        console.log('userInfo.phoneNumber:', userInfo?.phoneNumber);
        console.log('userInfo.tel:', userInfo?.tel);
        console.log('userInfo.mobile:', userInfo?.mobile);
        console.log('userInfo.data?.phone:', userInfo?.data?.phone);
        console.log('userInfo.data?.name:', userInfo?.data?.name);
        console.log('userInfo.data 키들:', userInfo?.data ? Object.keys(userInfo.data) : []);
        
        // 모든 필드에서 phone 관련 키 찾기
        const phoneFields = [];
        const nameFields = [];
        if (userInfo) {
          Object.keys(userInfo).forEach(key => {
            if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel') || key.toLowerCase().includes('mobile')) {
              phoneFields.push({key, value: userInfo[key]});
            }
            if (key.toLowerCase().includes('name')) {
              nameFields.push({key, value: userInfo[key]});
            }
          });
          
          if (userInfo.data && typeof userInfo.data === 'object') {
            Object.keys(userInfo.data).forEach(key => {
              if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel') || key.toLowerCase().includes('mobile')) {
                phoneFields.push({key: `data.${key}`, value: userInfo.data[key]});
              }
              if (key.toLowerCase().includes('name')) {
                nameFields.push({key: `data.${key}`, value: userInfo.data[key]});
              }
            });
          }
        }
        
        console.log('📞 발견된 전화번호 관련 필드들:', phoneFields);
        console.log('👤 발견된 이름 관련 필드들:', nameFields);
        console.groupEnd();

        // 전화번호를 더 포괄적으로 찾기
        let userPhone = "";
        if (userInfo) {
          // 1차: 직접 필드에서 찾기
          const directFields = ['phone', 'phoneNumber', 'tel', 'mobile', 'cellPhone', 'mobilePhone'];
          for (const field of directFields) {
            if (userInfo[field]) {
              userPhone = userInfo[field];
              console.log(`📞 전화번호 발견 (직접 필드 ${field}):`, userPhone);
              break;
            }
          }
          
          // 2차: data 객체에서 찾기
          if (!userPhone && userInfo.data) {
            for (const field of directFields) {
              if (userInfo.data[field]) {
                userPhone = userInfo.data[field];
                console.log(`📞 전화번호 발견 (data.${field}):`, userPhone);
                break;
              }
            }
          }
          
          // 3차: 모든 키를 순회하면서 phone 관련 키 찾기
          if (!userPhone) {
            const allKeys = Object.keys(userInfo);
            for (const key of allKeys) {
              if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel') || key.toLowerCase().includes('mobile')) {
                if (userInfo[key]) {
                  userPhone = userInfo[key];
                  console.log(`📞 전화번호 발견 (동적 키 ${key}):`, userPhone);
                  break;
                }
              }
            }
          }
          
          // 4차: data 객체의 모든 키 순회
          if (!userPhone && userInfo.data) {
            const dataKeys = Object.keys(userInfo.data);
            for (const key of dataKeys) {
              if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel') || key.toLowerCase().includes('mobile')) {
                if (userInfo.data[key]) {
                  userPhone = userInfo.data[key];
                  console.log(`📞 전화번호 발견 (동적 data.${key}):`, userPhone);
                  break;
                }
              }
            }
          }
        }
        
        // 5차: bookingData에서 찾기
        if (!userPhone && bookingData?.customer?.phone) {
          userPhone = bookingData.customer.phone;
          console.log(`📞 전화번호 발견 (bookingData.customer.phone):`, userPhone);
        }
        
        // 이름도 동일하게 포괄적으로 찾기
        let userName = "";
        if (userInfo) {
          const nameFields = ['name', 'realName', 'fullName', 'displayName'];
          for (const field of nameFields) {
            if (userInfo[field]) {
              userName = userInfo[field];
              console.log(`👤 이름 발견 (직접 필드 ${field}):`, userName);
              break;
            }
          }
          
          if (!userName && userInfo.data) {
            for (const field of nameFields) {
              if (userInfo.data[field]) {
                userName = userInfo.data[field];
                console.log(`👤 이름 발견 (data.${field}):`, userName);
                break;
              }
            }
          }
          
          // 마지막 후보로 username 사용
          if (!userName && userInfo.username) {
            userName = userInfo.username;
            console.log(`👤 이름 발견 (username):`, userName);
          }
        }
        
        if (!userName && bookingData?.customer?.name) {
          userName = bookingData.customer.name;
          console.log(`👤 이름 발견 (bookingData.customer.name):`, userName);
        }

        const formattedPhone = formatPhoneNumber(userPhone);

        // 이메일도 포괄적으로 찾기
        let userEmail = "";
        if (userInfo) {
          userEmail = userInfo.email || userInfo.data?.email || userInfo.emailAddress || userInfo.data?.emailAddress || "";
        }
        if (!userEmail && bookingData?.customer?.email) {
          userEmail = bookingData.customer.email;
        }

        setCustomerInfo({
          email: userEmail,
          name: userName,
          phone: formattedPhone,
        });

        // 디버깅용 로그
        console.log('📞 최종 설정된 고객 정보:', {
          email: userEmail,
          name: userName,
          phone: formattedPhone,
          originalPhone: userPhone
        });
      }
    };

    initializeCustomerInfo();
  }, [bookingData, onBack]);

  // 전화번호 포맷팅 함수 (표시용)
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    // 숫자만 추출
    const numbers = phone.replace(/[^0-9]/g, '');
    
    // 포맷팅 (010-1234-5678)
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
  };

  const generateCustomerKey = () => "customer_" + Math.random().toString(
      36).slice(2, 11);

  const generateOrderId = () => "ORDER_" + Date.now() + "_"
      + Math.random().toString(36).slice(2, 7);

  const requestPayment = async () => {
    if (!payment) {
      return alert("결제 시스템 준비 중입니다.");
    }

    // ❌ 하드코딩 방지: 모든 값이 DB에서 와야 함
    if (!amount || amount <= 0) {
      alert("결제 금액이 올바르지 않습니다. 다시 예약해주세요.");
      return;
    }

    if (!orderName || orderName.trim() === "") {
      alert("상품명이 없습니다. 다시 예약해주세요.");
      return;
    }

    if (!customerInfo.email || !customerInfo.name || !customerInfo.phone) {
      console.error('❌ 고객 정보 누락:', {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        userInfo,
        apiUserInfo
      });
      return alert("회원 정보가 불완전합니다. 마이페이지에서 이름, 이메일, 전화번호를 등록해주세요.");
    }

    // 전화번호 기본 검증 (숫자만 추출해서 확인)
    const cleanPhone = customerInfo.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return alert("계정에 등록된 전화번호가 올바르지 않습니다. 마이페이지에서 수정해주세요.");
    }

    setIsLoading(true);

    try {
      const orderId = generateOrderId();

      // ❌ 하드코딩 방지: 필수 데이터 검증
      if (!bookingData?.reservationId && !bookingData?.reservation?.id) {
        throw new Error("예약 정보가 없습니다. 다시 예약해주세요.");
      }

      if (!bookingData?.ticketId && !bookingData?.ticket?.id) {
        throw new Error("티켓 정보가 없습니다. 다시 선택해주세요.");
      }

      const reservationId = bookingData.reservationId
          || bookingData.reservation?.id;
      const ticketId = bookingData.ticketId || bookingData.ticket?.id;

      // 🔥 1. 먼저 결제 준비 API 호출 (api.js 사용)
      try {
        const prepareData = await paymentAPI.preparePayment({
          reservationId: Number(reservationId),
          ticketId: Number(ticketId),
          amount: Number(amount), // 이미 할인된 최종 금액
          couponId: bookingData?.selectedCoupon?.id ? Number(
              bookingData.selectedCoupon.id) : null
        });

        console.log('결제 준비 성공:', prepareData);
      } catch (error) {
        console.error('결제 준비 실패:', error);
        
        // API 에러 메시지 처리
        const errorMessage = error.response?.data?.message || error.message || "결제 준비 실패";
        throw new Error(errorMessage);
      }

      // 결제 데이터를 sessionStorage에 임시 저장
      const paymentData = {
        orderId,
        amount: Number(amount),
        reservationId: Number(reservationId),
        ticketId: Number(ticketId),
        orderName,
        customerInfo: {
          ...customerInfo,
          phone: cleanPhone // 정리된 전화번호 저장
        },
        // 🔥 전체 bookingData 저장 (예약 정보 포함)
        bookingData: bookingData
      };
      sessionStorage.setItem('tossPaymentData', JSON.stringify(paymentData));

      // 토스페이먼츠에서 요구하는 정확한 URL 형식 사용
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/toss/success`;
      const failUrl = `${baseUrl}/toss/fail`;

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: amount,
        },
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerMobilePhone: cleanPhone, // 숫자만 포함된 전화번호 사용
      });
    } catch (error) {
      if (error.code === "USER_CANCEL") {
        alert("결제가 취소되었습니다.");
      } else {
        alert("결제 요청 오류: " + (error.message || "알 수 없음"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    try {
      // 확인 다이얼로그 표시
      const confirmed = window.confirm('결제를 취소하고 예약 선택으로 돌아가시겠습니까? 현재 예약이 취소됩니다.');

      if (confirmed) {
        // 예약 삭제 API 호출

        console.log('🗑️ 예약 삭제 시작:');
        await deleteReservation();

        // 홈으로 호출
        navigate('/');
      }
    } catch (error) {
      console.error('❌ 예약 삭제 실패:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const deleteReservation = useCallback(async () => {
    // bookingData가 없거나 reservationId가 없으면 아무것도 하지 않음
    if (!bookingData || !bookingData.reservationId) {
      console.warn('🗑️ 예약 삭제 스킵: bookingData 또는 reservationId 없음');
      return;
    }
    try {
      console.log('🗑️ 예약 삭제 시작:', bookingData.reservationId);
      await reservationAPI.cancelReservation(bookingData.reservationId); // reservationAPI 사용
      console.log('✅ 예약 삭제 완료:', bookingData.reservationId);
    } catch (error) {
      console.error('❌ 예약 삭제 실패:', error);
    }
  }, [bookingData]); // bookingData가 변경될 때마다 함수 재생성

  return (
      <div className="payment-container">
        {/* Payment.css 스타일 클래스 사용 */}
        <div className="payment-header">
          <button className="back-button" onClick={handleBack}>
            ← 뒤로가기
          </button>
          <h1>토스 결제</h1>
        </div>

        <div className="payment-content">
          <div className="payment-section">
            <h2 className="toss-payment-title">
              토스 결제
            </h2>
            <form
                className="toss-payment-form"
                onSubmit={e => {
                  e.preventDefault();
                  requestPayment();
                }}
            >
              {/* 예약 정보 표시 (bookingData가 있는 경우) */}
              {bookingData && (
                  <div className="payment-section">
                    <h3>📋 예약 정보</h3>
                    <div className="booking-summary">
                      {bookingData.mentor?.name && (
                          <div className="summary-item">
                            <span className="summary-label">👤 멘토</span>
                            <span
                                className="summary-value">{bookingData.mentor.name}</span>
                          </div>
                      )}
                      {bookingData.date && (
                          <div className="summary-item">
                            <span className="summary-label">📅 날짜</span>
                            <span
                                className="summary-value">{bookingData.date}</span>
                          </div>
                      )}
                      {bookingData.startTime && bookingData.endTime && (
                          <div className="summary-item">
                            <span className="summary-label">⏰ 시간</span>
                            <span
                                className="summary-value">{bookingData.startTime} - {bookingData.endTime}</span>
                          </div>
                      )}
                      {bookingData.selectedCoupon && (
                          <div className="summary-item">
                            <span className="summary-label">🎫 쿠폰</span>
                            <span
                                className="summary-value">{bookingData.selectedCoupon.name} (-{bookingData.couponDiscount?.toLocaleString()}원)</span>
                          </div>
                      )}
                    </div>
                  </div>
              )}

              <div className="payment-section">
                <h3>결제 정보</h3>
                <div className="toss-form-group">
                  <label className="toss-form-label">결제 금액(원)</label>
                  <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      min="100"
                      max="10000000"
                      className="toss-form-input"
                      readOnly // ❌ 하드코딩 방지: DB 값 변경 불가
                  />
                  <div className="toss-input-help">
                    🔒 결제 금액은 예약 시 확정된 금액입니다
                  </div>
                </div>
                <div className="toss-form-group">
                  <label className="toss-form-label">상품명</label>
                  <input
                      type="text"
                      value={orderName}
                      onChange={e => setOrderName(e.target.value)}
                      placeholder="상품명을 입력하세요"
                      className="toss-form-input"
                      readOnly // ❌ 하드코딩 방지: DB 값 변경 불가
                  />
                  <div className="toss-input-help">
                    🔒 상품명은 예약 시 확정된 정보입니다
                  </div>
                </div>
              </div>

              <div className="payment-section">
                <h3>고객 정보</h3>
                <div className="toss-form-group">
                  <label className="toss-form-label">이메일</label>
                  <input
                      type="email"
                      value={customerInfo.email}
                      placeholder="이메일 입력"
                      className="toss-form-input"
                      readOnly
                  />
                  <div className="toss-input-help">
                    🔒 로그인한 계정의 이메일입니다 (수정 불가)
                  </div>
                </div>
                <div className="toss-form-group">
                  <label className="toss-form-label">이름</label>
                  <input
                      type="text"
                      value={customerInfo.name}
                      placeholder="이름 입력"
                      className="toss-form-input"
                      readOnly
                  />
                  <div className="toss-input-help">
                    🔒 로그인한 계정의 이름입니다 (수정 불가)
                  </div>
                </div>
                <div className="toss-form-group">
                  <label className="toss-form-label">전화번호</label>
                  <input
                      type="tel"
                      value={customerInfo.phone}
                      placeholder="010-1234-5678"
                      maxLength="13"
                      className="toss-form-input"
                      readOnly
                  />
                  <div className="toss-input-help">
                    🔒 로그인한 계정의 전화번호입니다 (수정 불가)
                  </div>
                </div>
              </div>

              <button
                  type="submit"
                  disabled={!payment || isLoading}
                  className={`payment-button ${(!payment || isLoading)
                      ? 'processing' : ''}`}
              >
                {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      결제 중...
                    </>
                ) : (
                    "결제하기"
                )}
              </button>
            </form>
            <div className="toss-test-info">
              <div>테스트 환경입니다. 실제 결제가 발생하지 않습니다.</div>
              <div>테스트카드: 4242-4242-4242-4242</div>
            </div>
          </div>
        </div>
      </div>
  );
}

// SPA 라우터 없이 동작 (현재 프로젝트 구조에 맞게)
const TossPaymentApp = ({
  currentTossPage,
  bookingData,
  paymentData,
  onBack,
  onHome,
  onTossSuccess,
  onTossFail
}) => {

  // 🔥🔥🔥 `Payment.jsx`에서 가져온 로직 시작 🔥🔥🔥

  // ⭐ 상태 추가: 결제가 이미 성공적으로 완료되었는지 여부
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // 예약 삭제 함수
  const deleteReservation = useCallback(async () => {
    // bookingData가 없거나 reservationId가 없으면 아무것도 하지 않음
    if (!bookingData || !bookingData.reservationId) {
      console.warn('🗑️ 예약 삭제 스킵: bookingData 또는 reservationId 없음');
      return;
    }
    try {
      console.log('🗑️ 예약 삭제 시작:', bookingData.reservationId);
      await reservationAPI.cancelReservation(bookingData.reservationId); // reservationAPI 사용
      console.log('✅ 예약 삭제 완료:', bookingData.reservationId);
    } catch (error) {
      console.error('❌ 예약 삭제 실패:', error);
    }
  }, [bookingData]); // bookingData가 변경될 때마다 함수 재생성

  // 🚨 브라우저 뒤로가기 및 페이지 이탈 감지 로직
  useEffect(() => {
    // 사용자가 페이지를 벗어나려 할 때 실행될 함수
    const handleBeforeUnload = async (event) => {
      // 결제 성공하지 않은 상태이며, 예약 ID가 있을 때
      if (!isPaymentSuccess && bookingData?.reservationId) {
        // beforeunload는 비동기 작업 완료를 보장하지 않으므로, fire-and-forget 방식으로 호출
        deleteReservation();
      }
    };

    // 브라우저 뒤로가기/앞으로가기 버튼을 눌렀을 때 실행될 함수
    const handlePopstate = async () => {
      // 결제 성공 상태가 아니고, 예약 ID가 있을 때
      if (!isPaymentSuccess && bookingData?.reservationId) {
        console.log('🔙 브라우저 뒤로가기/앞으로가기 감지됨. 예약 삭제 시도:', bookingData.reservationId);
        await deleteReservation(); // popstate에서는 await를 사용하여 완료를 시도해 볼 수 있음.
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopstate);

    // 컴포넌트 언마운트 시 클린업 함수
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [isPaymentSuccess, bookingData, deleteReservation]); // 의존성 배열 업데이트

  // 개발 환경에서만 디버깅 정보 출력
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.group('🔍 TossPaymentApp 디버깅 정보');
      console.log('📄 currentTossPage:', currentTossPage);
      console.log('📦 bookingData:', bookingData);
      console.log('💳 paymentData:', paymentData);
      console.log('🌐 현재 URL:', window.location.href);
      console.log('📋 URL 파라미터:',
          Object.fromEntries(new URLSearchParams(window.location.search)));
      console.groupEnd();
    }
  }, [currentTossPage, bookingData, paymentData]);

  // `onTossSuccess` 및 `onTossFail`에서 `isPaymentSuccess` 상태를 업데이트할 수 있도록 변경
  const handleInternalTossSuccess = (data) => {
    setIsPaymentSuccess(true); // 결제 성공 시 상태 업데이트
    onTossSuccess(data); // 부모 컴포넌트의 콜백 호출
  };

  const handleInternalTossFail = (error) => {
    setIsPaymentSuccess(false); // 혹시 모를 실패 시에도 상태 초기화
    onTossFail(error); // 부모 컴포넌트의 콜백 호출
  };

  if (currentTossPage === "toss-success") {
    return (
        <TossPaymentSuccess
            paymentData={paymentData}
            onHome={onHome}
            onBack={onBack}
            onTossSuccess={handleInternalTossSuccess}
        />
    );
  }

  if (currentTossPage === "toss-fail") {
    return (
        <TossPaymentFail
            onBack={onBack}
            onHome={onHome}
        />
    );
  }

  return (
      <TossPaymentComponent
          bookingData={bookingData}
          onBack={onBack}
          onTossSuccess={handleInternalTossSuccess}
          onTossFail={handleInternalTossFail}
          onHome={onHome}
      />
  );
};

export default TossPaymentApp;
