<template>
  <section>
    <div id="program">
      <div class="app-aside">
        <!--<div class="app-title">-->
          <!--<h1>WebUI</h1>-->
        <!--</div>-->
        <div class="stencil-container"></div>
        <!--</div>-->
      </div>
      <div class="app-body">
        <div class="toolbar-container"></div>
        <div class="paper-container"></div>
        <div class="inspector-container"></div>
      </div>
    </div>
    <el-row class="control-group">
      <div class="fileOperation">
        <el-button type="primary" class="new" @click="createProgram">新建程序</el-button>
        <el-button type="primary" class="open" @click="openProgram">打开程序</el-button>
        <el-button type="primary" class="export" @click="exportCode">保存程序</el-button>
        <el-dialog class="create-dialog" title="新建程序" :visible.sync="createVisible" :close-on-click-modal="false" center>
          <el-form :model="form" :rules="rules" label-width="100px" ref="form" class="nameForm">
            <el-form-item label="程序名称: " prop="name">
              <el-input v-model="form.name" auto-complete="off" size="mini"></el-input>
            </el-form-item>
          </el-form>
          <span slot="footer" class="dialog-footer">
            <el-button @click="createVisible = false">取 消</el-button>
            <el-button type="primary" @click="startProgram('form')">确 定</el-button>
          </span>
        </el-dialog>
        <el-dialog
          title="导出代码"
          :visible.sync="dialogVisible"
          width="50%">
          <div>
            <label>程序预览：</label>
            <span>{{code}}</span>
          </div>

          <el-form :model="form" :rules="rules" label-width="100px" ref="form" class="nameForm">
            <el-form-item label="程序名称: " prop="name">
              <el-input v-model="form.name" auto-complete="off" size="mini">{{form.name}}</el-input>
            </el-form-item>
          </el-form>

          <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="sendProgram">确 定</el-button>
        </span>
        </el-dialog>
        <el-dialog class="open-dialog" title="打开程序" :visible.sync="selectListVisible" :close-on-click-modal="false" center>
          <el-table :data="scriptList" width="300px" height="250" overflow-y="scroll" highlight-current-row @current-change="handleSelect" :default-sort="{prop: 'name', order:'ascending'}">
            <el-table-column prop="name" label="名称" width="370px" sortable></el-table-column>
          </el-table>
          <span slot="footer" class="dialog-footer">
            <el-button @click="cancelItem">取消</el-button>
            <el-button type="primary" @click="confirmItem">确定</el-button>
          </span>
        </el-dialog>

      </div>
      <div class="control">
        <el-button type="primary" class="import" @click="importData">导入实时数据</el-button>
        <el-button type="primary" @click="openJog">选择点</el-button>
        <el-button type="primary" class="run" @click="runVisible = true">运行</el-button>
        <el-dialog title="选择点" :visible.sync="jogVisible" :modal="false">
          <control v-on:record-pos="closeJog"></control>
        </el-dialog>

        <el-dialog width="800px" title="运行设置" :visible.sync="runVisible" false>
          <run :name=form.name></run>
          <span slot="footer" class="dialog-footer">
          <el-button @click="runVisible = false">取 消</el-button>
          <el-button type="primary" @click="run">确 定</el-button>
        </span>
        </el-dialog>
      </div>
    </el-row>

  </section>
</template>
<style>
  @import '../styles/jointJS.css';
  @import '../styles/style.css';

  section {
    height: 100%;
  }
  #program {
    height: 82%;
    border-bottom: 1px solid black;
    overflow-y: scroll;
  }
  .control, .fileOperation {
    margin: 5px auto;
  }
  .control {
    /*width: 800px;*/
  }
  .control-group {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }
  .nameForm {
    margin-top: 30px;
    width: 80%;
  }

