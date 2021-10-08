import { PromotionQueueResource } from 'kolibri.resources';
import store from 'kolibri.coreVue.vuex.store';

export default function updatePromotionQueueObjects(promotionUpdate) {
  return new Promise((resolve, reject) => {
    PromotionQueueResource.saveModel({ data: promotionUpdate, exists: true }).then(
      promotionUpdate => {
        if (promotionUpdate.promotion_status == 'APPROVED') {
          const to_classroom_id = promotionUpdate.promoted_to_classroom_id;
          const from_classroom_id = promotionUpdate.promoted_from_classroom_id;
          store.commit('classManagement/UPDATE_CLASS_LEARNER_COUNT', {
            to_classroom: to_classroom_id,
            from_classroom: from_classroom_id,
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
