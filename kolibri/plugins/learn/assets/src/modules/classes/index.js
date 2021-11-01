export default {
  namespaced: true,
  state: {
    classrooms: [],
    notifications: [],
  },
  mutations: {
    SET_LEARNER_CLASSROOMS(state, classrooms) {
      state.classrooms = [...classrooms];
    },
    SET_LEARNER_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    RESET_STATE(state) {
      state.classrooms = [];
      state.notifications = [];
    },
  },
};
