import React from 'react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소'
}) => {
  if (!isOpen) return null; // isOpen이 false면 아무것도 렌더링하지 않음

  return (
      <div className="custom-delete-modal-overlay"> {/* 커스텀 오버레이 클래스 */}
        <div className="custom-delete-modal-content"> {/* 커스텀 콘텐츠 클래스 */}
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="custom-delete-modal-actions"> {/* 커스텀 액션 클래스 */}
            <button
                onClick={onConfirm}
                className="custom-delete-confirm-btn" // 커스텀 확인 버튼 클래스
                disabled={isLoading}
            >
              {isLoading ? '처리 중...' : confirmText}
            </button>
            <button
                onClick={onClose}
                className="custom-delete-cancel-btn" // 커스텀 취소 버튼 클래스
                disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
  );
};

export default DeleteConfirmationModal;
