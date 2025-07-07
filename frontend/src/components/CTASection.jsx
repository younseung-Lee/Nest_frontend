import React from 'react';
import './CTASection.css';

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-gradient-1"></div>
        <div className="cta-gradient-2"></div>
      </div>
      <div className="cta-content">
        <h2 className="cta-title">지금 시작하세요</h2>
        <p className="cta-description">
          전문가들과의 특별한 만남이 당신의 인생을 바꿀 첫 번째 단계가 될 것입니다
        </p>
      </div>
    </section>
  );
};

export default CTASection;
