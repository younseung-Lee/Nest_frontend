import React, { useState, useEffect } from 'react';
import { CreditCard, Eye, FileText, ChevronLeft, ChevronRight, MoreVertical, Edit3, Trash2, X } from 'lucide-react';
import { paymentAPI } from '../../services/api';
import './PaymentsHistory.css';
import { Loader, AlertTriangle, Info } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentsHistory = ({ userInfo }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [showDropdown, setShowDropdown] = useState(null);

  // 취소 모달 관련 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [paymentToCancelId, setPaymentToCancelId] = useState(null);

  // 커스텀 메시지 박스 상태
  const [messageBox, setMessageBox] = useState({
    show: false,
    type: '',
    message: '',
  });

  // 커스텀 메시지 박스 표시 함수
  const showMessageBox = (type, message) => {
    setMessageBox({ show: true, type, message });
  };

  // 커스텀 메시지 박스 닫기 함수
  const closeMessageBox = () => {
    setMessageBox({ show: false, type: '', message: '' });
  };

  const fetchPayments = async (pageToFetch, currentUserInfo) => { // ⭐ pageToFetch와 currentUserInfo를 인자로 받음
    // 멘티일 경우에만 결제 내역을 불러옴
    if (currentUserInfo?.userRole !== 'MENTEE') { // ⭐ 인자로 받은 currentUserInfo 사용
      setLoading(false); // 멘티가 아니면 로딩을 멈춤
      return;
    }

    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentHistory({
        page: pageToFetch, // ⭐ 인자로 받은 pageToFetch 사용
        size: 10,
      });

      const responseData = response.data.data;

      setPayments(responseData.content || []);
      setTotalPages(responseData.totalPages);
      setTotalElements(responseData.totalElements);
      setHasNext(responseData.hasNext);
      setHasPrevious(responseData.hasPrevious);

    } catch (err) {
      console.error("결제 내역을 불러오는 데 실패했습니다:", err);
      setError("결제 내역을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL 파라미터에서 현재 페이지를 가져옵니다.
    const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);
    // currentPage 상태를 URL 파라미터와 동기화
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]); // URL 파라미터가 변경될 때마다 실행

  useEffect(() => {
    // fetchPayments는 이제 최상위 함수이므로, 여기서 최신 상태 값을 인자로 전달합니다.
    fetchPayments(currentPage, userInfo); // ⭐ currentPage와 userInfo를 인자로 전달
  }, [userInfo, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 클릭된 요소가 드롭다운 액션 버튼이나 드롭다운 메뉴 자체가 아니라면 닫기
      if (showDropdown !== null && !event.target.closest('.review-actions')) { // 클래스명은 Reviews 컴포넌트와 통일
        setShowDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]); // showDropdown 상태가 변경될 때마다 이벤트 리스너 갱신

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', newPage.toString());
      setSearchParams(newSearchParams);
    }
  };

  // 페이지 번호 생성 로직
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

  const toggleDropdown = (itemId) => {
    setShowDropdown(showDropdown === itemId ? null : itemId);
  };

  const handleDeletePayment = async (paymentId) => {
    setPaymentToCancelId(paymentId);
    setCancelReasonInput('');
    setShowCancelModal(true);
    setShowDropdown(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReasonInput.trim()) {
      showMessageBox('error', '취소 사유를 입력해주세요.');
      return;
    }
    if (!paymentToCancelId) {
      showMessageBox('error', '취소할 결제 내역을 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await paymentAPI.cancelPayment(paymentToCancelId, { cancelReason: cancelReasonInput });
      fetchPayments(currentPage, userInfo);
      showMessageBox('success', '결제 내역이 성공적으로 취소되었습니다.');
      handleCancelModalClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message;

      if (errorMessage === '예약 날짜가 지나 결제를 취소할 수 없습니다.') {
        showMessageBox('error', errorMessage);
      }  else {
        console.error('결제 내역 취소 실패:', error);
        showMessageBox('error', '결제 내역 취소에 실패했습니다. 다시 시도해 주세요.');
      }
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setCancelReasonInput('');
    setPaymentToCancelId(null);
  };

  if (loading) {
    return (
      <div className="payment-history-container loading-container">
        <Loader className="spinner" />
        <p>결제 내역을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-history-container error-container">
        <AlertTriangle />
        <p>{error}</p>
      </div>
    );
  }

  return (
      <div className="payment-history-container">
        <div className="payment-history-header">
          <CreditCard size={24} />
          <h2>결제 내역</h2>
        </div>

        {payments.length === 0 ? (
            <div className="no-history-container">
              <Info />
              <p>결제 내역이 없습니다.</p>
            </div>
        ) : (
            // === 여기부터 수정 시작 ===
            <> {/* <-- payments.length === 0 조건의 else 블록 시작에 Fragment 열기 */}
              <ul className="history-list">
                {payments.map((item) => (
                    <li key={item.id} className="history-item">
                      <div className="item-header">
                        <span className="ticket-name">{item.ticketName}</span>
                        <div className="review-actions"> {/* Reviews 컴포넌트와 클래스명 통일 */}
                          <button
                              className="action-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지 (외부 클릭 시 닫기 위함)
                                toggleDropdown(item.id);
                              }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {showDropdown === item.id && (
                              <div className="action-dropdown">

                                <button
                                    className="dropdown-item delete-item"
                                    onClick={() => handleDeletePayment(item.id)}
                                >
                                  <Trash2 size={16} />
                                  <span>취소</span>
                                </button>
                              </div>
                          )}
                        </div>
                      </div>
                      <div className="item-body">
                        <p><strong>멘토:</strong> {item.mentorName}</p>
                        <p><strong>결제 금액:</strong> {item.amount.toLocaleString()}원 ({item.originalAmount.toLocaleString()} - {item.discountAmount.toLocaleString()})</p>
                        <p><strong>결제 수단:</strong> {item.paymentType}</p>
                        <div className="item-body-bottom-row">
                          <div className="items-status">
                          <span className={`status-badge status-${item.status.toLowerCase()}`}>
                            {item.status === 'PAID' ? '결제완료' :
                             item.status === 'CANCELED' ? '결제취소' : item.status}
                          </span>
                          </div>
                        </div>
                      </div>
                      <div className="item-footer">
                        <span>{new Date(item.approvedAt).toLocaleString()}</span>
                      </div>
                    </li>
                ))}
              </ul>

              {/* 고급스러운 페이지네이션 */}
              {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-container">
                      {/* 이전 페이지 버튼 */}
                      <button
                          className={`pagination-btn prev-btn ${!hasPrevious ? 'disabled' : ''}`}
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!hasPrevious}
                      >
                        <ChevronLeft size={18} />
                        <span>이전</span>
                      </button>

                      {/* 페이지 번호들 */}
                      <div className="pagination-numbers">
                        {/* 첫 페이지로 가는 버튼 (현재 페이지가 3 이상일 때만) */}
                        {currentPage > 2 && totalPages > 5 && (
                            <>
                              <button
                                  className="pagination-number"
                                  onClick={() => handlePageChange(0)}
                              >
                                1
                              </button>
                              {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                            </>
                        )}

                        {/* 메인 페이지 번호들 */}
                        {generatePageNumbers().map(pageNum => (
                            <button
                                key={pageNum}
                                className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => {
                                  console.log('버튼 클릭!')
                                  handlePageChange(pageNum)
                                }}
                            >
                              {pageNum + 1}
                            </button>
                        ))}

                        {/* 마지막 페이지로 가는 버튼 (현재 페이지가 끝에서 3번째 이전일 때만) */}
                        {currentPage < totalPages - 3 && totalPages > 5 && (
                            <>
                              {currentPage < totalPages - 4 && <span className="pagination-ellipsis">...</span>}
                              <button
                                  className="pagination-number"
                                  onClick={() => handlePageChange(totalPages - 1)}
                              >
                                {totalPages}
                              </button>
                            </>
                        )}
                      </div>

                      {/* 다음 페이지 버튼 */}
                      <button
                          className={`pagination-btn next-btn ${!hasNext ? 'disabled' : ''}`}
                          onClick={() => {
                            console.log('버튼 클릭!')
                            handlePageChange(currentPage + 1)
                          }}
                          disabled={!hasNext}
                      >
                        <span>다음</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    {/* 페이지 정보 */}
                    <div className="pagination-info">
              <span>
                {currentPage + 1} / {totalPages} 페이지
                <span className="total-items">
                  (총 {totalElements.toLocaleString()}개)
                </span>
              </span>
                    </div>
                  </div>
              )}
            </>
          )}
        {/* ⭐ 1. 커스텀 취소 사유 입력 모달 */}
        {showCancelModal && (
            <div className="custom-modal-overlay">
              <div className="custom-modal-content">
                <div className="modal-header">
                  <h3>결제 내역 취소</h3>
                  <button className="close-button" onClick={handleCancelModalClose}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p>결제 내역을 취소하시겠습니까? 취소 사유를 입력해주세요.</p>
                  <textarea
                      className="cancel-reason-input"
                      rows="4"
                      placeholder="취소 사유를 입력하세요 (필수)"
                      value={cancelReasonInput}
                      onChange={(e) => setCancelReasonInput(e.target.value)}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button className="modal-cancel-btn" onClick={handleCancelModalClose}>취소</button>
                  <button className="modal-confirm-btn" onClick={handleConfirmCancel}>확인</button>
                </div>
              </div>
            </div>
        )}

        {/* ⭐ 2. 커스텀 메시지 박스 */}
        {messageBox.show && (
            <div className={`custom-message-box-overlay ${messageBox.type}`}>
              <div className="custom-message-box-content">
                <div className="message-header">
                  <h4>{messageBox.type === 'success' ? '성공' : messageBox.type === 'error' ? '오류' : '알림'}</h4>
                  <button className="close-button" onClick={closeMessageBox}>
                    <X size={18} />
                  </button>
                </div>
                <div className="message-body">
                  <p>{messageBox.message}</p>
                </div>
                <div className="message-footer">
                  <button className="message-ok-btn" onClick={closeMessageBox}>확인</button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default PaymentsHistory;
