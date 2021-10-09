<template>

  <KPageContainer>
    <h2>
      {{ $tr('studentPromotionHeader') }}
    </h2>
    <p v-if="showPromotionNotification">
      {{ $tr('studentPromotionSubHeader') }}
    </p>
    <p v-if="!showPromotionNotification">
      {{ $tr('studentPromotionEmptySubHeader') }}
    </p>
    <PaginatedListContainer
      v-if="showPromotionNotification"
      :items="learnersListFilteredByDropdown"
      :filterPlaceholder="$tr('searchboxPlaceholderText')"
    >

      <template #otherFilter>
        <KSelect
          v-model="classFilter"
          label="Class"
          :options="listOfClasses"
          :inline="true"
          class="type-filter"
        />
      </template>

      <template #default="{ items }">
        <CoreTable
          :selectable="true"
          :emptyMessage="$tr('searchNoResultText')"
        >
          <template #headers>
            <th class="table-checkbox-header">
            </th>
            <th class="table-header">
              {{ coreString('learnerLabel') }}
            </th>
            <th class="table-header">
              {{ $tr('quizTitleLabel') }}
            </th>
            <th class="table-header">
              {{ $tr('QuizScoreLabel') }}
            </th>
            <th class="table-header">
              {{ $tr('LessonCompletionLabel') }}
            </th>
            <th v-if="!isAdminUser" class="table-header">
              {{ $tr('promotionStatusLabel') }}
            </th>
            <th v-if="isAdminUser" class="table-header">
              {{ $tr('coachApproverLabel') }}
            </th>
          </template>
          <template #tbody>
            <tbody>
              <tr v-for="promotionObj in items" :key="promotionObj.id">
                <td class="table-data">
                  <KCheckbox
                    :disabled="promotionObj.promotion_status == 'RECOMMENDED' && !isAdminUser"
                    @change="toggleLearnerSelection(promotionObj.id)"
                  />
                </td>
                <td class="table-data">
                  <KLabeledIcon icon="person">
                    <KRouterLink
                      v-if="!isAdminUser"
                      :text="promotionObj.learner_name"
                      :to="classRoute('ReportsQuizLearnerPage', {
                        learnerId: promotionObj.learner_id,
                        quizId: promotionObj.quiz_id,
                        classId: promotionObj.classroom_id,
                        questionId: 0,
                        interactionIndex: 0
                      })"
                    />
                    <span v-else>{{ promotionObj.learner_name }}</span>
                  </KLabeledIcon>
                </td>
                <td class="table-data">
                  <KRouterLink
                    v-if="!isAdminUser"
                    :text="promotionObj.quiz_name"
                    :to="classRoute('ReportsQuizLearnerListPage', { quizId: promotionObj.quiz_id, classId: promotionObj.classroom_id })"
                    icon="quiz"
                  />
                  <span v-else>{{ promotionObj.quiz_name }}</span>
                </td>
                <td class="table-data">
                  {{ promotionObj.quiz_score }}%
                </td>
                <td class="table-data">
                  {{ promotionObj.lesson_completion }}%
                </td>
                <td v-if="!isAdminUser" class="table-data">
                  {{ promotionStatusText(promotionObj.promotion_status) }} 
                  <template v-if="learnerNeedsReview(promotionObj.promotion_status)" class="center-text">
                    <KIcon 
                      :ref="toolkitReference(promotionObj.id)"
                      icon="warningIncomplete"
                      class="item svg-item"
                    />
                    <KTooltip
                      :reference="toolkitReference(promotionObj.id)" 
                      :refs="$refs"
                      placement="bottom"
                    >
                      {{ $tr('promotionDeniedText', { learner: promotionObj.learner_name, admin: promotionObj.admin_approver }) }}
                    </KTooltip>
                  </template>
                </td>
                <td v-if="isAdminUser" class="table-data">
                  <KLabeledIcon icon="person">
                    {{ promotionObj.coach_approver }}
                  </KLabeledIcon>
                </td>
              </tr>    
            </tbody>
          </template>    
        </CoreTable>   
      </template>
    </PaginatedListContainer>
    <SelectionButtonGroup
      :isAdminUser="isAdminUser"
      :count="Object.keys(selectedLearners).length"
      :showPromotionNotification="showPromotionNotification"
      @recommend="handleActionButtonSelection('recommend')"
      @deny="handleActionButtonSelection('deny')"
      @promote="handleActionButtonSelection('promote')"
    />
    <CoachPromotionModal
      v-if="displayCoachPromotionModel"
      :multipleLearnerSelect="multipleLearnerSelect"
      :selectedLearners="selectedLearners"
      @submit="handlePromotionUpdateByCoach"
      @cancel="displayCoachPromotionModel = false"
    />
    <AdminPromotionModal 
      v-if="displayAdminPromotionModel"
      :multipleLearnerSelect="multipleLearnerSelect"
      :selectedLearners="selectedLearners"
      :approveSelected="adminAction == 'promote'"
      @submit="handlePromotionUpdateByAdmin"
      @cancel="displayAdminPromotionModel = false"
    />
  </KPagecontainer>