</style>
<script>
  // import $ from 'jquery'
  // import {joint} from '@/visualProgram/programLib'
  // import {config} from '@/visualProgram/config/config'
  import {App} from '@/visualProgram/MainView'
  import {sendProgram} from '@/api/index'
  import Control from '@/components/Control'
  import Run from '@/views/RunInProgram'
  export default {
      data() {
        let validateProgramName = (rule, value, callback) => {
          if (value === '') {
            callback(new Error('请输入文件名'))
          }
          let reg =  /[^\\s\\\\/:\\*\\?\\\"<>\\|](\\x20|[^\\s\\\\/:\\*\\?\\\"<>\\|])*[^\\s\\\\/:\\*\\?\\\"<>\\|\\.]$/
          if (!reg.test(value)) {
            callback(new Error('请输入正确的文件名'))
            this.form.name = ''
          }
        }
        return {
          code: '',
          app: null,
          jogVisible: false,
          dialogVisible: false,
          createVisible: false,
          runVisible: false,
          scriptList: [],
          selectListVisible: false,
          selectName:'',
          form: {
            name: ''
          },
          rules: {
            name: [{ validator: validateProgramName, trigger: 'blur'}]
          }
        }
      },
      methods: {
        createProgram() {
          this.createVisible = true
        },
        startProgram (form) {
          this.$refs[form].validate((valid) => {
            if (valid) {
              alert('submit!')
            } else {
              console.log('error submit!!')
              return false
            }
          })
          if(this.form.name) {
            this.createVisible = false
            this.app.graph.fromJSON(this.$store.state.script.initialProgramDoc)
          }
        },
        openProgram() {
          this.selectListVisible = true
          this.scriptList = this.$store.state.script.visualProgList
          // console.log(this.scriptList)
        },
        handleSelect(val){
          this.selectName = val.name
        },
        cancelItem(){
          this.selectName = ''
          this.selectListVisible = false
        },
        confirmItem(){
          this.selectListVisible = false
          this.form.name = this.scriptName = this.selectName
          let selected = this.$store.state.script.visualProgList.find(function (progItem) {
            return progItem.name === this.selectName
          },this)
          this.app.graph.fromJSON(JSON.parse(selected.jsonStr))
        },
        exportCode() {
          this.dialogVisible = true
          this.code = this.app.exportCode()

          if(this.form.name) {
            let jsonObj = this.app.graph.toJSON()
            // console.log(JSON.stringify(jsonObj))
            this.$store.commit('programGraph',{name: this.form.name, jsonStr: JSON.stringify(jsonObj)})
          }
        },
        run() {
          this.code = this.app.exportCode()
          if(!this.form.name) {
            this.$message('请先导出脚本')
          }
          this.sendProgram()
          if(this.runVisible)
            // this.runVisible = false
          if(this.code) {
           this.app.showCurrentLine(this.progInfo.programLine)
           // console.log(codeList[this.progInfo.programLine-1])
          }
        },
        openJog() {
          this.jogVisible = true
        },
        closeJog() {
          this.jogVisible = false
        },
        importData() {
          let data = {
            currentPos: this.currentPos,
            currentJoint: this.currentJoint,
          }
          this.app.importData(data)
        },
        sendProgram() {
          if(!this.form.name) {
            return
          }
          this.dialogVisible = false
          let program = {
            code: this.code,
            name: this.form.name
          }

          sendProgram(program).then((res) => {
            console.log(res)
          }).catch((err) => {
            console.log(err)
          })
        },
    },
    components: {
      Control,
      Run
    },
    watch: {
      app: function (val,oldVal) {

        console.log(oldVal === null)
        if(val) {
          val.graph.fromJSON(this.$store.state.script.programDoc)
        }
      },
      progInfo: function (val,oldVal) {
        if(oldVal !== val){
          // this.run(val.programLine)
        }
      }
    },
    computed: {
        currentPos: function () {
          let pos = this.$store.state.status.fromPLC.cartesianInfo.actPos
          return pos.map(x=>Math.round(x*100)/100)
        },
        currentJoint: function () {
          let currentJoint = []
          this.$store.state.status.fromPLC.jointInfo.forEach(function (info) {
            currentJoint.push(Math.round(info.actualPos * 100)/100)
          })
          return currentJoint
        },
        progInfo: function () {
        return this.$store.state.status.progInfo
      }
    },
    mounted() {
        this.app = new App.MainView({el: '#program'})

      window.addEventListener("message", function(event) {
        // if(event.origin !== 'http://127.0.0.1:8080') return;
        console.log('message received: ');
      },false);
      }
    }
</script>
