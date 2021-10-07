<template>

  <div>
    <KFixedGrid
      numCols="4"
      class="page-status"
      :style="{ backgroundColor: $themeTokens.surface }"
    >
      <KFixedGridItem span="3">
        <div>
          <h1 class="title">
            <KLabeledIcon icon="person" :label="userName" />
          </h1>
          <KLabeledIcon icon="quiz" :label="contentName" />
        </div>

        <table class="scores">
          <tr>
            <th>
              {{ $tr('overallScore') }}
            </th>
            <td>
              <strong>
                {{ $formatNumber(score, { style: 'percent' }) }}
              </strong>
            </td>
          </tr>
          <tr>
            <th>
              {{ $tr('questionsCorrectLabel') }}
            </th>
            <td>
              {{ $tr('questionsCorrectValue', {
                correct: questionsCorrect, total: questions.length
              }) }}
            </td>
          </tr>
        </table>
      </KFixedGridItem>
      <KFixedGridItem span="1" alignment="right">
        <div>
          <ProgressIcon class="svg-icon" :progress="progress" />
          <strong>
            {{ progressIconLabel }}
          </strong>
        </div>
        <div v-if="completed">
          <ElapsedTime :date="completionTimestamp" />
        </div>
      </KFixedGridItem>
    </KFixedGrid>
    <KModal
      v-if="submitModalOpen"
      :title="$tr('areYouSure')"
      :submitText="$tr('retakeExamLabel')"
      :cancelText="coreString('goBackAction')"
      @submit="recreateExamForStudent"
      @cancel="cancel"
    >
      <p>{{ $tr('scoreWarning') }}</p>
    </KModal>
    <BottomAppBar v-if="completed && retakeEnabled">
      <KButton
        :text="$tr('retakeExamLabel')"
        appearance="raised-button"
        style="margin: 0 20px 0 0;"
        :primary="true"
        @click="submitModalOpen = true"
      />
    </BottomAppBar>
  </div>

</template>


<script>

  import ProgressIcon from 'kolibri.coreVue.components.ProgressIcon';
  import ElapsedTime from 'kolibri.coreVue.components.ElapsedTime';
  import BottomAppBar from 'kolibri.coreVue.components.BottomAppBar';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import { ExamLogResource, ExamAttemptLogResource } from 'kolibri.resources';
  import { mapGetters } from 'vuex';
  import store from 'kolibri.coreVue.vuex.store';

  export default {
    name: 'PageStatus',
    components: {
      ProgressIcon,
      ElapsedTime,
      BottomAppBar,
    },
    mixins: [commonCoreStrings],
    props: {
      userName: {
        type: String,
        required: true,
      },
      questions: {
        type: Array,
        default: () => [],
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completionTimestamp: {
        type: Date,
        default: null,
      },
      contentName: {
        type: String,
        required: true,
      },
      examLog: {
        type: Object,
        required: false,
      },
      examAttempts: {
        type: Array,
        required: false,
      },
    },
    data() {
      return {
        submitModalOpen: false,
      };
    },
    computed: {
      ...mapGetters(['isLearner']),
      questionsCorrect() {
        return this.questions.reduce((a, q) => a + (q.correct === 1 ? 1 : 0), 0);
      },
      score() {
        return this.questions.reduce((a, q) => a + q.correct, 0) / this.questions.length || 0;
      },
      progress() {
        // Either return in completed or in progress
        return this.completed ? 1 : 0.1;
      },
      progressIconLabel() {
        if (this.completed) {
          return this.coreString('completedLabel');
        } else if (this.completed !== null) {
          return this.$tr('inProgress');
        } else {
          return this.$tr('notStartedLabel');
        }
      },
      retakeEnabled() {
        // The Retake button is enabled only for leaners,
        // the threshold should be kept in a proper conf and not here (TODO)
        let isScoreBelowThreshold =
          this.questions.reduce((a, q) => a + q.correct, 0) / this.questions.length || 0 < 90;
        return this.isLearner && isScoreBelowThreshold;
      },
    },
    methods: {
      cancel() {
        this.submitModalOpen = false;
      },
      recreateExamForStudent() {
        this.submitModalOpen = false;
        //Updates the ExamLog for the learner to reopen the exam for them
        ExamLogResource.saveModel({
          id: this.examLog.id,
          data: {
            exam: this.examLog.exam,
            user: this.examLog.user,
            completion_timestamp: null,
            closed: false,
            clear_attempt_log: true,
          },
        })
          .then(() => {
            // Redirect to exam page
            ExamLogResource.clearCache();
            ExamAttemptLogResource.clearCache();
            this.$router.push(
              this.$router.getRoute('EXAM_VIEWER', {
                params: {
                  examId: this.examLog.exam,
                  classId: this.$route.params.classId,
                  questionNumber: 0,
                },
              })
            );
          })
          .catch(error => {
            store.dispatch('handleApiError', error, { root: true });
          });
      },
    },
    $trs: {
      overallScore: {
        message: 'Overall score',
        context:
          "String appears on the 'Quiz report' that a learner can access after they submit the quiz. Value is expressed as a percentage of correctly answered questions. Can be translated as 'Score'.  ",
      },
      questionsCorrectLabel: {
        message: 'Questions correct',
        context:
          "When reviewing a learner's report, a coach can see how many questions the learner has got correct in a quiz. The 'Questions correct' label will indicate something like 4 out of 5, or 8 out of 10, for example.",
      },
      questionsCorrectValue: {
        message: '{correct, number} out of {total, number}',
        context:
          "When reviewing a learner's report, a coach can see how many questions the learner has got correct in a quiz. The 'Questions correct' label will indicate something like 4 out of 5, or 8 out of 10, for example. That's to say, the number of correct answers as well as the total number of questions.",
      },
      inProgress: {
        message: 'In progress',
        context:
          "When a learner starts doing an exercise, viewing a video, or reading a document, this will be marked with the 'In progress' icon.\n\nThe text 'In progress' appears if the learner moves their mouse over the icon.",
      },
      notStartedLabel: {
        message: 'Not started',
        context:
          "When a coach creates a quiz, by default it is marked as 'Not started'. This means that learners will not see it in the Learn > Classes view.\n\nThe coach needs to use the 'START QUIZ' button to enable learners to see the quiz and start answering the questions.",
      },
      retakeExamLabel: {
        message: 'Retake Exam',
        context: 'When the total score is less than 90%, the learner can retake the exam again',
      },
      areYouSure: {
        message: 'Are you sure?',
        context: 'Message to confirm if thet learner want to go ahead and submit the choice',
      },
      scoreWarning: {
        message: 'You will lose the current score.',
        context:
          'Message a learner sees when they wish to retake an exam indicating that they would lose the current score.',
      },
    },
  };

</script>


<style lang="scss" scoped>

  .page-status {
    padding: 8px;
  }

  .svg-icon {
    margin-right: 8px;
    font-size: 1.3em;
  }

  .icon {
    position: relative;
    top: -2px;
  }

  .questions {
    margin-top: 10px;
  }

  .svg-item {
    display: inline-block;
    margin-right: 8px;
    vertical-align: middle;
  }

  .title {
    margin-top: 0;
  }

  .scores {
    min-width: 200px;
    margin-top: 24px;

    th {
      text-align: left;
    }

    th,
    td {
      height: 2em;
      padding-right: 24px;
      font-size: 14px;
    }
  }

  .retake-button {
    padding-top: 32px;
  }

</style>
