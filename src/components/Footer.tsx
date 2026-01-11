import { Home, BookOpen, Image as ImageIcon, Video, Facebook, Twitter, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import huyLogo from "@/assets/huy-logo.png";

const Footer = () => {
  const { t } = useI18n();
  
  return (
    <footer className="bg-gradient-to-br from-gray-50 via-white to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 mb-3">
              <img src={huyLogo} alt="HUY" className="h-16 w-auto" />
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("footer.about_description") || "A warm place to share precious moments, unique stories, and life experiences."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-semibold text-gray-900">
              {t("footer.quick_links") || "Quick Links"}
            </h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t("nav.home") || "Home"}
              </Link>
              <Link to="/stories" className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("nav.stories") || "Stories"}
              </Link>
              <Link to="/gallery" className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t("nav.gallery") || "Gallery"}
              </Link>
              <Link to="/videos" className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                <Video className="h-4 w-4" />
                {t("nav.videos") || "Videos"}
              </Link>
            </nav>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-semibold text-gray-900">
              {t("footer.follow_us") || "Follow Us"}
            </h3>
            <div className="flex items-center space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#1877F2] hover:border-[#1877F2] transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-foreground hover:border-foreground transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/tkwni"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#0088cc] hover:border-[#0088cc] transition-all hover:scale-110"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 text-center md:text-left">
              {t("footer.copyright") || "© 2025 All rights reserved."}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">
                {t("footer.privacy") || "Privacy Policy"}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {t("footer.terms") || "Terms of Service"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
