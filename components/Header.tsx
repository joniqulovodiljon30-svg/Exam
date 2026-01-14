import React from 'react';

interface HeaderProps {
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          onClick={onLogoClick}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-indigo-700 transition-colors">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            ExamPro
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div class="social-links">
                    <a href="https://t.me/Mr_Odilxon" class="social-link" target="_blank">
                        <i class="fab fa-telegram"></i>
          <a 
            href="https://t.me/Mr_Odilxon" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 font-bold text-sm md:text-base hover:text-indigo-800 transition-colors active-press"
          >
            Made by @Mr_Odilxon
          </a>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold uppercase tracking-wider hidden sm:block">
            Premium Access
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
