<template>
  <div id="app">
      <!-- <h1>graphical programming</h1> -->
      <homeheader></homeheader>
      <program/>
  </div>
</template>

<script>
import homeheader from '@/views/homeHeader'
 import program from '@/views/Program.vue'
export default {
    components: {
        program,
        homeheader
    }

}
</script>

<style>
#app {
    color: #f33;
}

</style>