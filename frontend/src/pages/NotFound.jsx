import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Big 404 */}
        <h1 className="text-8xl font-extrabold text-red-500 mb-2">404</h1>

        {/* Brand Logo */}
        <div className="mb-4 flex items-center justify-center">
          <span className="site-brand-logo site-brand-logo-header" role="img" aria-label="ShowTimeX logo" />
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist. It might have been
          moved or the URL may be incorrect.
        </p>

        {/* Go Home Button */}
        <Link
          to="/"
          className="btn-primary inline-block"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;


