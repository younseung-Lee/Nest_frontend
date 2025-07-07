import React, { memo } from 'react';
import { RefreshCw, CheckCircle, XCircle, MessageSquare, User, Calendar, Star } from 'lucide-react';
import './AdminCommon.css';

const ReviewDetailModal = memo(({
  isOpen,
  onClose,
  review,
  onStatusChange,
  detailLoading,
  isDarkMode,
  getMentorNickName,
  getMenteeNickName,
}) => {
  if (!isOpen) return null;

  // 상태 뱃지 생성
  const getStatusBadge = (status) => {
    const statusMap = {
      'PUBLISHED': { className: 'published', text: '게시됨', color: '#10b981', icon: CheckCircle },
      'ACTIVE': { className: 'active', text: '활성화됨', color: '#10b981', icon: CheckCircle },
      'DRAFT': { className: 'draft', text: '임시저장', color: '#f59e0b', icon: Star },
      'PENDING': { className: 'pending', text: '대기중', color: '#6b7280', icon: RefreshCw },
      'DELETED': { className: 'deleted', text: '삭제됨', color: '#ef4444', icon: XCircle }
    };
    
    return statusMap[status] || { className: 'pending', text: status, color: '#6b7280', icon: RefreshCw };
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusBadge = review ? getStatusBadge(review.reviewStatus) : null;
  const StatusIcon = statusBadge?.icon;

  // 상태 변경 핸들러
  const handleStatusChange = async (reviewId) => {
    try {
      await onStatusChange(reviewId);
      onClose();
    } catch (error) {
      console.error('모달에서 상태 변경 실패:', error);
    }
  };

  return (
    <div className={`form-modal-overlay ${isDarkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="form-modal-content admin-review-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h3>리뷰 상세 정보</h3>
          <button className="form-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-modal-body">
          {detailLoading ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={24} />
              <p>상세 정보를 불러오는 중...</p>
            </div>
          ) : !review ? (
            <div className="empty-state">
              <p>상세 정보를 불러올 수 없습니다.</p>
            </div>
          ) : (
            <div className="admin-review-info">
              <div className="info-section">
                <h4>기본 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>멘토</label>
                    <div className="info-value">
                      <User size={16} />
                      {getMentorNickName(review)}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>멘티</label>
                    <div className="info-value">
                      <User size={16} />
                      {getMenteeNickName(review)}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>예약 ID</label>
                    <div className="info-value"># {review.reservationId || '-'}</div>
                  </div>
                  <div className="info-item">
                    <label>작성일</label>
                    <div className="info-value">
                      <Calendar size={16} />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>상태</label>
                    <div className="info-value">
                      <StatusIcon size={16} />
                      <span 
                        className={`status-badge ${statusBadge.className}`}
                        style={{
                          backgroundColor: statusBadge.color + '20',
                          color: statusBadge.color
                        }}
                      >
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h4>리뷰 내용</h4>
                <div className="review-content-display">
                  <MessageSquare size={20} />
                  <div className="content-text">
                    {review.content || '리뷰 내용이 없습니다.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="form-modal-actions">
          {!detailLoading && review && (
            <div className="status-actions">
              <button 
                className="coffee-btn coffee-btn-warning"
                onClick={() => handleStatusChange(review.id)}
                title="리뷰 상태 변경"
              >
                <RefreshCw size={16} /> 상태 변경
              </button>
            </div>
          )}
          <button className="coffee-btn coffee-btn-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
});

ReviewDetailModal.displayName = 'ReviewDetailModal';

export default ReviewDetailModal;