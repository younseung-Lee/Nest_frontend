import React, { useEffect, useState } from 'react';
import { reviewAPI, userAPI } from '../services/api';
import api from '../services/api';
import './ReviewSection.css';

const ReviewSection = ({ mentorId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (mentorId) {
      fetchReviews();
    }
  }, [mentorId, currentPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getReviews(mentorId, {
        page: currentPage,
        size: 5
        // sort 파라미터 제거 - 백엔드에서 기본 정렬 사용
      });

      const data = response.data;
      console.log('📋 리뷰 API 응답 데이터:', data);

      // API 응답 구조 확인
      let reviewList = [];
      if (data.data) {
        // 응답이 { data: { content: [...] } } 구조인 경우
        const reviewData = data.data;
        reviewList = reviewData.content || reviewData || [];
        setTotalPages(reviewData.totalPages || 0);
        setTotalReviews(reviewData.totalElements || reviewData.length || 0);
      } else if (Array.isArray(data)) {
        // 응답이 배열인 경우
        reviewList = data;
        setTotalPages(1);
        setTotalReviews(data.length);
      } else {
        // 기본 페이징 구조
        reviewList = data.content || [];
        setTotalPages(data.totalPages || 0);
        setTotalReviews(data.totalElements || 0);
      }

      // 각 리뷰에 대해 mentee 닉네임 조회
      const reviewsWithNicknames = await Promise.all(
          reviewList.map(async (review) => {
            try {
              const menteeId = review.mentee;
              console.log('👤 menteeId:', menteeId, 'for review:', review.id);

              if (menteeId) {
                // 다른 API 엔드포인트들 시도
                let userData = null;
                const endpointsToTry = [
                  () => userAPI.getUserById(menteeId)
                ];

                for (const apiCall of endpointsToTry) {
                  try {
                    const response = await apiCall();
                    console.log('🔍 API 응답:', response);
                    userData = response.data.data || response.data;
                    if (userData && (userData.nickName || userData.nickname)) {
                      break; // nickName을 찾으면 중단
                    }
                  } catch (err) {
                    console.log('API 시도 실패:', err.response?.status);
                    continue;
                  }
                }

                if (userData) {
                  const nickname = userData.nickName || userData.nickname || userData.name || '익명';
                  console.log('✅ 닉네임 조회 성공:', nickname);

                  return {
                    ...review,
                    reviewerName: nickname
                  };
                }
              }
            } catch (error) {
              console.error('❌ 사용자 정보 조회 실패:', error);
            }

            return {
              ...review,
              reviewerName: '익명'
            };
          })
      );

      setReviews(reviewsWithNicknames);
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
        <div className="review-section">
          <div className="review-loading">리뷰를 불러오는 중...</div>
        </div>
    );
  }

  return (
      <div className="review-section">
        <div className="review-header">
          <h2 className="section-title">멘토 리뷰</h2>
          {totalReviews > 0 && (
              <div className="review-summary">
                <span className="review-count">{totalReviews}개의 리뷰</span>
              </div>
          )}
        </div>

        {reviews.length === 0 ? (
            <div className="no-reviews">
              <p>아직 작성된 리뷰가 없습니다.</p>
            </div>
        ) : (
            <div className="reviews-content">
              <div className="reviews-list">
                {reviews.map((review) => {
                  console.log('📝 개별 리뷰 데이터:', review);
                  return (
                      <div key={review.id} className="review-item">
                        <div className="review-header-info">
                          <div className="reviewer-info">
                    <span className="reviewer-name">
                      {review.reviewerName || review.writerName || review.userName || review.nickname || review.name || '익명'}
                    </span>
                          </div>
                          <span className="review-date">
                    {formatDate(review.created_At || review.createdAt)}
                  </span>
                        </div>
                        <div className="review-content">
                          <p>{review.content}</p>
                        </div>
                      </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                  <div className="pagination">
                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                    >
                      이전
                    </button>
                    <span className="page-info">
                {currentPage + 1} / {totalPages}
              </span>
                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                    >
                      다음
                    </button>
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

export default ReviewSection;