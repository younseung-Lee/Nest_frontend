import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  Edit3,
  RefreshCw,
  Briefcase,
  CheckCircle,
  XCircle,
  User,
  AlertTriangle
} from 'lucide-react';
import {adminAPI} from '../../services/api';
import {accessTokenUtils} from '../../utils/tokenUtils.js';
import CareerDetailModal from './CareerDetailModal';
import './AdminCommon.css';

const CareerManagement = ({isDarkMode}) => {
  console.log('🚀 CareerManagement 컴포넌트 렌더링 시작');

  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // API 요청 함수 - useCallback으로 메모이제이션
  const loadCareers = useCallback(async (showLoading = true) => {
    // 인증 토큰 확인
    const token = accessTokenUtils.getAccessToken();

    if (!token) {
      console.warn('⚠️ 인증 토큰이 없습니다. 로그인이 필요합니다.');
      setError('관리자 로그인이 필요합니다.');
      setCareers([]);
      return;
    }

    if (showLoading) {
      setLoading(true);
      setError(null);
    }

    try {
      const params = {
        page: pagination.page,
        size: pagination.size,
        sort: 'createdAt,desc'
      };

      // 필터가 'all'이 아닌 경우 상태 필터 추가
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      console.log('🔍 경력 목록 조회 요청:', params);

      // API 호출
      const response = await adminAPI.getMentorCareers(params);
      console.log('📋 경력 목록 응답:', response);
      console.log('📋 응답 데이터 구조:', JSON.stringify(response.data, null, 2));

      // 응답 데이터 처리
      let careerData = [];
      if (response.data) {
        if (response.data.data && response.data.data.content && Array.isArray(
            response.data.data.content)) {
          // 페이징된 응답 처리 - 중첩된 구조
          careerData = response.data.data.content;
          console.log('✅ response.data.data.content 경로 사용');
          setPagination(prev => ({
            ...prev,
            totalElements: response.data.data.totalElements || 0,
            totalPages: response.data.data.totalPages || 0
          }));
        } else if (response.data.content && Array.isArray(
            response.data.content)) {
          // 페이징된 응답 처리 - 일반 구조
          careerData = response.data.content;
          console.log('✅ response.data.content 경로 사용');
          setPagination(prev => ({
            ...prev,
            totalElements: response.data.totalElements || 0,
            totalPages: response.data.totalPages || 0
          }));
        } else if (Array.isArray(response.data)) {
          // 배열 형태 응답 처리
          careerData = response.data;
          console.log('✅ 직접 배열 형태');
          setPagination(prev => ({
            ...prev,
            totalElements: response.data.length,
            totalPages: Math.ceil(response.data.length / prev.size)
          }));
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 중첩된 배열 형태
          careerData = response.data.data;
          console.log('✅ response.data.data 경로 사용');
          setPagination(prev => ({
            ...prev,
            totalElements: response.data.data.length,
            totalPages: Math.ceil(response.data.data.length / prev.size)
          }));
        } else {
          // 단일 객체 또는 기타 형태
          console.warn('⚠️ 알 수 없는 응답 구조, 빈 배열 반환');
          careerData = [];
        }
      }

      console.log('📊 파싱된 경력 데이터:', careerData);
      setCareers(careerData);

      if (careerData.length === 0) {
        setPagination(prev => ({
          ...prev,
          totalElements: 0,
          totalPages: 0
        }));
      }

      setError(null);
    } catch (error) {
      console.error('❌ 경력 데이터 로딩 실패:', error);

      // 에러 상태 설정
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);

      // 사용자에게 알림 (자동 새로고침이 아닌 경우만)
      if (showLoading) {
        alert(errorMessage);
      }

      // 에러 시 빈 배열로 설정
      setCareers([]);
      setPagination(prev => ({
        ...prev,
        totalElements: 0,
        totalPages: 0
      }));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.size, filterStatus]);

  // 에러 메시지 처리 함수
  const getErrorMessage = (error) => {
    if (!error.response) {
      return '네트워크 연결을 확인해주세요.';
    }

    switch (error.response.status) {
      case 400:
        return '잘못된 요청입니다. 요청 파라미터를 확인해주세요.';
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '관리자 권한이 필요합니다.';
      case 404:
        return '요청한 데이터를 찾을 수 없습니다.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return '경력 데이터를 불러오는데 실패했습니다.';
    }
  };

  // 자동 새로고침 설정
  useEffect(() => {
    const interval = setInterval(() => {
      loadCareers(false); // 로딩 상태 표시 없이 조용히 새로고침
    }, 30000); // 30초마다

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loadCareers]);

  // 데이터 로딩 (의존성 변경 시)
  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  // 상태 변경
  const handleStatusChange = useCallback(async (careerId, newStatus) => {
    try {
      await adminAPI.updateMentorCareerStatus(careerId, newStatus);
      setCareers(prevCareers => prevCareers.map(career =>
          career.careerId === careerId ? {...career, status: newStatus} : career
      ));
      // 상세 모달이 열려있고, 대상 경력이 바뀐 거라면 모달 내용도 업데이트
      setSelectedCareer(prevSelected => {
        if (prevSelected && prevSelected.careerId === careerId) {
          return {...prevSelected, status: newStatus};
        }
        return prevSelected;
      });
      return true; // 성공 시 true 반환
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
      return false; // 실패 시 false 반환
    }
  }, []);

  // 상세보기
  const handleViewDetail = useCallback(async (career) => {
    setDetailLoading(true);
    try {
      const response = await adminAPI.getMentorCareerDetail(career.careerId);
      const detailData = response.data?.data;
      console.log('상세조회 결과:', detailData);
      if (detailData) {
        setSelectedCareer(detailData);
        setShowDetailModal(true);
      } else {
        alert('경력 상세 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('경력 상세 조회 실패:', error);
      alert('경력 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 첨부파일 다운로드
  const handleFileDownload = async (filename) => {
    try {
      // API를 통해 파일 다운로드 URL을 받아오거나 직접 다운로드 처리
      const response = await adminAPI.downloadCareerFile(filename);

      if (response.data) {
        // Blob 형태로 파일을 받은 경우
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (response.url) {
        // 다운로드 URL을 받은 경우
        const link = document.createElement('a');
        link.href = response.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 필터
  const filteredCareers = useMemo(() => {
    return Array.isArray(careers)
        ? careers.filter(career => {
          const matchesFilter =
              filterStatus === 'all' || career.status === filterStatus;
          return matchesFilter;
        })
        : [];
  }, [careers, filterStatus]);

  // 상태 뱃지
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'AUTHORIZED':
        return {className: 'approved', text: '승인됨', icon: CheckCircle};
      case 'UNAUTHORIZED':
      default:
        return {className: 'rejected', text: '거절됨', icon: XCircle};
    }
  }, []);

  // 날짜 포맷
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) {
      return '-';
    }
    return dateStr.slice(0, 10);
  }, []);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedCareer(null);
    setDetailLoading(false);
  }, []);

  // 페이지 변경
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // 수동 새로고침
  const handleManualRefresh = () => {
    loadCareers(true);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilterStatus('all');
    setPagination(prev => ({...prev, page: 0}));
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  console.log('🎨 CareerManagement 렌더링:', {
    컴포넌트상태: 'rendering',
    경력개수: careers.length,
    로딩상태: loading,
    에러상태: error
  });

  return (
      <div className={`career-management ${isDarkMode ? 'dark-mode' : ''}`} style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="content-header">
          <div className="header-left">
            <h2 className="career-title">
              <Briefcase size={28} />
              경력 관리
            </h2>
            <p>멘토들의 경력 정보를 검토하고 관리합니다</p>
          </div>
          <div className="header-actions">
            <button
                className="btn-secondary"
                onClick={handleManualRefresh}
                disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''}/>
              새로고침
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
            <div className="error-message">
              <AlertTriangle size={18}/>
              {error}
              <button onClick={handleManualRefresh} className="retry-btn">
                재시도
              </button>
            </div>
        )}

        <div className="content-stats">
          <div className="stat-card total" style={{ background: '#FBF9EF' }}>
            <div className="stat-number">{pagination.totalElements}</div>
            <div className="stat-label">총 건수</div>
          </div>
          <div className="stat-card approved" style={{ background: '#FBF9EF' }}>
            <div className="stat-number">{careers.filter(c => c.status === 'AUTHORIZED').length}</div>
            <div className="stat-label">승인됨</div>
          </div>
          <div className="stat-card rejected" style={{ background: '#FBF9EF' }}>
            <div className="stat-number">{careers.filter(c => c.status === 'UNAUTHORIZED').length}</div>
            <div className="stat-label">거절됨</div>
          </div>
        </div>

        <div className="content-table career-table">
          <div className="table-header">
            <div className="table-cell">멘토명</div>
            <div className="table-cell">이메일</div>
            <div className="table-cell">회사</div>
            <div className="table-cell">근무 시작</div>
            <div className="table-cell">근무 종료</div>
            <div className="table-cell">상태</div>
            <div className="table-cell">작업</div>
          </div>
          {loading ? (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24}/>
                <p>경력 데이터를 불러오는 중...</p>
              </div>
          ) : careers.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={48}/>
                <h3>경력이 없습니다</h3>
                <p>
                  {filterStatus !== 'all'
                      ? '검색 조건에 맞는 경력이 없습니다'
                      : '새로운 경력이 등록되면 여기에 표시됩니다'
                  }
                </p>
                {filterStatus !== 'all' && (
                    <button
                        className="btn-secondary"
                        onClick={handleResetFilters}
                    >
                      필터 초기화
                    </button>
                )}
              </div>
          ) : (
              careers.map((career) => {
                const statusBadge = getStatusBadge(career.status);
                const StatusIcon = statusBadge.icon;
                return (
                    <div key={career.careerId} className="table-row" style={{
                      background: 'rgb(251, 249, 239)',
                      borderBottom: '1px solid rgba(255, 179, 0, 0.2)',
                      padding: '20px 32px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                          gap: '0'
                        }}>
                          <User size={16} style={{ color: '#ffb300' }}/>
                          <strong style={{ color: '#e65100', fontWeight: '700' }}>{career.mentorName}</strong>
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
                        <div style={{ textAlign: 'center' }}>{career.mentorEmail}</div>
                      </div>
                      <div className="table-cell" style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6d4c41',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>{career.company}</div>
                      </div>
                      <div className="table-cell" style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6d4c41',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>{formatDate(career.startAt)}</div>
                      </div>
                      <div className="table-cell" style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6d4c41',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>{formatDate(career.endAt)}</div>
                      </div>
                      <div className="table-cell" style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6d4c41',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span
                            className={`status-badge ${statusBadge.className}`}>
                          {statusBadge.text}
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
                              onClick={() => handleViewDetail(career)}
                              title="상세보기"
                              disabled={detailLoading}
                          >
                            <Edit3 size={16}/>
                          </button>
                          {career.status !== 'AUTHORIZED' && (
                              <button
                                  className="action-btn approve"
                                  onClick={() => handleStatusChange(
                                      career.careerId, 'AUTHORIZED')}
                                  title="승인"
                                  disabled={detailLoading}
                              >
                                <CheckCircle size={16}/>
                              </button>
                          )}
                          {career.status !== 'UNAUTHORIZED' && (
                              <button
                                  className="action-btn reject"
                                  onClick={() => handleStatusChange(
                                      career.careerId, 'UNAUTHORIZED')}
                                  title="거절"
                                  disabled={detailLoading}
                              >
                                <XCircle size={16}/>
                              </button>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(0)}
                  disabled={pagination.page === 0 || loading}
              >
                처음
              </button>
              <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0 || loading}
              >
                이전
              </button>

              <span className="pagination-info">
                {pagination.page + 1} / {pagination.totalPages} 페이지
                (총 {pagination.totalElements}개)
              </span>

              <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1
                      || loading}
              >
                다음
              </button>
              <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.totalPages - 1)}
                  disabled={pagination.page >= pagination.totalPages - 1
                      || loading}
              >
                마지막
              </button>
            </div>
        )}

        {showDetailModal && (
            <CareerDetailModal
                isOpen={showDetailModal}
                onClose={handleCloseModal}
                career={selectedCareer}
                onStatusChange={handleStatusChange}
                detailLoading={detailLoading}
                isDarkMode={isDarkMode}
            />
        )}
      </div>
  );
};

export default CareerManagement;

