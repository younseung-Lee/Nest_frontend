import React, { useState, useEffect } from 'react';
import { Hash, RefreshCw } from 'lucide-react';
import './AdminCommon.css';

const KeywordFormModal = ({ keyword, onSave, onClose, saving, isDarkMode }) => {
  const [form, setForm] = useState({
    name: '',
  });

  useEffect(() => {
    if (keyword) {
      setForm({
        id: keyword.id,
        name: keyword.name || '',
      });
    } else {
      // 새로 생성할 때는 폼 초기화
      setForm({
        name: '',
      });
    }
  }, [keyword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 키워드 폼 제출 시작:', form);
    
    // 필수 항목 검증
    if (!form.name || form.name.trim() === '') {
      console.warn('⚠️ 필수 항목 누락:', {
        name: !!form.name
      });
      alert('키워드 이름을 입력해주세요.');
      return;
    }

    console.log('🔍 폼 데이터 확인:', {
      hasId: !!form.id,
      id: form.id,
      isEdit: !!keyword
    });

    // 제출 데이터 준비
    const submitData = {
      ...form,
      name: form.name.trim(),
    };

    console.log('✅ 최종 제출 데이터:', submitData);
    onSave(submitData);
  };

  return (
    <div className={`form-modal-overlay ${isDarkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="form-modal-content admin-keyword-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h3>{keyword ? '키워드 수정' : '새 키워드 등록'}</h3>
          <button className="form-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-modal-body">
          {saving ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={24} />
              <p>저장 중...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="admin-keyword-form">
              <div className="info-section">
                <h4>키워드 이름</h4>
                <div className="info-grid">
                    <div className="info-value">
                      <Hash size={16} />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="예: React, Spring Boot, Python"
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
            </form>
          )}
        </div>
        <div className="form-modal-actions">
          <div className="status-actions">
            <button 
              type="button" 
              className="coffee-btn coffee-btn-secondary" 
              onClick={onClose}
              disabled={saving}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="coffee-btn coffee-btn-primary" 
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? '저장 중...' : (keyword ? '수정' : '등록')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordFormModal;