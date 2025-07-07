import axios from 'axios';
import {
  accessTokenUtils,
  refreshTokenUtils,
  userInfoUtils
} from '../utils/tokenUtils';

// API 베이스 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 공개 API 전용 axios 인스턴스 (토큰 없이)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS 설정: 쿠키 및 인증 정보 포함
  timeout: 10000, // 10초 타임아웃
});

// 공개 API는 토큰 없이 요청
publicApi.interceptors.request.use(
    (config) => {
      console.log(
          `🌐 [PUBLIC API] ${config.method?.toUpperCase()} ${config.url} - 토큰 없이 요청`);
      return config;
    },
    (error) => {
      console.error('❌ 공개 API 요청 인터셉터 에러:', error);
      return Promise.reject(error);
    }
);

// 일반 API 인스턴스 (기존 유지)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // CORS 설정: 쿠키 및 인증 정보 포함
  timeout: 15000, // 15초 타임아웃으로 증가
});

// 디버깅을 위한 baseURL 확인
console.log('🔗 API Base URL:', API_BASE_URL);

// 요청 인터셉터 - JWT 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
      // 공개 API 목록 (토큰이 필요하지 않은 엔드포인트)
      const publicEndpoints = [
        '/api/categories',
        '/api/auth/login',
        '/api/auth/signup',
        '/api/mentors/profiles', // 멘토 목록 조회 (로그인 없이도 볼 수 있음)
        '/api/oauth2/login',
        '/api/oauth2/callback',
        '/api/auth/token/refresh',
      ];

      // 현재 요청 URL이 공개 엔드포인트인지 확인
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
          config.url?.includes(endpoint)
      );

      // 요청 로깅
      console.log(
          `🌐 [API 요청] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

      if (isPublicEndpoint) {
        console.log(`📖 [공개 API] 토큰 없이 요청`);
      } else {
        // 비공개 API에만 토큰 추가
        const accessToken = accessTokenUtils.getAccessToken();

        if (accessToken) {
          // 토큰이 이미 "Bearer " 접두사를 포함하고 있는지 확인
          const tokenToUse = accessToken.startsWith('Bearer ') ? accessToken
              : `Bearer ${accessToken}`;
          config.headers.Authorization = tokenToUse;
          console.log(`🔑 [인증 API] Authorization 헤더 추가: ${tokenToUse.substring(0,
              30)}...`);

          // 토큰 검증 (디버깅용)
          if (!tokenToUse.startsWith('Bearer ')) {
            console.error('❌ Authorization 헤더 형식 오류: Bearer 접두사 누락');
          }
          console.log(
              `🔑 [전체 Authorization 헤더] ${config.headers.Authorization}`);
        } else {
          console.warn(`⚠️ [인증 API] Access Token이 없음 - ${config.url}`);
        }
      }

      // 요청 헤더 로깅
      console.log(`📋 [요청 헤더]`, JSON.stringify(config.headers, null, 2));

      return config;
    },
    (error) => {
      console.error('❌ 요청 인터셉터 에러:', error);
      return Promise.reject(error);
    }
);

// 세션 만료 처리 상태 관리
let isSessionExpired = false;
let sessionExpireAlertShown = false;

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
    (response) => {
      console.log(
          `✅ [API 응답] ${response.config.method?.toUpperCase()} ${response.config.url} - 상태: ${response.status}`);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      console.error(
          `❌ [API 에러] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
      console.error(
          `❌ [에러 상태] ${error.response?.status} ${error.response?.statusText}`);
      console.error(`❌ [에러 데이터]`, error.response?.data);

      // 회원탈퇴 API는 자동 토큰 갱신에서 제외 (비밀번호 검증 실패와 구분하기 위해)
      const isDeleteUserRequest = originalRequest?.url?.includes(
              '/api/users/me') &&
          originalRequest?.method?.toLowerCase() === 'delete';

      if (error.response?.status === 401 && !originalRequest._retry
          && !isDeleteUserRequest && !isSessionExpired) {
        originalRequest._retry = true;

        console.log('🔄 401 에러 감지 - 토큰 갱신 시도...');

        try {
          const refreshToken = refreshTokenUtils.getRefreshToken();
          if (!refreshToken) {
            throw new Error('Refresh token이 없습니다');
          }

          // 토큰 갱신 요청
          const refreshResponse = await axios.post(
              `${API_BASE_URL}/api/auth/token/refresh`, {
                refreshToken: refreshToken
              });

          const newAccessToken = refreshResponse.data.data.accessToken;
          accessTokenUtils.setAccessToken(newAccessToken);

          // 원래 요청에 새 토큰으로 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('✅ 토큰 갱신 성공 - 원래 요청 재시도');

          return api(originalRequest);

        } catch (refreshError) {
          console.error('❌ 토큰 갱신 실패:', refreshError);

          // 세션 만료 상태로 설정 (중복 처리 방지)
          if (!isSessionExpired) {
            isSessionExpired = true;
            
            // 토큰 갱신 실패 시 로그아웃 처리
            accessTokenUtils.removeAccessToken();
            refreshTokenUtils.removeRefreshToken();

            // 현재 페이지가 로그인 페이지가 아닌 경우에만 처리
            if (!window.location.pathname.includes('/login') && !sessionExpireAlertShown) {
              sessionExpireAlertShown = true;
              alert('로그인이 필요합니다!');
              
              // 홈페이지로 리다이렉트 (로그인 상태 초기화)
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            }
          }
        }
      }

      // 세션이 만료된 상태에서는 추가 에러 처리 없이 거부
      if (isSessionExpired && error.response?.status === 401) {
        return Promise.reject(new Error('세션이 만료되었습니다.'));
      }

      // CORS 에러 처리
      if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
        console.error('🚫 네트워크/CORS 에러 감지');
        error.isCorsError = true;
      }

      return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
  // 로그인
  login: (loginData) => api.post('/api/auth/login', loginData),

  // 회원가입
  signup: (signupData) => api.post('/api/auth/signup', signupData),

  // 로그아웃 (refreshToken을 body에 포함)
  logout: () => {
    const refreshToken = refreshTokenUtils.getRefreshToken();
    const logoutData = {
      refreshToken: refreshToken
    };
    return api.delete('/api/auth/logout', {data: logoutData});
  },

  // 토큰 갱신
  refresh: () => {
    const refreshToken = refreshTokenUtils.getRefreshToken();
    return api.post('/api/auth/token/refresh', {refreshToken});
  },

  // OAuth2 로그인 URL 가져오기
  getOAuth2CallbackUrl: (code) => api.get(`/oauth2/callback`, {params: {code}}),

  // email 인증코드 보내기
  sendEmailVerificationCode: (email) => api.post('/api/auth/signup/code', {email}),

  // 인증코드 검증
  verifyEmail: (email, authCode) => api.post('/api/auth/signup/code/verify', {email, authCode}),

};

