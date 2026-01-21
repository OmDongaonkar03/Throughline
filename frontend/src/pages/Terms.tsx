import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
            <h1 className="text-3xl font-semibold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">
              Effective Date: February 1, 2026
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-foreground leading-relaxed">
                  Welcome to Throughline! These Terms of Service ("Terms") govern your access to and use of Throughline's services, website, and applications (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
                </p>
              </section>

              {/* Acceptance of Terms */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By creating an account or using Throughline, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a legally binding agreement between you and Throughline.
                </p>
              </section>

              {/* Eligibility */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. Eligibility</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You must be at least 13 years old to use Throughline. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
                </p>
              </section>

              {/* Account Registration */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Registration and Security</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>To use certain features of the Service, you must create an account. You agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access to your account</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                  </ul>
                  <p className="mt-3">
                    We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activities.
                  </p>
                </div>
              </section>

              {/* Subscription and Payment */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. Subscription and Payment</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p><strong>Free Tier:</strong> Throughline offers a free tier with limited features that you can use indefinitely.</p>
                  
                  <p><strong>Pro Tier:</strong> Our Pro subscription is available for ₹399 per month and provides access to advanced features. By subscribing to Pro, you agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Pay the monthly subscription fee through Razorpay</li>
                    <li>Automatic renewal each month until you cancel</li>
                    <li>Provide valid payment information</li>
                  </ul>

                  <p><strong>Billing and Renewal:</strong> Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. You can cancel your subscription at any time through your account settings.</p>

                  <p><strong>Refund Policy:</strong> All subscription payments are non-refundable. If you cancel your subscription, you will not be charged for subsequent billing periods, but you will retain access to Pro features until the end of your current billing period.</p>

                  <p><strong>Price Changes:</strong> We may change our subscription prices at any time. Price changes will apply to your next billing cycle after we provide you with notice.</p>
                </div>
              </section>

              {/* User Content and Ownership */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">5. User Content and Ownership</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p><strong>Your Content:</strong> You retain ownership of all check-ins, posts, and other content you create using Throughline ("User Content"). By using the Service, you grant Throughline a worldwide, non-exclusive, royalty-free license to use, store, process, and display your User Content solely for the purpose of providing and improving the Service, including:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Processing your check-ins through AI services to generate content narratives</li>
                    <li>Storing your content on our servers</li>
                    <li>Displaying your content to you within the Service</li>
                    <li>Creating backups and ensuring service continuity</li>
                  </ul>
                  
                  <p className="mt-3"><strong>Content Restrictions:</strong> You agree not to upload, post, or transmit any content that:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or invasive of privacy</li>
                    <li>Infringes on intellectual property rights of others</li>
                    <li>Contains viruses, malware, or other harmful code</li>
                    <li>Violates any applicable laws or regulations</li>
                    <li>Impersonates another person or entity</li>
                  </ul>

                  <p className="mt-3">We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable, at our sole discretion.</p>
                </div>
              </section>

              {/* AI-Generated Content */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">6. AI-Generated Content</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>Throughline uses artificial intelligence to generate content based on your check-ins. You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI-generated content may contain errors, inaccuracies, or unexpected outputs</li>
                    <li>You are responsible for reviewing and editing AI-generated content before publishing or sharing it</li>
                    <li>Throughline is not responsible for the accuracy, quality, or appropriateness of AI-generated content</li>
                    <li>AI-generated content should not be considered professional advice of any kind</li>
                  </ul>
                </div>
              </section>

              {/* Prohibited Uses */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use the Service for any illegal purpose or in violation of any laws</li>
                  <li>Attempt to gain unauthorized access to the Service or other user accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use automated systems (bots, scrapers) without our permission</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>Resell, redistribute, or sublicense the Service</li>
                  <li>Violate the intellectual property rights of Throughline or others</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Service, including its design, code, features, and branding, is owned by Throughline and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our express written permission.
                </p>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">9. Disclaimers and Limitation of Liability</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p><strong>Service "AS IS":</strong> The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure.</p>
                  
                  <p><strong>No Guarantee of Uptime:</strong> We strive to maintain high availability but do not guarantee 100% uptime. The Service may be temporarily unavailable due to maintenance, updates, or technical issues.</p>

                  <p><strong>Data Loss:</strong> While we implement backup measures, we are not liable for any loss of data, content, or information. You are responsible for maintaining your own backups of important content.</p>

                  <p><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Throughline shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                    <li>Your use or inability to use the Service</li>
                    <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                    <li>Any bugs, viruses, or harmful code transmitted through the Service</li>
                    <li>Any errors or omissions in any content or for any loss or damage incurred as a result of your use of any content</li>
                  </ul>
                </div>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">10. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Throughline and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">11. Termination</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>You may terminate your account at any time through your account settings. Upon termination:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your access to the Service will be immediately revoked</li>
                    <li>Your data will be deleted within 30 days</li>
                    <li>You will not be entitled to any refunds for prepaid subscription fees</li>
                  </ul>
                  <p className="mt-3">
                    We may suspend or terminate your access to the Service at any time, without prior notice, for any reason, including if you violate these Terms or engage in fraudulent or illegal activities.
                  </p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">12. Changes to These Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Service and updating the "Effective Date" at the top of this page. Your continued use of the Service after any changes indicates your acceptance of the updated Terms.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">13. Governing Law and Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in Chhatrapati Sambhajinagar, Maharashtra, India.
                </p>
              </section>

              {/* Severability */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">14. Severability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
                </p>
              </section>

              {/* Entire Agreement */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">15. Entire Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Throughline regarding your use of the Service and supersede all prior agreements and understandings.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">16. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms, please contact us at:
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

export default Terms;