import InfoPage from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Privacy Policy",
  "How the current TrendsDuniya frontend handles searches, forms and external links.",
  "/privacy-policy",
);
export default function Page() {
  return (
    <InfoPage title="Privacy Policy">
      <section>
        <h2>Current website features</h2>
        <p>
          This frontend has no account registration, database, advertising
          scripts or analytics integration. Its contact page does not collect
          submissions. It does not set application cookies or save search
          history to browser storage.
        </p>
      </section>
      <section>
        <h2>Search and hosting</h2>
        <p>
          Typing in a listing filter updates results in your browser. Submitting
          the header search uses a URL query parameter, which may appear in
          browser history and hosting access logs. Do not enter private
          information into search.
        </p>
        <p>
          The hosting provider may process request information such as IP
          address, browser details and requested URLs. The owner must document
          the actual provider and retention settings when deployment is
          configured.
        </p>
      </section>
      <section>
        <h2>External links</h2>
        <p>
          Source references may take you to independently operated websites.
          Their privacy practices apply when you visit them.
        </p>
      </section>
      <section>
        <h2>Updates and enquiries</h2>
        <p>
          This starter notice describes the features implemented here. Review it
          before adding analytics, advertising, forms or other services. A
          public privacy contact has not yet been configured; see the Contact
          page for availability.
        </p>
      </section>
    </InfoPage>
  );
}
