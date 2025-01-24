<template>

  <KModal
    :title="$tr('title')"
    :cancelText="coreString('closeAction')"
    size="large"
    @cancel="$emit('cancel')"
  >

    <KFixedGrid
      v-if="categoryGroupIsNested"
      :numCols="12"
      :style="{ margin: '24px' }"
    >
      <KFixedGridItem
        v-for="(nestedObject, key) in displaySelectedCategories"
        :key="key"
        :span="4"
        :disabled="availablePaths && !availablePaths[nestedObject.value]"
        :style="availablePaths && !availablePaths[nestedObject.value] ? { textColor: 'grey' } : {}"
      >
        <KIcon
          icon="info"
          size="large"
        />
        <h2>{{ coreString(camelCase(key)) }}</h2>
        <p
          v-for="(item, nestedKey) in nestedObject.nested"
          :key="item.value"
          :disabled="availablePaths && !availablePaths[item.value]"
          :style="availablePaths && !availablePaths[item.value] ? { textColor: 'grey' } : {}"
          @click="$emit('input', item.value)"
        >
          {{ coreString(camelCase(nestedKey)) }}
        </p>
      </KFixedGridItem>
    </KFixedGrid>
    <KFixedGrid
      v-else
      :numCols="12"
      :style="{ margin: '24px' }"
    >
      <KFixedGridItem
        v-for="(value, key) in displaySelectedCategories"
        :key="value.value"
        :span="4"
        :disabled="availablePaths && !availablePaths[value.value]"
        :style="availablePaths && !availablePaths[value.value] ? { textColor: 'grey' } : {}"
        @click="$emit('input', value.value)"
      >
        <KIcon
          icon="info"
          size="large"
        />
        <h2>{{ coreString(camelCase(key)) }}</h2>
      </KFixedGridItem>
    </KFixedGrid>
  </KModal>

</template>


<script>

  import camelCase from 'lodash/camelCase';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import { Categories, CategoriesLookup } from 'kolibri.coreVue.vuex.constants';
  import plugin_data from 'plugin_data';

  const availablePaths = {};

  if (process.env.NODE_ENV !== 'production') {
    // TODO rtibbles: remove this condition
    Object.assign(availablePaths, CategoriesLookup);
  } else {
    plugin_data.categories.map(key => {
      const paths = key.split('.');
      let path = '';
      for (let path_segment of paths) {
        path = path === '' ? path_segment : path + '.' + path_segment;
        availablePaths[path] = true;
      }
    });
  }

  const libraryCategories = {};

  for (let subjectKey of Object.entries(Categories)
    .sort((a, b) => a[0].length - b[0].length)
    .map(a => a[0])) {
    const ids = Categories[subjectKey].split('.');
    let path = '';
    let nested = libraryCategories;
    for (let fragment of ids) {
      path += fragment;
      if (availablePaths[path]) {
        const nestedKey = CategoriesLookup[path];
        if (!nested[nestedKey]) {
          nested[nestedKey] = {
            value: path,
            nested: {},
          };
        }
        nested = nested[nestedKey].nested;
        path += '.';
      } else {
        break;
      }
    }
  }

  export default {
    name: 'CategorySearchModal',
    mixins: [commonCoreStrings],
    props: {
      selectedCategory: {
        type: String,
        required: true,
        default: null,
      },
      availableLabels: {
        type: Object,
        required: false,
        default: null,
      },
    },
    computed: {
      availablePaths() {
        if (this.availableLabels) {
          const paths = {};
          for (let key of this.availableLabels.categories) {
            const keyPaths = key.split('.');
            let path = '';
            for (let keyPath of keyPaths) {
              path = path === '' ? keyPath : path + '.' + keyPath;
              paths[path] = true;
            }
          }
          return paths;
        }
        return null;
      },
      categoryGroupIsNested() {
        return Object.values(this.displaySelectedCategories).some(
          obj => Object.keys(obj.nested).length
        );
      },
      displaySelectedCategories() {
        return libraryCategories[this.selectedCategory].nested;
      },
    },
    methods: {
      camelCase(val) {
        return camelCase(val);
      },
    },
    $trs: {
      title: {
        message: 'Choose a category',
        context: 'Title of the category selection window',
      },
    },
  };

</script>
