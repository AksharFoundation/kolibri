<template>

  <KPageContainer>
    <transition-group name="list">
      <BlockItem
        v-for="notification in notifications"
        :key="notification.id"
      >
        <NotificationCard
          :notification="notification"
          :notificationType="notification.notificationType"
        />
      </BlockItem>
    </transition-group>
  </KPageContainer>

</template>


<script>

  import { mapState } from 'vuex';
  import NotificationCard from '../cards/notification/NotificationCard.vue';
  import BlockItem from '../cards/notification/BlockItem.vue';

  export default {
    name: 'AllNotificationsPage',
    components: {
      BlockItem,
      NotificationCard,
    },
    computed: {
      ...mapState('classes', ['notifications']),
    },
    $trs: {
      back: {
        message: 'All Classes',
        context:
          "Tab name of the main 'Class' section where the coach can see all the information relating to a specific class.\n",
      },
    },
  };

</script>


<style lang="scss" scoped>

  .show-more {
    height: 100px;
  }

</style>
