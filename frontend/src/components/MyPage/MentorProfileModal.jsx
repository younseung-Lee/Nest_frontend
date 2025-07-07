import React, { useState, useEffect } from 'react';
import  {categoryAPI, keywordAPI} from '../../services/api';
import './MentorProfileModal.css';

const MentorProfileModal = ({ onClose, onSubmit, existingProfiles = [] }) => {
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [keywordId, setKeywordId] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [submitError, setSubmitError] = useState(''); // 백엔드 에러용
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리 목록 가져오기
  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      const fetchedCategories = response.data.data.content;

      if (Array.isArray(fetchedCategories)) {
        setCategories(fetchedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      setCategories([]);
      alert('카테고리 목록을 불러오는데 실패했습니다.');
    }
  };

  // 키워드 목록 가져오기
  const fetchKeywords = async () => {
    try {
      const response = await keywordAPI.getKeywords();
      const fetchedKeywords = response.data.data.content;

      if (Array.isArray(fetchedKeywords)) {
        setKeywords(fetchedKeywords);
      } else {
        setKeywords([]);
      }
    } catch (err) {
      setKeywords([]);
      alert("키워드 목록을 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchKeywords();
  }, []);

  const handleKeywordChange = (e) => {
    const selectedKeywordId = Number(e.target.value);
    const isChecked = e.target.checked;

    setKeywordId(prev => {
      if (isChecked) {
        return prev.includes(selectedKeywordId) ? prev : [...prev, selectedKeywordId];
      } else {
        return prev.filter(id => id !== selectedKeywordId);
      }
    });
  };

  const handleCategoryChange = (e) => {
    const selectedCategoryId = parseInt(e.target.value);
    setCategoryId(e.target.value);
    setCategoryError('');

    // 중복 카테고리 체크
    if (selectedCategoryId && existingProfiles.length > 0 && categories.length > 0) {
      // 선택된 카테고리의 이름 찾기
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      const selectedCategoryName = selectedCategory?.name;

      if (selectedCategoryName) {
        // 기존 프로필에서 같은 카테고리 이름을 가진 것이 있는지 확인
        const existingProfile = existingProfiles.find(profile => {
          const profileCategoryName = typeof profile.category === 'string'
            ? profile.category
            : profile.category?.name;

          return profileCategoryName === selectedCategoryName;
        });

        if (existingProfile) {
          setCategoryError('이미 존재하는 카테고리입니다');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기존 에러 초기화
    setSubmitError('');

    // 입력 데이터 유효성 검사
    if (!title.trim()) {
      alert('프로필 제목을 입력해주세요.');
      return;
    }

    if (!introduction.trim()) {
      alert('프로필 소개를 입력해주세요.');
      return;
    }

    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    // 프론트엔드 중복 카테고리 체크
    if (categoryError) {
      return; // 이미 에러가 표시되어 있으면 제출하지 않음
    }

    // 요청 데이터 준비
    const submitData = {
      title: title.trim(),
      introduction: introduction.trim(),
      imageUrl: imageUrl.trim(),
      keywordId,
      categoryId: parseInt(categoryId)
    };

    try {
      setIsSubmitting(true);
      await onSubmit(submitData); // ✅ 한 번만 호출
      onClose(); // ✅ 성공 시에만 모달 닫기
    } catch (error) {
      // 백엔드에서 에러가 발생한 경우 모달 내부에서 처리
      if (error?.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.message && errorData.message.includes('이미')) {
          setSubmitError('서버에서 중복 카테고리가 감지되었습니다. 다른 카테고리를 선택해주세요.');
        } else {
          setSubmitError(errorData?.message || '입력 정보를 확인해주세요.');
        }
      } else {
        setSubmitError('프로필 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="mentor-profile-registration-modal-backdrop">
        <div className="mentor-profile-registration-modal">
          <h2>멘토 프로필 등록</h2>
          <form onSubmit={handleSubmit}>
            <label>
              제목
              <input value={title} onChange={e => setTitle(e.target.value)} required />
            </label>
            <label>
              소개
              <textarea value={introduction} onChange={e => setIntroduction(e.target.value)} required />
            </label>
            {/* ⭐️ 계좌 번호 입력 필드 제거 */}
            <label>
              키워드
              <div>
                {keywords.length > 0 ? (
                    keywords.map(k => (
                        <label key={k.id} style={{ marginRight: 8 }}>
                          <input
                              type="checkbox"
                              value={k.id}
                              checked={keywordId.includes(Number(k.id))}
                              onChange={handleKeywordChange}
                          />
                          {k.name}
                        </label>
                    ))
                ) : (
                    <p>키워드를 불러오는 중이거나 없습니다.</p>
                )}
              </div>
            </label>
            <label>
              카테고리
              <select
                value={categoryId}
                onChange={handleCategoryChange}
                required
                className={categoryError ? 'error' : ''}
              >
                <option value="">선택</option>
                {categories.length > 0 ? (
                    categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                ) : (
                    <option disabled>카테고리를 불러오는 중이거나 없습니다.</option>
                )}
              </select>
            </label>
            {categoryError && (
              <div className="category-error-message">
                {categoryError}
              </div>
            )}
            {submitError && (
              <div className="submit-error-message">
                {submitError}
              </div>
            )}
            <div className="modal-btns">
              <button type="button" onClick={onClose} disabled={isSubmitting}>
                취소
              </button>
              <button
                type="submit"
                disabled={!!categoryError || isSubmitting}
                className={categoryError || isSubmitting ? 'disabled' : ''}
              >
                {isSubmitting && <span className="loading-spinner"></span>}
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default MentorProfileModal;
