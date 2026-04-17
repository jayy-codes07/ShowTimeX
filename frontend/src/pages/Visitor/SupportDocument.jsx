import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

const DOCUMENTS = {
  'help-center': {
    title: 'Help Center',
    description: 'Find quick help for booking, account, and payment questions.',
    points: [
      'How to book tickets: Select movie, choose showtime, pick seats, then pay.',
      'Need help with login: Use Forgot Password on the login page.',
      'Payment failed: Wait a few minutes and check My Tickets before retrying.',
      'Still stuck: Contact support@showtimex.com with your booking details.',
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    description: 'Simple terms for using ShowTimeX services.',
    points: [
      'You must provide correct account information.',
      'Ticket availability and prices can change without notice.',
      'Misuse of platform features may lead to account restriction.',
      'By booking on ShowTimeX, you agree to these terms.',
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    description: 'How your personal data is used and protected.',
    points: [
      'We collect basic account details like name, email, and phone.',
      'Payment processing is done through secure payment partners.',
      'We use your data to manage bookings and send important updates.',
      'We do not sell your personal data to third parties.',
    ],
  },
  'refund-policy': {
    title: 'Refund Policy',
    description: 'Basic refund and cancellation guidelines.',
    points: [
      'Refund eligibility depends on showtime and cancellation timing.',
      'Convenience fees may be non-refundable based on booking terms.',
      'Approved refunds are processed to the original payment method.',
      'Refund time can vary by bank and payment provider.',
    ],
  },
};

const ALIASES = {
  terms: 'terms-of-service',
  privacy: 'privacy-policy',
  refunds: 'refund-policy',
  refund: 'refund-policy',
  support: 'help-center',
};

const SupportDocument = ({ defaultDocKey = 'help-center' }) => {
  const { docKey } = useParams();

  const resolvedDocKey = useMemo(() => {
    const candidate = (docKey || defaultDocKey || 'help-center').toLowerCase();
    return ALIASES[candidate] || candidate;
  }, [docKey, defaultDocKey]);

  const doc = DOCUMENTS[resolvedDocKey] || DOCUMENTS['help-center'];

  return (
    <div className="min-h-screen bg-dark pt-20 sm:pt-24 pb-12 px-4">
      <div className="container-custom mx-auto">
        <div className="mb-6 rounded-2xl border border-gray-800 bg-dark-card p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{doc.title}</h1>
          <p className="mt-2 text-gray-400 max-w-3xl">{doc.description}</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-dark-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">About This Topic</h2>
          <ul className="space-y-2 text-gray-400">
            {doc.points.map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-sm text-gray-400 rounded-2xl border border-gray-800 bg-dark-card p-5 sm:p-6">
          <p className="mb-3">More support topics</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/support/help-center" className="site-footer-link">
              Help Center
            </Link>
            <Link to="/support/terms-of-service" className="site-footer-link">
              Terms of Service
            </Link>
            <Link to="/support/privacy-policy" className="site-footer-link">
              Privacy Policy
            </Link>
            <Link to="/support/refund-policy" className="site-footer-link">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDocument;
