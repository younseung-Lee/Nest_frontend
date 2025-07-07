import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CTASection.css';

const CTASection = () => {
  const navigate = useNavigate();

  const handleOurStoryClick = () => {
    navigate('/about');
  };

  const handleTeamMeetClick = () => {
    navigate('/about');
  };

  return (
      <div className="brand-mission-section">
        {/* 부드러운 떠다니는 요소들 */}
        <div className="floating-elements">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>

        {/* 큰 메인 컨테이너 */}
        <div className="main-container">
          {/* 브랜드 소개 섹션 */}
          <div className="brand-intro">
            <div className="brand-symbol-clean"></div>
            <h1 className="brand-title">Nest.dev</h1>
            <p className="brand-subtitle">성장하는 모든 순간을 함께합니다</p>
          </div>

          {/* 구분선 섹션 */}
          <div className="section-container">
            <div className="section-divider"></div>
          </div>

          {/* 미션 카드 + 핵심 가치 통합 섹션 */}
          <div className="section-container">
            <div className="mission-card">
              <h2 className="mission-title">우리의 가치</h2>
              <p className="mission-text">
                모든 개발자는 <span className="mission-highlight">성장할 수 있다</span>고 믿습니다.
                <br /><br />
                작은 아이디어 하나가 혁신의 시작이 될 수 있고,
                <br />
                <span className="mission-highlight">따뜻한 멘토링</span>이 누군가의 꿈을 현실로 만들 수 있습니다.
              </p>

              {/* 핵심 가치 */}
              <div className="core-values">
                <div className="value-item">
                  <div className="value-icon-clean">
                    <div className="icon-connect"></div>
                  </div>
                  <div className="value-text">
                    <h4>진정한 연결</h4>
                    <p>의미 있는 만남을 통한 성장</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon-clean">
                    <div className="icon-growth"></div>
                  </div>
                  <div className="value-text">
                    <h4>지속적 성장</h4>
                    <p>끊임없는 학습과 발전</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon-clean">
                    <div className="icon-heart"></div>
                  </div>
                  <div className="value-text">
                    <h4>따뜻한 마음</h4>
                    <p>서로를 응원하는 커뮤니티</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탐색 유도 섹션 */}
          <div className="section-container">
            <div className="call-to-explore">
              <h3 className="explore-title">더 알아보고 싶으신가요?</h3>
              <p className="explore-text">
                Nest.dev가 어떻게 시작되었는지,
                <br />
                우리가 꿈꾸는 세상은 무엇인지 더 자세한 이야기를 들려드릴게요.
              </p>

              <div className="cta-button-group">
                <button className="cta-button" onClick={handleOurStoryClick}>우리 이야기</button>
              </div>
            </div>
          </div>

          {/* 마무리 인사 섹션 */}
          <div className="closing-message">
            <p className="closing-quote">
              당신의 성장 여정에 함께할 수 있어 영광입니다
            </p>
            <div className="signature">- Nest.dev Team</div>
          </div>
        </div>
      </div>
  );
};

export default CTASection;