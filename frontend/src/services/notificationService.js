import sseService from './sseService';
import { accessTokenUtils } from '../utils/tokenUtils';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.isConnected = false;
  }

  // SSE 연결 시작
  connect() {
    const accessToken = accessTokenUtils.getAccessToken();
    
    console.log('=== 알림 서비스 연결 시작 ===');
    console.log('Access Token 존재:', !!accessToken);
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('SSE Endpoint:', import.meta.env.VITE_SSE_ENDPOINT || '/sse/notifications/subscribe');
    
    if (!accessToken) {
      console.warn('❌ Access token이 없어 알림 서비스 연결 불가');
      this.notifyListeners('connection', { status: 'failed', reason: 'no_token' });
      return;
    }

    // SSE 서비스를 사용하여 연결
    sseService.connect(
      accessToken,
      this.handleMessage.bind(this), // 메시지 수신 콜백
      this.handleError.bind(this),   // 에러 콜백
      this.handleOpen.bind(this)     // 연결 성공 콜백
    );
  }

  // SSE 연결 종료
  disconnect() {
    sseService.disconnect();
    this.isConnected = false;
    this.notifyListeners('connection', { status: 'disconnected' });
  }

  // 연결 성공 처리
  handleOpen(event) {
    console.log('✅ 알림 서비스 연결 성공');
    this.isConnected = true;
    this.notifyListeners('connection', { status: 'connected' });
  }

  // 메시지 수신 처리
  handleMessage(event) {
    console.log('📨 알림 메시지 수신:', event);
    
    try {
      // 특별한 이벤트 타입이 있는 경우 처리
      if (event.eventType === 'chat-termination') {
        console.log('🔥 채팅 종료 알림 처리');
        const notificationData = event.parsedData || JSON.parse(event.data);
        this.handleChatTerminationNotification(notificationData);
        return;
      }

      if (event.eventType === 'chat-open') {
        console.log('🚀 채팅 시작 알림 처리');
        const notificationData = event.parsedData || JSON.parse(event.data);
        this.handleChatStartNotification(notificationData);
        return;
      }

      // 일반 메시지 처리
      const notification = JSON.parse(event.data);
      console.log('📄 일반 알림 처리:', notification);
      this.handleNotification(notification);
    } catch (error) {
      console.error('❌ 알림 데이터 파싱 오류:', error, event);
    }
  }

  // 에러 처리
  handleError(event) {
    console.error('❌ 알림 서비스 연결 오류:', event);
    console.error('❌ 에러 세부 정보:', {
      type: event?.type,
      target: event?.target?.readyState,
      url: event?.target?.url,
      message: event?.message
    });
    
    this.isConnected = false;
    
    // 에러 유형별 처리
    if (event?.target?.readyState === EventSource.CLOSED) {
      console.warn('⚠️ SSE 연결이 서버에 의해 닫혔습니다');
    }
    
    // 백엔드가 준비되지 않은 경우 재연결 시도를 중단
    if (event?.target?.url && (
      event?.target?.url.includes('/sse/') || 
      event?.message?.includes('404') ||
      event?.message?.includes('Failed to fetch')
    )) {
      console.warn('⚠️ SSE 엔드포인트가 준비되지 않은 것 같습니다. 재연결을 중단합니다.');
      sseService.disconnect(); // 재연결 방지
      this.notifyListeners('connection', { status: 'endpoint_not_ready' });
      return;
    }
    
    // SSE 서비스가 재연결을 처리하므로 여기서는 상태만 업데이트
    if (!sseService.isConnected()) {
      this.notifyListeners('connection', { status: 'error' });
    }
  }

  // 알림 처리
  handleNotification(notification) {
    // 채팅 관련 알림만 처리하도록 제한
    switch (notification.type) {
      case 'chat_termination':
      case 'chat-termination':
        this.handleChatTerminationNotification(notification);
        break;
      case 'chat_start':
      case 'chat-open':
        this.handleChatStartNotification(notification);
        break;
      default:
        console.log('처리하지 않는 알림 타입:', notification.type);
        break;
    }
  }



  // 채팅 종료 알림
  handleChatTerminationNotification(notification) {
    const terminationNotification = {
      id: `termination_${Date.now()}`,
      type: 'warning',
      style: 'termination',
      title: '채팅 종료 알림',
      timestamp: notification.createdAt || new Date().toISOString(),
      terminationData: {
        content: notification.content || notification.message || '멘토링 세션이 곧 종료됩니다.',
        endTime: notification.endTime || null // 종료 시간이 있다면 포함
      }
    };

    this.notifyListeners('notification', terminationNotification);
  }

  // 채팅 시작 알림
  async handleChatStartNotification(notification) {
    // 백엔드 SSE 이벤트의 다양한 필드명 패턴 매핑
    const chatRoomId = notification.chatRoomId;
    
    const reservationId = notification.reservationId;

    try {
      // 채팅방 ID가 없으면 에러
      if (!chatRoomId) {
        console.error('❌ chatRoomId가 없습니다!', notification);
        // 그래도 기본 알림은 표시
        await this.showChatRoomCreatedNotification('UNKNOWN_ROOM', reservationId);
        return;
      }
      
      // 항상 상세 토스트 표시 (예약 ID가 없어도 기본값으로)
      await this.showChatRoomCreatedNotification(chatRoomId, reservationId);
    } catch (error) {
      console.error('채팅 시작 알림 처리 오류:', error);
      console.error('오류 스택:', error.stack);
      // 오류 시에도 상세 토스트 표시 (기본값으로)
      await this.showChatRoomCreatedNotification(chatRoomId || 'ERROR_ROOM', null);
    }
  }

  // 예약 정보 포함 채팅방 생성 토스트 (상세 토스트만 사용)
  async showChatRoomCreatedNotification(chatRoomId, reservationId = null) {
    console.log('💬 채팅방 생성 토스트 표시 시작:', { chatRoomId, reservationId, type: typeof reservationId });
    
    let reservationData = null;
    let apiError = null;
    let currentUserId = null;
    let currentUserRole = null;
    
    // 현재 로그인한 사용자 정보 가져오기
    try {
      const accessToken = accessTokenUtils.getAccessToken();
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        currentUserId = parseInt(payload.sub || payload.userId || payload.id);
        currentUserRole = payload.role || payload.userRole || payload.authorities?.[0];
        console.log('👤 현재 사용자 정보:', { currentUserId, currentUserRole });
      }
    } catch (error) {
      console.error('❌ 현재 사용자 정보 추출 실패:', error);
    }
    
    // 예약 ID가 있으면 예약 정보 조회 (멘티만 가능, 멘토는 권한 없음)
    if (reservationId) {
      try {
        console.log('🔍 예약 정보 API 호출 중...', reservationId);
        
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const accessToken = accessTokenUtils.getAccessToken();
        
        console.log('🌐 환경 변수 확인:');
        console.log('  - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
        console.log('  - 사용될 baseUrl:', baseUrl);
        console.log('  - accessToken 존재:', !!accessToken);
        console.log('  - accessToken 형태:', accessToken ? (accessToken.startsWith('Bearer') ? 'Bearer 포함' : 'Bearer 미포함') : '없음');
        
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        if (accessToken) {
          headers.Authorization = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
        } else {
          console.warn('⚠️ Access Token이 없습니다!');
        }
        
        console.log('🌐 요청 헤더:', headers);
        
        const apiUrl = `${baseUrl}/api/reservations/${reservationId}`;
        console.log('🌐 최종 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers
        });
        
        console.log('🌐 API 응답 상태:', response.status, response.statusText);
        console.log('🌐 응답 헤더:', Object.fromEntries(response.headers.entries()));
        
        // 응답 본문을 text로 먼저 받아서 확인
        const responseText = await response.text();
        console.log('🌐 응답 본문 (원본):', responseText);
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            reservationData = data.data || data; // API 응답 구조에 따라 조정
            console.log('✅ 예약 정보 조회 성공!');
            console.log('🔍 파싱된 데이터:', data);
            console.log('🔍 추출된 reservationData:', reservationData);
            
            // 상대방과 티켓 정보를 추가로 조회
            if (reservationData) {
              console.log('🔍 추가 정보 조회 시작...');
              
              // 현재 사용자에 따라 상대방 결정
              let partnerUserId = null;
              let partnerRole = null;
              
              if (currentUserId && reservationData.mentor && reservationData.mentee) {
                if (currentUserId === reservationData.mentor) {
                  // 현재 사용자가 멘토 → 멘티 정보 조회
                  partnerUserId = reservationData.mentee;
                  partnerRole = 'MENTEE';
                  console.log('👤 현재 사용자는 멘토 → 멘티 정보 조회:', partnerUserId);
                } else if (currentUserId === reservationData.mentee) {
                  // 현재 사용자가 멘티 → 멘토 정보 조회
                  partnerUserId = reservationData.mentor;
                  partnerRole = 'MENTOR';
                  console.log('👤 현재 사용자는 멘티 → 멘토 정보 조회:', partnerUserId);
                } else {
                  // 일치하지 않는 경우 기본적으로 멘토 정보 조회
                  partnerUserId = reservationData.mentor;
                  partnerRole = 'MENTOR';
                  console.warn('⚠️ 사용자 ID 불일치 - 기본적으로 멘토 정보 조회');
                }
              } else {
                // 정보가 부족한 경우 기본적으로 멘토 정보 조회
                partnerUserId = reservationData.mentor;
                partnerRole = 'MENTOR';
                console.warn('⚠️ 사용자 정보 부족 - 기본적으로 멘토 정보 조회');
              }
              
              // 상대방(파트너) 정보 조회
              if (partnerUserId) {
                try {
                  console.log(`👥 ${partnerRole} 정보 조회 중...`, partnerUserId);
                  const partnerResponse = await fetch(`${baseUrl}/api/users/${partnerUserId}`, { headers });
                  if (partnerResponse.ok) {
                    const partnerText = await partnerResponse.text();
                    const partnerData = JSON.parse(partnerText);
                    reservationData.partnerInfo = partnerData.data || partnerData;
                    reservationData.partnerInfo.role = partnerRole; // 역할 정보 추가
                    console.log('✅ 상대방 정보 조회 성공:', reservationData.partnerInfo);
                  } else {
                    console.warn('⚠️ 상대방 정보 조회 실패:', partnerResponse.status);
                    // 실패 시 기본값 설정
                    reservationData.partnerInfo = { 
                      name: partnerRole === 'MENTOR' ? '멘토' : '멘티', 
                      role: partnerRole 
                    };
                  }
                } catch (partnerError) {
                  console.error('❌ 상대방 정보 조회 오류:', partnerError);
                  // 오류 시 기본값 설정
                  reservationData.partnerInfo = { 
                    name: partnerRole === 'MENTOR' ? '멘토' : '멘티', 
                    role: partnerRole 
                  };
                }
              }
              
              // 티켓 정보 조회 (올바른 엔드포인트 사용)
              if (reservationData.ticket) {
                try {
                  console.log('🎫 티켓 정보 조회 중...', reservationData.ticket);
                  const ticketResponse = await fetch(`${baseUrl}/api/ticket/${reservationData.ticket}`, { headers });
                  if (ticketResponse.ok) {
                    const ticketText = await ticketResponse.text();
                    const ticketData = JSON.parse(ticketText);
                    reservationData.ticketInfo = ticketData.data || ticketData;
                    console.log('✅ 티켓 정보 조회 성공:', reservationData.ticketInfo);
                  } else {
                    console.warn('⚠️ 티켓 정보 조회 실패:', ticketResponse.status);
                    // 실패 시 기본값 설정
                    reservationData.ticketInfo = { name: '멘토링 상담', title: '멘토링 상담' };
                  }
                } catch (ticketError) {
                  console.error('❌ 티켓 정보 조회 오류:', ticketError);
                  // 오류 시 기본값 설정
                  reservationData.ticketInfo = { name: '멘토링 상담', title: '멘토링 상담' };
                }
              }

            }
          } catch (parseError) {
            console.error('❌ JSON 파싱 오류:', parseError);
            console.error('❌ 파싱 실패한 텍스트:', responseText);
            apiError = `JSON 파싱 실패: ${parseError.message}`;
          }
        } else {
          console.error('❌ API 호출 실패:', response.status, response.statusText);
          console.error('❌ 오류 응답 내용:', responseText);
          
          // 403 권한 오류인 경우 특별 처리
          if (response.status === 403) {
            console.warn('⚠️ 예약 정보 조회 권한이 없습니다. 기본값으로 표시합니다.');
            apiError = `권한 없음 (403): 예약 정보 조회 권한이 없습니다`;
          } else if (response.status === 404) {
            console.warn('⚠️ 예약 정보를 찾을 수 없습니다.');
            apiError = `예약 정보 없음 (404): 해당 예약을 찾을 수 없습니다`;
          } else {
            apiError = `API 호출 실패 (${response.status}): ${responseText}`;
          }
        }
      } catch (error) {
        console.error('❌ 예약 정보 조회 중 네트워크 오류:', error);
        console.error('❌ 오류 스택:', error.stack);
        apiError = `네트워크 오류: ${error.message}`;
      }
    } else {
      console.warn('⚠️ reservationId가 없습니다. 예약 정보 조회를 건너뜁니다.');
      apiError = 'reservationId가 제공되지 않음';
    }

    // 항상 상세 토스트 표시 (예약 정보 조회 결과에 따라 다르게 표시)
    console.log('🎨 상세 토스트 생성 중...');
    console.log('🔍 최종 reservationData:', reservationData);
    console.log('🔍 API 에러:', apiError);
    
    // 시간 파싱 함수
    const parseDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return { date: null, time: null };
      const [date, time] = dateTimeStr.split(' ');
      return { date, time: time?.substring(0, 5) }; // HH:MM 형태로
    };
    
    const startDateTime = parseDateTime(reservationData?.reservationStartAt);
    const endDateTime = parseDateTime(reservationData?.reservationEndAt);
    
    const detailedNotification = {
      id: `chat_created_${Date.now()}`,
      type: 'success',
      style: 'detailed',
      title: '멘토링 채팅방이 준비되었습니다!',
      chatRoomId: chatRoomId,
      timestamp: new Date().toISOString(),
      reservationData: {
        // 상대방 이름 표시 (멘토 로그인 시 → 멘티 이름, 멘티 로그인 시 → 멘토 이름)
        partnerName: reservationData?.partnerInfo?.name || 
                    (reservationData?.partnerInfo?.role === 'MENTOR' ? '멘토님' : '멘티님') ||
                    (apiError ? '멘토' : '상대방'),
        partnerRole: reservationData?.partnerInfo?.role || 'MENTOR',
        serviceName: reservationData?.ticketInfo?.name || 
                    reservationData?.ticketInfo?.title ,
        date: startDateTime.date || reservationData?.date || '오늘',
        startTime: startDateTime.time || reservationData?.startTime || '지금',
        endTime: endDateTime.time || reservationData?.endTime || '시간 미정',
        // 사용자에게 유용한 정보만 포함
        reservationId: reservationData?.id || reservationId,
        status: reservationData?.reservationStatus === 'PAID' ? '결제 완료' : 
                reservationData?.reservationStatus === 'PENDING' ? '결제 대기' :
                reservationData?.reservationStatus === 'CANCELLED' ? '취소됨' :
                reservationData?.reservationStatus || '상태 확인 중',
        duration: this.calculateDurationFromTimes(startDateTime.time, endDateTime.time)
      },
      actionText: '멘토링 시작하기',
      // 디버깅 정보 추가 (개발자용)
      _debug: {
        originalReservationData: reservationData,
        apiError: apiError,
        reservationId: reservationId,
        chatRoomId: chatRoomId,
        parsedStartDateTime: startDateTime,
        parsedEndDateTime: endDateTime,
        // 사용자 및 상대방 정보 (디버깅용)
        currentUserId: currentUserId,
        currentUserRole: currentUserRole,
        mentorId: reservationData?.mentor,
        menteeId: reservationData?.mentee,
        partnerInfo: reservationData?.partnerInfo,
        ticketInfo: reservationData?.ticketInfo
      }
    };

    this.notifyListeners('notification', detailedNotification);
  }

  // 연결 상태 확인
  isServiceConnected() {
    return sseService.isConnected();
  }


  // 이벤트 리스너 등록
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 이벤트 리스너 제거
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 리스너들에게 알림
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('리스너 실행 오류:', error);
        }
      });
    }
  }

  // 시간 계산 헬퍼 함수
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return '';
    
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
      }
      return `${diffMins}분`;
    } catch (error) {
      return '';
    }
  }

  // HH:MM 형태의 시간으로 지속시간 계산
  calculateDurationFromTimes(startTime, endTime) {
    if (!startTime || !endTime) return '';
    
    try {
      // HH:MM 형태를 파싱
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const diffMins = endMinutes - startMinutes;
      
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
      }
      return `${diffMins}분`;
    } catch (error) {
      console.error('시간 계산 오류:', error);
      return '';
    }
  }
}

