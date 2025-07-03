import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, MessageSquare, AlertCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import './NotificationHistoryModal.css';

const NotificationHistoryModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    hasNext: false,
    hasPrevious: false
  });
  const navigate = useNavigate();

  // 페이지 크기 상수
  const PAGE_SIZE = 10;

  // 모달이 열릴 때 알림 내역 조회 (첫 페이지만)
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      fetchNotifications(0, true); // 첫 페이지, 초기화
      
      return () => {
        // 모달이 닫힐 때 body 스크롤 복원
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
        }
      };
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async (page = 0, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const params = {
        page: page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc' // 최신순 정렬
      };
      
      const response = await notificationAPI.getNotifications(params);
      console.log(`📢 알림 내역 조회 성공 (페이지 ${page}):`, response.data);
      
      if (response.data && response.data.data) {
        const { content, ...paginationInfo } = response.data.data;
        
        if (reset) {
          // 첫 페이지 로드 시 기존 데이터 대체
          setNotifications(content || []);
        } else {
          // 추가 페이지 로드 시 기존 데이터에 추가
          setNotifications(prev => [...prev, ...(content || [])]);
        }
        
        setPagination({
          ...paginationInfo,
          currentPage: page
        });
      }
    } catch (err) {
      console.error('❌ 알림 내역 조회 실패:', err);
      setError('알림 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 더보기 버튼 클릭 핸들러
  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasNext) {
      fetchNotifications(pagination.currentPage + 1, false);
    }
  };

  // 재시도 버튼 핸들러 (에러 발생 시)
  const handleRetry = () => {
    fetchNotifications(0, true);
  };

  // 알림 클릭 핸들러 (채팅방 이동)
  const handleNotificationClick = (notification) => {
    console.log('🔔 알림 클릭:', notification);
    
    // 채팅방 관련 알림이면 해당 채팅방으로 이동
    if (notification.chatRoomId) {
      console.log(`📍 채팅방 ${notification.chatRoomId}로 이동`);
      
      // 모달 먼저 닫기
      onClose();
      
      // 약간의 딜레이 후 채팅방으로 이동 (모달 닫기 애니메이션 완료 후)
      setTimeout(() => {
        navigate(`/chat/${notification.chatRoomId}`);
      }, 300);
    } else {
      // 채팅방 ID가 없는 알림의 경우
      console.log('💡 일반 알림 - 특별한 동작 없음');
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '방금 전';
    } else if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 알림 타입에 따른 아이콘 반환
  const getNotificationIcon = (content) => {
    if (content.includes('채팅방이 생성')) {
      return <MessageSquare className="notification-icon chat" />;
    } else if (content.includes('종료까지') || content.includes('시간')) {
      return <Clock className="notification-icon time" />;
    } else {
      return <Bell className="notification-icon default" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="notification-modal-overlay" 
      onClick={onClose}
      onWheel={(e) => e.preventDefault()} // 휠 스크롤 방지
      onTouchMove={(e) => {
        // 오버레이에서 터치 스크롤 방지, 단 모달 내부는 제외
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div 
        className="notification-modal-content"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()} // 모달 내부에서는 스크롤 허용
        onTouchMove={(e) => e.stopPropagation()} // 모달 내부에서는 터치 허용
      >
        {/* 헤더 */}
        <div className="notification-modal-header">
          <div className="notification-modal-title">
            <Bell className="title-icon" />
            <h2>알림 내역</h2>
            {pagination.totalElements > 0 && (
              <span className="notification-count">
                총 {pagination.totalElements}개
              </span>
            )}
          </div>
          <button 
            className="notification-modal-close"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        {/* 내용 */}
        <div className="notification-modal-body">
          {loading ? (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
              <p>알림 내역을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="notification-error">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
              <button onClick={handleRetry} className="retry-button">
                다시 시도
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell className="empty-icon" />
              <h3>알림이 없습니다</h3>
              <p>새로운 알림이 있으면 여기에 표시됩니다.<br/>
                 채팅방 관련 알림을 클릭하면 해당 채팅방으로 이동할 수 있습니다.</p>
            </div>
          ) : (
            <>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.chatRoomId ? 'clickable' : 'non-clickable'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.content)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">
                        {notification.content}
                      </p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.chatRoomId}
                      </div>
                    </div>
                    {notification.chatRoomId && (
                      <div className="notification-action">
                        <span className="action-text">이동 →</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 더보기 버튼 */}
              {pagination.hasNext && (
                <div className="notification-load-more">
                  <button 
                    className="load-more-button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>불러오는 중...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="load-more-icon" />
                        <span>더보기 ({pagination.totalElements - notifications.length}개 더)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        {notifications.length > 0 && (
          <div className="notification-modal-footer">
            <p className="notification-info">
              현재 {notifications.length}개 / 전체 {pagination.totalElements}개 알림을 표시하고 있습니다.
              <span className="footer-tip">💡 채팅방 알림을 클릭하면 해당 채팅방으로 이동합니다.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistoryModal;
