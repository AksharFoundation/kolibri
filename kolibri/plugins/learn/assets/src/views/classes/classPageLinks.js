import { ClassesPageNames } from '../../constants';

export function classAssignmentsLink(classId) {
  return {
    name: ClassesPageNames.CLASS_ASSIGNMENTS,
    params: {
      classId,
    },
  };
}

export function lessonResourceViewerLink(resourceNumber) {
  return {
    name: ClassesPageNames.LESSON_RESOURCE_VIEWER,
    params: {
      resourceNumber,
    },
  };
}

export function lessonPlaylistLink(lessonId) {
  return {
    name: ClassesPageNames.LESSON_PLAYLIST,
    params: {
      lessonId,
    },
  };
}

export function notificationListLink() {
  return {
    name: ClassesPageNames.ALL_NOTIFICATIONS,
  };
}
