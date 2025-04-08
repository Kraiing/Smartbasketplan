import React from 'react';

const LanguageSwitcher = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex gap-2">
      <button 
        className={`${currentLanguage === 'th' ? 'bg-gray-300' : 'bg-white'} text-black px-2 py-1 rounded hover:bg-gray-100`}
        onClick={() => onLanguageChange('th')}
      >
        🇹🇭
      </button>
      <button 
        className={`${currentLanguage === 'en' ? 'bg-gray-300' : 'bg-white'} text-black px-2 py-1 rounded hover:bg-gray-100`}
        onClick={() => onLanguageChange('en')}
      >
        🇬🇧
      </button>
      <button 
        className={`${currentLanguage === 'jp' ? 'bg-gray-300' : 'bg-white'} text-black px-2 py-1 rounded hover:bg-gray-100`}
        onClick={() => onLanguageChange('jp')}
      >
        🇯🇵
      </button>
    </div>
  );
};

export default LanguageSwitcher;