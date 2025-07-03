import { chatroomAPI } from './api';

export const chatService = {
  // 채팅방이 종료되었는지 확인하는 API
  async isChatRoomClosed(chatRoomId) {
    try {
      const response = await chatroomAPI.getChatroomStatus(chatRoomId);
      
      console.log(`🔍 API 응답:`, response.data);
      
      // API 응답에서 isClosed 값을 반환 (백엔드가 closed로 응답함)
      return response.data.isClosed === true || response.data.closed === true;
    } catch (error) {
      console.error('채팅방 상태 확인 실패:', error);
      // 에러 시 안전하게 종료된 것으로 간주
      return true;
    }
  }
};
