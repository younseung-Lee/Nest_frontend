import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Ticket, Calendar, CreditCard, Users, RefreshCw } from 'lucide-react';
import './AdminCommon.css';
import { ticketAPI } from "../../services/api.js";
import { accessTokenUtils } from "../../utils/tokenUtils.js";
import TicketFormModal from './TicketFormModal.jsx';

const TicketManagement = ({ isDarkMode }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    // 인증 토큰 확인
    const token = accessTokenUtils.getAccessToken();
    
    if (!token) {
      console.warn('⚠️ 인증 토큰이 없습니다. 로그인이 필요합니다.');
      alert('관리자 로그인이 필요합니다.');
      setTickets([]);
      return;
    }
    
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketAPI.getTickets();
      
      // 응답 데이터 구조 분석 및 파싱
      let ticketData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          ticketData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          ticketData = response.data.data;
        } else if (response.data.data && response.data.data.content && Array.isArray(response.data.data.content)) {
          ticketData = response.data.data.content;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          ticketData = response.data.content;
        } else {
          ticketData = [];
        }
      }
      
      setTickets(ticketData);
      
    } catch (error) {
      console.error('❌ 이용권 목록 조회 실패:', error);
      
      setTickets([]);
      
      let errorMessage = '이용권 목록을 불러오는데 실패했습니다.';
      
      if (error.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (error.response?.status === 403) {
        errorMessage = '이용권 관리 권한이 없습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '이용권 API를 찾을 수 없습니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(`오류: ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSaveTicket = async (ticketData) => {
    setSaving(true);
    try {
      if (ticketData.id) {
        console.log(`📝 이용권 수정 시작: ID ${ticketData.id}`, ticketData);
        await ticketAPI.updateTicket(ticketData.id, ticketData);
        console.log('✅ 이용권 수정 성공');
        alert('이용권이 성공적으로 수정되었습니다.');
      } else {
        console.log('🆕 새 이용권 등록 시작:', ticketData);
        await ticketAPI.createTicket(ticketData);
        console.log('✅ 이용권 등록 성공');
        alert('이용권이 성공적으로 등록되었습니다.');
      }
      
      setShowCreateModal(false);
      setSelectedTicket(null);
      await loadTickets(); // 목록 새로고침
    } catch (error) {
      console.error('❌ 이용권 저장 실패:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          '이용권 저장에 실패했습니다.';
      alert(`저장 실패: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setShowCreateModal(true);
  };

  const handleDelete = async (ticketId) => {
    if (window.confirm('정말로 이 이용권을 삭제하시겠습니까?')) {
      try {
        console.log(`🗑️ 이용권 삭제 시작: ID ${ticketId}`);
        await ticketAPI.deleteTicket(ticketId);
        console.log('✅ 이용권 삭제 성공');
        
        setTickets(tickets.filter(ticket => ticket.id !== ticketId));
        alert('이용권이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('❌ 이용권 삭제 실패:', error);
        alert('이용권 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const getTimeDisplay = (ticketTime) => {
    const timeMap = {
      'MINUTES_20': '20분',
      'MINUTES_30': '30분',
      'MINUTES_40': '40분'
    };
    return timeMap[ticketTime] || '시간 미정';
  };

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div className="content-header">
        <div className="header-left">
          <h2 className="ticket-title">
            <Ticket size={28} />
            이용권 관리
          </h2>
          <p>멘토링 이용권을 생성하고 관리합니다</p>
        </div>
        <div className="header-actions">
          <button 
            className="coffee-btn coffee-btn-primary"
            onClick={() => {
              setSelectedTicket(null);
              setShowCreateModal(true);
            }}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10,
              position: 'relative'
            }}
          >
            <Plus size={18} />
            이용권 추가
          </button>
        </div>
      </div>

      <div className="content-table ticket-table" style={{
        gridTemplateColumns: '1.5fr 1fr 120px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div className="table-header" style={{
          background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
          color: 'white',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '13px',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          padding: '24px 32px',
          boxShadow: '0 4px 20px rgba(255, 179, 0, 0.3)'
        }}>
          <div className="table-cell">이용권 정보</div>
          <div className="table-cell">가격/시간</div>
          <div className="table-cell">작업</div>
        </div>

        {(() => {
          if (loading) {
            return (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24} />
                <p>이용권 데이터를 불러오는 중...</p>
              </div>
            );
          } else if (tickets.length === 0) {
            return (
              <div className="empty-state">
                <Ticket size={48} />
                <h3>이용권이 없습니다</h3>
                <p>새로운 이용권을 추가해보세요</p>
              </div>
            );
          } else {
            return tickets.map((ticket) => (
            <div key={ticket.id} className="table-row" style={{
              background: 'rgb(251, 249, 239)',
              borderBottom: '1px solid rgba(255, 179, 0, 0.2)',
              padding: '20px 32px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, #fff3c4, #fff8e1)';
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 179, 0, 0.15)';
              e.currentTarget.style.borderLeft = '4px solid #ffb300';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgb(251, 249, 239)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderLeft = 'none';
            }}>
              <div className="table-cell" style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6d4c41',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="cell-content" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Ticket size={16} style={{ color: '#ffb300' }} />
                  <div>
                    <strong style={{ color: '#e65100', fontWeight: '700' }}>{ticket.name || '이름 없음'}</strong>
                  </div>
                </div>
              </div>
              <div className="table-cell" style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6d4c41',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="cell-content" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CreditCard size={16} style={{ color: '#ffb300' }} />
                  <div>
                    <div style={{ color: '#e65100', fontWeight: '600' }}>₩{(ticket.price || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="table-cell" style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6d4c41',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="table-actions">
                  <button 
                    className="action-btn edit"
                    onClick={() => handleEdit(ticket)}
                    title="수정"
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15))',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)',
                      marginRight: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(ticket.id)}
                    title="삭제"
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ));
          }
        })()}
      </div>

      {showCreateModal && (
          <TicketFormModal
              ticket={selectedTicket}
              onSave={handleSaveTicket}
              onClose={() => setShowCreateModal(false)}
              saving={saving}
          />
      )}
    </div>
  );
};

export default TicketManagement;