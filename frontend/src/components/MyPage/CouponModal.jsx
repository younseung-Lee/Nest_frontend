import React, {useEffect, useState} from 'react';
import { createPortal } from 'react-dom';
import './CouponModal.css';
import { userCouponAPI } from "../../services/api.js";
import { Gift } from "lucide-react";

function CouponModal({isOpen, onClose, onCouponIssued}) {

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      if (isOpen) {
        setLoading(true);
        setError(null);

        try {
          const response = await userCouponAPI.getAvailableCoupons();

          const data = response.data.data.content;
          setAvailableCoupons(data);
        } catch (error) {
          setError(error.message);
          setAvailableCoupons([]);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableCoupons([]);
        setError(null);
      }
    };
    fetchAvailableCoupons();
  }, [isOpen]);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'coupon-modal-overlay') {
      onClose();
    }
  };

  const handleIssueCoupon = async (couponId) => {
    try {
      const userInfoStr = sessionStorage.getItem('userData')
      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo.id;

      const registrationData = {
        couponId: couponId,
        userId: userId,
        isUsed: 'UNUSED'
      };

      const response = await userCouponAPI.registerUserCoupon(registrationData);
      alert('쿠폰이 성공적으로 발급되었습니다.')
      onCouponIssued();

      onClose();
    } catch (error) {
      alert('쿠폰 발급에 실패했습니다. 이미 발급되었거나 조건을 만족하지 않습니다.')
    }
  };

  const disPlayAvailableCoupons = availableCoupons.filter(coupon => coupon.canIssue);

  // Portal 타겟 엘리먼트 생성/가져오기
  const getPortalRoot = () => {
    let portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'modal-root';
      document.body.appendChild(portalRoot);
    }
    return portalRoot;
  };

  const modalContent = (
    <div className="coupon-modal-overlay" onClick={handleOverlayClick}>
      <div className="coupon-modal-content">
        <h2>사용 가능한 쿠폰</h2>
        {loading && <p>쿠폰 목록을 불러오는 중...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && disPlayAvailableCoupons.length === 0 && (
            <p>현재 발급 가능한 쿠폰이 없습니다.</p>
        )}

        {!loading && !error && disPlayAvailableCoupons.length > 0 && (
            <div className="available-coupons-list">
              {disPlayAvailableCoupons.map((coupon) => (
                  <div key={coupon.id} className="available-coupon-item">
                    <div className="available-coupon-item-details">
                      <Gift size={20} className="coupon-item-icon" />
                      <h4>{coupon.name}</h4>
                      <p>할인 유형 : {DISCOUNT_TYPE_TEXT_MAP[coupon.discountType]}</p>
                      {coupon.discountType === 'FIXED_AMOUNT' ? (
                          <p>할인 금액 : {coupon.discountAmount}원</p>
                      ) : (
                          <p>할인 퍼센트 : {coupon.discountAmount}%</p>
                      )}
                      <p>유효 기간 : {coupon.validFrom.split('T')[0]} ~ {coupon.validTo.split('T')[0]}</p>
                    </div>
                    <button
                        className="issue-coupon-btn"
                        onClick={() => handleIssueCoupon(coupon.id)}
                    >
                      발급받기
                    </button>
                  </div>
              ))}
            </div>
        )}

        <button className="available-coupon-modal-close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );

  // createPortal을 사용해서 modal-root에 렌더링
  return createPortal(modalContent, getPortalRoot());
}

const DISCOUNT_TYPE_TEXT_MAP = {
  FIXED_AMOUNT: '금액 할인',
  PERCENT_AMOUNT: '퍼센트 할인',
};

export default CouponModal;
