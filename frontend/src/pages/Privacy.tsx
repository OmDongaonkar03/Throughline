import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/logo-icon.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-foreground font-medium">Throughline</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Effective Date: February 1, 2026
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-foreground leading-relaxed">
                  At Throughline, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
                <div className="space-y-4 text-foreground leading-relaxed">
                  <div>
                    <h3 className="font-medium mb-2">Personal Information</h3>
                    <p className="text-muted-foreground">
                      We collect information that you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                      <li>Name and email address (when you create an account)</li>
                      <li>Profile information (bio, profile photo)</li>
                      <li>Payment information (processed securely through Razorpay)</li>
                      <li>Check-ins and content you create</li>
                      <li>Communication preferences and settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Authentication Information</h3>
                    <p className="text-muted-foreground">
                      When you sign in with Google OAuth, we receive your name, email address, and profile photo from Google. We do not store your Google password.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Usage Information</h3>
                    <p className="text-muted-foreground">
                      We automatically collect certain information about your device and how you interact with our service, including:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                      <li>Device information and browser type</li>
                      <li>IP address and location data</li>
                      <li>Usage patterns and feature interactions</li>
                      <li>Error logs and diagnostics (via Sentry)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your check-ins and generate AI-powered content narratives</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Monitor and analyze usage patterns to improve user experience</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              {/* AI Processing */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. AI Processing and Content Generation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your check-ins are processed by third-party AI services (including OpenAI) to generate content narratives. We do not currently use your content to train AI models. AI-generated content may contain errors or inaccuracies, and you should review and edit content before publishing.
                </p>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. How We Share Your Information</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> We share data with third-party service providers who perform services on our behalf, including Google OAuth (authentication), Razorpay (payment processing), Sentry (error monitoring), and AI providers (content generation).</li>
                    <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid legal requests.</li>
                    <li><strong>Business Transfers:</strong> If Throughline is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee its absolute security.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Retention and Deletion</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, your data will be permanently deleted within 30 days. You can request data export by contacting us at dongaonkarom2006@gmail.com.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Your Rights and Choices</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Access:</strong> You can access your personal information through your account settings</li>
                  <li><strong>Correction:</strong> You can update or correct your information at any time</li>
                  <li><strong>Deletion:</strong> You can delete your account and request deletion of your data</li>
                  <li><strong>Export:</strong> You can request a copy of your data by contacting support</li>
                  <li><strong>Opt-out:</strong> You can opt-out of marketing communications at any time</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Throughline is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              {/* International Users */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using Throughline, you consent to the transfer of your information to India and other countries where we operate.
                </p>
              </section>

              {/* Third-Party Links */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">10. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. Your continued use of the service after any changes indicates your acceptance of the updated policy.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground font-medium">Throughline</p>
                  <p className="text-muted-foreground">Aurangpura, Chhatrapati Sambhajinagar, MH, India</p>
                  <p className="text-muted-foreground">Email: dongaonkarom2006@gmail.com</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;