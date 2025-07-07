import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import StatCounter from '../components/StatCounter';
import './StatisticsSection.css';

const StatisticsSection = () => {
  const stats = [
    {
      endValue: 1500,
      label: '성공적인 멘토링',
      suffix: '+',
      icon: '🎯',
      delay: 100
    },
    {
      endValue: 95,
      label: '만족도',
      suffix: '%',
      icon: '⭐',
      delay: 200
    },
    {
      endValue: 300,
      label: '전문 멘토',
      suffix: '+',
      icon: '👨‍💼',
      delay: 300
    },
    {
      endValue: 24,
      label: '분야별 전문성',
      suffix: '개',
      icon: '📚',
      delay: 400
    }
  ];

  return (
    <section className="statistics-section">
      <div className="statistics-container">
        <ScrollReveal animation="fadeUp">
          <div className="section-header">
            <h2 className="section-title">
              숫자로 보는 우리의 성과
            </h2>
            <p className="section-description">
              지금까지 많은 분들의 성장을 함께해왔습니다
            </p>
          </div>
        </ScrollReveal>
        
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <ScrollReveal 
              key={index}
              animation="scale"
              delay={stat.delay}
              className={`stagger-${index + 1}`}
            >
              <StatCounter
                endValue={stat.endValue}
                label={stat.label}
                suffix={stat.suffix}
                icon={stat.icon}
                delay={stat.delay}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
