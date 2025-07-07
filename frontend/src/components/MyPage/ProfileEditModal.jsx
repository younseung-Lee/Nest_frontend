import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { profileAPI } from '../../services/api';
import { authUtils } from '../../utils/tokenUtils';
import './ProfileEditModal.css';

const ProfileEditModal = ({ profile, categories, keywords, onClose, onUpdate, onLogout }) => {
  const [editProfileData, setEditProfileData] = useState({
    title: '',
    introduction: '',
    imageUrl: '',
    category: '',
    keywordId: []
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      const initialSelectedKeywordIds = profile.keywords && Array.isArray(profile.keywords) 
        ? profile.keywords.map(keyword => keyword.id) 
        : [];

      setEditProfileData({
        title: profile.title || '',
        introduction: profile.introduction || '',
        imageUrl: profile.imageUrl || '',
        category: profile.category || '',
        keywordId: initialSelectedKeywordIds
      });
    }
  }, [profile]);

  // 이미지 파일 선택 처리
  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 형식 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setSelectedImageFile(file);

      // 파일을 읽어서 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditProfileData({
          ...editProfileData,
          imageUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const removeSelectedImage = () => {
    setSelectedImageFile(null);
    setEditProfileData({
      ...editProfileData,
      imageUrl: ''
    });
  };

  // 키워드 선택 토글
  const toggleKeyword = (keywordId) => {
    setEditProfileData(prev => ({
      ...prev,
      keywordId: prev.keywordId.includes(keywordId)
        ? prev.keywordId.filter(id => id !== keywordId)
        : [...prev.keywordId, keywordId]
    }));
  };

  // 프로필 업데이트 처리
  const handleUpdateProfile = async () => {
    if (!profile) return;

    if (!editProfileData.title.trim()) {
      alert('프로필 제목을 입력해주세요.');
      return;
    }

    if (!editProfileData.introduction.trim()) {
      alert('프로필 소개를 입력해주세요.');
      return;
    }

    let selectedCategoryIdToUpdate = null;
    if (editProfileData.category) {
      const foundCategory = categories.find(cat => cat.name === editProfileData.category);
      if (foundCategory) {
        selectedCategoryIdToUpdate = foundCategory.id;
      } else {
        alert("유효하지 않은 카테고리입니다. 다시 선택해주세요.");
        return;
      }
    }

    try {
      setIsUpdating(true);

      let imageUrl = editProfileData.imageUrl;

      // 새로운 이미지 파일이 선택된 경우 (실제 파일 업로드)
      if (selectedImageFile) {
        // TODO: 이미지 업로드 API 호출
        console.log('📸 이미지 파일이 선택됨:', selectedImageFile.name);
        // imageUrl은 이미 FileReader로 읽은 Base64 데이터가 들어있음
      }

      const updateData = {
        title: editProfileData.title.trim(),
        introduction: editProfileData.introduction.trim(),
        imageUrl: imageUrl || '',
        categoryId: selectedCategoryIdToUpdate,
        keywordId: editProfileData.keywordId,
      };

      console.log('📤 프로필 업데이트 요청:', {
        profileId: profile.id,
        data: updateData
      });

      // API 호출
      const response = await profileAPI.updateProfile(profile.id, updateData);
      console.log('📥 프로필 업데이트 응답:', response);

      // 성공 시 부모 컴포넌트에 업데이트된 프로필 전달
      const updatedProfile = {
        ...profile,
        ...updateData,
        keywords: keywords.filter(kw => editProfileData.keywordId.includes(kw.id))
          .map(kw => ({ id: kw.id, name: kw.name })),
        category: editProfileData.category
      };

      onUpdate(updatedProfile);
      alert('프로필이 성공적으로 수정되었습니다.');
      onClose();

    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);

      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        authUtils.clearAllAuthData();
        onLogout();
      } else if (error.response?.status === 403) {
        alert('프로필 수정 권한이 없습니다.');
      } else if (error.response?.status === 404) {
        alert('프로필을 찾을 수 없습니다.');
      } else {
        alert('프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>프로필 수정</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-edit-form">
            <div className="form-group">
              <label>✨ 프로필 제목</label>
              <input
                type="text"
                value={editProfileData.title}
                onChange={(e) => setEditProfileData({
                  ...editProfileData,
                  title: e.target.value
                })}
                placeholder="매력적인 프로필 제목을 입력하세요"
                className="form-input"
                maxLength={100}
              />
              <span className="char-count">{editProfileData.title.length}/100</span>
            </div>

            <div className="form-group">
              <label>📝 소개글</label>
              <textarea
                value={editProfileData.introduction}
                onChange={(e) => setEditProfileData({
                  ...editProfileData,
                  introduction: e.target.value
                })}
                placeholder="자신의 전문성과 경험을 어필하는 소개글을 작성해보세요"
                className="form-textarea"
                maxLength={1000}
                rows={6}
              />
              <span className="char-count">{editProfileData.introduction.length}/1000</span>
            </div>

            <div className="form-group">
              <label>🏷️ 카테고리</label>
              <select
                value={editProfileData.category}
                onChange={(e) => setEditProfileData({
                  ...editProfileData,
                  category: e.target.value
                })}
                className="form-select"
              >
                <option value="">카테고리를 선택하세요</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>🔖 키워드 (복수 선택 가능)</label>
              <div className="keywords-select-grid">
                {Array.isArray(keywords) && keywords.map((keyword) => (
                  <label key={keyword.id} className="keyword-checkbox">
                    <input
                      type="checkbox"
                      checked={editProfileData.keywordId.includes(keyword.id)}
                      onChange={() => toggleKeyword(keyword.id)}
                    />
                    <span className="keyword-label">{keyword.name}</span>
                  </label>
                ))}
              </div>
              {editProfileData.keywordId.length > 0 && (
                <>
                  <p className="selected-count">
                    {editProfileData.keywordId.length}개 선택됨
                  </p>
                  <div className="selected-keywords">
                    {keywords
                      .filter(kw => editProfileData.keywordId.includes(kw.id))
                      .map(kw => (
                        <span className="keyword-tag" key={kw.id}>{kw.name}</span>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn cancel"
            onClick={onClose}
            disabled={isUpdating}
          >
            취소
          </button>
          <button
            className="modal-btn confirm"
            onClick={handleUpdateProfile}
            disabled={isUpdating || !editProfileData.title.trim() || !editProfileData.introduction.trim()}
          >
            {isUpdating ? (
              <div className="spinner-small"></div>
            ) : (
              '수정하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
