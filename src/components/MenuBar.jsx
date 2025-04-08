import React, { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { translations } from '../i18n/translations';

const MenuBar = ({ 
  onAddPlayer, 
  onRemovePlayer, 
  onResetPositions,
  onUndo,
  onRedo,
  onClearAllLines,
  onResetBallPassState
}) => {
  const [language, setLanguage] = useState('th');
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
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
    };
    
    document.addEventListener('pointerdown', handleClickOutside);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showPlayerMenu]);
  
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
  
  return (
    <div className={`w-full bg-orange-400 text-white px-4 py-2 shadow-md z-50 relative menu-bar ${isIOS ? 'ios-menu' : ''} ${isLandscape ? 'landscape' : 'portrait'}`}>
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="basketball">🏀</span>
          <h1 className={`font-bold ${isLandscape && isIOS ? 'text-lg' : 'text-xl'}`}>{t.appTitle}</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {/* เมนูผู้เล่นแบบดร็อปดาวน์ รวมการเพิ่มและลบในเมนูเดียวกัน */}
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
              <div className={`absolute right-0 mt-1 bg-white shadow-lg rounded py-1 z-50 ${isIOS ? 'w-48' : 'w-44'}`}>
                <div className="text-center font-bold text-gray-700 py-1 border-b border-gray-200">
                  {t.teamRed}
                </div>
                <button 
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={handleAddRedPlayer}
                  onTouchStart={handleTouchStartButton}
                  onTouchEnd={handleTouchEndButton}
                >
                  <span className="mr-2">+</span> {t.addRedPlayer}
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={handleRemoveRedPlayer}
                  onTouchStart={handleTouchStartButton}
                  onTouchEnd={handleTouchEndButton}
                >
                  <span className="mr-2">-</span> {t.removeRedPlayer}
                </button>
                
                <div className="text-center font-bold text-gray-700 py-1 border-t border-b border-gray-200 mt-1">
                  {t.teamWhite}
                </div>
                <button 
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleAddWhitePlayer}
                  onTouchStart={handleTouchStartButton}
                  onTouchEnd={handleTouchEndButton}
                >
                  <span className="mr-2">+</span> {t.addWhitePlayer}
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleRemoveWhitePlayer}
                  onTouchStart={handleTouchStartButton}
                  onTouchEnd={handleTouchEndButton}
                >
                  <span className="mr-2">-</span> {t.removeWhitePlayer}
                </button>
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
          
          <LanguageSwitcher 
            currentLanguage={language} 
            onLanguageChange={setLanguage} 
          />
        </div>
      </div>
    </div>
  );
};

export default MenuBar;