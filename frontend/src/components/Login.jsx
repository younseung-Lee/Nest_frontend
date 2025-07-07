import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';
import logo from '../image/cool.png';
import { authAPI } from '../services/api';
import { authUtils, decodeJWT } from '../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!email.trim()) {
      setError('이메일을 입력해주세요.'); setIsLoading(false); return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.'); setIsLoading(false); return;
    }
    const loginData = { email: email.trim(), password: password };
    try {
      const response = await authAPI.login(loginData);
      
      // 🔍 [2단계] 로그인 API 응답 전체 확인
      console.log('🔍 [2단계] 로그인 API 전체 응답:', response);
      console.log('🔍 [2단계] 로그인 API 응답 데이터:', response.data);
      console.log('🔍 [2단계] 로그인 API responseData:', response.data.data);
      
      // 로그인 성공 처리 (토큰 저장 등)
      const responseData = response.data.data;
      
      // 🔍 [2단계] responseData 모든 필드 확인
      console.log('🔍 [2단계] responseData 모든 필드:', Object.keys(responseData));
      console.log('🔍 [2단계] profileImage 필드 확인:', responseData.profileImage);
      console.log('🔍 [2단계] imgUrl 필드 확인:', responseData.imgUrl);
      console.log('🔍 [2단계] image 필드 확인:', responseData.image);
      console.log('🔍 [2단계] avatar 필드 확인:', responseData.avatar);
      const token = responseData.accessToken;
      const refreshToken = responseData.refreshToken;
      const userRole = decodeJWT(token).userRole;

      const userInfo = {
        id: responseData.id,
        name: responseData.name,
        email: responseData.email,
        userRole: userRole,
        joinDate: responseData.createdAt,
        accessToken: token
      };

      authUtils.setAuthData(userInfo.accessToken, refreshToken, userInfo);
      if (onLoginSuccess) {
        onLoginSuccess(userInfo);
      }
      if (userInfo.userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('이메일 또는 비밀번호를 다시 확인하세요!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    console.log('🟡 카카오 소셜 로그인 시작...');
    window.location.href = 'http://nest-dev.click:8080/oauth2/authorization/kakao';
  };

  const handleNaverLogin = () => {
    console.log('🟢 네이버 소셜 로그인 시작...');
    window.location.href = 'http://nest-dev.click:8080/oauth2/authorization/naver';
  };


  return (
    <div className="login-overlay" onClick={() => navigate('/')}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="login-close" onClick={() => navigate('/')}>
          <X className="icon" />
        </button>
        <div className="login-header">
          <img src={logo} alt="Nest.dev" className="login-logo" />
          <h2 className="login-title">로그인</h2>
          <p className="login-subtitle">다시 만나서 반가워요!</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message"><span>{error}</span></div>}
          {/* 이메일 */}
          <div className="input-group">
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="input-group">
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
              </button>
            </div>
          </div>
          <div className="form-options">
            <a href="#forgot" className="forgot-password">
              비밀번호 찾기
            </a>
          </div>
          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="login-loading-spinner">
                <span className="spinner"></span>
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>
        </form>
        <div className="social-login">
          <div className="divider">
            <span>간편 로그인</span>
          </div>
          <div className="social-buttons">
            <button onClick={handleKakaoLogin}
                className="social-button kakao">
              <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" alt="카카오" />
              <span>카카오로 시작하기</span>
            </button>
            <button onClick={handleNaverLogin}
                className="social-button naver">
              <img className="naver-logo" src={"src/image/naver.png"} alt={"네이버로 시작하기"}/>
              <span style={{ color: 'white' }}>네이버로 시작하기</span>
            </button>
          </div>
        </div>
        <div className="login-footer">
          <p>
            아직 회원이 아니신가요?
            <button onClick={() => navigate('/signup')} className="toggle-mode" style={{ color: '#fd7e14', marginLeft: 4 }}>
              회원가입하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
