import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="py-6 text-center">
        <p className="text-3xl font-bold">Terms and Conditions</p>
      </header>

      <main className="max-w-5xl mx-auto p-6 bg-white shadow-md mt-6 rounded-lg">
        <section className="mb-6">
          <p className="font-semibold">Effective Date: 05/22/2025</p>
          <p className="mt-4">
            Welcome to Salus Pharmacy ("we," "us," or "our"). These Terms and
            Conditions ("Terms") govern your access to and use of our website
            saluspharmacy.com ("Website"), including the purchase of
            pharmaceutical products and other services offered outside the
            United States.
          </p>
          <p className="mt-4">
            By accessing or using our Website, you agree to be bound by these
            Terms. If you do not agree, please do not use our services.
          </p>
        </section>

        {[
          {
            title: "1. Eligibility",
            content: [
              <>
                You must be at least 18 years old (or the legal age of majority
                in your jurisdiction) to use this Website and make purchases. By
                using the Website, you confirm that you meet this requirement.
              </>,
            ],
          },
          {
            title: "2. Medical Disclaimer",
            content: [
              <>
                The content provided on our Website is for informational
                purposes only and does <strong>not</strong> constitute medical
                advice, diagnosis, or treatment.
              </>,
              <>
                Always consult a licensed healthcare professional before
                starting any medication.
              </>,
              <>
                We do not replace the professional relationship between you and
                your healthcare provider.
              </>,
            ],
          },
          {
            title: "3. Prescription Medications",
            content: [
              <>
                Some medications require a valid prescription from a licensed
                medical practitioner.
              </>,
              <>
                You agree to provide an accurate and valid prescription when
                required and acknowledge that we may verify it with your
                healthcare provider.
              </>,
              <>
                We reserve the right to refuse or cancel orders that do not
                comply with applicable prescription requirements.
              </>,
            ],
          },
          {
            title: "4. International Use and Regulatory Compliance",
            content: [
              <>
                Our services are intended for customers{" "}
                <strong>outside the United States.</strong>
              </>,
              <>
                It is your responsibility to ensure that the products you
                purchase comply with your local laws and regulations.
              </>,
              <>
                We are not liable for any customs issues, import restrictions,
                or seizures that may occur in your jurisdiction.
              </>,
            ],
          },
          {
            title: "5. Product Information",
            content: [
              <>
                We make every effort to ensure the accuracy of product
                descriptions, images, and prices.
              </>,
              <>
                However, we do not guarantee that all information is accurate,
                complete, or current at all times.
              </>,
              <>
                Products may vary slightly in packaging or appearance depending
                on manufacturer or supplier.
              </>,
            ],
          },
          {
            title: "6. Orders and Payment",
            content: [
              <>All orders are subject to availability and confirmation.</>,
              <>
                We reserve the right to cancel or refuse any order at our sole
                discretion.
              </>,
              <>
                Prices are listed in US dollars, and payments are processed
                securely via Stripe Payment Processing.
              </>,
            ],
          },
          {
            title: "7. Shipping and Delivery",
            content: [
              <>
                Delivery times are estimates only and may vary depending on
                location and customs procedures.
              </>,
              <>
                We are not responsible for delays, damages, or losses caused by
                third-party carriers or customs authorities.
              </>,
            ],
          },
          {
            title: "8. Returns and Refunds",
            content: [
              <>
                Due to the nature of pharmaceutical products, we generally do{" "}
                <strong>not</strong> accept returns unless the product is
                defective or incorrect.
              </>,
              <>
                For eligible returns, you must notify us within 7 days of
                receiving the product.
              </>,
            ],
          },
          {
            title: "9. Limitation of Liability",
            content: [
              <>
                To the fullest extent permitted by law, we are not liable for
                any direct, indirect, incidental, or consequential damages
                resulting from the use of our Website or products.
              </>,
              <>
                This includes, but is not limited to, loss of profits, health
                complications, or data loss.
              </>,
            ],
          },
          {
            title: "10. User Accounts",
            content: [
              <>
                You are responsible for maintaining the confidentiality of your
                account and password.
              </>,
              <>
                You agree to provide accurate, current, and complete information
                and to update it as necessary.
              </>,
            ],
          },
          {
            title: "11. Intellectual Property",
            content: [
              <>
                All content on this Website, including logos, text, images, and
                software, is our property or licensed to us.
              </>,
              <>
                You may not reproduce, modify, distribute, or republish any
                content without our written permission.
              </>,
            ],
          },
          {
            title: "12. Termination",
            content: [
              <>
                We may suspend or terminate your access to the Website at any
                time for violations of these Terms or applicable laws.
              </>,
            ],
          },
          {
            title: "13. Governing Law",
            content: [
              <>
                These Terms are governed by the laws of the United States,
                without regard to conflict of law principles. You agree to
                submit to the exclusive jurisdiction of the courts located in
                Miami, FL.
              </>,
            ],
          },
          {
            title: "14. Changes to Terms",
            content: [
              <>
                We may update these Terms from time to time. The latest version
                will always be posted on our Website with the effective date.
                Continued use of the Website after changes constitutes
                acceptance of the new Terms.
              </>,
            ],
          },
          {
            title: "15. Contact Us",
            content: [
              <>
                If you have any questions or concerns regarding these Terms,
                please contact us at:
              </>,
              <>Salus Pharmacy</>,
              <>4677 W Flagler St, Miami, FL 33134</>,
              <>Phone: (786) 360-2360</>,
            ],
          },
        ].map(({ title, content }, index) => (
          <section key={index} className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">
              {title}
            </h2>
            {Array.isArray(content) ? (
              <ul className="list-disc list-inside space-y-1">
                {content.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            ) : (
              content
            )}
          </section>
        ))}
      </main>

      {/* <footer className="text-center text-sm text-gray-600 py-4">
        &copy; {new Date().getFullYear()} Salus Pharmacy. All rights reserved.
      </footer> */}
    </div>
  );
};

export default TermsAndConditions;
