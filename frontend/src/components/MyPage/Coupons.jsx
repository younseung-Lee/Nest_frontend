import React, { useEffect, useState } from 'react';
import { userCouponAPI } from "../../services/api.js";
import { useSearchParams } from 'react-router-dom';
import {Star, ChevronLeft, ChevronRight, Gift} from 'lucide-react';
import './Coupons.css';

const Coupons = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);
    // URL의 페이지가 현재 상태와 다르면 상태를 업데이트
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]);

  // 쿠폰 목록 조회
  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const response = await userCouponAPI.getUserCoupons({ page: currentPage, size: 20 });
      const data = response.data.data;
      
      setCoupons(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setHasNext(data.hasNext);
      setHasPrevious(data.hasPrevious);

    } catch (error) {
      console.error("❌ 쿠폰 목록을 불러오는 데 실패했습니다.", error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage]);

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages && page !== currentPage) {
      // 스크롤을 맨 위로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', page.toString());

      setSearchParams(newSearchParams);
    }
  };

  // 페이지 번호 배열 생성 (최대 5개씩 보여주기)
  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    // 끝에서부터 역산해서 시작점 조정
    if (end - start + 1 < maxVisible && start > 0) {
      start = Math.max(0, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '상시';
    const date = new Date(dateString);
    // 날짜가 유효한지 확인 후 포맷팅
    if (isNaN(date.getTime())) {
      return dateString; // 유효하지 않은 날짜 문자열은 그대로 반환
    }
    return date.toLocaleDateString('ko-KR'); // 한국어 형식으로 변환
  };

  // useStatus에 따른 텍스트 및 스타일 결정
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'UNUSED':
        return { text: '사용 가능', className: 'status-usable' };
      case 'USED':
        return { text: '사용 완료', className: 'status-used' };
      case 'EXPIRED':
        return { text: '기간 만료', className: 'status-expired' };
      default:
        return { text: '알 수 없음', className: '' };
    }
  };

  if (loading) {
    return (
        <div className="coupons-tab">
          <div className="coupons-loading">
            <div className="loading-spinner"></div>
            <p>쿠폰을 불러오는 중입니다...</p>
          </div>
        </div>
    );
  }

  if (coupons.length === 0) {
    return (
        <div className="coupons-tab">
          <div className="coupons-header">
            <h3>내 보유 쿠폰</h3>
            <p className="subtitle">어떤 쿠폰이 있는지 확인하세요.</p>
          </div>
          <div className="coupons-empty">
            <Star className="empty-icon" size={48} />
            <h4>아직 보유한 쿠폰이 없습니다</h4>
            <p>일정 등급을 달성하면 사용할 수 있는 쿠폰이 발급 됩니다.</p>
          </div>
        </div>
    );
  }

  // 쿠폰이 있는 경우 목록 렌더링
  return (
      <div className="coupons-tab">
        <div className="coupons-header">
          <h3>내 보유 쿠폰</h3>
          <p className="subtitle">사용 가능한 쿠폰을 확인하고 혜택을 누리세요!</p>
          <div className="coupons-count">
            총 {totalElements}개의 쿠폰 (페이지 {currentPage + 1} / {totalPages})
          </div>
        </div>
        
        <div className="coupons-list">
          {coupons.map((coupon) => {
            const { text: statusText, className: statusClass } = getStatusDisplay(coupon.useStatus);
            const isUsable = coupon.useStatus === 'UNUSED'; // '사용 가능' 상태인지 판단

            return (
                <div key={coupon.couponId} className={`coupon-card ${!isUsable ? 'coupon-card-disabled' : ''}`}>
                  <div className="coupon-card-top">
                    <div className="coupon-icon">
                      <Gift size={36} color="black"/>
                    </div>
                    <div className="coupon-details">
                      <h4 className="coupon-name">{coupon.couponName}</h4>
                      <p className="coupon-discount">
                        {coupon.discountAmount ? `${coupon.discountAmount.toLocaleString()}원 할인` : '할인 정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div className="coupon-card-bottom">
                    <p className="coupon-validity">
                      유효 기간: {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validTo)}
                    </p>
                    <span className={`coupon-status-badge ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
            );
          })}
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            {/* 이전 페이지 버튼 */}
            <button 
              className={`pagination-btn prev-btn ${currentPage === 0 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={20} />
              이전
            </button>

            {/* 첫 페이지 (현재 페이지가 3 이상일 때만) */}
            {getVisiblePages()[0] > 0 && (
              <>
                <button 
                  className="pagination-btn page-btn"
                  onClick={() => handlePageChange(0)}
                >
                  1
                </button>
                {getVisiblePages()[0] > 1 && <span className="pagination-ellipsis">...</span>}
              </>
            )}

            {/* 현재 보이는 페이지들 */}
            {getVisiblePages().map(pageIdx => (
              <button
                key={pageIdx}
                className={`pagination-btn page-btn ${pageIdx === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(pageIdx)}
              >
                {pageIdx + 1}
              </button>
            ))}

            {/* 마지막 페이지 (현재 페이지가 끝에서 3 이상 떨어져 있을 때만) */}
            {getVisiblePages()[getVisiblePages().length - 1] < totalPages - 1 && (
              <>
                {getVisiblePages()[getVisiblePages().length - 1] < totalPages - 2 && 
                  <span className="pagination-ellipsis">...</span>
                }
                <button 
                  className="pagination-btn page-btn"
                  onClick={() => handlePageChange(totalPages - 1)}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* 다음 페이지 버튼 */}
            <button 
              className={`pagination-btn next-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              다음
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
  );
};

export default Coupons;
