import RecordDetailClient from "./RecordDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function RecordDetailPage() {
  return <RecordDetailClient />;
}
