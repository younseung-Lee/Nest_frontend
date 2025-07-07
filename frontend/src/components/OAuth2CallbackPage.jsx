// src/pages/OAuth2CallbackPage.js (예시)
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // React Router v6 기준
import { authUtils } from '../utils/tokenUtils'; // 토큰 저장 유틸리티
import {authAPI} from '../services/api'
import { decodeJWT } from '../utils/tokenUtils'

const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터 가져오기
  const navigate = useNavigate(); // 페이지 이동을 위한 훅

  useEffect(() => {
    // URL에서 'code' 파라미터 추출
    const code = searchParams.get('code');
    console.log('🔄 OAuth2CallbackPage 로드됨. 추출된 code:', code);

    if (code) {
      // 백엔드 API에 'code'를 보내 토큰 교환 요청
      const exchangeCodeForTokens = async () => {
        try {
          const response = await authAPI.getOAuth2CallbackUrl(code);

          const responseBody = await response.data.data;

          const {
            id,
            email,
            nickName,
            userRole,
            accessToken,
            refreshToken,
            newUser: isNewUser
          } = responseBody; // 백엔드로부터 받은 응답 (accessToken, refreshToken, isNewUser 등)

          // 사용자 정보 구성
          const userInfo = {
            id: id,
            nickName: nickName,
            email: email,
            profileImage: null,
            userRole: userRole,
            joinDate: null,
            token: accessToken
          };

          // ⭐ 신규 사용자 (new: true) 처리
          if (isNewUser === true) {
            console.log('🆕 신규 사용자 - 온보딩 페이지로 이동');
            authUtils.setAuthData(accessToken, null, userInfo)
            navigate('/social-signup'); // 신규 사용자를 위한 추가 정보 입력 페이지
          } else {
            // ⭐ 기존 사용자 (new: true) 처리
            console.log('🏠 기존 사용자 감지! 메인 페이지로 이동.');

            await authUtils.setAuthData(accessToken, refreshToken, userInfo)
            navigate('/');
            window.location.reload();
          }

        } catch (error) {
          console.error('❌ 토큰 교환 요청 중 오류 발생:', error);
          navigate('/login?error=network_error'); // 네트워크 오류 등
        }
      };
      exchangeCodeForTokens();
    } else {
      console.warn('⚠️ URL에 "code" 파라미터가 없습니다. 잘못된 접근 또는 오류.');
      navigate('/login?error=no_code'); // code가 없는 경우 로그인 페이지로
    }
  }, [searchParams, navigate]); // searchParams나 navigate가 변경될 때만 재실행

  return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTop: '4px solid white', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
        <h1>로그인 처리 중...</h1>
        <p>잠시만 기다려주세요.</p>
        {/* CSS @keyframes spin 정의 필요 */}
        <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
      </div>
  );
};

export default OAuth2CallbackPage;
