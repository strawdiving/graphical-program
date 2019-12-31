<template>
  <div>
      header
      <span>color</span>
      <img src="@/assets/images/logo.png">
      {{this.message}} - {{this.user}}
  </div>
</template>

<script>
export default {
    name: 'homeHeader',
    data() {
        return {
            message: 'hello world'
        }
    },
    props: {
        user: String
    }

}
</script>

<style>
span {
    color: green
}

</style>