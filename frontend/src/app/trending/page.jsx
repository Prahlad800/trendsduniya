import StoryListing from "../../components/story-listing";
export const metadata={title:"Trending News",description:"Discover the most-read published stories on TrendsDuniya.",alternates:{canonical:"/trending"}};
export default async function Trending({searchParams}) {
 return <StoryListing endpoint="/articles?sort=-analytics.views" title="Trending News" eyebrow="WHAT'S MAKING HEADLINES" description="The most-read stories across TrendsDuniya, ranked by article views." searchParams={await searchParams} basePath="/trending" sortLabel="Most read first"/>;
}
