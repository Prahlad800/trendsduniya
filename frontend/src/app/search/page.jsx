import StoryListing from "../../components/story-listing";
export const metadata={title:"Search stories",robots:{index:false,follow:true}};
export default async function Search({searchParams}){const query=await searchParams;return <StoryListing endpoint="/articles/search" title={query.q?`Results for “${String(query.q).slice(0,100)}”`:"What are you curious about?"} eyebrow="FIND A FRESH PERSPECTIVE" description="Search across our published stories." searchParams={query} basePath="/search"/>;}

