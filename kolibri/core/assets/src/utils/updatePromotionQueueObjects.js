import { PromotionQueueResource } from 'kolibri.resources';
import { reject, resolve } from 'q';

export default function updatePromotionQueueObjects(promotionUpdates) {
  return new Promise((resolve, reject) => {
    console.log(promotionUpdates);
    PromotionQueueResource.saveModel({ data: promotionUpdates, exists: true });
  }).then(() => {
    console.log('Successfully updated');
  });
}
