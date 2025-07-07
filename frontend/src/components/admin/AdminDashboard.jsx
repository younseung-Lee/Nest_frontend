import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Users, MessageCircle, CreditCard, Settings,
  BarChart3, Shield, Bell, Search, Filter, Calendar,
  Download, RefreshCw, TrendingUp, Activity, DollarSign,
  UserCheck, AlertTriangle, Eye, Edit3, Trash2,
  Plus, X, Check, Zap, Target, Clock, Briefcase,
  FileText, Tag, Hash, Ticket, Gift, Menu, Sun, Moon,
  Globe, Cpu, Database, Wifi, Star, Award, Flame,
  ArrowUp, ArrowDown, MoreHorizontal, ChevronRight
} from 'lucide-react';

import DashboardTab from './DashboardTab';
import CareersTab from './CareersTab';
import ComplaintsTab from './ComplaintsTab';
import CategoriesTab from './CategoriesTab';
import KeywordsTab from './KeywordsTab';
import TicketsTab from './TicketsTab';
import CouponsTab from './CouponsTab';
import ReviewsTab from './ReviewsTab';


const AdminDashboard = ({ onBack, userInfo }) => {
  // URL 쿼리스트링을 통한 탭 상태 관리
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRealTimeMode, setIsRealTimeMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('tab', tabId);
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') || 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [stats, setStats] = useState({
    totalUsers: 1255,
    activeMentors: 168,
    totalSessions: 20,
    revenue: 9073,
    weeklyGrowth: 12.5,
    monthlyGrowth: 28.3,
    todayNewUsers: 28,
    onlineUsers: 156,
    pendingApprovals: 7,
    activeChats: 34
  });

  const [notifications, setNotifications] = useState([
    { id: 1, message: '새로운 멘토 승인 요청 3건', type: 'warning', time: '2분 전', urgent: true },
    { id: 2, message: '시스템 업데이트 완료', type: 'success', time: '1시간 전', urgent: false },
    { id: 3, message: '결제 오류 신고 1건', type: 'error', time: '3시간 전', urgent: true },
    { id: 4, message: '월간 수익 목표 90% 달성', type: 'success', time: '4시간 전', urgent: false }
  ]);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (!isRealTimeMode) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        onlineUsers: Math.max(100, prev.onlineUsers + Math.floor(Math.random() * 21) - 10),
        activeChats: Math.max(20, prev.activeChats + Math.floor(Math.random() * 7) - 3),
        totalSessions: prev.totalSessions + Math.floor(Math.random() * 2)
      }));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTimeMode]);

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: BarChart3, badge: null },
    { type: 'divider' },
    { id: 'careers', label: '경력 관리', icon: Briefcase, badge: null },
    { id: 'complaints', label: '민원 관리', icon: FileText, badge: null },
    { id: 'categories', label: '카테고리 관리', icon: Tag, badge: null },
    { id: 'keywords', label: '키워드 관리', icon: Hash, badge: null },
    { id: 'tickets', label: '이용권 관리', icon: Ticket, badge: null },
    { id: 'coupons', label: '쿠폰 관리', icon: Gift, badge: null },
    { id: 'reviews', label: '리뷰 관리', icon: Star, badge: null }
  ];



  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
            <DashboardTab
                isDarkMode={isDarkMode}
                stats={stats}
                lastUpdate={lastUpdate}
                isRealTimeMode={isRealTimeMode}
                setIsRealTimeMode={setIsRealTimeMode}
                loading={loading}
                setLoading={setLoading}
                notifications={notifications}
                setActiveTab={setActiveTab}
            />
        );
      case 'careers':
        return <CareersTab isDarkMode={isDarkMode} />;
      case 'complaints':
        return <ComplaintsTab isDarkMode={isDarkMode} />;
      case 'categories':
        return <CategoriesTab isDarkMode={isDarkMode} />;
      case 'keywords':
        return <KeywordsTab isDarkMode={isDarkMode} />;
      case 'tickets':
        return <TicketsTab isDarkMode={isDarkMode} />;
      case 'coupons':
        return <CouponsTab isDarkMode={isDarkMode} />;
      case 'reviews':
        return <ReviewsTab isDarkMode={isDarkMode} />;
      default:
        return (
            <div className={`rounded-2xl border p-8 text-center ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
            }`}>
              <Briefcase size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                개발 중
              </h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                해당 페이지는 개발 중입니다...
              </p>
            </div>
        );
    }
  };

  return (
      <div className={`min-h-screen transition-colors duration-300 ${
          isDarkMode
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
              : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        {/* 사이드바 */}
        <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-72'
        } ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-r ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>

          {/* 사이드바 헤더 */}
          <div className="flex items-center justify-between p-6">
            {!sidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {userInfo?.name || '관리자'}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Administrator
                    </p>
                  </div>
                </div>
            )}

            <div className="flex items-center justify-center">
              <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="px-3 pb-6">
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                      <div
                          key={index}
                          className={`my-4 h-px ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                      />
                  );
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                                ? isDarkMode
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-blue-50 text-blue-600'
                                : isDarkMode
                                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                      )}

                      <Icon size={20} className="flex-shrink-0" />

                      {!sidebarCollapsed && (
                          <>
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                            )}
                          </>
                      )}

                      {sidebarCollapsed && item.badge && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                      )}
                    </button>
                );
              })}
            </div>
          </nav>

          {/* 사이드바 푸터 */}
          {!sidebarCollapsed && (
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
                }`}>
                  <Bell size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                알림 {notifications.length}개
              </span>
                </div>
              </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
          {/* 상단 바 */}
          <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
              isDarkMode
                  ? 'bg-gray-900/80 border-gray-800'
                  : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  MentorConnect 관리자
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* 다크모드 토글 */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-lg transition-colors ${
                        isDarkMode
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* 로그아웃 버튼 */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  <ChevronLeft size={16} />
                  로그아웃
                </button>
              </div>
            </div>
          </header>

          {/* 콘텐츠 영역 */}
          <main className="p-8">
            {renderContent()}
          </main>
        </div>
      </div>
  );
};

export default AdminDashboard;
