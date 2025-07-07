import React from 'react';
import { X, Download } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, paymentData, bookingInfo }) => {
  if (!isOpen) return null;

  // 실제 PDF 파일 다운로드 함수
  const downloadAsActualPDF = () => {
    try {
      // HTML 콘텐츠 생성
      const receiptContent = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <title>MentorConnect 영수증</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { 
                margin: 0.5cm; 
                size: A4; 
              }
              .no-print { display: none !important; }
            }
            body {
              font-family: 'Malgun Gothic', Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              max-width: 500px;
              margin: 0 auto;
              padding: 15px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
            }
            .company-name {
              font-size: 20px;
              font-weight: bold;
              color: #6d4c41;
              margin-bottom: 5px;
            }
            .company-info {
              color: #666;
              font-size: 11px;
              margin: 2px 0;
            }
            .section {
              margin: 15px 0;
              padding: 10px;
              border: 1px dashed #ddd;
              border-radius: 5px;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              color: #6d4c41;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px dotted #eee;
              font-size: 11px;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #666;
              font-weight: 500;
              flex: 1;
            }
            .info-value {
              font-weight: bold;
              color: #6d4c41;
              flex: 1;
              text-align: right;
            }
            .total-row {
              background: #f8f9fa;
              padding: 10px;
              margin: 8px 0;
              border-radius: 5px;
              font-size: 14px;
              font-weight: bold;
            }
            .total-amount {
              color: #ff8f00;
            }
            .discount {
              color: #ffcc02;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #eee;
              font-size: 10px;
              color: #666;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">MentorConnect</div>
            <div class="company-info">온라인 멘토링 플랫폼</div>
            <div class="company-info">사업자등록번호: 123-45-67890</div>
          </div>

          <div class="section">
            <div class="section-title">거래 정보</div>
            <div class="info-row">
              <span class="info-label">거래일시</span>
              <span class="info-value">${new Date(paymentData.approvedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">주문번호</span>
              <span class="info-value">${paymentData.orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">결제키</span>
              <span class="info-value" style="font-size: 9px; word-break: break-all;">${paymentData.paymentKey.substring(0, 20)}...</span>
            </div>
            <div class="info-row">
              <span class="info-label">결제방법</span>
              <span class="info-value">${paymentData.method || '토스페이'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">결제상태</span>
              <span class="info-value" style="color: #ff8f00;">${paymentData.status || '결제완료'}</span>
            </div>
          </div>

          ${paymentData.customerInfo ? `
          <div class="section">
            <div class="section-title">고객 정보</div>
            <div class="info-row">
              <span class="info-label">이름</span>
              <span class="info-value">${paymentData.customerInfo.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">이메일</span>
              <span class="info-value">${paymentData.customerInfo.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">전화번호</span>
              <span class="info-value">${paymentData.customerInfo.phone}</span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">서비스 정보</div>
            <div class="info-row">
              <span class="info-label">멘토</span>
              <span class="info-value">${bookingInfo.mentorName || '멘토 정보 없음'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">서비스</span>
              <span class="info-value">${bookingInfo.ticketName || '멘토링 서비스'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">예약일</span>
              <span class="info-value">${bookingInfo.reservationDate || '날짜 미정'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시간</span>
              <span class="info-value">${bookingInfo.reservationTime || '시간 미정'}</span>
            </div>
            ${paymentData.reservationId ? `
            <div class="info-row">
              <span class="info-label">예약번호</span>
              <span class="info-value">${paymentData.reservationId}</span>
            </div>
            ` : ''}
            ${paymentData.ticketId ? `
            <div class="info-row">
              <span class="info-label">티켓번호</span>
              <span class="info-value">${paymentData.ticketId}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">결제 내역</div>
            <div class="info-row">
              <span class="info-label">서비스 이용료</span>
              <span class="info-value">${Number(bookingInfo.originalAmount || paymentData.amount).toLocaleString()}원</span>
            </div>
            ${bookingInfo.discountAmount > 0 ? `
            <div class="info-row">
              <span class="info-label discount">🎫 쿠폰 할인</span>
              <span class="info-value discount">-${Number(bookingInfo.discountAmount).toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="total-row">
              <div style="display: flex; justify-content: space-between;">
                <span>총 결제금액</span>
                <span class="total-amount">${Number(paymentData.amount).toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>문의: 고객센터 1588-1234 | 이메일: support@mentorconnect.com</p>
            <p>이 영수증은 전자상거래법에 따른 정식 영수증입니다.</p>
          </div>
        </body>
        </html>
      `;

      // 새 창 열기
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptContent);
      printWindow.document.close();

      // 브라우저의 인쇄 대화상자에서 PDF로 저장 옵션 제공
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // 안내 메시지
        alert('인쇄 대화상자에서 "대상"을 "PDF로 저장"으로 선택하시면 PDF 파일로 저장됩니다.');
      }, 500);

    } catch (error) {
      console.error('PDF 생성 실패:', error);
      // 폴백: 인쇄 방식으로 대체
      downloadReceiptAsPDF();
    }
  };

  const downloadReceiptAsPDF = () => {
    // HTML을 PDF로 변환하는 간단한 방법
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6d4c41; margin-bottom: 10px;">MentorConnect</h1>
          <p style="color: #6d4c41; margin: 0;">온라인 멘토링 플랫폼</p>
          <p style="color: #6d4c41; margin: 0;">사업자등록번호: 123-45-67890</p>
        </div>
        
        <hr style="border: 1px dashed #d1d5db; margin: 20px 0;">
        
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #6d4c41; padding: 5px 0;">거래일시</td><td style="text-align: right; font-weight: bold; color: #6d4c41;">${new Date(paymentData.approvedAt).toLocaleString('ko-KR')}</td></tr>
            <tr><td style="color: #6d4c41; padding: 5px 0;">주문번호</td><td style="text-align: right; font-weight: bold; color: #6d4c41;">${paymentData.orderId}</td></tr>
            <tr><td style="color: #6d4c41; padding: 5px 0;">결제방법</td><td style="text-align: right; font-weight: bold; color: #6d4c41;">${paymentData.method || '토스페이'}</td></tr>
            <tr><td style="color: #6d4c41; padding: 5px 0;">결제상태</td><td style="text-align: right; font-weight: bold; color: #ff8f00;">${paymentData.status || '결제완료'}</td></tr>
          </table>
        </div>

        <hr style="border: 1px dashed #d1d5db; margin: 20px 0;">

        ${paymentData.customerInfo ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #6d4c41; margin-bottom: 10px;">고객 정보</h3>
          <div style="background: #fff8e1; padding: 15px; border-radius: 8px;">
            <p style="margin: 3px 0; color: #6d4c41;"><strong>이름:</strong> ${paymentData.customerInfo.name}</p>
            <p style="margin: 3px 0; color: #6d4c41;"><strong>이메일:</strong> ${paymentData.customerInfo.email}</p>
            <p style="margin: 3px 0; color: #6d4c41;"><strong>전화번호:</strong> ${paymentData.customerInfo.phone}</p>
          </div>
        </div>
        <hr style="border: 1px dashed #d1d5db; margin: 20px 0;">
        ` : ''}

        <div style="margin-bottom: 20px;">
          <h3 style="color: #6d4c41; margin-bottom: 10px;">서비스 정보</h3>
          <div style="background: #fff8e1; padding: 15px; border-radius: 8px;">
            <p style="margin: 3px 0; color: #6d4c41;"><strong>멘토:</strong> ${bookingInfo.mentorName || '멘토 정보 없음'}</p>
            <p style="margin: 3px 0; color: #6d4c41;"><strong>서비스:</strong> ${bookingInfo.ticketName || '멘토링 서비스'}</p>
            <p style="margin: 3px 0; color: #6d4c41;"><strong>예약일:</strong> ${bookingInfo.reservationDate || '날짜 미정'}</p>
            <p style="margin: 3px 0; color: #6d4c41;"><strong>시간:</strong> ${bookingInfo.reservationTime || '시간 미정'}</p>
            ${paymentData.reservationId ? `<p style="margin: 3px 0; color: #6d4c41;"><strong>예약번호:</strong> ${paymentData.reservationId}</p>` : ''}
            ${paymentData.ticketId ? `<p style="margin: 3px 0; color: #6d4c41;"><strong>티켓번호:</strong> ${paymentData.ticketId}</p>` : ''}
          </div>
        </div>

        <hr style="border: 1px dashed #d1d5db; margin: 20px 0;">

        <div style="margin-bottom: 20px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #6d4c41; padding: 5px 0;">서비스 이용료</td><td style="text-align: right; color: #6d4c41;">${Number(bookingInfo.originalAmount || paymentData.amount).toLocaleString()}원</td></tr>
            ${bookingInfo.discountAmount > 0 ? `<tr><td style="color: #ffcc02; padding: 5px 0;">🎫 쿠폰 할인</td><td style="text-align: right; color: #ffcc02;">-${Number(bookingInfo.discountAmount).toLocaleString()}원</td></tr>` : ''}
            <tr style="border-top: 1px solid #d1d5db; padding-top: 10px;">
              <td style="color: #6d4c41; padding: 10px 0 5px 0; font-size: 16px;"><strong>총 결제금액</strong></td>
              <td style="text-align: right; color: #ff8f00; font-size: 16px; font-weight: bold; padding: 10px 0 5px 0;">${Number(paymentData.amount).toLocaleString()}원</td>
            </tr>
          </table>
        </div>

        <hr style="border: 1px dashed #d1d5db; margin: 20px 0;">

        <div style="text-align: center; font-size: 12px; color: #6d4c41;">
          <p>문의: 고객센터 1588-1234</p>
          <p>이메일: support@mentorconnect.com</p>
          <p style="margin-top: 15px;">이 영수증은 전자상거래법에 따른 정식 영수증입니다.</p>
        </div>
      </div>
    `;

    // 새 창에서 인쇄 대화상자 열기
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <title>MentorConnect 영수증</title>
        <meta charset="utf-8">
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // 인쇄 대화상자 자동 실행
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // 개발 모드에서 영수증 데이터 구조 확인
  if (import.meta.env.DEV) {
    console.group('🧾 영수증 모달 데이터 확인');
    console.log('paymentData:', paymentData);
    console.log('bookingInfo:', bookingInfo);
    console.log('결제 정보:', {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      paymentKey: paymentData.paymentKey,
      method: paymentData.method,
      status: paymentData.status,
      approvedAt: paymentData.approvedAt
    });
    console.log('예약 정보:', {
      mentorName: bookingInfo.mentorName,
      reservationDate: bookingInfo.reservationDate,
      reservationTime: bookingInfo.reservationTime,
      ticketName: bookingInfo.ticketName,
      originalAmount: bookingInfo.originalAmount,
      discountAmount: bookingInfo.discountAmount
    });
    console.log('고객 정보:', paymentData.customerInfo);
    console.groupEnd();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold" style={{ color: '#6d4c41' }}>영수증</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" style={{ color: '#6d4c41' }} />
          </button>
        </div>

        {/* 영수증 내용 */}
        <div className="p-6 bg-gray-50">
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
            {/* 회사 정보 */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#6d4c41' }}>MentorConnect</h3>
              <p className="text-sm" style={{ color: '#6d4c41' }}>온라인 멘토링 플랫폼</p>
              <p className="text-sm" style={{ color: '#6d4c41' }}>사업자등록번호: 123-45-67890</p>
            </div>

            {/* 구분선 */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* 거래 정보 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>거래일시</span>
                <span className="font-medium" style={{ color: '#6d4c41' }}>{new Date(paymentData.approvedAt).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>주문번호</span>
                <span className="font-medium" style={{ color: '#6d4c41' }}>{paymentData.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>결제키</span>
                <span className="font-medium text-xs" style={{ color: '#6d4c41' }}>{paymentData.paymentKey}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>결제방법</span>
                <span className="font-medium" style={{ color: '#6d4c41' }}>{paymentData.method || '토스페이'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>결제상태</span>
                <span className="font-medium" style={{ color: '#ff8f00' }}>{paymentData.status || '결제완료'}</span>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* 고객 정보 */}
            {paymentData.customerInfo && (
              <>
                <div className="mb-6">
                  <h4 className="font-semibold mb-3" style={{ color: '#6d4c41' }}>고객 정보</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm space-y-1">
                      <div style={{ color: '#6d4c41' }}><strong>이름:</strong> {paymentData.customerInfo.name}</div>
                      <div style={{ color: '#6d4c41' }}><strong>이메일:</strong> {paymentData.customerInfo.email}</div>
                      <div style={{ color: '#6d4c41' }}><strong>전화번호:</strong> {paymentData.customerInfo.phone}</div>
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-dashed border-gray-300 my-4"></div>
              </>
            )}

            {/* 서비스 정보 */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3" style={{ color: '#6d4c41' }}>서비스 정보</h4>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div style={{ color: '#6d4c41' }}><strong>멘토:</strong> {bookingInfo.mentorName || '멘토 정보 없음'}</div>
                  <div style={{ color: '#6d4c41' }}><strong>서비스:</strong> {bookingInfo.ticketName || '멘토링 서비스'}</div>
                  <div style={{ color: '#6d4c41' }}><strong>예약일:</strong> {bookingInfo.reservationDate || '날짜 미정'}</div>
                  <div style={{ color: '#6d4c41' }}><strong>시간:</strong> {bookingInfo.reservationTime || '시간 미정'}</div>
                  {paymentData.reservationId && (
                    <div style={{ color: '#6d4c41' }}><strong>예약번호:</strong> {paymentData.reservationId}</div>
                  )}
                  {paymentData.ticketId && (
                    <div style={{ color: '#6d4c41' }}><strong>티켓번호:</strong> {paymentData.ticketId}</div>
                  )}
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* 결제 내역 */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6d4c41' }}>서비스 이용료</span>
                <span style={{ color: '#6d4c41' }}>{Number(bookingInfo.originalAmount || paymentData.amount).toLocaleString()}원</span>
              </div>
              {bookingInfo.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#ffcc02' }}>🎫 쿠폰 할인</span>
                  <span style={{ color: '#ffcc02' }}>-{Number(bookingInfo.discountAmount).toLocaleString()}원</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span style={{ color: '#6d4c41' }}>총 결제금액</span>
                  <span style={{ color: '#ff8f00' }}>{Number(paymentData.amount).toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* 하단 정보 */}
            <div className="text-center text-xs space-y-1" style={{ color: '#6d4c41' }}>
              <p>문의: 고객센터 1588-1234</p>
              <p>이메일: support@mentorconnect.com</p>
              <p className="pt-2">이 영수증은 전자상거래법에 따른 정식 영수증입니다.</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="p-4 border-t">
          <button 
            onClick={() => {
              // 사용자에게 선택 옵션 제공
              const userChoice = confirm('어떤 방식으로 다운로드하시겠습니까?\n\n확인: PDF로 저장 (브라우저 인쇄 대화상자)\n취소: 새 창에서 인쇄 미리보기');
              if (userChoice) {
                downloadAsActualPDF();
              } else {
                downloadReceiptAsPDF();
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg font-medium transition-colors hover:bg-orange-700"
            style={{ 
              backgroundColor: '#ff8f00'
            }}
          >
            <Download className="w-4 h-4" />
            PDF 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
