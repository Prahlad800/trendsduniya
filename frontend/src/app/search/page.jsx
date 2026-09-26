import StoryListing from "../../components/story-listing";
export const metadata={title:"Search News",robots:{index:false,follow:true}};
export default async function Search({searchParams}){const query=await searchParams;return <StoryListing endpoint="/articles/search" title={query.q?`Results for “${String(query.q).slice(0,100)}”`:"Search the newsroom"} eyebrow="FIND YOUR NEXT STORY" description="Search news, topics, and keywords across our published stories." searchParams={query} basePath="/search"/>;}
