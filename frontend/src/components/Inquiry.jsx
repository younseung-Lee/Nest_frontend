import React, {useState, useEffect} from 'react';
import {inquiryAPI, reservationAPI, userAPI} from '../services/api';
import './Inquiry.css';
import {useNavigate} from 'react-router-dom';

// 카테고리 한글 매핑 객체
const CATEGORY_LABELS = {
  COMPLAINT: '민원',
  INQUIRY_ACCOUNT: '계정 관련 문의',
  INQUIRY_CHAT: '채팅 관련 문의',
  INQUIRY_PAY: '결제 관련 문의',
  INQUIRY_RESERVATION: '예약 관련 문의',
  INQUIRY_TICKET: '이용권 관련 문의',
  INQUIRY_PROFILE: '프로필 관련 문의',
};
const getCategoryLabel = (key) => CATEGORY_LABELS[key] || key || '-';

// Nest.dev FAQ
const FAQ_LIST = [
  {
    question: "Nest.dev에서는 어떤 서비스를 이용할 수 있나요?",
    answer: `Nest.dev에서는 개발자 멘토링, 코드 리뷰, 실무 프로젝트 Q&A, 이력서·포트폴리오 첨삭, 커리어 상담 등 다양한 개발자 맞춤 서비스를 제공합니다.
서비스 예약 및 진행, 결제, 피드백은 모두 Nest.dev 웹사이트에서 이루어집니다.`
  },
  {
    question: "멘토는 어떻게 찾고 예약할 수 있나요?",
    answer: `상단 카테고리 또는 검색 기능을 통해 원하는 분야(예: 백엔드, 프론트엔드, AI, CS 등)의 멘토를 찾을 수 있습니다.
멘토 프로필에서 제공 서비스, 경력, 후기, 예약 가능 시간을 확인하고 바로 예약 신청이 가능합니다.`
  },
  {
    question: "멘토링·코드리뷰 신청 후 진행 과정은 어떻게 되나요?",
    answer: `1. 멘토를 선택 후 신청서(질문/요청사항 등)와 함께 예약을 완료하면 멘토가 확인 후 수락하게 됩니다.
2. 예약 시간에 맞춰 온라인(채팅/화상/문서)으로 상담이 진행되며, 필요시 코드/문서 첨부도 가능합니다.
3. 멘토링 종료 후 피드백 및 후기를 남길 수 있습니다.`
  },
  {
    question: "결제와 환불 정책은 어떻게 되나요?",
    answer: `모든 서비스 결제는 Nest.dev 내 안전결제 시스템을 이용합니다.
예약 확정 전까지는 무료이며, 멘토가 수락 시 결제가 진행됩니다.
환불 정책은 [이용약관] 및 [환불규정]을 참고해 주세요. 예약 전 취소 시 전액 환불, 서비스 시작 이후 환불 불가입니다.`
  },
  {
    question: "기술 질문(코딩, CS, 진로 등)은 어떻게 남기면 되나요?",
    answer: `멘토 선택 후 "문의하기" 또는 "멘토링 신청"에서 구체적인 질문을 남겨주세요.
질문 내용이 구체적일수록 빠르고 정확한 답변을 받을 수 있습니다.`
  },
  {
    question: "멘토로 참여하고 싶어요. 어떻게 신청하나요?",
    answer: `마이페이지 > 멘토 신청 메뉴에서 지원할 수 있습니다.
심사 후 승인 시 멘토로 활동할 수 있으며, 본인의 전문 분야와 일정에 맞춰 서비스 등록·운영이 가능합니다.`
  },
  {
    question: "Nest.dev에서 진행된 상담/리뷰 기록은 어디서 볼 수 있나요?",
    answer: `내 문의 내역, 예약 내역, 멘토링 이력 등은 마이페이지 또는 고객센터 > 내 문의 내역에서 모두 확인할 수 있습니다.`
  }
];

