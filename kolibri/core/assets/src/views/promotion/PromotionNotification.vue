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
      filterPlaceholder="Search for a learner.."
    >

      <template #otherFilter>
        <KSelect
          v-model="classFilter"
          label="Quiz Title"
          :options="classOptions"
          :inline="true"
          class="type-filter"
        />
      </template>

      <template #default="{ items }">
        <CoreTable
          :selectable="true"
          emptyMessage="No learner found"
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
            <th class="table-header">
              Action
            </th>
          </template>
          <template #tbody>
            <tbody>
              <tr v-for="promotionObj in items" :key="promotionObj.id">
                <td class="table-data">
                  <KCheckbox
                    :showLabel="false"
                    @change="handleCheckboxChange(promotionObj.id)"
                  />
                </td>
                <td class="table-data">
                  <KLabeledIcon icon="person">
                    <KRouterLink
                      :text="promotionObj.learner_name"
                      :to="classRoute('ReportsQuizLearnerPage', {
                        learnerId: promotionObj.learner_id,
                        quizId: promotionObj.quiz_id,
                        classId: promotionObj.classroom_id,
                        questionId: 0,
                        interactionIndex: 0
                      })"
                    />
                  </KLabeledIcon>
                </td>
                <td class="table-data">
                  <KRouterLink
                    :text="promotionObj.quiz_name"
                    :to="classRoute('ReportsQuizLearnerListPage', { quizId: promotionObj.quiz_id, classId: promotionObj.classroom_id })"
                    icon="quiz"
                  />
                </td>
                <td class="table-data">
                  {{ promotionObj.quiz_score }}
                </td>
                <td class="table-data">
                  {{ promotionObj.quiz_score }}
                </td>
                <td v-if="!isAdminUser" class="table-data">
                  {{ promotionStatusText(promotionObj.promotion_status) }} 
                  <template v-if="learnerNeedsReview(promotionObj.promotion_status)" class="center-text">
                    <KIcon 
                      :ref="toolkitReference(promotionObj.id)" 
                      icon="infoPrimary"
                      class="item svg-item"
                      :style="{ fill: $themeTokens.incorrect }"
                    />
                    <KTooltip
                      :reference="toolkitReference(promotionObj.id)" 
                      :refs="$refs"
                      placement="bottom"
                    >
                      <ul>
                        <li>{{ promotionObj.learner_name }} promotion was denied by {{ promotionObj.admin_approver }}.</li>
                        <li>Please re-evaluate the learner. </li>
                      </ul>
                    </KTooltip>
                  </template>
                </td>
                <td v-if="isAdminUser" class="table-data">
                  {{ promotionObj.coach_approver }}
                </td>
                <td class="table-data">
                  <KButton
                    v-if="!isAdminUser"
                    :text="$tr('RecommendActionLabel')"
                    :primary="true"
                    @click="handleActionButtonSelection(promotionObj.id, '')"
                  />
                  <KButtonGroup v-if="isAdminUser">
                    <KButton
                      :secondary="true"
                      appearance="raised-button"
                      text="Deny"
                      @click="handleActionButtonSelection(promotionObj.id, 'deny')"
                    />
                    <KButton
                      :primary="true"
                      appearance="raised-button"
                      text="Promote"
                      @click="handleActionButtonSelection(promotionObj.id, 'promote')"
                    />
                  </KButtonGroup>
                </td>
              </tr>    
            </tbody>
          </template>    
        </CoreTable>   
      </template>
    </PaginatedListContainer>

    <CoachPromotionModal
      v-if="displayPromotionModel"
      :multipleLearnerSelect="multipleLearnerSelect"
      :selectedPromotionList="promotionRecommendationDict"
      @submit="handlePromotionUpdateByCoach"
      @cancel="displayPromotionModel = false"
    />
    <AdminPromotionModal 
      v-if="displayAdminPromotionModel"
      :multipleLearnerSelect="multipleLearnerSelect"
      :selectedPromotionList="promotionRecommendationDict"
      :approveSelected="adminAction == 'Approve'"
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

  export default {
    name: 'PromotionNotification',
    components: {
      CoreTable,
      CoachPromotionModal,
      AdminPromotionModal,
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
        promotionRecommendationDict: {},
        displayPromotionModel: false,
        multipleLearnerSelect: false,
        promotionList: this.promotions,
        acceptPromotion: false,
        displayAdminPromotionModel: false,
        adminAction: '',
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
        return Object.keys(this.promotionList).length > 0 && allowed_values.includes(this.role);
      },
      isAdminUser() {
        if (this.role == 'FacilityAdmin') {
          return true;
        }
        return false;
      },
      classOptions() {
        let options = [{ label: 'All', value: 'All' }];
        let keys = ['All'];

        for (var index in this.promotionList) {
          if (keys.indexOf(this.promotionList[index]['quiz_name']) == -1) {
            let quizName = this.promotionList[index]['quiz_name'];
            options.push({ label: quizName, value: quizName });
            keys.push(quizName);
          }
        }
        return options;
      },
      learnersListFilteredByDropdown() {
        console.log(this.classFilter.value);
        if (this.classFilter.value == 'All') {
          return this.promotionList;
        }
        return this.promotionList.filter(item => item['quiz_name'] == this.classFilter.value);
      },
    },
    beforeMount() {
      this.classFilter = this.classOptions[0];
    },
    methods: {
      classRoute(name, params = {}, query = {}) {
        return router.getRoute(name, params, query);
      },
      handleActionButtonSelection(id, action) {
        // adds the learner to the dictionary. Doesnt matter if its already exists as dictionary wont create a duplicate entry
        this.promotionRecommendationDict[id] = this.getPromotionDetailsById(id);
        this.multipleLearnerSelect = Object.keys(this.promotionRecommendationDict).length > 1;
        if (action == 'promote') {
          this.acceptPromotion = true;
          this.displayAdminPromotionModel = true;
          this.adminAction = 'Approve';
        } else if (action == 'deny') {
          this.acceptPromotion = false;
          this.displayAdminPromotionModel = true;
          this.adminAction = 'Deny';
        } else {
          this.displayPromotionModel = true;
        }
      },
      // handles the updating the promotion statuses on server
      // Removes the entry from the displayed page
      handlePromotionUpdateByCoach() {
        this.displayPromotionModel = false;
        const ids = Object.keys(this.promotionRecommendationDict);
        for (var i in ids) {
          for (var j = Object.keys(this.promotionList).length - 1; j >= 0; j--) {
            if (this.promotionList[j].id == ids[i]) {
              this.promotionList.splice(j, 1);
            }
          }
        }
        for (var i in this.promotionRecommendationDict) {
          this.promotionRecommendationDict[i]['promotion_status'] = 'RECOMMENDED';
          this.promotionRecommendationDict[i]['coach_approver'] = this.fullName;
          updatePromotionQueueObjects(this.promotionRecommendationDict[i]);
        }
        this.showSnackbarNotification('learnerRecommendedForPromotion', {
          count: Object.keys(this.promotionRecommendationDict).length,
        });
        this.promotionRecommendationDict = {};
        if (Object.keys(this.promotionList).length == 0) {
          this.promotionList = [];
        }
      },
      handlePromotionUpdateByAdmin() {
        this.displayAdminPromotionModel = false;
        const ids = Object.keys(this.promotionRecommendationDict);
        for (var i in ids) {
          for (var j = Object.keys(this.promotionList).length - 1; j >= 0; j--) {
            if (this.promotionList[j].id == ids[i]) {
              this.promotionList.splice(j, 1);
            }
          }
        }
        for (var i in this.promotionRecommendationDict) {
          if (this.acceptPromotion) {
            this.promotionRecommendationDict[i]['promotion_status'] = 'APPROVED';
          } else {
            this.promotionRecommendationDict[i]['promotion_status'] = 'CANCELLED';
          }
          this.promotionRecommendationDict[i]['admin_approver'] = this.fullName;
          updatePromotionQueueObjects(this.promotionRecommendationDict[i]);
        }

        if (this.acceptPromotion) {
          this.showSnackbarNotification('learnerApprovedForPromotion', {
            count: Object.keys(this.promotionRecommendationDict).length,
          });
        } else {
          this.showSnackbarNotification('learnerDeniedForPromotion', {
            count: Object.keys(this.promotionRecommendationDict).length,
          });
        }

        this.promotionRecommendationDict = {};
        this.acceptPromotion = false;
        if (Object.keys(this.promotionList).length == 0) {
          this.promotionList = [];
        }
      },
      handleCheckboxChange(id) {
        // adds or removes the learner from the dictionary on toggling the selection box
        if (id in this.promotionRecommendationDict) {
          delete this.promotionRecommendationDict[id];
        } else {
          this.promotionRecommendationDict[id] = this.getPromotionDetailsById(id);
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
    },
    $trs: {
      studentPromotionHeader: {
        message: 'Promotion List',
        context:
          'Title for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      studentPromotionSubHeader: {
        message: 'View learners to be promoted and reviewed',
        context:
          'Subtitle for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      studentPromotionEmptySubHeader: {
        message: 'There are no learners to be promoted and reviewed',
        context:
          'Subtitle for promotion section -> Promotion section showing the list of students eligible for promotion',
      },
      promotionStatusLabel: {
        message: 'Status',
        context: 'The current status of the promotion recommendation',
      },
      quizTitleLabel: {
        message: 'Quiz Title',
        context: 'The marks obtained by the learner in the quiz',
      },
      QuizScoreLabel: {
        message: 'Quiz Score',
        context: 'The marks obtained by the learner in the quiz',
      },
      LessonCompletionLabel: {
        message: 'Course Completion',
        context: "The learner's progress in the specific subject",
      },
      RecommendActionLabel: {
        message: 'Recommend',
        context: 'On clicking the button, the selected students will be recommended for promotion',
      },
      statusReviewText: {
        message: 'Needs Review',
        context: 'On clicking the button, the selected students will be recommended for promotion',
      },
      statusRecommendedText: {
        message: 'Recommended',
        context: 'On clicking the button, the selected students will be recommended for promotion',
      },
      coachApproverLabel: {
        message: 'Coach Approver',
        context: 'On clicking the button, the selected students will be recommended for promotion',
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