import InfoPage from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Terms of Use",
  "Terms for reading TrendsDuniya snapshots and topic explanations.",
  "/terms",
);
export default function Page() {
  return (
    <InfoPage title="Terms of Use">
      <section>
        <h2>Informational content</h2>
        <p>
          TrendsDuniya provides manually maintained topic summaries and supplied
          snapshot data for general information. Trend interest can change, and
          the examples may not represent current activity.
        </p>
      </section>
      <section>
        <h2>Check before relying on a topic</h2>
        <p>
          A search phrase is not evidence that an event occurred. Verify
          time-sensitive claims, prices, fixtures and other decisions with
          relevant primary sources. Missing figures are not estimated.
        </p>
      </section>
      <section>
        <h2>Responsible use</h2>
        <p>
          Do not misrepresent this website as an official Google or X service.
          Linked websites operate independently. Source names and third-party
          marks belong to their respective owners.
        </p>
      </section>
      <section>
        <h2>Corrections and changes</h2>
        <p>
          Content may be revised to correct errors or add context. The Contact
          page describes the current availability of a correction channel. These
          starter terms should be reviewed by the owner for the actual service
          before public launch.
        </p>
      </section>
    </InfoPage>
  );
}
