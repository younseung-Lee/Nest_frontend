import React, { useState, useEffect } from 'react';
import { Ticket, Percent, DollarSign, Calendar, Users, RefreshCw } from 'lucide-react';
import './AdminCommon.css';

const CouponFormModal = ({ coupon, onSave, onClose, saving, isDarkMode }) => {
  const [form, setForm] = useState({
    name: '',
    discountAmount: '',
    discountType: 'FIXED_AMOUNT', // 할인 타입 (기본값: 금액 할인)
    totalQuantity: '', //총 쿠폰 수
    issuedQuantity: 0, // 발급된 쿠폰 수
    validFrom: '', // 유효 시작일
    validTo: '',  // 유효 종료일
    minGrade: '',
    minOrderAmount: '' // 최소 주문 금액
  });

  useEffect(() => {
    if (coupon) {
      setForm({
        ...coupon,
        validFrom: coupon.validFrom?.split('T')[0] || '',
        validTo: coupon.validTo?.split('T')[0] || '',
      });
    }
  }, [coupon]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 폼 제출 시작:', form);
    
    // 필수 항목 검증
    if (!form.name || !form.validFrom || !form.validTo || !form.minGrade || !form.minOrderAmount) {
      console.warn('⚠️ 필수 항목 누락:', {
        name: !!form.name,
        validFrom: !!form.validFrom,
        validTo: !!form.validTo,
        minGrade: !!form.minGrade,
        minOrderAmount: !!form.minOrderAmount
      });
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    // 할인 금액 검증
    if (!form.discountAmount || form.discountAmount <= 0) {
      console.warn('⚠️ 할인 금액이 유효하지 않음:', form.discountAmount);
      alert('할인 금액을 올바르게 입력해주세요.');
      return;
    }
    
    // 퍼센트 할인인 경우 100% 초과하지 않도록 검증
    if (form.discountType === 'PERCENT_AMOUNT' && form.discountAmount > 100) {
      console.warn('⚠️ 퍼센트 할인이 100%를 초과함:', form.discountAmount);
      alert('퍼센트 할인은 100%를 초과할 수 없습니다.');
      return;
    }
    
    // 총 쿠폰 수 검증
    if (!form.totalQuantity || form.totalQuantity <= 0) {
      console.warn('⚠️ 총 쿠폰 수가 유효하지 않음:', form.totalQuantity);
      alert('총 쿠폰 수를 올바르게 입력해주세요.');
      return;
    }
    
    // 날짜를 DateTime 형식으로 변환
    const formattedData = {
      ...form,
      validFrom: form.validFrom ? new Date(form.validFrom + 'T00:00:00').toISOString() : null,
      validTo: form.validTo ? new Date(form.validTo + 'T23:59:59').toISOString() : null,
    };
    
    console.log('✅ 유효성 검사 통과, DateTime 변환 완료:', formattedData);
    onSave(formattedData);
  };

  return (
    <div className={`form-modal-overlay ${isDarkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="form-modal-content admin-coupon-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h3>{coupon ? '쿠폰 수정' : '새 쿠폰 등록'}</h3>
          <button className="form-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-modal-body">
          {saving ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={24} />
              <p>저장 중...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="admin-coupon-form">
              <div className="info-section">
                <h4>쿠폰 기본 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>쿠폰명</label>
                    <div className="info-value">
                      <Ticket size={16} />
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="예: 신규가입 환영 쿠폰"
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>할인 타입</label>
                    <div className="info-value">
                      <Percent size={16} />
                      <select
                        name="discountType"
                        value={form.discountType}
                        onChange={handleChange}
                        className="coffee-form-select"
                        required
                      >
                        <option value="FIXED_AMOUNT">금액 할인</option>
                        <option value="PERCENT_AMOUNT">퍼센트 할인</option>
                      </select>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>할인 {form.discountType === 'FIXED_AMOUNT' ? '금액 (₩)' : '퍼센트 (%)'}</label>
                    <div className="info-value">
                      <DollarSign size={16} />
                      <input
                        name="discountAmount"
                        type="number"
                        min="1"
                        max={form.discountType === 'PERCENT_AMOUNT' ? 100 : undefined}
                        value={form.discountAmount}
                        onChange={handleChange}
                        placeholder={form.discountType === 'FIXED_AMOUNT' ? '5000' : '10'}
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>총 쿠폰 수</label>
                    <div className="info-value">
                      <Users size={16} />
                      <input
                        name="totalQuantity"
                        type="number"
                        min="1"
                        value={form.totalQuantity}
                        onChange={handleChange}
                        placeholder="1000"
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>유효 시작일</label>
                    <div className="info-value">
                      <Calendar size={16} />
                      <input
                        name="validFrom"
                        type="date"
                        value={form.validFrom}
                        onChange={handleChange}
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>유효 종료일</label>
                    <div className="info-value">
                      <Calendar size={16} />
                      <input
                        name="validTo"
                        type="date"
                        value={form.validTo}
                        onChange={handleChange}
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>최소 등급</label>
                    <div className="info-value">
                      <Users size={16} />
                      <select
                        name="minGrade"
                        value={form.minGrade}
                        onChange={handleChange}
                        className="coffee-form-select"
                        required
                      >
                        <option value="">등급을 선택하세요</option>
                        <option value="SEED">SEED (씨앗)</option>
                        <option value="SPROUT">SPROUT (새싹)</option>
                        <option value="BRANCH">BRANCH (가지)</option>
                        <option value="BLOOM">BLOOM (꽃)</option>
                        <option value="NEST">NEST (둥지)</option>
                      </select>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>최소 주문 금액 (₩)</label>
                    <div className="info-value">
                      <DollarSign size={16} />
                      <input
                        name="minOrderAmount"
                        type="number"
                        min="0"
                        value={form.minOrderAmount}
                        onChange={handleChange}
                        placeholder="10000"
                        className="coffee-form-input"
                        required
                      />
                    </div>
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
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponFormModal;