import React, { useState } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import ProgressBar from '../components/ProgressBar';
import ChickAnimation from '../components/ChickAnimation';
import './HowItWorks.css';

const HowItWorks = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    {
      number: 1,
      title: '회원가입 및 프로필 작성',
      description: '간단한 회원가입 후 목표와 현재 상황을 입력해주세요.',
      icon: '📝'
    },
    {
      number: 2,
      title: '멘토 매칭',
      description: 'AI가 분석한 결과를 바탕으로 최적의 멘토를 추천해드립니다.',
      icon: '🤝'
    },
    {
      number: 3,
      title: '멘토링 진행',
      description: '1:1 맞춤형 멘토링을 통해 목표를 향해 나아가세요.',
      icon: '💬'
    },
    {
      number: 4,
      title: '성장 달성',
      description: '체계적인 피드백과 지속적인 관리로 확실한 성장을 경험하세요.',
      icon: '🚀'
    }
  ];

  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        <ScrollReveal animation="fadeUp">
          <div className="section-header">
            <h2 className="section-title">
              멘토링은 어떻게 진행되나요?
              <ChickAnimation size="medium" animation="bounce" />
            </h2>
            <p className="section-description">
              간단한 4단계로 당신의 성장 여정이 시작됩니다
            </p>
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fadeUp" delay={200}>
          <ProgressBar 
            currentStep={currentStep} 
            totalSteps={steps.length} 
            showLabels={true}
          />
        </ScrollReveal>
        
        <div className="steps-container">
          {steps.map((step, index) => (
            <ScrollReveal 
              key={step.number}
              animation="fadeUp"
              delay={300 + index * 150}
            >
              <div 
                className={`step-card ${currentStep === step.number ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.number)}
              >
                <div className="step-number">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
