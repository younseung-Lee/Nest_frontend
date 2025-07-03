import React from 'react';
import CareerManagement from './CareerManagement';
import ComplaintManagement from "./ComplaintManagement.jsx";

// 관리자 탭에서 경력관리 기능만 출력
const CareersTab = ({ isDarkMode }) => {
  return <CareerManagement isDarkMode={isDarkMode} />;
};

export default CareersTab;

