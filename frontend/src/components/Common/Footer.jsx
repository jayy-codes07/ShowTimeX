import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="container-custom py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
          <div className="text-center sm:text-left">
            <div className="mb-4 flex items-center justify-center sm:justify-start">
              <span className="site-brand-logo site-brand-logo-footer" role="img" aria-label="ShowTimeX logo" />
            </div>
            <p className="mb-5 max-w-sm text-sm leading-6 text-gray-400 sm:max-w-none">
              A modern ticket booking experience for discovering films, booking seats,
              and managing your movie nights without friction.
            </p>
            <div className="flex justify-center gap-3 sm:justify-start">
              <a href="#" className="site-social-link" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="site-social-link" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="site-social-link" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="site-social-link" aria-label="Youtube">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="site-footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/movies" className="site-footer-link">
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="site-footer-link">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="site-footer-link">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 font-semibold text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support/help-center" className="site-footer-link">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/support/terms-of-service" className="site-footer-link">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/support/privacy-policy" className="site-footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/support/refund-policy" className="site-footer-link">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="mb-4 font-semibold text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start justify-center space-x-3 text-sm text-gray-400 sm:justify-start">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>Ahmedabad</span>
              </li>
              <li className="flex items-center justify-center space-x-3 text-sm text-gray-400 sm:justify-start">
                <Phone className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>+91 9274350698</span>
              </li>
              <li className="flex items-center justify-center space-x-3 text-sm text-gray-400 sm:justify-start">
                <Mail className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>support@showtimex.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} ShowTimeX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
