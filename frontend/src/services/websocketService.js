// STOMP WebSocket 서비스 - useWebSocket 훅과 호환되는 버전
import { Client } from '@stomp/stompjs';
import { accessTokenUtils, websocketTokenUtils } from '../utils/tokenUtils';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnectedState = false;
    this.messageHandlers = new Map(); // callbackId -> callback 매핑
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;

    this.connectionPromise = null;
    this.websocketToken = null; // 소켓 전용 토큰 저장
  }

  // 연결 상태 확인
  isConnected() {
    return this.isConnectedState && this.stompClient && this.stompClient.connected;
  }

  // STOMP WebSocket 연결
  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const token = accessTokenUtils.getAccessToken();
        if (!token) {
          console.error('❌ JWT 토큰이 없습니다 - WebSocket 연결 중단');
          reject(new Error('토큰이 없습니다'));
          return;
        }

        // JWT 토큰 만료 확인
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expTime = payload.exp * 1000; // seconds to milliseconds
          const currentTime = Date.now();
          
          if (expTime < currentTime) {
            console.error('❌ JWT 토큰이 만료되었습니다 - WebSocket 연결 중단');
            console.error(`토큰 만료 시간: ${new Date(expTime).toISOString()}`);
            console.error(`현재 시간: ${new Date(currentTime).toISOString()}`);
            reject(new Error('JWT 토큰이 만료되었습니다'));
            return;
          }
          
          console.log('✅ JWT 토큰 유효성 확인 완료');
        } catch (tokenError) {
          console.error('❌ JWT 토큰 파싱 실패 - WebSocket 연결 중단:', tokenError);
          reject(new Error('유효하지 않은 JWT 토큰입니다'));
          return;
        }

        // WebSocket 전용 서브토큰 발급
        try {
          console.log('🔐 WebSocket 전용 서브토큰 발급 요청...');
          this.websocketToken = await websocketTokenUtils.generateWebSocketToken();
          console.log('✅ WebSocket 서브토큰 발급 완료:', this.websocketToken.substring(0, 20) + '...');
        } catch (tokenError) {
          console.error('❌ WebSocket 서브토큰 발급 실패:', tokenError);
          reject(new Error('WebSocket 서브토큰 발급 실패'));
          return;
        }

        // WebSocket URL에 토큰을 파라미터로 추가
        const baseUrl = import.meta.env.VITE_WS_URL || 'wss://www.nest-dev.click';
        const wsUrl = `${baseUrl}/ws-nest/websocket?token=${encodeURIComponent(this.websocketToken)}`;
        console.log('🔌 WebSocket 연결 시도 (토큰 파라미터):', baseUrl + '/ws-nest/websocket?token=***');
        
        // STOMP 클라이언트 생성 (헤더에서 토큰 완전 제거)
        this.stompClient = new Client({
          brokerURL: wsUrl,
          connectHeaders: {
            // Authorization 헤더 완전 제거 - URL 파라미터로만 인증
          },
          debug: (str) => {
            console.log('🔍 STOMP Debug:', str);
          },
          reconnectDelay: 0, // 자동 재연결 비활성화 (수동으로 관리)
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          // WebSocket 팩토리 설정 (브라우저 호환성)
          webSocketFactory: () => {
            return new WebSocket(wsUrl);
          }
        });

        // 연결 성공 시
        this.stompClient.onConnect = (frame) => {
          console.log('🟢 STOMP WebSocket 연결 성공!');
          console.log('📋 연결 프레임:', frame);
          console.log('👤 현재 사용자 ID:', this.getCurrentUserId());
          console.log('🔍 STOMP 클라이언트 상태:', this.stompClient.state);
          console.log('🔍 STOMP 연결 상태:', this.stompClient.connected);
          
          this.isConnectedState = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          
          // 연결 성공 후 잠시 대기 후 구독 설정 (STOMP 클라이언트 완전 초기화 보장)
          setTimeout(() => {
            console.log('🔄 구독 설정 시작...');
            this.subscribeToPersonalMessages();
          }, 100);
          
          resolve();
        };

        // 연결 실패 시
        this.stompClient.onStompError = (frame) => {
          console.error('❌ STOMP 프로토콜 에러:', frame.headers['message']);
          console.error('📝 에러 상세:', frame.body);
          
          // JWT 관련 에러인지 확인
          const errorMessage = frame.headers['message'] || frame.body || '';
          if (errorMessage.includes('JWT') || errorMessage.includes('토큰') || errorMessage.includes('인증')) {
            console.error('🚫 JWT 인증 실패 - 재연결하지 않음');
          }
          
          this.connectionPromise = null;
          reject(new Error(`STOMP Error: ${frame.headers['message']}`));
        };

        // 연결 끊김 시
        this.stompClient.onDisconnect = () => {
          console.log('🔴 STOMP WebSocket 연결 끊김');
          this.isConnectedState = false;
          this.connectionPromise = null;
          this.websocketToken = null; // 토큰 초기화
          // 자동 재연결은 하지 않음 (수동으로 관리)
        };

        // WebSocket 레벨 에러 시
        this.stompClient.onWebSocketError = (error) => {
          console.error('🔴 WebSocket 레벨 에러:', error);
          console.error('🔗 연결 시도했던 URL:', baseUrl + '/ws-nest/websocket?token=***');
          this.connectionPromise = null;
          
          reject(new Error(`WebSocket connection failed to ${baseUrl}/ws-nest/websocket`));
        };

        // 연결 시작
        console.log('🚀 STOMP 클라이언트 활성화 중...');
        this.stompClient.activate();

      } catch (error) {
        console.error('🔴 STOMP 클라이언트 생성 실패:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // 개인 메시지 구독
  subscribeToPersonalMessages() {
    if (!this.stompClient) {
      console.error('❌ STOMP 클라이언트가 존재하지 않습니다');
      return false;
    }
    
    if (!this.stompClient.connected) {
      console.error('❌ STOMP 클라이언트가 연결되지 않았습니다');
      console.log('🔍 현재 STOMP 상태:', this.stompClient.state);
      return false;
    }

    try {
      console.log('📡 메시지 구독 설정 시작...');
      console.log('🔍 구독 전 STOMP 상태 확인:', {
        state: this.stompClient.state,
        connected: this.stompClient.connected,
        hasSubscriptions: !!this.stompClient.subscriptions
      });
      
      const subscriptions = [];

      // 2. 사용자별 개인 메시지 구독
      const userId = this.getCurrentUserId();
      if (userId) {
        try {
          const userDestination = `/user/queue/message`;
          console.log('📡 개인 메시지 구독 시도:', userDestination);
          
          const userSubscription = this.stompClient.subscribe(userDestination, (message) => {
            console.log('🎯 개인 메시지 수신!', message.body);
            try {
              const messageData = JSON.parse(message.body);
              this.processReceivedMessage(messageData);
            } catch (error) {
              console.error('❌ 개인 메시지 파싱 실패:', error);
            }
          });
          
          if (userSubscription && userSubscription.id) {
            subscriptions.push(userSubscription);
            console.log('✅ 개인 메시지 구독 성공 - ID:', userSubscription.id);
          }
        } catch (error) {
          console.error('❌ 개인 메시지 구독 예외:', error);
        }
      }

      return true;
      
    } catch (error) {
      console.error('❌ 구독 설정 전체 실패:', error);
      return false;
    }
  }

  // 수신된 메시지 처리 (중복 제거)
  processReceivedMessage(messageData) {
    // 메시지 데이터 정규화
    const normalizedMessage = {
      id: messageData.id || messageData.messageId || `ws-${Date.now()}`,
      content: messageData.content || messageData.text,
      chatRoomId: messageData.chatRoomId,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId, // 백엔드 MessageResponseDto의 receiverId 필드 추가
      mine: messageData.isMine, // isMine 필드도 지원
      sentAt: messageData.sentAt || messageData.timestamp
          || new Date().toISOString(),
      type: messageData.type || 'MESSAGE'
    };
    
    // 등록된 모든 메시지 핸들러에게 전달
    this.handleMessage(normalizedMessage);
  }
  // JWT 토큰에서 사용자 ID 추출
  getCurrentUserId() {
    try {
      const token = accessTokenUtils.getAccessToken();
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || payload.id;
    } catch (error) {
      console.error('토큰 파싱 실패:', error);
      return null;
    }
  }

  // STOMP WebSocket 연결 해제
  disconnect() {
    console.log('🔌 WebSocket 연결 해제 시작...');
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    // 상태 초기화
    this.isConnectedState = false;
    this.connectionPromise = null;
    this.websocketToken = null;
    
    console.log('✅ WebSocket 연결 해제 완료');
  }

  // 강제 재연결
  async forceReconnect() {
    this.disconnect();
    await this.connect();
  }

  // 메시지 전송
  async sendMessage(chatRoomId, content) {
    if (!this.isConnected()) {
      throw new Error('STOMP WebSocket이 연결되지 않았습니다');
    }

    if (!chatRoomId || !content?.trim()) {
      throw new Error('채팅방 ID와 메시지 내용이 필요합니다');
    }

    try {
      const message = {
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      // STOMP를 통해 특정 채팅방으로 메시지 전송
      this.stompClient.publish({
        destination: `/app/chat_room/${chatRoomId}/message`,
        body: JSON.stringify(message)
      });
      
      console.log(`📤 채팅방 ${chatRoomId}로 STOMP 메시지 전송 완료:`, message);
      return true;
    } catch (error) {
      console.error('📤 STOMP 메시지 전송 실패:', error);
      throw error;
    }
  }

  // 메시지 수신 핸들러 등록
  onMessage(callbackId, callback) {
    if (typeof callback !== 'function') {
      console.error('❌ 콜백은 함수여야 합니다');
      return;
    }
    this.messageHandlers.set(callbackId, callback);
  }

  // 메시지 수신 핸들러 제거
  offMessage(callbackId) {
    return this.messageHandlers.delete(callbackId);
  }

  // 모든 메시지 핸들러에게 메시지 전달
  handleMessage(data) {
    this.messageHandlers.forEach((handler, callbackId) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`메시지 핸들러 에러 (${callbackId}):`, error);
      }
    });
  }

  // 디버그 정보 반환 (useWebSocket 훅 호환용)
  getDebugInfo() {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      handlersCount: this.messageHandlers.size,
      stompState: this.stompClient ? this.stompClient.state : 'NULL',
      stompConnected: this.stompClient ? this.stompClient.connected : false,
      hasClient: !!this.stompClient,
      websocketToken: !!this.websocketToken,
      subscriptionsCount: this.stompClient && this.stompClient.subscriptions ? 
        Object.keys(this.stompClient.subscriptions).length : 0
    };
  }


  // 이벤트 리스너 제거
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return false;
    }
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      return true;
    }
    return false;
  }

}

// 싱글톤 인스턴스
const websocketService = new WebSocketService();
export default websocketService;
