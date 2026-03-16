import PageLayout from "@/components/PageLayout";

const LAST_UPDATED = "March 6, 2026";

export default function TermsPage() {
  return (
    <PageLayout showNavbar={false} showFooter={true}>
      <section className="relative z-40 pt-20 sm:pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-[960px] mx-auto text-white">
          <header className="mb-10 sm:mb-12">
            <p className="text-base sm:text-lg text-[#E4B5FF] font-medium uppercase tracking-[0.2em] mb-2">Legal</p>
            <h1 className="font-semibold mb-3" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
              Terms of Service
            </h1>
            <p className="text-base text-white/60">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="space-y-14 sm:space-y-16 text-base sm:text-lg leading-relaxed text-white/80">
            <section id="introduction" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">1. Introduction</h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Qynx website, web
                application, and related services (collectively, the &quot;Platform&quot;). The Platform is operated by
                or on behalf of Qynx (&quot;Qynx&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
              </p>
              <p>
                By accessing or using the Platform, you agree to be bound by these Terms and by any additional policies
                or terms referenced here (including our Privacy Policy and Risk Disclosure, where applicable). If you do
                not agree with these Terms, you must not use the Platform.
              </p>
            </section>

            <section id="eligibility" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">2. Eligibility and user representations</h2>
              <p>By using the Platform, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>You are at least 18 years old (or the age of majority in your jurisdiction).</li>
                <li>You have full power and authority to enter into these Terms and to use the Platform.</li>
                <li>
                  Your use of the Platform is not prohibited by any applicable law, regulation, or sanctions regime, and
                  you are not located in a jurisdiction where use of the Platform is restricted.
                </li>
                <li>
                  You are not subject to any sanctions administered or enforced by any government or international
                  authority.
                </li>
                <li>
                  You understand the risks associated with digital assets, including but not limited to volatility, loss
                  of value, smart-contract risk, and potential regulatory changes.
                </li>
              </ul>
            </section>

            <section id="services" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">3. Description of the Platform</h2>
              <p>
                Qynx provides tools that help users monitor, analyze, and interact with crypto markets, including
                AI-powered analytics, portfolio and trading dashboards, and integrations with supported third-party
                wallets and networks such as BNB Smart Chain (&quot;BSC&quot;) and Ethereum. Qynx does not itself
                custody your funds; you remain in control of your own compatible wallet at all times.
              </p>
              <p>
                Qynx may provide interfaces that help you initiate blockchain transactions (for example, deposits to
                addresses configured by you or by Qynx according to the applicable product design). Any actual transfer
                of digital assets is executed on the underlying blockchain network via your chosen wallet provider, and
                not by Qynx.
              </p>
              <p>
                Nothing on the Platform constitutes financial, investment, tax, or legal advice. Any analytics,
                forecasts, or strategy outputs are provided for informational and educational purposes only and must not
                be relied on as a recommendation or guarantee of performance.
              </p>
            </section>

            <section id="non-custodial" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">4. Non-custodial nature and wallets</h2>
              <p>
                Qynx is designed to be non-custodial. You are solely responsible for your wallets, private keys, seed
                phrases, and any other credentials used to access your digital assets. Qynx does not have access to or
                control over your private keys and cannot recover them for you.
              </p>
              <p>By connecting a wallet to the Platform, you acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  You are using that wallet under the terms and conditions of the relevant third-party wallet provider.
                </li>
                <li>All transactions you approve through your wallet are final and irreversible on the blockchain.</li>
                <li>
                  Qynx is not responsible for any loss arising from your use of your wallet (including loss due to
                  compromised keys, malware, phishing, or user error).
                </li>
              </ul>
            </section>

            <section id="accounts" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">5. Accounts, security, and conduct</h2>
              <p>
                Some features of the Platform may require you to create an account or provide certain information (for
                example, authentication details, email address, or identifiers used by our backend). You agree to
                provide accurate, current, and complete information and to keep it updated.
              </p>
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Maintaining the confidentiality of your login credentials.</li>
                <li>All activity that occurs under your account or from your connected wallet.</li>
                <li>Immediately notifying us if you believe your account or wallet connection has been compromised.</li>
              </ul>
              <p>
                You agree not to use the Platform for any unlawful, fraudulent, or abusive purpose, and not to interfere
                with or disrupt the operation of the Platform or any connected networks.
              </p>
            </section>

            <section id="compliance" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">6. Compliance and restricted activities</h2>
              <p>
                You are solely responsible for complying with all laws and regulations that apply to your use of the
                Platform and your digital-asset activities, including but not limited to anti-money laundering
                (&quot;AML&quot;), counter-terrorism financing (&quot;CTF&quot;), sanctions, tax reporting, and
                securities laws.
              </p>
              <p>You agree that you will not:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  Use the Platform to engage in or facilitate any illegal activity, including money laundering,
                  terrorist financing, sanctions evasion, or fraud.
                </li>
                <li>
                  Attempt to circumvent any geographic, sanctions, or eligibility restrictions that may be applied by
                  Qynx or its service providers.
                </li>
                <li>
                  Use the Platform to send, receive, or otherwise handle proceeds of crime or other unlawful activity.
                </li>
              </ul>
              <p>
                Qynx reserves the right (but has no obligation) to monitor use of the Platform and to suspend or
                terminate access where we reasonably believe a violation of these Terms or of applicable law has
                occurred.
              </p>
            </section>

            <section id="markets-risk" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">7. Digital-asset and market risks</h2>
              <p>
                Digital assets and blockchain-based systems involve a high degree of risk. By using the Platform, you
                acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  Prices of digital assets are highly volatile and may lose all value, and past performance is not
                  indicative of future results.
                </li>
                <li>
                  Transactions on blockchains are generally irreversible and Qynx cannot reverse or cancel any
                  transaction you initiate.
                </li>
                <li>
                  Smart contracts, protocols, and third-party services integrated with or accessible from the Platform
                  may contain vulnerabilities, be attacked, or fail unexpectedly.
                </li>
                <li>
                  Network congestion, forks, upgrades, or other protocol-level changes can impact transaction times,
                  fees, or behavior in ways beyond Qynx&apos;s control.
                </li>
              </ul>
              <p>
                You should carefully evaluate your financial situation, risk tolerance, and objectives before using any
                crypto-related service, and you should seek independent professional advice where appropriate. Qynx does
                not guarantee that you will earn any profit or avoid any loss.
              </p>
            </section>

            <section id="no-advice" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">8. No investment, legal, or tax advice</h2>
              <p>
                All content, analytics, forecasts, and tools made available on or through the Platform are provided for
                informational purposes only and do not constitute investment, financial, legal, or tax advice. Qynx is
                not acting as your advisor, fiduciary, broker, or asset manager.
              </p>
              <p>
                You are solely responsible for any decisions you make based on information obtained from the Platform,
                and you agree that you use such information at your own risk.
              </p>
            </section>

            <section id="third-parties" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">9. Third-party services and links</h2>
              <p>
                The Platform may integrate with, or provide links to, third-party services such as wallet providers,
                exchanges, analytics platforms, or other protocols. These services are not under the control of Qynx,
                and Qynx does not endorse or assume responsibility for them.
              </p>
              <p>
                Your use of any third-party service is solely between you and the applicable third party and is governed
                by such third party&apos;s own terms and policies. Qynx is not liable for any loss or damage arising
                from your use of third-party services.
              </p>
            </section>

            <section id="intellectual-property" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">10. Intellectual property</h2>
              <p>
                The Platform and all related content, design, text, graphics, logos, trademarks, and software are owned
                by Qynx or its licensors and are protected by intellectual-property laws. Qynx grants you a limited,
                non-exclusive, non-transferable, revocable license to access and use the Platform for your personal,
                non-commercial use in accordance with these Terms.
              </p>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  Copy, modify, distribute, sell, or lease any part of the Platform or its content without our prior
                  written consent.
                </li>
                <li>
                  Reverse engineer or attempt to extract the source code of any software provided by Qynx, except to the
                  extent permitted by law.
                </li>
              </ul>
            </section>

            <section id="disclaimers" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">11. Disclaimers</h2>
              <p>
                The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis, without warranties
                of any kind, whether express, implied, or statutory. To the maximum extent permitted by law, Qynx
                disclaims all warranties, including but not limited to implied warranties of merchantability, fitness
                for a particular purpose, non-infringement, and any warranties arising out of course of dealing or usage
                of trade.
              </p>
              <p>
                Without limiting the foregoing, Qynx does not warrant that the Platform will be uninterrupted,
                error-free, secure, or free from harmful components, or that any defects will be corrected. Qynx does
                not warrant or make any representations regarding the accuracy, completeness, or usefulness of any
                information on the Platform.
              </p>
            </section>

            <section id="limitation-liability" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">12. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, in no event shall Qynx, its affiliates, or their respective
                directors, officers, employees, or agents be liable for any indirect, incidental, special,
                consequential, exemplary, or punitive damages, or for any loss of profits, data, or other intangible
                losses, arising out of or related to your use of or inability to use the Platform.
              </p>
              <p>
                To the maximum extent permitted by law, Qynx&apos;s aggregate liability to you for all claims arising
                out of or relating to the Platform or these Terms shall not exceed the greater of (a) the total amount
                of fees, if any, paid by you to Qynx for use of the Platform during the three (3) months immediately
                preceding the event giving rise to the claim, or (b) one hundred U.S. dollars (USD 100).
              </p>
            </section>

            <section id="indemnity" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">13. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Qynx, its affiliates, and their respective directors,
                officers, employees, and agents from and against any and all claims, liabilities, damages, losses, and
                expenses (including reasonable legal fees) arising out of or in connection with:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Your access to or use of the Platform.</li>
                <li>Your violation of these Terms or of any applicable law or regulation.</li>
                <li>Your violation of any rights of any third party.</li>
              </ul>
            </section>

            <section id="modifications" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                14. Changes to the Platform and to these Terms
              </h2>
              <p>
                We may update or modify the Platform at any time, including by adding or removing features, and we may
                modify these Terms from time to time. When we make changes to these Terms, we will update the &quot;Last
                updated&quot; date at the top of this page and, where required by law, provide additional notice.
              </p>
              <p>
                Your continued use of the Platform after any changes to these Terms have become effective constitutes
                your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the
                Platform.
              </p>
            </section>

            <section id="termination" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">15. Suspension and termination</h2>
              <p>
                We may suspend or terminate your access to the Platform at any time, with or without notice, if we
                reasonably believe that you have violated these Terms, engaged in fraudulent or illegal activity, or
                created risk or possible legal exposure for Qynx or other users.
              </p>
              <p>
                Upon termination, your right to access and use the Platform will immediately cease. Certain provisions
                of these Terms will survive termination, including but not limited to those related to intellectual
                property, disclaimers, limitation of liability, and indemnification.
              </p>
            </section>

            <section id="misc" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">16. Governing law and disputes</h2>
              <p>
                These Terms and any dispute arising out of or in connection with them or with the Platform will be
                governed by and construed in accordance with the laws applicable in the jurisdiction in which Qynx is
                organized, without regard to conflict-of-law principles.
              </p>
              <p>
                You and Qynx agree to submit to the exclusive jurisdiction of the courts located in that jurisdiction
                for the resolution of any dispute arising out of or relating to these Terms or the Platform, except
                where applicable law provides you with a different mandatory right.
              </p>
            </section>

            <section id="contact" className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">17. Contact</h2>
              <p>
                If you have any questions about these Terms or about the Platform, you can contact us using the support
                channels specified in the Qynx interface or on our official website.
              </p>
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
