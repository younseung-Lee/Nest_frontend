import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import ChickAnimation from '../components/ChickAnimation';
import AnimatedButton from '../components/AnimatedButton';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="about-hero-section">
      <div className="about-hero-container">
        <ScrollReveal animation="fadeUp" delay={200}>
          <div className="about-hero-content">
            <h1 className="about-hero-title">
              성장을 위한 맞춤형 멘토링 플랫폼
              <ChickAnimation size="large" animation="bounce" />
            </h1>
            <p className="about-hero-description">
              당신의 꿈을 현실로 만들어 줄 전문 멘토들과 만나보세요. 
              개인 맞춤형 컨설팅으로 확실한 성장을 경험하실 수 있습니다.
            </p>
            <div className="about-hero-buttons">
              <AnimatedButton 
                variant="primary" 
                size="large"
                onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
              >
                멘토링 시작하기
              </AnimatedButton>
              <AnimatedButton 
                variant="secondary" 
                size="large"
                onClick={() => window.scrollTo({ top: 2000, behavior: 'smooth' })}
              >
                서비스 둘러보기
              </AnimatedButton>
            </div>
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fadeLeft" delay={400}>
          <div className="about-hero-visual">
            <div className="about-hero-illustration">
              <ChickAnimation size="large" animation="hatch" />
              <div className="about-floating-elements">
                <span className="about-floating-emoji">🎯</span>
                <span className="about-floating-emoji">💡</span>
                <span className="about-floating-emoji">🚀</span>
                <span className="about-floating-emoji">⭐</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HeroSection;
