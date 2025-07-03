import React, { useEffect, useState } from 'react';
import NotificationToast from './NotificationToast';
import notificationService from '../services/notificationService';
import './NotificationContainer.css';

const NotificationContainer = ({ isLoggedIn = false }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // 로그인되지 않은 상태에서는 알림 서비스를 시작하지 않음
    if (!isLoggedIn) {
      // 로그아웃 시 SSE 연결 해제 및 모든 알림 제거
      notificationService.disconnect();
      setNotifications([]);
      return;
    }

    // 알림 리스너 등록
    const handleNotification = (notification) => {
      addNotification(notification);
    };

    const handleConnection = (data) => {
      console.log('=== SSE 연결 상태 변경 ===', data.status);
      
      if (data.status === 'connected') {
        console.log('✅ SSE 연결 성공 - 실시간 알림 수신 가능');
        // 연결 성공 시 테스트 알림 생성 (개발 환경)
        notificationService.createTestNotifications();
      } else if (data.status === 'failed' || data.status === 'error') {
        console.error('❌ SSE 연결 실패 - 실시간 알림 불가');
        // 연결 실패 시 오프라인 알림은 표시하지 않음 (너무 많은 알림 방지)
      } else if (data.status === 'disabled') {
        console.log('🔕 SSE가 비활성화됨 - 실시간 알림 없음');
      } else if (data.status === 'endpoint_not_ready') {
        console.warn('⚠️ SSE 엔드포인트가 준비되지 않음 - 백엔드 확인 필요');
      } else if (data.status === 'disconnected') {
        console.log('🔌 SSE 연결 해제됨');
      }
    };

    // 이벤트 리스너 등록
    notificationService.addEventListener('notification', handleNotification);
    notificationService.addEventListener('connection', handleConnection);

    // SSE 연결 시작 (로그인된 상태에서만)
    console.log('SSE 알림 서비스 연결 시작');
    notificationService.connect();

    // 컴포넌트 언마운트 시 정리
    return () => {
      notificationService.removeEventListener('notification', handleNotification);
      notificationService.removeEventListener('connection', handleConnection);
      notificationService.disconnect();
      console.log('SSE 연결 해제 및 리스너 정리 완료');
    };
  }, [isLoggedIn]); // isLoggedIn이 변경될 때마다 useEffect 재실행

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, {
      ...notification,
      id: notification.id || Date.now()
    }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 전역 알림 함수 (다른 컴포넌트에서 사용할 수 있도록, 로그인된 상태에서만)
  if (isLoggedIn) {
    window.showNotification = addNotification;
    
    // 채팅방으로 이동하는 전역 함수 추가
    window.openChatRoom = (chatRoomId) => {
      if (chatRoomId) {
        // React Router 사용 시
        window.location.href = `/chat/${chatRoomId}`;
      }
    };
  } else {
    // 로그아웃 상태에서는 전역 알림 함수 제거
    delete window.showNotification;
    delete window.openChatRoom;
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;