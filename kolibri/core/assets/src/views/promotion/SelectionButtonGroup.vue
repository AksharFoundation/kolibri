<template>

  <div v-if="showPromotionNotification" class="button-col">
    <span class="message"> {{ selectedMessage }} </span>
    <KButton
      v-if="!isAdminUser"
      :text="$tr('RecommendActionLabel')"
      :primary="true"
      :disabled="buttonsDisabled"
      @click="$emit('recommend')"
    />
    <KButtonGroup v-if="isAdminUser">
      <KButton
        :secondary="true"
        appearance="raised-button"
        text="Deny"
        :disabled="buttonsDisabled"
        @click="$emit('deny')"
      />
      <KButton
        :primary="true"
        appearance="raised-button"
        text="Promote"
        :disabled="buttonsDisabled"
        @click="$emit('promote')"
      />
    </KButtonGroup>
  </div>

</template>
<script>

  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';

  export default {
    name: 'SelectionButtonGroup',
    mixins: [commonCoreStrings],
    props: {
      isAdminUser: {
        type: Boolean,
        required: true,
      },
      showPromotionNotification: {
        type: Boolean,
        required: true,
      },
      count: {
        type: Number,
        required: true,
      },
    },
    computed: {
      buttonsDisabled() {
        return this.count === 0;
      },
      selectedMessage() {
        return this.$tr('learnersSelectedMessage', { count: this.count });
      },
    },
    $trs: {
      learnersSelectedMessage:
        '{count, number} {count, plural, one {student} other {students}} selected',

      RecommendActionLabel: {
        message: 'Recommend',
        context: 'On clicking the button, the selected students will be recommended for promotion',
      },
    },
  };

</script>
<style lang="scss" scoped>

  .button-col {
    padding: 4px;
    padding-top: 24px;
    text-align: right;
  }

  .message {
    display: inline-block;
    margin-right: 16px;
  }

</style>