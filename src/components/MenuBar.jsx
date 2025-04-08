import React, { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { translations } from '../i18n/translations';
import TeamPositionsManager from './TeamPositionsManager';

const MenuBar = ({
  onAddPlayer,
  onRemovePlayer,
  onResetPositions,
  onUndo,
  onRedo,
  onClearAllLines,
  onResetBallPassState,
  activePositions,
  onTogglePosition
}) => {
  const [language, setLanguage] = useState('th');
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRedTeamMenu, setShowRedTeamMenu] = useState(false);
  const [showWhiteTeamMenu, setShowWhiteTeamMenu] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
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
      // รอให้การหมุนจอเสร็จสมบูรณ์ก่อนตรวจสอบ
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
    };
    
    document.addEventListener('pointerdown', handleClickOutside);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showPlayerMenu, showRedTeamMenu, showWhiteTeamMenu]);
  
  const handleAddRedPlayer = () => {
    onAddPlayer('red');
    setShowPlayerMenu(false);
  };
  
  const handleAddWhitePlayer = () => {
    onAddPlayer('white');
    setShowPlayerMenu(false);
  };
  
  const handleRemoveRedPlayer = () => {
    onRemovePlayer('red');
    setShowPlayerMenu(false);
  };
  
  const handleRemoveWhitePlayer = () => {
    onRemovePlayer('white');
    setShowPlayerMenu(false);
  };
  
  // ใช้เฉพาะบนอุปกรณ์ iOS
  const handleTouchStartButton = (e) => {
    // เพิ่มเอฟเฟคเมื่อกดปุ่มเพื่อให้ผู้ใช้รู้ว่าได้กดแล้ว
    if (isIOS) {
      e.currentTarget.style.opacity = '0.7';
    }
  };
  
  const handleTouchEndButton = (e) => {
    // คืนค่าเอฟเฟคกลับเมื่อปล่อยปุ่ม
    if (isIOS) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // เปิดป๊อปอัพข้อมูล
  const handleOpenAboutModal = () => {
    setShowAboutModal(true);
  };

  // ปิดป๊อปอัพข้อมูล
  const handleCloseAboutModal = () => {
    setShowAboutModal(false);
  };
  
  // ฟังก์ชันสำหรับจัดการการเปิด/ปิดเมนูของทีมแดง
  const handleToggleRedTeamMenu = () => {
    setShowRedTeamMenu(!showRedTeamMenu);
    setShowWhiteTeamMenu(false);
  };
  
  // ฟังก์ชันสำหรับจัดการการเปิด/ปิดเมนูของทีมขาว
  const handleToggleWhiteTeamMenu = () => {
    setShowWhiteTeamMenu(!showWhiteTeamMenu);
    setShowRedTeamMenu(false);
  };
  
  // ฟังก์ชันสำหรับปรับเปลี่ยนภาษา
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };
  
  return (
    <div className={`w-full bg-orange-400 text-white px-4 py-2 shadow-md z-50 relative menu-bar ${isIOS ? 'ios-menu' : ''} ${isLandscape ? 'landscape' : 'portrait'}`}>
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="basketball">🏀</span>
          <h1 className={`font-bold ${isLandscape && isIOS ? 'text-lg' : 'text-xl'}`}>{t.appTitle}</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
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
              <div className={`absolute right-0 mt-1 bg-white bg-opacity-30 backdrop-blur-sm shadow-lg rounded py-1 z-50 ${isIOS ? 'w-48' : 'w-44'}`}>
                <div className="text-center font-bold text-gray-700 py-1 border-b border-gray-200">
                  {t.positionsManagement}
                </div>
                
                {/* ปุ่มจัดการตำแหน่งทีมแดง */}
                <div className="relative red-team-menu-container">
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
                    <div className="absolute left-full top-0 mt-0 ml-1 bg-white bg-opacity-30 backdrop-blur-sm shadow-lg rounded-lg py-2 z-50 w-64 border border-red-100 animate-fade-in">
                      <TeamPositionsManager 
                        team="red" 
                        activePositions={activePositions && activePositions.red ? activePositions.red : {
                          PG: true, SG: true, SF: true, PF: true, C: true
                        }} 
                        onTogglePosition={onTogglePosition || (() => {})} 
                        t={t}
                        isIOS={isIOS}
                      />
                    </div>
                  )}
                </div>
                
                {/* ปุ่มจัดการตำแหน่งทีมขาว */}
                <div className="relative white-team-menu-container">
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
                    <div className="absolute left-full top-0 mt-0 ml-1 bg-white bg-opacity-50 backdrop-blur-sm shadow-lg rounded-lg py-2 z-50 w-64 border border-blue-100 animate-fade-in">
                      <TeamPositionsManager 
                        team="white" 
                        activePositions={activePositions && activePositions.white ? activePositions.white : {
                          PG: true, SG: true, SF: true, PF: true, C: true
                        }} 
                        onTogglePosition={onTogglePosition || (() => {})} 
                        t={t}
                        isIOS={isIOS}
                      />
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                {/* เมนูเดิมถูกลบออกตามที่ต้องการ */}
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
        </div>
      </div>
      
      {/* ป๊อปอัพแสดงข้อมูลและวิธีการใช้งาน */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black p-5 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-xl text-center mb-2">{t.aboutTitle}</h2>
            
            {/* ข้อมูลผู้พัฒนา */}
            <div className="mb-4">
              <p className="font-semibold">{t.developedBy}</p>
              <p className="text-orange-600 font-medium">{t.developerName}</p>
            </div>
            
            {/* วิธีใช้งาน */}
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">{t.howToUse}</h3>
              <ul className="space-y-1">
                {t.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm">{instruction}</li>
                ))}
              </ul>
            </div>
            
            {/* ปุ่มปิด */}
            <div className="text-center mt-4">
              <button
                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
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
  );
};

export default MenuBar;