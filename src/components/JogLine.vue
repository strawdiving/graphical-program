<template>
  <div class="innerContainer">
    <div class="title" v-if="title">移动末端</div>
    <div class="content">
      <div v-for="(o, index) in jogTags" :key="index" class="item">
        <span class="item-tag">{{o}}</span>
        <el-button type="info" size="medium" icon="el-icon-arrow-left" @mousedown.native="jogLine(-1, index)" @mouseup.native="stop()"></el-button>
        <el-button type="info" size="medium" icon="el-icon-arrow-right" @mousedown.native="jogLine(1, index)" @mouseup.native="stop()"></el-button>
      </div>
      <div>
        <span class="item-tag">End-fix Move</span>
        <el-button type="info" size="medium" icon="el-icon-arrow-left" @mousedown.native="jogPsi(-1)" @mouseup.native="stop()"></el-button>
        <el-button type="info" size="medium" icon="el-icon-arrow-right" @mousedown.native="jogPsi(1)" @mouseup.native="stop()"></el-button>
      </div>
    </div>
  </div>
</template>

<script>
import {jogTask, stopTask} from '@/api/index'
export default {
  data() {
    return {
      jogTags: ['X', 'Y', 'Z', 'RX', 'RY', 'RZ'],
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
    title: {
      type: Boolean,
      default: true,
    }
  },
  methods: {
    jogPsi(direction){
      let para = {
        deviceId: 1,
        cmd: "jog",
        data: {
          type: 3,
          num: 0,
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

    jogLine(direction, index){
      let para = {
        deviceId: 1,
        cmd: "jog",
        data: {
          type: 1,
          num: index + 1,
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
  text-align: center;
}
.title {
  text-align: left;
  padding-left: 10px;
  padding-top: 10px;
  padding-bottom: 20px;
  font-size: 16px;
  color:#ffffff;
  background-color: #717d98;
}
.item {
  height: 50px;
}
.item-tag{
  width: 100px;
  padding-right: 5px;
  display: inline-block;
}
</style>
