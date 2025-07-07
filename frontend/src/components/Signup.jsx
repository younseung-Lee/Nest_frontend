import React, { useState, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, UserCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../image/cool.png';
import { authAPI } from '../services/api';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [userStatus, setUserStatus] = useState('mentee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailAuthRequested, setEmailAuthRequested] = useState(false);
  const [emailAuthCode, setEmailAuthCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const phone2Ref = useRef(null);
  const phone3Ref = useRef(null);
  const navigate = useNavigate();

  // 이메일 인증코드 발송
  const handleSendEmailCode = async () => {
    if (!email) return;
    setEmailAuthLoading(true);
    try {
      await authAPI.sendEmailVerificationCode(email);
      setEmailAuthRequested(true);
      alert('인증번호가 이메일로 전송되었습니다.');
    } catch (e) {
      alert('이메일 인증번호 전송 실패');
    } finally {
      setEmailAuthLoading(false);
    }
  };

  // 인증코드 검증
  const handleVerifyEmailCode = async () => {
    if (!email || !emailAuthCode) return;
    setEmailAuthLoading(true);
    try {
      await authAPI.verifyEmail(email, emailAuthCode);
      setEmailVerified(true);
      alert('이메일 인증 성공!');
    } catch (e) {
      alert('인증번호가 올바르지 않습니다.');
    } finally {
      setEmailAuthLoading(false);
    }
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!emailVerified) {
      alert('이메일 인증이 필요합니다!');
      setIsLoading(false);
      return;
    }
    // 입력값 유효성 검사 (Login.jsx와 동일)
    if (!email.trim()) {
      setError('이메일을 입력해주세요.'); setIsLoading(false); return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('올바른 이메일 형식이 아닙니다.'); setIsLoading(false); return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.'); setIsLoading(false); return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.'); setIsLoading(false); return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.'); setIsLoading(false); return;
    }
    if (!name.trim()) {
      setError('이름을 입력해주세요.'); setIsLoading(false); return;
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.'); setIsLoading(false); return;
    }
    if (!phone1 || !phone2 || !phone3) {
      setError('전화번호를 모두 입력해주세요.'); setIsLoading(false); return;
    }
    if (phone1.length !== 3 || phone2.length < 3 || phone3.length < 4) {
      setError('올바른 전화번호 형식이 아닙니다.'); setIsLoading(false); return;
    }
    const signupData = {
      email: email.trim(),
      password: password,
      name: name.trim(),
      nickName: nickname.trim(),
      phoneNumber: `${phone1}-${phone2}-${phone3}`,
      userRole: userStatus.toUpperCase()
    };
    try {
      const response = await authAPI.signup(signupData);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 전화번호 입력 시 자동 포커스 이동
  const handlePhoneInput = (value, setter, nextRef, maxLength) => {
    setter(value);
    if (value.length === maxLength && nextRef) {
      nextRef.current?.focus();
    }
  };

  return (
    <div className="login-overlay" onClick={() => navigate('/')}>
      <div className="login-modal signup-mode" onClick={e => e.stopPropagation()}>
        <button className="login-close" onClick={() => navigate('/')}>
          <X className="icon" />
        </button>
        <div className="login-header">
          <img src={logo} alt="Nest.dev" className="login-logo" />
          <h2 className="login-title">회원가입</h2>
          <p className="login-subtitle">Nest.dev에 오신 것을 환영합니다!</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message"><span>{error}</span></div>}
          {/* 이메일 + 인증하기 버튼 */}
          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
                disabled={emailVerified}
              />
            </div>
            <button
              type="button"
              className="email-auth-btn"
              onClick={handleSendEmailCode}
              disabled={!email || emailVerified || emailAuthLoading}
              style={{ minWidth: '90px', height: '44px' }}
            >
              {emailVerified ? '인증완료' : (emailAuthLoading ? '전송중...' : '인증하기')}
            </button>
          </div>
          {/* 인증코드 입력란 + 확인 버튼 */}
          {emailAuthRequested && !emailVerified && (
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Lock className="input-icon" />
                <input
                  type="text"
                  placeholder="인증코드"
                  value={emailAuthCode}
                  onChange={e => setEmailAuthCode(e.target.value)}
                  className="login-input"
                  maxLength={8}
                />
              </div>
              <button
                type="button"
                className="email-auth-btn"
                onClick={handleVerifyEmailCode}
                disabled={!emailAuthCode || emailAuthLoading}
                style={{ minWidth: '90px', height: '44px' }}
              >
                {emailAuthLoading ? '확인중...' : '확인'}
              </button>
            </div>
          )}
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
          {/* 비밀번호 확인 */}
          <div className="input-group">
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>
          {/* 이름 */}
          <div className="input-group">
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>
          {/* 닉네임 */}
          <div className="input-group">
            <div className="input-wrapper">
              <UserCheck className="input-icon" />
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>
          {/* 전화번호 */}
          <div className="input-group">
            <span className="input-label">
              <Phone className="input-icon" />
              전화번호
            </span>
            <div className="phone-input-wrapper">
              <input
                type="tel"
                placeholder="010"
                value={phone1}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  handlePhoneInput(value, setPhone1, phone2Ref, 3);
                }}
                className="phone-input"
                maxLength={3}
                style={{ width: '70px', textAlign: 'center' }}
                required
              />
              <span className="phone-divider">-</span>
              <input
                type="tel"
                placeholder="0000"
                value={phone2}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  handlePhoneInput(value, setPhone2, phone3Ref, 4);
                }}
                className="phone-input"
                maxLength={4}
                style={{ width: '90px', textAlign: 'center' }}
                required
                ref={phone2Ref}
              />
              <span className="phone-divider">-</span>
              <input
                type="tel"
                placeholder="0000"
                value={phone3}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPhone3(value);
                }}
                className="phone-input"
                maxLength={4}
                style={{ width: '90px', textAlign: 'center' }}
                required
                ref={phone3Ref}
              />
            </div>
          </div>
          {/* 가입 유형 */}
          <div className="user-type-group">
            <label className="user-type-label">가입 유형</label>
            <div className="user-type-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="mentee"
                  checked={userStatus === 'mentee'}
                  onChange={(e) => setUserStatus(e.target.value)}
                />
                <span className="radio-label">
                  <span className="radio-icon">🐣</span>
                  멘티로 가입
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="mentor"
                  checked={userStatus === 'mentor'}
                  onChange={(e) => setUserStatus(e.target.value)}
                />
                <span className="radio-label">
                  <span className="radio-icon">🦅</span>
                  멘토로 가입
                </span>
              </label>
            </div>
          </div>
          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                회원가입 중...
              </span>
            ) : (
              '회원가입'
            )}
          </button>
        </form>
        <div className="login-footer">
          <p>
            이미 계정이 있으신가요?
            <button onClick={() => navigate('/login')} className="toggle-mode" style={{ color: '#fd7e14', marginLeft: 4 }}>
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 
