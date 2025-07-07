import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Star, BadgeCheck } from 'lucide-react';
import './MentorProfile.css';
import { profileAPI } from '../services/api';
import {authUtils, userInfoUtils} from "../utils/tokenUtils.js";
import ReviewSection from './ReviewSection';

const convertTime = (enumVal) => {
  switch (enumVal) {
    case 'MINUTES_20': return '20분';
    case 'MINUTES_30': return '30분';
    case 'MINUTES_40': return '40분';
    default: return '';
  }
};

const formatPeriod = (start, end) => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  return `${startDate.getFullYear()}.${startDate.getMonth() + 1} ~ ${endDate ? `${endDate.getFullYear()}.${endDate.getMonth() + 1}` : '현재'}`;
};

const MentorProfile = ({ mentor, onBack, onBooking }) => {
  const [mentorDetails, setMentorDetails] = useState(null);
  const [careerList, setCareerList] = useState([]);
  const [ticketList, setTicketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCareer, setShowCareer] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const userId = mentor?.userId || mentor?.id;
    const profileId = mentor?.profileId || mentor?.id;
    if (!userId || !profileId) return;

    setLoading(true);
    Promise.all([
      profileAPI.getMentorDetail(userId, profileId),
      profileAPI.getCareerList(profileId),
      profileAPI.getTicketList()
    ])
    .then(([mentorRes, careerRes, ticketRes]) => {
      setMentorDetails(mentorRes.data.data);
      setCareerList(careerRes.data.data.content);
      setTicketList(ticketRes.data.data);
    })
    .catch(() => {
      setMentorDetails(null);
      setCareerList([]);
      setTicketList([]);
    })
    .finally(() => setLoading(false));
  }, [mentor]);

  const handleServiceSelect = (service) => setSelectedService(service);

  const handleBookingClick = () => {
    if (userRole === null || userRole === undefined) {
      window.location.href = '/login';
      return;
    }
    if (onBooking) {
      onBooking({ mentor: mentorDetails});
    }
  };

  const services = ticketList.map(ticket => ({
    id: ticket.id,
    name: ticket.name,
    description: ticket.description,
    detail: ticket.description,
    duration: [convertTime(ticket.ticketTime), '1회'],
    price: `${ticket.price.toLocaleString()}원`,
    popular: false
  }));

  const userRole = userInfoUtils.getUserInfo()?.userRole;

  if (loading) return <div>로딩 중...</div>;
  if (!mentorDetails) return <div>멘토 정보를 불러오지 못했습니다.</div>;

  return (
      <div className="mentor-profile-container">
        <div className="profile-header">
          <div className="header-left">
            <button className="mentor-profile-back-button" onClick={onBack}>
              <ArrowLeft className="icon" />
            </button>
          </div>
          <div className="header-right">
            {userRole ? (
              <div className="header-profile"
                   onClick={() => window.location.href = '/mypage'}>
                <img src="/default-profile.svg" alt="프로필"
                     className="profile-image"/>
              </div>
            ) : (
              <button
                className="login-button"
                onClick={() => window.location.href = '/login'}>
                로그인
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-hero">
            <div className={`profile-avatar gradient-bg-${mentorDetails.id}`}>
              {mentorDetails.imgUrl ? (
                  <img
                      src={mentorDetails.imgUrl}
                      alt={mentorDetails.name}
                      className="profile-avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                  />
              ) : null}
              <div
                  className="profile-avatar-text"
                  style={{ display: mentorDetails.imgUrl ? 'none' : 'flex' }}
              >
                {mentorDetails.avatar || mentorDetails.name?.[0] || 'M'}
              </div>
            </div>
            <div className="profile-info">
              <div className="mentor-username">{mentorDetails.username || mentorDetails.name}</div>
              <h1 className="profile-title">{mentorDetails.currentPosition || mentorDetails.title}</h1>
              <div className="hashtags">
                {Array.isArray(mentorDetails.hashtags) &&
                    mentorDetails.hashtags.map((tag, index) => (
                        <span key={index} className="hashtag">#{tag}</span>
                    ))}
              </div>
            </div>
          </div>

          <div className="content-section intro-section">
            <h2 className="section-title">멘토 프로필</h2>
            <div className="intro-content">
              {(mentorDetails.introduction || '').split('\n').map((line, idx) => (
                  <p key={idx} className="intro-paragraph">{line}</p>
              ))}
            </div>
          </div>

          <div className="content-section career-section">
            <h2 className="section-title">멘토 경력</h2>
            {Array.isArray(careerList) && (
                <div className="career-content">
                  <div className="mentor-career-table">
                    <div className="career-header">
                      <div className="career-col">인증여부</div>
                      <div className="career-col">회사명</div>
                      <div className="career-col">근무기간</div>
                    </div>
                    {careerList.map((item, idx) => (
                        <div key={idx} className="career-row">
                          <div className="career-col">
                            {item.careerStatus === 'AUTHORIZED' ? (
                                // AUTHORIZED: 노란색 채워진 별
                                <BadgeCheck size={20} color="black" fill="gold" />
                            ) : item.careerStatus === 'UNAUTHORIZED' ? (
                                // UNAUTHORIZED: 하얀색 (테두리만) 별
                                <p>미인증</p>
                            ) : ('')}
                          </div>
                          <div className="career-col">{item.company}</div>
                          <div className="career-col">{formatPeriod(item.startAt, item.endAt)}</div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>


          <div className="content-section services-section">
            <div className="service-intro">
              <h2 className="section-title">제공 서비스</h2>
              <p className="service-intro-text">
                {mentorDetails.name || '멘토'}님이 제공하는 전문 멘토링 서비스입니다.
              </p>
              <div className="service-points">
                <div className="service-point">✓ 실무 경험을 바탕으로 한 실질적인 조언</div>
                <div className="service-point">✓ 개인별 맞춤형 피드백 제공</div>
                <div className="service-point">✓ 체계적인 커리어 가이드</div>
              </div>
            </div>
          </div>

          <div className="content-section service-items-section">
            <h2 className="section-title">이용권</h2>
            <div className="services-content">
              <div className="services-grid">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className={`service-card ${service.popular ? 'popular' : ''}`}
                    >
                      {service.popular && (
                          <div className="popular-badge">
                            <Star className="star-icon" /> 인기
                          </div>
                      )}
                      <div className="service-header">
                        <h3 className="mp-service-name">{service.name}</h3>
                        <div className="service-duration">
                          {service.duration.map((dur, idx) => (
                              <span key={idx} className="duration-tag">{dur}</span>
                          ))}
                        </div>
                      </div>
                      <p className="service-description">{service.description}</p>
                      <div className="service-detail">
                        {service.detail.split('\n').map((line, idx) => (
                            <div key={idx} className="detail-line">{line}</div>
                        ))}
                      </div>
                      <div className="service-footer">
                        <div className="service-price">{service.price}</div>
                      </div>
                    </div>
                ))}

              </div>

              {selectedService && (
                  <div className="selection-summary">
                    <div className="summary-content">
                      <div className="summary-service">
                        <strong>{selectedService.name}</strong>
                        <span className="summary-price">{selectedService.price}</span>
                      </div>
                      <div className="summary-duration">
                        {selectedService.duration.join(' • ')}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

          <div className="content-section">
            <ReviewSection mentorId={mentorDetails.userId || mentorDetails.id} />
          </div>

        </div>

        <div className="fixed-bottom">
          {(userRole === 'MENTEE' || userRole === null || userRole === undefined)
              && (<button
                  className={`contact-button ${selectedService ? 'with-selection' : ''}`}
                  onClick={handleBookingClick}
              >
                {selectedService
                    ? `${selectedService.name} 신청하기 (${selectedService.price})`
                    : '상담 신청하기'}
              </button>
          )}
        </div>
      </div>
  );
};

export default MentorProfile;