// 공지사항 데이터
const NOTICE_LIST = [
  {
    id: 1,
    title: "[필독] Nest.dev 서비스 업데이트 안내",
    content: `안녕하세요. Nest.dev를 이용해 주시는 모든 분들께 감사드립니다.

더 나은 서비스 제공을 위해 다음과 같이 업데이트를 진행하였습니다.

• 새로운 기능 추가
  - 멘토링 리뷰 시스템 개선
  - 실시간 채팅 성능 향상
  - 프로필 작성 가이드 추가

• 보안 강화
  - 결제 시스템 보안 업그레이드
  - 개인정보 보호 기능 강화

• 사용성 개선
  - 모바일 화면 최적화
  - 검색 기능 개선
  - 페이지 로딩 속도 향상

이용에 참고하시기 바라며, 문의사항이 있으시면 언제든 고객센터로 연락주세요.

감사합니다.`,
    date: "2024-06-20",
    important: true,
    views: 1250
  },
  {
    id: 2,
    title: "정기 점검 안내 (2024.06.25 02:00~05:00)",
    content: `서비스 안정성 향상을 위한 정기 점검을 실시합니다.

• 점검 일시: 2024년 6월 25일(화) 02:00 ~ 05:00 (약 3시간)
• 점검 내용: 서버 업그레이드 및 데이터베이스 최적화
• 영향 범위: 전체 서비스 일시 중단

점검 중에는 서비스 이용이 불가하오니 양해 부탁드립니다.
점검이 예정보다 일찍 완료되는 경우 별도 공지하겠습니다.

불편을 끼쳐드려 죄송합니다.`,
    date: "2024-06-18",
    important: false,
    views: 892
  },
  {
    id: 3,
    title: "신규 멘토 모집 공고",
    content: `Nest.dev에서 함께할 개발 멘토를 모집합니다!

• 모집 분야
  - 백엔드 개발 (Spring, Node.js, Python 등)
  - 프론트엔드 개발 (React, Vue, Angular 등)
  - 모바일 개발 (React Native, Flutter 등)
  - 데이터 사이언스 & AI/ML
  - DevOps & 클라우드
  - 게임 개발

• 지원 자격
  - 해당 분야 3년 이상 실무 경험
  - 멘토링에 대한 열정과 책임감
  - 정기적인 활동 가능

• 혜택
  - 경쟁력 있는 멘토링 수수료
  - 개발자 네트워크 확장 기회
  - Nest.dev 공식 멘토 인증

관심 있으신 분들의 많은 지원 바랍니다.`,
    date: "2024-06-15",
    important: false,
    views: 673
  },
  {
    id: 4,
    title: "여름 특별 이벤트 - 멘토링 할인 혜택",
    content: `무더운 여름, Nest.dev와 함께 성장하세요!

• 이벤트 기간: 2024.07.01 ~ 2024.08.31
• 할인 혜택
  - 신규 가입자: 첫 멘토링 30% 할인
  - 기존 회원: 멘토링 2회 이상 예약 시 20% 할인
  - 학생 인증 시: 추가 10% 할인

• 특별 프로그램
  - 여름방학 집중 코딩 캠프
  - 포트폴리오 리뷰 이벤트
  - 취업 준비 멘토링 패키지

이 기회를 놓치지 마세요!`,
    date: "2024-06-12",
    important: false,
    views: 1089
  },
  {
    id: 5,
    title: "[중요] 개인정보 처리방침 개정 안내",
    content: `개인정보보호법 개정에 따라 개인정보 처리방침을 개정합니다.

• 개정 시행일: 2024년 6월 10일
• 주요 변경사항
  - 개인정보 보관기간 명시
  - 제3자 제공 범위 구체화
  - 개인정보 처리 목적 세분화
  - 이용자 권리 강화

전문은 홈페이지 하단 '개인정보 처리방침'에서 확인하실 수 있습니다.
궁금한 사항은 고객센터(privacy@nest.dev)로 문의해 주세요.

개인정보 보호를 위해 지속적으로 노력하겠습니다.`,
    date: "2024-06-08",
    important: true,
    views: 567
  }
];

