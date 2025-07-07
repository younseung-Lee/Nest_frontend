import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import TestimonialCarousel from '../components/TestimonialCarousel';
import './SuccessStories.css';

const SuccessStories = () => {
  const testimonials = [
    {
      content: "멘토링을 통해 단 3개월 만에 원하던 회사에 취업할 수 있었어요. 체계적인 면접 준비와 실무 스킬 향상이 큰 도움이 되었습니다.",
      author: "김민지",
      role: "프론트엔드 개발자",
      rating: 5
    },
    {
      content: "창업에 대한 막연한 꿈만 있었는데, 멘토님의 실질적인 조언 덕분에 실제로 사업을 시작할 수 있었습니다. 지금은 매출도 꾸준히 늘고 있어요!",
      author: "박준혁",
      role: "스타트업 CEO",
      rating: 5
    },
    {
      content: "경력 전환이 두려웠는데, 멘토링을 통해 체계적으로 준비하여 성공적으로 새로운 분야로 이직했습니다. 정말 감사합니다.",
      author: "이서연",
      role: "UX 디자이너",
      rating: 5
    },
    {
      content: "투자에 대해 아무것도 몰랐는데, 멘토님 덕분에 안전하고 효율적인 투자 포트폴리오를 구성할 수 있었어요. 수익률도 만족스럽습니다.",
      author: "최대용",
      role: "직장인 투자자",
      rating: 5
    }
  ];

  return (
    <section className="success-stories-section">
      <div className="success-stories-container">
        <ScrollReveal animation="fadeUp">
          <div className="section-header">
            <h2 className="section-title">
              성공 스토리
            </h2>
            <p className="section-description">
              실제 멘토링을 통해 성장한 분들의 이야기를 들어보세요
            </p>
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fadeUp" delay={200}>
          <TestimonialCarousel 
            testimonials={testimonials}
            autoPlay={true}
            interval={5000}
          />
        </ScrollReveal>
        
        <ScrollReveal animation="fadeUp" delay={400}>
          <div className="success-stats">
            <div className="success-stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">목표 달성률</span>
            </div>
            <div className="success-stat">
              <span className="stat-number">4.9/5</span>
              <span className="stat-label">평균 만족도</span>
            </div>
            <div className="success-stat">
              <span className="stat-number">85%</span>
              <span className="stat-label">재이용률</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default SuccessStories;
