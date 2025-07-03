import React, {useState, useEffect} from 'react';
import {Star, ChevronLeft, ChevronRight} from 'lucide-react';
import './MentorSection.css';
import {profileAPI, categoryAPI} from "../services/api";
import MentorProfile from "./MentorProfile";
import {useNavigate} from 'react-router-dom';
import {
  preloadMentorImages,
  getMentorGradientClass,
  handleImageError,
  handleImageLoad
} from '../utils/imageUtils';

const MentorSection = ({onCategorySelect, onMentorSelect}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  // api에서 가져온 데이터 저장할 상태
  const [mentors, setMentors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true); // 프로필 로딩 상태
  const [loadingCategories, setLoadingCategories] = useState(true); // 카테고리 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const [selectedMentor, setSelectedMentor] = useState(null);
  const navigate = useNavigate();

  const handleMentorClick = (mentor) => {
    console.log("mentor:", mentor); // ✅ userId, profileId 있는지 확인
    navigate(`/mentor/${mentor.userId}/profile/${mentor.profileId}`);
  };

  // 카테고리 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const response = await categoryAPI.getCategories(); // 카테고리 목록 호출
        if (response.data && response.data.data && Array.isArray(
            response.data.data.content)) {
          const fetchedCats = response.data.data.content.map(category => ({
            id: String(category.id), // 프론트 내부에서 사용할 고유 ID
            name: category.name,
            apiId: category.id // 백엔드에 넘겨줄 categoryId (Long 타입)
          }));
          setCategories(fetchedCats);

          if (fetchedCats.length > 0) {
            setSelectedCategory(fetchedCats[0].id);
          }
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("카테고리 정보를 불러오는 데 실패했습니다. : ", error);
        setError('카테고리 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories(); // 함수 호출
  }, []);

  // 추천 멘토 불러오기
  useEffect(() => {
    if (!loadingCategories && selectedCategory !== null && categories.length
        > 0) {
      const fetchMentors = async () => {

        setLoadingMentors(true);  // 로딩 시작
        setError(null);            // 이전 에러 초기화

        try {
          // 선택한 카테고리의 apiId 찾기
          const selectedCategoryObj = categories.find(
              category => category.id === selectedCategory);

          if (!selectedCategoryObj) {
            setError("일치하는 카테고리가 없습니다.");
            setLoadingMentors(false);
            setMentors([]);
            return;
          }

          const categoryId = selectedCategoryObj.apiId;

          // recommendedProfiles 호출
          const response = await profileAPI.getRecommendedMentors(
              {categoryId});
          console.log('✅ 추천 멘토 API 응답 성공, 멘토 수:', response.data.data?.length);
          const fetchedMentors = response.data.data.map(profile => {
            return {
              ...profile,
              id: profile.profileId,
              profileId: profile.profileId,
              userId: profile.userId,
              name: profile.userName,
              title: profile.profileTitle,
              categoryName: profile.categoryName,
              tags: profile.keywords?.map(k => k.name) || [],
              avatar: profile.userName?.charAt(0) || 'M',
              imgUrl: profile.imgUrl, // ✅ 이미지 URL 추가
            };
          });
          
          setMentors(fetchedMentors);

          // 🚀 이미지 프리로드 (성능 최적화)
          preloadMentorImages(fetchedMentors)
          .then(() => console.log('✅ 멘토 이미지 프리로드 완료'))
          .catch(err => console.warn('⚠️ 이미지 프리로드 중 일부 실패:', err));
        } catch (error) {
          console.error("추천 멘토 정보를 불러오는 데 실패했습니다. : ", error);
          setError('추천 멘토 정보를 불러오는 중 오류가 발생했습니다.');
          setMentors([]); // 에러 발생 시 프로필 배열 비우기
        } finally {
          setLoadingMentors(false); // 프로필 로딩 상태 종료
        }
      };
      fetchMentors(); // 함수 호출
    } else {
      if (loadingMentors) {
        setLoadingMentors(false);
      }
    }

  }, [selectedCategory, categories, loadingCategories]);

  // 3초마다 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, mentors.length - 2));
    }, 3000);

    return () => clearInterval(interval);
  }, [mentors.length, currentIndex]);

  // 카테고리 변경시 인덱스 리셋
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // 다음 멘토 슬라이드로 이동
  const nextMentor = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, mentors.length - 2));
  };

  // 이전 멘토 슬라이드로 이동
  const prevMentor = () => {
    setCurrentIndex(
        (prev) => (prev - 1 + Math.max(1, mentors.length - 2)) % Math.max(1,
            mentors.length - 2));
  };

  // 로딩 중이거나 에러 발생 시 표시할 UI
  if (loadingCategories || loadingMentors || selectedCategory === null) {
    return (
        <section className="mentor-profile-section">
          <div className="mentor-container">
            <h2 className="section-title mento-text">카테고리별 추천 멘토</h2>
            <div className="category-tabs">
              {/* 카테고리 로딩 중에도 '전체' 카테고리는 표시될 수 있도록 합니다. */}
              {categories.length > 0 ? categories.map(category => (
                  <button key={category.id} className="category-tab"
                          disabled>{category.name}</button>
              )) : <button className="category-tab" disabled>로딩 중...</button>}
            </div>
            <p>데이터를 불러오는 중...</p>
          </div>
        </section>
    );
  }

  if (error) {
    return (
        <section className="mentor-profile-section">
          <div className="mentor-container">
            <h2 className="section-title mento-text">카테고리별 추천 멘토</h2>
            <div className="category-tabs">
              {categories.map(category => (
                  <button key={category.id} className="category-tab"
                          disabled>{category.name}</button>
              ))}
            </div>
            <p className="error-message">오류: {error}</p>
          </div>
        </section>
    );
  }

  // If a mentor is selected, show their profile
  if (selectedMentor) {
    return (
        <MentorProfile
            mentor={selectedMentor}
            onBack={() => setSelectedMentor(null)}
        />
    );
  }
  return (
      <section className="mentor-profile-section" id="category">
        <div className="mentor-container">
          <h2 className="section-title mento-text">카테고리별 추천 멘토</h2>

          {/* 카테고리 탭 */}
          <div className="category-tabs">
            {categories.map(category => (
                <button
                    key={category.id}
                    className={`category-tab ${selectedCategory
                    === category.id
                        ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
            ))}
          </div>

          <div className="mentor-carousel">
            <button
                className="carousel-button carousel-button-prev"
                onClick={prevMentor}
                disabled={mentors.length <= 3}
            >
              <ChevronLeft/>
            </button>

            <div className="mentor-slider">
              <div
                  className="mentor-track"
                  style={{
                    transform: `translateX(-${currentIndex * 33.333}%)`,
                    transition: 'transform 0.5s ease-in-out'
                  }}
              >
                {mentors.length > 0 ? (
                    mentors.map((mentor) => (
                        <div
                            key={mentor.id}  // api 에서 받은 profileId 를 key 로 사용
                            className="mentor-slide"
                        >
                          <div className="mentor-card glass-effect">
                            <div className="mentor-card-shimmer"></div>
                            <div className="mentor-card-content">
                              <div>
                                <div className="mentor-avatar">
                                  {mentor.imgUrl ? (
                                      <img
                                          src={mentor.imgUrl}
                                          alt={mentor.name}
                                          loading="lazy"
                                          onLoad={(e) => handleImageLoad(e)}
                                          onError={(e) => handleImageError(e, mentor.name)}
                                          style={{
                                            opacity: '0',
                                            transition: 'opacity 0.3s ease'
                                          }}
                                      />
                                  ) : null}
                                  <div
                                      className={`mentor-avatar-text ${!mentor.imgUrl
                                          ? getMentorGradientClass(mentor.id, 8)
                                          : ''}`}
                                      style={{
                                        display: mentor.imgUrl ? 'none' : 'flex'
                                      }}
                                  >
                                    {mentor.avatar}
                                  </div>
                                </div>
                                <h3 className="mentor-name">{mentor.name}</h3>
                                <p className="mentor-profileTitle">{mentor.title}</p>
                                <p className="mentor-categoryName">{mentor.categoryName}</p>
                              </div>

                              <div className="mentor-tags">
                                {mentor.tags && Array.isArray(mentor.tags)
                                    && mentor.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex}
                                              className="mentor-tag">
                            {tag}
                          </span>
                                    ))}
                              </div>

                              <div className="mentor-footer">
                                <button
                                    className="reservation-button"
                                    onClick={() => handleMentorClick(mentor)}>
                                  조회하기
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))
                ) : (
                    <p className="no-mentors-message">선택된 카테고리에 해당하는 멘토가
                      없습니다.</p>
                )}
              </div>
            </div>

            <button
                className="carousel-button carousel-button-next"
                onClick={nextMentor}
                disabled={mentors.length <= 3}
            >
              <ChevronRight/>
            </button>
          </div>

          {/* 슬라이드 인디케이터 */}
          <div className="slide-indicators">
            {Array.from({length: Math.max(1, mentors.length - 2)}).map(
                (_, index) => (
                    <button
                        key={index}
                        className={`indicator ${currentIndex === index
                            ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
          </div>
        </div>
      </section>
  );
};

export default MentorSection;

