import React, { useState, useEffect, Fragment } from 'react';
import { MessageSquare, Edit3, RefreshCw, Calendar, User, Search, Filter, Eye } from 'lucide-react';
import './AdminCommon.css';
import { adminAPI, userAPI } from "../../services/api.js";
import { accessTokenUtils } from "../../utils/tokenUtils.js";
import ReviewDetailModal from './ReviewDetailModal.jsx';

const ReviewManagement = ({ isDarkMode }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userNames, setUserNames] = useState({}); // userId -> {name, nickName} 매핑
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const token = accessTokenUtils.getAccessToken();
    console.log('🔑 현재 토큰 상태:', token ? '존재함' : '없음');
    
    if (!token) {
      console.warn('⚠️ 인증 토큰이 없습니다. 로그인이 필요합니다.');
      alert('관리자 로그인이 필요합니다.');
      setReviews([]);
      return;
    }
    
    loadReviews();
  }, [currentPage, searchTerm, filterStatus]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 10,
        sort: 'createdAt,desc'
      };

      // 검색어가 있는 경우 추가
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // 상태 필터가 설정된 경우 추가
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await adminAPI.getReviewList(params);
      
      // 응답 데이터 구조 분석 및 파싱
      let reviewData = [];
      let totalPages = 0;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          reviewData = response.data;
          totalPages = 1;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          reviewData = response.data.data;
          totalPages = 1;
        } else if (response.data.data && response.data.data.content && Array.isArray(response.data.data.content)) {
          reviewData = response.data.data.content;
          totalPages = response.data.data.totalPages || 1;
          setCurrentPage(response.data.data.number || 0);
        } else if (response.data.content && Array.isArray(response.data.content)) {
          reviewData = response.data.content;
          totalPages = response.data.totalPages || 1;
          setCurrentPage(response.data.number || 0);
        }
      }
      
      setReviews(reviewData);
      setTotalPages(totalPages);
      
      // 멘토/멘티 정보 로드
      await loadUserNames(reviewData);
      
    } catch (error) {
      console.error('❌ 리뷰 목록 조회 실패:', error);
      setReviews([]);
      
      let errorMessage = '리뷰 목록을 불러오는데 실패했습니다.';
      
      if (error.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (error.response?.status === 403) {
        errorMessage = '리뷰 관리 권한이 없습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '리뷰 API를 찾을 수 없습니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      console.error(`💥 에러 상세: ${errorMessage}`);
      alert(`오류: ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  // 사용자 이름 정보 로드
  const loadUserNames = async (reviewList) => {
    try {
      // 모든 고유한 사용자 ID 추출
      const userIds = new Set();
      reviewList.forEach(review => {
        if (review.mentor) userIds.add(review.mentor);
        if (review.mentee) userIds.add(review.mentee);
      });

      // 각 사용자 정보 조회
      const namePromises = Array.from(userIds).map(async (userId) => {
        try {
          const response = await userAPI.getUserById(userId);
          return {
            userId,
            name: response.data?.data?.name || response.data?.name,
            nickName: response.data?.data?.nickName || response.data?.nickName
          };
        } catch (error) {
          console.error(`사용자 ${userId} 정보 조회 실패:`, error);
          return {
            userId,
            name: null,
            nickName: null
          };
        }
      });

      const userInfos = await Promise.all(namePromises);
      
      // userNames 상태 업데이트
      const newUserNames = {};
      userInfos.forEach(({ userId, name, nickName }) => {
        newUserNames[userId] = { name, nickName };
      });
      
      setUserNames(newUserNames);
    } catch (error) {
      console.error('사용자 이름 정보 로드 실패:', error);
    }
  };

  const handleChangeStatus = async (reviewId) => {
    if (window.confirm('이 리뷰의 상태를 변경하시겠습니까?')) {
      try {
        console.log(`🔄 리뷰 상태 변경 시작: ID ${reviewId}`);
        await adminAPI.changeReviewStatus(reviewId);
        console.log('✅ 리뷰 상태 변경 성공');
        
        // 목록 새로고침
        await loadReviews();
        alert('리뷰 상태가 성공적으로 변경되었습니다.');
      } catch (error) {
        console.error('❌ 리뷰 상태 변경 실패:', error);
        alert('리뷰 상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
    setDetailLoading(false); // 리뷰 데이터는 이미 있으므로 로딩 불필요
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PUBLISHED': { className: 'published', text: '게시됨', color: '#10b981' },
      'ACTIVE': { className: 'active', text: '활성화됨', color: '#10b981' },
      'DRAFT': { className: 'draft', text: '임시저장', color: '#f59e0b' },
      'PENDING': { className: 'pending', text: '대기중', color: '#6b7280' },
      'DELETED': { className: 'deleted', text: '삭제됨', color: '#ef4444' }
    };
    
    return statusMap[status] || { className: 'pending', text: status, color: '#6b7280' };
  };

  // 멘토/멘티명 추출 함수 - nickName 우선 반환
  const getMentorNickName = (review) => {
    const userId = review.mentor;
    const userInfo = userNames[userId];
    
    if (userInfo?.nickName) return userInfo.nickName;
    if (userInfo?.name) return userInfo.name;
    if (review.mentorName) return review.mentorName;
    if (review.mentor?.nickName) return review.mentor.nickName;
    if (review.mentor?.name) return review.mentor.name;
    return `멘토 ID: ${userId}`;
  };

  const getMenteeNickName = (review) => {
    const userId = review.mentee;
    const userInfo = userNames[userId];
    
    if (userInfo?.nickName) return userInfo.nickName;
    if (userInfo?.name) return userInfo.name;
    if (review.menteeName) return review.menteeName;
    if (review.mentee?.nickName) return review.mentee.nickName;
    if (review.mentee?.name) return review.mentee.name;
    return `멘티 ID: ${userId}`;
  };

  const filteredReviews = reviews.filter(review => {
    const mentorName = getMentorNickName(review);
    const menteeName = getMenteeNickName(review);
    const content = review.content || '';
    
    const matchesSearch = searchTerm === '' || 
      mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menteeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || review.reviewStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div className="content-header">
        <div className="header-left">
          <h2 className="review-title">
            <MessageSquare size={28} />
            리뷰 관리
          </h2>
          <p>모든 리뷰를 확인하고 관리합니다</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={loadReviews}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: 'auto'
            }}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            새로고침
          </button>
        </div>
      </div>

      <div className="content-table" style={{
        display: 'block'
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
          boxShadow: '0 4px 20px rgba(255, 179, 0, 0.3)',
          display: 'grid',
          gridTemplateColumns: '120px 120px 1fr 180px 100px 120px',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>멘토</div>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>멘티</div>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center' }}>리뷰 내용</div>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center' }}>작성일</div>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>상태</div>
          <div className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>작업</div>
        </div>

        {(() => {
          if (loading) {
            return (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24} />
                <p>리뷰 데이터를 불러오는 중...</p>
              </div>
            );
          } else if (filteredReviews.length === 0) {
            return (
              <div className="empty-state">
                <MessageSquare size={48} />
                <h3>리뷰가 없습니다</h3>
                <p>검색 조건을 확인해보세요</p>
              </div>
            );
          } else {
            return filteredReviews.map((review) => {
              const statusInfo = getStatusBadge(review.reviewStatus);
              
              return (
                <div key={review.id} className="table-row" style={{
                  background: 'rgb(251, 249, 239)',
                  borderBottom: '1px solid rgba(255, 179, 0, 0.2)',
                  padding: '20px 32px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'grid',
                  gridTemplateColumns: '120px 120px 1fr 180px 100px 120px',
                  gap: '16px',
                  alignItems: 'center'
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
                      <User size={16} style={{ color: '#ffb300' }} />
                      <div>
                        <strong style={{ color: '#e65100', fontWeight: '700' }}>
                          {getMentorNickName(review)}
                        </strong>
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
                      <User size={16} style={{ color: '#ffb300' }} />
                      <div>
                        <strong style={{ color: '#e65100', fontWeight: '700' }}>
                          {getMenteeNickName(review)}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell" style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6d4c41',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div className="cell-content" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <MessageSquare size={16} style={{ color: '#ffb300' }} />
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        color: '#6d4c41',
                        flex: 1,
                        maxWidth: '100%'
                      }}>
                        {review.content && review.content.length > 50 
                          ? `${review.content.substring(0, 50)}...` 
                          : review.content || '리뷰 내용 없음'}
                      </div>
                    </div>
                  </div>
                  <div className="table-cell" style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6d4c41',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div className="cell-content" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar size={16} style={{ color: '#ffb300' }} />
                      <div style={{ fontSize: '12px', color: '#6d4c41' }}>
                        {formatDate(review.createdAt)}
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
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: statusInfo.color + '20',
                      color: statusInfo.color,
                      whiteSpace: 'nowrap'
                    }}>
                      {statusInfo.text}
                    </span>
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
                        className="action-btn view"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewDetail(review);
                        }}
                        title="상세보기"
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
                          color: '#10b981',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)',
                          marginRight: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-btn status"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleChangeStatus(review.id);
                        }}
                        title="상태변경"
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          }
        })()}
      </div>

      {/* 상세보기 모달 */}
      <ReviewDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        review={selectedReview}
        onStatusChange={handleChangeStatus}
        detailLoading={detailLoading}
        isDarkMode={isDarkMode}
        getMentorNickName={getMentorNickName}
        getMenteeNickName={getMenteeNickName}
      />
    </div>
  );
};

export default ReviewManagement;