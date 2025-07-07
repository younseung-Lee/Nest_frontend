import React, { useState } from 'react';
import { Save, X, Upload, Calendar, Building2 } from 'lucide-react';
import './CareerEditModal.css';
import { careerAPI } from '../../services/api';

const CareerEditModal = ({ 
  career, 
  isOpen, 
  onClose, 
  onSave, 
  profiles, 
  selectedProfileId, 
  setSelectedProfileId 
}) => {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    company: career?.company || '',
    startAt: career?.startAt?.slice(0, 10) || '',
    endAt: career?.endAt?.slice(0, 10) || '',
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  // 오늘 날짜를 max 속성에 사용할 변수로 선언
  const today = getTodayDate();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const isEditing = career?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 날짜 유효성 검사 추가: 시작일이 종료일보다 늦을 수 없음 (종료일이 있는 경우)
    if (formData.startAt && formData.endAt && new Date(formData.startAt) > new Date(formData.endAt)) {
      alert('시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    if (!isEditing) {
      // 추가 모드: 직접 API 호출
      try {
        if (!selectedProfileId) {
          alert('프로필을 선택하세요.');
          return;
        }
        const form = new FormData();
        form.append('dto', new Blob([JSON.stringify({
          company: formData.company,
          startAt: formData.startAt ? formData.startAt + 'T00:00:00' : null,
          endAt: formData.endAt ? formData.endAt + 'T00:00:00' : null,
        })], { type: 'application/json' }));
        if (file) {
          form.append('files', file);
        }
        await careerAPI.createCareer(selectedProfileId, form);
        alert('경력이 성공적으로 추가되었습니다.');
        onSave && onSave();
        onClose();
      } catch (err) {
        alert('경력 추가에 실패했습니다.');
        console.error(err);
      }
      return;
    }
    // 수정 모드
    try {
      await careerAPI.updateCareer(career.id, {
        company: formData.company,
        startAt: formData.startAt ? formData.startAt + 'T00:00:00' : null,
        endAt: formData.endAt ? formData.endAt + 'T00:00:00' : null,
      });
      alert('경력 정보가 성공적으로 수정되었습니다.');
      onSave && onSave();
      onClose();
    } catch (err) {
      alert('경력 정보 수정에 실패했습니다.');
      console.error(err);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="career-edit-modal-backdrop" onClick={handleBackdropClick}>
      <div className="career-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="career-edit-modal-header">
          <h2>
            <Building2 size={24} />
            {isEditing ? '경력 수정' : '새 경력 추가'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="career-edit-form">
          <div className="career-edit-modal-content">
            {/* 프로필 선택 (새 경력 추가 시에만) */}
            {profiles && profiles.length > 0 && !isEditing && (
              <div className="form-group">
                <label htmlFor="profile-select">
                  <span className="form-label">프로필 선택</span>
                  <span className="required">*</span>
                </label>
                <select 
                  id="profile-select"
                  value={selectedProfileId} 
                  onChange={e => setSelectedProfileId(e.target.value)} 
                  required
                  className="form-select"
                >
                  <option value="">프로필을 선택하세요</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.title || profile.name || `프로필 ${profile.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 회사명 */}
            <div className="form-group">
              <label htmlFor="company">
                <span className="form-label">회사명</span>
                <span className="required">*</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                required
                className="form-input"
              />
            </div>

            {/* 시작일과 종료일 */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startAt">
                  <Calendar size={16} />
                  <span className="form-label">시작일</span>
                  <span className="required">*</span>
                </label>
                <input
                  id="startAt"
                  name="startAt"
                  type="date"
                  value={formData.startAt}
                  onChange={handleChange}
                  required
                  className="form-input date-input"
                  max={today}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endAt">
                  <Calendar size={16} />
                  <span className="form-label">종료일</span>
                </label>
                <input
                  id="endAt"
                  name="endAt"
                  type="date"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="form-input date-input"
                  placeholder="재직중인 경우 비워두세요"
                  max={today}
                />
              </div>
            </div>

            {/* 파일 업로드 (추가 모드에서만) */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="file-upload">
                  <span className="form-label">관련 파일</span>
                </label>
                <div className="file-upload-container">
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="file-input"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-upload" className="file-upload-button">
                    파일 선택
                  </label>
                  {fileName && (
                    <span className="file-name">{fileName}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="career-edit-modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              <X size={18} />
              취소
            </button>
            <button type="submit" className="save-button">
              <Save size={18} />
              {isEditing ? '수정 완료' : '추가 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CareerEditModal;
