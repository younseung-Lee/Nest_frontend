import React from 'react';
import './CareerDetailModal.css';

const CareerDetailModal = ({ detail, onClose, onEdit, onDelete, onEditCertificates }) => {
  if (!detail) return null;

  const formatDate = (dateString) => {
    return dateString ? dateString.slice(0, 10) : null;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="career-detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="career-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="career-detail-modal-content">
          <h2>{detail.company}</h2>
          
          <p>
            <b>기간:</b> 
            <span>
              {formatDate(detail.startAt)} ~ {detail.endAt ? formatDate(detail.endAt) : '재직중'}
            </span>
          </p>
          
          <p>
            <b>상태:</b> 
            <span>{detail.careerStatus}</span>
          </p>
          
          {detail.department && (
            <p>
              <b>부서:</b> 
              <span>{detail.department}</span>
            </p>
          )}
          
          {detail.description && (
            <p>
              <b>설명:</b> 
              <span>{detail.description}</span>
            </p>
          )}
          
          {detail.skills && detail.skills.length > 0 && (
            <div className="skills-container">
              <b>보유 기술</b>
              <div className="skills-tags">
                {detail.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {detail.certificates && detail.certificates.length > 0 && (
            <div className="certificates-container">
              <b>자격증 및 인증서</b>
              <ul className="certificates-list">
                {detail.certificates.map(cert => (
                  <li key={cert.id} className="certificate-item">
                    <img src={cert.fileUrl}></img>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="modal-edit-cert-btn" onClick={onEditCertificates}>
            <span>자격증 수정</span>
          </button>
          <button className="modal-edit-btn" onClick={onEdit}>
            <span>수정</span>
          </button>
          <button className="modal-delete-btn" onClick={onDelete}>
            <span>삭제</span>
          </button>
          <button className="career-detail-modal-close-btn" onClick={onClose}>
            <span>닫기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetailModal;
