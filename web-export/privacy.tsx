import Head from 'next/head';
import React from 'react';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Head>
        <title>Privacy Policy | Recurr</title>
        <meta name="description" content="Privacy Policy for Recurr" />
      </Head>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-indigo-100 mt-2">Last updated: {lastUpdated}</p>
        </div>

        <div className="p-8 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Recurr ("we," "our," or "us") respects your privacy and is committed to protecting it
              through our compliance with this policy. This policy describes the types of
              information we may collect from you or that you may provide when you use the Recurr
              mobile application (the "App") and our practices for collecting, using, maintaining,
              protecting, and disclosing that information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="mb-4">
              We collect information from and about users of our App, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>
                <strong>Personal Information:</strong> When you sign in with Google, we collect your
                email address and basic profile information to create and manage your account.
              </li>
              <li>
                <strong>Subscription Data:</strong> We store the subscription details you enter into
                the App, such as service names, costs, billing cycles, and renewal dates.
              </li>
              <li>
                <strong>Usage Details:</strong> We may collect non-personal tracking information,
                such as usage patterns, to improve the functionality of the App.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">
              We use information that we collect about you or that you provide to us, including any
              personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                To provide you with the App and its contents (e.g., tracking your subscriptions).
              </li>
              <li>To sync your data across your devices using cloud services.</li>
              <li>To notify you about upcoming subscription renewals or changes to our App.</li>
              <li>To improve our App and deliver a better and more personalized service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">
              Your data is stored securely in the cloud using industry-standard providers (e.g.,
              Google Firebase). We implement measures designed to protect your personal information
              from accidental loss and from unauthorized access, use, alteration, and disclosure.
              However, the transmission of information via the internet is not completely secure,
              and we cannot guarantee the security of your personal information transmitted to our
              App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="mb-4">
              We may use third-party services that collect, monitor, and analyze this type of
              information in order to increase our App's functionality. These third-party service
              providers have their own privacy policies addressing how they use such information.
            </p>
            <p className="mb-4">
              <strong>Google Sign-In:</strong> We use Google Sign-In for authentication. By using
              this feature, you authorize us to access your Google account information as specified
              during the sign-in process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="mb-4">
              You have the right to access, correct, or delete your personal information. You can
              delete your account and all associated data directly within the App settings. If you
              have any issues, you may contact us to request the deletion of your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="mb-4">
              Our App is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If we learn we have collected or
              received personal information from a child under 13 without verification of parental
              consent, we will delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              8. Changes to Our Privacy Policy
            </h2>
            <p className="mb-4">
              It is our policy to post any changes we make to our privacy policy on this page
              associated with the App. The date the privacy policy was last revised is identified at
              the top of the page. You are responsible for periodically visiting our App or this
              policy to check for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
            <p className="mb-4">
              To ask questions or comment about this privacy policy and our privacy practices,
              contact us at: support@recurr.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
