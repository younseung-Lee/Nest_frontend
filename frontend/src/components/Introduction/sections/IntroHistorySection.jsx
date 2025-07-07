import React from 'react';
import { Calendar, Trophy, Users, Zap } from 'lucide-react';
import './IntroHistorySection.css';

const IntroHistorySection = () => {
  const introHistoryMilestones = [
    {
      year: '2019',
      title: 'Nest.dev 설립',
      description: '개발자 멘토링의 새로운 비전을 가지고 창립',
      icon: Zap,
      achievements: ['초기 팀 구성', '플랫폼 개발 시작', '첫 번째 멘토 모집']
    },
    {
      year: '2020',
      title: '정식 서비스 런칭',
      description: '베타 테스트를 거쳐 정식 멘토링 서비스 오픈',
      icon: Calendar,
      achievements: ['100명의 멘토 확보', '1,000건의 멘토링 세션', '사용자 만족도 4.5/5.0']
    },
    {
      year: '2021',
      title: '급속한 성장',
      description: '코로나19로 인한 온라인 교육 수요 급증에 대응',
      icon: Users,
      achievements: ['멘토 500명 돌파', '누적 사용자 10,000명', '기업 파트너십 확대']
    },
    {
      year: '2022',
      title: '글로벌 확장',
      description: '해외 시장 진출 및 다국어 서비스 제공',
      icon: Trophy,
      achievements: ['글로벌 멘토 네트워크 구축', '5개국 서비스 확장', '국제 표준 인증 획득']
    },
    {
      year: '2023',
      title: 'AI 기반 서비스 도입',
      description: '인공지능을 활용한 맞춤형 멘토 매칭 시스템 구축',
      icon: Zap,
      achievements: ['AI 매칭 알고리즘 개발', '멘토링 효과 300% 향상', '업계 혁신상 수상']
    },
    {
      year: '2024',
      title: '플랫폼 고도화',
      description: '차세대 멘토링 플랫폼으로의 진화',
      icon: Trophy,
      achievements: ['멘토 1,000명 돌파', '누적 멘토링 50,000건', '사용자 만족도 4.9/5.0']
    }
  ];

  return (
    <section className="intro-history-section">
      <div className="introduction-container">
        <div className="intro-history-header">
          <h2 className="introduction-section-title">
            함께 걸어온 여정
          </h2>
          <p className="introduction-section-subtitle">
            2019년부터 지금까지, Nest.dev의 성장 스토리와 
            <br />개발자 커뮤니티와 함께 이뤄낸 성과들을 소개합니다
          </p>
        </div>
        
        <div className="intro-history-timeline">
          {introHistoryMilestones.map((milestone, index) => (
            <div key={index} className="intro-history-item">
              <div className="intro-history-year-badge">
                {milestone.year}
              </div>
              
              <div className="intro-history-content">
                <div className="intro-history-icon-wrapper">
                  <milestone.icon className="intro-history-icon" />
                </div>
                
                <div className="intro-history-details">
                  <h3 className="intro-history-title">{milestone.title}</h3>
                  <p className="intro-history-description">{milestone.description}</p>
                  
                  <ul className="intro-history-achievements">
                    {milestone.achievements.map((achievement, achievementIndex) => (
                      <li key={achievementIndex} className="intro-history-achievement">
                        ✨ {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {index < introHistoryMilestones.length - 1 && (
                <div className="intro-history-connector"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="intro-history-future">
          <div className="intro-history-future-content">
            <h3 className="intro-history-future-title">
              🚀 더 큰 미래를 향해
            </h3>
            <p className="intro-history-future-description">
              앞으로도 Nest.dev는 더 많은 개발자들이 성장할 수 있는 
              혁신적인 멘토링 생태계를 만들어 나갈 것입니다.
            </p>
            <div className="intro-history-future-goals">
              <div className="intro-future-goal">
                <span className="intro-future-goal-number">2025</span>
                <span className="intro-future-goal-text">글로벌 TOP 멘토링 플랫폼</span>
              </div>
              <div className="intro-future-goal">
                <span className="intro-future-goal-number">10,000+</span>
                <span className="intro-future-goal-text">전문 멘토 네트워크</span>
              </div>
              <div className="intro-future-goal">
                <span className="intro-future-goal-number">100만+</span>
                <span className="intro-future-goal-text">성장한 개발자들</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroHistorySection;
