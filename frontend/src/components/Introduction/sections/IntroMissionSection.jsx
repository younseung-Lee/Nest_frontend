import React from 'react';
import { Heart, Lightbulb, Target, Zap } from 'lucide-react';
import './IntroMissionSection.css';

const IntroMissionSection = () => {
  const introMissionValues = [
    {
      icon: Heart,
      title: '진정성',
      description: '멘토와 멘티 간의 진심 어린 소통을 통해 진정한 성장을 추구합니다.',
      color: '#EF4444'
    },
    {
      icon: Lightbulb,
      title: '혁신',
      description: '최신 기술과 창의적인 아이디어로 멘토링의 새로운 패러다임을 제시합니다.',
      color: '#F59E0B'
    },
    {
      icon: Target,
      title: '목표 지향',
      description: '명확한 목표 설정과 체계적인 로드맵으로 확실한 성과를 만들어냅니다.',
      color: '#10B981'
    },
    {
      icon: Zap,
      title: '성장',
      description: '지속적인 학습과 도전을 통해 개발자로서의 역량을 끊임없이 발전시킵니다.',
      color: '#8B5CF6'
    }
  ];

  return (
    <section className="intro-mission-section">
      <div className="introduction-container">
        <div className="intro-mission-content">
          <div className="intro-mission-text">
            <h2 className="introduction-section-title">
              우리의 미션과 비전
            </h2>
            <p className="introduction-section-subtitle">
              모든 개발자가 자신의 잠재력을 최대한 발휘할 수 있는 
              <br />멘토링 생태계를 만들어 나갑니다
            </p>
            
            <div className="intro-mission-box">
              <h3 className="intro-mission-title">🎯 우리의 미션</h3>
              <p className="intro-mission-description">
                "전 세계 개발자들이 서로의 경험과 지식을 나누며, 
                함께 성장할 수 있는 플랫폼을 제공하여 
                기술 생태계의 발전에 기여한다."
              </p>
            </div>
            
            <div className="intro-vision-box">
              <h3 className="intro-vision-title">🌟 우리의 비전</h3>
              <p className="intro-vision-description">
                "개발자 멘토링의 글로벌 스탠다드가 되어, 
                누구나 쉽게 접근할 수 있는 고품질 멘토링을 통해 
                개발자 커뮤니티의 지속 가능한 성장을 이끈다."
              </p>
            </div>
          </div>
          
          <div className="intro-values-grid">
            <h3 className="intro-values-title">핵심 가치</h3>
            <div className="intro-values-cards">
              {introMissionValues.map((value, index) => (
                <div key={index} className="intro-value-card">
                  <div 
                    className="intro-value-icon-wrapper"
                    style={{ backgroundColor: `${value.color}15` }}
                  >
                    <value.icon 
                      className="intro-value-icon"
                      style={{ color: value.color }}
                    />
                  </div>
                  <h4 className="intro-value-title">{value.title}</h4>
                  <p className="intro-value-description">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroMissionSection;