// User API
export const userAPI = {
  // 마이페이지 조회
  getUser: () => api.get('/api/users/me'),

  getUserById: (userId) => api.get(`/api/users/${userId}`),

  // 사용자 정보 업데이트 (간단한 버전)
  updateUser: (userData) => {
    console.log('📤 사용자 정보 업데이트:', userData);
    return api.patch('/api/users/me', userData);
  },

  // 비밀번호 수정
  updatePassword: (passwordData) => api.patch('/api/users/me/password',
      passwordData),

  // 추가정보 입력
  updateExtraInfo: (extraInfoData) => api.patch('/api/users/me/extraInfo',
      extraInfoData),

  // 회원 탈퇴
  deleteUser: (deleteData) => {
    return api.delete('/api/users/me', {data: deleteData});
  },

  // 프로필 이미지 업로드 (최초 등록)
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('files', file);
    
    return api.post('/api/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 프로필 이미지 수정
  updateProfileImage: (file) => {
    const formData = new FormData();
    formData.append('files', file);
    
    return api.patch('/api/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 프로필 이미지 삭제
  deleteProfileImage: () => api.delete('/api/users/profile-image'),

  // 프로필 이미지 조회
  getUserProfileImage: (userId) => api.get(`/api/users/${userId}/profile-image`),
};

// Profile API
export const profileAPI = {
  // 모든 멘토 프로필 조회 (공개 API - 토큰 없이)
  getAllMentors: () => publicApi.get('/api/mentors/profiles'),

  // 프로필 생성
  createProfile: (profileData) => api.post('/api/profiles', profileData),

  // 내 프로필 전체 조회
  getMyProfile: () => api.get('/api/profiles/me'),

  // 멘토 상세 조회 (공개 API - 토큰 없이)
  getMentorDetail: (userId, profileId) => publicApi.get(
      `/api/users/${userId}/profiles/${profileId}`),

  // 키워드로 검색 (공개 API - 토큰 없이)
  searchMentors: (keyword) => publicApi.get('/api/mentors/profiles',
      {params: {keyword}}),

  // 추천 멘토 프로필 조회 (공개 API - 토큰 없이)
  getRecommendedMentors: (params) => publicApi.get(
      '/api/mentors/recommended-profiles', {params}),

  // 프로필 수정
  updateProfile: (profileId, profileData) => api.patch(
      `/api/profiles/${profileId}`, profileData),

  // 프로필 경력 조회
  getCareerList: (profileId) => api.get(`/api/profiles/${profileId}/careers`),

  // 티켓 조회
  getTicketList: () => api.get('/api/ticket'),

  // 프로필 삭제
  deleteProfile: (profileId) => api.delete(`/api/profiles/${profileId}`),
};

// Consultation API
export const consultationAPI = {
  // 상담 목록 조회
  getConsultations: (params) => api.get('/api/mentor/consultations', {params}),

  // 상담 생성
  createConsultation: (consultationData) => api.post(
      '/api/mentor/consultations', consultationData),

  // 상담 상세 조회
  getConsultationDetail: (consultationId) => api.get(
      `/api/consultations/${consultationId}`),

  getAvailableConsultationSlots: (mentorId, localDate) =>
      api.get(`/api/mentor/${mentorId}/availableConsultations`, {
        params: { localDate }
      }),

  // 상담 상태 업데이트
  updateConsultationStatus: (consultationId, status) =>
      api.patch(`/api/consultations/${consultationId}/status`, {status}),

  // 상담 시간 삭제
  deleteConsultation: (consultationId) =>
      api.delete(`/api/mentor/consultations/${consultationId}`),
};

// Reservation API
export const reservationAPI = {
  // 예약 목록 조회
  getReservations: ({ page, size }) => api.get(`/api/reservations?page=${page}&size=${size}`),

  // 예약 단건 조회
  getReservation: (reservationId) => api.get(
      `/api/reservations/${reservationId}`),

  // 예약 생성
  createReservation: (reservationData) => api.post('/api/reservations',
      reservationData),

  // 예약 취소
  cancelReservation: (reservationId) => api.delete(
      `/api/reservations/${reservationId}`),

  // 멘토 가능 시간 조회
  getMentorAvailableSlots: (mentorId, date) =>
      api.get(`/api/reservations/mentors/${mentorId}/slots`, {params: {date}}),
};

// Chatroom API
export const chatroomAPI = {
  // 채팅방 목록 조회 (페이지네이션 지원)
  getChatroomsWithPagination: (params) => api.get('/api/chat_rooms', { params }),

  // 채팅방 상태 확인
  getChatroomStatus: (chatroomId) => api.get(`/api/chat_rooms/${chatroomId}/status`),
};

// Message API
export const messageAPI = {
  // 메시지 목록 조회
  getMessages: (chatroomId, params) =>
      api.get(`/api/chat_rooms/${chatroomId}/messages`, {params}),

};

// Payment API
export const paymentAPI = {
  // 결제 준비
  preparePayment: (paymentData) => api.post('/api/v1/payments/prepare', paymentData),

  // 토스페이먼츠 결제 승인
  confirmPayment: (confirmData) => api.post('/api/v1/payments/confirm',
      confirmData),

  // 결제 확인
  verifyPayment: (paymentId) => api.get(`/api/payments/${paymentId}/verify`),

  // 결제 취소
  cancelPayment: (paymentId, cancelData) => api.post(
      `/api/v1/payments/${paymentId}/cancel`, cancelData),

  // 결제 내역 조회
  getPaymentHistory: ({ page, size }) => api.get(`/api/v1/payments?page=${page}&size=${size}`),

  // 결제 상세 조회 (URL 패턴 통일)
  getPaymentDetail: (paymentId) => api.get(`/api/v1/payments/${paymentId}`),
};

// Review API
export const reviewAPI = {
  // 리뷰 목록 조회
  getReviews: (mentorId, params) =>
      api.get(`/api/mentors/${mentorId}/reviews`, {params}),

  // 리뷰 작성 (예약 기반)
  createReview: (reservationId, reviewData) => 
      api.post(`/api/reservations/${reservationId}/reviews`, reviewData),


  // 리뷰 수정
  updateReview: (reviewId, reviewData) =>
      api.patch(`/api/reviews/${reviewId}`, reviewData),

  // 리뷰 삭제
  deleteReview: (reviewId) => api.delete(`/api/reviews/${reviewId}`),

  // 내 리뷰 목록 조회
  getMyReviews: (params) => api.get('/api/reviews', { params }),
};

// Category API
export const categoryAPI = {
  // 카테고리 목록 조회 (공개 API - 토큰 없이)
  getCategories: () => publicApi.get('/api/categories'),

  // 카테고리별 멘토 조회 (공개 API - 토큰 없이)
  getMentorsByCategory: (categoryId, params) =>
      publicApi.get(`/api/categories/${categoryId}/mentors`, {params}),
};

// Notification API
export const notificationAPI = {
  // 알림 목록 조회 (SSE 알림 내역)
  getNotifications: (params) => api.get('/sse/notifications', {params}),

};

// Ticket API
export const ticketAPI = {
  // 티켓 목록 조회
  getTickets: (ticketId, params) =>
      api.get(`/api/ticket`, {params}),

  // 티켓 단건 조회
  getTicket: (ticketId) => api.get(`/api/ticket/${ticketId}`),

  // 티캣 작성
  createTicket: (ticketData) => api.post('/api/admin/ticket', ticketData),

  // 티켓 수정
  updateTicket: (ticketId, ticketData) =>
      api.patch(`/api/admin/ticket/${ticketId}`, ticketData),

  // 티켓 삭제
  deleteTicket: (ticketId) => api.delete(`/api/admin/ticket/${ticketId}`),
}

// User Coupon API (사용자 쿠폰 API)
export const userCouponAPI = {
  // 사용자 쿠폰 목록 조회 (페이징 처리)
  getUserCoupons: (params = {}) => {
    // 기본 파라미터 설정
    const defaultParams = {
      page: 0,
      size: 20, // Payment.js에서 사용할 수 있도록 충분한 개수
      sort: 'createdAt,desc'
    };

    const finalParams = {...defaultParams, ...params};
    return api.get('/api/user-coupons', {params: finalParams});
  },

  // 사용자 쿠폰 등록 (쿠폰 코드 입력 등)
  registerUserCoupon: (couponData) => api.post('/api/user-coupons', couponData),

  // 사용자 쿠폰 사용 처리
  useCoupon: (couponData) => api.patch('/api/user-coupons/use', couponData),
};

// Inquiry API (문의 API)
export const inquiryAPI = {
  // [사용자] 문의 생성
  createInquiry: (inquiryData) => api.post('/api/complaints', inquiryData),

  // [사용자] 전체 문의 목록 조회
  getAllComplaints: (params) => api.get('/api/complaints', {params}),

  // [사용자] 내 문의 목록 조회
  getUserInquiries: (params) => api.get('/api/complaints/myComplaints',
      {params}),

  // [사용자] 문의 답변 조회
  getUserAnswer: (complaintId) => api.get(`/api/complaints/${complaintId}/answer`),


  // [사용자] 내 문의 상세 조회 (== 일반 상세 조회)
  getUserInquiryDetail: (complaintId) => api.get(
      `/api/complaints/${complaintId}`),

  // // [사용자] 내 문의 삭제
  deleteUserInquiry: (complaintId) => api.delete(
      `/api/complaints/${complaintId}`),
};

// 파일 업로드 전용 axios 인스턴스 (Content-Type 미지정)
const fileApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

// Career API
export const careerAPI = {
  // 경력 전체 목록 조회
  getAllCareers: ({page, size}) => api.get(`/api/careers?page=${page}&size=${size}`),

  // 경력 상세 조회
  getCareerDetail: (profileId, careerId) => api.get(
      `/api/profiles/${profileId}/careers/${careerId}`),

  // 경력 삭제
  deleteCareer: (careerId) => api.delete(`/api/careers/${careerId}`),

  // 자격증(증명서) 수정
  updateCertificate: (careerId, certificateData) => {
    const token = accessTokenUtils.getAccessToken();
    return fileApi.patch(
        `/api/careers/${careerId}/certificates`,
        certificateData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
    );
  },

  // 경력 생성
  createCareer: (profileId, careerData) => {
    const token = accessTokenUtils.getAccessToken();
    return fileApi.post(
        `/api/profiles/${profileId}/careers`,
        careerData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
    )
  },

  // 경력 수정
  updateCareer: (careerId, careerData) => api.patch(`/api/careers/${careerId}`, careerData),
};

// Keyword API
export const keywordAPI = {
  // 키워드 조회
  getKeywords: () => api.get('/api/keywords'),
}

// === 관리자 전용 API ===
export const adminAPI = {
  // 1. 멘토 경력 전체 목록 조회
  getMentorCareers: (params) => api.get('/api/admin/mentor-careers', { params }),

  // 2. 멘토 경력 단건 조회
  getMentorCareerDetail: (careerId) => api.get(`/api/admin/mentor-careers/${careerId}`),

  // 3. 멘토 경력 상태 변경(승인/거절)
  updateMentorCareerStatus: (careerId, status) =>
      api.patch(`/api/admin/mentor-careers/${careerId}/status`, { status }),

  // [관리자] 전체 문의 목록 조회
  getAllInquiries: (params) => api.get('/api/admin/complaints', {params}),

  // [관리자] 문의 상세 조회
  getInquiryDetail: (complaintId) => api.get(
      `/api/admin/complaints/${complaintId}`),

  // [관리자] 문의 답변 등록
  createInquiryAnswer: (complaintId, answerData) =>
      api.post(`/api/admin/complaints/${complaintId}/answer`, answerData),

  // [관리자] 문의 답변 조회
  getAdminAnswer: (complaintId) => api.get(`/api/admin/complaints/${complaintId}/answer`),

  // [관리자] 문의 삭제
  deleteInquiry: (complaintId) => api.delete(
      `/api/admin/complaints/${complaintId}`),

  // [관리자] 문의 답변 수정
  updateAnswer: (answerId, answerData) => api.patch(`/api/admin/answers/${answerId}`, answerData),

  // [관리자] 쿠폰 등록
  registerCoupon: (couponData) => api.post('/api/admin/coupons', couponData),

  // [관리자] 쿠폰 목록 조회
  findCoupons: () => api.get('/api/admin/coupons'),

  // [관리자] 쿠폰 수정
  updateCoupon: (couponId, couponData) => api.patch(`/api/admin/coupons/${couponId}`, couponData),

  // [관리자] 쿠폰 삭제
  deleteCoupon: (couponId) => api.delete(`/api/admin/coupons/${couponId}`),

  // [관리자] 키워드 등록
  createKeyword: (keywordData) => api.post('/api/admin/keywords', keywordData),

  // [관리자] 키워드 수정
  updateKeyword: (keywordId, keywordData) => api.patch(`/api/admin/keywords/${keywordId}`, keywordData),

  // [관리자] 키워드 삭제
  deleteKeyword: (keywordId) => api.delete(`/api/admin/keywords/${keywordId}`),

  // [관리자] 카테고리 등록
  createCategory: (categoryData) => api.post('/api/admin/categories', categoryData),

  // [관리자] 카테고리 수정
  updateCategory: (categoryId, categoryData) => api.patch(`/api/admin/categories/${categoryId}`, categoryData),

  // [관리자] 카테고리 삭제
  deleteCategory: (categoryId) => api.delete(`/api/admin/categories/${categoryId}`),

  // [관리자] 리뷰 목록 조회
  getReviewList: (params) => api.get('/api/admin/reviews', {params}),

  // [관리자] 리뷰 샅태 변경
  changeReviewStatus: (reviewId) => api.patch(`/api/admin/reviews/${reviewId}`),


};



export default api;
