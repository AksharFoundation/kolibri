<template>

  <div class="content-grid">
    <KFixedGrid v-if="cardViewStyle === 'card'" numCols="3" gutter="24">
      <KFixedGridItem v-for="content in contents" :key="content.id" span="1">
        <ContentCard
          class="grid-item"
          :isMobile="windowIsSmall"
          :title="content.title"
          :thumbnail="setContentThumbnail(content)"
          :kind="content.kind"
          :isLeaf="content.is_leaf"
          :progress="content.progress || 0"
          :numCoachContents="content.num_coach_contents"
          :link="genContentLink(content.id, content.is_leaf)"
          :contentId="content.content_id"
          :copiesCount="content.copies_count"
          :channelThumbnail="setChannelThumbnail(content)"
          :channelTitle="channelTitle(content)"
          @openCopiesModal="openCopiesModal"
          @toggleInfoPanel="$emit('toggleInfoPanel', content)"
        />
      </KFixedGridItem>
    </KFixedGrid>
    <ContentCardListViewItem
      v-for="content in contents"
      v-else
      :key="content.id"
      :channelThumbnail="setChannelThumbnail(content)"
      :channelTitle="channelTitle(content)"
      :description="content.description"
      class="grid-item"
      :isMobile="windowIsSmall"
      :title="content.title"
      :thumbnail="content.thumbnail"
      :kind="content.kind"
      :isLeaf="content.is_leaf"
      :progress="content.progress || 0"
      :numCoachContents="content.num_coach_contents"
      :link="genContentLink(content.id, content.is_leaf)"
      :contentId="content.content_id"
      :copiesCount="content.copies_count"
      @openCopiesModal="openCopiesModal"
      @toggleInfoPanel="$emit('toggleInfoPanel', content)"
    />
    <CopiesModal
      v-if="modalIsOpen"
      :uniqueId="uniqueId"
      :sharedContentId="sharedContentId"
      @submit="modalIsOpen = false"
    />
  </div>

</template>


<script>

  import { mapState } from 'vuex';
  import responsiveWindowMixin from 'kolibri.coreVue.mixins.responsiveWindowMixin';
  import genContentLink from '../utils/genContentLink';
  import ContentCard from './ContentCard';
  import ContentCardListViewItem from './ContentCardListViewItem';
  import CopiesModal from './CopiesModal';

  export default {
    name: 'ContentCardGroupGrid',
    components: {
      ContentCard,
      CopiesModal,
      ContentCardListViewItem,
    },
    mixins: [responsiveWindowMixin],
    props: {
      contents: {
        type: Array,
        required: true,
      },
      cardViewStyle: {
        type: String,
        required: true,
        default: 'card',
        validator(value) {
          return ['card', 'list'].includes(value);
        },
      },
      channelThumbnail: {
        type: String,
        required: false,
        default: null,
      },
    },
    data: () => ({
      modalIsOpen: false,
      sharedContentId: null,
      uniqueId: null,
    }),
    computed: {
      ...mapState('topicsRoot', { channels: 'rootNodes' }),
    },
    methods: {
      genContentLink,
      openCopiesModal(contentId) {
        this.sharedContentId = contentId;
        this.uniqueId = this.contents.find(content => content.content_id === contentId).id;
        this.modalIsOpen = true;
      },
      setChannelThumbnail(content) {
        if (this.channelThumbnail) {
          return this.channelThumbnail;
        } else {
          let match = this.channels.find(channel => channel.id === content.channel_id);
          return match ? match.thumbnail : null;
        }
      },
      setContentThumbnail(content) {
        if (content.thumbnail) {
          return content.thumbnail;
        }
      },
      channelTitle(content) {
        let match = this.channels.find(channel => channel.id === content.channel_id);
        return match ? match.title : null;
      },
    },
  };

</script>


<style lang="scss" scoped>

  $gutters: 16px;

  .grid-item {
    margin-bottom: $gutters;
  }

</style>
