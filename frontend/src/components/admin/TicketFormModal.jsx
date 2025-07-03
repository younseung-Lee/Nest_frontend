import React, { useState, useEffect } from 'react';
import './CouponFormModal.css';

const TicketFormModal = ({ ticket, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    ticketTime: '',
    description: '',
  });

  useEffect(() => {
    if (ticket) {
      setForm({
        id: ticket.id,
        name: ticket.name || '',
        price: ticket.price || '',
        ticketTime: ticket.ticketTime || '',
        description: ticket.description || '',
      });
    } else {
      // 새로 생성할 때는 폼 초기화
      setForm({
        name: '',
        price: '',
        ticketTime: '',
        description: '',
      });
    }
  }, [ticket]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 이용권 폼 제출 시작:', form);
    
    // 필수 항목 검증
    if (!form.name || !form.price || !form.ticketTime) {
      console.warn('⚠️ 필수 항목 누락:', {
        name: !!form.name,
        price: !!form.price,
        ticketTime: !!form.ticketTime
      });
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    console.log('🔍 폼 데이터 확인:', {
      hasId: !!form.id,
      id: form.id,
      isEdit: !!ticket
    });

    // 가격 검증
    if (form.price <= 0) {
      alert('가격은 0보다 큰 값이어야 합니다.');
      return;
    }

    // 제출 데이터 준비
    const submitData = {
      ...form,
      price: parseInt(form.price),
    };

    console.log('✅ 최종 제출 데이터:', submitData);
    onSave(submitData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{ticket ? '이용권 수정' : '새 이용권 등록'}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>이용권 이름 *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: 1회 상담권"
              required
            />
          </div>

          <div className="form-group">
            <label>가격 *</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="30000"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>시간 *</label>
            <select
              name="ticketTime"
              value={form.ticketTime}
              onChange={handleChange}
              required
            >
              <option value="">시간을 선택하세요</option>
              <option value="MINUTES_20">20분</option>
              <option value="MINUTES_30">30분</option>
              <option value="MINUTES_40">40분</option>
            </select>
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="이용권에 대한 상세 설명을 입력하세요"
              rows="4"
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
              {saving ? '저장 중...' : (ticket ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketFormModal;