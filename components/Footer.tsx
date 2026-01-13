
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-12 border-t border-slate-200 bg-white">
      <div className="container mx-auto px-6 text-center space-y-4">
        <div className="inline-block px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-indigo-600 font-bold">
            Made by @Mr_Odilxon
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} ExamPro Learning Platform.
          </p>
          <p className="text-slate-400 text-sm">
            Professional Practice Tool for Psychological Sciences.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
