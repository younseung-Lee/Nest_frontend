import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import ChickAnimation from '../components/ChickAnimation';
import './BrandStorySection.css';

const BrandStorySection = () => {
  return (
    <section className="brand-story-section">
      <div className="brand-story-container">
        <div className="story-content">
          <ScrollReveal animation="fadeRight">
            <div className="story-text">
              <h2 className="story-title">
                작은 시작, 큰 변화
                <ChickAnimation size="medium" animation="hatch" />
              </h2>
              <div className="story-paragraphs">
                <p>
                  모든 성장은 작은 한 걸음에서 시작됩니다. 마치 병아리가 알을 깨고 나오듯이, 
                  우리는 당신의 잠재력이 세상에 나올 수 있도록 도와드립니다.
                </p>
                <p>
                  경험 많은 멘토들과 함께하는 여정에서, 당신은 예상보다 훨씬 더 큰 성장을 
                  경험하게 될 것입니다. 혼자서는 해결하기 어려웠던 문제들이 명확해지고, 
                  막연했던 목표가 구체적인 계획이 됩니다.
                </p>
                <p>
                  지금까지 수많은 분들이 우리와 함께 꿈을 현실로 만들어왔습니다. 
                  이제 당신의 차례입니다.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
        
        <div className="story-visual">
          <ScrollReveal animation="fadeLeft" delay={300}>
            <div className="visual-content">
              <div className="growth-visualization">
                <div className="growth-step">
                  <span className="step-emoji">🥚</span>
                  <span className="step-label">시작</span>
                </div>
                <div className="growth-arrow">→</div>
                <div className="growth-step">
                  <span className="step-emoji">🐣</span>
                  <span className="step-label">성장</span>
                </div>
                <div className="growth-arrow">→</div>
                <div className="growth-step">
                  <span className="step-emoji">🐥</span>
                  <span className="step-label">완성</span>
                </div>
              </div>
              
              <div className="mission-box">
                <h3>우리의 미션</h3>
                <p>모든 사람이 자신의 잠재력을 최대한 발휘할 수 있도록 돕는 것</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default BrandStorySection;
