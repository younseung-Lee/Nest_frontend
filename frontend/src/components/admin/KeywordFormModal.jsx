import React, { useState, useEffect } from 'react';
import './CouponFormModal.css';

const KeywordFormModal = ({ keyword, onSave, onClose, saving }) => {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{keyword ? '키워드 수정' : '새 키워드 등록'}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>키워드 이름 *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: React, Spring Boot, Python"
              required
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? '저장 중...' : (keyword ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeywordFormModal;