import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCreateDeal } from '../../lib/queries';
import { guessDocType, type AutoFillResult } from '../../lib/autofill';
import { useUi } from '../../context/UiContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../shared/Overlay';
import { AiNotice } from '../autofill/AiNotice';
import { DealForm } from './DealForm';

export function attachSourceFile(file: File, dealId: string) {
  const form = new FormData();
  form.append('dealId', dealId);
  form.append('docType', guessDocType(file.name));
  form.append('file', file);
  return api.post('/documents', form);
}

export function NewDealModal({ draft, onClose }: { draft?: AutoFillResult; onClose: () => void }) {
  const create = useCreateDeal();
  const qc = useQueryClient();
  const { openDeal } = useUi();
  const toast = useToast();
  return (
    <Modal title={draft ? 'Review auto-filled deal' : 'New Deal'} onClose={onClose} width="lg">
      <DealForm
        prefill={draft?.prefill}
        notice={draft && <AiNotice result={draft} mode="new" />}
        submitLabel="Create deal"
        busy={create.isPending}
        onCancel={onClose}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (deal) => {
              toast(`${deal.companyName} added to the pipeline`);
              const file = draft?.file;
              if (file) {
                attachSourceFile(file, deal.id)
                  .then(() => Promise.all([qc.invalidateQueries({ queryKey: ['documents'] }), qc.invalidateQueries({ queryKey: ['activity'] })]))
                  .catch((e: Error) => toast(`Deal saved, but attaching ${file.name} failed: ${e.message}`, 'error'));
              }
              onClose();
              openDeal(deal.id);
            },
            onError: (err) => toast(err.message, 'error'),
          })
        }
      />
    </Modal>
  );
}
