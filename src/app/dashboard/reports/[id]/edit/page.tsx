import EditReportClient from './EditReportClient';
import { testReports } from '@/lib/data';

// Provide a small set of static params for export builds. If you have
// real report IDs, replace the array below or generate dynamically.
export async function generateStaticParams() {
  // Return at least one placeholder id for static export builds. Replace
  // with your real report IDs if available.
  if (testReports.length > 0) return testReports.map((r) => ({ id: r.id }));
  return [
    { id: 'REI-BNU-2025-0012' },
  ];
}

export default function EditPageServer({ params }: { params: { id: string } }) {
  const { id } = params;
  // The actual editing UI runs on the client and requires Firestore.
  return <EditReportClient reportId={id} />;
}
