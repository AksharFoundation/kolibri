<template>

  <KModal
    :title="$tr('modalTitle')"
    :submitText="$tr('promoteLabel')"
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
    name: 'AdminPromotionModal',
    props: {
      multipleLearnerSelect: {
        type: Boolean,
        required: true,
      },
      approveSelected: {
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
          if (this.approveSelected) {
            return this.$tr('multiLearnerApprovalConfirmatioMessage', {
              count: count,
            });
          } else {
            return this.$tr('multiLearnerDenialConfirmatioMessage', {
              count: count,
            });
          }
        } else {
          let learner = Object.values(this.selectedPromotionList)[0].learner_name;
          if (this.approveSelected) {
            return this.$tr('singleLearnerApprovalConfirmatioMessage', {
              learner: learner,
            });
          } else {
            return this.$tr('singleLearnerDenialConfirmatioMessage', {
              learner: learner,
            });
          }
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
        message: 'Learner Promotion',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      promoteLabel: {
        message: 'Promote',
        context: '',
      },
      cancelLabel: {
        message: 'Cancel',
        context: '',
      },
      singleLearnerApprovalConfirmatioMessage: {
        message: 'Approve promotion of {learner}?',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      singleLearnerDenialConfirmatioMessage: {
        message: 'Cancel promotion of {learner}?',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      multiLearnerApprovalConfirmatioMessage: {
        message: 'Are you sure you want to promote the following {count} learners?',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      multiLearnerDenialConfirmatioMessage: {
        message: 'Are you sure you want to cancel promotion of the following {count} learners?',
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