import ArticleEditor from "../../../../components/article-editor";
export default async function EditArticle({params}){return <ArticleEditor id={(await params).id}/>;}

