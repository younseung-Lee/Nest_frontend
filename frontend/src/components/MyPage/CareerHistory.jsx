import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Briefcase, Edit3, Trash2, Plus, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { careerAPI, profileAPI } from '../../services/api';
import CareerDetailModal from './CareerDetailModal';
import CareerEditModal from './CareerEditModal';
import './CareerHistory.css';

// 경력 아이템 표시 컴포넌트
const CareerItem = ({ career, onEdit, onDelete }) => (
  <div className="careers-info-card">
    <div className="careers-info-card-icon"><Briefcase color="white" /></div>
    <div className="careers-info-card-content">
      <span className="careers-info-card-label">
        {career.company}
        {career.careerStatus === 'AUTHORIZED' && (
            <BadgeCheck
                size={16}
                color="black"
                fill="gold"
                style={{ marginLeft: '8px', verticalAlign: 'middle' }}
            />
        )}
      </span>
      <p className="careers-info-card-value">
        {career.startAt?.slice(0, 10)} ~ {career.endAt ? career.endAt.slice(0, 10) : '재직중'}
      </p>
    </div>
    <div className="careers-info-card-actions">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onEdit(career);
        }} 
        className="action-btn edit"
      >
        <Edit3 size={18} />
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(career.id);
        }} 
        className="action-btn delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

