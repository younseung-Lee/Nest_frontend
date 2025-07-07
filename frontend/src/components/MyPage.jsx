import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Settings,
  BookOpen,
  CreditCard,
  Briefcase,
  Clock,
  LogOut,
  ArrowLeft,
  UserPlus,
  Star,
  Camera,
  Upload,
  X,
  Ticket
} from 'lucide-react';
import './MyPage.css';
import { userInfoUtils, authUtils } from '../utils/tokenUtils.js';
import { userAPI, authAPI } from '../services/api.js';
import BookingHistory from './MyPage/BookingHistory.jsx';
import PaymentsHistory from './MyPage/PaymentsHistory.jsx';
import Reviews from "./MyPage/Reviews.jsx";
import Coupons from "./MyPage/Coupons.jsx";

// Lazy load components for better performance
const BasicInfo = lazy(() => import('./MyPage/BasicInfo.jsx'));
const CareerHistory = lazy(() => import('./MyPage/CareerHistory.jsx'));
const MentorRegistration = lazy(() => import('./MyPage/MentorRegistration.jsx'));
const ConsultationTime = lazy(() => import('./MyPage/ConsultationTime.jsx'));

const MyPage = ({ onBack, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef(null);

  // URL 경로에서 현재 탭 추출
  const getCurrentTab = () => {
    const path = location.pathname.replace('/mypage', '') || '/profile';
    return path.substring(1) || 'profile'; // 앞의 '/' 제거
  };
  
  const [activeTab, setActiveTab] = useState(getCurrentTab());

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
      setError("로그인이 필요합니다. 다시 로그인해주세요.");
      authUtils.clearAllAuthData();
      onLogout();
      setLoading(false);
      return;
    }

    try {
      const response = await userAPI.getUser();

      // 🔍 [2단계] 사용자 정보 API 응답 전체 확인
      console.log('🔍 [2단계] 사용자 정보 API 전체 응답:', response);
      console.log('🔍 [2단계] 사용자 정보 API 응답 데이터:', response.data);
      console.log('🔍 [2단계] 사용자 정보 API backendUserData:', response.data.data);

      if (response.data && response.data.data) {
        const backendUserData = response.data.data;

        // 🔍 [2단계] backendUserData 모든 필드 확인
        console.log('🔍 [2단계] backendUserData 모든 필드:', Object.keys(backendUserData));
        console.log('🔍 [2단계] profileImage 필드 확인:', backendUserData.profileImage);
        console.log('🔍 [2단계] imgUrl 필드 확인:', backendUserData.imgUrl);
        console.log('🔍 [2단계] image 필드 확인:', backendUserData.image);
        console.log('🔍 [2단계] avatar 필드 확인:', backendUserData.avatar);

        // 기존 세션의 토큰 유지
        const prevUserData = userInfoUtils.getUserInfo();

        const mappedUserInfo = {
          id: backendUserData.id,
          name: backendUserData.name,
          email: backendUserData.email,
          nickName: backendUserData.nickName,
          phoneNumber: backendUserData.phoneNumber,
          userRole: backendUserData.userRole,
          socialType: backendUserData.socialType,
          createdAt: backendUserData.createdAt,
          profileImage: backendUserData.profileImage || '/default-profile.svg',
          bank: backendUserData.bank || '',
          accountNumber: backendUserData.accountNumber || '',
          token: prevUserData?.token // 기존 토큰 유지
        };

        // 별도로 프로필 이미지 조회해서 최신 상태 반영
        try {
          const profileImageResponse = await userAPI.getUserProfileImage(backendUserData.id);
          if (profileImageResponse.data && profileImageResponse.data.data && profileImageResponse.data.data.imgUrl) {
            mappedUserInfo.profileImage = profileImageResponse.data.data.imgUrl;
          }
        } catch (imageError) {
          console.warn('프로필 이미지 조회 실패 (기본 이미지 사용):', imageError);
          // 에러가 나도 기본 사용자 정보는 그대로 사용
        }

        setUserInfo(mappedUserInfo);
        sessionStorage.setItem('mappedUserInfo', JSON.stringify(mappedUserInfo));

      } else {
        setError("사용자 정보를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 404) {
        setError("사용자 정보를 찾을 수 없습니다.");
      } else if (error.code === 'ERR_NETWORK') {
        setError("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
      } else {
        setError("마이페이지를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // 백엔드 호출 실패해도 클라이언트 로그아웃은 진행
    } finally {
      authUtils.clearAllAuthData();
      onLogout();
    }
  };

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 검증
    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      alert('이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setImageUploading(true);

      // 프로필 이미지가 이미 있으면 수정, 없으면 최초 등록
      const hasProfileImage = userInfo.profileImage && userInfo.profileImage !== '/default-profile.svg';

      let uploadResponse;
      if (hasProfileImage) {
        // 기존 이미지가 있는 경우 - 수정 API 사용
        console.log('📸 기존 프로필 이미지 수정 중...');
        uploadResponse = await userAPI.updateProfileImage(file);
      } else {
        // 기존 이미지가 없는 경우 - 최초 등록 API 사용
        console.log('📸 프로필 이미지 최초 등록 중...');
        uploadResponse = await userAPI.uploadProfileImage(file);
      }

      console.log('✅ 프로필 이미지 처리 성공:', uploadResponse.data);

      // 업로드/수정 완료 후 최신 프로필 이미지 조회
      try {
        const imageResponse = await userAPI.getUserProfileImage(userInfo.id);
        const newImageUrl = imageResponse.data.data.imgUrl;

        const updatedUserInfo = {
          ...userInfo,
          profileImage: newImageUrl
        };

        setUserInfo(updatedUserInfo);
        userInfoUtils.setUserInfo(updatedUserInfo);

        console.log('✅ 프로필 이미지 URL 업데이트:', newImageUrl);
        alert(`프로필 이미지가 성공적으로 ${hasProfileImage ? '수정' : '등록'}되었습니다!`);

      } catch (fetchError) {
        console.error('프로필 이미지 조회 실패:', fetchError);
        // 업로드는 성공했지만 조회 실패한 경우, 업로드 응답의 URL 사용
        const fallbackImageUrl = uploadResponse.data.data?.imgUrl;
        if (fallbackImageUrl) {
          const updatedUserInfo = {
            ...userInfo,
            profileImage: fallbackImageUrl
          };
          setUserInfo(updatedUserInfo);
          userInfoUtils.setUserInfo(updatedUserInfo);
        }
        alert('프로필 이미지가 업데이트되었습니다. 페이지를 새로고침해주세요.');
      }

    } catch (error) {
      console.error('❌ 프로필 이미지 처리 실패:', error);

      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 413) {
        alert('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
      } else {
        alert('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setImageUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 프로필 이미지 클릭 핸들러 - 모달 열기
  const handleProfileImageClick = () => {
    if (imageUploading) return;
    setShowProfileModal(true);
  };

  // 프로필 모달 닫기
  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  // 이미지 수정 핸들러
  const handleImageEdit = () => {
    closeProfileModal();
    fileInputRef.current?.click();
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = async () => {
    if (!userInfo.profileImage || userInfo.profileImage === '/default-profile.svg') {
      alert('삭제할 프로필 이미지가 없습니다.');
      closeProfileModal();
      return;
    }

    const confirmDelete = window.confirm('프로필 이미지를 삭제하시겠습니까?');
    if (!confirmDelete) {
      closeProfileModal();
      return;
    }

    try {
      setImageUploading(true);
      closeProfileModal();

      // 백엔드 삭제 API 호출
      await userAPI.deleteProfileImage();

      // 삭제 후 기본 이미지로 교체
      const updatedUserInfo = {
        ...userInfo,
        profileImage: '/default-profile.svg'
      };

      setUserInfo(updatedUserInfo);
      userInfoUtils.setUserInfo(updatedUserInfo);

      alert('프로필 이미지가 삭제되었습니다.');

    } catch (error) {
      console.error('❌ 프로필 이미지 삭제 실패:', error);

      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 404) {
        alert('삭제할 프로필 이미지가 없습니다.');
      } else {
        alert('이미지 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setImageUploading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    navigate(`/mypage/${tabName}`);
  };
  
  // URL 변경 시 activeTab 업데이트
  useEffect(() => {
    const currentTab = getCurrentTab();
    setActiveTab(currentTab);
  }, [location.pathname]);

  if (loading && !userInfo) {
    return (
      <div className="mypage-container">
        <div className="mypage-loading">
          <p>사용자 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mypage-container">
        <div className="mypage-loading error">
          <p>{error}</p>
          <div className="error-actions">
            <button className="my-back-button" onClick={onBack}>뒤로 가기</button>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="mypage-container">
        <div className="mypage-loading">
          <p>사용자 정보를 찾을 수 없습니다.</p>
          <button className="my-back-button" onClick={onBack}>뒤로 가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <button className="my-back-button" onClick={onBack}>
          <ArrowLeft className="icon" />
        </button>
        <h1>마이페이지</h1>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut className="icon" />
          로그아웃
        </button>
      </div>

      <div className="mypage-content">
        <div className="profile-section">
          <div className="profile-image-container">
            <div
              className={`profile-image-wrapper ${imageUploading ? 'uploading' : ''}`}
              onClick={handleProfileImageClick}
              title="클릭하여 프로필 이미지 변경"
            >
              <img
                src={userInfo.profileImage || '/default-profile.svg'}
                alt="프로필"
                className="profile-image"
              />
              <div className="profile-image-overlay">
                {imageUploading ? (
                  <div className="upload-spinner">
                    <div className="spinner"></div>
                    <span>업로드 중...</span>
                  </div>
                ) : (
                  <div className="upload-icon">
                    <Camera size={24} />
                    <span>이미지 변경</span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-info">
            <h2>{userInfo.name}</h2>
            <p>{userInfo.email}</p>
            <span className="user-level">
              {userInfo.userRole === 'MENTOR' ? '멘토' : '멘티'}
            </span>
          </div>
        </div>

        {/* 프로필 이미지 모달 */}
        {showProfileModal && (
          <div className="modal-overlay" onClick={closeProfileModal}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>프로필 이미지</h3>
                <button className="image-modal-close-btn" onClick={closeProfileModal}>
                  닫기
                </button>
              </div>

              <div className="profile-modal-content">
                <div className="current-profile-image">
                  <img
                    src={userInfo.profileImage || '/default-profile.svg'}
                    alt="현재 프로필"
                    className="modal-profile-image"
                  />
                </div>

                <div className="profile-actions">
                  <button
                    className="profile-action-btn edit"
                    onClick={handleImageEdit}
                    disabled={imageUploading}
                  >
                    <Camera size={20} />
                    <span>
                      {userInfo.profileImage && userInfo.profileImage !== '/default-profile.svg'
                        ? '이미지 수정'
                        : '이미지 등록'}
                    </span>
                  </button>

                  {userInfo.profileImage && userInfo.profileImage !== '/default-profile.svg' && (
                    <button
                      className="profile-action-btn delete"
                      onClick={handleImageDelete}
                      disabled={imageUploading}
                    >
                      <X size={20} />
                      <span>이미지 삭제</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mypage-main">
          {/* 왼쪽 사이드바 */}
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>메뉴</h3>
            </div>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <User className="sidebar-icon" />
                <span>프로필</span>
              </button>

              <button
                className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => handleTabChange('bookings')}
              >
                <BookOpen className="sidebar-icon" />
                <span>{userInfo.userRole === 'MENTOR' ? '예정된 예약' : '예약 내역'}</span>
              </button>

              {/* 멘티만 결제 내역 표시 */}
              {userInfo.userRole === 'MENTEE' && (
                  <>
                    <button
                        className={`sidebar-item ${activeTab === 'payments' ? 'active' : ''}`}
                        onClick={() => handleTabChange('payments')}
                    >
                      <CreditCard className="sidebar-icon" />
                      <span>결제 내역</span>
                    </button>

                    <button
                    className={`sidebar-item ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => handleTabChange('reviews')}
                    >
                      <Star className="sidebar-icon" />
                      <span>리뷰 내역</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'coupons' ? 'active' : ''}`}
                        onClick={() => handleTabChange('coupons')}
                    >
                      <Ticket className="sidebar-icon" />
                      <span>보유 쿠폰</span>
                    </button>
                  </>
              )}

              {/* 멘토 전용 메뉴 */}
              {userInfo.userRole === 'MENTOR' && (
                <>
                  <div className="sidebar-divider"></div>
                  <div className="sidebar-section-title">멘토 전용</div>

                  <button
                    className={`sidebar-item ${activeTab === 'mentorRegister' ? 'active' : ''}`}
                    onClick={() => handleTabChange('mentorRegister')}
                  >
                    <UserPlus className="sidebar-icon" />
                    <span>멘토 등록</span>
                  </button>

                  <button
                    className={`sidebar-item ${activeTab === 'careers' ? 'active' : ''}`}
                    onClick={() => handleTabChange('careers')}
                  >
                    <Briefcase className="sidebar-icon" />
                    <span>경력 목록</span>
                  </button>

                  <button
                    className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => handleTabChange('schedule')}
                  >
                    <Clock className="sidebar-icon" />
                    <span>상담 가능 시간</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* 오른쪽 컨텐츠 영역 */}
          <div className="content-area">
            <Suspense fallback={
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>로딩 중...</p>
              </div>
            }>
              <Routes>
                <Route path="/" element={
                  <BasicInfo 
                    userInfo={userInfo} 
                    setUserInfo={setUserInfo} 
                    onLogout={onLogout} 
                  />
                } />
                <Route path="/profile" element={
                  <BasicInfo 
                    userInfo={userInfo} 
                    setUserInfo={setUserInfo} 
                    onLogout={onLogout} 
                  />
                } />
                <Route path="/bookings" element={
                  <BookingHistory userInfo={userInfo} />
                } />
                <Route path="/payments" element={
                  userInfo?.userRole === 'MENTEE' ? (
                    <PaymentsHistory userInfo={userInfo} />
                  ) : (
                    <div className="access-denied">
                      <p>접근 권한이 없습니다.</p>
                    </div>
                  )
                } />
                <Route path="/careers" element={
                  userInfo?.userRole === 'MENTOR' ? (
                    <CareerHistory userInfo={userInfo} />
                  ) : (
                    <div className="access-denied">
                      <p>접근 권한이 없습니다.</p>
                    </div>
                  )
                } />
                <Route path="/mentorRegister" element={
                  userInfo?.userRole === 'MENTOR' ? (
                    <MentorRegistration userInfo={userInfo} onLogout={onLogout} />
                  ) : (
                    <div className="access-denied">
                      <p>접근 권한이 없습니다.</p>
                    </div>
                  )
                } />
                <Route path="/schedule" element={
                  userInfo?.userRole === 'MENTOR' ? (
                    <ConsultationTime userInfo={userInfo} />
                  ) : (
                    <div className="access-denied">
                      <p>접근 권한이 없습니다.</p>
                    </div>
                  )
                } />
                <Route path="/reviews" element={
                  userInfo?.userRole === 'MENTEE' ? (
                      <Reviews userInfo={userInfo}/>
                  ) : (
                      <div className="access-denied">
                        <p>접근 권한이 없습니다.</p>
                      </div>
                  )
                } />
                <Route path="/coupons" element={
                  userInfo?.userRole === 'MENTEE' ? (
                      <Coupons userInfo={userInfo}/>
                  ) : (
                      <div className="access-denied">
                        <p>접근 권한이 없습니다.</p>
                      </div>
                )
                }/>
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
