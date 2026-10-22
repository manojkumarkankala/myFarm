interface Props {
  navigate: (to: string) => void;
  type: 'privacy' | 'terms';
}

export default function LegalPage({ navigate, type }: Props) {
  const isPrivacy = type === 'privacy';
  return (
    <div>
      <div className="bg-green-700 py-12 text-white">
        <div className="section">
          <h1 className="text-4xl font-bold">{isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}</h1>
        </div>
      </div>
      <div className="section py-12">
        <div className="prose max-w-3xl text-stone-700">
          {isPrivacy ? (
            <>
              <p>This Privacy Policy explains how AgriRent collects, uses, and protects your information when you use our agricultural equipment rental website.</p>
              <h2 className="text-xl font-bold text-stone-900">Information We Collect</h2>
              <p>When you submit a booking request or contact form, we collect your name, mobile number, WhatsApp number (if provided), farm location, and booking details. This information is used only to process your booking and contact you.</p>
              <h2 className="text-xl font-bold text-stone-900">How We Use Your Information</h2>
              <p>Your information is used to review and approve booking requests, schedule equipment delivery, and communicate with you about your booking. We do not display your personal information publicly.</p>
              <h2 className="text-xl font-bold text-stone-900">Data Security</h2>
              <p>All data is stored securely with row-level access controls. Only the authorized administrator can view your booking details. Your information is never shared with third parties.</p>
              <h2 className="text-xl font-bold text-stone-900">Contact</h2>
              <p>For any privacy concerns, please contact the owner directly using the phone number on our Contact page.</p>
            </>
          ) : (
            <>
              <p>These Terms & Conditions govern your use of the AgriRent agricultural equipment rental website.</p>
              <h2 className="text-xl font-bold text-stone-900">Booking Requests</h2>
              <p>Submitting a booking request does not guarantee confirmation. All requests are subject to approval by the equipment owner. You will be notified of approval or rejection via phone or WhatsApp.</p>
              <h2 className="text-xl font-bold text-stone-900">Pricing</h2>
              <p>Prices displayed are estimates. The final price is confirmed by the owner based on actual land area, work required, and other factors.</p>
              <h2 className="text-xl font-bold text-stone-900">Equipment Use</h2>
              <p>All equipment is operated by our trained operators. Customers must ensure the farm area is accessible and safe for equipment operation.</p>
              <h2 className="text-xl font-bold text-stone-900">Cancellations</h2>
              <p>To cancel a booking, contact the owner with your reference number. Cancellation handling is at the owner's discretion.</p>
              <h2 className="text-xl font-bold text-stone-900">Liability</h2>
              <p>AgriRent is not liable for crop damage or losses unrelated to the equipment operation. We are committed to providing quality service.</p>
            </>
          )}
          <p className="mt-8 text-sm text-stone-500">Last updated: October 2025</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-ghost mt-8">Back to Home</button>
      </div>
    </div>
  );
}
