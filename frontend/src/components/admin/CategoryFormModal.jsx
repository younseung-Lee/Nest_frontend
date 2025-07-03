import React, { useState, useEffect } from 'react';
import './CouponFormModal.css';

const CategoryFormModal = ({ category, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    name: '',
  });

  useEffect(() => {
    if (category) {
      setForm({
        id: category.id,
        name: category.name || '',
      });
    } else {
      // 새로 생성할 때는 폼 초기화
      setForm({
        name: '',
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 카테고리 폼 제출 시작:', form);
    
    // 필수 항목 검증
    if (!form.name || form.name.trim() === '') {
      console.warn('⚠️ 필수 항목 누락:', {
        name: !!form.name
      });
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    console.log('🔍 폼 데이터 확인:', {
      hasId: !!form.id,
      id: form.id,
      isEdit: !!category
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
          <h3>{category ? '카테고리 수정' : '새 카테고리 등록'}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>카테고리 이름 *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: 프론트엔드, 백엔드, DevOps"
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
              {saving ? '저장 중...' : (category ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;