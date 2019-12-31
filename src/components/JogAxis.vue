<template>
  <div class="innerContainer">
    <div class="title" v-if="title">移动关节</div>
    <div class="content">
      <div class="item" v-for="(o, index) in 7" :key="index">
        <!-- <div class="test"> -->
        <span class="tag">axis {{o}}</span>
        <s-progress class="progress" :val="jointPos[index]" :min=-180 :max=180></s-progress>
        <span class="group">
        <el-button type="info" icon="el-icon-arrow-left" size="small" @mousedown.native="jogAxis(-1, index)" @mouseup.native="stop()" ></el-button>
        <span class="value">{{jointPos[index]}}°</span>
        <el-button type="info" icon="el-icon-arrow-right" size="small" @mousedown.native="jogAxis(1, index)" @mouseup.native="stop()"></el-button>
      </span>
      </div>
    </div>
  </div>
</template>

<script>
import SProgress from '@/components/SProgress'
import {jogTask, stopTask} from '@/api/index'
export default {
  data() {
    return {

    }
  },
  props: {
    speed:{
      type: Number,
      default: 50,
      validator: function (value) {
        return value>=0 && value <=100
      }
    },
    title:{
      type: Boolean,
      default: true
    }
  },
  methods: {
    jogAxis(direction, index) {
      console.log('jog back ' + index)
      let para = {
        deviceId: 1,
        cmd: "jog",
        data: {
          type: 2,
          num: index,
          direction: direction,
          speed: this.speed
        }
      }
      jogTask(para).then((res) => {
        console.log(res)
      }).catch((err) => {
        console.log(err)
      })
    },
    stop(){
      console.log('stop')
      stopTask().then((res) => {
        console.log(res)
      }).catch((err) => {
        console.log(err)
      })
    },
  },
  mounted() {

  },
  computed: {
    jointPos(){
      var pos = []
      for (let i = 0; i < 7; i++) {
        let v = this.$store.state.status.fromPLC.jointInfo[i].actualPos
        pos.push(Math.round(v * 100)/100)
      }
      return pos
    }
  },
  components: {
    SProgress
  }
}
</script>

<style scoped>
.innerContainer {
  /*width: 95%;*/
  height: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
}
.content {
  padding: 10px 20px;
}
.title {
  text-align: left;
  padding-left: 10px;
  padding-top: 10px;
  padding-bottom: 20px;
  font-size: 16px;
  color: #ffffff;
  background-color: #717d98;
}
.item {
  height: 40px;
  padding: 5px;
}
.tag {
  padding-right: 5px;
}
.group {
  padding-left: 5px;
  display: inline-block;
}
.value {
  width: 45px;
  display: inline-block;
  font-size: 14px;
}
.progress {
  width: 25%;
  font-size: 10px;
  padding-left: 10px;
  padding-right: 10px;
  display: inline-block;
}
</style>
