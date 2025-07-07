import React from 'react';
import { Rocket, Star, Target, Users } from 'lucide-react';
import './IntroHeroSection.css';

const IntroHeroSection = () => {
  return (
    <section className="intro-hero-section">
      <div className="introduction-container">
        <div className="intro-hero-content">
          <div className="intro-hero-text">
            <h1 className="intro-hero-title">
              <span className="intro-title-gradient">Nest.dev</span>와 함께하는
              <br />성장의 여정
            </h1>
            <p className="intro-hero-description">
              전문 개발자들이 모여 만든 멘토링 플랫폼에서
              <br />당신의 꿈을 현실로 만들어보세요.
              <br />개인 맞춤형 멘토링으로 확실한 성장을 경험하실 수 있습니다.
            </p>
            <div className="intro-hero-stats">
              <div className="intro-stat-item">
                <Users className="intro-stat-icon" />
                <div className="intro-stat-content">
                  <span className="intro-stat-number">1,000+</span>
                  <span className="intro-stat-label">활성 멘토</span>
                </div>
              </div>
              <div className="intro-stat-item">
                <Star className="intro-stat-icon" />
                <div className="intro-stat-content">
                  <span className="intro-stat-number">4.9</span>
                  <span className="intro-stat-label">평균 별점</span>
                </div>
              </div>
              <div className="intro-stat-item">
                <Target className="intro-stat-icon" />
                <div className="intro-stat-content">
                  <span className="intro-stat-number">95%</span>
                  <span className="intro-stat-label">목표 달성율</span>
                </div>
              </div>
            </div>
          </div>
          <div className="intro-hero-visual">
            <div className="intro-hero-illustration">
              <Rocket className="intro-rocket-icon" />
              <div className="intro-floating-elements">
                <span className="intro-floating-emoji">💡</span>
                <span className="intro-floating-emoji">🚀</span>
                <span className="intro-floating-emoji">⭐</span>
                <span className="intro-floating-emoji">🎯</span>
                <span className="intro-floating-emoji">📈</span>
                <span className="intro-floating-emoji">💻</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroHeroSection;
