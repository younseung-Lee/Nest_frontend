
import React, { useState, useEffect, memo } from 'react';
import { Clock, User, FileText, MessageSquare, Calendar, RefreshCw } from 'lucide-react';
import { adminAPI, userAPI } from '../../services/api';
import './AdminCommon.css';

const ComplaintDetailModal = ({
  isOpen,
  onClose,
  complaint,
  onAnswerSubmit,
  isSubmitting = false
}) => {
  const [answer, setAnswer] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [complaintDetail, setComplaintDetail] = useState(null);
  const [adminAnswer, setAdminAnswer] = useState(null);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log('🔄 ComplaintDetailModal useEffect 실행:', { 
      isOpen, 
      complaint: complaint ? { id: complaint.id, data: complaint.data } : null 
    });
    
    // complaint 구조가 {data: {id: ...}} 형태일 수 있으므로 두 가지 경우 모두 확인
    const actualComplaint = complaint?.data || complaint;
    const complaintId = actualComplaint?.id;
    
    console.log('🔍 실제 complaint 데이터:', actualComplaint);
    console.log('🎯 추출된 complaint ID:', complaintId);
    
    if (isOpen && complaintId) {
      console.log('📋 모달에서 받은 민원 데이터:', actualComplaint);
      
      // 실제 complaint 데이터 사용
      setComplaintDetail(actualComplaint);
      
      // 사용자 정보는 이미 complaint에 포함되어 있을 수 있음
      if (actualComplaint.userName || actualComplaint.userEmail) {
        console.log('✅ 사용자 정보가 complaint에 포함됨:', {
          userName: actualComplaint.userName,
          userEmail: actualComplaint.userEmail
        });
        setUserInfo({
          name: actualComplaint.userName,
          nickName: actualComplaint.userName,  // nickName도 동일하게 설정
          email: actualComplaint.userEmail,
          phone: actualComplaint.userPhone
        });
      } else if (actualComplaint.userId) {
        console.log('🔍 사용자 정보 별도 조회 필요:', actualComplaint.userId);
        fetchUserInfo(actualComplaint.userId);
      }
      
      // 답변 조회는 별도로 수행
      console.log('🚀 답변 조회 시작하려고 함:', complaintId);
      fetchAdminAnswer(complaintId);
    } else {
      console.log('⚠️ 모달 조건 미충족:', { 
        isOpen, 
        complaintId,
        'complaint?.id': complaint?.id,
        'complaint?.data?.id': complaint?.data?.id,
        complaint: complaint
      });
    }
  }, [complaint, isOpen]);


  const fetchAdminAnswer = async (complaintId) => {
    console.log('🔍 fetchAdminAnswer 함수 시작:', complaintId);
    setLoadingAnswer(true);
    
    try {
      console.log('🌐 adminAPI.getAdminAnswer 호출 중...');
      const response = await adminAPI.getAdminAnswer(complaintId);
      console.log('📋 getAdminAnswer 전체 응답:', response);
      console.log('📋 응답 상태:', response.status);
      console.log('📋 응답 데이터:', response.data);
      
      // Answer 테이블 구조: user, complaint, contents
      const answerData = response.data?.data || response.data;
      console.log('📋 파싱된 답변 데이터:', answerData);
      console.log('📋 answerData 타입:', typeof answerData);
      console.log('📋 answerData.contents:', answerData?.contents);

      if (answerData && answerData.contents) {
        console.log('✅ 답변 내용 발견:', answerData.contents);
        setAdminAnswer(answerData);
        setAnswer(answerData.contents);
        setIsEditing(false); // 답변이 있으면 읽기 모드
        console.log('✅ 상태 업데이트 완료 - 읽기 모드');
      } else {
        console.log('⚠️ 답변 내용이 없음 - answerData:', answerData);
        setAdminAnswer(null);
        setAnswer('');
        setIsEditing(true); // 답변이 없으면 편집 모드
        console.log('⚠️ 상태 업데이트 완료 - 편집 모드');
      }
    } catch (error) {
      console.error('❌ 관리자 답변 조회 실패:', error);
      console.error('❌ 에러 상세:', error.response?.data || error.message);
      console.error('❌ 에러 상태 코드:', error.response?.status);
      
      // 404 에러는 답변이 없다는 의미
      if (error.response?.status === 404) {
        console.log('📝 답변이 아직 등록되지 않음 (404)');
      }
      
      setAdminAnswer(null);
      setAnswer('');
      setIsEditing(true); // 답변 조회 실패하면 편집 모드
      console.log('❌ 에러 처리 완료 - 편집 모드');
    } finally {
      setLoadingAnswer(false);
      console.log('🏁 fetchAdminAnswer 완료');
    }
  };

  const fetchUserInfo = async (userId) => {
    if (!userId) return;

    setLoadingUser(true);
    try {
      console.log('🔍 사용자 정보 조회 시작:', userId);
      const response = await userAPI.getUserById(userId);
      
      // 응답 구조 확인 및 파싱
      let userData = null;
      if (response.data && response.data.data) {
        userData = response.data.data; // 중첩된 구조
        console.log('📋 중첩된 구조 사용: response.data.data');
      } else if (response.data) {
        userData = response.data; // 일반 구조
        console.log('📋 일반 구조 사용: response.data');
      }

      console.log('✅ 사용자 정보 조회 성공:', userData);
      console.log('📋 사용자 정보 필드들:', userData ? Object.keys(userData) : '없음');
      
      // 이름 관련 필드들 상세 확인
      if (userData) {
        console.log('📋 이름 관련 필드 확인:');
        console.log('  - name:', userData.name);
        console.log('  - nickName:', userData.nickName);
        console.log('  - nickname:', userData.nickname);
        console.log('  - displayName:', userData.displayName);
        console.log('  - realName:', userData.realName);
        console.log('  - username:', userData.username);
      }
      
      setUserInfo(userData);
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      setUserInfo(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    const complaintId = displayData.id || complaint.id;
    console.log('📤 답변 제출 시작:', { complaintId: complaintId, answer: answer.trim() });

    try {
      if(adminAnswer && adminAnswer.id) {
        console.log('🔄 기존 답변 수정 시도:', { 
          answerId: adminAnswer.id, 
          adminAnswer: adminAnswer,
          requestData: {
            contents: answer.trim()
          }
        });
        
        const updateData = {
          contents: answer.trim()
        };
        
        console.log('📡 PATCH 요청 데이터:', updateData);
        console.log('🔢 답변 ID:', adminAnswer.id);
        console.log('🔢 답변 ID 타입:', typeof adminAnswer.id);
        console.log('🔍 전체 adminAnswer 객체:', JSON.stringify(adminAnswer, null, 2));
        
        // 백엔드 API: PATCH /api/admin/answers/{answerId}
        // answerId를 사용하여 답변 수정
        await adminAPI.updateAnswer(adminAnswer.id, updateData);
        console.log('✅ 답변 수정 API 호출 완료');
      } else {
        console.log('🆕 새 답변 생성:', { complaintId, contents: answer.trim() });
        await onAnswerSubmit(complaintId, answer.trim());
        console.log('✅ 새 답변 생성 완료');
      }
      
      console.log('🔄 최신 답변 데이터 재조회 시작...');
      // 답변 제출 후 다시 조회하여 최신 상태 반영
      await fetchAdminAnswer(complaintId);
      setIsEditing(false); // 저장 완료 후 읽기 모드로 전환
      console.log('✅ 답변 제출 및 상태 업데이트 완료');
      
      // 성공 메시지 표시
      alert(adminAnswer ? '답변이 성공적으로 수정되었습니다.' : '답변이 성공적으로 등록되었습니다.');
      
    } catch (error) {
      console.error('❌ 답변 제출 실패:', error);
      console.error('❌ 에러 응답:', error.response?.data);
      console.error('❌ 에러 상태:', error.response?.status);
      
      // 에러 메시지 개선
      let errorMessage = '답변 처리 중 오류가 발생했습니다.';
      if (error.response?.status === 403) {
        errorMessage = '답변 수정 권한이 없습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '답변을 찾을 수 없습니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
      
      // 에러 발생 시에도 최신 데이터로 상태 복원
      try {
        await fetchAdminAnswer(complaintId);
      } catch (refreshError) {
        console.error('❌ 데이터 새로고침 실패:', refreshError);
      }
    }
  };

  const handleEditAnswer = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // 편집 취소 시 원래 답변으로 복원
    if (adminAnswer && adminAnswer.contents) {
      setAnswer(adminAnswer.contents);
    } else {
      setAnswer('');
    }
    setIsEditing(false);
  };

  // 유틸리티 함수들

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'answered': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '대기중';
      case 'answered': return '답변완료';
      case 'resolved': return '해결완료';
      case 'closed': return '종료';
      default: return status || '알 수 없음';
    }
  };

  const getCategoryText = (category) => {
    switch (category?.toLowerCase()) {
      case 'complaint': return '민원';
      case 'inquiry_account': return '계정 문의';
      case 'inquiry_chat': return '채팅 문의';
      case 'inquiry_pay': return '결제 문의';
      case 'inquiry_reservation': return '예약 문의';
      case 'inquiry_ticket': return '이용권 문의';
      case 'inquiry_profile': return '프로필 문의';
        // 기존 호환성을 위한 값들
      case 'payment': return '결제 문의';
      case 'account': return '계정 문의';
      case 'chat': return '채팅 문의';
      case 'reservation': return '예약 문의';
      case 'ticket': return '이용권 문의';
      case 'profile': return '프로필 문의';
      default: return category || '기타';
    }
  };


  if (!isOpen || !complaint) return null;

  const displayData = complaintDetail || complaint?.data || complaint;

  console.log('🎨 ComplaintDetailModal 렌더링:', {
    isOpen,
    complaint: complaint ? complaint : 'null',
    complaintDetail: complaintDetail ? complaintDetail : 'null',
    displayData: displayData,
    'displayData.reservationId': displayData?.reservationId,
    isSubmitting,
    answer: answer.length,
    adminAnswer: adminAnswer ? 'exists' : 'null',
    loadingAnswer,
    isEditing
  });

  return (
    <div className="form-modal-overlay" onClick={onClose}>
      <div className="form-modal-content admin-complaint-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h3>민원 상세 정보</h3>
          <button className="form-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-modal-body">
          {loadingUser ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={24} />
              <p>상세 정보를 불러오는 중...</p>
            </div>
          ) : !displayData ? (
            <div className="empty-state">
              <p>상세 정보를 불러올 수 없습니다.</p>
            </div>
          ) : (
            <div className="admin-complaint-info">
              <div className="info-section">
                <h4>기본 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>민원 번호</label>
                    <div className="info-value">
                      <FileText size={16} />
                      #{displayData.id || 'N/A'}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>작성자</label>
                    <div className="info-value">
                      <User size={16} />
                      {userInfo?.name || userInfo?.nickName || userInfo?.nickname || 
                       userInfo?.displayName || userInfo?.realName || userInfo?.username || 
                       displayData.userName || `사용자${displayData.userId}` || '익명'}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>예약번호</label>
                    <div className="info-value">
                      {displayData.reservationId ? `#${displayData.reservationId}` : '해당 없음'}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>제목</label>
                    <div className="info-value">{displayData.title || '제목 없음'}</div>
                  </div>
                  <div className="info-item">
                    <label>카테고리</label>
                    <div className="info-value">
                      <span className="category-badge">
                        {getCategoryText(displayData.type || displayData.complaintType || displayData.category)}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>상태</label>
                    <div className="info-value">
                      <span 
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(displayData.status || displayData.complaintStatus) + '20',
                          color: getStatusColor(displayData.status || displayData.complaintStatus)
                        }}
                      >
                        {getStatusText(displayData.status || displayData.complaintStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>작성일</label>
                    <div className="info-value">
                      <Calendar size={16} />
                      {displayData.createdAt ? new Date(displayData.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h4>문의 내용</h4>
                <div className="complaint-content-display">
                  <MessageSquare size={20} />
                  <div className="content-text">
                    {displayData.contents || '내용이 없습니다.'}
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>관리자 답변</h4>
                {loadingAnswer ? (
                  <div className="loading-state">
                    <RefreshCw className="spinning" size={24} />
                    <p>답변 정보를 불러오는 중...</p>
                  </div>
                ) : (
                  <>
                    {adminAnswer && !isEditing ? (
                      // 답변이 있고 편집 모드가 아닐 때 - 읽기 모드
                      <div className="complaint-answer-display">
                        <MessageSquare size={20} />
                          <div className="answer-text">
                            {answer || '답변이 없습니다.'}
                          </div>
                          {adminAnswer.createdAt && (
                            <div className="answer-date">
                              <Calendar size={16} />
                              답변일: {new Date(adminAnswer.createdAt).toLocaleString('ko-KR')}
                            </div>
                          )}
                      </div>
                    ) : (
                      // 답변이 없거나 편집 모드일 때 - 편집 모드
                      <div className="complaint-answer-form">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="답변을 입력하세요..."
                          rows="8"
                          className="answer-textarea"
                          disabled={isSubmitting}
                        />
                        <div className="answer-info">
                          <small>답변을 저장하면 사용자에게 이메일로 알림이 발송됩니다.</small>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="form-modal-actions">
          {!loadingAnswer && displayData && (
            <div className="status-actions">
              {adminAnswer && !isEditing && (
                <button 
                  className="coffee-btn coffee-btn-warning"
                  onClick={handleEditAnswer}
                  disabled={isSubmitting}
                >
                  <MessageSquare size={16} /> 답변 수정
                </button>
              )}
              
              {isEditing && (
                <>
                  {adminAnswer && (
                    <button 
                      className="coffee-btn coffee-btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <RefreshCw size={16} /> 취소
                    </button>
                  )}
                  <button
                      className={`coffee-btn coffee-btn-primary ${!answer.trim() ? 'btn-disabled' : ''}`}
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting || !answer.trim()}
                  >
                    {isSubmitting ? '저장 중...' : (adminAnswer ? '답변 수정' : '답변 저장')}
                  </button>
                </>
              )}
            </div>
          )}
          <button className="coffee-btn coffee-btn-secondary" onClick={onClose}>닫기</button>
        </div>
        </div>
      </div>
  );
};

export default ComplaintDetailModal;
