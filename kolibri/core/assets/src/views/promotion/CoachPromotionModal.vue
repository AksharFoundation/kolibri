<template>

  <KModal
    :title="$tr('modalTitle')"
    :submitText="$tr('recommendLabel')"
    :cancelText="$tr('cancelLabel')"
    @submit="$emit('submit')"
    @cancel="$emit('cancel')"
  >
    <div v-if="multipleLearnerSelect">
      {{ modalConfirmationMessage }}
      <ul>
        <li v-for="learner in selectedLearners" :key="learner.id">
          {{ learner.learner_name }}
        </li>
      </ul>
    </div>
    <div v-if="!multipleLearnerSelect">
      <tbody>
        <tr>
          <td class="center-text">
            <span dir="auto"> {{ modalConfirmationMessage }} </span>
          </td>
        </tr>

        <tr>
          <td class="center-text">
            <span dir="auto"> {{ singleLearnerDetails }} </span>
          </td>
        </tr>
      </tbody>  
      <div>  
      </div>
    </div>
  </kmodal>

</template>

<script>

  export default {
    name: 'CoachPromotionModal',
    props: {
      multipleLearnerSelect: {
        type: Boolean,
        required: true,
      },
      selectedLearners: {
        type: Object,
        required: true,
      },
    },
    computed: {
      modalConfirmationMessage() {
        if (this.multipleLearnerSelect) {
          let count = Object.keys(this.selectedLearners).length;
          return this.$tr('multiLearnerConfirmatioMessage', {
            count: count,
          });
        } else {
          let learner = Object.values(this.selectedLearners)[0].learner_name;
          return this.$tr('singleLearnerConfirmatioMessage', { learner });
        }
      },
      singleLearnerDetails() {
        let quizScore = Object.values(this.selectedLearners)[0].quiz_score;
        let lessonCompletion = Object.values(this.selectedLearners)[0].lesson_completion;
        return this.$tr('singleLearnerDetails', {
          quizScore,
          lessonCompletion,
        });
      },
    },
    $trs: {
      modalTitle: {
        message: 'Recommend for Promotion',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      recommendLabel: {
        message: 'Confirm',
        context: 'Label for the confirmation button',
      },
      cancelLabel: {
        message: 'Cancel',
        context: 'Label for the cancel button',
      },
      singleLearnerConfirmatioMessage: {
        message: 'Promote {learner} ?',
        context: 'Message shown when an admin selects a single learner for promotion',
      },
      multiLearnerConfirmatioMessage: {
        message: 'Are you sure you want to recommend the following {count} students for promotion?',
        context:
          'Confirmation message shown when the admin selects multiple learners for promotion',
      },
      singleLearnerDetails: {
        message: 'Quiz Score: {quizScore} | Lesson Completion: {lessonCompletion}',
        context:
          'Quiz and lesson details shown when a single learner is selected for approving/denial of promotion',
      },
    },
  };

</script>

<style lang="scss" scoped>

  .center-text {
    text-align: center;
  }

  .svg-item {
    margin-right: 12px;
    margin-bottom: -4px;
    font-size: 24px;
  }

</style>