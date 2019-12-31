import $ from 'jquery'
import {joint} from '@/visualProgram/programLib'
import {config} from '@/visualProgram/config/config'

let App = {};
App.MainView = joint.mvc.View.extend({
  className: 'app',

  events: {
    'focus input[type="range"]': 'removeTargetFocus',
    'mousedown': 'removeFocus',
    'touchstart': 'removeFocus'
  },

  options: {
    currentPos: [],
    currentJoint: [],
    IOInOptions: [
      {value: 1, function: 'io_in', params: 'portnum_io'},
      {value: 2, function: 'io_v_in', params: 'portnum_virtual_io'},
      {value: 3, function: 'tool_in', params: 'portnum_tool_io'}
    ],
    IOOutOptions: [
      {value: 1, function: 'io_out', params: 'portnum_io'},
      {value: 2, function: 'io_v_out', params: 'portnum_virtual_io'},
      {value: 3, function: 'tool_out', params: 'portnum_tool_io'}
    ],
    ModbusWriteOptions: [
      {value: 1, function: 'modbus_write_d', params:['signal_name','digital_value']},
      {value: 2, function: 'modbus_write_r', params:['signal_name','register_value']}
    ],
    SocketSendTypeOptions: [
      {value: 1, function: 'send_string', params:'send_msg'},
      {value: 2, function: 'send_float', params:'array_send'}
    ],
    SocketReadTypeOptions: [
      {value: 1, function: 'read_string', params:['msg_received','len']},
      {value: 2, function: 'read_float', params:['array_received']}
    ]
  },

  removeTargetFocus: function(evt) {
    evt.target.blur();
  },

  removeFocus: function() {
    // 移除activeElement的焦点
    document.activeElement.blur();
    // selection是对当前激活选中区（即高亮文本）进行操作,可以使用window.getSelection()获得selection对象.
    // 移除selection中所有的range对象，不存在任何被选中的内容
    window.getSelection().removeAllRanges();
  },

  init: function() {
    joint.setTheme('material');
    this.initializePaper();
    this.initializeStencil();
    this.initializeSelection();
    this.initializeHaloAndInspector();
    this.initializeToolbar();
    this.initializeKeyboardShortcuts();
    this.initializeTooltips();
  },

  // Create a graph, paper and wrap the paper in a PaperScroller.
  initializePaper: function() {
    let graph = this.graph = new joint.dia.Graph;

    graph.on('add', function(cell, collection, opt) {
      if (opt.stencil) this.createInspector(cell);
    }, this);

    this.commandManager = new joint.dia.CommandManager({ graph: graph });

    let paper = this.paper = new joint.dia.Paper({
      width: 1000,
      height: 1000,
      gridSize: 10,
      drawGrid: true,
      model: graph,
      defaultLink: new joint.shapes.app.Link
    });

    paper.on('blank:mousewheel', _.partial(this.onMousewheel, null), this);
    paper.on('cell:mousewheel', this.onMousewheel, this);

    this.snaplines = new joint.ui.Snaplines({ paper: paper });

    let paperScroller = this.paperScroller = new joint.ui.PaperScroller({
      paper: paper,
      autoResizePaper: true,
      cursor: 'grab'
    });

    this.$('.paper-container').append(paperScroller.el);
    paperScroller.render().center();

    // let firstCell = new joint.shapes.state.Start;
    // firstCell.position(500,300);
    // graph.addCell(firstCell);
  },

  // Create and populate stencil.
  initializeStencil: function() {
    let stencil = this.stencil = new joint.ui.Stencil({
      paper: this.paperScroller,
      snaplines: this.snaplines,
      scaleClones: true,
      width: 200,
      groups: config.stencil.groups,
      dropAnimation: true,
      groupsToggleButtons: true,
      search: {
        '*': ['type', 'attrs/text/text', 'attrs/.label/text']
      },
      // Use default Grid Layout
      layout: true,
      // Remove tooltip definition from clone
      dragStartClone: function(cell) {
        return cell.clone().removeAttr('./data-tooltip');
      }
    });
    this.$('.stencil-container').append(stencil.el);
    stencil.render().load(config.stencil.shapes);
  },

  initializeKeyboardShortcuts: function() {
    this.keyboard = new joint.ui.Keyboard();
    this.keyboard.on({

      'ctrl+c': function() {
        // Copy all selected elements and their associated links.
        this.clipboard.copyElements(this.selection.collection, this.graph);
      },

      'ctrl+v': function() {

        let pastedCells = this.clipboard.pasteCells(this.graph, {
          translate: { dx: 20, dy: 20 },
          useLocalStorage: true
        });

        let elements = _.filter(pastedCells, function(cell) {
          return cell.isElement();
        });

        // Make sure pasted elements get selected immediately. This makes the UX better as
        // the user can immediately manipulate the pasted elements.
        this.selection.collection.reset(elements);
      },

      'ctrl+x shift+delete': function() {
        this.clipboard.cutElements(this.selection.collection, this.graph);
      },

      'delete backspace': function(evt) {
        evt.preventDefault();
        this.graph.removeCells(this.selection.collection.toArray());
      },

      'ctrl+z': function() {
        this.commandManager.undo();
        this.selection.cancelSelection();
      },

      'ctrl+y': function() {
        this.commandManager.redo();
        this.selection.cancelSelection();
      },

      'ctrl+a': function() {
        this.selection.collection.reset(this.graph.getElements());
      },

      'ctrl+plus': function(evt) {
        evt.preventDefault();
        this.paperScroller.zoom(0.2, { max: 5, grid: 0.2 });
      },

      'ctrl+minus': function(evt) {
        evt.preventDefault();
        this.paperScroller.zoom(-0.2, { min: 0.2, grid: 0.2 });
      },

      'keydown:shift': function(evt) {
        this.paperScroller.setCursor('crosshair');
      },

      'keyup:shift': function() {
        this.paperScroller.setCursor('grab');
      }

    }, this);
  },

  initializeSelection: function() {

    this.clipboard = new joint.ui.Clipboard();
    this.selection = new joint.ui.Selection({
      paper: this.paper,
      handles: config.selection.handles
    });

    // Initiate selecting when the user grabs the blank area of the paper while the Shift key is pressed.
    // Otherwise, initiate paper pan.
    this.paper.on('blank:pointerdown', function(evt, x, y) {

      if (this.keyboard.isActive('shift', evt)) {
        this.selection.startSelecting(evt);
      } else {
        this.selection.cancelSelection();
        this.paperScroller.startPanning(evt, x, y);
      }

    }, this);

    this.paper.on('element:pointerdown', function(elementView, evt) {

      // Select an element if CTRL/Meta key is pressed while the element is clicked.
      if (this.keyboard.isActive('ctrl meta', evt)) {
        this.selection.collection.add(elementView.model);
      }
    }, this);

    this.selection.on('selection-box:pointerdown', function(elementView, evt) {

      // Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.
      if (this.keyboard.isActive('ctrl meta', evt)) {
        this.selection.collection.remove(elementView.model);
      }
    }, this);
  },

  createInspector: function(cell) {
    //_.extend()将sources对象中的所有属性拷贝到destination对象中，并返回destination对象。
    // _.extend(destination, *sources)
    $(".inspector-container").addClass("open");
    $(".paper-container").addClass("addcell");

    // let cellType = cell.get('type');
    // let commandName = cellType.split('.')[1];
    // if(!config.inspector[cellType].inputs) return
    // let params = config.inspector[cellType].inputs.params;
    //
    // if(cellType.startsWith('motionControl')) {
    //   if (!this.options.dataImported) {
    //     let dialog = new joint.ui.Dialog({
    //       width: 420,
    //       type: 'alert',
    //       modal: true,
    //       draggable: true,
    //       title: '提示',
    //       content: '请先导入机器人的实时位置信息'
    //       // buttons: [{action: 'OK', content: 'OK'}]
    //     }).open();
    //     return
    //   }
    //   //
    //   // this.options.currentPos = [1.1,1.2,1.3,1.4,1.5,1.6];
    //   // this.options.currentJoint = [1.1,1.2,1.3,1.4,1.5,1.6,1.7];
    //   if (params.type === 'list') {
    //     this.options.dataImported = false;
    //     switch (commandName) {
    //       case 'movel':
    //       case 'movej_pose':
    //         if (params.item.type === 'object') {
    //           let properties = params.item.properties;
    //           let pose = properties.pose;
    //           let currentPos = this.options.currentPos;
    //           console.log(currentPos);
    //           pose.x.defaultValue = currentPos[0];
    //           pose.y.defaultValue = currentPos[1];
    //           pose.z.defaultValue = currentPos[2];
    //           pose.rx.defaultValue = currentPos[3];
    //           pose.ry.defaultValue = currentPos[4];
    //           pose.rz.defaultValue = currentPos[5];
    //         }
    //         break;
    //       case 'movej':
    //         if (params.item.type === 'object') {
    //           let properties = params.item.properties;
    //           let axis = properties.axis;
    //           let currentJoint = this.options.currentJoint;
    //           // console.log(this.currentPos);
    //           axis.axis_1.defaultValue = currentJoint[0];
    //           axis.axis_2.defaultValue = currentJoint[1];
    //           axis.axis_3.defaultValue = currentJoint[2];
    //           axis.axis_4.defaultValue = currentJoint[3];
    //           axis.axis_5.defaultValue = currentJoint[4];
    //           axis.axis_6.defaultValue = currentJoint[5];
    //           axis.axis_7.defaultValue = currentJoint[6];
    //         }
    //         break;
    //       case 'movec':
    //         if(params.item.type === 'object'){
    //           let properties = params.item.properties;
    //           let pose = properties.pose;
    //           let currentPos = this.options.currentPos;
    //           console.log(this.currentPos);
    //           pose.item.properties.x.defaultValue = currentPos[0];
    //           pose.item.properties.y.defaultValue = currentPos[1];
    //           pose.item.properties.z.defaultValue = currentPos[2];
    //           pose.item.properties.rx.defaultValue = currentPos[3];
    //           pose.item.properties.ry.defaultValue = currentPos[4];
    //           pose.item.properties.rz.defaultValue = currentPos[5];
    //         }
    //         break;
    //     }
    //   }
    // }

    let currentInspector = joint.ui.Inspector.create('.inspector-container', _.extend(
      {cell: cell}, config.inspector[cell.get('type')]));
    currentInspector.cell = cell;
    this.currentInspector = currentInspector;
    return currentInspector;
  },

  initializeHaloAndInspector: function() {
    this.paper.on('element:pointerup link:options', function(cellView) {

      let cell = cellView.model;

      if (!this.selection.collection.contains(cell)) {

        if (cell.isElement()) {

          // new joint.ui.FreeTransform({
          //   cellView: cellView,
          //   allowRotation: false,
          //   preserveAspectRatio: !!cell.get('preserveAspectRatio'),
          //   allowOrthogonalResize: cell.get('allowOrthogonalResize') !== false
          // }).render();

          if(!cell.get('type').startsWith('logic')) {
            new joint.ui.Halo({
              cellView: cellView,
              handles: config.halo.handles
            }).render();
          }

          this.selection.collection.reset([]);
          this.selection.collection.add(cell, { silent: true });
        }
        this.createInspector(cell);
      }
    }, this);
  },

  initializeToolbar: function() {
    let toolbar = this.toolbar = new joint.ui.Toolbar({
      groups: config.toolbar.groups,
      tools: config.toolbar.tools,
      references: {
        paperScroller: this.paperScroller,
        commandManager: this.commandManager
      }
    });

    toolbar.on({
      // 'print:pointerclick': _.bind(this.exportCode, this),
      // 'layout:pointerclick': _.bind(this.layoutDirectedGraph, this),
      // 'snapline:change': _.bind(this.changeSnapLines, this),
      'clear:pointerclick': _.bind(this.graph.clear, this.graph),
      // 'print:pointerclick': _.bind(this.paper.print, this.paper),
      'grid-size:change': _.bind(this.paper.setGridSize, this.paper)
    });

    this.$('.toolbar-container').append(toolbar.el);
    toolbar.render();
  },

  changeSnapLines: function(checked) {

    if (checked) {
      this.snaplines.startListening();
      this.stencil.options.snaplines = this.snaplines;
    } else {
      this.snaplines.stopListening();
      this.stencil.options.snaplines = null;
    }
  },

  initializeTooltips: function() {
    new joint.ui.Tooltip({
      rootTarget: document.body,
      target: '[data-tooltip]',
      direction: 'auto',
      padding: 10
    });
  },

  exportStylesheet: [
    '.scalable * { vector-effect: non-scaling-stroke }',
    '.marker-arrowheads { display:none }',
    '.marker-vertices { display:none }',
    '.link-tools { display:none }'
  ].join(''),

  importData: function (data) {
    let currentPos = this.options.currentPos = data.currentPos;
    let currentJoint = this.options.currentJoint = data.currentJoint;

    if(this.currentInspector) {
      let cellType = this.currentInspector.cell.get('type');
      let commandName = cellType.split('.')[1];

      if (cellType.startsWith('motionControl')) {
        let params = this.currentInspector.cell.attributes.params;
        switch (commandName) {
          case 'movel':
          case 'movej_pose':
            let pose = params[params.length - 1].pose;
            pose.x = currentPos[0];
            pose.y = currentPos[1];
            pose.z = currentPos[2];
            pose.rx = currentPos[3];
            pose.ry = currentPos[4];
            pose.rz = currentPos[5];
            break;
          case 'movej':
            let axis = params[params.length - 1].axis;
            axis.axis_1 = currentJoint[0];
            axis.axis_2 = currentJoint[1];
            axis.axis_3 = currentJoint[2];
            axis.axis_4 = currentJoint[3];
            axis.axis_5 = currentJoint[4];
            axis.axis_6 = currentJoint[5];
            axis.axis_7 = currentJoint[6];
            break;
          case 'movec':
            let poseArray = params[params.length - 1].pose;
            let poseItem = poseArray[poseArray.length - 1];
            poseItem.x = currentPos[0];
            poseItem.y = currentPos[1];
            poseItem.z = currentPos[2];
            poseItem.rx = currentPos[3];
            poseItem.ry = currentPos[4];
            poseItem.rz = currentPos[5];
            break;
        }
        this.currentInspector.render();
      }
    }
  },

  exportCode: function() {
    let graph = this.graph;
    this.code = this.goThrough(graph,graph.getFirstCell());
    return this.code;
  },

  goThrough (graph,firstCell) {
    let code = [];

    let nextCells = graph.getNeighbors(firstCell);
    if(firstCell.get('type')!== 'state.Start') {
      nextCells.unshift(firstCell);
    }

    while (nextCells.length !== 0) {
      let args = [], command;
      let nextCell = nextCells[0];
      let attributes = nextCell.attributes;
      let group = attributes.type.split('.')[0];
      let commandName = attributes.type.split('.')[1];
      let params = attributes.params;

      switch (group) {
        case 'motionControl':
          if (Array.isArray(params)) {
            params.forEach(function (param) {
              let pose = [], pose_1 = [], pose_2 = [], axis = [], delta = [];
              let speed, acc, rad, psi;
              Object.keys(param).forEach(function (key) {
                let value = param[key];
                if (joint.util.isObject(value)) {
                  if (Array.isArray(value)) {
                    pose_1 = joint.util.toArray(value[0]);
                    pose_2 = joint.util.toArray(value[1]);
                  }
                  else if (Object.keys(value).length === 6) {
                    // pose.push(value.x,value.y,value.z,value.rx,
                    //     value.ry,value.rz);
                    pose = joint.util.toArray(value);
                  }
                  else if (Object.keys(value).length === 7) {
                    // axis.push(value.axis_1,value.axis_2,value.axis_3,value.axis_4,value.axis_5,value.axis_6,value.axis_7);
                    axis = joint.util.toArray(value);
                  }
                  else if (Object.keys(value).length === 3) {
                    delta = joint.util.toArray(value);
                  }
                }
                else {
                  speed = param.speed;
                  acc = param.acc;
                  rad = param.rad;
                  psi = param.psi;
                }
              });
              switch (commandName) {
                case 'movel':
                  let poseStr = '[' + pose.toString() + ']';
                  args.push(poseStr, speed, acc, rad, psi);
                  break;
                case 'movej_pose':
                  let poseStr1 = '[' + pose.toString() + ']';
                  args.push(poseStr1, speed, acc);
                  break;
                case 'movej':
                  let axisStr = '[' + axis.toString() + ']';
                  args.push(axisStr, speed, acc, rad);
                  break;
                case 'movec':
                  let pose1Str = '[' + pose_1.toString() + ']';
                  let pose2Str = '[' + pose_2.toString() + ']';
                  args.push(pose1Str, pose2Str, speed, acc, rad, psi);
                  break;
                case 'tcp_move':
                  args.push(delta, speed);
                  break;
              }
              command = commandName + '(' + args.join(',') + ');';
              code.push(command);
              args = [];
            });
          }
          break;
        case 'socket':
          switch (commandName) {
            case 'open':
              let IP = '\"' + params.ip + '\"';
              args.push(IP, params.port);
              break;
            case 'close':
              break;
            case 'send':
              let paramValue;
              this.options.SocketSendTypeOptions.forEach(function (option) {
                if(option.value === params.send_type){
                  commandName = option.function;
                  if(!Array.isArray(option.params)) {
                    paramValue = params[option.params];
                  }
                }
              });
              let msg_send = '\"' + paramValue + '\"';
              args.push(msg_send);
              break;
            // case 'send_string':
            //     var msg_send = '\"' + params.msg_send + '\"';
            //     args.push(msg_send);
            //     break;
            // case 'send_float':
            //     var array_send = '[' + params.array_send + ']';
            //     args.push(array_send);
            //     break;
            case 'read':
              let paramValues = [];
              // args.push(params.msg_received,params.length);
              this.options.SocketReadTypeOptions.forEach(function (option) {
                if(option.value === params.read_type){
                  commandName = option.function;
                  if(Array.isArray(option.params)) {
                    console.log(option.params);
                    for(let i=0;i<option.params.length;i++) {
                      paramValues.push(params[option.params[i]]);
                    }
                  }
                }
              });
              msg_send = '\"' + paramValues.join(',') + '\"';
              args.push(msg_send);
              paramValues = [];
              break;
            // case 'read_string':
            //     // args.push(params.msg_received,params.length);
            //     args = joint.util.toArray(params);
            //     break;
            // case 'read_float':
            //     args.push(params.array_received);
            //     break;
          }
          command = 'socket_' + commandName + '(' + args.join(', ') + ');';
          code.push(command);
          break;
        case 'system':
          switch (commandName) {
            case 'sleep':
              args.push(params.time);
              command = commandName + '(' + args.join(', ') + ');';
              code.push(command);
          }
          break;
        case 'IO_tool':
          switch (commandName) {
            case 'io_in':
              // case 'io_v_in':
              // case 'tool_in':
              let paramValue;
              this.options.IOInOptions.forEach(function(option) {
                if(option.value === params.type) {
                  commandName = option.function;
                  if(!Array.isArray(option.params)) {
                    paramValue = params[option.params];
                  }
                }
              });
              args.push(paramValue);
              break;
            case 'io_out':
              // case 'io_v_out':
              // case 'tool_out':
              // let paramValue;
              this.options.IOOutOptions.forEach(function(option) {
                if(option.value === params.type) {
                  commandName = option.function;
                  if(!Array.isArray(option.params)) {
                    paramValue = params[option.params];
                  }
                }
              });
              args.push(paramValue, params.val);
              break;
            // case 'io_in':
            // case 'io_v_in':
            // case 'tool_in':
            //   args.push(params.portnum);
            //   break;
            // case 'io_out':
            // case 'io_v_out':
            // case 'tool_out':
            //   args.push(params.portnum, params.val);
            //   break;
            case 'coordinate_user':
              args = joint.util.toArray(params);
              break;
            case 'coordinate_tool':
              args = joint.util.toArray(joint.util.flattenObject(params));
              break;
            case 'coordinate_clear':
              break;
            case 'get_flange_pos':
              args = joint.util.toArray(params);
              break;
            case 'get_joint_pos':
              args = joint.util.toArray(params);
              break;
          }
          command = commandName + '(' + args.join(', ') + ');';
          code.push(command);
          break;
        case 'expressions':
          if (Array.isArray(params)) {
            params.forEach(function (param) {
              if (param.expression) {
                let value = param.expression.replace(/[ ]/g, "");
                if (value.trim().substr(value.length - 1, 1) !== ';') {
                  value += ';';
                }
                command = value;
                code.push(command);
                args = [];
              }
            });
          }
          break;
        case 'function':
          if (joint.util.isObject(params)) {
            let firstLine, definition = [];
            let funcName, funcArgs = [], content, funcReturn;
            Object.keys(params).forEach(function (key) {
              let value = params[key];
              switch (key) {
                case 'functionName':
                  funcName = params[key];
                  break;
                case 'functionArgs':
                  if (Array.isArray(value)) {
                    value.forEach(function (arg) {
                      if (joint.util.isObject(arg)) {
                        let argType = arg.arg_type,
                          argName = arg.arg_name;
                        funcArgs.push(argType + ' ' + argName);
                      }
                    });
                  }
                  break;
                case 'content':
                  content = value;
                  break;
                case 'functionReturn':
                  funcReturn = 'return ' + value + ';';
                  break;
              }
            });
            firstLine = funcName + ' (';
            (funcArgs.length !== 0) ? firstLine += (funcArgs.join(', ') + ') ') : firstLine += ') ';
            firstLine += '{';
            definition.push(firstLine, content, funcReturn);
            command = definition.join('\n') + ('\n }');
            code.push(command);
          }
          break;
        case 'logic':
          switch (commandName) {
            case 'If':
              args.push(attributes.question + ': ');
              let outboundLinks = this.graph.getConnectedLinks(nextCell, {outbound: true});
              outboundLinks.forEach(function (link) {
                if (link.get('source').port === 'yes') {
                  let innerNextCell = graph.getCell(link.get('target'));
                  args.push(this.goThrough(graph,innerNextCell));
                }
                else if (link.get('source').port === 'no') {
                  let innerNextCell = graph.getCell(link.get('target'));
                  args.push('else: ');
                  args.push(this.goThrough(graph,innerNextCell));
                }
              },this);
              args.push('End');
              break;
            case 'While':
              args.push(attributes.question + ': ');
              graph.getConnectedLinks(nextCell, {outbound: true}).forEach(function (link) {
                if (link.get('source').port === 'while') {
                  let innerNextCell = graph.getCell(link.get('target'));
                  args.push(this.goThrough(graph,innerNextCell));
                }
              },this);
              args.push('End');
              break;
          }
          command = args.join('\n');
          code.push(command);
          break;
        // case 'camera':
        //   args = joint.util.toArray(params);
        //   switch (commandName) {
        //     case 'capture':
        //       args[0] = '\"' + args[0] + '\"';
        //       break;
        //     case 'calpos':
        //       args = joint.util.toArray(params);
        //       break;
        //   }
        //   command = commandName + '(' + args.join(', ') + ');';
        //   code.push(command);
        //   break;
        case 'modbus':
          switch (commandName) {
            case 'modbus_read':
            // case 'modbus_write_d':
            // case 'modbus_write_r':
            case 'modbus_write':
              let paramValues = [];
              this.options.ModbusWriteOptions.forEach(function(option) {
                if(option.value === params.write_type) {
                  commandName = option.function;
                  if(Array.isArray(option.params)) {
                    for(let i=0;i<option.params.length;i++) {
                      paramValues.push(params[option.params[i]]);
                    }
                  }
                }
              });
              args.push(paramValues);
              paramValues = [];
              break;
            case 'modbus_set_frequency':
            case 'modbus_delete_signal':
              args = joint.util.toArray(params);
              args[0] = '\"' + args[0] + '\"';
              break;
            case 'modbus_add_signal':
              args = joint.util.toArray(params);
              args[0] = '\"' + args[0] + '\"';
              args[args.length - 1] = '\"' + args[args.length - 1] + '\"';
              break;
          }
          command = commandName + '(' + args.join(', ') + ');';
          code.push(command);
          break;
        default:
          break;
      }
      nextCells = graph.getNeighbors(nextCell, {outbound: true});
      nextCells = nextCells.filter(function (cell) {
        let port = graph.getConnectedLinks(cell,{inbound: true})[0].get('source').port;
        return (port !== 'yes' && port !== 'no' && port!== 'while');
      });
    }
    return code.join('\n');
  },

  showCurrentLine (line) {
    let options = {
      highlighter: {
        name: 'stroke',
        options:{
          padding: 10,
          rx: 5,
          ry: 5,
          attrs: {
            'stroke-width': 5,
            stroke: '#EDFF19'
          }
        }
      }
    };

    if(this.options.currentCellView) {
      this.options.currentCellView.unhighlight(null,options);
    }

    let graph = this.graph;
    let firstCell = graph.getFirstCell();
    let nextCells = graph.getNeighbors(firstCell,{outbound: true});

    //
    // if(line>0) {
    //   for(let i=0;i <= line - 1;i++) {
    //     if(nextCells.length !== 0) {
    //       nextCells = graph.getNeighbors(nextCells[0],{outbound: true});
    //     }
    //   }
    // }
    // nextCells[0].findView(this.paper).highlight();

    let codeList = this.code.split('\n');
    let flag = 0;

    if(line > 0) {
      for(let i=0;i < line;i++) {
        if(nextCells.length !== 0) {
          let nextCell = nextCells[0];
          if(codeList[i].startsWith('if') || codeList[i].startsWith('while')) {
            flag = 1;
            continue;
          }
          if(flag === 1) {
            if(codeList[i].startsWith('End')) {
              flag = 0;
            }
            else
              continue;
          }

          if(flag === 0) {
            nextCells = graph.getNeighbors(nextCell,{outbound: true});

            nextCells = nextCells.filter(function (cell) {
              let port = graph.getConnectedLinks(cell,{inbound: true})[0].get('source').port;
              if(port) {
                return (port !== 'yes' && port !== 'no' && port!== 'while');
              }
              else
                return true;
            });
          }
        }
        else {
          break;
        }
      }
    }
    this.options.currentCellView = nextCells[0].findView(this.paper);
    this.options.currentCellView.highlight(null, options);
  },

  onMousewheel: function(cellView, evt, x, y, delta) {

    if (this.keyboard.isActive('alt', evt)) {
      evt.preventDefault();
      this.paperScroller.zoom(delta * 0.2, { min: 0.2, max: 5, grid: 0.2, ox: x, oy: y });
    }
  }
});

export {App}
