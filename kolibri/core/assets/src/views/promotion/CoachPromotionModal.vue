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
      <KKTextbox label="learnersList" disabled="true"> 
        <ul>
          <li v-for="learner in selectedPromotionList" :key="learner.id">
            {{ learner.learner_name }}
          </li>
        </ul>
      </KKTextbox>
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
      selectedPromotionList: {
        type: Object,
        required: true,
      },
    },
    computed: {
      modalConfirmationMessage() {
        if (this.multipleLearnerSelect) {
          let count = Object.keys(this.selectedPromotionList).length;
          return this.$tr('multiLearnerConfirmatioMessage', {
            count: count,
          });
        } else {
          let learner = Object.values(this.selectedPromotionList)[0].learner_name;
          return this.$tr('singleLearnerConfirmatioMessage', { learner });
        }
      },
      singleLearnerDetails() {
        let quizScore = Object.values(this.selectedPromotionList)[0].quiz_score;
        let lessonCompletion = Object.values(this.selectedPromotionList)[0].quiz_score;
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
        message: 'Recommend',
        context: '',
      },
      cancelLabel: {
        message: 'Cancel',
        context: '',
      },
      singleLearnerConfirmatioMessage: {
        message: 'Promote {learner} ?',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      multiLearnerConfirmatioMessage: {
        message: 'Are you sure you want to recommend the following {count} learners for promotion?',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      singleLearnerDetails: {
        message: 'Quiz Score: {quizScore} | Lesson Completion: {lessonCompletion}',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
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