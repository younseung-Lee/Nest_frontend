import React, {useRef, useState} from 'react';
import { 
  User, 
  Edit3, 
  Check, 
  X, 
  Key, 
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';
import { userAPI, profileAPI } from '../../services/api';
import { userInfoUtils, authUtils } from '../../utils/tokenUtils';
import './BasicInfo.css';

const BasicInfo = ({ userInfo, setUserInfo, onLogout }) => {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [tempBankInfo, setTempBankInfo] = useState({ bank: '', accountNumber: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const phone2Ref = useRef(null);
  const phone3Ref = useRef(null);

  // 비밀번호 변경 모달 관련 state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    delete: false
  });
  const [modalLoading, setModalLoading] = useState(false);
  
  // 회원탈퇴 모달 관련 state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // 프로필 삭제 모달 관련 state
  const [showProfileDeleteModal, setShowProfileDeleteModal] = useState(false);
  const [profileDeletePassword, setProfileDeletePassword] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // 한국 주요 은행 목록
  const banks = [
    '국민은행', '신한은행', '우리은행', '하나은행', 'KEB하나은행',
    '농협은행', '기업은행', '신협', '우체국은행', '카카오뱅크',
    '케이뱅크', '토스뱅크', '새마을금고', '산업은행', '수협은행',
    '경남은행', '광주은행', '대구은행', '부산은행', '전북은행',
    '제주은행', 'SC제일은행', '한국씨티은행', 'HSBC은행'
  ];

  // 컴포넌트 마운트 시 프로필 목록 조회
  React.useEffect(() => {
    if (userInfo?.userRole === 'MENTOR') {
      fetchProfiles();
    }
  }, [userInfo]);

  // 프로필 목록 조회 함수
  const fetchProfiles = async () => {
    try {
      const response = await profileAPI.getMyProfile();
      if (response.data && response.data.data) {
        setProfiles(response.data.data);
      }
    } catch (error) {
      console.error('프로필 목록 조회 실패:', error);
    }
  };

  // mappedUserInfo에서 socialType 확인
  const userDataStr = sessionStorage.getItem('mappedUserInfo');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;

  // 필드 편집 관련 함수들
  const handleEditField = (field) => {
    setEditingField(field);
    if (field === 'bankInfo') {
      setTempBankInfo({
        bank: userInfo.bank || '',
        accountNumber: userInfo.accountNumber || ''
      });
    } else {
      setTempValue(userInfo[field] || '');
    }
  };

  const handleSaveField = async (field) => {
    try {
      setIsUpdating(true);

      let updateData = {};
      let updatedUserInfo;

      if (field === 'bankInfo') {
        updateData = {
          bank: tempBankInfo.bank,
          accountNumber: tempBankInfo.accountNumber
        };
        updatedUserInfo = {
          ...userInfo,
          bank: tempBankInfo.bank,
          accountNumber: tempBankInfo.accountNumber
        };
      } else if (field === 'phoneNumber') { // <-- 이 부분 추가
        // phone1, phone2, phone3의 현재 상태 값을 조합합니다.
        const combinedPhoneNumber = `${phone1}-${phone2}-${phone3}`;

        // 유효성 검사 (선택 사항): 모든 전화번호 부분이 채워져 있는지 확인
        if (phone1.length !== 3 || phone2.length !== 4 || phone3.length !== 4) {
          alert('전화번호를 정확히 입력해주세요.');
          setIsUpdating(false);
          return;
        }

        updateData = { [field]: combinedPhoneNumber };
        updatedUserInfo = { ...userInfo, [field]: combinedPhoneNumber };

      } else { // 다른 일반 필드
        updateData = { [field]: tempValue };
        updatedUserInfo = { ...userInfo, [field]: tempValue };
      }

      const response = await userAPI.updateUser(updateData);
      
      // 성공 시 상태 업데이트
      setUserInfo(updatedUserInfo);
      userInfoUtils.setUserInfo(updatedUserInfo);

      setEditingField(null);
      setTempValue('');
      setTempBankInfo({ bank: '', accountNumber: '' });

      alert('정보가 성공적으로 업데이트되었습니다.');

    } catch (error) {
      console.error('❌ API 호출 실패:', error);
      
      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 403) {
        alert('접근 권한이 없습니다. 토큰을 확인해주세요.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '입력 정보를 확인해주세요.';
        alert(`입력 오류: ${errorMessage}`);
      } else if (error.code === 'ERR_NETWORK') {
        alert('서버에 연결할 수 없습니다. 백엔드 서버 상태를 확인해주세요.');
      } else {
        alert('업데이트 중 오류가 발생했습니다.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
    setTempBankInfo({ bank: '', accountNumber: '' });
  };

  // 비밀번호 변경 모달 관련 함수들
  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordData({
      currentPassword: '',
      newPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      delete: false
    });
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      delete: false
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    try {
      setModalLoading(true);

      const updateData = {
        rawPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };

      await userAPI.updatePassword(updateData);

      alert('비밀번호가 성공적으로 변경되었습니다.');
      closePasswordModal();

    } catch (error) {
      console.error('비밀번호 변경 실패:', error);

      if (error.response?.status === 401) {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '비밀번호 형식을 확인해주세요.';
        alert(`오류: ${errorMessage}`);
      } else {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // 회원탈퇴 모달 관련 함수들
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeletePassword('');
    setShowPasswords({
      current: false,
      new: false,
      delete: false
    });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setShowPasswords({
      current: false,
      new: false,
      delete: false
    });
  };

  const handleAccountDelete = async () => {

    // LOCAL: 비밀번호 입력 필요
    if (userData?.socialType === 'LOCAL') {
      if (!deletePassword.trim()) {
        alert('현재 비밀번호를 입력해주세요.');
        return;
      }
    }

    const confirmDelete = window.confirm(
      '정말로 회원탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setModalLoading(true);

      const refreshToken = sessionStorage.getItem('refreshToken');
      const deleteData = userData?.socialType === 'LOCAL'
          ? { password: deletePassword, refreshToken }
          : { refreshToken };


      await userAPI.deleteUser(deleteData);

      alert('회원탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      authUtils.clearAllAuthData();
      onLogout();

    } catch (error) {
      console.error('회원탈퇴 실패:', error);

      if (error.response?.status === 401) {
        alert('비밀번호가 올바르지 않습니다.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '회원탈퇴 요청을 처리할 수 없습니다.';
        alert(`오류: ${errorMessage}`);
      } else {
        alert('회원탈퇴 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 전화번호 입력 시 자동 포커스 이동
  const handlePhoneInput = (value, setter, nextRef, maxLength) => {
    setter(value);
    if (value.length === maxLength && nextRef) {
      nextRef.current?.focus();
    }
  };

  // 프로필 삭제 모달 관련 함수들
  const openProfileDeleteModal = (profileId) => {
    setSelectedProfileId(profileId);
    setShowProfileDeleteModal(true);
    setProfileDeletePassword('');
    setShowPasswords(prev => ({
      ...prev,
      profileDelete: false
    }));
  };

  const closeProfileDeleteModal = () => {
    setShowProfileDeleteModal(false);
    setSelectedProfileId(null);
    setProfileDeletePassword('');
    setShowPasswords(prev => ({
      ...prev,
      profileDelete: false
    }));
  };

  const handleProfileDelete = async () => {
    if (!selectedProfileId) return;

    // LOCAL: 비밀번호 입력 필요
    if (userData?.socialType === 'LOCAL') {
      if (!profileDeletePassword.trim()) {
        alert('현재 비밀번호를 입력해주세요.');
        return;
      }
    }

    const confirmDelete = window.confirm(
      '정말로 이 프로필을 삭제하시겠습니까?\n삭제된 프로필은 복구할 수 없습니다.'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setModalLoading(true);

      await profileAPI.deleteProfile(selectedProfileId);

      alert('프로필이 성공적으로 삭제되었습니다.');

      // 프로필 목록 새로고침
      await fetchProfiles();

      closeProfileDeleteModal();

    } catch (error) {
      console.error('프로필 삭제 실패:', error);

      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 404) {
        alert('삭제할 프로필을 찾을 수 없습니다.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '프로필 삭제 요청을 처리할 수 없습니다.';
        alert(`오류: ${errorMessage}`);
      } else {
        alert('프로필 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="profile-tab">
      <div className="my-info-card">
        <div className="my-info-card-header">
          <h3>✨ 기본 정보</h3>
        </div>
        <div className="my-info-card-body">
          {/* 이름 - 읽기 전용 */}
          <div className="my-info-item">
            <label>👤 이름</label>
            <span>{userInfo.name}</span>
          </div>

          {/* 닉네임 - 편집 가능 */}
          <div className="my-info-item editable">
            <label>🏷️ 닉네임</label>
            {editingField === 'nickName' ? (
              <div className="edit-field">
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="edit-input"
                  autoFocus
                  placeholder="닉네임을 입력하세요"
                />
                <div className="edit-buttons">
                  <button
                    className="save-btn"
                    onClick={() => handleSaveField('nickName')}
                    disabled={isUpdating}
                  >
                    {isUpdating && editingField === 'nickName' ? (
                      <div className="spinner-small"></div>
                    ) : (
                      '확인'
                    )}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span>{userInfo.nickName}</span>
                <button
                  className="my-edit-btn"
                  onClick={() => handleEditField('nickName')}
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 이메일 - 읽기 전용 */}
          <div className="my-info-item">
            <label>📧 이메일</label>
            <span>{userInfo.email}</span>
          </div>

          {/* 전화번호 - 편집 가능 */}
          <div className="my-info-item editable">
            <label>📱 전화번호</label>
            {editingField === 'phoneNumber' ? (
              <div className="edit-field">
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
                <div className="edit-buttons">
                  <button
                    className="save-btn"
                    onClick={() => handleSaveField('phoneNumber')}
                    disabled={isUpdating}
                  >
                    {isUpdating && editingField === 'phoneNumber' ? (
                      <div className="spinner-small"></div>
                    ) : (
                      '확인'
                    )}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span>{userInfo.phoneNumber}</span>
                <button
                  className="my-edit-btn"
                  onClick={() => handleEditField('phoneNumber')}
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 멘토인 경우에만 은행 정보 표시 */}
          {userInfo.userRole === 'MENTOR' && (
            <div className="my-info-item editable">
              <label>🏦 은행 정보</label>
              {editingField === 'bankInfo' ? (
                <div className="edit-field bank-edit">
                  <select
                    value={tempBankInfo.bank}
                    onChange={(e) => setTempBankInfo({
                      ...tempBankInfo,
                      bank: e.target.value
                    })}
                    className="bank-select"
                  >
                    <option value="">🏦 은행을 선택하세요</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={tempBankInfo.accountNumber}
                    onChange={(e) => setTempBankInfo({
                      ...tempBankInfo,
                      accountNumber: e.target.value
                    })}
                    className="edit-input"
                    placeholder="💳 계좌번호를 입력하세요"
                  />
                  <div className="edit-buttons">
                    <button
                      className="save-btn"
                      onClick={() => handleSaveField('bankInfo')}
                      disabled={isUpdating}
                    >
                      {isUpdating && editingField === 'bankInfo' ? (
                        <div className="spinner-small"></div>
                      ) : (
                        '확인'
                      )}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field-display">
                  <span>
                    {userInfo.bank && userInfo.accountNumber
                      ? `${userInfo.bank} ${userInfo.accountNumber}`
                      : '은행 정보가 등록되지 않았습니다'
                    }
                  </span>
                  <button
                    className="my-edit-btn"
                    onClick={() => handleEditField('bankInfo')}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 멘토인 경우에만 프로필 목록 표시 */}
          {userInfo.userRole === 'MENTOR' && profiles.length > 0 && (
            <div className="info-item">
              <label>📝 내 프로필 목록</label>
              <div className="profile-list">
                {profiles.map((profile) => (
                  <div key={profile.id} className="profile-item">
                    <div className="profile-info">
                      <span className="profile-title">{profile.title}</span>
                      <span className="profile-category">{profile.categoryName}</span>
                    </div>
                    <button
                      className="profile-delete-btn"
                      onClick={() => openProfileDeleteModal(profile.id)}
                      title="프로필 삭제"
                    >
                      <UserX size={16} />
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 읽기 전용 필드들 */}
          <div className="my-info-item">
            <label>📅 가입일</label>
            <span>{userInfo.createdAt}</span>
          </div>
          <div className="my-info-item">
            <label>🎯 사용자 유형</label>
            <span>{userInfo.userRole === 'MENTOR' ? '🎓 멘토' : '👨‍🎓 멘티'}</span>
          </div>
        </div>
      </div>

      {/* 계정 관리 버튼들 */}
      <div className="account-actions">
        {userData?.socialType === 'LOCAL' && (
          <button
            className="password-change-btn"
            onClick={openPasswordModal}
          >
            <Key className="icon" />
            🔐 비밀번호 수정
          </button>
        )}

        <button
          className="account-delete-btn"
          onClick={openDeleteModal}
        >
          <UserX className="icon" />
          ❌ 회원탈퇴
        </button>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && userData?.socialType === 'LOCAL' && (
        <div className="my-modal-overlay" onClick={closePasswordModal}>
          <div className="my-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="my-modal-header">
              <h3>비밀번호 변경</h3>
              <button className="my-modal-close" onClick={closePasswordModal}>
                <X size={24} />
              </button>
            </div>

            <div className="my-modal-body">
              <div className="password-field"> {/* 현재 비밀번호 */}
                <label>현재 비밀번호</label>
                <div className="custom-password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="custom-password-input"
                  />
                  <button
                    type="button"
                    className="custom-password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="password-field"> {/* 새 비밀번호 */}
                <label>새 비밀번호</label>
                <div className="custom-password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    className="custom-password-input"
                  />
                  <button
                    type="button"
                    className="custom-password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="my-modal-footer">
              <button
                className="my-modal-btn cancel"
                onClick={closePasswordModal}
                disabled={modalLoading}
              >
                취소
              </button>
              <button
                className="my-modal-btn confirm"
                onClick={handlePasswordChange}
                disabled={modalLoading || !passwordData.currentPassword || !passwordData.newPassword}
              >
                {modalLoading ? (
                  <div className="spinner-small"></div>
                ) : (
                  '변경하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 모달 */}
      {showDeleteModal && (
        <div className="my-modal-overlay" onClick={closeDeleteModal}>
          <div className="my-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="my-modal-header">
              <h3>회원탈퇴</h3>
              <button className="my-modal-close" onClick={closeDeleteModal}>
                <X size={24} />
              </button>
            </div>

            <div className="my-modal-body">
              <div className="warning-message">
                <div className="warning-icon">
                  <UserX size={48} />
                </div>
                <h4>정말로 회원탈퇴를 하시겠습니까?</h4>
                <p>회원탈퇴 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
                <ul className="warning-list">
                  <li>프로필 정보</li>
                  <li>예약 및 결제 내역</li>
                  <li>멘토링 대화 기록</li>
                  <li>기타 모든 활동 데이터</li>
                </ul>
              </div>

              {userData?.socialType === 'LOCAL' && (
                <div className="password-field">
                  <label>현재 비밀번호를 입력하여 본인임을 확인해주세요</label>
                  <div className="custom-password-input-container">
                    <input
                      type={showPasswords.delete ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="custom-password-input"
                    />
                    <button
                      type="button"
                      className="custom-password-toggle"
                      onClick={() => togglePasswordVisibility('delete')}
                    >
                      {showPasswords.delete ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="my-modal-footer">
              <button
                className="my-modal-btn cancel"
                onClick={closeDeleteModal}
                disabled={modalLoading}
              >
                취소
              </button>
              <button
                className="my-modal-btn delete"
                onClick={handleAccountDelete}
                disabled={modalLoading || (userData?.socialType === 'LOCAL' && !deletePassword)}
              >
                {modalLoading ? (
                  <div className="spinner-small"></div>
                ) : (
                  '회원탈퇴'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 삭제 모달 */}
      {showProfileDeleteModal && (
        <div className="modal-overlay" onClick={closeProfileDeleteModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>프로필 삭제</h3>
              <button className="modal-close" onClick={closeProfileDeleteModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-message">
                <div className="warning-icon">
                  <UserX size={48} />
                </div>
                <h4>정말로 이 프로필을 삭제하시겠습니까?</h4>
                <p>프로필 삭제 시 관련된 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
                <ul className="warning-list">
                  <li>프로필 정보</li>
                  <li>경력 정보</li>
                  <li>상담 가능 시간</li>
                  <li>해당 프로필로 받은 예약</li>
                  <li>리뷰 및 평점</li>
                </ul>
              </div>

              {userData?.socialType === 'LOCAL' && (
                <div className="password-field">
                  <label>현재 비밀번호를 입력하여 본인임을 확인해주세요</label>
                  <div className="custom-password-input-container">
                    <input
                      type={showPasswords.profileDelete ? "text" : "password"}
                      value={profileDeletePassword}
                      onChange={(e) => setProfileDeletePassword(e.target.value)}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="custom-password-input"
                    />
                    <button
                      type="button"
                      className="custom-password-toggle"
                      onClick={() => togglePasswordVisibility('profileDelete')}
                    >
                      {showPasswords.profileDelete ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn cancel"
                onClick={closeProfileDeleteModal}
                disabled={modalLoading}
              >
                취소
              </button>
              <button
                className="modal-btn delete"
                onClick={handleProfileDelete}
                disabled={modalLoading || (userData?.socialType === 'LOCAL' && !profileDeletePassword)}
              >
                {modalLoading ? (
                  <div className="spinner-small"></div>
                ) : (
                  '프로필 삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicInfo;
