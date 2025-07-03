// WebSocket 디버깅 도구
import websocketService from '../services/websocketService';
import { accessTokenUtils } from './tokenUtils';

/**
 * WebSocket 연결 상태 디버깅
 */
export const debugWebSocket = () => {
  console.group('🔍 WebSocket 디버깅 정보');
  
  const debugInfo = websocketService.getDebugInfo();
  console.log('📊 연결 상태:', debugInfo.isConnected ? '✅ 연결됨' : '❌ 연결 안됨');
  console.log('📊 STOMP 상태:', getStompStateDescription(debugInfo.stompState));
  console.log('📊 STOMP 연결됨:', debugInfo.stompConnected ? '✅' : '❌');
  console.log('📊 메시지 핸들러 수:', debugInfo.handlersCount);
  console.log('📊 활성 구독 수:', debugInfo.subscriptionsCount);
  console.log('📊 재연결 시도:', debugInfo.reconnectAttempts);
  console.log('📊 클라이언트 존재:', debugInfo.hasClient ? '✅' : '❌');
  
  // JWT 토큰 정보
  debugTokenInfo();
  
  // WebSocket 토큰 정보
  console.log('🔐 WebSocket 토큰:', debugInfo.websocketToken ? '✅ 있음' : '❌ 없음');
  
  console.groupEnd();
  
  return debugInfo;
};

/**
 * JWT 토큰 디버깅 정보
 */
const debugTokenInfo = () => {
  const token = accessTokenUtils.getAccessToken();
  console.log('🔐 JWT 토큰:', token ? '✅ 있음' : '❌ 없음');
  
  if (!token) return;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('🔐 토큰 만료 시간:', new Date(payload.exp * 1000));
    console.log('🔐 토큰 유효:', currentTime < payload.exp ? '✅' : '❌ 만료됨');
    console.log('🔐 사용자 ID:', payload.sub || payload.userId || payload.id);
  } catch (error) {
    console.log('🔐 토큰 파싱 실패:', error.message);
  }
};

/**
 * STOMP 상태 설명 가져오기
 */
const getStompStateDescription = (state) => {
  const stompStates = {
    0: 'CONNECTING',
    1: 'OPEN', 
    2: 'CLOSING',
    3: 'CLOSED'
  };
  return `${state} (${stompStates[state] || '알 수 없음'})`;
};

/**
 * 실시간 WebSocket 메시지 모니터링
 */
export const monitorWebSocketMessages = (enable = true) => {
  const callbackId = 'debug-monitor';
  
  if (enable) {
    websocketService.onMessage(callbackId, (messageData) => {
      console.group('📨 실시간 메시지 수신');
      console.log('메시지 ID:', messageData.id || messageData.messageId);
      console.log('내용:', messageData.content);
      console.log('채팅방 ID:', messageData.chatRoomId);
      console.log('발신자 ID:', messageData.senderId);
      console.log('내 메시지:', messageData.mine ? '✅' : '❌');
      console.log('전체 데이터:', messageData);
      console.groupEnd();
    });
    console.log('✅ WebSocket 메시지 모니터링 시작');
    return () => websocketService.offMessage(callbackId);
  } else {
    websocketService.offMessage(callbackId);
    console.log('❌ WebSocket 메시지 모니터링 중지');
  }
};

/**
 * WebSocket 강제 재연결
 */
export const forceReconnectWebSocket = async () => {
  console.log('🔄 WebSocket 강제 재연결 시작...');
  try {
    await websocketService.forceReconnect();
    console.log('✅ WebSocket 재연결 성공');
    debugWebSocket();
  } catch (error) {
    console.error('❌ WebSocket 재연결 실패:', error);
  }
};

/**
 * 테스트 메시지 전송
 */
export const sendTestMessage = async (chatRoomId, content = '🧪 테스트 메시지') => {
  if (!chatRoomId) {
    console.error('❌ 채팅방 ID가 필요합니다. 사용법: wsSendTest(123, "메시지")');
    return;
  }
  
  console.log(`📤 테스트 메시지 전송: 채팅방 ${chatRoomId}`);
  try {
    await websocketService.sendMessage(chatRoomId, content);
    console.log('✅ 테스트 메시지 전송 성공');
  } catch (error) {
    console.error('❌ 테스트 메시지 전송 실패:', error);
  }
};

/**
 * WebSocket 연결 강제 종료
 */
