import React from 'react';
import { Users, Code, Briefcase, Award } from 'lucide-react';
import './IntroTeamSection.css';

const IntroTeamSection = () => {
  const introTeamMembers = [
    {
      name: '김개발',
      role: 'CEO & 풀스택 개발자',
      experience: '15년+ 개발 경험',
      speciality: 'React, Node.js, AI/ML',
      description: 'FAANG 기업 출신으로 스타트업부터 대기업까지 다양한 경험을 보유한 시니어 개발자입니다.',
      icon: Code,
      color: 'var(--introduction-primary)'
    },
    {
      name: '박멘토',
      role: 'CTO & 백엔드 전문가',
      experience: '12년+ 시스템 설계',
      speciality: 'MSA, Kubernetes, DevOps',
      description: '대규모 시스템 아키텍처 설계와 DevOps 분야의 전문가로 다수의 기업 컨설팅 경험이 있습니다.',
      icon: Briefcase,
      color: 'var(--introduction-success)'
    },
    {
      name: '이프론트',
      role: '프론트엔드 리드',
      experience: '10년+ UI/UX 개발',
      speciality: 'Vue, Angular, 디자인 시스템',
      description: '사용자 경험을 최우선으로 하는 프론트엔드 개발자로, 다양한 프레임워크에 정통합니다.',
      icon: Users,
      color: 'var(--introduction-warning)'
    },
    {
      name: '최데이터',
      role: '데이터 사이언티스트',
      experience: '8년+ 데이터 분석',
      speciality: 'Python, ML, 빅데이터',
      description: '금융, 이커머스 등 다양한 도메인에서 데이터 기반 의사결정을 이끌어온 전문가입니다.',
      icon: Award,
      color: 'var(--introduction-secondary)'
    }
  ];

  return (
    <section className="intro-team-section">
      <div className="introduction-container">
        <div className="intro-team-header">
          <h2 className="introduction-section-title">
            함께하는 전문가들
          </h2>
          <p className="introduction-section-subtitle">
            실무 경험이 풍부한 시니어 개발자들이 
            <br />여러분의 성장을 위해 함께합니다
          </p>
        </div>
        
        <div className="intro-team-grid">
          {introTeamMembers.map((member, index) => (
            <div key={index} className="intro-team-card">
              <div className="intro-team-card-header">
                <div 
                  className="intro-team-icon-wrapper"
                  style={{ backgroundColor: `${member.color}15` }}
                >
                  <member.icon 
                    className="intro-team-icon"
                    style={{ color: member.color }}
                  />
                </div>
                <div className="intro-team-badge">{member.experience}</div>
              </div>
              
              <div className="intro-team-info">
                <h3 className="intro-team-name">{member.name}</h3>
                <p className="intro-team-role">{member.role}</p>
                <div className="intro-team-skills">
                  <span className="intro-team-skill-label">전문 분야:</span>
                  <span className="intro-team-skills-text">{member.speciality}</span>
                </div>
                <p className="intro-team-description">{member.description}</p>
              </div>
              
              <div className="intro-team-card-footer">
                <button className="intro-team-contact-btn">
                  멘토링 신청
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="intro-team-cta">
          <div className="intro-team-cta-content">
            <h3 className="intro-team-cta-title">더 많은 전문가들과 만나보세요</h3>
            <p className="intro-team-cta-description">
              1000명 이상의 검증된 멘토들이 여러분을 기다리고 있습니다
            </p>
            <button className="intro-team-cta-button">
              전체 멘토 둘러보기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroTeamSection;
