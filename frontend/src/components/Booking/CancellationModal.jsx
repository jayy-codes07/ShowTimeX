import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import Button from "../UI/Button";
import { useTheme } from "../../context/ThemeContext";

const CancellationReasons = [
  "Change of plans",
  "Schedule conflict",
  "Found better prices",
  "Technical issues",
  "Not feeling well",
  "Other",
];

const CancellationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleConfirm = () => {
    if (!selectedReason.trim()) {
      alert("Please select a cancellation reason");
      return;
    }
    onConfirm(selectedReason, additionalNote);
    setSelectedReason("");
    setAdditionalNote("");
  };

  const handleClose = () => {
    setSelectedReason("");
    setAdditionalNote("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`rounded-2xl max-w-md w-full p-6 shadow-xl border ${
              isDark
                ? "bg-dark-card border-gray-700"
                : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Cancel Booking
                </h2>
              </div>
              <button
                onClick={handleClose}
                className={`transition ${
                  isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning message */}
            <p className={`text-sm mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Please tell us why you're cancelling so we can improve our service. You will receive a refund within 2-3 working days.
            </p>

            {/* Reason selection */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Cancellation Reason
              </label>
              <div className="space-y-2">
                {CancellationReasons.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                      isDark
                        ? "border-gray-700 hover:bg-gray-800/50"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className={`ml-3 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional note */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Additional Details (Optional)
              </label>
              <textarea
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="Tell us more about your cancellation..."
                className={`w-full border rounded-lg p-3 text-sm placeholder-gray-500 focus:border-primary focus:outline-none resize-none ${
                  isDark
                    ? "bg-gray-800/50 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
                rows="3"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Keep Ticket
              </Button>
              <Button
                onClick={handleConfirm}
                variant="danger"
                className="flex-1"
                disabled={!selectedReason || isLoading}
                isLoading={isLoading}
              >
                Cancel Booking
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancellationModal;
