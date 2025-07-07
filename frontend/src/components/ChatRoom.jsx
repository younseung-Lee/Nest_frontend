import React, {useState, useRef, useEffect, Fragment} from 'react';
import {
  Send,
  Paperclip,
  Smile,
  User,
  Home,
  X
} from 'lucide-react';
import './ChatRoom.css';
import {useWebSocket} from '../hooks/useWebSocket';
import {reservationAPI, reviewAPI, userAPI, chatroomAPI, messageAPI} from '../services/api';

const ChatRoom = ({
  contact,
  chatRoomId,
  onBack,
  onBackToHome,
  userId,
  reservationId,
  userRole // 'mentor' 또는 'mentee'를 받거나
}) => {
  // 상태 변수들을 가장 먼저 선언
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChatRoomClosed, setIsChatRoomClosed] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasClosedModal, setHasClosedModal] = useState(false);
  const [reservationStatus, setReservationStatus] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false); // 실제로 리뷰를 작성했는지 추적
  const [reviewCheckLoading, setReviewCheckLoading] = useState(false); // 리뷰 확인 로딩 상태
  const [sessionEndTime, setSessionEndTime] = useState(null); // 세션 종료 시간
  const [fiveMinuteWarningShown, setFiveMinuteWarningShown] = useState(false); // 5분 전 알림 표시 여부
  const[hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const lastRequestedMessageIdRef = useRef(null); // 마지막으로 요청한 메시지 ID 추적
  // 프로필 이미지 관련 상태
  const [partnerProfileImage, setPartnerProfileImage] = useState(null);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  // 현재 사용자가 멘토인지 확인 (부모 컴포넌트에서 전달받은 userRole 사용)
  const isMentor = userRole === 'MENTOR';

  // 비속어 예시 단어들
  const badWords = ['병신', '씨발', '시발', '존나', '바보'];

// 띄어쓰기 포함도 감지: 시 발, 씨 발, 시  발 등
  const censorBadWords = (text) => {
    const normalize = (str) => str.replace(/\s+/g, ''); // 공백 제거
    const rawText = normalize(text);

    const pattern = new RegExp(badWords.map(normalize).join('|'), 'gi');

    let maskedText = text;
    let match;

    while ((match = pattern.exec(rawText)) !== null) {
      const bad = match[0];
      const re = new RegExp(bad.split('').join('\\s*'), 'gi'); // 글자 사이에 어떤 공백도 허용
      maskedText = maskedText.replace(re, '*'.repeat(bad.length));
    }

    return maskedText;
  };


  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // WebSocket 훅
  const {
    isConnected,
    connectionError,
    connect,
    sendMessage: wsSendMessage,
    onMessage
  } = useWebSocket();

  // Props 검증
  useEffect(() => {
    if (!chatRoomId) {
      setError('채팅방 ID가 없습니다.');
      return;
    }
    if (!contact) {
      setError('연락처 정보가 없습니다.');
      return;
    }
    setError(null);
  }, [contact, chatRoomId]);

  // 채팅방 상태가 종료되거나 예약이 완료될 때 리뷰 모달 표시 (멘티만, 리뷰 작성까지)
  useEffect(() => {
    const shouldShowModal = (isChatRoomClosed || reservationStatus === 'COMPLETE') &&
                           !statusLoading &&
                           !reservationLoading &&
                           !reviewCheckLoading && // 리뷰 확인 로딩 중이 아닐 때
                           !hasClosedModal &&
                           !showReviewModal &&
                           !hasWrittenReview && // 아직 리뷰를 작성하지 않았어야 함
                           !isMentor; // 멘토가 아닌 경우에만

    if (shouldShowModal) {
      const reason = isChatRoomClosed ? '채팅방 종료' : '예약 완료';
      console.log(`📝 ${reason}으로 리뷰 모달을 표시합니다 (리뷰 작성까지 반복)`);

      // 사용자가 변화를 충분히 인지할 수 있도록 적절한 딜레이
      const delay = hasClosedModal ? 1000 : (isChatRoomClosed ? 3000 : 1500); // 이미 한번 닫았으면 1초, 처음이면 기존 딜레이

      const timer = setTimeout(() => {
        setShowReviewModal(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isChatRoomClosed, reservationStatus, statusLoading, reservationLoading, reviewCheckLoading, hasClosedModal, showReviewModal, hasWrittenReview, isMentor]);

  // 리뷰 모달 키보드 이벤트 (ESC 키로 닫기) 및 접근성
  useEffect(() => {
    if (showReviewModal) {
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          console.log('⌨️ ESC 키로 리뷰 모달을 닫습니다.');
          handleReviewModalClose();
        }
      };

      document.addEventListener('keydown', handleEscKey);

      // 모달이 열렸을 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';

      // 모달에 포커스 설정 (접근성)
      const modalElement = document.querySelector('.review-modal');
      if (modalElement) {
        modalElement.focus();
        // 포커스 트랩 설정
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const trapFocus = (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        };

        document.addEventListener('keydown', trapFocus);

        // 첫 번째 요소에 포커스
        setTimeout(() => {
          if (firstElement) firstElement.focus();
        }, 100);

        return () => {
          document.removeEventListener('keydown', handleEscKey);
          document.removeEventListener('keydown', trapFocus);
          document.body.style.overflow = 'unset';
        };
      }

      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showReviewModal]);

  // 오버레이 클릭 시 모달 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('🖱️ 오버레이 클릭으로 리뷰 모달을 닫습니다.');
      handleReviewModalClose();
    }
  };

  // 리뷰 작성 여부 확인 (localStorage + API)
  const checkReviewExists = async (reservationId) => {
    if (!reservationId) {
      console.warn('❌ checkReviewExists: 예약 ID가 없습니다');
      return false;
    }

    try {
      setReviewCheckLoading(true);
      console.log(`🔍 예약 ${reservationId}의 리뷰 존재 여부 확인 중...`);

      // 1. 먼저 localStorage에서 리뷰 완료 상태 확인
      const reviewCompletedKey = `review_completed_${reservationId}`;
      const isReviewCompletedLocally = localStorage.getItem(reviewCompletedKey) === 'true';

      console.log(`📋 localStorage 확인: ${reviewCompletedKey} = ${localStorage.getItem(reviewCompletedKey)}`);
      console.log(`📋 localStorage 리뷰 완료 여부: ${isReviewCompletedLocally}`);

      if (isReviewCompletedLocally) {
        console.log(`✅ localStorage에서 예약 ${reservationId} 리뷰 완료 확인됨`);
        setHasWrittenReview(true);
        return true;
      }

      // 2. localStorage에 없으면 API로 확인
      console.log(`📡 API로 리뷰 존재 여부 확인 시작...`);
      console.log(`📡 API 호출 파라미터:`, { reservationId: reservationId });

      try {
        // 멘토는 리뷰를 작성하지 않으므로 체크하지 않음
        if (isMentor) {
          console.log('🔍 멘토는 리뷰를 작성하지 않으므로 리뷰 확인을 건너뜁니다');
          setHasWrittenReview(false);
          return false;
        }

        const response = await reviewAPI.getMyReviews({ reservationId: reservationId });
        console.log(`📡 API 응답:`, response.data);

        const reviews = response.data.content || response.data.data || response.data || [];
        const hasReview = reviews.length > 0;

        setHasWrittenReview(hasReview);

        // API에서 리뷰가 확인되면 localStorage에도 저장
        if (hasReview) {
          localStorage.setItem(reviewCompletedKey, 'true');
          console.log(`💾 API 확인 후 localStorage에 저장: ${reviewCompletedKey} = true`);
        }

        return hasReview;
      } catch (apiError) {
        console.error(`❌ API 호출 실패:`, apiError);

        // 403 에러는 권한 문제이므로 리뷰가 없는 것으로 처리
        if (apiError.response?.status === 403) {
          console.log('📡 403 권한 에러 - 멘토는 리뷰를 조회할 수 없음. 리뷰 없음으로 처리.');
          setHasWrittenReview(false);
          return false;
        }

        // API 호출 실패 시 대체 로직 시도하지 않음
        console.log(`🔄 API 실패 - 리뷰 없음으로 처리`);
        setHasWrittenReview(false);
        return false;
      }

    } catch (err) {
      console.error(`❌ 예약 ${reservationId} 리뷰 확인 실패:`, err);
      console.error('❌ 에러 상세:', err.response?.data || err.message);

      // 에러 발생 시 리뷰가 없는 것으로 가정
      setHasWrittenReview(false);
      return false;
    } finally {
      setReviewCheckLoading(false);
    }
  };

  // 예약 상태 확인
  const checkReservationStatus = async (reservationId) => {
    if (!reservationId) {
      console.warn('❌ checkReservationStatus: 예약 ID가 없습니다');
      return null;
    }

    try {
      setReservationLoading(true);
      console.log(`🔍 예약 ${reservationId}의 상태 확인 중...`);

      // reservationAPI 사용하여 예약 정보 조회
      const response = await reservationAPI.getReservation(reservationId);

      console.log('📋 예약 정보 API 응답:', response.data);

      const reservationData = response.data.data || response.data;
      const status = reservationData.reservationStatus || reservationData.status;

      setReservationStatus(status);

      // 예약 정보에서 종료 시간 설정
      if (reservationData.reservationEndAt) {
        const endDateTime = new Date(reservationData.reservationEndAt);
        setSessionEndTime(endDateTime);
        console.log('📅 세션 종료 시간 설정:', endDateTime.toLocaleString());
      } else if (reservationData.date && reservationData.endTime) {
        const endDateTime = new Date(`${reservationData.date}T${reservationData.endTime}`);
        setSessionEndTime(endDateTime);
        console.log('📅 세션 종료 시간 설정:', endDateTime.toLocaleString());
      }

      console.log(`✅ 예약 ${reservationId} 상태: ${status}`);
      console.log(`🔧 reservationStatus 상태 설정됨:`, status);

      return status;

    } catch (err) {
      console.error(`❌ 예약 ${reservationId} 상태 확인 실패:`, err);
      console.error('에러 상세:', err.response?.data || err.message);

      // 상태 확인 실패 시 null로 설정
      setReservationStatus(null);
      console.log('🔧 에러로 인해 reservationStatus를 null로 설정');
      return null;
    } finally {
      setReservationLoading(false);
    }
  };

  // 상대방 프로필 이미지 가져오기
  const fetchPartnerProfileImage = async () => {
    const partnerId = contact?.id;
    if (!partnerId) {
      console.warn('❌ fetchPartnerProfileImage: 상대방 ID가 없습니다');
      console.log('🔍 현재 contact 정보:', contact);
      return;
    }

    try {
      setProfileImageLoading(true);
      console.log(`🖼️ 상대방 ${partnerId}의 프로필 이미지 가져오는 중...`);
      console.log('🔍 API 호출 URL:', `/api/users/${partnerId}`);

      // 방법 1: 사용자 정보 API를 통해 프로필 이미지 URL 가져오기
      const userResponse = await userAPI.getUserProfileImage(partnerId);
      const userData = userResponse.data.data || userResponse.data;

      
      // 다양한 필드명 시도
      const imageUrl = userData.imgUrl;
                      
      if (imageUrl) {
        setPartnerProfileImage(imageUrl);
        
        // 이미지 로드 테스트
        const img = new Image();
        img.onload = () => {
          console.log(`✅ 프로필 이미지 로드 성공: ${imageUrl}`);
        };
        img.onerror = () => {
          console.error(`❌ 프로필 이미지 로드 실패: ${imageUrl}`);
          setPartnerProfileImage(null);
        };
        img.src = imageUrl;
      } else {
        setPartnerProfileImage(null);
      }

    } catch (error) {
      console.error('❌ 에러 상세:', error.response?.data || error.message);
      
      // 404 에러인 경우 (사용자가 존재하지 않음) 기본 이미지 사용
      if (error.response?.status === 404) {
        console.log('❌ 사용자를 찾을 수 없음 - 기본 이미지 사용');
      } else if (error.response?.status === 403) {
        console.log('❌ 권한 없음 - 기본 이미지 사용');
      }
      
      setPartnerProfileImage(null);
    } finally {
      setProfileImageLoading(false);
    }
  };

  // 상대방 프로필 이미지 로드 (contact 정보가 변경될 때)
  useEffect(() => {
    if (contact?.id) {
      if (contact.profileImage) {
        setPartnerProfileImage(contact.profileImage);
        setProfileImageLoading(false);
      } else {
        fetchPartnerProfileImage();
      }
    } else {
      console.log('❌ Contact ID가 없음');
      setPartnerProfileImage(null);
      setProfileImageLoading(false);
    }
  }, [contact]);

  // 채팅방 상태 확인
  const checkChatRoomStatus = async (chatRoomId) => {
    if (!chatRoomId) {
      console.warn('❌ checkChatRoomStatus: 채팅방 ID가 없습니다');
      return;
    }

    try {
      setStatusLoading(true);
      console.log(`🔍 채팅방 ${chatRoomId}의 상태 확인 중...`);

      // chatroomAPI 사용하여 상태 확인
      const response = await chatroomAPI.getChatroomStatus(chatRoomId);

      console.log('📋 채팅방 상태 API 응답:', response.data);

      // 백엔드에서 "closed" 필드로 응답하므로 이를 사용
      const isClosed = response.data.closed;
      setIsChatRoomClosed(isClosed);
      
      return isClosed;

    } catch (err) {
      console.error(`❌ 채팅방 ${chatRoomId} 상태 확인 실패:`, err);
      console.error('에러 상세:', err.response?.data || err.message);

      // 상태 확인 실패 시 기본적으로 열린 상태로 가정
      setIsChatRoomClosed(false);
      return false;
    } finally {
      setStatusLoading(false);
    }
  };

  // 메시지 불러오기 (최신 메시지들)
  const fetchMessages = async (chatRoomId) => {
    if (!chatRoomId) {
      console.warn('❌ fetchMessages: 채팅방 ID가 없습니다');
      return;
    }

    try {
      setLoading(true);
      console.log(`📥 채팅방 ${chatRoomId}의 최신 메시지 가져오는 중...`);

      // messageAPI 사용하여 메시지 가져오기
      const response = await messageAPI.getMessages(chatRoomId, {size: 20}); // 최신 20개만

      const newMessages = response.data.content
      .slice()
      .reverse()
      .map(msg => ({
        id: msg.messageId,
        text: msg.content,
        sender: msg.isMine ? 'user' : 'other',
        isMine: msg.isMine,
        timestamp: msg.sentAt,
        status: msg.isMine ? 'sent' : 'received'
      }));

      // 메시지를 완전히 새로 설정
      setMessages(newMessages);
      
      // latestMessagesRef도 즉시 업데이트
      latestMessagesRef.current = newMessages;
      
      // 더 이전 메시지가 있는지 설정
      setHasMore(!response.data.last);
      lastRequestedMessageIdRef.current = null;

    } catch (err) {
      console.error(`❌ 채팅방 ${chatRoomId} 메시지 불러오기 실패:`, err);
      if (err.response?.status === 404) {
        console.log('채팅방이 존재하지 않거나 접근 권한이 없습니다.');
        setMessages([]);
        latestMessagesRef.current = [];
      }
    } finally {
      setLoading(false);
      // 로딩 완료 후 즉시 스크롤을 맨 아래로
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({behavior: 'instant'});
        }
      }, 50);
    }
  };

  // WebSocket 연결 및 메시지 수신
  useEffect(() => {
    // 채팅방이 종료되거나 예약이 완료된 경우 WebSocket 연결하지 않음
    if (isChatRoomClosed || reservationStatus === 'COMPLETE') {
      const reason = isChatRoomClosed ? '채팅방 종료' : '예약 완료';
      console.log(`🚫 ${reason}으로 인해 채팅방 ${chatRoomId}에서 WebSocket 연결을 시도하지 않습니다.`);
      return;
    }

    if (!isConnected) {
      console.log('🔌 WebSocket 연결 시도...');
      connect();
    }

    const unsubscribe = onMessage((messageData) => {
      console.log('📨 WebSocket 메시지 수신:', messageData);

      // 메시지 타입이 ERROR인 경우 처리
      if (messageData.type === 'ERROR') {
        console.error('❌ 서버 오류:', messageData);
        return;
      }

      // 현재 채팅방의 메시지인지 확인
      const receivedChatRoomId = messageData.chatRoomId?.toString();
      const currentChatRoomId = chatRoomId?.toString();

      // 내 메시지를 구분하는 조건
      const isMyMessage = messageData.senderId?.toString() === userId?.toString();


      console.log('🔍 채팅방 ID 비교:', {
        received: receivedChatRoomId,
        current: currentChatRoomId,
        match: receivedChatRoomId === currentChatRoomId,
        receiverId: messageData.receiverId,
        currentUserId: userId
      });

      // 채팅방 ID가 일치하는 경우에만 메시지 추가
      if (receivedChatRoomId === currentChatRoomId && currentChatRoomId) {
        const newMessage = {
          id: messageData.id || messageData.messageId || `ws-${Date.now()}`,
          text: messageData.content,
          sender: isMyMessage ? 'user' : 'other',
          isMine: isMyMessage,
          timestamp: messageData.sentAt || new Date().toISOString(),
          status: isMyMessage ? 'sent' : 'received'
        };


        console.log(`✅ 채팅방 ${chatRoomId}에 실시간 메시지 추가:`, newMessage);

        setMessages(prev => {
          // 중복 메시지 확인
          const exists = prev.some(msg => {
            // ID가 같은 경우
            if (msg.id === newMessage.id) return true;

            // 임시 메시지와 실제 메시지가 매칭되는 경우
            if (typeof msg.id === 'string' && msg.id.startsWith('temp-') &&
                msg.text === newMessage.text &&
                msg.sender === newMessage.sender &&
                Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000) {
              return true;
            }

            return false;
          });

          if (exists) {
            console.log('🚫 중복 메시지이므로 무시:', newMessage);
            // 임시 메시지를 실제 메시지로 교체
            const updated = prev.map(msg => {
              if (typeof msg.id === 'string' && msg.id.startsWith('temp-') &&
                  msg.text === newMessage.text &&
                  msg.sender === newMessage.sender &&
                  Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000) {
                console.log('🔄 임시 메시지를 실제 메시지로 교체:', newMessage);
                return newMessage;
              }
              return msg;
            }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // latestMessagesRef도 즉시 업데이트
            latestMessagesRef.current = updated;
            return updated;
          }

          console.log('➕ 새로운 실시간 메시지 추가:', newMessage);
          const updated = [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          // latestMessagesRef도 즉시 업데이트
          latestMessagesRef.current = updated;
          return updated;
        });
      } else {
        console.log(`🚫 다른 채팅방(${receivedChatRoomId})의 메시지이므로 무시 (현재: ${currentChatRoomId})`);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isConnected, connect, onMessage, chatRoomId, userId, isChatRoomClosed, reservationStatus]);

  // 컴포넌트 unmount 시 정리
  useEffect(() => {
    // 🧪 디버깅용 전역 함수 등록 (개발 환경에서만)
    if (import.meta.env.MODE === 'development') {
      window.testPartnerProfile = (testPartnerId) => {
        console.log('🧪 상대방 프로필 API 직접 테스트:', testPartnerId);
        
        userAPI.getUserProfileImage(testPartnerId)
        .then(response => {
          const data = response.data;
          console.log('🔍 사용자 API 응답:', data);
          console.log('🔍 가능한 프로필 이미지 필드들:', {
            imgUrl: data.imgUrl
          });
        })
        .catch(err => console.error('❌ API 오류:', err));
      };
      
    
    }
    
    return () => {
      // 상태 초기화
      setMessages([]);
      latestMessagesRef.current = [];
      setError(null);
      setLoading(false);
      setIsChatRoomClosed(false);
      setStatusLoading(false);
      setShowReviewModal(false);
      setHasClosedModal(false);
      setReservationStatus(null);
      setReservationLoading(false);
      setHasWrittenReview(false);
      setReviewCheckLoading(false);
      setSessionEndTime(null);
      setFiveMinuteWarningShown(false);
      
      // 프로필 이미지 관련 상태 초기화
      setPartnerProfileImage(null);
      setProfileImageLoading(false);
      
      // 디버깅 함수 정리
      if (import.meta.env.MODE === 'development') {
        delete window.testPartnerProfile;
        delete window.getCurrentChatContact;
        delete window.testProfileImageLoad;
      }
      
      // 무한스크롤 관련 상태 초기화
      setHasMore(true); // 무한스크롤 활성화
      loadingMoreRef.current = false;
      lastRequestedMessageIdRef.current = null;
      
      // 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // body 스크롤 복원 (모달이 열려있던 경우를 대비)
      document.body.style.overflow = 'unset';
    };
  }, []);

  // localStorage 변경 감지 (리뷰 완료 시 실시간 업데이트)
  useEffect(() => {
    if (!reservationId) return;

    const reviewCompletedKey = `review_completed_${reservationId}`;

    // 초기 localStorage 확인
    const initialCheck = localStorage.getItem(reviewCompletedKey) === 'true';
    console.log(`📋 초기 localStorage 확인: ${reviewCompletedKey} = ${localStorage.getItem(reviewCompletedKey)}, hasWrittenReview = ${hasWrittenReview}`);
    if (initialCheck && !hasWrittenReview) {
      console.log(`📝 초기 확인에서 예약 ${reservationId} 리뷰 완료 감지됨`);
      setHasWrittenReview(true);
    }

    // localStorage 변경 감지 함수
    const handleStorageChange = (e) => {
      console.log(`📋 localStorage 변경 감지:`, e.key, e.newValue);
      if (e.key === reviewCompletedKey && e.newValue === 'true') {
        console.log(`📝 localStorage에서 예약 ${reservationId} 리뷰 완료 감지됨`);
        setHasWrittenReview(true);
      }
    };

    // storage 이벤트 리스너 등록 (다른 탭에서의 변경 감지)
    window.addEventListener('storage', handleStorageChange);

    // 현재 탭에서의 변경도 감지하기 위한 주기적 체크
    const checkInterval = setInterval(() => {
      const isCompleted = localStorage.getItem(reviewCompletedKey) === 'true';
      if (isCompleted && !hasWrittenReview) {
        console.log(`📝 주기적 체크에서 예약 ${reservationId} 리뷰 완료 감지됨`);
        setHasWrittenReview(true);
      }
    }, 1000); // 1초마다 체크 (더 빠르게)

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [reservationId, hasWrittenReview]);

  // 5분 전 알림 타이머
  useEffect(() => {
    if (!sessionEndTime || fiveMinuteWarningShown || isChatRoomClosed || reservationStatus === 'COMPLETE') {
      return;
    }

    const checkFiveMinuteWarning = () => {
      const now = new Date();
      const timeUntilEnd = sessionEndTime.getTime() - now.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000; // 5분 = 300,000ms

      // 5분 전이거나 그 시점을 지났을 때 (하지만 아직 종료 시간은 지나지 않았을 때)
      if (timeUntilEnd <= fiveMinutesInMs && timeUntilEnd > 0) {
        console.log(`⏰ 세션 종료 5분 전 알림 표시 (남은 시간: ${Math.ceil(timeUntilEnd / 1000 / 60)}분)`);

        // 전역 알림 함수 사용
        if (window.showChatTerminationNotification) {
          const remainingMinutes = Math.ceil(timeUntilEnd / 1000 / 60);
          window.showChatTerminationNotification(
            `멘토링 세션이 ${remainingMinutes}분 후 종료됩니다. 마무리 준비를 해주세요.`,
            sessionEndTime.toISOString()
          );
        }

        setFiveMinuteWarningShown(true);
      }
    };

    // 즉시 한 번 체크
    checkFiveMinuteWarning();

    // 30초마다 체크
    const interval = setInterval(checkFiveMinuteWarning, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionEndTime, fiveMinuteWarningShown, isChatRoomClosed, reservationStatus]);

  // 채팅방 변경 시 메시지 초기화 및 새 메시지 로드
  useEffect(() => {
    if (chatRoomId) {
      console.log(`🔄 채팅방 ${chatRoomId} 변경 - 메시지 로딩 시작`);

      // 상태 초기화 (메시지는 즉시 초기화하지 않음)
      setError(null);
      setLoading(true);
      setIsChatRoomClosed(false);
      setShowReviewModal(false);
      setHasClosedModal(false);
      setReservationStatus(null);
      setReservationLoading(false);
      setHasWrittenReview(false);
      setReviewCheckLoading(false);
      setSessionEndTime(null);
      setFiveMinuteWarningShown(false);
      
      // 프로필 이미지 관련 상태 초기화
      setPartnerProfileImage(null);
      setProfileImageLoading(false);
      
      // 디버깅 함수 정리
      if (import.meta.env.MODE === 'development') {
        delete window.testPartnerProfile;
        delete window.getCurrentChatContact;
        delete window.testProfileImageLoad;
      }
      
      // 무한스크롤 관련 상태 초기화
      setHasMore(true); // 무한스크롤 활성화
      loadingMoreRef.current = false;
      lastRequestedMessageIdRef.current = null;
      
      // 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      console.log('🔄 리뷰 모달 및 예약 상태를 초기화했습니다.');

      // 무한스크롤 관련 상태 초기화
      setHasMore(true); // 무한스크롤 활성화
      loadingMoreRef.current = false;
      lastRequestedMessageIdRef.current = null;
      
      // 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // 1. 먼저 채팅방 상태 확인 후 메시지 가져오기
      const loadChatRoom = async () => {
        try {
          // 1. 채팅방 상태 확인
          const isClosed = await checkChatRoomStatus(chatRoomId);

          // 2. 메시지 가져오기 (종료된 채팅방이나 완료된 예약이어도 기존 메시지는 볼 수 있음)
          await fetchMessages(chatRoomId);

          // 3. 예약 ID가 있으면 항상 리뷰 확인 (채팅방 상태와 무관하게)
          if (reservationId) {
            console.log('📝 예약 ID가 있어 리뷰 존재 여부를 확인합니다...');
            await checkReviewExists(reservationId);
          }

          // 4. 채팅방이 종료된 경우에만 예약 상태 확인
          let reservationComplete = false;
          if (isClosed && reservationId) {
            console.log('📋 채팅방이 종료되어 예약 상태를 확인합니다...');
            const status = await checkReservationStatus(reservationId);
            reservationComplete = status === 'COMPLETE';
          }

          if (isClosed) {
            console.log(`🔒 채팅방 ${chatRoomId}이 종료되었습니다. 읽기 전용 모드입니다.`);
          }

          if (reservationComplete) {
            console.log(`✅ 예약 ${reservationId}이 완료되었습니다.`);
          }
        } catch (error) {
          console.error('채팅방 로딩 실패:', error);
          // 에러 발생 시에만 메시지 초기화
          setMessages([]);
          latestMessagesRef.current = [];
        }
      };

      loadChatRoom();
    }
  }, [chatRoomId]);

  const messagesContainerRef = useRef(null);
  const latestMessagesRef = useRef([]);
  const scrollTimeoutRef = useRef(null); // 스크롤 이벤트 쓰로틀링용

  // 무한스크롤
  const loadMoreMessages = async () => {
    
    // 1. 기본 조건 확인
    if (loading || !hasMore || loadingMoreRef.current) {
      console.log("❌ 로딩 중단:", { loading, hasMore, loadingMoreRef: loadingMoreRef.current });
      return;
    }
    
    const container = messagesContainerRef.current;
    if (!container) {
      console.log("❌ 컨테이너 없음");
      return;
    }

    const oldestMessageId = latestMessagesRef.current[0]?.id;
    console.log("✅ oldestMessageId:", oldestMessageId);
    
    // 2. 유효한 메시지 ID 확인
    if (!oldestMessageId) {
      console.log("❌ 유효하지 않은 oldestMessageId:", oldestMessageId);
      setHasMore(false);
      return;
    }
    
    // 3. 동일한 요청 중복 방지
    if (lastRequestedMessageIdRef.current === oldestMessageId) {
      console.log("❌ 동일한 메시지 ID로 이미 요청했음:", oldestMessageId);
      return;
    }
    
    // 4. 로딩 상태 설정
    loadingMoreRef.current = true;
    lastRequestedMessageIdRef.current = oldestMessageId;
    const previousScrollHeight = container.scrollHeight;
    setLoading(true);

    console.log("✅ loadMoreMessages 요청 파라미터:", {
      size: 20,
      lastMessageId: oldestMessageId,  // 🔧 백엔드와 일치
      url: `/api/chat_rooms/${chatRoomId}/messages`
    });

    try {
      const response = await messageAPI.getMessages(chatRoomId, {
        size: 20,
        lastMessageId: oldestMessageId,  // 🔧 백엔드와 일치
      });


      const newMessages = response.data.content
      .slice()
      .reverse()
      .map((msg) => ({
        id: msg.messageId,
        text: msg.content,
        sender: msg.isMine ? 'user' : 'other',
        isMine: msg.isMine,
        timestamp: msg.sentAt,
        status: msg.isMine ? 'sent' : 'received',
      }));

      console.log("🔍 변환된 새 메시지들:", newMessages.map(m => ({ id: m.id, text: m.text.substring(0, 20) + '...' })));

      // 5. 새 메시지가 없거나 동일한 메시지만 반환된 경우
      if (newMessages.length === 0) {
        console.log("❌ 새 메시지가 없음 - hasMore = false");
        setHasMore(false);
        return;
      }
      
      // 6. 기존 메시지와 중복 확인
      const currentIds = new Set(latestMessagesRef.current.map(m => m.id));
      const actuallyNewMessages = newMessages.filter(msg => !currentIds.has(msg.id));
      

      if (actuallyNewMessages.length === 0) {
        console.log("❌ 모든 메시지가 중복됨 - 백엔드 API 문제 의심!");
        console.log("🔍 백엔드 API 테스트 코드:");

        setHasMore(false);
        return;
      }

      
      // 새 메시지(더 오래된 메시지)를 앞에, 기존 메시지를 뒤에 배치
      const allMessages = [...actuallyNewMessages, ...latestMessagesRef.current];
      
      // 중복 제거 (ID 기준)
      const messageMap = new Map();
      allMessages.forEach((msg) => {
        if (!messageMap.has(msg.id)) {
          messageMap.set(msg.id, msg);
        }
      });

      // 시간순으로 정렬 (오래된 메시지부터)
      const sortedMessages = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      console.log("📊 병합 후 결과:", {
        총메시지수: sortedMessages.length,
        첫번째ID: sortedMessages[0]?.id,
        마지막ID: sortedMessages[sortedMessages.length - 1]?.id
      });

      // 8. 상태 업데이트
      latestMessagesRef.current = sortedMessages;
      setMessages(sortedMessages);
      
      // 9. hasMore 상태 업데이트
      const stillHasMore = !response.data.last && actuallyNewMessages.length > 0;
      setHasMore(stillHasMore);
      
      // 10. 중복 방지 상태 초기화 (성공했으므로)
      lastRequestedMessageIdRef.current = null;
      
      console.log(`✅ 메시지 업데이트 완료 - hasMore: ${stillHasMore}, 총 메시지: ${sortedMessages.length}`);

      // 11. 스크롤 위치 복원 (더 부드럽게)
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeight;
        
        // 부드러운 스크롤 애니메이션
        const startScrollTop = container.scrollTop;
        const targetScrollTop = scrollDiff;
        const duration = 300; // 300ms 애니메이션
        const startTime = performance.now();
        
        function animateScroll(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // easeOutCubic 이징 함수로 부드러운 애니메이션
          const eased = 1 - Math.pow(1 - progress, 3);
          
          container.scrollTop = startScrollTop + (targetScrollTop - startScrollTop) * eased;
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        }
        
        requestAnimationFrame(animateScroll);
        console.log(`📜 부드러운 스크롤 복원: ${scrollDiff}px (이전: ${previousScrollHeight}, 현재: ${newScrollHeight})`);
      });
      
    } catch (err) {
      console.error('❌ 메시지 추가 로딩 실패:', err);
      console.error('❌ 에러 상세:', err.response?.data);
      // 에러 시 요청 기록 초기화
      lastRequestedMessageIdRef.current = null;
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading, messages]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // 스크롤 이벤트 쓰로틀링
    if (scrollTimeoutRef.current) {
      return;
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
      
      // 이미 로딩 중이면 중복 호출 차단
      if (loading || loadingMoreRef.current) {
        return;
      }
      
      // 더 불러올 메시지가 없으면 차단
      if (!hasMore) {
        return;
      }

      // 스크롤 위치가 상단 근처일 때만 로드 (더 부드러운 트리거)
      const scrollThreshold = 200; // 200px 여유 공간
      if (container.scrollTop < scrollThreshold) {
        console.log("🔼 부드러운 스크롤 트리거 -> 이전 메시지 불러오기");
        loadMoreMessages();
      }
    }, 100); // 100ms로 더 빠른 반응
  };

  // 메시지 스크롤 (더 부드럽게)
  useEffect(() => {
    if (messagesEndRef.current && !loading) {
      // 사용자가 스크롤을 올려서 보고 있는 경우 자동 스크롤하지 않음
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        if (isNearBottom) {
          // 부드러운 스크롤로 이동
          messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }
    }
  }, [messages, loading]);

  // 입력창 초기 설정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px'; // 초기 높이 설정
    }
  }, []);

  // 메시지 전송
  const handleSendMessage = async () => {
    console.log('🚀 메시지 전송 시도:', {
      message: message.trim(),
      chatRoomId,
      isChatRoomClosed
    });

    if (!message.trim() || !chatRoomId) {
      console.log('❌ 메시지가 비어있거나 채팅방 ID가 없음');
      return;
    }

    // 채팅방이 종료되거나 예약이 완료된 경우 메시지 전송 차단
    if (isChatRoomClosed || reservationStatus === 'COMPLETE') {
      const reason = isChatRoomClosed ? '종료된 채팅방' : '완료된 예약';
      console.log(`🚫 ${reason}에서는 메시지 전송 차단`);

      const message = isChatRoomClosed
        ? '종료된 채팅방에서는 메시지를 보낼 수 없습니다.'
        : '완료된 멘토링에서는 메시지를 보낼 수 없습니다.';
      alert(message);
      return;
    }

    const messageContent = censorBadWords(message.trim());
    setMessage('');

    // 입력창 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '24px'; // 기본 높이로 복원
    }

    // 즉시 화면에 낙관적 업데이트 (Optimistic Update)
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      text: messageContent,
      sender:'user',
      senderId: userId,  // 백엔드와 동일하게
      isMine: true,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => {
      const updated = [...prev, optimisticMessage];
      // latestMessagesRef도 즉시 업데이트
      latestMessagesRef.current = updated;
      return updated;
    });

    try {
      if (isConnected) {
        console.log('📤 STOMP로 메시지 전송 시도...');
        const wsSuccess = await wsSendMessage(chatRoomId, messageContent);

        if (wsSuccess) {
          console.log('✅ STOMP 메시지 전송 성공 - 서버에서 자동 저장됨');

          // 전송 성공 표시 - 낙관적 업데이트 메시지를 그대로 유지
          setMessages(prev => {
            const updated = prev.map(msg =>
                msg.id === optimisticMessage.id
                    ? {...msg, status: 'sent'}
                    : msg
            );
            // latestMessagesRef도 즉시 업데이트
            latestMessagesRef.current = updated;
            return updated;
          });

          // 서버에서 실제 메시지가 저장되기를 기다린 후 WebSocket으로 받을 것임
          // fetchMessages는 호출하지 않음 - WebSocket으로 실시간 업데이트 받음

          return;
        }
      }

      // WebSocket 연결이 안되어 있거나 전송 실패
      console.error('❌ WebSocket이 연결되지 않아 메시지를 전송할 수 없습니다');
      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== optimisticMessage.id);
        // latestMessagesRef도 즉시 업데이트
        latestMessagesRef.current = updated;
        return updated;
      });
      alert('실시간 연결이 끊어져 메시지를 전송할 수 없습니다. 페이지를 새로고침해주세요.');
      setMessage(messageContent);

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);

      // 전송 실패 시 낙관적 업데이트 메시지 제거
      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== optimisticMessage.id);
        // latestMessagesRef도 즉시 업데이트
        latestMessagesRef.current = updated;
        return updated;
      });

      // 사용자에게 알림
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');

      // 입력창에 메시지 복원
      setMessage(messageContent);

      // 입력창 높이도 복원
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
        textareaRef.current.style.height = newHeight + 'px';
      }
    }
  };

  // 키보드 이벤트
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 텍스트 입력시 자동 높이 조절
  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // 높이 자동 조절
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // 최대 120px
    textarea.style.height = newHeight + 'px';
  };

  // 리뷰 모달 관련 함수들
  const handleReviewModalClose = () => {
    console.log('❌ 사용자가 리뷰 모달을 닫았습니다.');
    setShowReviewModal(false);
    setHasClosedModal(true);
  };



  const handleGoToReview = () => {

    const mentorId = contact?.id || contact?.mentorId;
    const mentorName = contact?.name || contact?.mentorName;

    if (mentorId) {
      // 리뷰 작성 완료로 표시
      setHasWrittenReview(true);
      setShowReviewModal(false);
      setHasClosedModal(true);

      // 예약 ID를 URL에 포함
      const reservationParam = reservationId ? `&reservationId=${reservationId}` : '';

      // 리뷰 페이지로 이동
      window.location.href = `/review/write?mentorId=${mentorId}&mentorName=${encodeURIComponent(mentorName || '멘토')}&chatRoomId=${chatRoomId}${reservationParam}`;
    } else {
      console.error('❌ 멘토 ID를 찾을 수 없습니다:', contact);
      alert('리뷰 작성 페이지로 이동할 수 없습니다. 멘토 정보가 없습니다.');
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // 날짜 포맷팅 (구분선용)
  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 같은 날인지 확인하는 함수
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  // 연속 메시지인지 확인하는 함수 (같은 사람이 연속으로 보낸 메시지)
  const isConsecutiveMessage = (currentMessage, previousMessage) => {
    if (!previousMessage) return false;

    // 같은 발신자이고, 5분 이내에 보낸 메시지인지 확인
    const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp);
    const fiveMinutes = 5 * 60 * 1000; // 5분을 밀리초로

    return currentMessage.sender === previousMessage.sender &&
           timeDiff < fiveMinutes &&
           isSameDay(currentMessage.timestamp, previousMessage.timestamp);
  };

  // 연속 메시지의 마지막인지 확인하는 함수
  const isLastInConsecutiveGroup = (currentMessage, nextMessage) => {
    if (!nextMessage) return true; // 마지막 메시지는 항상 시간 표시

    // 다음 메시지와 연속되지 않으면 현재 메시지가 그룹의 마지막
    const timeDiff = new Date(nextMessage.timestamp) - new Date(currentMessage.timestamp);
    const fiveMinutes = 5 * 60 * 1000;

    return currentMessage.sender !== nextMessage.sender ||
           timeDiff >= fiveMinutes ||
           !isSameDay(currentMessage.timestamp, nextMessage.timestamp);
  };

  // 날짜 구분선이 필요한지 확인하는 함수
  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    // 메시지가 없으면 날짜 구분선도 표시하지 않음
    if (messages.length === 0) return false;

    if (!previousMessage) return true; // 첫 번째 메시지는 항상 날짜 표시
    return !isSameDay(currentMessage.timestamp, previousMessage.timestamp);
  };

