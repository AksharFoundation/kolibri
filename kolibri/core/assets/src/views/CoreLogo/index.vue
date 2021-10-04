<template>

  <img v-if="src" :src="src">
  <img v-else src="./akshar-logo.png">

</template>


<script type="text/javascript">

  export default {
    name: 'CoreLogo',
    props: {
      src: {
        type: String,
        default: null,
      },
    },
  };

</script>
