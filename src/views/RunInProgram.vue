<template>
  <div class="container">
    <el-col :span="24">
      <div class="importScript">
        <p class="prog-name">
          <span>&nbsp;&nbsp;{{scriptName}}</span>
          <span class="program-status">{{programStatus}}</span>
        </p>
        <!-- <textarea ref="tv" class="prog-content" readonly wrap="off" v-model="script">
        </textarea> -->
      </div>
      <div class="move" v-if="moveVisible">
        <button @mousedown="moveStartPoint" @mouseup="moveStartRelease">按住移动</button>
      </div>
      <div class="control">
        <div class="speed">
          <span>速度</span>
          <el-slider class="speed-slider" v-model="speed" :show-tooltip="false" :min="5" :max="100" @change="adjustSpeed"></el-slider>
          <span>{{speed}} %</span>
        </div>

        <div class="control-group">
          <el-button @click="runProgram" type="primary">启动</el-button>
          <el-button @click="stopProgram" type="primary">停止</el-button>
          <el-button @click="pauseProgram" type="primary">暂停</el-button>
          <el-button @click="stepProgram" type="primary">单步</el-button>
        </div>
      </div>
    </el-col>
  </div>
</template>

<script>
  import {getScripts, readScript, scriptTask, stopTask, moveTo} from '@/api/index'
  export default {
    data() {
      return {
        scriptName: '',
        selectName: '',
        scriptList: [],
        script: '',
        scriptContent: [],
        listLoading: false,
        contentLoading: false,
        selectListVisible: false,
        speed: 50,
        debugMsg: [],
        programStatus: '就绪',
        // ['就绪', '运行中', '暂停', '单步运行']
        //定时器id
        intervalId: 0,

        // 是否需要检查起始点
        checkStartPoint: true,
        programAxisMoveTo: [],
        xyzMoveTo: [],
        startPointMoveType: 0,

        moveVisible: false,
      }
    },
    computed: {
      programRun(){
        return this.$store.state.status.progInfo.progRunning
      },
      debugUpdate(){
        return this.$store.state.status.progInfo.printIndex
      },
      jointPos() {
        var pos = []
        for (let i = 0; i < 7; i++) {
          let v = this.$store.state.status.fromPLC.jointInfo[i].actualPos
          pos.push(v)
        }
        return pos
      },
      cordPos() {
        return this.$store.state.status.fromPLC.cartesianInfo.actPos
      },
      programLine() {
        return this.$store.state.status.progInfo.programLine
      }
    },
    props: {
      name: {
        type: String,
      }
    },
    methods: {
      // 获取脚本文件列表
      requireList() {
        this.listLoading = true
        getScripts().then((res) => {
          this.scriptList = res.data.data
          this.listLoading = false

        }).catch((err) => {
          console.log(err)
        })
      },
      //获取脚本文件内容
      requireScript(name) {
        let para = {
          name:name
        }
        this.contentLoading = true
        readScript(para).then((res) => {
          this.contentLoading = false
          this.script = res.data.content
          // console.log(this.script)
          this.scriptContent = this.script.trim().split('\n')
          // console.log(this.scriptContent)
          // this.programStatus =
        }).catch((err) => {
          console.log(err)
        })
      },
      runProgram(){
        // if (this.name == null) {
        //   return
        // }


        // check if need to move to the start point manually
        if (this.checkStartPoint) {
          console.log('hello')
          var index = 0
          var line = this.scriptContent[index]
          var keyword = line.split('(')[0].trim()
          while (!['Start', 'MoveJ', 'MoveL', 'MoveC_1', 'movej', 'movel', 'movec', 'movec_1'].includes(keyword)) {
            if (index == this.scriptContent.length - 1) break
            line = this.scriptContent[++index]
            keyword = line.split('(')[0].trim()
          }
          if (['Start', 'MoveJ', 'MoveL', 'MoveC_1', 'movej'].includes(keyword)) {
            let para = []
            let pass = false
            if (keyword == 'movej') {
              para = line.split('([')[1].split('],')[0].split(',')
              if (para.length != 7)  pass = true
            } else {
              para = line.split('(')[1].split(')')[0].split(',')
            }

            let variance = 0
            for (let i = 0; i < 7; i++) {
              if (keyword == 'movej') {
                variance += Math.abs(para[i] - this.jointPos[i])
              } else {
                variance += Math.abs(para[i + 8] - this.jointPos[i])
              }
            }

            if (variance > 1 && !pass) {
              if (keyword == 'movej') {
                for(let i = 0; i < 7; i++) this.programAxisMoveTo[i] = Number(para[i])
              } else {
                for(let i = 8; i < 15; i++) this.programAxisMoveTo[i - 8] = Number(para[i])
              }

              ///
              this.moveVisible = true
              this.startPointMoveType = 0
              console.log(this.programAxisMoveTo)
              return
            }
          }

          if (['movel', 'movec', 'movec_1'].includes(keyword)) {
            let para = []
            let pass = false
            para = line.split('([')[1].split('],')[0].split(',')
            if (para.length != 6) pass = true

            let variance = 0
            for(let i = 0; i < 6; i++){
              variance += Math.abs(para[i] - this.cordPos[i])
            }
            if (variance > 1 && !pass) {
              for(let i = 0; i < 7; i++) this.xyzMoveTo[i] = Number(para[i])

              //
              this.moveVisible = true
              this.startPointMoveType = 1
              console.log(this.xyzMoveTo)
              return
            }
          }
        }

        this.moveVisible = false
        this.checkStartPoint = true
        this.handleScriptTask(this.name, 'start', this.speed)
      },
      stopProgram(){
        this.handleScriptTask(this.name, 'stop', this.speed)
      },
      pauseProgram(){
        this.handleScriptTask(this.name, 'pause', this.speed)
      },
      stepProgram(){
        this.handleScriptTask(this.name, 'step', this.speed)
      },
      adjustSpeed(val){
        this.handleScriptTask(this.name, 'adjustSpeed', val)
      },

      handleScriptTask(name, task, speed){
        if (this.name === '') {
          this.$message({
            message: '请选择程序文件',
            type: 'warning'})
          return
        }
        if (!['start', 'stop', 'step', 'pause', 'adjustSpeed'].includes(task)) {
          return
        }
        if (speed < 5 || speed > 100) {
          return
        }
        let para = {
          deviceId: 1,
          cmd: "script",
          data: {
            name: name,
            task: task,
            speed: speed
          }
        }
        scriptTask(para).then((res) => {
          console.log(res)
        }).catch((err) => {
          console.log(err)
        })
      },

        // 移动到启动点
      moveStartPoint() {
        if (this.startPointMoveType == 0) {
          moveTo(0, this.programAxisMoveTo, 80).then((res)=>{

          }).catch((err)=>{

          })
        } else if (this.startPointMoveType == 1) {
          moveTo(3, this.xyzMoveTo, 80).then((res)=>{

          }).catch((err)=>{

          })
        }
      },
      moveStartRelease() {
        stopTask()
      },

    },
    mounted() {
      if (this.name == null) {
        return
      }
      this.requireScript(this.name)
    }
  }
