import { useCreateDeal } from '../../lib/queries';
import { useUi } from '../../context/UiContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../shared/Overlay';
import { DealForm } from './DealForm';

export function NewDealModal({ onClose }: { onClose: () => void }) {
  const create = useCreateDeal();
  const { openDeal } = useUi();
  const toast = useToast();
  return (
    <Modal title="New Deal" onClose={onClose} width="lg">
      <DealForm
        submitLabel="Create deal"
        busy={create.isPending}
        onCancel={onClose}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (deal) => {
              toast(`${deal.companyName} added to the pipeline`);
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
