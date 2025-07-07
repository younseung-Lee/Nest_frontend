import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import FeatureCard from '../components/FeatureCard';
import './ServiceFeatures.css';

const ServiceFeatures = () => {
  const features = [
    {
      icon: '🎯',
      title: '맞춤형 매칭',
      description: '당신의 목표와 현재 상황을 분석하여 최적의 멘토를 추천해드립니다.'
    },
    {
      icon: '💬',
      title: '실시간 소통',
      description: '언제든지 멘토와 실시간으로 소통하며 즉시 피드백을 받을 수 있습니다.'
    },
    {
      icon: '📈',
      title: '성장 추적',
      description: '체계적인 성장 과정을 추적하고 목표 달성까지의 진행률을 확인하세요.'
    },
    {
      icon: '🔒',
      title: '안전한 환경',
      description: '검증된 멘토들과 안전하고 신뢰할 수 있는 멘토링 환경을 제공합니다.'
    },
    {
      icon: '⚡',
      title: '빠른 시작',
      description: '복잡한 과정 없이 간단한 몇 단계만으로 멘토링을 시작할 수 있습니다.'
    },
    {
      icon: '🎓',
      title: '전문성',
      description: '다양한 분야의 전문가들이 실무 경험을 바탕으로 멘토링을 진행합니다.'
    }
  ];

  return (
    <section className="service-features-section">
      <div className="features-container">
        <ScrollReveal animation="fadeUp">
          <div className="section-header">
            <h2 className="section-title">
              왜 우리 플랫폼을 선택해야 할까요?
            </h2>
            <p className="section-description">
              전문적이고 체계적인 멘토링 서비스의 핵심 기능들을 만나보세요
            </p>
          </div>
        </ScrollReveal>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <ScrollReveal 
              key={index}
              animation="fadeUp"
              delay={index * 100}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 100}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceFeatures;
