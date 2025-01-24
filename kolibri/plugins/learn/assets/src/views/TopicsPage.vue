<template>

  <div>
    <div v-if="currentChannelIsCustom">
      <CustomContentRenderer :topic="topic" />
    </div>


    <div v-else class="page">

      <div class="header">

        <KGrid>
          <KGridItem
            :layout4="{ span: 4 }"
            :layout8="{ span: 8 }"
            :layout12="{ span: 12 }"
          >
            <h3 class="title">
              {{ topicOrChannel.title }}
            </h3>
          </KGridItem>

          <KGridItem
            v-if="topicOrChannel['thumbnail']"
            class="thumbnail"
            :layout4="{ span: 1 }"
            :layout8="{ span: 2 }"
            :layout12="{ span: 2 }"
          >
            <CardThumbnail
              class="thumbnail"
              :thumbnail="topicOrChannel['thumbnail']"
              :isMobile="windowIsSmall"
              :showTooltip="false"
              kind="channel"
              :showContentIcon="false"
            />
          </KGridItem>

          <!-- tagline or description -->
          <KGridItem
            v-if="getTagline"
            class="text"
            :layout4="{ span: topicOrChannel['thumbnail'] ? 3 : 4 }"
            :layout8="{ span: topicOrChannel['thumbnail'] ? 6 : 8 }"
            :layout12="{ span: topicOrChannel['thumbnail'] ? 10 : 12 }"
          >
            {{ getTagline }}
          </KGridItem>
        </KGrid>
        <div class="tabs">
          <KButton
            ref="tab_button"
            :text="coreString('folders')"
            appearance="flat-button"
            class="tab-button"
            :appearanceOverrides="customTabButtonOverrides"
            @click="toggleSidebarView('folder')"
          />
          <KButton
            ref="tab_button"
            :text="coreString('searchLabel')"
            appearance="flat-button"
            class="tab-button"
            :appearanceOverrides="customTabButtonOverrides"
            @click="toggleSidebarView('search')"
          />
        </div>
      </div>
      <div>
        <KGrid
          class="main-content-grid"
        >
          <EmbeddedSidePanel
            v-if="!windowIsSmall"
            topicPage="True"
            :topics="topics"
            :topicsListDisplayed="activeTab === 'folder'"
            width="3"
            @openModal="handleShowSearchModal"
          />
          <KGridItem
            :layout="{ span: 3 }"
            class="side-panel"
          />
          <KGridItem
            class="card-grid"
            :layout="{ span: 8 }"
          >
            <KGridItem
              class="breadcrumbs"
              :layout4="{ span: 4 }"
              :layout8="{ span: 8 }"
              :layout12="{ span: 12 }"
            >
              <slot name="breadcrumbs"></slot>
            </KGridItem>
            <div v-if="!displayingSearchResults">
              <div v-for="t in topics" :key="t.id">
                <h3>
                  {{ t.title }}
                </h3>
                <ContentCardGroupGrid
                  v-if="t.children.results && t.children.results.length"
                  :contents="t.children.results"
                  :channelThumbnail="topicOrChannel['thumbnail']"
                  cardViewStyle="card"
                  @toggleInfoPanel="toggleInfoPanel"
                />
                <KButton
                  v-if="t.children && t.children.more"
                  @click="childLoadMore(t.children.more)"
                >
                  {{ $tr('viewMore') }}
                </KButton>
              </div>
              <ContentCardGroupGrid
                v-if="resources.length"
                :contents="resources"
                :channelThumbnail="topicOrChannel['thumbnail']"
                @toggleInfoPanel="toggleInfoPanel"
              />
              <KButton v-if="topic.children && topic.children.more" @click="loadMore()">
                {{ $tr('viewMore') }}
              </KButton>
            </div>
            <div v-else>
              <h2>{{ results }}</h2>
              <KCircularLoader
                v-if="loading"
                class="loader"
                type="indeterminate"
                :delay="false"
              />
            </div>
          </KGridItem>
        </KGrid>

      </div>

    </div>
    <FullScreenSidePanel
      v-if="sidePanelContent"
      @closePanel="sidePanelContent = null"
    >
      <BrowseResourceMetadata :content="sidePanelContent" :canDownloadContent="true" />
    </FullScreenSidePanel>
  </div>

</template>


