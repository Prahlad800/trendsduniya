import StoryListing from "../../components/story-listing";
export const metadata={title:"Latest News",description:"The latest published headlines from TrendsDuniya.",alternates:{canonical:"/latest"}};
export default async function Latest({searchParams}){return <StoryListing endpoint="/articles" title="Latest News" eyebrow="FRESH FROM THE NEWSROOM" description="The stories you need to know, as they happen." searchParams={await searchParams}/>;}
