import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbSchema, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Privacy Policy",
  description:
    "Style Capture privacy policy — learn how we collect, use, and protect your data.",
  path: "/privacy",
});

export default function PrivacyPage(): React.JSX.Element {
  return (
    <article className="prose mx-auto max-w-3xl px-4 py-6 md:py-10">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />

      <div>
        <h1 className="h1">Privacy policy</h1>
        <p>Last updated March 14, 2026</p>

        <p>
          This Privacy Notice for MATTHEW & RONI BLODE PTY LTD (&apos;we&apos;,
          &apos;us&apos;, or &apos;our&apos;), describes how and why we might
          access, collect, store, use, and/or share (&apos;process&apos;) your
          personal information when you use our services (&apos;Services&apos;),
          including when you:
        </p>

        <ul>
          <li>
            Visit our website at{" "}
            <a
              href="https://style-capture.blode.co"
              rel="noopener"
              target="_blank"
            >
              https://style-capture.blode.co
            </a>{" "}
            or any website of ours that links to this Privacy Notice
          </li>
          <li>
            Use our Chrome extension, Style Capture, which processes data
            locally on your device
          </li>
          <li>
            Engage with us in other related ways, including any sales,
            marketing, or events
          </li>
        </ul>

        <p>
          <strong>Important note about the Chrome extension:</strong> The Style
          Capture Chrome extension processes all data locally on your device. No
          page data, captured CSS, or DOM content is sent off-device or to any
          remote server.
        </p>

        <p>
          <strong>Questions or concerns?</strong> Reading this Privacy Notice
          will help you understand your privacy rights and choices. We are
          responsible for making decisions about how your personal information
          is processed. If you do not agree with our policies and practices,
          please do not use our Services. If you still have any questions or
          concerns, please contact us at{" "}
          <a href="mailto:m@blode.co" rel="noopener" target="_blank">
            m@blode.co
          </a>
          .
        </p>

        <h2>SUMMARY OF KEY POINTS</h2>

        <p>
          <strong>
            <em>
              This summary provides key points from our Privacy Notice, but you
              can find out more details about any of these topics by clicking
              the link following each key point or by using our{" "}
              <a href="#toc">table of contents</a> below to find the section you
              are looking for.
            </em>
          </strong>
        </p>

        <p>
          <strong>What personal information do we process?</strong> When you
          visit, use, or navigate our Services, we may process personal
          information depending on how you interact with us and the Services,
          the choices you make, and the products and features you use. Learn
          more about{" "}
          <a href="#personalinfo">personal information you disclose to us</a>.
        </p>

        <p>
          <strong>Do we process any sensitive personal information?</strong>{" "}
          Some of the information may be considered &apos;special&apos; or
          &apos;sensitive&apos; in certain jurisdictions, for example your
          racial or ethnic origins, sexual orientation, and religious beliefs.
          We do not process sensitive personal information.
        </p>

        <p>
          <strong>Do we collect any information from third parties?</strong> We
          do not collect any information from third parties.
        </p>

        <p>
          <strong>How do we process your information?</strong> We process your
          information to provide, improve, and administer our Services,
          communicate with you, for security and fraud prevention, and to comply
          with law. We may also process your information for other purposes with
          your consent. We process your information only when we have a valid
          legal reason to do so. Learn more about{" "}
          <a href="#infouse">how we process your information</a>.
        </p>

        <p>
          <strong>
            In what situations and with which parties do we share personal
            information?
          </strong>{" "}
          We may share information in specific situations and with specific
          third parties. Learn more about{" "}
          <a href="#whoshare">
            when and with whom we share your personal information
          </a>
          .
        </p>

        <p>
          <strong>How do we keep your information safe?</strong> We have
          adequate organisational and technical processes and procedures in
          place to protect your personal information. However, no electronic
          transmission over the internet or information storage technology can
          be guaranteed to be 100% secure, so we cannot promise or guarantee
          that hackers, cybercriminals, or other unauthorised third parties will
          not be able to defeat our security and improperly collect, access,
          steal, or modify your information. Learn more about{" "}
          <a href="#infosafe">how we keep your information safe</a>.
        </p>

        <p>
          <strong>What are your rights?</strong> Depending on where you are
          located geographically, the applicable privacy law may mean you have
          certain rights regarding your personal information. Learn more about{" "}
          <a href="#privacyrights">your privacy rights</a>.
        </p>

        <p>
          <strong>How do you exercise your rights?</strong> The easiest way to
          exercise your rights is by contacting us at{" "}
          <a href="mailto:m@blode.co">m@blode.co</a>. We will consider and act
          upon any request in accordance with applicable data protection laws.
        </p>

        <p>
          Want to learn more about what we do with any information we collect?{" "}
          <a href="#toc">Review the Privacy Notice in full</a>.
        </p>

        <h2 id="toc">TABLE OF CONTENTS</h2>

        <div>
          <a href="#infocollect">1. WHAT INFORMATION DO WE COLLECT?</a>
        </div>
        <div>
          <a href="#infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</a>
        </div>
        <div>
          <a href="#legalbases">
            3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
            INFORMATION?
          </a>
        </div>
        <div>
          <a href="#whoshare">
            4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
          </a>
        </div>
        <div>
          <a href="#cookies">
            5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
          </a>
        </div>
        <div>
          <a href="#ai">
            6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
          </a>
        </div>
        <div>
          <a href="#inforetain">7. HOW LONG DO WE KEEP YOUR INFORMATION?</a>
        </div>
        <div>
          <a href="#infosafe">8. HOW DO WE KEEP YOUR INFORMATION SAFE?</a>
        </div>
        <div>
          <a href="#infominors">9. DO WE COLLECT INFORMATION FROM MINORS?</a>
        </div>
        <div>
          <a href="#privacyrights">10. WHAT ARE YOUR PRIVACY RIGHTS?</a>
        </div>
        <div>
          <a href="#DNT">11. CONTROLS FOR DO-NOT-TRACK FEATURES</a>
        </div>
        <div>
          <a href="#uslaws">
            12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
          </a>
        </div>
        <div>
          <a href="#otherlaws">
            13. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
          </a>
        </div>
        <div>
          <a href="#policyupdates">14. DO WE MAKE UPDATES TO THIS NOTICE?</a>
        </div>
        <div>
          <a href="#contact">15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>
        </div>
        <div>
          <a href="#request">
            16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
            YOU?
          </a>
        </div>

        <h2 id="infocollect">1. WHAT INFORMATION DO WE COLLECT?</h2>

        <h3 id="personalinfo">Personal information you disclose to us</h3>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>We collect personal information that you provide to us.</em>
        </p>

        <p>
          We collect personal information that you voluntarily provide to us
          when you express an interest in obtaining information about us or our
          products and Services, when you participate in activities on the
          Services, or otherwise when you contact us.
        </p>

        <p>
          <strong>Personal Information Provided by You.</strong> The personal
          information that we collect depends on the context of your
          interactions with us and the Services, the choices you make, and the
          products and features you use. The personal information we collect may
          include the following:
        </p>

        <ul>
          <li>email addresses</li>
          <li>names</li>
        </ul>

        <p id="sensitiveinfo">
          <strong>Sensitive Information.</strong> We do not process sensitive
          information.
        </p>

        <p>
          All personal information that you provide to us must be true,
          complete, and accurate, and you must notify us of any changes to such
          personal information.
        </p>

        <h3>Information automatically collected</h3>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            Some information — such as your Internet Protocol (IP) address
            and/or browser and device characteristics — is collected
            automatically when you visit our Services.
          </em>
        </p>

        <p>
          We automatically collect certain information when you visit, use, or
          navigate the Services. This information does not reveal your specific
          identity (like your name or contact information) but may include
          device and usage information, such as your IP address, browser and
          device characteristics, operating system, language preferences,
          referring URLs, device name, country, location, information about how
          and when you use our Services, and other technical information. This
          information is primarily needed to maintain the security and operation
          of our Services, and for our internal analytics and reporting
          purposes.
        </p>

        <p>
          Like many businesses, we also collect information through cookies and
          similar technologies.
        </p>

        <p>The information we collect includes:</p>

        <ul>
          <li>
            <em>Log and Usage Data.</em> Log and usage data is service-related,
            diagnostic, usage, and performance information our servers
            automatically collect when you access or use our Services and which
            we record in log files. Depending on how you interact with us, this
            log data may include your IP address, device information, browser
            type, and settings and information about your activity in the
            Services (such as the date/time stamps associated with your usage,
            pages and files viewed, searches, and other actions you take such as
            which features you use), device event information (such as system
            activity, error reports (sometimes called &apos;crash dumps&apos;),
            and hardware settings).
          </li>
          <li>
            <em>Device Data.</em> We collect device data such as information
            about your computer, phone, tablet, or other device you use to
            access the Services. Depending on the device used, this device data
            may include information such as your IP address (or proxy server),
            device and application identification numbers, location, browser
            type, hardware model, Internet service provider and/or mobile
            carrier, operating system, and system configuration information.
          </li>
        </ul>

        <h3>Chrome extension data</h3>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            The Style Capture Chrome extension processes all data locally on
            your device. No captured data is transmitted to any server.
          </em>
        </p>

        <p>
          The Style Capture Chrome extension captures computed CSS styles and
          DOM structure from web pages you choose to inspect. This data is
          processed entirely on your device and is only copied to your clipboard
          at your request. We do not collect, transmit, or store any data
          captured by the extension. The extension uses only the{" "}
          <code>activeTab</code>, <code>scripting</code>, and{" "}
          <code>storage</code> permissions, and does not declare any host
          permissions.
        </p>

        <h2 id="infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We process your information to provide, improve, and administer our
            Services, communicate with you, for security and fraud prevention,
            and to comply with law. We may also process your information for
            other purposes with your consent.
          </em>
        </p>

        <p>
          <strong>
            We process your personal information for a variety of reasons,
            depending on how you interact with our Services, including:
          </strong>
        </p>

        <ul>
          <li>
            <strong>To respond to user inquiries and provide support.</strong>{" "}
            We may process your information to respond to your inquiries and
            provide support for the extension and related services.
          </li>
        </ul>

        <p>
          Contact us at <a href="mailto:m@blode.co">m@blode.co</a> for more
          information.
        </p>

        <h2 id="legalbases">
          3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
          INFORMATION?
        </h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We only process your personal information when we believe it is
            necessary and we have a valid legal reason (i.e. legal basis) to do
            so under applicable law, like with your consent, to comply with
            laws, to provide you with services, to protect your rights, or to
            fulfil our legitimate business interests.
          </em>
        </p>

        <h2 id="whoshare">
          4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
        </h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We may share information in specific situations described in this
            section and/or with the following third parties.
          </em>
        </p>

        <p>
          We may need to share your personal information in the following
          situations:
        </p>

        <ul>
          <li>
            <strong>Business Transfers.</strong> We may share or transfer your
            information in connection with, or during negotiations of, any
            merger, sale of company assets, financing, or acquisition of all or
            a portion of our business to another company.
          </li>
        </ul>

        <h2 id="cookies">
          5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
        </h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We may use cookies and other tracking technologies to collect and
            store your information on our website.
          </em>
        </p>

        <p>
          We may use cookies and similar tracking technologies (like web beacons
          and pixels) to gather information when you interact with our website.
          The Chrome extension does not use cookies or tracking technologies.
        </p>

        <h2 id="ai">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We offer products that use artificial intelligence technologies.
          </em>
        </p>

        <p>
          The Style Capture Chrome extension formats captured CSS data into
          structured prompts designed for use with AI assistants. This
          formatting happens entirely on your device. We do not send any
          captured data to AI services — the formatted prompt is copied to your
          clipboard for you to use as you choose.
        </p>

        <h2 id="inforetain">7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We keep your information for as long as necessary to fulfil the
            purposes outlined in this Privacy Notice unless otherwise required
            by law.
          </em>
        </p>

        <p>
          We will only keep your personal information for as long as it is
          necessary for the purposes set out in this Privacy Notice, unless a
          longer retention period is required or permitted by law (such as tax,
          accounting, or other legal requirements).
        </p>

        <h2 id="infosafe">8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We aim to protect your personal information through a system of
            organisational and technical security measures.
          </em>
        </p>

        <p>
          We have implemented appropriate and reasonable technical and
          organisational security measures designed to protect the security of
          any personal information we process. However, despite our safeguards
          and efforts to secure your information, no electronic transmission
          over the Internet or information storage technology can be guaranteed
          to be 100% secure, so we cannot promise or guarantee that hackers,
          cybercriminals, or other unauthorised third parties will not be able
          to defeat our security and improperly collect, access, steal, or
          modify your information.
        </p>

        <h2 id="infominors">9. DO WE COLLECT INFORMATION FROM MINORS?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            We do not knowingly collect data from or market to children under 18
            years of age.
          </em>
        </p>

        <p>
          We do not knowingly collect, solicit data from, or market to children
          under 18 years of age, nor do we knowingly sell such personal
          information. By using the Services, you represent that you are at
          least 18 or that you are the parent or guardian of such a minor and
          consent to such minor dependent&apos;s use of the Services.
        </p>

        <h2 id="privacyrights">10. WHAT ARE YOUR PRIVACY RIGHTS?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            Depending on your state of residence in the US or in some regions,
            such as the European Economic Area (EEA), United Kingdom (UK),
            Switzerland, and Canada, you have rights that allow you greater
            access to and control over your personal information.
          </em>
        </p>

        <p>
          In some regions (like the EEA, UK, Switzerland, and Canada), you have
          certain rights under applicable data protection laws. These may
          include the right (i) to request access and obtain a copy of your
          personal information, (ii) to request rectification or erasure; (iii)
          to restrict the processing of your personal information; (iv) if
          applicable, to data portability; and (v) not to be subject to
          automated decision-making.
        </p>

        <p>
          If you wish to exercise any of these rights, please contact us at{" "}
          <a href="mailto:m@blode.co">m@blode.co</a>.
        </p>

        <h2 id="DNT">11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>

        <p>
          Most web browsers and some mobile operating systems and mobile
          applications include a Do-Not-Track (&apos;DNT&apos;) feature or
          setting you can activate to signal your privacy preference not to have
          data about your online browsing activities monitored and collected. At
          this stage, no uniform technology standard for recognising and
          implementing DNT signals has been finalised. As such, we do not
          currently respond to DNT browser signals or any other mechanism that
          automatically communicates your choice not to be tracked online.
        </p>

        <h2 id="uslaws">
          12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
        </h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            If you are a resident of certain US states, you may have additional
            rights regarding your personal information.
          </em>
        </p>

        <p>
          If you are a resident of California, Colorado, Connecticut, Delaware,
          Florida, Indiana, Iowa, Kentucky, Montana, Nebraska, New Hampshire,
          New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have
          specific rights regarding your personal information. Please contact us
          at <a href="mailto:m@blode.co">m@blode.co</a> to exercise these
          rights.
        </p>

        <h2 id="otherlaws">
          13. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
        </h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            You may have additional rights based on the country you reside in.
          </em>
        </p>

        <p>
          <strong>Australia</strong>
        </p>

        <p>
          We collect and process your personal information under the obligations
          and conditions set by Australia&apos;s Privacy Act 1988 (Privacy Act).
          If you believe we have breached the Australian Privacy Principles and
          wish to make a complaint, please contact us at{" "}
          <a href="mailto:m@blode.co">m@blode.co</a> and we will promptly
          investigate your complaint.
        </p>

        <h2 id="policyupdates">14. DO WE MAKE UPDATES TO THIS NOTICE?</h2>

        <p>
          <strong>
            <em>In Short:</em>
          </strong>{" "}
          <em>
            Yes, we will update this notice as necessary to stay compliant with
            relevant laws.
          </em>
        </p>

        <p>
          We may update this Privacy Notice from time to time. The updated
          version will be indicated by an updated &apos;Last updated&apos; date
          at the top of this Privacy Notice. If we make material changes to this
          Privacy Notice, we may notify you either by prominently posting a
          notice of such changes or by directly sending you a notification. We
          encourage you to review this Privacy Notice frequently to be informed
          of how we are protecting your information.
        </p>

        <h2 id="contact">15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>

        <p>
          If you have questions or comments about this notice, you may email us
          at <a href="mailto:m@blode.co">m@blode.co</a> or contact us by post
          at:
        </p>

        <p>
          <strong>MATTHEW & RONI BLODE PTY LTD</strong>
          <br />
          22-24 Horne St
          <br />
          Elsternwick, Victoria 3185
          <br />
          Australia
        </p>

        <h2 id="request">
          16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
          YOU?
        </h2>

        <p>
          Based on the applicable laws of your country or state of residence in
          the US, you may have the right to request access to the personal
          information we collect from you, details about how we have processed
          it, correct inaccuracies, or delete your personal information. To make
          such a request, please contact us at{" "}
          <a href="mailto:m@blode.co">m@blode.co</a>.
        </p>
      </div>
    </article>
  );
}
