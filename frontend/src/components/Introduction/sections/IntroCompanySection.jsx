import React from 'react';
import { Building2, Globe, Shield, Award } from 'lucide-react';
import './IntroCompanySection.css';

const IntroCompanySection = () => {
  const introCompanyFeatures = [
    {
      icon: Building2,
      title: '전문적인 플랫폼',
      description: '개발자들을 위한 맞춤형 멘토링 플랫폼으로, 실무 경험이 풍부한 전문가들이 직접 멘토링을 제공합니다.',
      color: 'var(--introduction-primary)'
    },
    {
      icon: Globe,
      title: '글로벌 네트워크',
      description: '전 세계 다양한 기업에서 활동하는 개발자들과 연결되어 글로벌한 시각과 최신 기술 트렌드를 배울 수 있습니다.',
      color: 'var(--introduction-success)'
    },
    {
      icon: Shield,
      title: '안전한 환경',
      description: '검증된 멘토들과 체계적인 관리 시스템을 통해 안전하고 신뢰할 수 있는 멘토링 환경을 제공합니다.',
      color: 'var(--introduction-warning)'
    },
    {
      icon: Award,
      title: '검증된 품질',
      description: '엄격한 심사를 거친 멘토들과 지속적인 품질 관리를 통해 높은 수준의 멘토링 품질을 보장합니다.',
      color: 'var(--introduction-secondary)'
    }
  ];

  return (
    <section className="intro-company-section">
      <div className="introduction-container">
        <div className="intro-company-header">
          <h2 className="introduction-section-title">
            Nest.dev가 특별한 이유
          </h2>
          <p className="introduction-section-subtitle">
            개발자를 위한, 개발자에 의한 멘토링 플랫폼
            <br />왜 수많은 개발자들이 Nest.dev를 선택하는지 알아보세요
          </p>
        </div>
        
        <div className="intro-company-grid">
          {introCompanyFeatures.map((feature, index) => (
            <div key={index} className="intro-company-card">
              <div 
                className="intro-company-icon-wrapper"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon 
                  className="intro-company-icon"
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="intro-company-card-title">{feature.title}</h3>
              <p className="intro-company-card-description">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="intro-company-stats-section">
          <div className="intro-company-stats-grid">
            <div className="intro-company-stat">
              <span className="intro-company-stat-number">5년+</span>
              <span className="intro-company-stat-label">서비스 운영</span>
            </div>
            <div className="intro-company-stat">
              <span className="intro-company-stat-number">50,000+</span>
              <span className="intro-company-stat-label">성공적인 멘토링</span>
            </div>
            <div className="intro-company-stat">
              <span className="intro-company-stat-number">200+</span>
              <span className="intro-company-stat-label">파트너 기업</span>
            </div>
            <div className="intro-company-stat">
              <span className="intro-company-stat-number">98%</span>
              <span className="intro-company-stat-label">만족도</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroCompanySection;
