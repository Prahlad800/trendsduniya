import {permanentRedirect} from "next/navigation";
export default async function LegacyArticle({params}){permanentRedirect("/article/"+encodeURIComponent((await params).slug));}