</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import CoreTable from 'kolibri.coreVue.components.CoreTable';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import PaginatedListContainer from 'kolibri.coreVue.components.PaginatedListContainer';
  import router from 'kolibri.coreVue.router';
  import updatePromotionQueueObjects from 'kolibri.utils.updatePromotionQueueObjects';
  import CoachPromotionModal from './CoachPromotionModal';
  import AdminPromotionModal from './AdminPromotionModal';
  import SelectionButtonGroup from './SelectionButtonGroup';

  const AdminAction = {
    PROMOTE: 'promote',
    DENIED: 'deny',
  };

  export default {
    name: 'PromotionNotification',
    components: {
      CoreTable,
      CoachPromotionModal,
      AdminPromotionModal,
      SelectionButtonGroup,
      PaginatedListContainer,
    },
    mixins: [commonCoreStrings],
    props: {
      promotions: {
        type: Array,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        // list of learners that are selected by the coach/admin
        selectedLearners: {},
        // show/hide confirmation modal for coach
        displayCoachPromotionModel: false,
        // indicates if multiple learners are selected from the list
        multipleLearnerSelect: false,
        // the list of promotion entries from server
        promotionList: this.promotions,
        // if the admin has clicked accept button
        acceptPromotionSelected: false,
        // show/hide confirmation modal for admin
        displayAdminPromotionModel: false,
        // action taken by the admin
        adminAction: '',
        // the option selected from the dropdown filter
        classFilter: null,
      };
    },
    computed: {
      ...mapGetters(['isCoach', 'isFacilityCoach', 'isSuperuser']),
      ...mapState({
        fullName: state => state.core.session.full_name,
      }),
      learnerList() {
        return this.promotionList;
      },
      showPromotionNotification() {
        let allowed_values = ['Coach', 'FacilityAdmin'];
        return this.countOfLearners() > 0 && allowed_values.includes(this.role);
      },
      isAdminUser() {
        if (this.role == 'FacilityAdmin') {
          return true;
        }
        return false;
      },
      listOfClasses() {
        let options = [{ label: 'All', value: 'All' }];
        let keys = ['All'];

        for (var index in this.promotionList) {
          if (keys.indexOf(this.promotionList[index]['classroom_name']) == -1) {
            let className = this.promotionList[index]['classroom_name'];
            options.push({ label: className, value: className });
            keys.push(className);
          }
        }
        return options;
      },
      learnersListFilteredByDropdown() {
        if (this.classFilter.value == 'All') {
          return this.promotionList;
        }
        return this.promotionList.filter(item => item['classroom_name'] == this.classFilter.value);
      },
    },

    beforeMount() {
      this.classFilter = this.listOfClasses[0];
    },
    methods: {
      classRoute(name, params = {}, query = {}) {
        return router.getRoute(name, params, query);
      },
      handleActionButtonSelection(action) {
        this.multipleLearnerSelect = this.countOfSelectedLearners() > 1;

        if (action == AdminAction.PROMOTE) {
          this.adminAction = AdminAction.PROMOTE;
          this.acceptPromotionSelected = true;
          this.displayAdminPromotionModel = true;
        } else if (action == AdminAction.DENIED) {
          this.adminAction = AdminAction.DENIED;
          this.acceptPromotionSelected = false;
          this.displayAdminPromotionModel = true;
        } else {
          // if no admin action triggered, then show coach's modal
          this.displayCoachPromotionModel = true;
        }
      },
      // handles the updating the promotion statuses on server
      // Removes the entry from the displayed page
      handlePromotionUpdateByCoach() {
        console.log(this.promotionList);
        this.displayCoachPromotionModel = false;
        const ids = Object.keys(this.selectedLearners);
        for (var i in this.selectedLearners) {
          this.selectedLearners[i]['promotion_status'] = 'RECOMMENDED';
          this.selectedLearners[i]['coach_approver'] = this.fullName;
          updatePromotionQueueObjects(this.selectedLearners[i]);
        }
        this.showSnackbarNotification('learnerRecommendedForPromotion', {
          count: this.countOfSelectedLearners(),
        });
        this.clearSelectLearners();
        if (this.countOfLearners() == 0) {
          this.promotionList = [];
        }
      },
      handlePromotionUpdateByAdmin() {
        this.displayAdminPromotionModel = false;
        const ids = Object.keys(this.selectedLearners);
        for (var i in ids) {
          for (var j = this.countOfLearners() - 1; j >= 0; j--) {
            if (this.promotionList[j].id == ids[i]) {
              this.promotionList.splice(j, 1);
            }
          }
        }
        for (var i in this.selectedLearners) {
          if (this.acceptPromotionSelected) {
            this.selectedLearners[i]['promotion_status'] = 'APPROVED';
          } else {
            this.selectedLearners[i]['promotion_status'] = 'CANCELLED';
          }
          this.selectedLearners[i]['admin_approver'] = this.fullName;
          updatePromotionQueueObjects(this.selectedLearners[i]);
        }

        if (this.acceptPromotionSelected) {
          this.showSnackbarNotification('learnerApprovedForPromotion', {
            count: this.countOfSelectedLearners(),
          });
        } else {
          this.showSnackbarNotification('learnerDeniedForPromotion', {
            count: this.countOfSelectedLearners(),
          });
        }

        this.clearSelectLearners();
        this.acceptPromotionSelected = false;
        if (this.countOfLearners() == 0) {
          this.promotionList = [];
        }
      },
      toggleLearnerSelection(id) {
        // adds or removes the learner from the dictionary on toggling the selection box

        if (id in this.selectedLearners) {
          this.$delete(this.selectedLearners, id);
        } else {
          this.$set(this.selectedLearners, id, this.getPromotionDetailsById(id));
        }
      },
      getPromotionDetailsById(id) {
        for (var index in this.promotionList) {
          if (this.promotionList[index].id == id) {
            return this.promotionList[index];
          }
        }
      },
      promotionStatusText(status) {
        if (status == 'REVIEW' || status == 'CANCELLED') {
          return this.$tr('statusReviewText');
        }
        if (status == 'RECOMMENDED') {
          return this.$tr('statusRecommendedText');
        }
        return '';
      },
      learnerNeedsReview(status) {
        if (status == 'CANCELLED') {
          return true;
        }
        return false;
      },
      toolkitReference(id) {
        return 'icon_' + id;
      },
      countOfLearners() {
        return Object.keys(this.promotionList).length;
      },
      countOfSelectedLearners() {
        return Object.keys(this.selectedLearners).length;
      },
      clearSelectLearners() {
        this.selectedLearners = {};
      },
    },
    $trs: {
      studentPromotionHeader: {
        message: 'Promotion List',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      studentPromotionSubHeader: {
        message: 'View students to be promoted and reviewed',
        context:
          'Subtitle for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      studentPromotionEmptySubHeader: {
        message: 'There are no students to be promoted and reviewed',
        context:
          'Subtitle for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      promotionStatusLabel: {
        message: 'Status',
        context: 'The current status of the promotion recommendation',
      },
      quizTitleLabel: {
        message: 'Exam Title',
        context: 'The marks obtained by the learner in the quiz',
      },
      QuizScoreLabel: {
        message: 'Exam Score',
        context: 'The marks obtained by the learner in the quiz',
      },
      LessonCompletionLabel: {
        message: 'Course Completion',
        context: "The learner's progress in the specific subject",
      },
      statusReviewText: {
        message: 'Needs Review',
        context: 'Status indicating that a learner needs to be reviewed for promotion',
      },
      statusRecommendedText: {
        message: 'Recommended',
        context: 'Status indicating that a learner is already recommended for promotion',
      },
      coachApproverLabel: {
        message: 'Teacher Approver',
        context: 'Indicates the coach who has recommended the learner for promotion',
      },
      searchboxPlaceholderText: {
        message: 'Search for students..',
        context: 'Search box placeholder',
      },
      searchNoResultText: {
        message: 'No students found for the provided search text.',
        context: 'Indicates no learner found matching the search text',
      },
      promotionDeniedText: {
        message: '{learner} promotion was denied by {admin}. Please re-evaluate the student again',
        context:
          "If a learner's promotion was denied by an admin. Indicates the admin who denied it and the steps to be taken next.",
      },
    },
  };

</script>

<style lang="scss" scoped>

  .table-header {
    padding: 24px 0;
  }

  .table-checkbox-header {
    padding: 8px;
  }

  .table-data {
    padding-top: 6px;
    vertical-align: middle;
  }

  .center-text {
    text-align: center;
  }

  .svg-item {
    margin-right: 12px;
    margin-bottom: -4px;
    font-size: 24px;
  }

  .type-filter {
    margin-bottom: 0;
  }

</style>