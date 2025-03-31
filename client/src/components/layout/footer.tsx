import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 nordic-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <a className="flex items-center">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="ml-2 text-gray-600 font-medium">dApp Explorer</span>
              </a>
            </Link>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/about">
              <a className="text-gray-500 hover:text-gray-700">About</a>
            </Link>
            <Link href="/privacy">
              <a className="text-gray-500 hover:text-gray-700">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="text-gray-500 hover:text-gray-700">Terms</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-500 hover:text-gray-700">Contact</a>
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} dApp Explorer. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
