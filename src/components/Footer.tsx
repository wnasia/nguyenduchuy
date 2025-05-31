
import { Mail, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2">
              Contact Us
            </h3>
            <p className="text-sm text-gray-600">
              We'd love to hear your stories and connect with you
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <a 
              href="mailto:huy110qt@gmail.com"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors group"
            >
              <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">huy110qt@gmail.com</span>
            </a>
            
            <a 
              href="https://wa.me/84918795578"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors group"
            >
              <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">0918795578</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Nguyen Duc Huy. A warm place to share your stories.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
