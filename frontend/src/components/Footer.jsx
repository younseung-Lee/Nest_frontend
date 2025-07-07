import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* 메인 링크 섹션 */}
        <div className="footer-main">
          <div className="footer-section">
            <h3 className="footer-title">고객센터</h3>
            <div className="footer-content">
              <p>모든 상담은 채팅 상담을 통해 우선 답변됩니다.</p>
              <div className="contact-hours">
                <p>채팅 상담 운영시간 :</p>
                <p>월요일 14:00~17:30</p>
                <p>화~금요일 10:30~17:30</p>
                <p>(점심시간 12:30~14:00 / 주말, 공휴일 휴무)</p>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">카테고리</h3>
            <ul className="footer-links">
              <li><a href="#">Flutter</a></li>
              <li><a href="#">iOS</a></li>
              <li><a href="#">Unity</a></li>
              <li><a href="#">데이터 분석</a></li>
              <li><a href="#">UX/UI 디자인</a></li>
              <li><a href="#">백엔드</a></li>
              <li><a href="#">프론트 엔드</a></li>
              <li><a href="#">QA/QC</a></li>
              <li><a href="#">Spring</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">취업 지원</h3>
            <ul className="footer-links">
              <li><a href="#">취업 지원</a></li>
              <li><a href="#">신입 개발자 채용</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">블로그</h3>
            <ul className="footer-links">
              <li><a href="#">취업 후기</a></li>
              <li><a href="#">멘토 인터뷰</a></li>
              <li><a href="#">블로그</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">ETC</h3>
            <ul className="footer-links">
              <li><a href="#">튜터 지원</a></li>
              <li><a href="#">관리자 지원</a></li>
            </ul>
          </div>
        </div>

        {/* 하단 링크 및 수상 내역 */}
        <div className="footer-bottom-section">
          <div className="footer-bottom-links">
            <a href="#">개인정보처리방침</a>
            <a href="#">서비스 이용약관</a>
            <a href="#">고객센터</a>
          </div>
          <div className="footer-bottom-awards">
            <div className="award-badge">
              🏆 2025 올해의 브랜드 대상<br />
              코딩교육 부문 1위
            </div>
          </div>
        </div>

        {/* 회사 정보 */}
        <div className="footer-company-info">
          <p><strong>NestDev(주) 사업자 정보</strong></p>
          <p>대표자 : caffeine | 사업자 등록번호 : 123-45-67899 | 통신판매업 신고번호 : 2020-서울영등포-2300</p>
          <p>주소 : 서울특별시 강남구 테헤란로44길 8 12층 | 이메일 : nest@nestdev.com | 전화 : 1234-1234</p>
        </div>

        {/* 저작권 */}
        <div className="footer-copyright">
          <p>Copyright ©2025 NESTDEV All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;