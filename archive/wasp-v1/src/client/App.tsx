import './Main.css';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <div className='relative min-h-screen dark:text-white'>
      {/* Cinematic Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-400/20 via-transparent to-transparent dark:from-purple-400/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent dark:from-blue-400/30"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_#8b5cf6_0deg,_#ec4899_120deg,_#06b6d4_240deg,_#8b5cf6_360deg)] opacity-5 dark:opacity-10"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 dark:opacity-20"></div>
      </div>
      <div className='relative z-10 mx-auto max-w-7xl sm:px-6 lg:px-8'>
        <Outlet />
      </div>
    </div>
  );
}
