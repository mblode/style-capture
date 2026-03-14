import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbSchema, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Terms of Service",
  description:
    "Style Capture terms of service — read our terms and conditions for using the extension.",
  path: "/terms",
});

export default function TermsPage(): React.JSX.Element {
  return (
    <article className="prose mx-auto max-w-3xl px-4 py-6 md:py-10">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ])}
      />

      <h1 className="h1">Terms of service</h1>
      <p>
        <strong>Last updated March 14, 2026</strong>
      </p>

      <h2>AGREEMENT TO OUR LEGAL TERMS</h2>
      <p>
        We are MATTHEW & RONI BLODE PTY LTD (&apos;Company&apos;,
        &apos;we&apos;, &apos;us&apos;, or &apos;our&apos;), a company
        registered in Australia at 22-24 Horne St, Elsternwick, Victoria 3185.
      </p>

      <p>
        We operate the website{" "}
        <a href="https://style-capture.blode.co" rel="noopener" target="_blank">
          style-capture.blode.co
        </a>{" "}
        (the &apos;Site&apos;), the Style Capture Chrome extension (the
        &apos;Extension&apos;), as well as any other related products and
        services that refer or link to these legal terms (the &apos;Legal
        Terms&apos;) (collectively, the &apos;Services&apos;).
      </p>

      <p>
        You can contact us by email at{" "}
        <a href="mailto:m@blode.co">m@blode.co</a>, or by mail to 22-24 Horne
        St, Elsternwick, Victoria 3185, Australia.
      </p>

      <p>
        These Legal Terms constitute a legally binding agreement made between
        you, whether personally or on behalf of an entity (&apos;you&apos;), and
        MATTHEW & RONI BLODE PTY LTD, concerning your access to and use of the
        Services. You agree that by accessing the Services, you have read,
        understood, and agreed to be bound by all of these Legal Terms. IF YOU
        DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY
        PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE
        IMMEDIATELY.
      </p>

      <p>
        Supplemental terms and conditions or documents that may be posted on the
        Services from time to time are hereby expressly incorporated herein by
        reference. We reserve the right, in our sole discretion, to make changes
        or modifications to these Legal Terms at any time and for any reason. We
        will alert you about any changes by updating the &apos;Last
        updated&apos; date of these Legal Terms, and you waive any right to
        receive specific notice of each such change. It is your responsibility
        to periodically review these Legal Terms to stay informed of updates.
        You will be subject to, and will be deemed to have been made aware of
        and to have accepted, the changes in any revised Legal Terms by your
        continued use of the Services after the date such revised Legal Terms
        are posted.
      </p>

      <h2>TABLE OF CONTENTS</h2>
      <ol>
        <li>OUR SERVICES</li>
        <li>INTELLECTUAL PROPERTY RIGHTS</li>
        <li>USER REPRESENTATIONS</li>
        <li>PROHIBITED ACTIVITIES</li>
        <li>USER GENERATED CONTRIBUTIONS</li>
        <li>CONTRIBUTION LICENCE</li>
        <li>SERVICES MANAGEMENT</li>
        <li>PRIVACY POLICY</li>
        <li>TERM AND TERMINATION</li>
        <li>MODIFICATIONS AND INTERRUPTIONS</li>
        <li>GOVERNING LAW</li>
        <li>DISPUTE RESOLUTION</li>
        <li>CORRECTIONS</li>
        <li>DISCLAIMER</li>
        <li>LIMITATIONS OF LIABILITY</li>
        <li>INDEMNIFICATION</li>
        <li>USER DATA</li>
        <li>ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</li>
        <li>CALIFORNIA USERS AND RESIDENTS</li>
        <li>MISCELLANEOUS</li>
        <li>CONTACT US</li>
      </ol>

      <h2>1. OUR SERVICES</h2>
      <p>
        The information provided when using the Services is not intended for
        distribution to or use by any person or entity in any jurisdiction or
        country where such distribution or use would be contrary to law or
        regulation or which would subject us to any registration requirement
        within such jurisdiction or country. Accordingly, those persons who
        choose to access the Services from other locations do so on their own
        initiative and are solely responsible for compliance with local laws, if
        and to the extent local laws are applicable.
      </p>

      <h2>2. INTELLECTUAL PROPERTY RIGHTS</h2>
      <h3>Our intellectual property</h3>
      <p>
        We are the owner or the licensee of all intellectual property rights in
        our Services, including all source code, databases, functionality,
        software, website designs, audio, video, text, photographs, and graphics
        in the Services (collectively, the &apos;Content&apos;), as well as the
        trademarks, service marks, and logos contained therein (the
        &apos;Marks&apos;).
      </p>

      <p>
        Our Content and Marks are protected by copyright and trademark laws (and
        various other intellectual property rights and unfair competition laws)
        and treaties in the United States and around the world.
      </p>

      <p>
        The Content and Marks are provided in or through the Services &apos;AS
        IS&apos; for your personal, non-commercial use only.
      </p>

      <h3>Your use of our Services</h3>
      <p>
        Subject to your compliance with these Legal Terms, including the
        &apos;PROHIBITED ACTIVITIES&apos; section below, we grant you a
        non-exclusive, non-transferable, revocable licence to access the
        Services and download or print a copy of any portion of the Content to
        which you have properly gained access solely for your personal,
        non-commercial use.
      </p>

      <h2>3. USER REPRESENTATIONS</h2>
      <p>By using the Services, you represent and warrant that:</p>
      <ol>
        <li>
          you have the legal capacity and you agree to comply with these Legal
          Terms;
        </li>
        <li>you are not a minor in the jurisdiction in which you reside;</li>
        <li>
          you will not access the Services through automated or non-human means,
          whether through a bot, script or otherwise;
        </li>
        <li>
          you will not use the Services for any illegal or unauthorised purpose;
          and
        </li>
        <li>
          your use of the Services will not violate any applicable law or
          regulation.
        </li>
      </ol>

      <h2>4. PROHIBITED ACTIVITIES</h2>
      <p>
        You may not access or use the Services for any purpose other than that
        for which we make the Services available. The Services may not be used
        in connection with any commercial endeavours except those that are
        specifically endorsed or approved by us.
      </p>

      <h2>5. USER GENERATED CONTRIBUTIONS</h2>
      <p>
        The Services may invite you to chat, contribute to, or participate in
        blogs, message boards, online forums, and other functionality, and may
        provide you with the opportunity to create, submit, post, display,
        transmit, perform, publish, distribute, or broadcast content and
        materials to us or on the Services.
      </p>

      <h2>6. CONTRIBUTION LICENCE</h2>
      <p>
        By posting your Contributions to any part of the Services, you
        automatically grant, and you represent and warrant that you have the
        right to grant, to us an unrestricted, unlimited, irrevocable,
        perpetual, non-exclusive, transferable, royalty-free, fully-paid,
        worldwide right, and licence to host, use, copy, reproduce, disclose,
        sell, resell, publish, broadcast, retitle, archive, store, cache,
        publicly perform, publicly display, reformat, translate, transmit,
        excerpt (in whole or in part), and distribute such Contributions for any
        purpose, commercial, advertising, or otherwise.
      </p>

      <h2>7. SERVICES MANAGEMENT</h2>
      <p>
        We reserve the right, but not the obligation, to: (1) monitor the
        Services for violations of these Legal Terms; (2) take appropriate legal
        action against anyone who, in our sole discretion, violates the law or
        these Legal Terms; (3) refuse, restrict access to, limit the
        availability of, or disable (to the extent technologically feasible) any
        of your Contributions or any portion thereof.
      </p>

      <h2>8. PRIVACY POLICY</h2>
      <p>
        We care about data privacy and security. Please review our Privacy
        Policy at{" "}
        <a href="/privacy" rel="noopener">
          style-capture.blode.co/privacy
        </a>
        . By using the Services, you agree to be bound by our Privacy Policy,
        which is incorporated into these Legal Terms.
      </p>

      <h2>9. TERM AND TERMINATION</h2>
      <p>
        These Legal Terms shall remain in full force and effect while you use
        the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS,
        WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR
        LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES TO ANY PERSON FOR ANY
        REASON OR FOR NO REASON.
      </p>

      <h2>10. MODIFICATIONS AND INTERRUPTIONS</h2>
      <p>
        We reserve the right to change, modify, or remove the contents of the
        Services at any time or for any reason at our sole discretion without
        notice. However, we have no obligation to update any information on our
        Services. We will not be liable to you or any third party for any
        modification, price change, suspension, or discontinuance of the
        Services.
      </p>

      <h2>11. GOVERNING LAW</h2>
      <p>
        These Legal Terms shall be governed by and defined following the laws of
        Australia. MATTHEW & RONI BLODE PTY LTD and yourself irrevocably consent
        that the courts of Australia shall have exclusive jurisdiction to
        resolve any dispute which may arise in connection with these Legal
        Terms.
      </p>

      <h2>12. DISPUTE RESOLUTION</h2>
      <p>
        You agree to irrevocably submit all disputes related to these Legal
        Terms or the legal relationship established by these Legal Terms to the
        jurisdiction of the Australia courts. MATTHEW & RONI BLODE PTY LTD shall
        also maintain the right to bring proceedings as to the substance of the
        matter in the courts of the country where you reside or, if these Legal
        Terms are entered into in the course of your trade or profession, the
        state of your principal place of business.
      </p>

      <h2>13. CORRECTIONS</h2>
      <p>
        There may be information on the Services that contains typographical
        errors, inaccuracies, or omissions, including descriptions, pricing,
        availability, and various other information. We reserve the right to
        correct any errors, inaccuracies, or omissions and to change or update
        the information on the Services at any time, without prior notice.
      </p>

      <h2>14. DISCLAIMER</h2>
      <p>
        THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE
        THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST
        EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED,
        IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF.
      </p>

      <h2>15. LIMITATIONS OF LIABILITY</h2>
      <p>
        IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO
        YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
        EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST
        PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR
        USE OF THE SERVICES.
      </p>

      <h2>16. INDEMNIFICATION</h2>
      <p>
        You agree to defend, indemnify, and hold us harmless, including our
        subsidiaries, affiliates, and all of our respective officers, agents,
        partners, and employees, from and against any loss, damage, liability,
        claim, or demand, including reasonable attorneys&apos; fees and
        expenses, made by any third party due to or arising out of your use of
        the Services.
      </p>

      <h2>17. USER DATA</h2>
      <p>
        We will maintain certain data that you transmit to the Services for the
        purpose of managing the performance of the Services, as well as data
        relating to your use of the Services. Although we perform regular
        routine backups of data, you are solely responsible for all data that
        you transmit or that relates to any activity you have undertaken using
        the Services.
      </p>

      <h2>18. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2>
      <p>
        Visiting the Services, sending us emails, and completing online forms
        constitute electronic communications. You consent to receive electronic
        communications, and you agree that all agreements, notices, disclosures,
        and other communications we provide to you electronically, via email and
        on the Services, satisfy any legal requirement that such communication
        be in writing.
      </p>

      <h2>19. CALIFORNIA USERS AND RESIDENTS</h2>
      <p>
        If any complaint with us is not satisfactorily resolved, you can contact
        the Complaint Assistance Unit of the Division of Consumer Services of
        the California Department of Consumer Affairs in writing at 1625 North
        Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone
        at (800) 952-5210 or (916) 445-1254.
      </p>

      <h2>20. MISCELLANEOUS</h2>
      <p>
        These Legal Terms and any policies or operating rules posted by us on
        the Services or in respect to the Services constitute the entire
        agreement and understanding between you and us. Our failure to exercise
        or enforce any right or provision of these Legal Terms shall not operate
        as a waiver of such right or provision.
      </p>

      <h2>21. CONTACT US</h2>
      <p>
        In order to resolve a complaint regarding the Services or to receive
        further information regarding use of the Services, please contact us at:
      </p>

      <p>
        <strong>MATTHEW & RONI BLODE PTY LTD</strong>
        <br />
        22-24 Horne St
        <br />
        Elsternwick, Victoria 3185
        <br />
        Australia
        <br />
        <a href="mailto:m@blode.co">m@blode.co</a>
      </p>
    </article>
  );
}
