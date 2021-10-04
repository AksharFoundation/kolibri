import { PromotionQueueResource } from 'kolibri.resources';
import store from 'kolibri.coreVue.vuex.store';

export default function updatePromotionQueueObjects(promotionUpdate) {
  return new Promise((resolve, reject) => {
    PromotionQueueResource.saveModel({ data: promotionUpdate, exists: true }).then(
      promotionUpdate => {
        if (promotionUpdate.promotion_status == 'APPROVED' || true) {
          store.commit('classManagement/UPDATE_CLASS_LEARNER_COUNT', {
            classroom: promotionUpdate.classroom_id,
          });
        }
      },
      error => {
        store.dispatch('handleApiError', error, { root: true });
      }
    );
  }).then(() => {
    console.log('Successfully updated');
  });
}
