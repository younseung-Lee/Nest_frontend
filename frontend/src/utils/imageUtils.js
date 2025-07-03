/**
 * 이미지 최적화 및 캐싱 유틸리티
 */

// 이미지 프리로드 캐시
const imageCache = new Map();

/**
 * 이미지를 프리로드하고 캐시합니다
 * @param {string} src - 이미지 URL
 * @returns {Promise<boolean>} - 로드 성공 여부
 */
export const preloadImage = (src) => {
  if (!src) return Promise.resolve(false);
  
  // 이미 캐시된 이미지인지 확인
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(src, true);
      resolve(true);
    };
    
    img.onerror = () => {
      imageCache.set(src, false);
      console.warn(`이미지 프리로드 실패: ${src}`);
      resolve(false);
    };
    
    img.src = src;
  });
};

/**
 * 멘토 이미지들을 배치로 프리로드합니다
 * @param {Array} mentors - 멘토 목록
 * @returns {Promise<Array>} - 각 이미지의 로드 결과
 */
export const preloadMentorImages = async (mentors) => {
  const imageUrls = mentors
    .filter(mentor => mentor.imgUrl)
    .map(mentor => mentor.imgUrl);

  const promises = imageUrls.map(url => preloadImage(url));
  return Promise.allSettled(promises);
};

/**
 * 이미지 URL이 유효한지 확인합니다
 * @param {string} url - 이미지 URL
 * @returns {boolean} - URL 유효성
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // 기본적인 URL 형식 검증
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 멘토 아바타의 그라데이션 클래스를 생성합니다
 * @param {number} mentorId - 멘토 ID
 * @param {number} maxGradients - 최대 그라데이션 수 (기본: 8)
 * @returns {string} - CSS 클래스명
 */
export const getMentorGradientClass = (mentorId, maxGradients = 8) => {
  const gradientIndex = (mentorId % maxGradients) + 1;
  return `gradient-bg-${gradientIndex}`;
};

/**
 * 이미지 로딩 에러 처리 핸들러
 * @param {Event} event - 이미지 에러 이벤트
 * @param {string} mentorName - 멘토 이름 (로깅용)
 * @param {Function} fallbackCallback - fallback 콜백 함수
 */
export const handleImageError = (event, mentorName, fallbackCallback) => {
  const img = event.target;
  console.warn(`멘토 이미지 로딩 실패: ${mentorName} (${img.src})`);
  
  // 이미지 숨기기
  img.style.display = 'none';
  
  // fallback 요소 표시
  if (img.nextSibling) {
    img.nextSibling.style.display = 'flex';
  }
  
  // 추가 콜백 실행
  if (fallbackCallback && typeof fallbackCallback === 'function') {
    fallbackCallback();
  }
};

/**
 * 이미지 로딩 완료 처리 핸들러
 * @param {Event} event - 이미지 로드 이벤트
 * @param {Function} successCallback - 성공 콜백 함수
 */
export const handleImageLoad = (event, successCallback) => {
  const img = event.target;
  img.style.opacity = '1';
  
  // 추가 콜백 실행
  if (successCallback && typeof successCallback === 'function') {
    successCallback();
  }
};

export default {
  preloadImage,
  preloadMentorImages,
  isValidImageUrl,
  getMentorGradientClass,
  handleImageError,
  handleImageLoad
};
