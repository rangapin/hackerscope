import Link from "next/link";
import { Linkedin, Facebook } from "lucide-react";

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

          {/* Social icons - hidden on mobile, visible on larger screens */}
          <div className="hidden sm:flex items-center space-x-4">
            <a
              href="https://www.linkedin.com/company/hackerscope/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-orange-500 transition-colors duration-200"
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/hackerscopeAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-orange-500 transition-colors duration-200"
            >
              <span className="sr-only">Facebook</span>
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
