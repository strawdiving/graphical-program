<template>
  <div class="container">
    <el-col :span="8">
      <pos></pos>
    </el-col>
    <el-col :span="16">
      <jog></jog>
    </el-col>
    <div class="button">
      <el-button @click="recordPos">记录该点</el-button>
      <el-button type="primary" @mousedown.native="moveInit" @mouseup.native="stop">归零</el-button>
    </div>
  </div>    
</template>

<script>
import Jog from '@/components/Jog'
import Pos from '@/components/Pos'
import {stopTask} from '@/api/index'
export default {
  data(){
    return {

    }
  },
  methods: {
    moveInit() {

    },
    stop() {
      stopTask().then((res) => {
        console.log(res)
      }).catch((err) => {
        console.log(err)
      })
    },
    recordPos() {
      this.$emit('record-pos')
    }
  },
  components: {
    Jog,
    Pos,
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  height: 400px;
}
.button {
  position: absolute;
  top: 420px;
  left: 40px;
}
</style>
