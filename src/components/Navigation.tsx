import React from 'react';

interface NavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activePage, 
  onNavigate, 
  onThemeToggle,
  isDarkMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mr-8">System Data Integration</h1>
            
            <div className="hidden md:flex space-x-4">
              <button 
                onClick={() => onNavigate('records')} 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'records' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Records
              </button>
              
              <button 
                onClick={() => onNavigate('gallery')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'gallery' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Image Gallery
              </button>
              
              <button 
                onClick={() => onNavigate('firebase-test')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'firebase-test' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Firebase Test
              </button>
              
              <button 
                onClick={() => onNavigate('load-test')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'load-test' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Load Test
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Theme toggle button */}
            <button 
              onClick={onThemeToggle}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="mobile-menu-button focus:outline-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="h-6 w-6 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button 
              onClick={() => onNavigate('records')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                activePage === 'records' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Records
            </button>
            
            <button 
              onClick={() => onNavigate('gallery')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                activePage === 'gallery' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Image Gallery
            </button>
            
            <button 
              onClick={() => onNavigate('firebase-test')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                activePage === 'firebase-test' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Firebase Test
            </button>
            
            <button 
              onClick={() => onNavigate('load-test')}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                activePage === 'load-test' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Load Test
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