</script>

<style scoped>
  .container {
    padding: 20px;
    min-height: 140px;
    min-width: 100px;
  }
  /* TODO 字体*/
  .font-index {

  }
  .importScript {
    margin-bottom: 30px;
  }
  .prog-name {
    text-align: left;
    margin-left: 5px;
    height: 35px;
  }
  .program-status {
    margin-right: 15%;
    margin-top: 15px;
    float: right;
  }

  .debug-div {
    width: 90%;
    height: 100px;
    margin-top: 60px;
    background: #fff;
    overflow: auto
  }
  .speed {
    width: 90%;
    height: 40px;
    display: -webkit-box;
    -webkit-box-pack: start;
    -webkit-box-align: center;
  }
  .speed .el-slider {
    padding-left: 10px;
    padding-right: 20px;
    width: 75%;
  }
  .control-group {
    height: 60px;
    display: -webkit-box;
    -webkit-box-pack: center;
    -webkit-box-align: center;
  }
  .control-group .el-button {
    margin-right: 20px;
  }
  .run-dialog {
    width: 80%;
  }
  .button-group {
    text-align: right;
    padding-right: 10px;
  }
  .run-btn {
    margin-top: 40px;
  }
  .move {
  margin-top: 20px;
  margin-right: 50px;
  }
</style>

