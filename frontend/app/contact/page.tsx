import InfoPage from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Contact",
  "Contact availability and the information to include when reporting a TrendsDuniya correction.",
  "/contact",
);
export default function Page() {
  return (
    <InfoPage title="Contact">
      <section>
        <h2>Help us get the context right</h2>
        <p>
          For a correction, prepare the topic URL, a description of the issue
          and a reliable source supporting the change.
        </p>
        <div className="notice">
          <strong>Contact channel not configured yet.</strong>
          <p>
            The site owner has not supplied a public email address or submission
            endpoint. This page cannot receive messages at this time.
          </p>
        </div>
      </section>
      <section>
        <h2>What to include in a correction</h2>
        <ul>
          <li>The title and URL of the topic.</li>
          <li>The statement or metric that needs review.</li>
          <li>A dated source and a short explanation of the correction.</li>
        </ul>
        <p>
          A working contact channel should be added by the owner before inviting
          public submissions.
        </p>
      </section>
    </InfoPage>
  );
}
