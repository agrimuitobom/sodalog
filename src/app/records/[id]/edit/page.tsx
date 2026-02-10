import EditRecordClient from "./EditRecordClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditRecordPage() {
  return <EditRecordClient />;
}
