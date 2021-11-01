<template>

  <div class="notification">
    <div class="icon">
      <KIcon :icon="iconType" />
    </div> 

    <p class="context icon-spacer">
      {{ context }}
    </p>
    <KFixedGrid numCols="4">
      <KFixedGridItem :span="showTime ? 3 : 4">
        <div class="icon-spacer">
          <ContentIcon
            class="content-icon"
            :kind="contentIcon"
            :showTooltip="false"
          />
          <KRouterLink
            v-if="route"
            :text="linkText"
            :to="classAssignmentsLink(notification.classroom_id)"
          />
          <span v-else>
            {{ linkText }}
          </span>
        </div>
      </KFixedGridItem>
      <KFixedGridItem v-if="showTime" :span="1" alignment="right">
        <ElapsedTime :date="date" />
      </KFixedGridItem>
    </KFixedGrid>
  </div>

</template>


<script>

  import ContentIcon from 'kolibri.coreVue.components.ContentIcon';
  import ElapsedTime from 'kolibri.coreVue.components.ElapsedTime';
  import { classAssignmentsLink } from '../../classes/classPageLinks';

  export default {
    name: 'NotificationCard',
    components: {
      ContentIcon,
      ElapsedTime,
    },
    props: {
      notification: {
        type: Object,
        required: true,
      },
      lastQuery: {
        type: Object,
        default: () => ({}),
      },
      showTime: {
        type: Boolean,
        default: false,
      },
      notificationType: {
        type: String,
        default: false,
      },
    },
    computed: {
      contentIcon() {
        if (this.notificationType === 'promotion') {
          return 'learn';
        }

        return 'info';
      },
      context() {
        if (this.notificationType === 'promotion') {
          return this.$tr('promotionLabel');
        }
        return '';
      },
      iconType() {
        if (this.notificationType === 'promotion') {
          if (this.notification.promotion_status === 'LESSONS_PENDING') {
            return 'warningIncomplete';
          }
          if (
            this.notification.promotion_status === 'REVIEW' ||
            this.notification.promotion_status === 'RECOMMENDED'
          ) {
            return 'inProgress';
          }
          if (this.notification.promotion_status === 'APPROVED') {
            return 'mastered';
          }
          if (this.notification.promotion_status === 'CANCELLED') {
            return 'incorrectReport';
          }
        }
        return '';
      },
      date() {
        return new Date(this.notification.update_timestamp);
      },
      linkText() {
        return this.cardTextForNotification();
      },
      route() {
        if (this.notificationType === 'promotion') {
          if (this.notification.promotion_status === 'LESSONS_PENDING') {
            return 'warningIncomplete';
          }
        }
        return null;
      },
    },
    methods: {
      classAssignmentsLink,
      cardTextForNotification() {
        if (this.notificationType === 'promotion') {
          if (this.notification.promotion_status === 'LESSONS_PENDING') {
            return this.$tr('lessonsPending', {
              class: this.notification.classroom_name,
            });
          }
          if (
            this.notification.promotion_status === 'REVIEW' ||
            this.notification.promotion_status === 'RECOMMENDED'
          ) {
            return this.$tr('promotionInProgress', {
              class: this.notification.classroom_name,
            });
          }
          if (this.notification.promotion_status === 'APPROVED') {
            return this.$tr('promotionApproved', {
              class: this.notification.classroom_name,
            });
          }
          if (this.notification.promotion_status === 'CANCELLED') {
            return this.$tr('promotionCancelled', {
              class: this.notification.classroom_name,
            });
          }
        }
      },
    },
    $trs: {
      promotionLabel: 'Promotion status',
      lessonsPending: 'Lessons for {class} class pending.',
      promotionInProgress: '{class} : Evaluation is in progress.',
      promotionApproved: '{class} : Your promotion to next level is approved.',
      promotionCancelled: '{class} : Evaluation is in progress.',
    },
  };

</script>


<style lang="scss" scoped>

  @import '~kolibri-design-system/lib/styles/definitions';

  .icon {
    // vertically align icon
    position: absolute;
    top: 50%;
    left: 2px;
    width: 1.5em;
    height: 1.5em;
    margin-top: -0.75em; // offset height
  }

  .icon-spacer {
    margin-left: 48px;
  }

  .content-icon {
    margin-right: 8px;
  }

  .message {
    font-weight: bold;
  }

  .notification {
    position: relative;
    padding-top: 8px;
    padding-bottom: 8px;
    text-decoration: none;
  }

  .context {
    margin-top: 4px;
    margin-bottom: 4px;
    font-size: small;
    color: gray;
  }

  .button-wrapper {
    position: relative;
  }

  /* Fixes spacing only observed in this notification card content icon */
  /deep/.content-icon svg {
    top: -2px !important;
  }

</style>
