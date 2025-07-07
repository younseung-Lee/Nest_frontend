import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reviewAPI, userAPI } from "../../services/api.js";
import { userInfoUtils } from "../../utils/tokenUtils.js"
import { Star, MessageSquare, User, Calendar, PenTool, Edit3, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import './Reviews.css';

const Reviews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState([]);
  const [mentorNames, setMentorNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]); // searchParams가 변경될 때마다 실행

  // 리뷰 목록 + 멘토 이름 동시 갱신 함수
  const fetchReviews = async (page) => {
    try {
      const response = await reviewAPI.getMyReviews({ page: page, size: 10 });
      const pageData = response.data.data;

      setReviews(pageData.content);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
      setHasNext(pageData.hasNext);
      setHasPrevious(pageData.hasPrevious);

      // 멘토 id 리스트 추출 및 이름 매핑
      const mentorIds = [...new Set(pageData.content.map(r => r.mentor))];
      const nameMap = {};
      if (mentorIds.length > 0) {
        await Promise.all(
          mentorIds.map(async (id) => {
            try {
              const res = await userAPI.getUserById(id);
              nameMap[id] = res.data?.data?.name || `ID: ${id}`;
            } catch {
              nameMap[id] = `ID: ${id}`;
            }
          })
        );
      }
      setMentorNames(nameMap);
    } catch (error) {
      console.error("리뷰 목록을 불러오는 데 실패했습니다.", error);
      setReviews([]);
    }
  };

  useEffect(() => {
    const userInfo = userInfoUtils.getUserInfo();
    if (!userInfo) {
      setLoading(false);
      return;
    }
    fetchReviews(currentPage);
  }, [currentPage])

  useEffect(() => {
    const userInfo = userInfoUtils.getUserInfo();
    if (!userInfo) {
      setLoading(false);
      return;
    }
    fetchReviews(0).finally(() => setLoading(false));
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.review-actions')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 리뷰 삭제 함수
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await reviewAPI.deleteReview(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
      await fetchReviews(currentPage);
      setShowDropdown(null);
      alert('리뷰가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  // 리뷰 수정 시작
  const handleEditStart = (review) => {
    setEditingReview(review.id);
    setEditContent(review.content);
    setShowDropdown(null);
  };

  // 리뷰 수정 취소
  const handleEditCancel = () => {
    setEditingReview(null);
    setEditContent('');
  };

  // 리뷰 수정 저장
  const handleEditSave = async (reviewId) => {
    try {
      await reviewAPI.updateReview(reviewId, { content: editContent });
      await fetchReviews(currentPage); // 현재 페이지 리뷰 목록 새로고침
      setEditingReview(null);
      setEditContent('');
      alert('리뷰가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('리뷰 수정 실패:', error);
      alert('리뷰 수정에 실패했습니다.');
    }
  };

  // 드롭다운 토글
  const toggleDropdown = (reviewId) => {
    setShowDropdown(showDropdown === reviewId ? null : reviewId);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', newPage.toString());
      setSearchParams(newSearchParams);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 총 페이지가 5개 이하면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 총 페이지가 5개 초과면 현재 페이지 기준으로 표시
      let startPage = Math.max(0, currentPage - 2);
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  // 상태에 따른 배지 스타일
  const getStatusBadge = (status) => {
    const statusMap = {
      'PUBLISHED': { className: 'published', text: 'Published', icon: '✓' },
      'DRAFT': { className: 'draft', text: 'Draft', icon: '📝' },
      'PENDING': { className: 'pending', text: 'Pending', icon: '⏳' },
    };
    
    return statusMap[status] || { className: 'pending', text: status, icon: '?' };
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 멘토 이름 추출 (ID에서 첫 글자)
  const getMentorInitial = (mentorId) => {
    return mentorId ? mentorId.toString().charAt(0).toUpperCase() : 'M';
  };

  if (loading) {
    return (
      <div className="reviews-tab">
        <div className="reviews-loading">
          <div className="loading-spinner"></div>
          <p>리뷰를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-tab">
        <div className="reviews-header">
          <h3>나의 리뷰</h3>
          <p className="subtitle">멘토링을 받은 후 작성한 리뷰들을 확인하고 관리하세요</p>
          <div className="reviews-stats">
            <div className="stat-item">
              <MessageSquare className="stat-icon" />
              <span className="stat-value">0개의 리뷰</span>
            </div>
          </div>
        </div>
        <div className="reviews-empty">
          <MessageSquare className="empty-icon" />
          <h4>아직 작성한 리뷰가 없습니다</h4>
          <p>멘토링을 받고 첫 번째 리뷰를 작성해보세요. 다른 멘티들에게 도움이 되는 소중한 후기가 될 것입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-tab">
      <div className="reviews-header">
        <h3>나의 리뷰</h3>
        <p className="subtitle">멘토링을 받은 후 작성한 리뷰들을 확인하고 관리하세요</p>
        <div className="reviews-stats">
          <div className="stat-item">
            <MessageSquare className="stat-icon" />
            <span className="stat-value">{totalElements.toLocaleString()}개의 리뷰</span>
          </div>
        </div>
      </div>

      <div className="reviews-scroll-container">
        <div className="reviews-container">
          {reviews.map(review => {
            const statusInfo = getStatusBadge(review.reviewStatus);
            const isEditing = editingReview === review.id;
            
            return (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-mentor-info">
                    <div className="mentor-avatar">
                      {mentorNames[review.mentor]
                        ? mentorNames[review.mentor].charAt(0)
                        : getMentorInitial(review.mentor)}
                    </div>
                    <div className="mentor-details">
                      <h4>
                        {mentorNames[review.mentor]
                          ? `${mentorNames[review.mentor]} 멘토님과의 멘토링`
                          : "멘토님과의 멘토링"}
                      </h4>
                      <span className="mentor-id">
                        멘토 {mentorNames[review.mentor]
                          ? `: ${mentorNames[review.mentor]}`
                          : `ID: ${review.mentor}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* 액션 버튼 */}
                  <div className="review-actions">
                    <button 
                      className="action-menu-btn"
                      onClick={() => toggleDropdown(review.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {showDropdown === review.id && (
                      <div className="action-dropdown">
                        <button 
                          className="dropdown-item edit-item"
                          onClick={() => handleEditStart(review)}
                        >
                          <Edit3 size={16} />
                          <span>수정</span>
                        </button>
                        <button 
                          className="dropdown-item delete-item"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 size={16} />
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="review-content">
                  {isEditing ? (
                    <div className="edit-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="edit-textarea"
                        placeholder="리뷰 내용을 입력하세요..."
                        rows={4}
                      />
                      <div className="edit-actions">
                        <button 
                          className="save-btn"
                          onClick={() => handleEditSave(review.id)}
                        >
                          저장
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={handleEditCancel}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="review-text">
                      {review.content || "멘토링이 정말 도움이 되었습니다. 전문적인 조언과 따뜻한 격려 덕분에 많은 것을 배울 수 있었어요."}
                    </p>
                  )}
                </div>

                <div className="review-meta">
                  <div className="review-date">
                    <Calendar size={14} style={{ marginRight: '4px', display: 'inline' }} />
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 스크롤 가이드 */}
        {reviews.length >= 3 && (
          <div className="scroll-guide">
            <span>↓ 더 많은 리뷰를 보려면 스크롤하세요 ↓</span>
          </div>
        )}
      </div>

      {reviews.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className={`pagination-button prev-btn ${currentPage === 0 ? 'disabled' : ''}`}
          >
            <ChevronLeft size={18} />
            <span>이전</span>
          </button>
          
          <div className="pagination-info">
            <span className="current-page">{currentPage + 1}</span>
            <span className="page-separator">of</span>
            <span className="total-pages">{totalPages}</span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`pagination-button next-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
          >
            <span>다음</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;
