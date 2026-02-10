import SharedRecordClient from "./SharedRecordClient";

export function generateStaticParams() {
  return [{ shareId: "_" }];
}

export default function SharedRecordPage() {
  return <SharedRecordClient />;
}
