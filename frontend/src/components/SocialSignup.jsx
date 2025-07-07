import React, { useState, useRef, useEffect } from 'react';
import { User, Phone } from 'lucide-react';
import './SocialSignup.css';
import logo from '../image/cool.png';
import { userAPI } from '../services/api';
import { authUtils, userInfoUtils } from '../utils/tokenUtils';
import {useNavigate} from "react-router-dom"; // authUtils, userInfoUtils 추가

const SocialSignup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [userType, setUserType] = useState('');

  const phone2Ref = useRef(null);
  const phone3Ref = useRef(null);


  // 사용자 정보는 userInfoUtils에서 가져오는 것이 일관적입니다.
  const userInfo = userInfoUtils.getUserInfo();
  const id = userInfo?.id;

  // ⭐️ 핵심 로직: useEffect 훅에서 GUEST 역할 및 페이지 이탈 감지 ⭐️
  useEffect(() => {

    // 1. 페이지 이탈(Unload) 시 강제 로그아웃
    //    (브라우저 탭 닫기, 새로고침, URL 직접 입력 등)
    const handleBeforeUnload = () => {
      const currentUserInfo = userInfoUtils.getUserInfo(); // 최신 userInfo 다시 가져오기
      if (currentUserInfo?.userRole === 'GUEST' && currentUserInfo?.isNewUser) {
        authUtils.clearAllAuthData(); // GUEST 역할이면서 신규 사용자이면 로그아웃
        console.log('⚠️ SocialSignup: 페이지 이탈 감지 - 추가 정보 미입력 GUEST로 강제 로그아웃.');
      }
    };

    // 3. 뒤로가기(Popstate) 시 GUEST 역할 확인 후 강제 로그아웃
    //    (브라우저 뒤로가기 버튼 클릭)
    const handlePopState = () => {
      const currentUserInfo = userInfoUtils.getUserInfo(); // 최신 userInfo 다시 가져오기
      if (currentUserInfo?.userRole === 'GUEST' && currentUserInfo?.isNewUser) {
        authUtils.clearAllAuthData(); // GUEST 역할이면서 신규 사용자이면 로그아웃
        console.log('⚠️ SocialSignup: 뒤로가기 감지 - 추가 정보 미입력 GUEST로 강제 로그아웃.');
        navigate('/login', { replace: true }); // 로그인 페이지로 강제 리다이렉트
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거 (클린업)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);  // userInfo와 navigate를 의존성 배열에 추가

  // 전화번호 입력 시 자동 포커스 이동
  const handlePhoneInput = (value, setter, nextRef, maxLength) => {
    setter(value);
    if (value.length === maxLength && nextRef) {
      nextRef.current?.focus();
    }
  };

  // 폼 제출 핸들러 (기존과 동일하지만, 성공 시 최종 로그인 처리 명확화)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneNumber = `${phone1}-${phone2}-${phone3}`;

    if (!userType) {
      alert('가입 유형을 선택해주세요.');
      return;
    }

    try {
      // 백엔드에 추가 정보 전송
      const response = await userAPI.updateExtraInfo({
        id,
        name,
        phoneNumber,
        userRole: userType.toUpperCase(),
      });

      const { accessToken: finalAccessToken, refreshToken: finalRefreshToken, user: finalUserInfo } = response.data.data;

      // ⭐️ 중요: 추가 정보 입력 성공 시 최종적으로 토큰 및 사용자 정보 저장 ⭐️
      // 이제 이 사용자는 GUEST가 아니며, 신규 사용자 플래그도 false가 됩니다.
      authUtils.setAuthData(finalAccessToken, finalRefreshToken, {
        ...finalUserInfo,
        isNewUser: false, // 이제 신규 사용자가 아님
        userRole: userType.toUpperCase() // GUEST에서 최종 역할로 업데이트
      });

      alert('회원가입이 완료되었습니다!');
      window.location.href = '/'; // 홈으로 이동 (새로고침하여 App.js 초기화 로직 재실행)
    } catch (err) {
      console.error('추가 정보 저장 실패:', err);
      // 에러 발생 시: 현재 임시 로그인 상태를 해제하여 로그아웃 처리
      authUtils.clearAllAuthData();
      alert('추가 정보 저장에 실패했습니다. 다시 시도해 주세요.');
      navigate('/login', { replace: true }); // 로그인 페이지로 리다이렉트
    }
  };

  return (
    <div className="social-signup-container">
      <div className="social-signup-card">
        <div className="social-signup-header">
          <img src={logo} alt="Nest.dev" className="social-signup-logo" />
          <h2 className="social-signup-title">추가 정보 입력</h2>
          <p className="social-signup-subtitle">
            서비스 이용을 위해 추가 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="social-signup-form">
          {/* 이름 */}
          <div className="form-group">
            <label className="form-label">
              <User className="label-icon" />
              이름
            </label>
            <input
              type="text"
              placeholder="실명을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* 전화번호 */}
          <div className="form-group">
            <label className="form-label">
              <Phone className="label-icon" />
              전화번호
            </label>
            <div className="phone-inputs">
              <input
                type="tel"
                placeholder="010"
                value={phone1}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  handlePhoneInput(value, setPhone1, phone2Ref, 3);
                }}
                className="phone-field"
                maxLength="3"
                required
              />
              <span className="phone-separator">-</span>
              <input
                ref={phone2Ref}
                type="tel"
                placeholder="0000"
                value={phone2}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  handlePhoneInput(value, setPhone2, phone3Ref, 4);
                }}
                className="phone-field"
                maxLength="4"
                required
              />
              <span className="phone-separator">-</span>
              <input
                ref={phone3Ref}
                type="tel"
                placeholder="0000"
                value={phone3}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPhone3(value);
                }}
                className="phone-field"
                maxLength="4"
                required
              />
            </div>
          </div>

          {/* 사용자 유형 선택 */}
          <div className="form-group">
            <label className="form-label">가입 유형</label>
            <div className="user-type-options">
              <label className="user-type-option">
                <input
                  type="radio"
                  name="userType"
                  value="mentee"
                  checked={userType === 'mentee'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="option-content">
                  <span className="option-icon">🐣</span>
                  <span className="option-text">
                    <strong>멘티로 가입</strong>
                    <small>전문가의 도움을 받고 싶어요</small>
                  </span>
                </span>
              </label>
              <label className="user-type-option">
                <input
                  type="radio"
                  name="userType"
                  value="mentor"
                  checked={userType === 'mentor'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="option-content">
                  <span className="option-icon">🦅</span>
                  <span className="option-text">
                    <strong>멘토로 가입</strong>
                    <small>나의 전문성을 공유하고 싶어요</small>
                  </span>
                </span>
              </label>
            </div>
          </div>

          <button type="submit" className="submit-button">
            회원가입 완료
          </button>
        </form>

        <div className="social-signup-footer">
          <p className="footer-text">
            가입을 진행하면 Nest.dev의 
            <a href="#terms"> 이용약관</a> 및 
            <a href="#privacy"> 개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialSignup;
