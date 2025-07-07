import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {authAPI} from './api';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.authenticationFailed = false; // JWT 인증 실패 플래그
    this.lastTokenError = null; // 마지막 토큰 에러 정보
    this.isManualDisconnect = false; // 수동 연결 해제 플래그
  }

  async connect() {
    // JWT 토큰 만료 문제로 인한 무한 재연결 방지를 위해 연결 완전 차단
    console.error('🚫 WebSocket 연결이 완전히 비활성화되었습니다');
    console.error('💡 JWT 토큰 만료로 인한 무한 재연결을 방지하기 위함입니다');
    console.error('💡 새로운 유효한 토큰을 획득한 후 이 코드를 수정하세요');
    this.emit('connectionFailed', new Error('WebSocket connection disabled'));
    return;

    try {
      // 이전 인증 실패로 인한 연결 차단 확인
      if (this.authenticationFailed) {
        const errorMsg = 'WebSocket connection blocked due to authentication failure. Please refresh token and try again.';
        console.error(errorMsg);
        this.emit('authenticationBlocked', {
          reason: 'JWT authentication failed',
          lastError: this.lastTokenError
        });
        return;
      }

      this.isManualDisconnect = false;
      let socketToken = '';

      try {
        const res = await authAPI.refresh();
        socketToken = res.data.token;

        // 토큰 획득 성공 시 인증 실패 플래그 리셋
        this.authenticationFailed = false;
        this.lastTokenError = null;

        console.log('✅ Valid token obtained for WebSocket connection');
      } catch (tokenError) {
        console.error('❌ Failed to obtain valid token:', tokenError);

        // 토큰 획득 실패 처리
        this.lastTokenError = {
          message: tokenError.message,
          timestamp: new Date().toISOString(),
          type: 'TOKEN_ACQUISITION_FAILED'
        };

        this.emit('tokenError', this.lastTokenError);

        // 토큰이 없으면 연결하지 않음
        throw new Error('No valid token available for WebSocket connection');
      }

      const socketUrl = 'ws://localhost:8080/ws-nest/websocket';
      const socket = new WebSocket(socketUrl);

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        debug: false,
        reconnectDelay: 0,

        onConnect: (frame) => {
          console.log('✅ STOMP connected successfully:', frame);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.authenticationFailed = false; // 연결 성공 시 플래그 리셋
          this.emit('connected', frame);
        },
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame.headers['message']);
          if (frame.body) {
            console.error('Error detail:', frame.body);
          }

          // JWT 관련 에러 처리
          const errorMessage = frame.headers['message'] || frame.body || '';
          const isAuthError = this.isAuthenticationError(errorMessage);

          if (isAuthError) {
            console.error(
                '🚫 JWT authentication failed - blocking further reconnection attempts');
            this.authenticationFailed = true;
            this.lastTokenError = {
              message: errorMessage,
              timestamp: new Date().toISOString(),
              type: 'JWT_AUTHENTICATION_FAILED'
            };

            this.emit('authenticationFailed', this.lastTokenError);

            // 인증 실패 시 연결 완전 종료
            this.forceDisconnect();
          } else {
            this.emit('stompError', {message: errorMessage, frame});
          }
        },
        onWebSocketClose: (event) => {
          this.connected = false;
          console.warn('🔌 WebSocket disconnected:', event.code, event.reason);

          this.emit('disconnected', {code: event.code, reason: event.reason});

          // 수동 연결 해제가 아니고 인증 실패가 아닌 경우에만 재연결 시도
          if (!event.wasClean && !this.isManualDisconnect
              && !this.authenticationFailed) {
            this.handleReconnect();
          } else if (this.authenticationFailed) {
            console.log('🚫 Reconnection blocked due to authentication failure');
          }
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          this.emit('websocketError', event);
        },
      });

      this.stompClient.activate();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.emit('connectionFailed', error);

      // 인증 관련 에러가 아닌 경우에만 재연결 시도
      if (!this.authenticationFailed) {
        this.handleReconnect();
      }
    }
  }

  setupEventListeners() {
    if (!this.socket) {
      return;
    }

    this.socket.onopen = (event) => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', event);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);

        // 메시지 타입별 처리
        if (data.type) {
          this.emit(data.type, data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.emit('disconnected', event);

      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  // JWT 인증 관련 에러인지 확인하는 헬퍼 메서드
  isAuthenticationError(errorMessage) {
    const authErrorKeywords = [
      'JWT',
      'jwt',
      'token',
      'Token',
      'expired',
      'Expired',
      '인증',
      '토큰',
      '만료',
      'authentication',
      'Authentication',
      'unauthorized',
      'Unauthorized',
      'invalid token',
      'token expired'
    ];

    return authErrorKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  handleReconnect() {
    // 인증 실패 시 재연결 시도하지 않음
    if (this.authenticationFailed) {
      console.error('🚫 Auto-reconnect blocked: JWT authentication failed');
      this.emit('reconnectBlocked', {
        reason: 'Authentication failed',
        lastError: this.lastTokenError
      });
      return;
    }

    // 수동 연결 해제 시 재연결 시도하지 않음
    if (this.isManualDisconnect) {
      console.log('🔌 Manual disconnect - skipping reconnection');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
          `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.emit('reconnectAttempt', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached', {
        attempts: this.reconnectAttempts
      });
    }
  }


  subscribe(destination, callback) {
    if (!this.connected || !this.stompClient) {
      return;
    }
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const body = JSON.parse(message.body);
      callback(body);
    });
    this.subscriptions.set(destination, subscription);
  }


  // 이벤트 리스너 제거
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 이벤트 발생
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // 강제 연결 해제 (인증 실패 시 사용)
  forceDisconnect() {
    console.log(
        '🚫 Force disconnecting WebSocket due to authentication failure');
    this.isManualDisconnect = true;

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    this.connected = false;
    this.emit('forceDisconnected', {reason: 'Authentication failed'});
  }

  // 연결 종료 (사용자가 직접 호출)
  disconnect() {
    console.log('🔌 Manual WebSocket disconnect');
    this.isManualDisconnect = true;

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connected = false;
    }

    this.emit('manualDisconnect');
  }

  // 인증 문제 해결 후 재연결 허용
  resetAuthenticationState() {
    console.log('🔓 Resetting authentication state - reconnection allowed');
    this.authenticationFailed = false;
    this.lastTokenError = null;
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;

    this.emit('authenticationReset');
  }

  // 새로운 토큰으로 재연결 시도
  async reconnectWithNewToken() {
    console.log('🔄 Attempting reconnection with new token');

    // 인증 상태 리셋
    this.resetAuthenticationState();

    // 기존 연결 정리
    if (this.connected) {
      this.disconnect();
    }

    // 잠시 대기 후 새로운 연결 시도
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // 연결 상태 및 에러 정보 반환
  getConnectionStatus() {
    return {
      connected: this.connected,
      authenticationFailed: this.authenticationFailed,
      lastTokenError: this.lastTokenError,
      reconnectAttempts: this.reconnectAttempts,
      isManualDisconnect: this.isManualDisconnect
    };
  }

  // 연결 상태 확인
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스 생성
const webSocketService = new WebSocketService();

export default webSocketService;