const Inquiry = ({onBack, initialTab = 'inquiries'}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // 'faq', 'inquiries', 'myInquiries', 'create', 'notice'
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null); // 선택된 공지사항
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    reservationId: ''
  });
  const [loading, setLoading] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null); // FAQ 오픈된 항목 인덱스
  const [reservations, setReservations] = useState([]); // 사용자 예약 목록

  // 사용자 예약 목록 조회
  const fetchReservations = async () => {
    try {
      console.log('🔍 예약 목록 조회 시작...');
      const response = await reservationAPI.getReservations();
      console.log('📋 예약 목록 원본 응답:', response);

      if (response.data) {
        let reservationList = response.data.data?.content || response.data.data
            || response.data;
        console.log('📋 파싱된 예약 목록:', reservationList);

        if (Array.isArray(reservationList) && reservationList.length > 0) {
          console.log('📋 첫 번째 예약 데이터 구조:', reservationList[0]);

          // 각 예약에 대해 멘토 이름을 가져와서 표시용 데이터 생성
          const enrichedReservations = await Promise.all(
              reservationList.map(async (reservation) => {
                try {
                  console.log(`🔍 예약 ${reservation.id} 처리 중...`, reservation);

                  // 멘토 이름 가져오기
                  let mentorName = '멘토 정보 없음';
                  if (reservation.mentor && typeof reservation.mentor
                      === 'number') {
                    try {
                      console.log(
                          `👤 멘토 ID ${reservation.mentor}로 사용자 정보 조회 중...`);
                      const mentorResponse = await userAPI.getUserById(
                          reservation.mentor);
                      console.log(`👤 멘토 정보 응답:`, mentorResponse);

                      if (mentorResponse.data?.data) {
                        const mentorData = mentorResponse.data.data;
                        mentorName = mentorData.name || mentorData.nickName
                            || `멘토 ${reservation.mentor}`;
                        console.log(`✅ 멘토 이름 조회 성공: ${mentorName}`);
                      }
                    } catch (mentorError) {
                      console.warn(
                          `⚠️ 멘토 정보 조회 실패 (ID: ${reservation.mentor}):`,
                          mentorError);
                      mentorName = `멘토 ${reservation.mentor}`;
                    }
                  }

                  // 날짜 및 시간 파싱
                  let reservationDate = '날짜 미정';
                  let startTime = '시간 미정';

                  if (reservation.reservationStartAt) {
                    try {
                      // "2025-06-27 09:00:00" 형식에서 날짜와 시간 추출
                      const [datePart, timePart] = reservation.reservationStartAt.split(
                          ' ');
                      reservationDate = datePart; // "2025-06-27"
                      startTime = timePart ? timePart.substring(0, 5) : '시간 미정'; // "09:00"
                      console.log(
                          `📅 날짜 파싱 결과: ${reservationDate}, 시간: ${startTime}`);
                    } catch (dateError) {
                      console.warn('⚠️ 날짜 파싱 실패:', dateError);
                    }
                  }

                  const enrichedReservation = {
                    ...reservation,
                    mentorName,
                    reservationDate,
                    startTime
                  };

                  console.log(`✅ 예약 ${reservation.id} 처리 완료:`,
                      enrichedReservation);
                  return enrichedReservation;
                } catch (error) {
                  console.error(`❌ 예약 ${reservation.id} 처리 실패:`, error);
                  // 처리 실패시 기본 데이터 사용
                  return {
                    ...reservation,
                    mentorName: '멘토 정보 없음',
                    reservationDate: '날짜 미정',
                    startTime: '시간 미정'
                  };
                }
              })
          );

          console.log('✅ 최종 예약 목록 (멘토 이름 포함):', enrichedReservations);
          setReservations(enrichedReservations);
        } else {
          console.log('⚠️ 예약 목록이 비어있음');
          setReservations([]);
        }
      }
    } catch (error) {
      console.error('❌ 예약 목록 조회 실패:', error);
      setReservations([]);
    }
  };

  // 문의 목록 조회
  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await inquiryAPI.getAllComplaints();
      if (response.data) {
        let list = response.data.data?.content || response.data.data
            || response.data;
        setInquiries(list);
      }
    } catch (error) {
      alert('문의 목록을 불러오는데 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 내 문의 내역 조회
  const fetchMyInquiries = async () => {
    try {
      setLoading(true);
      const response = await inquiryAPI.getUserInquiries();
      if (response.data) {
        let list = response.data.data?.content || response.data.data
            || response.data;
        setInquiries(list);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  // 문의 상세 조회
  const fetchInquiryDetail = async (complaintId) => {
    try {
      setLoading(true);
      const response = await inquiryAPI.getUserInquiryDetail(complaintId);
      if (response.data) {
        let inquiryDetail = response.data.data || response.data;

        // 답변이 있는 경우 답변 조회
        if (inquiryDetail.status?.toLowerCase() === 'resolved'
            || inquiryDetail.status?.toLowerCase() === 'answered') {
          try {
            const answerResponse = await inquiryAPI.getUserAnswer(complaintId);
            if (answerResponse.data) {
              const answerData = answerResponse.data.data
                  || answerResponse.data;
              inquiryDetail.answer = answerData.contents || answerData.answer;
              inquiryDetail.answeredAt = answerData.createdAt;
            }
          } catch (answerError) {
            console.error('답변 조회 실패:', answerError);
            // 답변 조회 실패해도 문의 상세는 표시
          }
        }

        setSelectedInquiry(inquiryDetail);
      }
    } catch (error) {
      alert('문의 상세 정보를 불러오는데 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문의 삭제
  const deleteInquiry = async (complaintId) => {
    if (!window.confirm('정말로 이 문의를 삭제하시겠습니까?')) {
      return;
    }
    try {
      setLoading(true);
      await inquiryAPI.deleteUserInquiry(complaintId);
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== complaintId));
      if (selectedInquiry && selectedInquiry.id
          === complaintId) {
        setSelectedInquiry(null);
      }
      alert('문의가 성공적으로 삭제되었습니다.');
    } catch (error) {
      alert('문의 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경/마운트 시 데이터 로딩
  useEffect(() => {
    setSelectedInquiry(null);
    setSelectedNotice(null);
    if (activeTab === 'inquiries') {
      fetchInquiries();
    } else if (activeTab === 'myInquiries') {
      fetchMyInquiries();
    }
  }, [activeTab]);

  // 문의 종류
  const categories = [
    {value: '', label: '문의 종류를 선택해주세요'},
    {value: 'COMPLAINT', label: '민원'},
    {value: 'INQUIRY_ACCOUNT', label: '계정 관련 문의'},
    {value: 'INQUIRY_CHAT', label: '채팅 관련 문의'},
    {value: 'INQUIRY_PAY', label: '결제 관련 문의'},
    {value: 'INQUIRY_RESERVATION', label: '예약 관련 문의'},
    {value: 'INQUIRY_TICKET', label: '이용권 관련 문의'},
    {value: 'INQUIRY_PROFILE', label: '프로필 관련 문의'}
  ];

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 문의 종류가 "민원"으로 변경되면 예약 목록 조회
    if (name === 'category' && value === 'COMPLAINT') {
      fetchReservations();
    }
  };

  // 문의 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return alert('제목을 입력해주세요.');
    }
    if (!formData.category) {
      return alert('문의 종류를 선택해주세요.');
    }
    if (!formData.content.trim()) {
      return alert('문의 내용을 입력해주세요.');
    }
    if (formData.title.trim().length < 2) {
      return alert('제목은 2글자 이상 입력해주세요.');
    }
    if (formData.content.trim().length < 10) {
      return alert(
          '문의 내용은 10글자 이상 입력해주세요.');
    }

    try {
      setLoading(true);
      const requestData = {
        title: formData.title.trim(),
        type: formData.category,
        contents: formData.content.trim(),
        ...(formData.category === 'COMPLAINT'
            && {reservationId: formData.reservationId})
      };
      const response = await inquiryAPI.createInquiry(requestData);
      if (response.data) {
        setFormData({title: '', category: '', content: '', reservationId: ''});
        setActiveTab('myInquiries');
        alert('문의가 성공적으로 등록되었습니다.');
        fetchMyInquiries();
      }
    } catch (error) {
      alert('문의 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태 텍스트/클래스
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return '답변완료';
      case 'answered':
        return '답변완료';
      case 'pending':
        return '답변대기';
      case 'closed':
        return '종료';
      default:
        return status || '답변대기';
    }
  };
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'status-answered';
      case 'answered':
        return 'status-answered';
      case 'pending':
        return 'status-pending';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-pending';
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleInquiryClick = (inquiry) => fetchInquiryDetail(inquiry.id);
  const handleBackToList = () => setSelectedInquiry(null);
  const handleNoticeClick = (notice) => setSelectedNotice(notice);
  const handleBackToNoticeList = () => setSelectedNotice(null);

  // FAQ 아코디언 토글
  const toggleFaq = (idx) => setFaqOpenIndex(faqOpenIndex === idx ? null : idx);

  return (
      <div className="inquiry-page-new">
        {/* 탭 네비게이션 */}
        <div className="inquiry-nav-tabs">
          <div className="tab-buttons">
            <button
                className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('faq');
                  setSelectedInquiry(null);
                }}
            >
              자주 묻는 질문
            </button>
            <button
                className={`tab-button ${activeTab === 'inquiries' ? 'active'
                    : ''}`}
                onClick={() => {
                  setActiveTab('inquiries');
                  setSelectedInquiry(null);
                }}
            >
              문의 사항
            </button>
            <button
                className={`tab-button ${activeTab === 'myInquiries' ? 'active'
                    : ''}`}
                onClick={() => {
                  setActiveTab('myInquiries');
                  setSelectedInquiry(null);
                }}
            >
              내 문의 내역
            </button>
            <button
                className={`tab-button ${activeTab === 'create' ? 'active'
                    : ''}`}
                onClick={() => setActiveTab('create')}
            >
              문의하기
            </button>
            <button
                className={`tab-button ${activeTab === 'notice' ? 'active'
                    : ''}`}
                onClick={() => {
                  setActiveTab('notice');
                  setSelectedInquiry(null);
                  setSelectedNotice(null);
                }}
            >
              공지사항
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="inquiry-main-content">
          <div className="inquiry-content-container">
            {/* 공지사항 탭 */}
            {activeTab === 'notice' && (
                <div className="notice-container">
                  {selectedNotice ? (
                      // 공지사항 상세
                      <div className="notice-detail">
                        <div className="detail-header">
                          <button className="inquiry-back-button"
                                  onClick={handleBackToNoticeList}>
                            <i className="arrow-icon">←</i> 목록으로
                          </button>
                        </div>

                        <div className="detail-card">
                          <div className="detail-card-header">
                            <div className="title-section">
                              <h2 className="detail-title">{selectedNotice.title}</h2>
                              <div className="detail-badges">
                                {selectedNotice.important && (
                                    <span className="important-badge">중요</span>
                                )}
                              </div>
                            </div>
                            <div className="detail-meta">
                              <div className="meta-item">
                                <span className="meta-label">작성일</span>
                                <span
                                    className="meta-value">{selectedNotice.date}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">조회수</span>
                                <span
                                    className="meta-value">{selectedNotice.views?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="detail-content">
                            <div className="content-section">
                              <div className="content-header">
                                <h3>공지 내용</h3>
                                <div className="content-icon">📢</div>
                              </div>
                              <div className="content-body">
                                <pre
                                    className="notice-content">{selectedNotice.content}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  ) : (
                      // 공지사항 목록
                      <div className="notice-list">
                        <h3>공지사항</h3>
                        <p className="notice-description">Nest.dev의 새로운 소식과 중요한
                          공지사항을 확인하세요.</p>

                        <div className="notice-items">
                          {NOTICE_LIST.map(notice => (
                              <div
                                  key={notice.id}
                                  className={`notice-item ${notice.important
                                      ? 'important' : ''}`}
                                  onClick={() => handleNoticeClick(notice)}
                              >
                                <div className="notice-header">
                                  <div className="notice-title-section">
                                    {notice.important && (
                                        <span
                                            className="important-badge">중요</span>
                                    )}
                                    <h4 className="notice-title">{notice.title}</h4>
                                  </div>
                                  <div className="notice-meta">
                                    <span
                                        className="notice-date">{notice.date}</span>
                                    <span
                                        className="notice-views">조회 {notice.views?.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="notice-preview">
                                  {notice.content.split('\n')[0]}...
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
            )}

            {/* FAQ 탭 */}
            {activeTab === 'faq' && (
                <div className="faq-container">
                  <section>
                    <div className="faq-section-title">
                      서비스 이용방법 및 자주 묻는 질문(FAQ)
                    </div>
                    <div>
                      {FAQ_LIST.map((faq, idx) => (
                          <div key={idx} className="faq-item">
                            <div
                                className="faq-question"
                                onClick={() => toggleFaq(idx)}
                            >
                              <span
                                  className="faq-question-text">{faq.question}</span>
                              <svg
                                  className={`faq-toggle-icon ${faqOpenIndex
                                  === idx ? 'open' : ''}`}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                    d="M13.3334 5.33317L8.00008 10.6665L2.66675 5.33317"
                                    stroke="#555"
                                    strokeWidth="1.33333"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div className={`faq-answer ${faqOpenIndex === idx
                                ? 'open' : ''}`}>
                              <div className="faq-answer-content">
                                <span className="faq-answer-bullet">·</span>
                                <span
                                    className="faq-answer-text">{faq.answer}</span>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </section>
                </div>
            )}

            {/* FAQ가 아닌 탭들만 문의/폼/상세 노출 */}
            {activeTab !== 'faq' && activeTab !== 'notice' && (
                <React.Fragment>
                  {selectedInquiry ? (
                      // 문의 상세
                      <div className="inquiry-detail">
                        {/* ...문의 상세 기존 코드 붙이기... */}
                        <div className="detail-header">
                          <button className="inquiry-back-button"
                                  onClick={handleBackToList}>
                            <i className="arrow-icon">←</i> 목록으로
                          </button>
                          <div className="detail-actions">
                            {activeTab === 'myInquiries' && (
                                <button
                                    className="delete-button"
                                    onClick={() => deleteInquiry(
                                        selectedInquiry.id)}
                                    disabled={loading}
                                    title="문의 삭제"
                                >
                                  <i className="delete-icon">🗑️</i> 삭제
                                </button>
                            )}
                          </div>
                        </div>

                        <div className="detail-card">
                          <div className="detail-card-header">
                            <div className="title-section">
                              <h2 className="detail-title">{selectedInquiry.title}</h2>
                              <div className="detail-badges">
                          <span className="category-badge">
                            {getCategoryLabel(selectedInquiry.category
                                || selectedInquiry.type)}
                          </span>
                                <span className={`status-badge ${getStatusClass(
                                    selectedInquiry.status)}`}>
                            {getStatusText(selectedInquiry.status)}
                          </span>
                              </div>
                            </div>
                            <div className="detail-meta">
                              <div className="meta-item">
                                <span className="meta-label">작성일</span>
                                <span className="meta-value">{formatDate(
                                    selectedInquiry.createdAt
                                    || selectedInquiry.created_at)}</span>
                              </div>
                              {selectedInquiry.answeredAt && (
                                  <div className="meta-item">
                                    <span className="meta-label">답변일</span>
                                    <span className="meta-value">{formatDate(
                                        selectedInquiry.answeredAt)}</span>
                                  </div>
                              )}
                            </div>
                          </div>

                          <div className="detail-content">
                            <div className="content-section">
                              <div className="content-header">
                                <h3>문의 내용</h3>
                              </div>
                              <div className="content-body">
                                <p>{selectedInquiry.contents
                                    || selectedInquiry.content}</p>
                              </div>
                            </div>

                            {selectedInquiry.answer ? (
                                <div className="answer-section">
                                  <div className="answer-header">
                                    <h3>답변</h3>
                                  </div>
                                  <div className="answer-content">
                                    <pre
                                        className="answer-text">{selectedInquiry.answer}</pre>
                                  </div>
                                </div>
                            ) : (selectedInquiry.status?.toLowerCase()
                                === 'resolved'
                                || selectedInquiry.status?.toLowerCase()
                                === 'answered') ? (
                                <div className="loading-answer-section">
                                  <div className="loading-answer-icon">🔄</div>
                                  <p>답변을 불러오는 중입니다...</p>
                                </div>
                            ) : (
                                <div className="no-answer-section">
                                  <div className="no-answer-icon">⏳</div>
                                  <p>답변을 기다리고 있습니다</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                  ) : (activeTab === 'inquiries' || activeTab === 'myInquiries')
                      ? (
                          // 문의 목록
                          <div className="inquiries-list">
                            <h3>{activeTab === 'myInquiries' ? '내 문의 내역'
                                : '문의 사항'}</h3>
                            {loading ? (
                                <div className="loading-state"><p>문의 목록을 불러오고
                                  있습니다...</p></div>
                            ) : inquiries.length === 0 ? (
                                <div className="empty-state">
                                  <p>등록된 문의가 없습니다.</p>
                                  {activeTab === 'myInquiries' && (
                                      <button className="create-inquiry-btn"
                                              onClick={() => setActiveTab(
                                                  'create')}>문의하기</button>
                                  )}
                                </div>
                            ) : (
                                <div className="inquiries-table">
                                  <div
                                      className={`inquiry-table-header ${activeTab
                                      === 'myInquiries' ? 'with-actions'
                                          : ''}`}>
                                    <div
                                        className="inquiry-header-cell category">종류
                                    </div>
                                    <div
                                        className="inquiry-header-cell title">제목
                                    </div>
                                    <div
                                        className="inquiry-header-cell date">작성일
                                    </div>
                                    <div
                                        className="inquiry-header-cell status">상태
                                    </div>
                                    {activeTab === 'myInquiries' && <div
                                        className="inquiry-header-cell actions">삭제</div>}
                                  </div>
                                  {inquiries.map(inquiry => (
                                      <div key={inquiry.id}
                                           className={`inquiry-table-row ${activeTab
                                           === 'myInquiries' ? 'with-actions'
                                               : ''}`}>
                                        <div
                                            className="inquiry-table-cell category">
                                          <span
                                              className="category-badge">{getCategoryLabel(
                                              inquiry.category
                                              || inquiry.type)}</span>
                                        </div>
                                        <div
                                            className="inquiry-table-cell title clickable"
                                            onClick={() => handleInquiryClick(
                                                inquiry)}>
                                          {inquiry.title}
                                        </div>
                                        <div
                                            className="inquiry-table-cell date">
                                          {formatDate(inquiry.createdAt
                                              || inquiry.created_at
                                              || inquiry.date)}
                                        </div>
                                        <div
                                            className="inquiry-table-cell status">
                                          <span
                                              className={`status-badge ${getStatusClass(
                                                  inquiry.status)}`}>{getStatusText(
                                              inquiry.status)}</span>
                                        </div>
                                        {activeTab === 'myInquiries' && (
                                            <div
                                                className="inquiry-table-cell actions">
                                              <button
                                                  className="action-button delete-action"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteInquiry(inquiry.id);
                                                  }}
                                                  disabled={loading}
                                                  title="문의 삭제"
                                              >
                                                🗑️
                                              </button>
                                            </div>
                                        )}
                                      </div>
                                  ))}
                                </div>
                            )}
                          </div>
                      ) : (
                          // 문의 등록 폼
                          <div className="inquiry-form-container">
                            <h3>새 문의 등록</h3>
                            <form onSubmit={handleSubmit}
                                  className="inquiry-form">
                              <div className="form-group">
                                <label htmlFor="title">제목 *</label>
                                <input type="text" id="title" name="title"
                                       value={formData.title}
                                       onChange={handleInputChange}
                                       placeholder="문의 제목을 입력해주세요 (2글자 이상)"
                                       required disabled={loading}
                                       maxLength={100} minLength={2}/>
                              </div>
                              <div className="form-group">
                                <label htmlFor="category">종류 *</label>
                                <select id="category" name="category"
                                        value={formData.category}
                                        onChange={handleInputChange} required
                                        disabled={loading}>
                                  <option value="">문의 종류를 선택해주세요</option>
                                  <option value="COMPLAINT">민원</option>
                                  <option value="INQUIRY_ACCOUNT">계정 관련 문의
                                  </option>
                                  <option value="INQUIRY_CHAT">채팅 관련 문의</option>
                                  <option value="INQUIRY_PAY">결제 관련 문의</option>
                                  <option value="INQUIRY_RESERVATION">예약 관련 문의
                                  </option>
                                  <option value="INQUIRY_TICKET">이용권 관련 문의
                                  </option>
                                  <option value="INQUIRY_PROFILE">프로필 관련 문의
                                  </option>
                                </select>
                              </div>
                              {formData.category === 'COMPLAINT' && (
                                  <div className="form-group">
                                    <label htmlFor="reservation">관련 예약 내역
                                      *</label>
                                    <select id="reservation"
                                            name="reservationId"
                                            value={formData.reservationId || ''}
                                            onChange={handleInputChange}
                                            required>
                                      <option value="">예약 내역을 선택해주세요</option>
                                      {reservations.map(reservation => {
                                        const mentorName = reservation.mentorName
                                            || '멘토 정보 없음';
                                        const reservationDate = reservation.reservationDate
                                            || '날짜 미정';
                                        const startTime = reservation.startTime
                                            || '시간 미정';

                                        return (
                                            <option key={reservation.id}
                                                    value={reservation.id}>
                                              {mentorName} - {reservationDate} {startTime}
                                            </option>
                                        );
                                      })}
                                      {reservations.length === 0 && (
                                          <option value="" disabled>예약 내역이
                                            없습니다</option>
                                      )}
                                    </select>
                                  </div>
                              )}
                              <div className="form-group">
                                <label htmlFor="content">내용 *</label>
                                <textarea id="content" name="content"
                                          value={formData.content}
                                          onChange={handleInputChange}
                                          placeholder="문의 내용을 상세히 입력해주세요 (10글자 이상)"
                                          rows="8" required disabled={loading}
                                          maxLength={1000} minLength={10}/>
                                <div
                                    className="char-count">{formData.content.length}/1000
                                </div>
                              </div>
                              <div className="form-actions">
                                <button type="button" className="cancel-btn"
                                        onClick={() => setActiveTab(
                                            'myInquiries')}
                                        disabled={loading}>취소
                                </button>
                                <button type="submit" className="submit-btn"
                                        disabled={loading}>{loading ? '등록 중...'
                                    : '문의 등록'}</button>
                              </div>
                            </form>
                          </div>
                      )}
                </React.Fragment>
            )}
          </div>
        </div>
      </div>
  );
};

export default Inquiry;
