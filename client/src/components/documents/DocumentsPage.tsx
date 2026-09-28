import { useDocuments } from '../../lib/queries';
import { EmptyState, LoadingBlock, Panel } from '../shared/Overlay';
import { DocumentTable, DocumentUpload } from './DocumentParts';

export function DocumentsPage() {
  const docs = useDocuments();
  const count = docs.data?.length ?? 0;
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="card p-5 sm:p-6">
        <DocumentUpload />
      </div>
      <Panel title="Document Library" subtitle={`${count} file${count === 1 ? '' : 's'} across all deals`}>
        {docs.isLoading ? <LoadingBlock /> : count ? <DocumentTable docs={docs.data!} /> : (
          <EmptyState title="No documents yet" body="Upload a teaser, CIM, or LOI above to start the library." />
        )}
      </Panel>
    </div>
  );
}
