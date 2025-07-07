import React, {useState, useEffect} from 'react';
import {Star, Search} from 'lucide-react';
import './MentorList.css';
import {profileAPI, categoryAPI} from '../services/api';
import {
  preloadMentorImages,
  getMentorGradientClass,
  handleImageError,
  handleImageLoad
} from '../utils/imageUtils';

const MentorList = ({category, onBack, onMentorSelect}) => {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category || '');

  // 카테고리 목록 로딩
  useEffect(() => {
    categoryAPI.getCategories()
    .then((res) => {
      const categoryList = Array.isArray(res?.data?.data)
          ? res.data.data
          : res?.data?.data?.content || [];
      setCategories(categoryList);
    })
    .catch((err) => {
      console.error('카테고리 정보를 불러오는 데 실패했습니다. : ', err);
    });
  }, []);

  // 멘토 목록 로딩
  useEffect(() => {
    profileAPI.searchMentors()
    .then(res => {
      console.log('✅ 검색 멘토 API 응답 성공, 멘토 수:', res.data?.data?.length);

      const allMentors = res?.data?.data || [];

      const filtered = selectedCategory
          ? allMentors.filter(m => m.category === selectedCategory)
          : allMentors;

      setMentors(filtered);
      setFilteredMentors(filtered);

      // 🚀 이미지 프리로드 (성능 최적화)
      preloadMentorImages(filtered)
      .then(() => console.log('✅ 멘토 이미지 프리로드 완료'))
      .catch(err => console.warn('⚠️ 이미지 프리로드 중 일부 실패:', err));
    })
    .catch(err => {
      console.error('멘토 목록 불러오기 실패:', err);
    });
  }, [selectedCategory]);

  // 검색 및 정렬 필터링
  useEffect(() => {
    let result = [...mentors];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
          (m.title && m.title.toLowerCase().includes(term)) ||
          (m.introduction && m.introduction.toLowerCase().includes(term)) ||
          (m.category && m.category.toLowerCase().includes(term))
      );
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'created':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredMentors(result);
  }, [mentors, searchTerm, sortBy]);

  return (
      <div className="mentor-list-container">
        <div className="mentor-list-header">
          <h1 className="mentor-list-title">
            {selectedCategory || '전체'} 멘토 ({filteredMentors.length}명)
          </h1>
        </div>

        <div className="mentor-list-controls">
          <div className="mentor-list-search-section">
            <div className="mentor-list-search-input-wrapper">
              <Search className="search-icon"/>
              <input
                  type="text"
                  placeholder="키워드로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mentor-list-search-input"
              />
            </div>
          </div>
        </div>

        <div className="mentor-grid">
          {filteredMentors.map((mentor) => (
              <div
                  key={mentor.id}
                  className="mentor-list-card glass-effect"
                  onClick={() => onMentorSelect?.(mentor)}
              >
                <div className="mentor-card-header">
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
                            ? getMentorGradientClass(mentor.id, 10) : ''}`}
                        style={{display: mentor.imgUrl ? 'none' : 'flex'}}
                    >
                      {mentor.title?.[0] || mentor.name?.[0] || 'M'}
                    </div>
                  </div>
                  <div className="mentor-basic-info">
                    <h3 className="mentor-name">{mentor.name}</h3>
                    <p className="mentor-role">{mentor.title}</p>
                    <p className="mentor-company">{mentor.category}</p>
                  </div>
                </div>

                <div className="mentor-card-body">
                  <p className="mentor-description">{mentor.introduction}</p>
                  <div className="mentor-stats-row">
                    <div className="stat-item">
                      <span>{new Date(
                          mentor.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mentorProfile-tags">
                    {mentor.keywords && Array.isArray(mentor.keywords)
                        && mentor.keywords.map((keyword) => (
                            <span key={keyword.id}
                                  className="mentorProfile-tag">
                            {'#'}{keyword.name}
                          </span>
                        ))}
                  </div>
                </div>
              </div>
          ))}
        </div>

        {filteredMentors.length === 0 && (
            <div className="no-results">
              <h3>멘토가 없습니다</h3>
              <p>다른 키워드나 카테고리를 선택해보세요.</p>
            </div>
        )}
      </div>
  );
};

export default MentorList;
