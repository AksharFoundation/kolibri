<template>

  <Block 
    :allLinkText="$tr('viewAll')"
    :allLinkRoute="notificationListLink()"
    :showAllLink="notificationList.length > 0"
  >

    <p v-if="notificationList.length === 0">
      {{ $tr('noNotificationLabel') }}
    </p>

    <transition-group name="list">
      <BlockItem
        v-for="notification in notificationList"
        :key="notification.id"
      >
        <NotificationCard
          :notification="notification"
          :notificationType="notification.notificationType"
        />
      </BlockItem>
    </transition-group>
  </Block>

</template>


<script>

  import { mapState } from 'vuex';
  import { notificationListLink } from '../classes/classPageLinks';
  import Block from './notification/Block';
  import BlockItem from './notification/BlockItem';
  import NotificationCard from './notification/NotificationCard';

  const MAX_NOTIFICATIONS = 10;

  export default {
    name: 'NotificationBlock',
    components: {
      NotificationCard,
      Block,
      BlockItem,
    },
    computed: {
      ...mapState('classes', ['notifications']),
      notificationList() {
        return this.notifications.slice(0, MAX_NOTIFICATIONS);
      },
      lastQuery() {
        return {
          last: LastPages.HOME_PAGE,
        };
      },
    },
    methods: {
      notificationListLink,
    },
    $trs: {
      viewAll: 'View All',
      noNotificationLabel: 'You do not have any notifications.',
    },
  };

</script>


<style lang="scss" scoped>

</style>
