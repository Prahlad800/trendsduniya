import InfoPage from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "About TrendsDuniya",
  "Learn how TrendsDuniya organizes manually collected topics and explains its editorial standards.",
  "/about",
);
export default function Page() {
  return (
    <InfoPage title="About TrendsDuniya">
      <section>
        <h2>Curiosity, with context</h2>
        <p>
          TrendsDuniya is an independent discovery website for trending searches
          and conversation topics. It organizes manually added Google and X
          snapshots into readable topic pages.
        </p>
      </section>
      <section>
        <h2>How we handle information</h2>
        <p>
          The initial collection contains examples supplied by the project
          owner. Metrics appear only when supplied, and a topic’s presence does
          not establish a verified news event. Editorial dates describe
          publication on this website, not an unknown source capture time.
        </p>
        <p>
          New topics can be added daily. This is a manual publishing workflow,
          not a live feed or a promise that an update occurs every day.
        </p>
      </section>
      <section>
        <h2>Editorial review</h2>
        <p>
          Pages with incomplete or unverified context are kept out of search
          indexing. Before enabling indexing, an editor should check the source,
          resolve ambiguity and add useful original content. Corrections should
          preserve clarity about what changed and when.
        </p>
      </section>
      <section>
        <h2>Independent by design</h2>
        <p>
          TrendsDuniya is not affiliated with Google or X. Source names are
          descriptive; no partnership is implied.
        </p>
      </section>
    </InfoPage>
  );
}
