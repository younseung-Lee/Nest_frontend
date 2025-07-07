import React, {useState, useEffect} from 'react';
import './App.css';
import Header from './components/Header.jsx';
import HeroSection from './components/HeroSection.jsx';
import StatsSection from './components/StatsSection.jsx';
import MentorSection from './components/MentorSection.jsx';
import CTASection from './components/CTASection.jsx';
import Footer from './components/Footer.jsx';
import Login from './components/Login.jsx';
import SocialSignup from './components/SocialSignup.jsx';
import MentorList from './components/MentorList.jsx';
import MentorProfile from './components/MentorProfile.jsx';
import Booking from './components/Booking.jsx';
import Payment from './components/Payment.jsx';
import TossPaymentApp from './components/TossPayment.jsx';
import Success from './components/Success.jsx';
import Fail from './components/Fail.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx';
import PaymentComplete from './components/PaymentComplete.jsx';
import ChatRoom from './components/ChatRoom.jsx';
import MyPage from './components/MyPage.jsx';
import ChatContainer from './components/ChatContainer.jsx';
import NotificationContainer from './components/NotificationContainer.jsx';
import Inquiry from './components/Inquiry.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import AboutPage from './components/About/AboutPage.jsx';
import {authUtils, userInfoUtils} from './utils/tokenUtils';
import {registerDebugFunctions} from './utils/websocketDebug';
import {BrowserRouter, Routes, Route, useNavigate, useParams, useLocation} from 'react-router-dom';
import MentorProfilePage from './components/MentorProfilePage.jsx';
import OAuth2CallbackPage from "./components/OAuth2CallbackPage.jsx";
import Signup from './components/Signup';
import ReviewWrite from './components/ReviewWrite.jsx';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentTossPage, setCurrentTossPage] = useState('toss-payment');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [inquiryTab, setInquiryTab] = useState('inquiries');
  const [appError, setAppError] = useState(null);

  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // 초기화 상태 추가

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 로그인 상태 확인 (Session Storage에서)
        const isLoggedIn = authUtils.isLoggedIn();
        const userData = userInfoUtils.getUserInfo();

        if (isLoggedIn && userData) {
          setIsLoggedIn(true);
          setUserInfo(userData);
          console.log('세션에서 로그인 상태 복원됨:', userData);

          if (userData.userRole === 'GUEST') {
            console.warn('⚠️ App.js: GUEST 사용자 감지! 추가 정보 미입력 상태로 다른 페이지 접근 시도. 강제 로그아웃.');
            authUtils.clearAllAuthData(); // 모든 인증 정보 삭제
            setIsLoggedIn(false);
            setUserInfo(null);
            navigate('/login', { replace: true }); // 로그인 페이지로 리다이렉트
            setIsInitializing(false); // 초기화 중단
            return;
          }

          // 🔍 [2단계] 앱 시작 시 최신 사용자 정보 API 재조회 (프로필 이미지 동기화)
          try {
            const { userAPI } = await import('./services/api');
            const response = await userAPI.getUser();
            
            if (response.data && response.data.data) {
              const latestUserData = response.data.data;
              console.log('🔍 [3단계] 앱 시작 시 최신 사용자 정보:', latestUserData);
              
              // 🖼️ 별도 프로필 이미지 API 호출
              let profileImageUrl = null;
              try {
                const imageResponse = await userAPI.getUserProfileImage(userData.id);
                if (imageResponse.data && imageResponse.data.data && imageResponse.data.data.imgUrl) {
                  profileImageUrl = imageResponse.data.data.imgUrl;
                  console.log('✅ [3단계] 앱 시작 시 프로필 이미지 조회 성공:', profileImageUrl);
                }
              } catch (imageError) {
                console.warn('⚠️ [3단계] 앱 시작 시 프로필 이미지 조회 실패 (기본 이미지 사용):', imageError);
              }
              
              // 세션 데이터와 최신 API 데이터 병합
              const mergedUserData = {
                ...userData,
                profileImage: profileImageUrl,
                imgUrl: profileImageUrl,
                // 다른 최신 정보들도 반영
                nickName: latestUserData.nickName || userData.nickName,
                phoneNumber: latestUserData.phoneNumber || userData.phoneNumber,
              };
              
              console.log('🔄 [3단계] 앱 시작 시 병합된 사용자 정보 (이미지 포함):', mergedUserData);
              setUserInfo(mergedUserData);
              userInfoUtils.setUserInfo(mergedUserData);
            }
          } catch (error) {
            console.warn('⚠️ 앱 시작 시 사용자 정보 재조회 실패 (세션 정보 사용):', error);
          }

          // 🔐 ADMIN 사용자인 경우 즉시 관리자 대시보드로 이동
          if (userData.userRole === 'ADMIN' && location.pathname === '/') {
            console.log('🔐 ADMIN 사용자 감지됨 - 바로 관리자 대시보드로 이동');
            navigate('/admin', { replace: true });
            setIsInitializing(false);
            return; // 다른 로직 실행하지 않음
          }
        }

        // 개발용: 전역 디버깅 함수 추가
        window.checkAuth = () => {
          console.group('🔍 현재 인증 상태');
          console.log('sessionStorage accessToken:',
              sessionStorage.getItem('accessToken') ? '존재' : '없음');
          console.log('sessionStorage userData:',
              sessionStorage.getItem('userData') ? '존재' : '없음');
          console.log('localStorage refreshToken:',
              localStorage.getItem('refreshToken') ? '존재' : '없음');
          console.log('React isLoggedIn 상태:', isLoggedIn);
          console.log('User Role:', userData?.userRole || '없음');
          console.groupEnd();
        };

        console.log('💡 콘솔에서 window.checkAuth() 실행하여 인증 상태 확인 가능');

        // WebSocket 디버깅 함수 등록
        registerDebugFunctions();

        // URL 파라미터 확인 (소셜 로그인 후 리다이렉트 처리)
        const urlParams = new URLSearchParams(window.location.search);
        const needsAdditionalInfo = urlParams.get('additional-info');
        const pageParam = urlParams.get('page');

        // 토스페이먼츠 결제 결과 처리 (경로 기반)
        const currentPath = window.location.pathname;
        const paymentKey = urlParams.get('paymentKey');
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');
        const reservationId = urlParams.get('reservationId');

        // 결제 실패 처리
        const errorCode = urlParams.get('code');
        const errorMessage = urlParams.get('message');

        if (needsAdditionalInfo === 'true') {
          navigate('/social-signup', { replace: true });
        } else if (currentPath === '/toss/success' && paymentKey && orderId && amount) {
          // 토스 결제 성공 - 새로운 플로우 (경로 기반)
          console.log('✅ 토스 결제 성공 (경로):', {paymentKey, orderId, amount, reservationId});
          setCurrentTossPage('toss-success');
        } else if (currentPath === '/toss/fail') {
          // 토스 결제 실패 - 새로운 플로우 (경로 기반)
          console.log('❌ 토스 결제 실패 (경로):', {errorCode, errorMessage});
          setCurrentTossPage('toss-fail');
        } else if (pageParam === 'toss-success' && paymentKey && orderId && amount) {
          // 토스 결제 성공 - 새로운 플로우 (파라미터 기반 - 폴백)
          console.log('✅ 토스 결제 성공 (파라미터):', {paymentKey, orderId, amount, reservationId});
          setCurrentTossPage('toss-success');
          navigate('/toss/success', { replace: true });
        } else if (pageParam === 'toss-fail') {
          // 토스 결제 실패 - 새로운 플로우 (파라미터 기반 - 폴백)
          console.log('❌ 토스 결제 실패 (파라미터):', {errorCode, errorMessage});
          setCurrentTossPage('toss-fail');
          navigate('/toss/fail', { replace: true });
        } else if (paymentKey && orderId && amount && reservationId) {
          // 기존 결제 성공 - 기존 플로우 유지
          console.log('✅ 기존 결제 성공 파라미터:', {paymentKey, orderId, amount, reservationId});
          navigate('/payment/success', { replace: true });
        } else if (errorCode && errorMessage) {
          // 기존 결제 실패 - 기존 플로우 유지
          navigate('/payment/fail', { replace: true });
        }
      } catch (error) {
        console.error('App 초기화 에러:', error);
        setAppError(`애플리케이션 초기화 실패: ${error.message}`);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();

    return () => {
      // cleanup
      delete window.checkAuth;
    };
  }, []);

  // 🔐 userInfo가 변경될 때마다 ADMIN 체크 (로그인 후 즉시 리다이렉트용)
  useEffect(() => {
    console.log('🔍 userInfo useEffect 실행됨:', {
      userInfo: userInfo,
      userRole: userInfo?.userRole,
      currentPath: location.pathname,
      isAdmin: userInfo?.userRole === 'ADMIN'
    });

    if (userInfo && userInfo.userRole === 'ADMIN' && location.pathname === '/') {
      console.log('🔐 userInfo 업데이트 감지 - ADMIN 사용자를 관리자 대시보드로 이동');
      console.log('현재 페이지:', location.pathname, '→ /admin으로 변경');
      navigate('/admin', { replace: true });
    }
  }, [userInfo, location.pathname, navigate]);

  // 로그인 성공 처리
  const handleLoginSuccess = async (userData) => {
    console.log('🎉 handleLoginSuccess 호출됨!');
    console.log('📦 받은 userData:', userData);
    console.log('🔐 사용자 역할:', userData?.userRole);
    console.log('📄 현재 페이지:', location.pathname);

    setIsLoggedIn(true);
    setUserInfo(userData);
    setIsLoginOpen(false);

    console.log('로그인 성공, App 상태 업데이트됨');

    // 🔍 [2단계] 로그인 후 최신 사용자 정보 API 재조회 (프로필 이미지 포함)
    try {
      const { userAPI } = await import('./services/api');
      const response = await userAPI.getUser();
      
      if (response.data && response.data.data) {
        const latestUserData = response.data.data;
        console.log('🔍 [3단계] 로그인 후 최신 사용자 정보:', latestUserData);
        
        // 🖼️ 별도 프로필 이미지 API 호출
        let profileImageUrl = null;
        try {
          const imageResponse = await userAPI.getUserProfileImage(userData.id);
          if (imageResponse.data && imageResponse.data.data && imageResponse.data.data.imgUrl) {
            profileImageUrl = imageResponse.data.data.imgUrl;
            console.log('✅ [3단계] 프로필 이미지 조회 성공:', profileImageUrl);
          }
        } catch (imageError) {
          console.warn('⚠️ [3단계] 프로필 이미지 조회 실패 (기본 이미지 사용):', imageError);
        }
        
        // 기존 로그인 데이터와 최신 API 데이터 병합
        const mergedUserData = {
          ...userData,
          profileImage: profileImageUrl,
          imgUrl: profileImageUrl,
          // 다른 최신 정보들도 반영
          nickName: latestUserData.nickName || userData.nickName,
          phoneNumber: latestUserData.phoneNumber || userData.phoneNumber,
        };
        
        console.log('🔄 [3단계] 병합된 사용자 정보 (이미지 포함):', mergedUserData);
        setUserInfo(mergedUserData);
        userInfoUtils.setUserInfo(mergedUserData);
      }
    } catch (error) {
      console.warn('⚠️ 로그인 후 사용자 정보 재조회 실패 (기본 정보 사용):', error);
    }

    // 관리자 역할인 경우 자동으로 관리자 대시보드로 이동
    if (userData.userRole === 'ADMIN') {
      console.log('🔐 관리자 로그인 감지 - 관리자 대시보드로 이동');
      navigate('/admin');
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    // 백엔드 로그아웃은 Header 컴포넌트에서 처리됨
    // 여기서는 클라이언트 측 상태만 정리
    authUtils.clearAllAuthData();
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate('/');
    console.log('클라이언트 로그아웃 완료 - 모든 토큰과 사용자 정보 삭제됨');
  };

  // 프로필 클릭 시 마이페이지로 이동 (ADMIN 사용자는 관리자 대시보드로)
  const handleProfileClick = () => {
    // ADMIN 사용자인 경우 직접 관리자 대시보드로 이동
    if (userInfo && userInfo.userRole === 'ADMIN') {
      console.log('🔐 프로필 클릭 시 ADMIN 사용자 감지됨 - 관리자 대시보드로 이동');
      navigate('/admin');
    } else {
      navigate('/mypage');
    }
  };

  // 카테고리별 멘토 리스트 페이지로 이동
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    navigate(`/mentors?category=${category}`);
  };

  // 멘토 프로필 페이지로 이동
  const handleMentorSelect = (mentor) => {
    setSelectedMentor(mentor);
    navigate(`/mentor/${mentor.userId}/profile/${mentor.id}`);
  };

  // 홈으로 돌아가기
  const handleBackToHome = () => {
    navigate('/');
  };

  // 멘토 리스트로 돌아가기
  const handleBackToList = () => {
    navigate(`/mentors?category=${selectedCategory}`);
  };

  // 예약 페이지로 이동
  const handleBooking = () => {
    navigate('/booking');
  };

  // 결제 페이지로 이동
  const handlePayment = (data) => {
    setBookingData(data);
    navigate('/payment');
  };

  // 토스 결제 페이지로 이동 (새로 추가)
  const handleTossPayment = (data) => {
    console.log('🎯 App.js handleTossPayment 호출됨');
    console.log('📦 Payment.js에서 받은 데이터:', data);
    console.log('📦 기존 bookingData:', bookingData);

    // Payment.js에서 전달된 데이터를 bookingData로 설정
    const finalBookingData = data || bookingData;
    console.log('📦 최종 bookingData (TossPayment로 전달):', finalBookingData);

    setBookingData(finalBookingData);
    setCurrentTossPage('toss-payment');
    navigate('/toss/payment');

    console.log('🎯 토스 결제 페이지로 이동 완료');
  };

  // 토스 결제 성공 페이지로 이동
  const handleTossSuccess = async (tossPaymentData) => {
    console.log('🎉 토스 결제 성공! PaymentComplete로 이동');
    console.log('💳 토스 승인 완료 데이터:', tossPaymentData);

    // 🔥 예약 ID로 실제 DB에서 예약 정보 조회
    let actualBookingData = null;
    const reservationId = tossPaymentData?.reservationId ||
        tossPaymentData?.originalResponse?.reservationId ||
        tossPaymentData?.originalResponse?.data?.orderId;

    if (reservationId) {
      try {
        console.log('🔍 예약 ID로 실제 예약 정보 조회 중:', reservationId);

        // 동적 import 사용
        const { reservationAPI } = await import('./services/api');
        const reservationResponse = await reservationAPI.getReservation(reservationId);
        actualBookingData = reservationResponse.data;

        console.log('✅ 실제 DB에서 가져온 예약 정보:', actualBookingData);

        // 🔍 실제 DB 데이터 구조 확인
        console.group('🔍 실제 DB 예약 데이터 구조 분석');
        console.log('actualBookingData:', actualBookingData);
        console.log('actualBookingData.mentor:', actualBookingData?.mentor);
        console.log('actualBookingData.date:', actualBookingData?.date);
        console.log('actualBookingData.startTime:', actualBookingData?.startTime);
        console.log('actualBookingData.endTime:', actualBookingData?.endTime);
        console.log('actualBookingData.ticket:', actualBookingData?.ticket);
        console.log('actualBookingData.service:', actualBookingData?.service);
        console.groupEnd();
      } catch (error) {
        console.error('❌ 예약 정보 조회 실패:', error);
        console.warn('⚠️ 예약 정보 조회 실패 - 백업 데이터 사용');
      }
    } else {
      console.warn('⚠️ reservationId가 없어서 예약 정보를 조회할 수 없습니다');
    }
    console.log('📦 현재 bookingData:', bookingData);

    // sessionStorage에서 결제 데이터 복원 (토스 결제 과정에서 저장된 데이터)
    const savedPaymentData = sessionStorage.getItem('tossPaymentData');
    let savedData = null;
    if (savedPaymentData) {
      try {
        savedData = JSON.parse(savedPaymentData);
        console.log('💾 복원된 결제 데이터:', savedData);

        // 🔍 중요: 복원된 데이터 구조 상세 확인
        console.group('🔍 savedData 구조 상세 분석');
        console.log('savedData 전체:', savedData);
        console.log('savedData.bookingData:', savedData?.bookingData);
        if (savedData?.bookingData) {
          console.log('savedData.bookingData.mentor:', savedData.bookingData.mentor);
          console.log('savedData.bookingData.date:', savedData.bookingData.date);
          console.log('savedData.bookingData.startTime:', savedData.bookingData.startTime);
          console.log('savedData.bookingData.endTime:', savedData.bookingData.endTime);
          console.log('savedData.bookingData.serviceName:', savedData.bookingData.serviceName);
          console.log('savedData.bookingData.ticket:', savedData.bookingData.ticket);
        }
        console.groupEnd();
      } catch (e) {
        console.error('저장된 결제 데이터 파싱 실패:', e);
      }
    } else {
      console.warn('⚠️ sessionStorage에 tossPaymentData가 없습니다!');
    }

    // 추가: 현재 App.js에서 가지고 있는 bookingData도 확인
    console.log('📦 App.js bookingData:', bookingData);

    // 추가: 현재 App.js에서 가지고 있는 bookingData도 확인
    console.log('📦 App.js bookingData:', bookingData);

    // 실제 토스 승인 API 응답 데이터 활용
    const originalResponse = tossPaymentData?.originalResponse || {};
    const paymentResponse = originalResponse.payment || originalResponse;
    const apiBookingData = tossPaymentData?.apiBookingData || {};
    const backupBookingData = tossPaymentData?.backupBookingData || null;

    // 🔥 로그에서 확인된 실제 백업 데이터 직접 추출
    const realBackupData = tossPaymentData?.originalBookingData ||
        tossPaymentData?.data?.originalBookingData ||
        tossPaymentData?._debug?.tossPaymentData?.originalBookingData;

    console.log('🔍 토스 승인 API 응답 분석:', {
      originalResponse,
      paymentResponse,
      apiBookingData,
      backupBookingData,
      realBackupData,
      hasPaymentKey: !!tossPaymentData?.paymentKey,
      hasOrderId: !!tossPaymentData?.orderId,
      hasAmount: !!tossPaymentData?.amount
    });

    // 🔍 예약 데이터 소스 확인
    console.group('🔍 예약 데이터 소스 분석');
    console.log('bookingData (App.js):', bookingData);
    console.log('savedData?.bookingData:', savedData?.bookingData);
    console.log('backupBookingData (TossPayment에서 백업):', backupBookingData);
    console.log('API에서 온 예약 데이터:');
    console.log('  - apiBookingData.reservation:', apiBookingData.reservation);
    console.log('  - apiBookingData.booking:', apiBookingData.booking);
    console.log('  - apiBookingData.mentor:', apiBookingData.mentor);
    console.log('  - apiBookingData.ticket:', apiBookingData.ticket);
    console.log('  - realBackupData (로그에서 확인된):', realBackupData);
    console.log('  - originalResponse.reservation:', originalResponse.reservation);
    console.log('  - originalResponse.mentor:', originalResponse.mentor);
    console.groupEnd();

    // 🔥 실제 데이터 우선순위: 1) 실제 DB 데이터, 2) realBackupData, 3) tossPaymentData 백업, 4) 기본값
    const getActualData = (dbField, backupPath, defaultValue) => {
      return actualBookingData?.[dbField] ||
          realBackupData?.[dbField] ||
          tossPaymentData?.originalBookingData?.[dbField] ||
          backupBookingData?.[dbField] ||
          savedData?.bookingData?.[dbField] ||
          bookingData?.[dbField] ||
          defaultValue;
    };

    const getActualMentorData = (field, defaultValue) => {
      return actualBookingData?.mentor?.[field] ||
          realBackupData?.mentor?.[field] ||
          tossPaymentData?.originalBookingData?.mentor?.[field] ||
          backupBookingData?.mentor?.[field] ||
          savedData?.bookingData?.mentor?.[field] ||
          bookingData?.mentor?.[field] ||
          defaultValue;
    };

    const getActualTicketData = (field, defaultValue) => {
      return actualBookingData?.ticket?.[field] ||
          realBackupData?.ticket?.[field] ||
          tossPaymentData?.originalBookingData?.ticket?.[field] ||
          backupBookingData?.ticket?.[field] ||
          savedData?.bookingData?.ticket?.[field] ||
          bookingData?.ticket?.[field] ||
          defaultValue;
    };

    // 토스 결제 데이터를 PaymentComplete 컴포넌트가 기대하는 형태로 변환
    const formattedPaymentData = {
      // 🔥 토스 결제 기본 정보
      orderId: tossPaymentData?.orderId || paymentResponse?.orderId || savedData?.orderId || 'ORDER_UNKNOWN',
      amount: tossPaymentData?.amount || paymentResponse?.totalAmount || paymentResponse?.amount || savedData?.amount || 0,
      paymentKey: tossPaymentData?.paymentKey || paymentResponse?.paymentKey || 'N/A',
      method: tossPaymentData?.method || paymentResponse?.method || '토스페이먼츠',
      approvedAt: tossPaymentData?.approvedAt || paymentResponse?.approvedAt || new Date().toISOString(),
      status: tossPaymentData?.status || paymentResponse?.status || 'DONE',

      // 🔥 PaymentComplete가 data 속성에서 추출하는 예약 정보 (실제 DB 데이터 우선 사용)
      data: {
        mentor: {
          name: getActualMentorData('name', '멘토 정보 없음')
        },
        date: getActualData('date', null, '날짜 미정'),
        startTime: getActualData('startTime', null, '시간 미정'),
        endTime: getActualData('endTime', null, '시간 미정'),
        time: getActualData('startTime', null, null) && getActualData('endTime', null, null) ?
            `${getActualData('startTime', null, '')} - ${getActualData('endTime', null, '')}` :
            '시간 미정',
        service: getActualTicketData('name', null) ||
            getActualData('serviceName', null, null) ||
            getActualData('orderName', null, '멘토링 서비스'),
        serviceName: getActualTicketData('name', null) ||
            getActualData('serviceName', null, null) ||
            getActualData('orderName', null, '멘토링 서비스'),
        ticketName: getActualTicketData('name', null) ||
            getActualData('serviceName', null, null) ||
            getActualData('orderName', null, '멘토링 서비스'),
        orderName: getActualData('orderName', null, null) ||
            getActualTicketData('name', null) ||
            '멘토링 서비스',
        servicePrice: getActualData('servicePrice', null, null) ||
            getActualTicketData('price', null, null) ||
            tossPaymentData?.amount || 0,
        originalAmount: getActualData('servicePrice', null, null) ||
            getActualTicketData('price', null, null) ||
            tossPaymentData?.amount || 0,
        couponDiscount: getActualData('couponDiscount', null, 0),
        discountAmount: getActualData('couponDiscount', null, 0)
      },

      // 🔥 추가 데이터 소스들 (PaymentComplete의 getBookingInfo에서 활용) - 실제 DB 데이터 포함
      originalBookingData: actualBookingData || realBackupData || tossPaymentData?.originalBookingData || savedData?.bookingData,
      apiBookingData: {
        reservation: actualBookingData || realBackupData || tossPaymentData?.originalBookingData,
        booking: actualBookingData || realBackupData || tossPaymentData?.originalBookingData,
        mentor: actualBookingData?.mentor || realBackupData?.mentor || tossPaymentData?.originalBookingData?.mentor,
        ticket: actualBookingData?.ticket || realBackupData?.ticket || tossPaymentData?.originalBookingData?.ticket
      },
      originalResponse: originalResponse,
      paymentResult: {
        booking: {
          mentor: {
            name: getActualMentorData('name', '멘토 정보 없음')
          },
          date: getActualData('date', null, '날짜 미정'),
          startTime: getActualData('startTime', null, '시간 미정'),
          endTime: getActualData('endTime', null, '시간 미정'),
          mentorName: getActualMentorData('name', '멘토 정보 없음')
        }
      },

      // 🔗 추가 정보
      reservationId: tossPaymentData?.reservationId || originalResponse?.reservationId || savedData?.reservationId,
      ticketId: savedData?.ticketId || bookingData?.ticketId,
      customerInfo: tossPaymentData?.customerInfo || savedData?.customerInfo,

      // 🐛 디버깅용 원본 데이터
      _debug: {
        tossPaymentData,
        savedData,
        bookingData,
        originalResponse,
        apiBookingData
      }
    };

    console.log('✅ 최종 변환된 결제 데이터 (PaymentComplete용):', formattedPaymentData);
    console.group('🔍 PaymentComplete 전용 데이터 소스 추적');
    console.log('주문번호:', formattedPaymentData.orderId, '(소스: ' + (tossPaymentData?.orderId ? '토스승인' : savedData?.orderId ? '세션저장' : '기본값') + ')');
    console.log('결제금액:', formattedPaymentData.amount, '(소스: ' + (tossPaymentData?.amount ? '토스승인' : savedData?.amount ? '세션저장' : '기본값') + ')');
    console.log('결제방법:', formattedPaymentData.method);
    console.log('승인시각:', formattedPaymentData.approvedAt);
    console.groupEnd();

    console.group('📋 PaymentComplete 예약 정보 데이터 소스 확인 (실제 DB 데이터 우선)');
    console.log('멘토 이름:', formattedPaymentData.data.mentor.name);
    console.log('  - 실제 DB 데이터 사용 여부:', !!actualBookingData?.mentor?.name);
    console.log('  - realBackupData 사용 여부:', !!realBackupData?.mentor?.name);
    console.log('예약 날짜:', formattedPaymentData.data.date);
    console.log('  - 실제 DB 데이터 사용 여부:', !!actualBookingData?.date);
    console.log('  - realBackupData 사용 여부:', !!realBackupData?.date);
    console.log('예약 시간:', `${formattedPaymentData.data.startTime} - ${formattedPaymentData.data.endTime}`);
    console.log('  - 실제 DB 데이터 사용 여부:', !!actualBookingData?.startTime && !!actualBookingData?.endTime);
    console.log('  - realBackupData 사용 여부:', !!realBackupData?.startTime && !!realBackupData?.endTime);
    console.log('서비스명:', formattedPaymentData.data.service);
    console.log('  - 실제 DB 데이터 사용 여부:', !!actualBookingData?.ticket?.name || !!actualBookingData?.serviceName);
    console.log('  - realBackupData 사용 여부:', !!realBackupData?.ticket?.name || !!realBackupData?.serviceName);
    console.log('예약번호:', formattedPaymentData.reservationId);
    console.log('티켓번호:', formattedPaymentData.ticketId);

    // 실제 DB 데이터 확인
    if (actualBookingData) {
      console.log('✅ 실제 DB 데이터 사용됨:', actualBookingData);
    } else if (realBackupData) {
      console.log('✅ realBackupData 사용됨:', realBackupData);
    } else {
      console.log('⚠️ 실제 DB 데이터 없음 - 다른 백업 데이터 사용');
    }
    console.groupEnd();

    // PaymentComplete 페이지로 이동
    setPaymentResult(formattedPaymentData);
    navigate('/payment/complete');
  };

  // 토스 결제 실패 페이지로 이동
  const handleTossFail = () => {
    setCurrentTossPage('toss-fail');
  };

  // 채팅방으로 이동
  const handleChatRoom = (mentor, chatRoomId = null) => {
    setSelectedMentor(mentor);
    if (chatRoomId) {
      navigate(`/chat/${chatRoomId}`);
    } else {
      navigate('/chat');
    }
  };

  // 결제 완료 페이지로 이동
  const handlePaymentComplete = (result) => {
    setPaymentResult(result);
    navigate('/payment/success');
  };

  // 결제 성공 페이지로 이동
  const handlePaymentSuccess = () => {
    navigate('/payment/success');
  };

  // 결제 실패 페이지로 이동
  const handlePaymentFail = () => {
    navigate('/payment/fail');
  };

  // 예약 페이지로 돌아가기
  const handleBackToBooking = () => {
    navigate('/booking');
  };

  // 결제 페이지로 돌아가기
  const handleBackToPayment = () => {
    navigate('/payment');
  };

  // 멘토 프로필로 돌아가기
  const handleBackToProfile = () => {
    if (selectedMentor) {
      navigate(`/mentor/${selectedMentor.userId}/profile/${selectedMentor.id}`);
    } else {
      navigate(-1); // 이전 페이지로
    }
  };

  // 초기화 중일 때 로딩 화면 표시
  if (isInitializing) {
    return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚡</div>
          <h1 style={{ marginBottom: '16px', fontSize: '24px', color: '#374151' }}>
            MentorConnect 시작 중...
          </h1>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>
            {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
          </style>
        </div>
    );
  }

  // 앱 에러 상태 표시
  if (appError) {
    return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>💥</div>
          <h1 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px' }}>
            애플리케이션 오류
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '500px' }}>
            {appError}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
            >
              페이지 새로고침
            </button>
            <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
            >
              모든 데이터 초기화
            </button>
          </div>
        </div>
    );
  }

  // 문의 페이지로 이동
  const handleInquiry = (tabType = 'inquiries') => {
    setInquiryTab(tabType);
    navigate(`/inquiry?tab=${tabType}`);
  };

  // 관리자 대시보드로 이동
  const handleAdminDashboard = () => {
    if (userInfo?.userRole === 'ADMIN') {
      navigate('/admin');
    }
  };

  // 리뷰 작성 페이지로 이동
  const handleReviewWrite = (mentorId, mentorName, chatRoomId = null, rating = 0) => {
    const params = new URLSearchParams({
      mentorId: mentorId.toString(),
      mentorName: mentorName
    });

    if (chatRoomId) {
      params.append('chatRoomId', chatRoomId.toString());
    }

    if (rating > 0) {
      params.append('rating', rating.toString());
    }

    navigate(`/review/write?${params.toString()}`);
  };

  // URL 기반으로 값 추출을 위한 컴포넌트들
  const MentorListPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category') || 'all';

    return (
        <div className="app">
          <Header
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              onLoginClick={() => setIsLoginOpen(true)}
              onCategorySelect={handleCategorySelect}
              onProfileClick={handleProfileClick}
              onInquiry={handleInquiry}
              isLoggedIn={isLoggedIn}
              userInfo={userInfo}
              onChatRoom={handleChatRoom}
              onLogout={handleLogout}
              onAdminDashboard={handleAdminDashboard}
          />
          <MentorList
              category={category}
              onBack={handleBackToHome}
              onMentorSelect={handleMentorSelect}
          />
          {isLoginOpen && (
            <Login
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
          )}
          <NotificationContainer isLoggedIn={isLoggedIn} />
        </div>
    );
  };

  const InquiryPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab') || 'inquiries';

    return (
        <div className="app">
          <Header
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              onLoginClick={() => setIsLoginOpen(true)}
              onCategorySelect={handleCategorySelect}
              onProfileClick={handleProfileClick}
              onInquiry={handleInquiry}
              isLoggedIn={isLoggedIn}
              userInfo={userInfo}
              onChatRoom={handleChatRoom}
              onLogout={handleLogout}
              onAdminDashboard={handleAdminDashboard}
          />
          <Inquiry
              onBack={handleBackToHome}
              initialTab={tab}
          />
          {isLoginOpen && (
            <Login
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
          )}
          <NotificationContainer isLoggedIn={isLoggedIn} />
        </div>
    );
  };

  const SSEDemoPage = () => (
      <div className="min-h-screen bg-gray-50">
        <SSEExample/>
        <Login
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onLoginSuccess={handleLoginSuccess}
        />
      </div>
  );

  // MentorProfilePage는 이미 URL 파라미터를 처리하므로 직접 사용

  const TossPaymentPage = () => (
      <TossPaymentApp
          currentTossPage={currentTossPage}
          bookingData={bookingData}
          paymentData={paymentData}
          onBack={() => navigate('/payment')}
          onHome={handleBackToHome}
          onTossSuccess={handleTossSuccess}
          onTossFail={handleTossFail}
          onPaymentComplete={handlePaymentComplete}
      />
  );

  // 메인 페이지 렌더링
  return (
      <div className="app">
        {/* Header는 메인 페이지에서만 표시 */}
        {location.pathname === '/' && (
          <Header
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              onLoginClick={() => setIsLoginOpen(true)}
              onCategorySelect={handleCategorySelect}
              onProfileClick={handleProfileClick}
              onInquiry={handleInquiry}
              isLoggedIn={isLoggedIn}
              userInfo={userInfo}
              onChatRoom={handleChatRoom}
              onLogout={handleLogout}
              onAdminDashboard={handleAdminDashboard}
          />
        )}
        <Routes>
          <Route
              path="/"
              element={
                <main className="main-content">
                  <HeroSection />
                  <StatsSection />
                  <MentorSection onMentorSelect={handleMentorSelect} />
                  <CTASection />
                  <Footer />
                </main>
              }
          />
          <Route path="/mentors" element={<MentorListPage />} />
          <Route path="/mentor/:userId/profile/:profileId" element={<MentorProfilePage />} />
          <Route path="/booking" element={<Booking mentor={selectedMentor} onBack={handleBackToProfile} onBooking={handlePayment} />} />
          <Route path="/payment" element={<Payment bookingData={bookingData} onBack={handleBackToBooking} onPaymentComplete={handlePaymentComplete} onTossPayment={handleTossPayment} />} />
          <Route path="/payment/complete" element={<PaymentComplete paymentData={paymentResult} onHome={handleBackToHome} onPaymentHistory={() => navigate('/mypage')} />} />
          <Route path="/payment/success" element={<PaymentSuccess paymentResult={paymentResult} onHome={handleBackToHome} />} />
          <Route path="/payment/fail" element={<Fail onBack={handleBackToPayment} onHome={handleBackToHome} />} />
          <Route path="/toss/payment" element={<TossPaymentPage />} />
          <Route path="/toss/success" element={<TossPaymentPage />} />
          <Route path="/toss/fail" element={<TossPaymentPage />} />
          <Route path="/success" element={<Success paymentData={paymentData} onHome={handleBackToHome} />} />
          <Route path="/fail" element={<Fail onBack={handleBackToPayment} onHome={handleBackToHome} />} />
          <Route path="/chat" element={<ChatContainer onBack={handleBackToHome} isLoggedIn={isLoggedIn} />} />
          <Route path="/chat/:chatRoomId" element={<ChatContainer onBack={handleBackToHome} isLoggedIn={isLoggedIn} />} />
          <Route path="/review/write" element={<ReviewWrite />} />
          <Route path="/mypage/*" element={<MyPage onBack={handleBackToHome} onLogout={handleLogout} />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/admin" element={<AdminDashboard onBack={() => { handleLogout(); }} userInfo={userInfo} />} />
          <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
          <Route path="/social-signup" element={<SocialSignup />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <NotificationContainer isLoggedIn={isLoggedIn} />
      </div>
  );
};

const App = () => {
  return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
  );
};

export default App;