<script>

  import { mapMutations, mapState } from 'vuex';
  import responsiveWindowMixin from 'kolibri.coreVue.mixins.responsiveWindowMixin';
  import { ContentNodeKinds } from 'kolibri.coreVue.vuex.constants';
  import { ContentNodeResource } from 'kolibri.resources';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import FullScreenSidePanel from 'kolibri.coreVue.components.FullScreenSidePanel';
  import commonCoach from '../../../../../plugins/coach/assets/src/views/common';
  import BrowseResourceMetadata from './BrowseResourceMetadata';
  import ContentCardGroupGrid from './ContentCardGroupGrid';
  import EmbeddedSidePanel from './EmbeddedSidePanel';
  import CustomContentRenderer from './ChannelRenderer/CustomContentRenderer';
  import CardThumbnail from './ContentCard/CardThumbnail';
  import plugin_data from 'plugin_data';

  export default {
    name: 'TopicsPage',
    metaInfo() {
      let title;
      if (this.isRoot) {
        title = this.$tr('documentTitleForChannel', {
          channelTitle: this.channelTitle,
        });
      } else {
        title = this.$tr('documentTitleForTopic', {
          channelTitle: this.channelTitle,
          topicTitle: this.topic.title,
        });
      }
      return { title };
    },
    components: {
      BrowseResourceMetadata,
      CardThumbnail,
      ContentCardGroupGrid,
      CustomContentRenderer,
      EmbeddedSidePanel,
      FullScreenSidePanel,
    },
    mixins: [commonCoach, responsiveWindowMixin, commonCoreStrings],
    data: function() {
      return {
        activeTab: 'folders',
        sidePanelContent: null,
      };
    },
    computed: {
      ...mapState('topicsTree', ['channel', 'contents', 'isRoot', 'topic']),
      channelTitle() {
        return this.channel.title;
      },
      resources() {
        return this.contents.filter(content => content.kind !== ContentNodeKinds.TOPIC);
      },
      topics() {
        return this.contents.filter(content => content.kind === ContentNodeKinds.TOPIC);
      },
      topicOrChannel() {
        // Get the channel if we're root, topic if not
        return this.isRoot ? this.channel : this.topic;
      },
      currentChannelIsCustom() {
        if (
          plugin_data.enableCustomChannelNav &&
          this.topic &&
          this.topic.options.modality === 'CUSTOM_NAVIGATION'
        ) {
          return true;
        }
        return false;
      },
      getTagline() {
        return this.topicOrChannel['tagline'] || this.topicOrChannel['description'] || null;
      },
      customTabButtonOverrides() {
        return {
          textTransform: 'capitalize',
          paddingBottom: '10px',
          fontWeight: 'normal',
          ':hover': {
            color: this.$themeTokens.primary,
            'background-color': this.$themeTokens.surface,
            borderBottom: `2px solid ${this.$themeTokens.primary}`,
          },
        };
      },
    },
    methods: {
      ...mapMutations('topicsTree', ['ADD_MORE_CONTENTS', 'ADD_MORE_CHILD_CONTENTS']),
      loadMore() {
        return ContentNodeResource.fetchTree(this.topic.children.more).then(data => {
          this.ADD_MORE_CONTENTS(data.children);
        });
      },
      childLoadMore(more) {
        return ContentNodeResource.fetchTree(more).then(data => {
          const index = this.contents.findIndex(content => content.id === more.id);
          this.ADD_MORE_CHILD_CONTENTS({ index, ...data.children });
        });
      },
      handleShowSearchModal(value) {
        this.currentCategory = value;
        this.showSearchModal = true;
      },
      toggleSidebarView(value) {
        this.activeTab = value;
      },
      toggleInfoPanel(content) {
        this.sidePanelContent = content;
      },
    },
    $trs: {
      documentTitleForChannel: {
        message: 'Folders - { channelTitle }',
        context:
          'A folder is a collection of resources and other subfolders within a channel. This string indicates the folders grouped under a specific channel.',
      },
      documentTitleForTopic: {
        message: '{ topicTitle } - { channelTitle }',
        context: 'DO NOT TRANSLATE\nCopy the source string.',
      },
      viewMore: 'View more',
      /* eslint-disable kolibri/vue-no-unused-translations */
      showMore: {
        message: 'Show more',
        context: 'Clickable link which allows to load more resources.',
      },
      viewAll: {
        message: 'View all',
        context: 'Clickable link which allows to display all resources in a topic.',
      },
      /* eslint-disable kolibri/vue-no-unused-translations */
    },
  };

</script>


<style lang="scss" scoped>

  .header {
    position: fixed;
    z-index: 4;
    width: 100%;
    height: 300px;
    padding-top: 32px;
    padding-bottom: 0;
    padding-left: 32px;
    background-color: white;
    border: 1px solid #dedede;
  }

  .tabs {
    position: absolute;
    bottom: 0;
  }

  .tab-button {
    padding: 18px;
    border-bottom: 2px solid transparent;
  }

  .main-content-grid {
    position: relative;
    top: 300px;
  }

  .text {
    max-width: 920px;
  }

  /deep/.side-panel {
    padding-bottom: 450px !important;
  }

  /deep/.card-thumbnail-wrapper {
    max-width: 100%;
    height: 110px;
    border: 1px solid #dedede;
  }

</style>