// messages 상태와 latestMessagesRef 동기화 (개선된 버전)
  useEffect(() => {
    // loadMoreMessages에서 이미 업데이트했다면 중복 업데이트 방지
    if (latestMessagesRef.current.length === messages.length) {
      const isAlreadySynced = latestMessagesRef.current.every((msg, index) => 
        msg.id === messages[index]?.id
      );
      if (isAlreadySynced) {
        console.log("🔄 latestMessagesRef 이미 동기화됨 - 스킵");
        return;
      }
    }
    
    latestMessagesRef.current = messages;
  }, [messages]);

  // 에러 상태
  if (error) {
    return (
        <div className="chat-room-container">
          <div className="chat-header">
            <div className="chat-header-left">
              <button className="back-button" onClick={onBack}>
                <ArrowLeft className="icon"/>
              </button>
              <div className="contact-info">
                <h3 className="contact-name">에러 발생</h3>
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
            <h3 style={{color: '#ef4444', marginBottom: '8px'}}>오류가 발생했습니다</h3>
            <p style={{color: '#6b7280', marginBottom: '16px'}}>{error}</p>
            <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
            >
              페이지 새로고침
            </button>
          </div>
        </div>
    );
  }

  // 메인 렌더링
  return (
      <div className="chat-room-container">
        {/* 리뷰 작성 모달 */}
        {showReviewModal && (
          <div
            className="review-modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <div
              className="review-modal"
              onClick={(e) => e.stopPropagation()}
              tabIndex="-1"
              role="document"
            >
              <div className="review-modal-header">
                <h2 id="modal-title">🎉 멘토링이 완료되었습니다!</h2>
                <button
                  className="modal-close-button"
                  onClick={handleReviewModalClose}
                  aria-label="모달 닫기"
                >
                  <X className="icon" />
                </button>
              </div>

              <div className="review-modal-content" id="modal-description">
                <div className="mentor-info">
                  <div className="mentor-avatar">
                    {partnerProfileImage || contact?.profileImage ? (
                      <img 
                        src={partnerProfileImage || contact.profileImage} 
                        alt={`${contact.name} 프로필`} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <User className="avatar-icon" />
                    )}
                  </div>
                  <div className="mentor-details">
                    <h3>{contact?.name || contact?.mentorName || '멘토'}님과의 멘토링</h3>
                    <p>소중한 시간을 함께해 주셔서 감사합니다!</p>
                  </div>
                </div>

                <div className="review-actions">
                  <button
                    className="review-detail-button"
                    onClick={handleGoToReview}
                    aria-describedby="review-detail-description"
                  >
                    📝 상세한 리뷰 남기기
                  </button>
                  <div id="review-detail-description" className="sr-only">
                    멘토에게 자세한 피드백을 남길 수 있는 페이지로 이동합니다
                  </div>
                  <button
                    className="review-later-button"
                    onClick={handleReviewModalClose}
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="contact-info">
              <div className="contact-avatar">
                {(() => {
                  if (partnerProfileImage || contact?.profileImage) {
                    const imageUrl = partnerProfileImage || contact.profileImage;
                    return (
                      <img 
                        src={imageUrl} 
                        alt={contact.name}
                        onError={(e) => {
                          console.warn('프로필 이미지 로드 실패:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('✅ 프로필 이미지 로드 성공:', imageUrl);
                        }}
                      />
                    );
                  } else if (profileImageLoading) {
                    console.log('⏳ 로딩 스피너 표시');
                    return (
                      <div className="avatar-loading">
                        <div className="loading-spinner small"></div>
                      </div>
                    );
                  } else {
                    return <User className="avatar-icon"/>;
                  }
                })()}
              </div>
              <div className="contact-details">
                <h3 className="contact-name">
                  {contact?.name || contact?.menteeName || contact?.mentorName || '사용자'}
                </h3>
                <span className={`contact-status ${isChatRoomClosed || reservationStatus === 'COMPLETE' ? 'closed' : ''}`}>
                  {isChatRoomClosed ? (
                    <>
                      <div className="status-indicator-closed"></div>
                      <span>멘토링 종료</span>
                    </>
                  ) : reservationStatus === 'COMPLETE' ? (
                    <>
                      <div className="status-indicator-closed"></div>
                      <span>멘토링 완료</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <div className="status-indicator-disconnected"></div>
                      <span>연결 중...</span>
                    </>
                  ) : (
                    <>
                      <div className="status-indicator"></div>
                      <span>멘토링 중</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="action-button" onClick={onBackToHome}>
              <Home className="icon"/>
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="messages-container">
          {/* 무한스크롤 로딩 인디케이터 (상단) */}
          {loading && hasMore && (
              <div className="loading-indicator top">
                <div className="loading-spinner"></div>
                <span>이전 메시지 불러오는 중...</span>
              </div>
          )}
          
          {/* 일반 로딩 인디케이터 (중앙) */}
          {loading && !hasMore && (
              <div className="loading-indicator">
                <span>메시지를 불러오는 중...</span>
              </div>
          )}

          <div className="messages-list"
               ref={messagesContainerRef}
               onScroll={handleScroll}
          >
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <Fragment key={msg.id}>
                  {/* 날짜 구분선 */}
                  {shouldShowDateSeparator(msg, messages[index - 1]) && (
                    <div className="date-separator">
                      <div className="date-separator-line"></div>
                      <div className="date-separator-text">
                        {formatDateSeparator(msg.timestamp)}
                      </div>
                      <div className="date-separator-line"></div>
                    </div>
                  )}

                  <div
                      className={`message ${
                          msg.isMine ? 'sent' : 'received'
                      } ${isConsecutiveMessage(msg, messages[index - 1]) ? 'consecutive' : ''}`}
                  >
                    {!msg.isMine && (
                        <div className="message-avatar">
                          {partnerProfileImage || contact?.profileImage ? (
                              <img 
                                src={partnerProfileImage || contact.profileImage} 
                                alt={contact.name} 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                          ) : (
                              <User className="avatar-icon" />
                          )}
                        </div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        <span style={{whiteSpace: 'pre-wrap'}}>{msg.text}</span>
                      </div>
                      {/* 연속 메시지의 마지막에만 시간과 상태 표시 */}
                      {isLastInConsecutiveGroup(msg, messages[index + 1]) && (
                        <div className="message-info">
                          <span className="message-time">{formatTime(
                              msg.timestamp)}</span>
                          {msg.isMine && (
                              <span className={`message-status ${msg.status}`}>
                          {msg.status === 'sending' && '⏳'}
                                {msg.status === 'sent' && '✓'}
                        </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Fragment>
              ))
            ) : (
              <div className="no-messages">
                <div className="no-messages-icon">💬</div>
                <div className="no-messages-text">
                  대화를 시작해보세요!
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>
        </div>

        {/* 입력 영역 */}
        {isChatRoomClosed || reservationStatus === 'COMPLETE' ? (
          <div className="message-input-container disabled">
            <div className="chat-closed-notice">
              <div className="chat-closed-visual">
                <div className="chat-closed-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
              <div className="chat-closed-content">
                <div className="title-and-button">
                  <div className="title-section">
                    <span className="chat-closed-title">
                      {isChatRoomClosed ? '멘토링이 종료되었습니다' : '멘토링이 완료되었습니다'}
                    </span>
                    <span className="chat-closed-subtitle">
                      {isMentor
                        ? "멘티가 리뷰를 남길 수 있습니다. 대화 내용은 계속 확인하실 수 있습니다"
                        : hasWrittenReview
                          ? "소중한 리뷰를 남겨주셔서 감사합니다! 멘토님께 큰 도움이 될 것입니다"
                          : hasClosedModal
                            ? "리뷰를 작성하시면 멘토님께 도움이 됩니다"
                            : "잠시만 기다리시면 리뷰 작성 안내가 표시됩니다"
                      }
                    </span>
                  </div>

                  {/* 리뷰 관련 버튼 - 상황에 따라 다르게 표시 */}
                  {(() => {
                    // 멘토는 버튼 표시 안함
                    if (isMentor) return null;

                    // 리뷰를 작성한 경우
                    if (hasWrittenReview) {
                      return (
                        <div className="review-button-section compact top completed">
                          <div className="review-completed-message">
                            <span className="completion-icon">💝</span>
                            <span className="completion-text">소중한 리뷰 감사합니다</span>
                          </div>
                        </div>
                      );
                    }

                    // 모달을 닫았지만 아직 리뷰를 작성하지 않은 경우
                    if (hasClosedModal) {
                      return (
                        <div className="review-button-section compact top">
                          <button
                            className="compact-review-button"
                            onClick={handleGoToReview}
                          >
                            <span className="button-icon">⭐</span>
                            <span className="button-text">리뷰 작성</span>
                          </button>
                        </div>
                      );
                    }

                    // 아직 모달도 닫지 않은 경우 - 버튼 없음
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="message-input-container">
            <div className="message-input-wrapper">
              <button className="attachment-button">
                <Paperclip className="icon"/>
              </button>

              <div className="text-input-container">
              <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지 입력"
                  className="message-textarea"
                  rows="1"
              />
                <button className="emoji-button">
                  <Smile className="icon"/>
                </button>
              </div>

              <button
                  className={`send-button ${message.trim() ? 'active' : ''}`}
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
              >
                <Send className="icon"/>
              </button>
            </div>
          </div>
        )}
      </div>
  );
};

export default ChatRoom;