import Link from "next/link";
import { X } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 min-h-[40px] py-2 sm:py-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-1 sm:space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 w-full">
          {/* Copyright and links - on one line on mobile */}
          <div className="flex flex-col items-center space-y-1 sm:space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 text-center">
              <span>© {currentYear} HackerScope AI</span>
              <span className="text-gray-400">·</span>
              <Link
                href="/privacy-terms"
                className="text-gray-600 hover:text-orange-500 transition-colors duration-200"
              >
                Privacy Policy & Terms of Service
              </Link>
            </div>
          </div>

          {/* TinyLaunch Badge and Social icons */}
          <div className="flex flex-col items-center space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* TinyLaunch Badge */}
            <a href="https://tinylaun.ch" target="_blank" rel="noopener">
              <img
                src="https://tinylaun.ch/tinylaunch_badge_2.svg"
                alt="TinyLaunch Badge"
                className="w-32 sm:w-40 h-auto hover:opacity-80 transition-opacity duration-200"
              />
            </a>

            {/* Social icons - hidden on mobile, visible on larger screens */}
            <div className="hidden sm:flex items-center space-x-4">
              <a
                href="https://x.com/richard_angapin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-orange-500 transition-colors duration-200"
              >
                <span className="sr-only">X (Twitter)</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