// 싱글톤 인스턴스 생성
const notificationService = new NotificationService();

// 글로벌 함수 등록 (다른 곳에서 사용할 수 있도록)
window.showChatRoomCreatedNotification = (chatRoomId, reservationId = null) => {
  return notificationService.showChatRoomCreatedNotification(chatRoomId, reservationId);
};

window.showChatTerminationNotification = (content, endTime = null) => {
  notificationService.handleChatTerminationNotification({
    content: content,
    endTime: endTime,
    createdAt: new Date().toISOString()
  });
};

  // 🚨 디버깅용 테스트 함수들 (개발 환경에서만 사용)
if (import.meta.env.MODE === 'development') {
  window.testChatRoomNotification = (reservationId = null) => {
    console.log('🧪 채팅방 생성 알림 테스트 시작');
    // 예약 ID가 제공되지 않으면 랜덤하게 생성
    const testReservationId = reservationId || Math.floor(Math.random() * 1000) + 1;
    const testChatRoomId = `test_chat_${Date.now()}`;
    
    console.log(`📋 테스트 예약 ID: ${testReservationId}, 채팅방 ID: ${testChatRoomId}`);
    notificationService.showChatRoomCreatedNotification(testChatRoomId, testReservationId);
  };

  window.testSSEConnection = () => {
    console.log('🔌 SSE 연결 상태:', notificationService.isServiceConnected());
    console.log('🔌 SSE ReadyState:', sseService.getReadyState());
    console.log('🔌 EventSource States: CONNECTING=0, OPEN=1, CLOSED=2');
  };


  // 실제 백엔드 SSE 이벤트 구조 확인용
  window.debugSSEEvent = (eventData) => {
    console.group('🔍 SSE 이벤트 구조 분석');
    console.log('이벤트 원본 데이터:', eventData);
    console.log('데이터 타입:', typeof eventData);
    if (typeof eventData === 'object') {
      console.log('객체 키들:', Object.keys(eventData));
      console.log('각 필드별 값과 타입:');
      Object.entries(eventData).forEach(([key, value]) => {
        console.log(`  ${key}:`, value, `(${typeof value})`);
      });
    }
    console.groupEnd();
    
    // 실제 핸들러로 전달
    notificationService.handleChatStartNotification(eventData);
  };


  // 채팅 종료 토스트 직접 테스트 함수 (5분 전 알림만)
  window.testTerminationToast = (message = null, endTime = null) => {
    console.log('🧪 채팅 종료 토스트 테스트 시작 (5분 전 알림)');
    
    const testMessage = message || '멘토링 세션이 5분 후 종료됩니다. 마무리 준비를 해주세요.';
    const testEndTime = endTime || new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5분 후 종료
    
    console.log('📋 테스트 종료 메시지:', testMessage);
    console.log('📋 테스트 종료 시간:', testEndTime);
    console.log('🕒 현재 시간:', new Date().toISOString());
    console.log('⏰ 실제 시나리오: 세션 종료 5분 전 알림');
    
    notificationService.handleChatTerminationNotification({
      content: testMessage,
      endTime: testEndTime,
      createdAt: new Date().toISOString()
    });
  };

  // SSE 종료 이벤트 시뮬레이션 함수 (5분 전 알림)
  window.testSSETerminationEvent = (chatRoomId = null, message = null) => {
    console.log('🧪 SSE 채팅 종료 이벤트 시뮬레이션 (5분 전 알림)');
    
    const testChatRoomId = chatRoomId || `chat_${Date.now()}`;
    const testMessage = message || '멘토링 세션이 5분 후 종료됩니다. 마무리 준비를 해주세요.';
    
    console.log('📋 테스트 채팅방 ID:', testChatRoomId);
    console.log('📋 테스트 메시지:', testMessage);
    
    // 실제 SSE 이벤트 구조로 시뮬레이션 (5분 후 종료)
    const mockEvent = {
      eventType: 'chat-termination',
      data: JSON.stringify({
        chatRoomId: testChatRoomId,
        content: testMessage,
        endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 후 종료
        createdAt: new Date().toISOString()
      }),
      parsedData: {
        chatRoomId: testChatRoomId,
        content: testMessage,
        endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    };
    
    // SSE 메시지 핸들러로 전달
    notificationService.handleMessage(mockEvent);
  };
}

export default notificationService;