import { shallowMount, mount, createLocalVue } from '@vue/test-utils';
import VueRouter from 'vue-router';

import { ClassesPageNames } from '../../../constants';
import HomePage from '../index';
/* eslint-disable import/named */
import useUser, { useUserMock } from '../../../composables/useUser';
import useDeviceSettings, { useDeviceSettingsMock } from '../../../composables/useDeviceSettings';
import useLearnerResources, {
  useLearnerResourcesMock,
} from '../../../composables/useLearnerResources';
/* eslint-enable import/named */

jest.mock('../../../composables/useUser');
jest.mock('../../../composables/useDeviceSettings');
jest.mock('../../../composables/useLearnerResources');

const localVue = createLocalVue();
localVue.use(VueRouter);

function makeWrapper() {
  const router = new VueRouter({
    routes: [
      {
        name: ClassesPageNames.CLASS_ASSIGNMENTS,
        path: '/class',
      },
      {
        name: ClassesPageNames.ALL_CLASSES,
        path: '/classes',
      },
    ],
  });
  router.push('/');

  return mount(HomePage, {
    localVue,
    router,
  });
}

function getClassesSection(wrapper) {
  return wrapper.find('[data-test="classes"]');
}

function getContinueLearningSection(wrapper) {
  return wrapper.find('[data-test="continueLearning"]');
}

