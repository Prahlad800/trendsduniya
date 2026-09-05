import Breadcrumbs from "./Breadcrumbs";
export default function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-space">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <article className="info-page">
        <p className="eyebrow">TRENDSDUNIYA</p>
        <h1>{title}</h1>
        <div className="article-body">{children}</div>
      </article>
    </div>
  );
}
