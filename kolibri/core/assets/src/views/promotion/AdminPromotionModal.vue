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
      selectedLearners: {
        type: Object,
        required: true,
      },
    },
    computed: {
      modalConfirmationMessage() {
        if (this.multipleLearnerSelect) {
          let count = Object.keys(this.selectedLearners).length;
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
          let learner = Object.values(this.selectedLearners)[0].learner_name;
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
        message: 'Student Promotions',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      promoteLabel: {
        message: 'Confirm',
        context: 'Label for the confirmation button',
      },
      cancelLabel: {
        message: 'Cancel',
        context: 'Label for the cancel button',
      },
      singleLearnerApprovalConfirmatioMessage: {
        message: 'Approve promotion of {learner}?',
        context: 'Message shown when an admin selects a single learner for promotion',
      },
      singleLearnerDenialConfirmatioMessage: {
        message: 'Cancel promotion of {learner}?',
        context: 'Message shown when an admin selects a single learner for denial of promotion',
      },
      multiLearnerApprovalConfirmatioMessage: {
        message: 'Are you sure you want to promote the following {count} students?',
        context:
          'Confirmation message shown when the admin selects multiple learners for promotion',
      },
      multiLearnerDenialConfirmatioMessage: {
        message: 'Are you sure you want to cancel promotion of the following {count} students?',
        context:
          'Confirmation message shown when the admin selects multiple learners for denial of promotion',
      },
      singleLearnerDetails: {
        message: 'Quiz Score: {quizScore} | Lesson Completion: {lessonCompletion}',
        context:
          'Quiz and lesson details shown when a single learner is selected for approving/denial of promotion',
      },
    },
  };

</script>