export const disconnectWebSocket = () => {
  console.log('🔌 WebSocket 연결 강제 종료...');
  websocketService.disconnect();
  console.log('✅ WebSocket 연결 종료 완료');
};

/**
 * WebSocket 구독 상태 확인
 */
export const checkWebSocketSubscriptions = () => {
  console.group('📡 WebSocket 구독 상태 확인');
  
  if (!websocketService.stompClient) {
    console.log('❌ STOMP 클라이언트가 존재하지 않음');
    console.groupEnd();
    return;
  }
  
  if (!websocketService.stompClient.connected) {
    console.log('❌ STOMP 클라이언트가 연결되지 않음');
    console.log('📊 현재 상태:', getStompStateDescription(websocketService.stompClient.state));
    console.groupEnd();
    return;
  }
  
  // 구독 정보 확인
  const subscriptions = websocketService.stompClient.subscriptions;
  
  if (!subscriptions) {
    console.log('❌ 구독 객체가 존재하지 않음');
    console.groupEnd();
    return;
  }
  
  const subscriptionKeys = Object.keys(subscriptions);
  console.log('📊 활성 구독 수:', subscriptionKeys.length);
  
  if (subscriptionKeys.length === 0) {
    console.log('⚠️ 활성 구독이 없습니다!');
    console.log('💡 window.wsResubscribe()를 실행해보세요.');
  } else {
    console.log('✅ 활성 구독들:');
    subscriptionKeys.forEach((id, index) => {
      const subscription = subscriptions[id];
      console.log(`${index + 1}. 구독 ID: ${id}`, {
        destination: subscription.destination,
        ack: subscription.ack,
        headers: subscription.headers || {}
      });
    });
  }
  
  // STOMP 클라이언트의 상태 정보
  logStompClientStatus();
  
  console.groupEnd();
};

/**
 * STOMP 클라이언트 상태 로깅
 */
const logStompClientStatus = () => {
  console.log('📊 STOMP 클라이언트 상태:', {
    state: getStompStateDescription(websocketService.stompClient.state),
    connected: websocketService.stompClient.connected,
    url: websocketService.stompClient.brokerURL,
    hasWebSocket: !!websocketService.stompClient.webSocket
  });
};

/**
 * 수동으로 메시지 구독 재설정
 */
export const resubscribeWebSocket = () => {
  console.log('🔄 WebSocket 구독 재설정...');
  
  if (websocketService.stompClient?.connected) {
    websocketService.subscribeToPersonalMessages();
    console.log('✅ 구독 재설정 완료');
  } else {
    console.log('❌ WebSocket이 연결되지 않음');
    console.log('💡 먼저 window.wsReconnect()를 실행해보세요.');
  }
};

/**
 * 개발 환경 확인
 */
const isDevelopment = () => {
  return import.meta.env.VITE_NODE_ENV === 'development' || 
         import.meta.env.DEV || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * 디버깅 함수 사용법 출력
 */
const printUsageInstructions = () => {
  console.group('🛠️ WebSocket 디버깅 함수 사용법');
  console.log('📊 상태 확인: window.wsDebug()');
  console.log('👁️ 메시지 모니터링: window.wsMonitor(true) / window.wsMonitor(false)');
  console.log('🔄 강제 재연결: window.wsReconnect()');
  console.log('🔌 연결 해제: window.wsDisconnect()');
  console.log('📤 테스트 메시지: window.wsSendTest(채팅방ID, "메시지")');
  console.log('📡 구독 상태: window.wsCheckSubs()');
  console.log('🔄 구독 재설정: window.wsResubscribe()');
  console.log('🔧 서비스 객체: window.wsService');
  console.groupEnd();
};

/**
 * 개발자 도구에 디버깅 함수들 등록
 */
export const registerDebugFunctions = () => {
  if (typeof window === 'undefined' || !isDevelopment()) {
    return;
  }

  // 디버깅 함수들 등록
  window.wsDebug = debugWebSocket;
  window.wsMonitor = monitorWebSocketMessages;
  window.wsReconnect = forceReconnectWebSocket;
  window.wsDisconnect = disconnectWebSocket;
  window.wsSendTest = sendTestMessage;
  window.wsCheckSubs = checkWebSocketSubscriptions;
  window.wsResubscribe = resubscribeWebSocket;
  window.wsService = websocketService;
  
  // 사용법 출력
  printUsageInstructions();
};

// 개발 환경에서만 자동 등록
if (isDevelopment()) {
  registerDebugFunctions();
}
