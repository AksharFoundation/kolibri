import { LearnerClassroomResource } from '../../apiResources';
import { ClassesPageNames } from '../../constants';

// Shows a list of all the Classrooms a Learner is enrolled in
export function showAllClassesPage(store) {
  return store.dispatch('loading').then(() => {
    return LearnerClassroomResource.fetchCollection()
      .then(classrooms => {
        store.commit('SET_PAGE_NAME', ClassesPageNames.ALL_CLASSES);
        store.commit('classes/SET_LEARNER_CLASSROOMS', classrooms);
        store.commit('classes/SET_LEARNER_NOTIFICATIONS', getNotifications(classrooms));
        store.dispatch('notLoading');
      })
      .catch(error => {
        if (error instanceof Error) {
          return store.dispatch('handleApiError', error);
        }

        // Allows triggering of AuthMessage.vue
        return store.dispatch('handleError', error);
      });
  });
}

export function showAllNotifications(store) {
  return store.dispatch('loading').then(() => {
    return LearnerClassroomResource.fetchCollection()
      .then(classrooms => {
        store.commit('SET_PAGE_NAME', ClassesPageNames.ALL_NOTIFICATIONS);
        store.commit('classes/SET_LEARNER_NOTIFICATIONS', getNotifications(classrooms));
        store.dispatch('notLoading');
      })
      .catch(error => {
        if (error instanceof Error) {
          return store.dispatch('handleApiError', error);
        }

        // Allows triggering of AuthMessage.vue
        return store.dispatch('handleError', error);
      });
  });
}

function getNotifications(classrooms) {
  let notifications = [];
  let promotions = getPromotionsForNotifition(classrooms);
  notifications.push(...promotions);
  return notifications;
}

function getPromotionsForNotifition(classrooms) {
  if (classrooms === undefined) {
    return;
  }
  let promotions = [];
  classrooms.forEach(classroom => {
    if (classroom['assignments'] != undefined) {
      let assignment = classroom['assignments'];
      if (assignment['promotions'] != undefined) {
        assignment['promotions'].forEach(promotion => {
          promotion['notificationType'] = 'promotion';
          promotions.push(promotion);
        });
      }
    }
  });
  return promotions;
}

// Shows a list of all the Learners in a given class and their sync statuses
export function showAllLearnersInClass(store) {
  return store.dispatch('loading').then(() => {
    return LearnerClassroomResource.fetchCollection()
      .then(() => {
        store.commit('SET_PAGE_NAME', ClassesPageNames.LEARNER_SYNC_STATUS_VIEWER);
        store.dispatch('notLoading');
      })
      .catch(error => {
        if (error instanceof Error) {
          return store.dispatch('handleApiError', error);
        }

        // Allows triggering of AuthMessage.vue
        return store.dispatch('handleError', error);
      });
  });
}
