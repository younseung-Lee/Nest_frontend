import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, FileText, RefreshCw } from 'lucide-react';
import './AdminCommon.css';

const TicketFormModal = ({ ticket, onSave, onClose, saving, isDarkMode }) => {
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
    <div className={`form-modal-overlay ${isDarkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="form-modal-content admin-ticket-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h3>{ticket ? '이용권 수정' : '새 이용권 등록'}</h3>
          <button className="form-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-modal-body">
          {saving ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={24} />
              <p>저장 중...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="admin-ticket-form">
              <div className="info-section">
                <h4>이용권 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>이용권 이름</label>
                    <div className="info-value">
                      <CreditCard size={16} />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="예: 1회 상담권"
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>가격</label>
                    <div className="info-value">
                      <DollarSign size={16} />
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="30000"
                        min="0"
                        className="coffee-form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="info-item">
                    <label>시간</label>
                    <div className="info-value">
                      <Clock size={16} />
                      <select
                        name="ticketTime"
                        value={form.ticketTime}
                        onChange={handleChange}
                        className="coffee-form-select"
                        required
                      >
                        <option value="">시간을 선택하세요</option>
                        <option value="MINUTES_20">20분</option>
                        <option value="MINUTES_30">30분</option>
                        <option value="MINUTES_40">40분</option>
                      </select>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>설명</label>
                    <div className="info-value">
                      <FileText size={16} />
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="이용권에 대한 상세 설명을 입력하세요"
                        rows="4"
                        className="coffee-form-textarea"
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
              {saving ? '저장 중...' : (ticket ? '수정' : '등록')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFormModal;