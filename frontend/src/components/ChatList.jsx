import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Search, Plus, MoreVertical, User, ArrowLeft, X} from 'lucide-react';
import './ChatList.css';
import {chatroomAPI, userAPI} from '../services/api';
import {accessTokenUtils} from '../utils/tokenUtils';

const ChatList = ({onChatSelect, currentChatId, onBack}) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastMessageId, setLastMessageId] = useState(null);
  const [cursorTime, setCursorTime] = useState(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const chatListRef = useRef(null);

  // URL로 직접 접근한 채팅방 처리를 위한 상태
  const [hasTriggeredInitialSelect, setHasTriggeredInitialSelect] = useState(
      false);

  // 검색 모드 상태
  const [isSearchMode, setIsSearchMode] = useState(false);

  // 프로필 이미지 관련 상태
  const [profileImages, setProfileImages] = useState(new Map()); // userId -> imageUrl 매핑
  const [loadingImages, setLoadingImages] = useState(new Set()); // 로딩 중인 userId들

  // 프로필 이미지 로딩 함수
  const loadProfileImage = useCallback(async (userId) => {
    // 이미 로딩 중이거나 캐시에 있으면 건너뛰기
    if (loadingImages.has(userId) || profileImages.has(userId)) {
      return;
    }

    console.log(`🖼️ 프로필 이미지 로딩 시작: userId=${userId}`);
    
    setLoadingImages(prev => new Set(prev).add(userId));
    
    try {
      const response = await userAPI.getUserProfileImage(userId);
      console.log(`✅ 프로필 이미지 조회 성공: userId=${userId}`, response.data);
      
      if (response.data && response.data.data && response.data.data.imgUrl) {
        const imageUrl = response.data.data.imgUrl;
        setProfileImages(prev => new Map(prev).set(userId, imageUrl));
        console.log(`🎨 프로필 이미지 캐시 저장: userId=${userId}, url=${imageUrl}`);
      } else {
        console.log(`📷 프로필 이미지 없음: userId=${userId}`);
        // 프로필 이미지가 없는 경우 null로 저장하여 재요청 방지
        setProfileImages(prev => new Map(prev).set(userId, null));
      }
    } catch (error) {
      console.error(`❌ 프로필 이미지 로딩 실패: userId=${userId}`, error);
      // 에러 발생시에도 null로 저장하여 재요청 방지
      setProfileImages(prev => new Map(prev).set(userId, null));
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [loadingImages, profileImages]);

  // 여러 사용자의 프로필 이미지를 배치로 로딩
  const loadMultipleProfileImages = useCallback(async (userIds) => {
    console.log(`📦 배치 프로필 이미지 로딩: ${userIds.length}개 사용자`);
    
    // 아직 로딩하지 않은 userId들만 필터링
    const unloadedUserIds = userIds.filter(userId => 
      !loadingImages.has(userId) && !profileImages.has(userId)
    );

    if (unloadedUserIds.length === 0) {
      console.log(`✅ 모든 프로필 이미지가 이미 로딩됨`);
      return;
    }

    console.log(`🔄 새로 로딩할 사용자: ${unloadedUserIds.length}개`);

    // 동시에 너무 많은 요청을 보내지 않도록 제한 (최대 5개씩)
    const batchSize = 5;
    for (let i = 0; i < unloadedUserIds.length; i += batchSize) {
      const batch = unloadedUserIds.slice(i, i + batchSize);
      await Promise.all(batch.map(userId => loadProfileImage(userId)));
    }
  }, [loadProfileImage, loadingImages, profileImages]);

  // 채팅방 상태 확인 함수
  const checkChatRoomStatus = async (chatRoomId) => {
    try {
      const response = await chatroomAPI.getChatroomStatus(chatRoomId);
      return response.data.closed;
    } catch (error) {
      console.error(`채팅방 ${chatRoomId} 상태 확인 실패:`, error);
      return false; // 에러 시 기본적으로 활성 상태로 가정
    }
  };

  // 채팅방 목록 조회 함수
  const fetchChatRooms = useCallback(async (reset = false) => {
    if ((!hasNext && !reset) || loading) {
      return;
    }

    // 간단한 토큰 확인
    const token = accessTokenUtils.getAccessToken();
    if (!token) {
      console.error('토큰이 없습니다. 로그인이 필요합니다.');
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      const params = {
        size: 10
      };

      // reset이 아닌 경우에만 커서 정보 추가
      if (!reset) {
        if (lastMessageId) {
          params.lastMessageId = lastMessageId;
        }
        if (cursorTime) {
          params.cursorTime = cursorTime;
        }
      }

      console.log('🔍 채팅방 목록 API 호출, 파라미터:', params);

      const response = await chatroomAPI.getChatroomsWithPagination(params);

      console.log('✅ API 응답 성공, 채팅방 수:', response.data.content?.length);

      const fetchedRooms = response.data.content.map(room => {
        console.log('🔍 ChatList - 백엔드에서 받은 room 데이터:', room);
        console.log('🔍 예약 ID 확인:', room.reservationId);

        const currentUserId = parseInt(getCurrentUserId()); // 문자열을 숫자로 변환

        // 현재 사용자가 멘토인지 멘티인지 판단 (JWT 토큰의 사용자 ID 기준)
        const isCurrentUserMentor = currentUserId === room.mentorId;

        // 상대방 정보 설정
        const contactInfo = isCurrentUserMentor ? {
          id: room.menteeId,
          name: room.menteeName,
          profileImage: null // 추후 백엔드에서 프로필 이미지도 제공할 수 있음
        } : {
          id: room.mentorId,
          name: room.mentorName,
          profileImage: null
        };

        // 마지막 메시지 정보 설정
        let lastMessage;
        if (room.lastMessageContent) {
          // 백엔드에서 마지막 메시지가 있는 경우
          const isMyMessage = room.lastMessageSenderId === currentUserId;

          lastMessage = {
            id: null, // 메시지 ID는 현재 제공되지 않음
            text: room.lastMessageContent,
            sender: isMyMessage ? 'user' : 'other',
            timestamp: room.lastMessageTime || new Date().toISOString(),
            isRead: true // 읽음 상태는 추후 구현
          };

          console.log('📨 마지막 메시지 정보:', {
            content: room.lastMessageContent,
            senderId: room.lastMessageSenderId,
            currentUserId,
            isMyMessage,
            time: room.lastMessageTime
          });
        } else {
          // 마지막 메시지가 없는 경우 (새 채팅방)
          lastMessage = {
            id: null,
            text: '대화를 시작해보세요!',
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: true
          };

          console.log('📝 새 채팅방 - 기본 메시지 설정');
        }

        const chatData = {
          id: room.roomId,
          contact: contactInfo,
          contactTitle: isCurrentUserMentor ? '멘티' : '멘토',
          lastMessage: lastMessage,
          updatedAt: room.lastMessageTime || new Date().toISOString(),
          unreadCount: 0, // 읽지 않은 메시지 수는 추후 구현
          isOnline: false, // 온라인 상태는 추후 구현
          isClosed: null, // 초기값, 나중에 상태 확인 후 설정
          // 실제 백엔드 데이터
          mentorId: room.mentorId,
          menteeId: room.menteeId,
          isCurrentUserMentor,
          reservationId: room.reservationId || null, // 예약 ID 추가
          // 디버깅용 추가 정보
          currentUserId,
          mentorName: room.mentorName,
          menteeName: room.menteeName
        };

        console.log('🔍 ChatList - 생성된 chat 데이터:', chatData);
        console.log('🔍 현재 사용자 정보:', {
          currentUserId,
          isCurrentUserMentor,
          contactName: contactInfo.name,
          contactId: contactInfo.id,
          lastMessage: lastMessage.text,
          lastMessageTime: lastMessage.timestamp
        });

        return chatData;
      });

      // 각 채팅방의 상태를 확인하여 isClosed 필드 설정
      console.log('🔍 채팅방 상태 확인 시작...');

      for (const room of fetchedRooms) {
        const isClosed = await checkChatRoomStatus(room.id);
        room.isClosed = isClosed;
        console.log(`🔍 채팅방 ${room.id} 상태: ${isClosed ? '종료됨' : '활성'}`);
      }

      console.log(`✅ 채팅방 상태 확인 완료: ${fetchedRooms.length}개`);

      if (reset) {
        setChatRooms(fetchedRooms);
      } else {
        setChatRooms(prev => [...prev, ...fetchedRooms]);
      }

      // 🖼️ 프로필 이미지 로딩: 모든 상대방 userId 수집
      const partnerUserIds = fetchedRooms.map(room => room.contact.id);
      console.log(`🎯 프로필 이미지 로딩 대상: ${partnerUserIds.join(', ')}`);
      
      // 프로필 이미지 배치 로딩 (비동기 - UI 블로킹 없음)
      loadMultipleProfileImages(partnerUserIds).catch(error => {
        console.error('❌ 배치 프로필 이미지 로딩 실패:', error);
      });

      // 다음 페이지를 위한 커서 설정
      if (fetchedRooms.length > 0) {
        const lastRoom = fetchedRooms[fetchedRooms.length - 1];
        setLastMessageId(lastRoom.lastMessage.id);
        setCursorTime(lastRoom.updatedAt);
      }

      setHasNext(response.data.hasNext);
    } catch (err) {
      console.error('❌ 채팅방 목록 API 실패:', err.response?.status,
          err.response?.data);

      // 간소화된 에러 처리 (api.js interceptor가 대부분 처리)
      if (err.response?.status === 403) {
        alert('접근 권한이 없습니다.');
      } else if (!err.response?.status || err.response?.status >= 500) {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        alert('채팅방 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  }, [lastMessageId, cursorTime, hasNext, loading, initialLoading, loadMultipleProfileImages]);

  // JWT 토큰에서 사용자 정보 추출
  const getCurrentUserInfo = () => {
    try {
      const token = accessTokenUtils.getAccessToken();
      if (!token) {
        return null;
      }

      // JWT 토큰의 payload 부분 디코딩
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.userId || payload.id,
        username: payload.nickName,
        role: payload.role,
        exp: payload.exp
      };
    } catch (error) {
      console.error('토큰 파싱 실패:', error);
      return null;
    }
  };

  const getCurrentUserId = () => {
    const userInfo = getCurrentUserInfo();
    return userInfo?.id || null;
  };

  // 무한 스크롤 처리
  const handleScroll = useCallback(() => {
    const container = chatListRef.current;
    if (!container || loading || !hasNext) {
      return;
    }

    const {scrollTop, scrollHeight, clientHeight} = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchChatRooms(false);
    }
  }, [fetchChatRooms, loading, hasNext]);

  // 채팅방 목록 새로고침
  const refreshChatRooms = useCallback(() => {
    setLastMessageId(null);
    setCursorTime(null);
    setHasNext(true);
    setChatRooms([]);
    fetchChatRooms(true);
  }, [fetchChatRooms]);

  // 초기 로딩
  useEffect(() => {
    fetchChatRooms(true);
  }, []);

  // currentChatId가 변경될 때 초기 선택 상태 리셋
  useEffect(() => {
    setHasTriggeredInitialSelect(false);
  }, [currentChatId]);

  // URL로 직접 접근한 채팅방이 있을 때 자동 선택
  useEffect(() => {
    if (currentChatId && chatRooms.length > 0 && !hasTriggeredInitialSelect) {
      const targetChat = chatRooms.find(chat =>
          chat.id.toString() === currentChatId.toString()
      );

      if (targetChat) {
        console.log('🎯 URL에서 지정한 채팅방 자동 선택:', targetChat);
        onChatSelect(targetChat);
        setHasTriggeredInitialSelect(true);
      } else {
        console.warn('⚠️ URL에서 지정한 채팅방을 찾을 수 없음:', currentChatId);
        console.log('📋 사용 가능한 채팅방 목록:', chatRooms.map(chat => ({
          id: chat.id,
          name: chat.contact.name
        })));
      }
    }
  }, [currentChatId, chatRooms, hasTriggeredInitialSelect, onChatSelect]);

  // 스크롤 이벤트 등록
  useEffect(() => {
    const container = chatListRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 검색 필터링
  const filteredChatRooms = chatRooms.filter(chat =>
      chat.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return '';
    }

    try {
      const now = new Date();
      // 백엔드에서 문자열로 온 경우 파싱
      const messageTime = new Date(timestamp);

      // 유효한 날짜인지 확인
      if (isNaN(messageTime.getTime())) {
        console.warn('잘못된 시간 형식:', timestamp);
        return '시간 정보 없음';
      }

      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        return '방금 전';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else if (diffInDays < 7) {
        return `${diffInDays}일 전`;
      } else {
        return messageTime.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('시간 파싱 에러:', error, 'timestamp:', timestamp);
      return '';
    }
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const handleChatClick = (chat) => {
    console.log('🔍 ChatList - 채팅방 클릭:', {
      chat,
      chatId: chat?.id,
      chatroomId: chat?.id
    });
    onChatSelect(chat);
  };

  // 검색 모드 토글
  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      // 검색 모드 종료시 검색어 초기화
      setSearchTerm('');
    }
  };

  // 검색 취소
  const cancelSearch = () => {
    setIsSearchMode(false);
    setSearchTerm('');
  };

  if (initialLoading) {
    return (
        <div className="chat-list-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>채팅방 목록을 불러오는 중...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="chat-list-container">
        {/* 헤더 */}
        <div className="chat-list-header">
          <div className="header-left">
            <button className="back-to-home-button" onClick={onBack}>
              <ArrowLeft className="icon"/>
            </button>
            <h2 className={`chat-list-title ${isSearchMode ? 'search-active'
                : ''}`}>
              채팅
            </h2>
          </div>
          <div className="header-actions">
            <button
                className="header-action-button"
                onClick={toggleSearchMode}
                title="검색"
            >
              <Search className="icon"/>
            </button>
            <button className="header-action-button" title="새 채팅">
              <Plus className="icon"/>
            </button>
            <button className="header-action-button" title="메뉴">
              <MoreVertical className="icon"/>
            </button>
          </div>
        </div>

        {/* 검색창 */}
        {isSearchMode && (
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon"/>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    autoFocus
                />
                {searchTerm && (
                    <button
                        className="search-clear-button"
                        onClick={() => setSearchTerm('')}
                    >
                      <X className="icon"/>
                    </button>
                )}
              </div>
            </div>
        )}

        {/* 채팅방 목록 */}
        <div className="chat-rooms-list" ref={chatListRef}>
          {filteredChatRooms.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p className="empty-text">
                  {searchTerm ? '검색 결과가 없습니다' : '채팅방이 없습니다'}
                </p>
                {!searchTerm && (
                    <button
                        className="refresh-button"
                        onClick={refreshChatRooms}
                    >
                      새로고침
                    </button>
                )}
              </div>
          ) : (
              <>
                {filteredChatRooms.map((chat) => {
                  // 현재 채팅방 상대방의 프로필 이미지 가져오기
                  const profileImageUrl = profileImages.get(chat.contact.id);
                  const isImageLoading = loadingImages.has(chat.contact.id);
                  
                  return (
                    <div
                        key={chat.id}
                        className={`chat-room-item ${currentChatId === chat.id
                            ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat)}
                    >
                      <div className={`chat-avatar-container ${
                        isImageLoading ? 'loading' : profileImageUrl ? 'loaded' : ''
                      }`}>
                        <div className="chat-avatar">
                          {isImageLoading ? (
                            // 로딩 중일 때 스켈레톤 표시
                            <div className="avatar-skeleton">
                              <div className="skeleton-circle"></div>
                            </div>
                          ) : profileImageUrl ? (
                            // 프로필 이미지가 있을 때
                            <img
                                src={profileImageUrl}
                                alt={chat.contact.name}
                                className="profile-image"
                                onError={(e) => {
                                  console.warn(`이미지 로드 실패: ${profileImageUrl}`);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                          ) : null}
                          
                          {/* 기본 아이콘 (이미지 없거나 로딩 실패시) */}
                          <User 
                            className="avatar-icon" 
                            style={{
                              display: (!isImageLoading && !profileImageUrl) ? 'flex' : 'none'
                            }}
                          />
                        </div>
                        {chat.isOnline}
                      </div>

                      <div className="chat-info">
                        <div className="chat-header-info">
                          <div className="chat-name-container">
                            <span
                                className="chat-name">{chat.contact.name}</span>
                            {/* 활성화된 채팅방에만 상태 표시 */}
                            {!chat.isClosed && (
                                <span className="contact-title">멘토링 중</span>
                            )}
                          </div>
                          <div className="chat-meta">
                            <span className="chat-time">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                            {chat.unreadCount > 0 && (
                                <div className="unread-badge">
                                  {chat.unreadCount > 99 ? '99+'
                                      : chat.unreadCount}
                                </div>
                            )}
                          </div>
                        </div>

                        <div className="last-message-container">
                          <div className="last-message">
                            <span className={`message-text ${
                                !chat.lastMessage.isRead
                                && chat.lastMessage.sender === 'other'
                                    ? 'unread' : ''
                            }`}>
                              {truncateMessage(chat.lastMessage.text)}
                            </span>
                          </div>

                          {!chat.lastMessage.isRead && chat.lastMessage.sender
                              === 'other' && (
                                  <div className="new-message-indicator"></div>
                              )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 로딩 인디케이터 */}
                {loading && (
                    <div className="loading-more">
                      <div className="loading-spinner small"></div>
                      <span>더 많은 채팅방을 불러오는 중...</span>
                    </div>
                )}
              </>
          )}
        </div>

      </div>
  );
};

export default ChatList;