describe(`HomePage`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // set back to default values defined in __mocks__
    useUser.mockImplementation(() => useUserMock());
    useDeviceSettings.mockImplementation(() => useDeviceSettingsMock());
    useLearnerResources.mockImplementation(() => useLearnerResourcesMock());
  });

  it(`smoke test`, () => {
    const wrapper = shallowMount(HomePage);
    expect(wrapper.exists()).toBe(true);
  });

  describe(`when loaded`, () => {
    it(`fetches learner's classes and resumable resources when a user is signed in`, () => {
      const fetchClasses = jest.fn();
      const fetchResumableContentNodes = jest.fn();
      useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
      useLearnerResources.mockImplementation(() =>
        useLearnerResourcesMock({ fetchClasses, fetchResumableContentNodes })
      );
      makeWrapper();
      expect(fetchClasses).toHaveBeenCalledTimes(1);
      expect(fetchResumableContentNodes).toHaveBeenCalledTimes(1);
    });

    it(`doesn't fetch learner's classes and resumable resources when a user is signed out`, () => {
      const fetchClasses = jest.fn();
      const fetchResumableContentNodes = jest.fn();
      useLearnerResources.mockImplementation(() =>
        useLearnerResourcesMock({ fetchClasses, fetchResumableContentNodes })
      );
      makeWrapper();
      expect(fetchClasses).not.toHaveBeenCalled();
      expect(fetchResumableContentNodes).not.toHaveBeenCalled();
    });
  });

  describe(`"Your classes" section`, () => {
    it(`the section is not displayed for a guest user`, () => {
      const wrapper = makeWrapper();
      expect(getClassesSection(wrapper).exists()).toBe(false);
    });

    it(`the section is displayed for a signed in user`, () => {
      useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
      const wrapper = makeWrapper();
      expect(getClassesSection(wrapper).exists()).toBe(true);
    });

    it(`classes are displayed for a signed in user who is enrolled in some classes`, () => {
      useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
      useLearnerResources.mockImplementation(() =>
        useLearnerResourcesMock({
          classes: [
            { id: 'class-1', name: 'Class 1' },
            { id: 'class-2', name: 'Class 2' },
          ],
        })
      );
      const wrapper = makeWrapper();
      const links = getClassesSection(wrapper).findAll('[data-test="classLink"]');
      expect(links.length).toBe(2);
      expect(links.at(0).text()).toBe('Class 1');
      expect(links.at(1).text()).toBe('Class 2');
    });
  });

  describe(`"Continue learning from classes/on your own" section`, () => {
    it(`the section is not displayed for a guest user`, () => {
      const wrapper = makeWrapper();
      expect(getContinueLearningSection(wrapper).exists()).toBe(false);
    });

    it(`the section is not displayed for a signed in user who has
      no resources or quizzes in progress`, () => {
      useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
      const wrapper = makeWrapper();
      expect(getContinueLearningSection(wrapper).exists()).toBe(false);
    });

    describe(`for a signed in user who has some classes resources or quizzes in progress`, () => {
      beforeEach(() => {
        useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
        useLearnerResources.mockImplementation(() =>
          useLearnerResourcesMock({
            resumableClassesQuizzes: [
              { id: 'class-quiz-1', title: 'Class quiz 1' },
              { id: 'class-quiz-2', title: 'Class quiz 2' },
            ],
            resumableClassesResources: [
              { contentNodeId: 'class-resource-1', lessonId: 'class-1-lesson', classId: 'class-1' },
              { contentNodeId: 'class-resource-2', lessonId: 'class-2-lesson', classId: 'class-2' },
            ],
            resumableNonClassesContentNodes: [
              { id: 'non-class-resource-1', title: 'Non-class resource 1' },
              { id: 'non-class-resource-2', title: 'Non-class resource 2' },
            ],
            getResumableContentNode(contentNodeId) {
              if (contentNodeId === 'class-resource-1') {
                return { id: 'class-resource-1', title: 'Class resource 1' };
              } else if (contentNodeId === 'class-resource-2') {
                return { id: 'class-resource-2', title: 'Class resource 2' };
              }
            },
            getClassQuizLink() {
              return { path: '/class-quiz' };
            },
            getClassResourceLink() {
              return { path: '/class-resource' };
            },
          })
        );
      });

      it(`"Continue learning on your own" section is not displayed`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.text()).not.toContain('Continue learning on your own');
      });

      it(`"Continue learning from your classes" section is displayed`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.text()).toContain('Continue learning from your classes');
      });

      it(`resources in progress outside of classes are not displayed`, () => {
        const wrapper = makeWrapper();
        expect(getContinueLearningSection(wrapper).text()).not.toContain('Non-class resource 1');
        expect(getContinueLearningSection(wrapper).text()).not.toContain('Non-class resource 2');
      });

      it(`classes resources and quizzes in progress are displayed`, () => {
        const wrapper = makeWrapper();
        const links = getContinueLearningSection(wrapper).findAll('a');
        expect(links.length).toBe(4);
        expect(links.at(0).text()).toBe('Class resource 1');
        expect(links.at(1).text()).toBe('Class resource 2');
        expect(links.at(2).text()).toBe('Class quiz 1');
        expect(links.at(3).text()).toBe('Class quiz 2');
      });

      it(`clicking a resource navigates to the class resource page`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.vm.$route.path).toBe('/');
        const links = getContinueLearningSection(wrapper).findAll('a');
        links.at(0).trigger('click');
        expect(wrapper.vm.$route.path).toBe('/class-resource');
      });

      it(`clicking a quiz navigates to the class quiz page`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.vm.$route.path).toBe('/');
        const links = getContinueLearningSection(wrapper).findAll('a');
        links.at(2).trigger('click');
        expect(wrapper.vm.$route.path).toBe('/class-quiz');
      });
    });

    describe(`for a signed in user who doesn't have any classes resources or quizzes in progress
      and has some resources in progress outside of classes`, () => {
      beforeEach(() => {
        useUser.mockImplementation(() => useUserMock({ isUserLoggedIn: true }));
        useLearnerResources.mockImplementation(() =>
          useLearnerResourcesMock({
            resumableNonClassesContentNodes: [
              { id: 'non-class-resource-1', title: 'Non-class resource 1' },
              { id: 'non-class-resource-2', title: 'Non-class resource 2' },
            ],
            getTopicContentNodeLink() {
              return { path: '/topic-resource' };
            },
          })
        );
      });

      it(`"Continue learning from your classes" section is not displayed`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.text()).not.toContain('Continue learning from your classes');
      });

      it(`"Continue learning on your own" section is not displayed
        when access to unassigned content is not allowed`, () => {
        const wrapper = makeWrapper();
        expect(wrapper.text()).not.toContain('Continue learning on your own');
      });

      describe(`when access to unassigned content is allowed`, () => {
        beforeEach(() => {
          useDeviceSettings.mockImplementation(() =>
            useDeviceSettingsMock({
              canAccessUnassignedContent: true,
            })
          );
        });

        it(`"Continue learning on your own" section is displayed`, () => {
          const wrapper = makeWrapper();
          expect(wrapper.text()).toContain('Continue learning on your own');
        });

        it(`resources in progress outside of classes are displayed`, () => {
          const wrapper = makeWrapper();
          const links = getContinueLearningSection(wrapper).findAll('a');
          expect(links.length).toBe(2);
          expect(links.at(0).text()).toBe('Non-class resource 1');
          expect(links.at(1).text()).toBe('Non-class resource 2');
        });

        it(`clicking a resource navigates to the topic resource page`, () => {
          const wrapper = makeWrapper();
          expect(wrapper.vm.$route.path).toBe('/');
          const links = getContinueLearningSection(wrapper).findAll('a');
          links.at(0).trigger('click');
          expect(wrapper.vm.$route.path).toBe('/topic-resource');
        });
      });
    });
  });
});
