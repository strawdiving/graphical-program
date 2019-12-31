<template>
  <div class="progress-outer" :style="{height: strokeWidth + 'px'}">
    <div class="progress-inner" :style="progress_style">
    </div>
  </div>
</template>
<script>
export default {
  data(){
    return {
      
    }
  },
  props: {
    max: Number,
    min: Number,
    val: {
      type: Number,
      default: 0,
      required: true,
    },
    width: {
      type: Number,
      default: 126,
    },
    strokeWidth: {
      type: Number,
      default: 10
    }
  },
  computed: {
    scale(){
      return 1/(this.max - this.min)
    },
    value(){
      if (this.val > this.max) {
        return this.max
      }
      if (this.val < this.min) {
        return this.min
      }
      return this.val
    },
    barWidth(){
      return Math.abs(this.value) * this.scale
    },
    left(){
      if (this.value > 0) {
        return (0-this.min) * this.scale
      } else {
        return (this.value - this.min) * this.scale
      }
    },
    progress_style() {
      var style = {
      'background' : '#3c9af8',
      'width': this.barWidth * 100  + '%',
      'margin-left' : this.left * 100  + '%',
      'height': '10px',
      }
      return style
    }
  }
}
</script>

<style scoped>
.progress-outer {
  border: 1px solid #a0a0a0;
  /* width: 200px; */
  background-color: #f0f0f0;
}
.start {
  width: 1px;
  height: 10px;
  background: #a0a0a0;
  margin-left: 100px;
  position: absolute;
}

</style>
