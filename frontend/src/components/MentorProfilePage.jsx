import MentorProfile from '../components/MentorProfile';
import Booking from '../components/Booking';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profileAPI } from "../services/api";
import Payment from "../components/Payment";
import TossPaymentApp from '../components/TossPayment';
import PaymentComplete from '../components/PaymentComplete';

const MentorProfilePage = () => {
  const { userId, profileId } = useParams();
  console.log("url params:", userId, profileId);

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [paymentMode, setPaymentMode] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [tossPaymentMode, setTossPaymentMode] = useState(false);
  const [paymentCompleteMode, setPaymentCompleteMode] = useState(false);

  const handleBookingClick = ({ mentor }) => {
    setSelectedMentor(mentor);
    setBookingMode(true);
  };

  // 멘토 데이터 로드
  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await profileAPI.getMentorDetail(userId, profileId);
        console.log("🧩 mentor data:", res);
        console.log("🔍 [멘토상세] 응답 데이터 구조:", res.data);
        console.log("🔍 [멘토상세] data.data 확인:", res.data.data);
        console.log("🔍 [멘토상세] imgUrl 필드 확인:", res.data.data?.imgUrl);
        setMentor(res.data);
      } catch (error) {
        console.error('멘토 정보 가져오기 실패:', error);
        setError('멘토 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (userId && profileId) {
      fetchMentorData();
    }
  }, [userId, profileId]);

  // 페이지 상태 초기화 함수들
  const resetToMentorProfile = () => {
    setBookingMode(false);
    setPaymentMode(false);
    setTossPaymentMode(false);
    setPaymentCompleteMode(false);
    setSelectedMentor(null);
    setPaymentData(null);
  };

  const handleBackFromBooking = () => {
    setBookingMode(false);
    setSelectedMentor(null);
  };

  const handleBookingComplete = (bookingData) => {
    console.log('예약 완료 데이터:', bookingData);
    setPaymentData(bookingData);
    setBookingMode(false);
    setPaymentMode(true);
  };

  const handleBackFromPayment = () => {
    setPaymentMode(false);
    setBookingMode(true);
  };

  const handleTossPayment = (data) => {
    console.log("📦 MentorProfilePage: onTossPayment 호출됨", data);
    setPaymentData(data);
    setPaymentMode(false);
    setTossPaymentMode(true);
  };

  const handleBackFromTossPayment = () => {
    setTossPaymentMode(false);
    setPaymentMode(true);
  };

  const handleTossSuccess = () => {
    console.log("✅ 결제 성공");
    setTossPaymentMode(false);
    setPaymentCompleteMode(true);
  };

  const handleTossFail = () => {
    console.log("❌ 결제 실패");
    // 결제 실패 시 결제 페이지로 돌아가기
    setTossPaymentMode(false);
    setPaymentMode(true);
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handlePaymentHistory = () => {
    console.log("📅 내 예약 보기 클릭됨");
    // 이후 기능 구현
  };

  // 로딩 상태
  if (loading) {
    return <div>로딩 중...</div>;
  }

  // 에러 상태
  if (error) {
    return (
        <div>
          <p>{error}</p>
          <button onClick={() => window.history.back()}>뒤로 가기</button>
        </div>
    );
  }

  // 멘토 데이터가 없는 경우
  if (!mentor) {
    return (
        <div>
          <p>멘토 정보를 찾을 수 없습니다.</p>
          <button onClick={() => window.history.back()}>뒤로 가기</button>
        </div>
    );
  }

  // 컴포넌트 렌더링
  if (paymentCompleteMode) {
    return (
        <PaymentComplete
            onHome={handleGoHome}
            onPaymentHistory={handlePaymentHistory}
        />
    );
  }

  if (tossPaymentMode) {
    return (
        <TossPaymentApp
            currentTossPage={new URLSearchParams(window.location.search).get("currentTossPage") || "toss"}
            bookingData={paymentData}
            onBack={handleBackFromTossPayment}
            onTossSuccess={handleTossSuccess}
            onTossFail={handleTossFail}
            onHome={handleGoHome}
        />
    );
  }

  if (paymentMode) {
    return (
        <Payment
            bookingData={paymentData}
            onBack={handleBackFromPayment}
            onTossPayment={handleTossPayment}
        />
    );
  }

  if (bookingMode) {
    return (
        <Booking
            mentor={selectedMentor}
            onBack={handleBackFromBooking}
            onCancel={handleBackFromBooking}
            onBooking={handleBookingComplete}
        />
    );
  }

  // 기본 멘토 프로필 페이지
  return (
      <MentorProfile
          mentor={mentor.data || mentor} // API 응답 구조에 따라 유연하게 처리
          onBack={() => window.history.back()}
          onBooking={() => handleBookingClick({ mentor: mentor.data || mentor })}
      />
  );
};

export default MentorProfilePage;