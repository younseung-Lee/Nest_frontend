import React from 'react';
import { MessageCircle, Coffee } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  const createRippleEffect = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge glass-effect">
          <Coffee className="badge-icon" />
          <span>차세대 멘토링 플랫폼</span>
        </div>
        
        <h1 className="hero-title">
          <span className="gradient-text animated-gradient">
            최고의 전문가들과<br />
            함께 성장하세요
          </span>
        </h1>
        
        <p className="hero-description">
          업계 최고 전문가들과의 1:1 맞춤 멘토링으로<br />
          당신의 커리어를 새로운 차원으로 끌어올리세요
        </p>
        
        <div className="hero-buttons">
          <button 
            className="primary-button"
            onClick={createRippleEffect}
          >
            <MessageCircle className="button-icon" />
            멘토링 시작하기
            <div className="button-shine"></div>
          </button>
          <button className="hero-secondary-button glass-effect">
            더 알아보기
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
