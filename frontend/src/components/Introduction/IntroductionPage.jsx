import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import IntroHeroSection from './sections/IntroHeroSection';
import IntroCompanySection from './sections/IntroCompanySection';
import IntroTeamSection from './sections/IntroTeamSection';
import IntroMissionSection from './sections/IntroMissionSection';
import IntroHistorySection from './sections/IntroHistorySection';
import './IntroductionPage.css';

const IntroductionPage = () => {
  const introNavigator = useNavigate();

  const handleIntroBackToHome = () => {
    introNavigator('/');
  };

  return (
    <div className="introduction-page">
      {/* 독립적인 네비게이션 바 */}
      <div className="introduction-navigation-bar">
        <button 
          className="introduction-back-button"
          onClick={handleIntroBackToHome}
        >
          <ArrowLeft className="introduction-back-icon" />
          홈으로 돌아가기
        </button>
        <div className="introduction-nav-title">
          <Home className="introduction-home-icon" />
          Nest.dev 소개
        </div>
      </div>
      
      {/* 소개 페이지 콘텐츠 */}
      <div className="introduction-content">
        <IntroHeroSection />
        <IntroCompanySection />
        <IntroMissionSection />
        <IntroTeamSection />
        <IntroHistorySection />
      </div>
    </div>
  );
};

export default IntroductionPage;
