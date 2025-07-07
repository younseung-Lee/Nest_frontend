import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, CreditCard, Search, Filter, Download, Eye } from 'lucide-react';
import './PaymentHistory.css';

const PaymentHistory = ({ onBack }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // 결제 내역 데이터 (실제로는 API에서 가져올 것)
  const mockPayments = [
    {
      id: 1,
      orderId: 'order_20250619_abc123',
      mentorName: '김개발',
      mentorImage: '/api/placeholder/40/40',
      service: '40분 멘토링',
      amount: 22900,
      status: 'DONE',
      method: '토스페이',
      date: '2025-06-19',
      time: '14:00-14:40',
      approvedAt: '2025-06-19T14:00:00Z',
      receiptUrl: '#'
    },
    {
      id: 2,
      orderId: 'order_20250618_def456',
      mentorName: '박프론트',
      mentorImage: '/api/placeholder/40/40',
      service: '30분 멘토링',
      amount: 18900,
      status: 'DONE',
      method: '카드결제',
      date: '2025-06-18',
      time: '10:00-10:30',
      approvedAt: '2025-06-18T10:00:00Z',
      receiptUrl: '#'
    },
    {
      id: 3,
      orderId: 'order_20250617_ghi789',
      mentorName: '이백엔드',
      mentorImage: '/api/placeholder/40/40',
      service: '20분 멘토링',
      amount: 14900,
      status: 'CANCELLED',
      method: '토스페이',
      date: '2025-06-17',
      time: '16:00-16:20',
      approvedAt: '2025-06-17T16:00:00Z',
      receiptUrl: '#'
    },
    {
      id: 4,
      orderId: 'order_20250615_jkl012',
      mentorName: '최데이터',
      mentorImage: '/api/placeholder/40/40',
      service: '40분 멘토링',
      amount: 22900,
      status: 'DONE',
      method: '토스페이',
      date: '2025-06-15',
      time: '09:00-09:40',
      approvedAt: '2025-06-15T09:00:00Z',
      receiptUrl: '#'
    },
    {
      id: 5,
      orderId: 'order_20250614_mno345',
      mentorName: '정모바일',
      mentorImage: '/api/placeholder/40/40',
      service: '30분 멘토링',
      amount: 18900,
      status: 'DONE',
      method: '계좌이체',
      date: '2025-06-14',
      time: '15:30-16:00',
      approvedAt: '2025-06-14T15:30:00Z',
      receiptUrl: '#'
    }
  ];

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    setTimeout(() => {
      setPayments(mockPayments);
      setFilteredPayments(mockPayments);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // 필터링 로직
    let filtered = payments;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter(payment => 
          new Date(payment.approvedAt) >= filterDate
        );
      }
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, dateFilter, payments]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DONE': { text: '완료', className: 'status-done' },
      'CANCELLED': { text: '취소', className: 'status-cancelled' },
      'REFUNDED': { text: '환불', className: 'status-refunded' },
      'PENDING': { text: '대기', className: 'status-pending' }
    };
    
    const config = statusConfig[status] || { text: status, className: 'status-default' };
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalStats = () => {
    const total = payments.reduce((sum, payment) => 
      payment.status === 'DONE' ? sum + payment.amount : sum, 0
    );
    const count = payments.filter(payment => payment.status === 'DONE').length;
    return { total, count };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="payment-history-container">
        <div className="loading-section">
          <div className="payment-history-loading-spinner"></div>
          <h2>결제 내역을 불러오고 있습니다...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-container">
      <div className="payment-history-content">
        {/* 헤더 */}
        <div className="history-header">
          <button className="payment-history-back-button" onClick={onBack}>
            <ArrowLeft className="icon" />
          </button>
          <h1>결제 내역</h1>
        </div>

        {/* 통계 카드 */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <CreditCard />
            </div>
            <div className="stat-info">
              <span className="stat-label">총 결제금액</span>
              <span className="stat-value">{stats.total.toLocaleString()}원</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar />
            </div>
            <div className="stat-info">
              <span className="stat-label">완료된 멘토링</span>
              <span className="stat-value">{stats.count}회</span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="filter-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="멘토명, 주문번호, 서비스명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">전체 상태</option>
              <option value="DONE">완료</option>
              <option value="CANCELLED">취소</option>
              <option value="REFUNDED">환불</option>
              <option value="PENDING">대기</option>
            </select>
            
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">전체 기간</option>
              <option value="week">최근 1주일</option>
              <option value="month">최근 1개월</option>
              <option value="3months">최근 3개월</option>
            </select>
          </div>
        </div>

        {/* 결제 내역 리스트 */}
        <div className="payment-list">
          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <CreditCard className="empty-icon" />
              <h3>결제 내역이 없습니다</h3>
              <p>조건에 맞는 결제 내역을 찾을 수 없습니다.</p>
            </div>
          ) : (
            filteredPayments.map(payment => (
              <div key={payment.id} className="payment-item">
                <div className="payment-main">
                  <div className="mentor-info">
                    <img 
                      src={payment.mentorImage} 
                      alt={payment.mentorName}
                      className="mentor-avatar"
                    />
                    <div className="mentor-details">
                      <span className="mentor-name">{payment.mentorName}</span>
                      <span className="service-info">{payment.service}</span>
                    </div>
                  </div>
                  
                  <div className="payment-info">
                    <div className="payment-amount">
                      {payment.amount.toLocaleString()}원
                    </div>
                    <div className="payment-method">{payment.method}</div>
                  </div>
                  
                  <div className="payment-status">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
                
                <div className="payment-details">
                  <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <span>{payment.date}</span>
                  </div>
                  <div className="detail-item">
                    <Clock className="detail-icon" />
                    <span>{payment.time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="order-id">주문번호: {payment.orderId}</span>
                  </div>
                </div>
                
                <div className="payment-actions">
                  <button className="action-button secondary">
                    <Eye className="button-icon" />
                    상세보기
                  </button>
                  {payment.status === 'DONE' && (
                    <button 
                      className="action-button primary"
                      onClick={() => window.open(payment.receiptUrl, '_blank')}
                    >
                      <Download className="button-icon" />
                      영수증
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 (향후 구현) */}
        {filteredPayments.length > 0 && (
          <div className="pagination">
            <button className="pagination-button">이전</button>
            <span className="pagination-info">1 / 1</span>
            <button className="pagination-button">다음</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;