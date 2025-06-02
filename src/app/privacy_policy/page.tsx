import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="py-6 text-center">
        <p className="text-3xl font-bold">Privacy Policy</p>
      </header>

      <main className="max-w-5xl mx-auto p-6 bg-white shadow-md mt-6 rounded-lg">
        <section className="mb-6">
          <p className="font-semibold">Effective Date: 05/22/2025</p>
          <p className="mt-4">
            This Privacy Policy describes how Salus Pharmacy ("we," "us," or
            "our") collects, uses, and protects your personal information when
            you visit our website (saluspharmacy.com) or use our services.
          </p>
        </section>

        {[
          {
            title: "1. Information We Collect",
            content: [
              <>
                Personal Information such as name, email address, phone number,
                mailing address, and date of birth.
              </>,
              <>Account details such as username and password.</>,
              <>
                Prescription information where required for product purchase.
              </>,
              <>
                Payment information processed securely through a third-party
                provider.
              </>,
              <>
                Usage data such as IP address, browser type, and pages visited.
              </>,
            ],
          },
          {
            title: "2. How We Use Your Information",
            content: [
              <>To fulfill your orders and provide customer service.</>,
              <>To personalize your experience and improve our services.</>,
              <>
                To communicate with you about orders, updates, or promotional
                offers.
              </>,
              <>To comply with legal and regulatory requirements.</>,
            ],
          },
          {
            title: "3. Sharing Your Information",
            content: [
              <>
                We do not sell or rent your personal information to third
                parties.
              </>,
              <>
                We may share your data with service providers and partners who
                help us operate our business and services.
              </>,
              <>
                We may disclose information if required by law or to protect our
                rights and users' safety.
              </>,
            ],
          },
          {
            title: "4. Data Security",
            content: [
              <>
                We implement appropriate technical and organizational measures
                to protect your data against unauthorized access, loss, or
                misuse.
              </>,
              <>
                Despite our efforts, no method of transmission over the Internet
                or electronic storage is completely secure.
              </>,
            ],
          },
          {
            title: "5. Cookies and Tracking Technologies",
            content: [
              <>
                We use cookies and similar technologies to enhance user
                experience and analyze website traffic.
              </>,
              <>
                You can control cookies through your browser settings, but
                disabling them may affect certain features of the Website.
              </>,
            ],
          },
          {
            title: "6. Your Rights",
            content: [
              <>
                You have the right to access, correct, update, or delete your
                personal information.
              </>,
              <>
                You may also opt out of receiving marketing communications at
                any time.
              </>,
              <>
                To exercise your rights, please contact us using the details
                provided below.
              </>,
            ],
          },
          {
            title: "7. Data Retention",
            content: [
              <>
                We retain your personal information only as long as necessary
                for the purposes outlined in this policy or as required by law.
              </>,
            ],
          },
          {
            title: "8. Children’s Privacy",
            content: [
              <>
                Our services are not intended for individuals under the age of
                18. We do not knowingly collect information from children.
              </>,
            ],
          },
          {
            title: "9. Third-Party Links",
            content: [
              <>
                Our Website may contain links to third-party websites. We are
                not responsible for their privacy practices or content.
              </>,
            ],
          },
          {
            title: "10. Changes to This Privacy Policy",
            content: [
              <>
                We may update this Privacy Policy periodically. The updated
                version will be posted on this page with the effective date.
              </>,
              <>
                Your continued use of the Website after changes are posted
                signifies your acceptance of the updated policy.
              </>,
            ],
          },
          {
            title: "11. Contact Us",
            content: [
              <>
                If you have any questions or concerns regarding this Privacy
                Policy, please contact us at:
              </>,
              <>Salus Pharmacy</>,
              <>4677 W Flagler St, Miami, FL 33134</>,
              <>Phone: (786) 360-2360</>,
            ],
          },
        ].map(({ title, content }, index) => (
          <section key={index} className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">{title}</h2>
            <ul className="list-disc list-inside space-y-1">
              {content.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
};

export default PrivacyPolicy;
