<template>
  <el-tabs type="card" class="jog-container">
    <el-tab-pane label="移动关节">
      <jog-axis :speed = speed :title="false"></jog-axis>
    </el-tab-pane>
    <el-tab-pane label="移动末端">
      <jog-line :speed=speed :title="false"></jog-line>
    </el-tab-pane>
    <el-tab-pane label="牵引">
      <div class="drag-area">
        <div v-if="!axisDragSet" class="drag-div">
          <el-button type="primary" @click="startDrag" class="drag">牵引</el-button>
          <el-slider v-model="dragCompliance" :show-tooltip="false"></el-slider>
          <div>牵引柔顺度 {{dragCompliance}}</div>
        </div>
        <div v-else class="drag-div">
          <div v-for="(o, index) in 7" :key="index" class="drag-item">
            <span class="drag-tag">{{o}}</span>
            <el-slider v-model="axisCompliance[index]"></el-slider>
            <span>{{axisCompliance[index]}}</span>
          </div>
        </div>
        <el-button @click="switchDragSet">关节柔顺度设置</el-button>
      </div>
    </el-tab-pane>
    <el-tab-pane label="速度调节">
      <div class="speed-area">
        <span class="speed-text">{{speed}}%</span>
        <el-slider v-model="speed" :show-tooltip="false"></el-slider>
      </div>
    </el-tab-pane>
  </el-tabs>
  <!-- <div class="container">

  </div> -->
</template>

<script>
import JogAxis from '@/components/JogAxis'
import Pos from '@/components/Pos'
import JogLine from '@/components/JogLine'
export default {
  data() {
    return {
     speed: 50,
     dragCompliance: 50,
     axisDragSet: false,
     axisCompliance: [50,50,50,50,50,50,50]
    }
  },
  
  methods: {
    startDrag() {

    },
    switchDragSet() {
      this.axisDragSet = !this.axisDragSet
    }
  },
  components: {
    JogAxis,
    JogLine,
    Pos,
  },
}
</script>

<style lang="scss" scoped>
.jog-container {
  width: 95%;
  height: 400px;
  background: #fff;  
}
.el-progress {
  width: 200px;
  font-size: 10px; 
  display: inline-block;
}
.drag-area {
  width: 90%;
  height: 100%;
  margin: auto;
  margin-top: 10px;
}
.drag-area .el-slider{
  
}
.drag-div {
  height: 280px;
}
.drag {
  margin-top: 30px;
  margin-bottom: 20px;
}
.drag-item {
  width: 100%;
  height: 40px;
  font-size: 14px;
  display: -webkit-box;
  -webkit-box-pack: left;
  -webkit-box-align: center;
}
.drag-item .drag-tag {
  width: 20px;
}
.drag-item .el-slider {
  width: 80%;
  padding-left: 20px;
  padding-right: 20px;
}
.speed-area {
  width: 90%;
  margin: auto;
}
</style>
