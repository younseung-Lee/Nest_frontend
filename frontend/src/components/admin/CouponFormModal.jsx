import React, { useState, useEffect } from 'react';
import './CouponFormModal.css';

const CouponFormModal = ({ coupon, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    name: '',
    discountAmount: '',
    discountType: 'FIXED_AMOUNT', // 할인 타입 (기본값: 금액 할인)
    totalQuantity: '', //총 쿠폰 수
    issuedQuantity: '', // 발급된 쿠폰 수
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
      <div className="modal-overlay">
        <div className="modal">
          <h3>{coupon ? '쿠폰 수정' : '쿠폰 등록'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" data-field="name">
              <label htmlFor="name">쿠폰명</label>
              <input 
                id="name"
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="예: 신규가입 환영 쿠폰"
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="discountType">할인 타입</label>
                <select
                  id="discountType"
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  required
                >
                  <option value="FIXED_AMOUNT">금액 할인</option>
                  <option value="PERCENT_AMOUNT">퍼센트 할인</option>
                </select>
              </div>

              <div className="form-group" data-field="discountAmount">
                <label htmlFor="discountAmount">
                  할인 {form.discountType === 'FIXED_AMOUNT' ? '금액 (₩)' : '퍼센트 (%)'}
                </label>
                <input
                  id="discountAmount"
                  name="discountAmount"
                  type="number"
                  min="1"
                  max={form.discountType === 'PERCENT_AMOUNT' ? 100 : undefined}
                  value={form.discountAmount}
                  onChange={handleChange}
                  placeholder={form.discountType === 'FIXED_AMOUNT' ? '5000' : '10'}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalQuantity">총 쿠폰 수</label>
                <input
                  id="totalQuantity"
                  name="totalQuantity"
                  type="number"
                  min="1"
                  value={form.totalQuantity}
                  onChange={handleChange}
                  placeholder="1000"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="issuedQuantity">발급된 쿠폰 수</label>
                <input
                  id="issuedQuantity"
                  name="issuedQuantity"
                  type="number"
                  min="0"
                  value={form.issuedQuantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validFrom">유효 시작일</label>
                <input 
                  id="validFrom"
                  name="validFrom" 
                  type="date" 
                  value={form.validFrom} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="validTo">유효 종료일</label>
                <input 
                  id="validTo"
                  name="validTo" 
                  type="date" 
                  value={form.validTo} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minGrade">최소 등급</label>
                <select
                  id="minGrade"
                  name="minGrade"
                  value={form.minGrade}
                  onChange={handleChange}
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

              <div className="form-group">
                <label htmlFor="minOrderAmount">최소 주문 금액 (₩)</label>
                <input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  placeholder="10000"
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={onClose} 
                disabled={saving}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default CouponFormModal;