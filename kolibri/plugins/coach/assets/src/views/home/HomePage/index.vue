<template>

  <CoreBase
    :immersivePage="false"
    :authorized="userIsAuthorized"
    authorizedRole="adminOrCoach"
    :showSubNav="true"
  >

    <template #sub-nav>
      <TopNavbar />
    </template>

    <KGrid gutter="16">
      <KGridItem>
        <OverviewBlock />
      </KGridItem>
      <KGridItem :layout12="{ span: 6 }">
        <KGrid gutter="16">
          <KGridItem>
            <QuizzesBlock />
          </KGridItem>
          <KGridItem>
            <LessonsBlock />
          </KGridItem>
        </KGrid>
      </KGridItem>
      <KGridItem :layout12="{ span: 6 }">
        <ActivityBlock />
      </KGridItem>
    </KGrid>
    <PromotionNotification
      :promotions="promotions"
      role="Coach"
    /> 
  </CoreBase>

</template>


<script>

  import PromotionNotification from 'kolibri.coreVue.components.PromotionNotification';
  import commonCoach from '../../common';
  import OverviewBlock from './OverviewBlock';
  import ActivityBlock from './ActivityBlock';
  import LessonsBlock from './LessonsBlock';
  import QuizzesBlock from './QuizzesBlock';

  export default {
    name: 'HomePage',
    components: {
      OverviewBlock,
      ActivityBlock,
      LessonsBlock,
      QuizzesBlock,
      PromotionNotification,
    },
    mixins: [commonCoach],
  };

</script>


<style lang="scss" scoped>

  .new-coach-block {
    min-width: 0;
  }

</style>
