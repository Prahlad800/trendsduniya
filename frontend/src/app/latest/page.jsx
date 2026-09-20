import StoryListing from "../../components/story-listing";
export const metadata={title:"Latest stories"};
export default async function Latest({searchParams}){return <StoryListing endpoint="/articles" title="The latest perspectives." description="Fresh from the editorial desk. Made for curious minds." searchParams={await searchParams}/>;}

