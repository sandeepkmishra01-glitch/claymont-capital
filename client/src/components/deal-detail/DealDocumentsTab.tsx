import { useDocuments } from '../../lib/queries';
import { EmptyState, LoadingBlock } from '../shared/Overlay';
import { DocumentTable, DocumentUpload } from '../documents/DocumentParts';

export function DealDocumentsTab({ dealId }: { dealId: string }) {
  const docs = useDocuments(dealId);
  return (
    <div className="space-y-6">
      <DocumentUpload dealId={dealId} />
      <div className="-mx-4 border-t border-line sm:-mx-8">
        {docs.isLoading ? <LoadingBlock /> : docs.data?.length ? <DocumentTable docs={docs.data} showDeal={false} /> : (
          <EmptyState title="No documents on this deal yet" />
        )}
      </div>
    </div>
  );
}
