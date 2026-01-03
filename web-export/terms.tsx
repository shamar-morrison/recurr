import Head from 'next/head';
import React from 'react';

export default function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Head>
        <title>Terms of Service | Recurr</title>
        <meta name="description" content="Terms of Service for Recurr" />
      </Head>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-indigo-100 mt-2">Last updated: {lastUpdated}</p>
        </div>

        <div className="p-8 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Recurr. These Terms of Service ("Terms") govern your use of the Recurr
              mobile application and related services (collectively, the "Service"). By accessing or
              using the Service, you agree to be bound by these Terms. If you do not agree to these
              Terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Recurr is a subscription management tool designed to help users track their recurring
              expenses, subscriptions, and payment dates. The Service allows you to input
              subscription details, receive notifications, and view spending insights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Service, you may be required to sign in using a Google
              Account ("Account"). You are responsible for maintaining the confidentiality of your
              Account login information and for all activities that occur under your Account. You
              agree to immediately notify us of any unauthorized use of your Account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Privacy And Data Security</h2>
            <p className="mb-4">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and
              protect your personal information. By using the Service, you agree to the terms of our
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Prohibited Uses</h2>
            <p className="mb-4">
              You agree not to use the Service for any unlawful purpose or in any way that could
              damage, disable, overburden, or impair the Service.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Do not attempt to gain unauthorized access to any part of the Service.</li>
              <li>Do not use any automated means to access the Service without our permission.</li>
              <li>Do not interfere with the proper working of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are and will remain
              the exclusive property of Recurr and its licensors. The Service is protected by
              copyright, trademark, and other laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your access to the Service immediately, without prior
              notice or liability, for any reason whatsoever, including without limitation if you
              breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="mb-4">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Recurr makes no
              warranties, expressed or implied, regarding the operation or availability of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall Recurr, its directors, employees, partners, agents, suppliers, or
              affiliates, be liable for any indirect, incidental, special, consequential or punitive
              damages, including without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your access to or use of or inability to access or
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any
              time. We will provide notice of any significant changes. By continuing to access or
              use our Service after those revisions become effective, you agree to be bound by the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at support@recurr.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
