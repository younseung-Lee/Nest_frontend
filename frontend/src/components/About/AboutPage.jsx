import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import HeroSection from './sections/HeroSection';
import BrandStorySection from './sections/BrandStorySection';
import ServiceFeatures from './sections/ServiceFeatures';
import HowItWorks from './sections/HowItWorks';
import StatisticsSection from './sections/StatisticsSection';
import SuccessStories from './sections/SuccessStories';
import { authUtils, userInfoUtils } from '../../utils/tokenUtils';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // 로그인 상태 확인
  useEffect(() => {
    const loggedIn = authUtils.isLoggedIn();
    const userData = userInfoUtils.getUserInfo();
    
    setIsLoggedIn(loggedIn);
    setUserInfo(userData);
  }, []);

  // 페이지 로드 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Header에서 사용할 핸들러들 (About 페이지용)
  const handleCategorySelect = (category) => {
    navigate(`/mentors?category=${category}`);
  };

  const handleProfileClick = () => {
    // ADMIN 사용자인 경우 관리자 대시보드로
    if (userInfo && userInfo.userRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/mypage');
    }
  };

  const handleInquiry = (tabType = 'inquiries') => {
    navigate(`/inquiry?tab=${tabType}`);
  };

  const handleChatRoom = (mentor, chatRoomId = null) => {
    if (chatRoomId) {
      navigate(`/chat/${chatRoomId}`);
    } else {
      navigate('/chat');
    }
  };

  const handleLogout = async () => {
    try {
      const { authAPI, accessTokenUtils, refreshTokenUtils } = await import('../../services/api');
      await authAPI.logout();
      accessTokenUtils.removeAccessToken();
      refreshTokenUtils.removeRefreshToken();
      authUtils.clearAllAuthData();
      setIsLoggedIn(false);
      setUserInfo(null);
      navigate('/');
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      // 에러가 발생해도 클라이언트 측 정리는 수행
      authUtils.clearAllAuthData();
      setIsLoggedIn(false);
      setUserInfo(null);
      navigate('/');
    }
  };

  const handleAdminDashboard = () => {
    if (userInfo?.userRole === 'ADMIN') {
      navigate('/admin');
    }
  };

  return (
    <div className="about-page">
      <Header
        onCategorySelect={handleCategorySelect}
        onProfileClick={handleProfileClick}
        onInquiry={handleInquiry}
        onChatRoom={handleChatRoom}
        onLogout={handleLogout}
        onAdminDashboard={handleAdminDashboard}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
      />
      <HeroSection />
      <BrandStorySection />
      <ServiceFeatures />
      <HowItWorks />
      <StatisticsSection />
      <SuccessStories />
    </div>
  );
};

export default AboutPage;
