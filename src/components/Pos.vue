<template>
  <div class="pos-container">
    <!-- <el-col :span="12" class="pos-area bg-purple">
      <div class="pos-group">
        <span>关节角度 / °</span>
      </div>
      <div v-for="(o, index) in 7" :key="o" class="text item1">
        <span class="pos-tag">{{'关节 ' + o}}</span>
        <span class="pos-value">{{$store.state.jointPos[index]}}</span>
      </div>
    </el-col> -->

    <div :span="24" class="pos-area bg-purple">
      <div class="title">位置 / mm</div>
      <div class="content">
        <div v-for="(o, index) in cordTag" :key="o" class="text item2">
          <div class="pos-tag">{{o}}</div>
          <div class="pos-value">{{cordPos[index]}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cordTag: ['X', 'Y', 'Z', 'RX', 'RY', 'RZ']
    }
  },
  computed: {
    cordPos() {
      let pos = this.$store.state.status.fromPLC.cartesianInfo.actPos
      return pos.map(x=>Math.round(x*100)/100)
    }
  }
}
</script>

<style scoped>
  .content {
    padding: 10px 0;
  }
.text {
  font-size: 14px;
}
.item1 {
  height: 36px;
  text-align: left;
}
.item2 {
  height: 40px;
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
.pos-container {
  /*width: 220px;*/
  width: 100%;
  height: 100%;
  /*height: 300px;*/
  float: left;
  background: #fff;
}
.pos-container .el-col{
  border: 1px solid grey;
}

.pos-tag {
  margin-left: 10px;
  width:40px;
  display: inline-block;
  text-align: center;
}
.pos-value {
  margin-left: 80px;
  display: inline-block;
  width: 70px;
  line-height: 28px;
  text-align: center;
  border:1px solid #aaa;
  border-radius: 2px;
  background-color: #eee;
}
</style>
