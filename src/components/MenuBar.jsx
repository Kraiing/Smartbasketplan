import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { translations } from '../i18n/translations';
import TeamPositionsManager from './TeamPositionsManager';
import useMenuVisibility from '../hooks/useMenuVisibility';
import { useAuth } from '../contexts/AuthContext';

const MenuBar = ({
  language = 'th',
  setLanguage,
  onResetPositions,
  onUndo,
  onRedo,
  onClearAllLines,
  onResetBallPassState,
  activePositions,
  onTogglePosition
}) => {
  // ใช้ภาษาที่ได้รับจาก props หรือใช้ค่าเริ่มต้นเป็นภาษาไทย
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRedTeamMenu, setShowRedTeamMenu] = useState(false);
  const [showWhiteTeamMenu, setShowWhiteTeamMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const {
    isVisible,
    isTouchDevice,
    handleMenuEnter,
    handleMenuLeave,
    toggleMenu,
    showMenu
  } = useMenuVisibility();

  const t = translations[language] || translations.th;

  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  useEffect(() => {
    const checkIOS = () => {
      const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isAppleDevice);
    };

    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkIOS();
    checkOrientation();

    // ตรวจจับการเปลี่ยนแปลงการหมุนจอ
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // ปิดเมนูที่เปิดอยู่เมื่อกดที่อื่น
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPlayerMenu && e.target.closest('.player-menu-container') === null) {
        setShowPlayerMenu(false);
      }
      if (showRedTeamMenu && e.target.closest('.red-team-menu-container') === null) {
        setShowRedTeamMenu(false);
      }
      if (showWhiteTeamMenu && e.target.closest('.white-team-menu-container') === null) {
        setShowWhiteTeamMenu(false);
      }
      if (showUserMenu && e.target.closest('.user-menu-container') === null) {
        setShowUserMenu(false);
      }
    };

    // ใช้ timeout เพื่อหลีกเลี่ยงการปิดทันทีเมื่อเปิด
    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showPlayerMenu, showRedTeamMenu, showWhiteTeamMenu, showUserMenu]);

  // ใช้เฉพาะบนอุปกรณ์ iOS
  const handleTouchStartButton = (e) => {
    if (isIOS) {
      e.currentTarget.style.opacity = '0.7';
    }
  };

  const handleTouchEndButton = (e) => {
    if (isIOS) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // เปิดป๊อปอัพข้อมูล
  const handleOpenAboutModal = () => {
    setShowAboutModal(true);
    showMenu();
  };

  // ปิดป๊อปอัพข้อมูล
  const handleCloseAboutModal = () => {
    setShowAboutModal(false);

    if (isIOS) {
      setTimeout(() => {
        handleMenuLeave();
      }, 500);
    }
  };

  // จัดการออกจากระบบ
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ไปยังหน้าโปรไฟล์
  const handleGoToProfile = () => {
    navigate('/profile');
  };

  // ไปยังหน้า Feedback
  const handleGoToFeedback = () => {
    navigate('/feedback');
  };

  // จัดการการเปิด/ปิดเมนูของทีมแดง
  const handleToggleRedTeamMenu = () => {
    setShowRedTeamMenu(!showRedTeamMenu);
    setShowWhiteTeamMenu(false);
  };

  // จัดการการเปิด/ปิดเมนูของทีมขาว
  const handleToggleWhiteTeamMenu = () => {
    setShowWhiteTeamMenu(!showWhiteTeamMenu);
    setShowRedTeamMenu(false);
  };

  // เปิด/ปิดเมนูผู้ใช้
  const handleToggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // ฟังก์ชันสำหรับปรับเปลี่ยนภาษา
  const handleLanguageChange = (newLanguage) => {
    if (setLanguage) {
      setLanguage(newLanguage);
    }
  };

  return (
    <>
      {/* ปุ่มสลับการแสดงเมนูสำหรับอุปกรณ์ทัชสกรีน */}
      {isTouchDevice && !isVisible && !showAboutModal && (
        <button
          className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-70 text-orange-500 z-50 px-4 py-1 rounded-b-lg shadow"
          onClick={toggleMenu}
          onTouchStart={handleTouchStartButton}
          onTouchEnd={handleTouchEndButton}
        >
          ⇩
        </button>
      )}

      <div
        className={`w-full bg-orange-400 text-white px-4 py-2 shadow-md fixed top-0 left-0 right-0 z-[500] menu-bar ${isIOS ? 'ios-menu' : ''} ${isLandscape ? 'landscape' : 'portrait'} transition-transform duration-300 ease-in-out ${isVisible || showAboutModal ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={handleMenuEnter}
        onMouseLeave={handleMenuLeave}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="basketball">🏀</span>
            <h1 className={`font-bold ${isLandscape && isIOS ? 'text-lg' : 'text-xl'}`}>{t.appTitle}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* ปุ่มแสดงข้อเสนอแนะ */}
            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={handleGoToFeedback}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
            >
              {isIOS && isLandscape ? "💬" : t.feedbackButton || "ข้อเสนอแนะ"}
            </button>

            {/* เมนูผู้เล่นแบบดร็อปดาวน์ */}
            <div className="relative player-menu-container">
              <button
                className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
                onClick={() => setShowPlayerMenu(!showPlayerMenu)}
                onTouchStart={handleTouchStartButton}
                onTouchEnd={handleTouchEndButton}
              >
                {t.playerMenu} ▼
              </button>

              {showPlayerMenu && (
                <div className={`absolute right-0 mt-1 bg-white bg-opacity-90 backdrop-blur-sm shadow-lg rounded py-1 z-[100] player-dropdown ${isIOS ? 'w-48' : 'w-44'}`}>
                  <div className="text-center font-bold text-gray-700 py-1 border-b border-gray-200">
                    {t.positionsManagement}
                  </div>

                  {/* ปุ่มจัดการตำแหน่งทีมแดง */}
                  <div className="relative red-team-menu-container" id="red-team-menu">
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center justify-between"
                      onClick={handleToggleRedTeamMenu}
                      onTouchStart={handleTouchStartButton}
                      onTouchEnd={handleTouchEndButton}
                    >
                      <div className="flex items-center">
                        <img
                          src="/red-player.png"
                          alt="red player"
                          className="w-5 h-5 mr-2"
                        />
                        {t.teamRed}
                      </div>
                      <span>▶</span>
                    </button>

                    {showRedTeamMenu && (
                      <div className="absolute left-full top-0 mt-0 ml-1 bg-white bg-opacity-90 backdrop-blur-sm shadow-lg rounded-lg py-2 z-[60] w-64 border border-red-100 animate-fade-in red-team-dropdown">
                        <TeamPositionsManager
                          team="red"
                          activePositions={activePositions && activePositions.red ? activePositions.red : {
                            PG: true, SG: true, SF: true, PF: true, C: true
                          }}
                          onTogglePosition={(position) => {
                            if (onTogglePosition) {
                              onTogglePosition("red", position);
                            }
                          }}
                          t={t}
                          isIOS={isIOS}
                        />
                      </div>
                    )}
                  </div>

                  {/* ปุ่มจัดการตำแหน่งทีมขาว */}
                  <div className="relative white-team-menu-container" id="white-team-menu">
                    <button
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      onClick={handleToggleWhiteTeamMenu}
                      onTouchStart={handleTouchStartButton}
                      onTouchEnd={handleTouchEndButton}
                    >
                      <div className="flex items-center">
                        <img
                          src="/white-player.png"
                          alt="white player"
                          className="w-5 h-5 mr-2"
                        />
                        {t.teamWhite}
                      </div>
                      <span>▶</span>
                    </button>

                    {showWhiteTeamMenu && (
                      <div className="absolute left-full top-0 mt-0 ml-1 bg-white bg-opacity-90 backdrop-blur-sm shadow-lg rounded-lg py-2 z-[60] w-64 border border-blue-100 animate-fade-in white-team-dropdown">
                        <TeamPositionsManager
                          team="white"
                          activePositions={activePositions && activePositions.white ? activePositions.white : {
                            PG: true, SG: true, SF: true, PF: true, C: true
                          }}
                          onTogglePosition={(position) => {
                            if (onTogglePosition) {
                              onTogglePosition("white", position);
                            }
                          }}
                          t={t}
                          isIOS={isIOS}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 my-1"></div>

                  {/* ลบส่วนปุ่ม +/- ออกทั้งหมด */}
                </div>
              )}
            </div>

            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={onResetPositions}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
              title={t.resetPositions}
            >
              {isIOS && isLandscape ? <span role="img" aria-label="reset">🔄</span> : t.resetPositions}
            </button>

            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={onUndo}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
              title="Undo"
            >
              ↩️
            </button>

            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={onRedo}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
              title="Redo"
            >
              ↪️
            </button>

            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={onClearAllLines}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
              title="Clear Lines"
            >
              🧹
            </button>

            {/* เพิ่มปุ่มรีเซ็ตอนิเมชันค้าง */}
            {isIOS && (
              <button
                className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100 text-xs"
                onClick={onResetBallPassState}
                onTouchStart={handleTouchStartButton}
                onTouchEnd={handleTouchEndButton}
                title="Reset Ball Animation"
              >
                🏀⚠️
              </button>
            )}

            {/* เพิ่มปุ่มข้อมูล (i) */}
            <button
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100"
              onClick={handleOpenAboutModal}
              onTouchStart={handleTouchStartButton}
              onTouchEnd={handleTouchEndButton}
            >
              {isIOS && isLandscape ? "ℹ️" : t.aboutButton}
            </button>

            <LanguageSwitcher
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
            />

            {/* ปุ่มเมนูผู้ใช้ */}
            <div className="relative user-menu-container">
              <button
                className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-gray-100 flex items-center"
                onClick={handleToggleUserMenu}
                onTouchStart={handleTouchStartButton}
                onTouchEnd={handleTouchEndButton}
              >
                <span className="mr-1">👤</span>
                {!isLandscape && currentUser?.email ? currentUser.email.split('@')[0] : ''}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 bg-white bg-opacity-70 backdrop-blur-sm shadow-lg rounded py-1 z-50 w-48">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        {currentUser.email}
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={handleGoToProfile}
                      >
                        <span className="mr-2">👤</span> {t.profile || 'โปรไฟล์'}
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={handleLogout}
                      >
                        <span className="mr-2">🚪</span> {t.logout || 'ออกจากระบบ'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => navigate('/login')}
                    >
                      <span className="mr-2">🔑</span> {t.login || 'เข้าสู่ระบบ'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ป๊อปอัพแสดงข้อมูลและวิธีการใช้งาน */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white text-black p-5 rounded-lg max-w-md max-h-[70vh] overflow-y-auto" style={{ position: 'relative', top: 'auto', transform: 'none' }}>
              <h2 className="font-bold text-xl text-center mb-2 text-orange-600">{t.aboutTitle}</h2>

              {/* ข้อมูลผู้พัฒนา */}
              <div className="mb-4">
                <p className="font-semibold">{t.developedBy}</p>
                <p className="text-orange-600 font-medium">{t.developerName}</p>
              </div>

              {/* วิธีใช้งาน */}
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2 text-orange-600">{t.howToUse}</h3>
                <ul className="space-y-1">
                  {t.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-orange-500 mr-2 flex-shrink-0">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ปุ่มปิด */}
              <div className="text-center mt-4">
                <button
                  className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors"
                  onClick={handleCloseAboutModal}
                  onTouchStart={handleTouchStartButton}
                  onTouchEnd={handleTouchEndButton}
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuBar;