const CareerHistory = ({ userInfo }) => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [careerDetail, setCareerDetail] = useState(null);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    career: null,
    isEditing: false
  });
  const fileInputRef = useRef(null);
  const [editingCertInfo, setEditingCertInfo] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ⭐ 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(0); // API는 0-indexed 페이지 사용
  const [totalPages, setTotalPages] = useState(0);
  const [totalCareers, setTotalCareers] = useState(0); // 전체 경력 개수
  const [pageSize] = useState(10); // 한 페이지에 보여줄 경력 개수

  const hasAnyCareer = totalCareers > 0;

  useEffect(() => {
    if (userInfo?.userRole !== 'MENTOR') {
      return;
    }

    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size'); // URL에서 size 파라미터도 읽기

    // URL의 page를 0-indexed로 파싱 (page 파라미터가 없으면 0으로 기본값)
    const pageToFetch = pageParam ? parseInt(pageParam, 10) : 0;
    // URL의 size를 파싱하거나, 유효하지 않으면 기본 pageSize 사용
    const sizeToFetch = sizeParam ? parseInt(sizeParam, 10) : pageSize;

    // 유효한 페이지 번호인지 확인 (음수 방지)
    const validPageToFetch = Math.max(0, pageToFetch);

    // 데이터 불러오기
    fetchCareers(validPageToFetch, sizeToFetch);

  }, [searchParams, userInfo, pageSize]);

  const fetchCareers = async (page, size) => {
    setLoading(true);
    setError(null);
    try {
      const response = await careerAPI.getAllCareers({page, size});
      const paginationData = response.data?.data;
      const rawCareers = response.data?.data?.content || [];
      setCareers(rawCareers);
      setTotalPages(paginationData?.totalPages || 0);
      setTotalCareers(paginationData?.totalElements || 0);
    } catch (err) {
      setError("경력 정보를 불러오는데 실패했습니다.");
      setCareers([]);
      setTotalPages(0);
      setTotalCareers(0);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      setSearchParams({ page: newPage, size: pageSize });
    }
  };

  const handleSave = async () => {

    const currentPageFromUrl = searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 0;
    setSearchParams({ page: currentPageFromUrl, size: pageSize });
    closeEditModal();
    setSelectedProfileId('');
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await careerAPI.deleteCareer(id);
        alert("경력이 삭제되었습니다.");
        if (careers.length === 1 && currentPage > 0) {
          setSearchParams({ page: currentPageFromUrl - 1, size: pageSize });
        } else {
          setSearchParams({ page: currentPageFromUrl - 1, size: pageSize });
        }
      } catch (err) {
        console.error("경력 삭제 실패:", err);
        alert("경력 삭제에 실패했습니다.");
      }
    }
  };

  // 상세보기 핸들러
  const handleCardClick = async (career) => {
    try {
      const res = await careerAPI.getCareerDetail(career.profileId, career.id);
      setCareerDetail(res.data.data);
    } catch (err) {
      alert('상세 정보를 불러오지 못했습니다.');
    }
  };

  // 수정 모달 열기
  const openEditModal = (career = null) => {
    setEditModal({
      isOpen: true,
      career,
      isEditing: !!career
    });
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      career: null,
      isEditing: false
    });
    setSelectedProfileId('');
  };

  // 경력 수정 핸들러
  const handleEditCareer = (career) => {
    openEditModal(career);
  };

  // 모달에서 수정 버튼 클릭 시
  const handleEditFromModal = (career) => {
    setCareerDetail(null);
    openEditModal(career);
  };

  // 모달에서 삭제 버튼 클릭 시
  const handleDeleteFromModal = (career) => {
    if (window.confirm("정말 이 경력을 삭제하시겠습니까?")) {
      setCareerDetail(null); // 모달 닫기
      careerAPI.deleteCareer(career.id)
        .then(() => {
          alert("경력이 삭제되었습니다.");
          const currentPageFromUrl = searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 0; // ⭐ 0으로 기본값
          if (careers.length === 1 && currentPageFromUrl > 0) { // ⭐ 0페이지보다 클 때만 이전 페이지로
            setSearchParams({ page: currentPageFromUrl - 1, size: pageSize });
          } else {
            setSearchParams({ page: currentPageFromUrl, size: pageSize });
          }
        })
        .catch(err => {
          console.error("경력 삭제 실패:", err);
          alert("경력 삭제에 실패했습니다.");
        });
    }
  };

  // 자격증 수정 버튼 클릭 시 파일 입력창 열기
  const handleEditCertificates = (career) => {
    setEditingCertInfo({
      careerId: career.id,
    });
    fileInputRef.current.click();
  };

  // 파일 선택 후 API 호출 (여러 파일)
  const handleFileSelected = async (event) => {
    const files = event.target.files;
    if (files && editingCertInfo) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      try {
        await careerAPI.updateCertificate(
          editingCertInfo.careerId,
          formData
        );
        alert('자격증이 성공적으로 수정되었습니다.');
        setCareerDetail(null);
        const currentPageFromUrl = searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 0; // ⭐ 0으로 기본값
        setSearchParams({ page: currentPageFromUrl, size: pageSize });
      } catch (err) {
        console.error("자격증 수정 실패:", err);
        alert("자격증 수정에 실패했습니다.");
      } finally {
        setEditingCertInfo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // 새 경력 추가 버튼 클릭 시 프로필 목록 조회
  const handleAddCareer = async () => {
    try {
      const res = await profileAPI.getMyProfile();
      // 응답 구조에 따라 data.data 또는 data.content 등으로 접근 필요
      const profileList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.content || []);
      setProfiles(profileList);
      openEditModal();
    } catch (err) {
      alert('프로필 목록을 불러오지 못했습니다.');
    }
  };
  // ⭐ 페이지네이션 렌더링 로직
  const renderPagination = () => {
    if (totalPages <= 1) return null; // 페이지가 1개 이하면 페이지네이션을 표시하지 않습니다.

    const pageNumbers = [];
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 0) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(0, totalPages - 5);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
          <button
              key={i}
              className={`career-pagination-button ${i === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(i)}
          >
            {i + 1} {/* 사용자에게는 1부터 시작하는 페이지 번호를 표시합니다. */}
          </button>
      );
    }
    return ( // ⭐ renderPagination 함수의 return 문 시작
        <div className="career-pagination-controls">
          <button
              className="career-pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
          >
            <ChevronLeft size={16} />
            이전
          </button>
          {startPage > 0 && <span>...</span>} {/* 시작 페이지 이전에 페이지가 더 있다면 ... 표시 */}
          {pageNumbers}
          {endPage < totalPages - 1 && <span>...</span>} {/* 끝 페이지 이후에 페이지가 더 있다면 ... 표시 */}
          <button
              className="career-pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
    );
  }; // ⭐ renderPagination 함수의 닫는 중괄호

  if (userInfo?.userRole !== 'MENTOR') return null;
  if (loading) return <div className="loading-spinner">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="career-history-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        accept="image/*,.pdf"
        multiple
      />
      
      <h3>경력 목록 ({totalCareers}개)</h3>

      {hasAnyCareer ? (
          <>
            <div className="career-list">
              {careers.map(career => (
                  <div key={career.id} onClick={() => handleCardClick(career)} style={{ cursor: 'pointer' }}>
                    <CareerItem
                        career={career}
                        onEdit={handleEditCareer}
                        onDelete={handleDelete}
                    />
                  </div>
              ))}
            </div>
            {renderPagination()}
          </>
      ) : (
          <div className="empty-career-list">
            <p>등록된 경력이 없습니다. 새로운 경력을 추가해보세요!</p>
          </div>
      )
      }
      
      <button onClick={handleAddCareer} className="add-career-btn">
        <Plus size={18} /> 새 경력 추가
      </button>

      {/* 경력 수정/추가 모달 */}
      <CareerEditModal
        career={editModal.career}
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onSave={handleSave}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        setSelectedProfileId={setSelectedProfileId}
      />

      {/* 경력 상세보기 모달 */}
      {careerDetail && (
        <CareerDetailModal
          detail={careerDetail}
          onClose={() => setCareerDetail(null)}
          onEdit={() => handleEditFromModal(careerDetail)}
          onDelete={() => handleDeleteFromModal(careerDetail)}
          onEditCertificates={() => handleEditCertificates(careerDetail)}
        />
      )}
    </div>
  );
};

export default CareerHistory;
