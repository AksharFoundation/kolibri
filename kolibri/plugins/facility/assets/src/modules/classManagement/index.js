import { displayModal, SET_BUSY, SET_ERROR, SET_MODAL } from '../shared';
import { createClass } from './actions';

function defaultState() {
  return {
    classes: [],
    error: '',
    isBusy: false,
    modalShown: false,
  };
}

export default {
  namespaced: true,
  state: defaultState(),
  mutations: {
    SET_STATE(state, payload) {
      Object.assign(state, payload);
    },
    RESET_STATE(state) {
      Object.assign(state, defaultState());
    },
    SET_BUSY,
    SET_ERROR,
    SET_MODAL,
    ADD_CLASS(state, classroom) {
      state.classes.push(classroom);
    },
    UPDATE_CLASS_LEARNER_COUNT(state, { to_classroom, from_classroom }) {
      state.classes
        .filter(classModel => classModel.id === from_classroom)
        .forEach(classModel => {
          classModel.learner_count = classModel.learner_count - 1;
        });

      state.classes
        .filter(classModel => classModel.id === to_classroom)
        .forEach(classModel => {
          classModel.learner_count = classModel.learner_count + 1;
        });
    },
    DELETE_CLASS(state, id) {
      state.classes = state.classes.filter(classModel => classModel.id !== id);
    },
  },
  actions: {
    createClass,
    displayModal,
  },
};
