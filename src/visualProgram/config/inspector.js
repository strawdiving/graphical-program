import {posJ, posL} from './limit'
let inspector = inspector || {};
var options = {
  side: [
    {value: 'top', content: 'Top Side'},
    {value: 'right', content: 'Right Side'},
    {value: 'bottom', content: 'Bottom Side'},
    {value: 'left', content: 'Left Side'}
  ],

  imageIcons: [
    {value: 'assets/image-icon1.svg', content: '<img height="42px" src="assets/image-icon1.svg"/>'},
    {value: 'assets/image-icon2.svg', content: '<img height="80px" src="assets/image-icon2.svg"/>'},
    {value: 'assets/image-icon3.svg', content: '<img height="80px" src="assets/image-icon3.svg"/>'},
    {value: 'assets/image-icon4.svg', content: '<img height="80px" src="assets/image-icon4.svg"/>'}
  ],

  strokeWidth: [
    {
      value: 1,
      content: '<div style="background:#fff;width:2px;height:30px;margin:0 14px;border-radius: 2px;"/>'
    },
    {
      value: 2,
      content: '<div style="background:#fff;width:4px;height:30px;margin:0 13px;border-radius: 2px;"/>'
    },
    {
      value: 4,
      content: '<div style="background:#fff;width:8px;height:30px;margin:0 11px;border-radius: 2px;"/>'
    },
    {
      value: 8,
      content: '<div style="background:#fff;width:16px;height:30px;margin:0 8px;border-radius: 2px;"/>'
    }
  ],
  fontWeight: [
    { value: '300', content: '<span style="font-weight: 300">Light</span>' },
    { value: 'Normal', content: '<span style="font-weight: Normal">Normal</span>' },
    { value: 'Bold', content: '<span style="font-weight: Bolder">Bold</span>' }
  ],

  fontFamily: [
    { value: 'Alegreya Sans', content: '<span style="font-family: Alegreya Sans">Alegreya Sans</span>' },
    { value: 'Averia Libre', content: '<span style="font-family: Averia Libre">Averia Libre</span>' },
    { value: 'Roboto Condensed', content: '<span style="font-family: Roboto Condensed">Roboto Condensed</span>' }
  ],

  strokeStyle: [
    { value: '0', content: 'Solid' },
    { value: '2,5', content: 'Dotted' },
    { value: '10,5', content: 'Dashed' }
  ],

  router: [
    {
      value: 'normal',
      content: '<p style="background:#fff;width:2px;height:30px;margin:0 14px;border-radius: 2px;"/>'
    },
    {
      value: 'orthogonal',
      content: '<p style="width:20px;height:30px;margin:0 5px;border-bottom: 2px solid #fff;border-left: 2px solid #fff;"/>'
    },
    {
      value: 'oneSide',
      content: '<p style="width:20px;height:30px;margin:0 5px;border: 2px solid #fff;border-top: none;"/>'
    }
  ],

  connector: [
    {
      value: 'normal',
      content: '<p style="width:20px;height:20px;margin:5px;border-top:2px solid #fff;border-left:2px solid #fff;"/>'
    },
    {
      value: 'rounded',
      content: '<p style="width:20px;height:20px;margin:5px;border-top-left-radius:30%;border-top:2px solid #fff;border-left:2px solid #fff;"/>'
    },
    {
      value: 'smooth',
      content: '<p style="width:20px;height:20px;margin:5px;border-top-left-radius:100%;border-top:2px solid #fff;border-left:2px solid #fff;"/>'
    }
  ],

  labelPosition: [
    {value: 30, content: 'Close to source'},
    {value: 0.5, content: 'In the middle'},
    {value: -30, content: 'Close to target'},
  ],

  portMarkup: [
    {value: '<rect class="port-body" width="20" height="20" x="-10" y="-10"/>', content: 'Rectangle'},
    {value: '<circle class="port-body" r="10"/>', content: 'Circle'},
    {value: '<path class="port-body" d="M -10 -10 10 -10 0 10 z"/>', content: 'Triangle'}
  ],

  Socket_ReadSend_Type: [
    {value: 1, content: 'String'},
    {value: 2, content: 'Float Array'},
  ],

  IOType: [
    {value: 1, content: '控制柜IO'},
    {value: 2, content: '虚拟IO'},
    {value: 3, content: '末端工具IO'},
  ],
  IO_Port: [
    {value: 1, content: '1'},
    {value: 2, content: '2'},
    {value: 3, content: '3'},
    {value: 4, content: '4'},
    {value: 5, content: '5'},
    {value: 6, content: '6'},
  ],
  IO_Virtual_Port: [
    {value: 1, content: '1'},
    {value: 2, content: '2'},
    {value: 3, content: '3'},
    {value: 4, content: '4'},
    {value: 5, content: '5'},
    {value: 6, content: '6'},
    {value: 7, content: '7'},
    {value: 8, content: '8'},
    {value: 9, content: '9'},
    {value: 10, content: '10'},
  ],
  IO_Tool_Port: [
    {value: 1, content: '1'},
    {value: 2, content: '2'},
  ],
  IO_Value: [
    {value: 0, content: '0'},
    {value: 1, content: '1'},
  ],
  Modbus_Write_Type: [
    {value: 1, content: 'digital'},
    {value: 2, content: 'register'},
  ]
};

var minX = -100
inspector = {
    'state.Rectangle': {
    inputs: {
      attrs: {
        text: {
          fontFamily: {
            type: 'select-box',
            options: options.fontFamily,
            label: 'Font family',
            group: 'text',
            when: { ne: { 'attrs/label/text': '' }},
            index: 3
          },
          fontWeight: {
            type: 'select-box',
            options: options.fontWeight,
            label: 'Font thickness',
            group: 'text',
            when: { ne: { 'attrs/label/text': '' }},
            index: 4
          }
        },
        rect: {
          strokeDasharray: {
            type: 'select-box',
            options: options.strokeStyle,
            label: 'Outline style',
            group: 'presentation',
            when: {
              and: [
                { ne: { 'attrs/body/stroke': 'transparent' }},
                { ne: { 'attrs/body/strokeWidth': 0 }}
              ]
            },
            index: 4
          }
        }
      }
    },
    groups: {
      presentation: {
        label: 'Presentation',
        index: 1
      },
      text: {
        label: 'Text',
        index: 2
      }
    }
  },
    'motionControl.movel': {
        inputs: {
            params: {
                type: 'list',
                group: 'movel',
                label: 'movel',
                item: {
                    type: 'object',
                    properties: {
                        pose: {
                            x: {
                                type: 'number',
                                min: posL.minX,
                                max: posL.maxX,
                                step: 0.01,
                                defaultValue: 0.2,
                                unit: 'rad',
                                label: 'pose/X',
                                index: 1
                            },
                            y: {
                                type: 'number',
                                min: posL.minY,
                                max: posL.maxY,
                                step: 0.01,
                                defaultValue: 0.4,
                                unit: 'rad',
                                label: 'pose/Y',
                                index: 2
                            },
                            z: {
                                type: 'number',
                                min: posL.minZ,
                                max: posL.maxZ,
                                step: 0.01,
                                defaultValue: 1.0,
                                unit: 'rad',
                                label: 'pose/Z',
                                index: 3
                            },
                            rx: {
                                type: 'number',
                                min: posL.minRX,
                                max: posL.maxRX,
                                step: 0.01,
                                defaultValue: 0.8,
                                unit: 'rad',
                                label: 'pose/RX',
                                index: 4
                            },
                            ry: {
                                type: 'number',
                                min: posL.minRY,
                                max: posL.maxRY,
                                step: 0.01,
                                defaultValue: 2.0,
                                unit: 'rad',
                                label: 'pose/RY',
                                index: 5
                            },
                            rz: {
                                type: 'number',
                                min: posL.minRZ,
                                max: posL.maxRZ,
                                step: 0.01,
                                defaultValue: 0.9,
                                unit: 'rad',
                                label: 'pose/RZ',
                                index: 6
                            }
                        },
                        speed: {
                            type: 'range',
                            min: 0,
                            max: 500,
                            step: 1,
                            defaultValue: 200,
                            unit: 'm/s',
                            label: 'Speed',
                            index: 7
                        },
                        acc: {
                            type: 'number',
                            min: 0,
                            max: 5000,
                            step: 1,
                            defaultValue: 2000,
                            unit: 'mm/s2',
                            label: 'Acc',
                            index: 8
                        },
                        rad: {
                            type: 'number',
                            min: -3.14,
                            max: 3.14,
                            step: 0.01,
                            defaultValue: -1,
                            unit: 'rad',
                            label: 'Rad',
                            index: 9
                        },
                        psi: {
                            type: 'number',
                            min: -3.14,
                            max: 3.14,
                            step: 0.01,
                            defaultValue: -1,
                            unit: 'rad',
                            label: 'Psi',
                            index: 10
                        }
                    }
                }
            }
        },
        groups: {
            movel: {
                label: 'movel',
                tooltip: '该指令控制机械臂末端从当前状态按照直线路径移动到目标状态',
                index: 1
            }
        }
    },
    'motionControl.movej': {
        inputs: {
            params: {
                type: 'list',
                group: 'movej',
                label: 'movej',
                item: {
                    type: "object",
                    properties: {
                        axis: {
                            axis_1: {
                                type: 'number',
                                min: -posJ.j1,
                                max: posJ.j1,
                                step: 0.02,
                                defaultValue: 1.1,
                                unit: 'deg',
                                label: 'Axis_1',
                                group: 'axis',
                                index: 1
                            },
                            axis_2: {
                                type: 'number',
                                min: -posJ.j2,
                                max: posJ.j2,
                                step: 0.02,
                                defaultValue: 1.2,
                                unit: 'deg',
                                label: 'Axis_2',
                                group: 'axis',
                                index: 2
                            },
                            axis_3: {
                                type: 'number',
                                min: -posJ.j3,
                                max: posJ.j3,
                                step: 0.02,
                                defaultValue: 1.3,
                                unit: 'deg',
                                label: 'Axis_3',
                                group: 'axis',
                                index: 3
                            },
                            axis_4: {
                                type: 'number',
                                min: -posJ.j4,
                                max: posJ.j4,
                                step: 0.02,
                                defaultValue: 1.4,
                                unit: 'deg',
                                label: 'Axis_4',
                                group: 'axis',
                                index: 4
                            },
                            axis_5: {
                                type: 'number',
                                min: -posJ.j5,
                                max: posJ.j5,
                                step: 0.02,
                                defaultValue: 1.5,
                                unit: 'deg',
                                label: 'Axis_5',
                                group: 'axis',
                                index: 5
                            },
                            axis_6: {
                                type: 'number',
                                min: -posJ.j6,
                                max: posJ.j6,
                                step: 0.02,
                                defaultValue: 1.6,
                                unit: 'deg',
                                label: 'Axis_6',
                                group: 'axis',
                                index: 6
                            },
                            axis_7: {
                                type: 'number',
                                min: -posJ.j7,
                                max: posJ.j7,
                                step: 0.02,
                                defaultValue: 1.7,
                                unit: 'deg',
                                label: 'Axis_7',
                                group: 'axis',
                                index: 7
                            }
                        },
                        speed: {
                            type: 'range',
                            min: 0,
                            max: 100,
                            step: 1,
                            defaultValue: 50,
                            unit: '%',
                            label: 'Speed',
                            group: 'parameters',
                            index: 8
                        },
                        acc: {
                            type: 'number',
                            min: -200,
                            max: 5000,
                            step: 1,
                            defaultValue: -1,
                            unit: 'mm/s2',
                            label: 'Acc',
                            group: 'parameters',
                            index: 9
                        },
                        rad: {
                            type: 'number',
                            min: -3.14,
                            max: 3.14,
                            step: 0.02,
                            defaultValue: -1,
                            unit: 'rad',
                            label: 'Rad',
                            group: 'parameters',
                            index: 10
                        }
                    }
                }
            }
        },
        groups: {
            movej: {
                label: 'movej',
                tooltip: '该指令控制机械臂从当前状态，按照关节运动的方式移动到目标关节角状态',
                index: 1
            }
        }
    },
    'motionControl.movec': {
    inputs: {
      params: {
        type: 'list',
        group: 'movec',
        label: 'movec',
        item: {
          type: 'object',
          properties: {
            pose: {
              type: "list",
              label: 'pose',
              item: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    min: posL.minX,
                    max: posL.maxX,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'X',
                    group: 'pose1',
                    index: 1
                  },
                  y: {
                    type: 'number',
                    min: posL.minY,
                    max: posL.maxY,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'Y',
                    group: 'pose1',
                    index: 2
                  },
                  z: {
                    type: 'number',
                    min: posL.minZ,
                    max: posL.maxZ,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'Z',
                    group: 'pose1',
                    index: 3
                  },
                  rx: {
                    type: 'number',
                    min: posL.minRX,
                    max: posL.maxRX,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RX',
                    group: 'pose1',
                    index: 4
                  },
                  ry: {
                    type: 'number',
                    min: posL.minRY,
                    max: posL.maxRY,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RY',
                    group: 'pose1',
                    index: 5
                  },
                  rz: {
                    type: 'number',
                    min: posL.minRZ,
                    max: posL.maxRZ,
                    step: 0.01,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RZ',
                    group: 'pose1',
                    index: 6
                  }
                }
              }
            },
            speed: {
              type: 'number',
              min: 0,
              max: 500,
              step: 1,
              defaultValue: 200,
              unit: 'm/s',
              label: 'Speed',
              group: 'parameters',
              index: 13
            },
            acc: {
              type: 'number',
              min: 0,
              max: 5000,
              step: 1,
              defaultValue: 2000,
              unit: 'mm/s2',
              label: 'Acc',
              group: 'parameters',
              index: 14
            },
            rad: {
              type: 'number',
              min: -3.14,
              max: 3.14,
              step: 0.02,
              unit: 'rad',
              label: 'Rad',
              group: 'parameters',
              index: 15
            },
            psi: {
              type: 'number',
              min: -3.14,
              max: 3.14,
              step: 0.02,
              defaultValue: -1,
              unit: 'rad',
              label: 'Psi',
              group: 'parameters',
              index: 16
            }
          }
        }
      }
    },
    groups: {
      movec: {
        label: "movec",
        tooltip: '该指令控制机械臂做圆弧运动，起始点为运动开始时的任意点，途径p1点，终点为p2点',
        index: 1
      }
      // pose1: {
      //     label: 'Pose_1',
      //     index: 1
      // },
      // pose2: {
      //     label: 'Pose_2',
      //     index: 2
      // },
      // parameters: {
      //     label: 'Parameters',
      //     index: 3
      // }
    }
  },
    'motionControl.tcp_move': {
        inputs: {
            params: {
                type: 'list',
                group: 'tcp_move',
                label: 'tcp_move',
                item: {
                    type: 'object',
                    properties: {
                        delta: {
                            x: {
                                type: 'number',
                                min: posL.minX,
                                max: posL.maxX,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'deltaX',
                                group: 'delta',
                                index: 1
                            },
                            y: {
                                type: 'number',
                                min: posL.minY,
                                max: posL.maxY,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'deltaY',
                                group: 'delta',
                                index: 2
                            },
                            z: {
                                type: 'number',
                                min: posL.minZ,
                                max: posL.maxZ,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'deltaZ',
                                group: 'delta',
                                index: 3
                            }
                        },
                        speed: {
                            type: 'number',
                            min: 0,
                            max: 500,
                            step: 1,
                            defaultValue: 200,
                            unit: 'm/s',
                            label: 'Speed',
                            group: 'parameters',
                            index: 4
                        }
                    }
                }
            }
        },
        groups: {
            tcp_move: {
                label: "tcp_move",
                tooltip: '该指令控制机械臂沿末端法兰面坐标系直线移动一个增量，增量用[x,y,z]矩阵表示',
                index: 1
            }
            // delta: {
            //     label: 'Delta',
            //     index: 1
            // },
            // parameters: {
            //     label: 'Parameters',
            //     index: 2
            // }
        }
    },
    'motionControl.movej_pose': {
        inputs: {
            params: {
                type: 'list',
                group: 'movej_pose',
                label: 'movej_pose',
                item: {
                    type: "object",
                    properties: {
                        pose: {
                            x: {
                                type: 'number',
                                min: posL.minX,
                                max: posL.maxX,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'X',
                                group: 'pose',
                                index: 1
                            },
                            y: {
                                type: 'number',
                                min: posL.minY,
                                max: posL.maxY,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'Y',
                                group: 'pose',
                                index: 2
                            },
                            z: {
                                type: 'number',
                                min: posL.minZ,
                                max: posL.maxZ,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'Z',
                                group: 'pose',
                                index: 3
                            },
                            rx: {
                                type: 'number',
                                min: posL.minRX,
                                max: posL.maxRX,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'RX',
                                group: 'pose',
                                index: 4
                            },
                            ry: {
                                type: 'number',
                                min: posL.minRY,
                                max: posL.maxRY,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'RY',
                                group: 'pose',
                                index: 5
                            },
                            rz: {
                                type: 'number',
                                min: posL.minRZ,
                                max: posL.maxRZ,
                                step: 0.01,
                                defaultValue: 0,
                                unit: 'rad',
                                label: 'RZ',
                                group: 'pose',
                                index: 6
                            }
                        },
                        speed: {
                            type: 'range',
                            min: 0,
                            max: 100,
                            step: 1,
                            defaultValue: 50,
                            unit: '%',
                            label: 'Speed',
                            group: 'parameters',
                            index: 7
                        },
                        acc: {
                            type: 'number',
                            min: 0,
                            max: 5000,
                            step: 1,
                            defaultValue: 2000,
                            unit: 'mm/s2',
                            label: 'Acc',
                            group: 'parameters',
                            index: 8
                        }
                    }
                }
            }
        },
        groups: {
            movej_pose: {
                label: 'movej_pose',
                tooltip: '该指令控制机械臂从当前状态，按照关节运动的方式移动到末端目标位置',
                index: 1
            }
            // pose: {
            //     label: 'Pose',
            //     index: 1
            // },
            // parameters: {
            //     label: 'Parameters',
            //     index: 2
            // }
        }
    },

    'socket.open': {
        inputs: {
            params:{
                'ip': {
                    type: 'content-editable',
                    defaultValue: '127.0.0.1',
                    group: 'socket.open',
                    label: 'IP',
                    index: 1
                },
                'port': {
                    type: 'number',
                    defaultValue: 3000,
                    min: 0,
                    step: 1,
                    group: 'socket.open',
                    label: 'PORT',
                    index: 2
                }
            }},
        groups: {
            'socket.open': {
                label: 'socket . open',
                tooltip: '打开一个以太网的通信链接，如果三秒内没有创建成功，那么链接创建失败',
                index: 1
            }
        }
    },
    'socket.close': {
        inputs: {
            params: {
                'ip': {
                    type: 'undefined',
                    group: 'socket.close'
                }
            }
        },
        groups: {
            'socket.close': {
                label: 'socket . close',
                tooltip: '关闭和服务器端的以太网通信链接',
                index: 1
            }
        }
    },
    'socket.read': {
    inputs: {
      params: {
        'read_type': {
          type: 'select-box',
          options: options.Socket_ReadSend_Type,
          defaultValue: 1,
          label: '数据类型',
          group: 'socket.read',
          index: 1
        },
        'msg_received': {
          type: 'textarea',
          defaultValue: 'string',
          when: {eq: {'params/read_type':1}},
          label: 'message received',
          group: 'parameters',
          index: 1
        },
        'len': {
          type: 'number',
          min: 2,
          step: 1,
          defaultValue: 100,
          when: {eq: {'params/read_type':1}},
          label: 'length',
          group: 'parameters',
          index: 2
        },
        'array_received': {
          type: 'textarea',
          defaultValue: 'array',
          when: {eq: {'params/read_type':2}},
          label: 'Array received',
          group: 'parameters',
          index: 1
        }
      }
    },
    groups: {
      'socket.read': {
        label: 'socket . read',
        tooltip: '从已连接的服务器接收数据',
        index: 1
      },
      parameters: {
        label: '参数',
        tooltip: '无',
        index: 2
      }
    }
  },
    'socket.send': {
    inputs: {
      params: {
        'send_type': {
          type: 'select-box',
          options: options.Socket_ReadSend_Type,
          defaultValue: 1,
          label: '数据类型',
          group: 'socket.send',
          index: 1
        },
        'msg_send': {
          type: 'textarea',
          defaultValue: '',
          when: {eq: {'params/send_type': 1}},
          label: 'message to send',
          group: 'parameters',
          index: 1
        },
        'array_send': {
          type: 'textarea',
          defaultValue: '',
          when: {eq: {'params/send_type': 2}},
          label: 'array to send',
          group: 'parameters',
          index: 1
        }
      }
    },
    groups: {
      'socket.send': {
        label: 'socket . send',
        tooltip: '发送数据给已连接的服务器，浮点数据之间以逗号\" , \"分隔',
        index: 1
      },
      parameters: {
        label: '参数',
        tooltip: '无',
        index: 2
      }
    }
  },
    // 'socket.read_string': {
    //     inputs: {
    //         params: {
    //             'msg_received': {
    //                 type: 'textarea',
    //                 defaultValue: 'string',
    //                 label: 'message received',
    //                 group: 'socket.read_string',
    //                 index: 1
    //             },
    //             'len': {
    //                 type: 'number',
    //                 min: 2,
    //                 step: 1,
    //                 defaultValue: 100,
    //                 label: 'length',
    //                 group: 'socket.read_string',
    //                 index: 2
    //
    //             }
    //         }
    //     },
    //     groups: {
    //         'socket.read_string': {
    //             label: 'socket . read_string',
    //             tooltip: '从已连接的服务器接收一定长度的字符串',
    //             index: 1
    //         }
    //     }
    // },
    // 'socket.read_float': {
    //     inputs: {
    //         params: {
    //             'array_received': {
    //                 type: 'textarea',
    //                 defaultValue: 'array',
    //                 label: 'Array received',
    //                 group: 'socket.read_float',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'socket.read_float': {
    //             label: 'socket . read_float',
    //             tooltip: '从已连接的服务器接收一组浮点数',
    //             index: 1
    //         }
    //     }
    // },
    // 'socket.send_string': {
    //     inputs: {
    //         params: {
    //             'msg_send': {
    //                 type: 'textarea',
    //                 defaultValue: '',
    //                 label: 'message to send',
    //                 group: 'socket.send_string',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'socket.send_string': {
    //             label: 'socket . send_string',
    //             tooltip: '发送字符串给已连接的服务器',
    //             index: 1
    //         }
    //     }
    // },
    // 'socket.send_float': {
    //     inputs: {
    //         params: {
    //             'array_send': {
    //                 type: 'textarea',
    //                 defaultValue: '',
    //                 label: 'array to send',
    //                 group: 'socket.send_float',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'socket.send_float': {
    //             label: 'socket . send_float',
    //             tooltip: '发送浮点数数组给已连接的服务器，数据之间以逗号\" , \"分隔',
    //             index: 1
    //         }
    //     }
    // },

    'system.sleep': {
        inputs: {
            params: {
                'time': {
                    type: 'number',
                    min: 0,
                    max: 100000,
                    step: 1,
                    defaultValue: 1000,
                    label: 'time',
                    group: 'sleep',
                    index: 1

                }
            }
        },
        groups: {
            'sleep': {
                label: 'system . sleep',
                tooltip: '该函数会让程序暂停一定时间（每个sleep函数最长暂停10s',
                index: 1
            }
        }
    },

    // 'IO_tool.io_out': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 6,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'io_out',
    //                 index: 1
    //             },
    //             'val': {
    //                 type: 'number',
    //                 min: 0,
    //                 max: 1,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'val',
    //                 group: 'io_out',
    //                 index: 2
    //             }
    //         }
    //     },
    //     groups: {
    //         'io_out': {
    //             label: 'io_out',
    //             tooltip: '该函数可控制控制柜上的IO输出口的高低电平',
    //             index: 1
    //         }
    //     }
    // },
    // 'IO_tool.io_in': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 6,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'io_in',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'io_in': {
    //             label: 'io_in',
    //             tooltip: '该函数可读取控制柜上的IO输入口的高低电平，返回1为高电平，0为低电平',
    //             index: 1
    //         }
    //     }
    // },
    // 'IO_tool.io_v_out': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 10,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'io_v_out',
    //                 index: 1
    //             },
    //             'val': {
    //                 type: 'number',
    //                 min: 0,
    //                 max: 1,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'val',
    //                 group: 'io_v_out',
    //                 index: 2
    //             }
    //         }
    //     },
    //     groups: {
    //         'io_v_out': {
    //             label: 'io_v_out',
    //             tooltip: '该函数可控制系统内部虚拟IO的高低电平',
    //             index: 1
    //         }
    //     }
    // },
    // 'IO_tool.io_v_in': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 10,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'io_v_in',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'io_v_in': {
    //             label: 'io_v_in',
    //             tooltip: '该函数可读取系统内部虚拟IO的高低电平，返回1为高电平，0为低电平',
    //             index: 1
    //         }
    //     }
    // },
    // 'IO_tool.tool_out': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 2,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'tool_out',
    //                 index: 1
    //             },
    //             'val': {
    //                 type: 'number',
    //                 min: 0,
    //                 max: 1,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'val',
    //                 group: 'tool_out',
    //                 index: 2
    //             }
    //         }
    //     },
    //     groups: {
    //         'tool_out': {
    //             label: 'tool_out',
    //             tooltip: '该函数可控制机械臂末端的IO输出口的高低电平',
    //             index: 1
    //         }
    //     }
    // },
    // 'IO_tool.tool_in': {
    //     inputs: {
    //         params: {
    //             'portnum': {
    //                 type: 'number',
    //                 min: 1,
    //                 max: 2,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'port number',
    //                 group: 'tool_in',
    //                 index: 1
    //             }
    //         }
    //     },
    //     groups: {
    //         'tool_in': {
    //             label: 'tool_in',
    //             tooltip: '该函数可读取控机械臂末端的IO输入口的高低电平，返回1为高电平，0为低电平',
    //             index: 1
    //         }
    //     }
    // },
    'IO_tool.io_out': {
    inputs: {
      params: {
        'type':{
          type: 'select-box',
          options: options.IOType,
          defaultValue: 1,
          when: {ne: {'params/portnum': ''}},
          label: 'IO类型',
          group:  'io_out',
          index: 1
        },
        'portnum_io': {
          type: 'select-box',
          options: options.IO_Port,
          // min: 1,
          // // max: 6,
          // max: 6,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '1'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        },
        'portnum_virtual_io': {
          type: 'select-box',
          options: options.IO_Virtual_Port,
          // min: 1,
          // // max: 6,
          // max: 10,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '2'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        },
        'portnum_tool_io': {
          type: 'select-box',
          options: options.IO_Tool_Port,
          // min: 1,
          // // max: 6,
          // max: 2,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '3'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        },
        'val': {
          type: 'select-box',
          options: options.IO_Value,
          // min: 0,
          // max: 1,
          // step: 1,
          defaultValue: 1,
          label: 'val',
          group: 'parameters',
          index: 3
        }
      }
    },
    groups: {
      'io_out': {
        label: 'io_out',
        // tooltip: '该函数可控制控制柜上的IO输出口的高低电平',
        tooltip: '该函数可控制IO输出口的高低电平',
        index: 1
      },
      'parameters': {
        label: '参数',
        // tooltip: '该函数可读取控制柜上的IO输入口的高低电平，返回1为高电平，0为低电平',
        tooltip: '选择端口号',
        index: 2
      }
    }
  },
    'IO_tool.io_in': {
    inputs: {
      params: {
        'type':{
          type: 'select-box',
          options: options.IOType,
          defaultValue: 1,
          // when: {ne: {'params/portnum': ''}},
          label: 'IO类型',
          group:  'io_in',
          index: 1
        },
        'portnum_io': {
          type: 'select-box',
          options: options.IO_Port,
          // min: 1,
          // // max: 6,
          // max: 6,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '1'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        },
        'portnum_virtual_io': {
          type: 'select-box',
          options: options.IO_Virtual_Port,
          // min: 1,
          // // max: 6,
          // max: 10,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '2'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        },
        'portnum_tool_io': {
          type: 'select-box',
          options: options.IO_Tool_Port,
          // min: 1,
          // // max: 6,
          // max: 2,
          // step: 1,
          defaultValue: 1,
          when: {eq: {'params/type': '3'}},
          label: 'port number',
          group: 'parameters',
          index: 2
        }
      }
    },
    groups: {
      'io_in': {
        label: 'io_in',
        // tooltip: '该函数可读取控制柜上的IO输入口的高低电平，返回1为高电平，0为低电平',
        tooltip: '该函数可读取IO输入口的高低电平，返回1为高电平，0为低电平',
        index: 1
      },
      'parameters': {
        label: '参数',
        // tooltip: '该函数可读取控制柜上的IO输入口的高低电平，返回1为高电平，0为低电平',
        tooltip: '选择端口号',
        index: 2
      }
    }
  },
    'IO_tool.coordinate_user': {
        inputs: {
            params: {
                x: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'X',
                    group: 'user',
                    index: 1
                },
                y: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'Y',
                    group: 'user',
                    index: 2
                },
                z: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'Z',
                    group: 'user',
                    index: 3
                },
                rx: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RX',
                    group: 'user',
                    index: 4
                },
                ry: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RY',
                    group: 'user',
                    index: 5
                },
                rz: {
                    type: 'number',
                    min: -3.14,
                    max: 3.14,
                    step: 0.02,
                    defaultValue: 0,
                    unit: 'rad',
                    label: 'RZ',
                    group: 'user',
                    index: 6
                }
            }
        },
        groups: {
            user: {
                label: "coordinate_user",
                tooltip: '设置用户坐标系相对于基坐标系的位移，设置后，后续运动函数中的位置均使用此工具坐标系  ' +
                'x, y, z, rx, ry, rz : 用户坐标系相对于基坐标系的位移（单位：mm，rad） ',
                index: 1
            }
        }
    },
    'IO_tool.coordinate_tool': {
        inputs: {
            params: {
                movement: {
                    x: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'X',
                        group: 'movement',
                        index: 1
                    },
                    y: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'Y',
                        group: 'movement',
                        index: 2
                    },
                    z: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'Z',
                        group: 'movement',
                        index: 3
                    },
                    rx: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'RX',
                        group: 'movement',
                        index: 4
                    },
                    ry: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'RY',
                        group: 'movement',
                        index: 5
                    },
                    rz: {
                        type: 'number',
                        min: -3.14,
                        max: 3.14,
                        step: 0.02,
                        defaultValue: 0,
                        unit: 'rad',
                        label: 'RZ',
                        group: 'movement',
                        index: 6
                    }
                },
                tcpLoad: {
                    type: 'number',
                    min: 0,
                    step: 1,
                    defaultValue: 0,
                    label: 'TCP Load',
                    group: 'tcpLoad',
                    index: 1
                },
                loadBias: {
                    'loadBiasX': {
                        type: 'number',
                        min: 0,
                        step: 1,
                        defaultValue: 0,
                        label: 'Load Bias X',
                        group: 'loadBias',
                        index: 1
                    },
                    'loadBiasY': {
                        type: 'number',
                        min: 0,
                        step: 1,
                        defaultValue: 0,
                        label: 'Load Bias Y',
                        group: 'loadBias',
                        index: 2
                    },
                    'loadBiasZ': {
                        type: 'number',
                        min: 0,
                        step: 1,
                        defaultValue: 0,
                        label: 'Load Bias Z',
                        group: 'loadBias',
                        index: 3
                    }
                }
            }
        },
        groups: {
            movement: {
                label: "movement",
                tooltip: '工具末端相对于法兰面坐标系的位移（单位：mm，rad）',
                index: 1
            },
            tcpLoad: {
                label: 'TCP load',
                tooltip: '负载质量（单位：kg）',
                index: 2
            },
            loadBias: {
                label: 'Load Bias',
                tooltip: '负载质心相对末端偏移（单位：m）',
                index: 3
            }
        }
    },
    'IO_tool.coordinate_clear': {
        inputs: {
            params: {
                type: 'undefined',
                group: 'clear'
            }
        },
        groups: {
            'clear': {
                label: 'coordinate_clear',
                tooltip: '取消已设定的坐标系，后续移动函数使用基坐标',
                index: 1
            }
        }
    },
    'IO_tool.get_flange_pos': {
        inputs: {
            params: {
                pose: {
                    type: 'text',
                    defaultValue: '',
                    label: 'Pose',
                    group: 'pose',
                    index: 1
                }
            }
        },
        groups: {
            pose: {
                label: "get_flange_pos",
                tooltip: '该函数可获取当前状态下机械臂的末端位置，获取的末端位置记录在[POSE]变量: Pose中',
                index: 1
            }
        }
    },
    'IO_tool.get_joint_pos': {
        inputs: {
            params: {
                'axis': {
                    type: 'text',
                    defaultValue: '',
                    label: 'Axis',
                    group: 'axis',
                    index: 1
                }
            }
        },
        groups: {
            'axis': {
                label: "get_joint_pos",
                tooltip: '该函数可获取当前状态下机械臂各关节的角度,获取的1-7轴关节角度会记录在Array变量: Axis中',
                index: 1
            }
        }
    },

    'expressions.expression': {
        inputs: {
            params: {
                type: 'list',
                group: 'expressions',
                label: 'expression',
                item: {
                    type: 'object',
                    properties: {
                        expression: {
                            type: 'text',
                            defaultValue: '',
                            label: 'expression',
                            index: 1
                        }
                    }
                }
            }
        },
        groups: {
            expressions: {
                label: "expressions",
                tooltip: '声明，赋值语句',
                index: 1
            }
        }
    },

    'function.define_func': {
        inputs: {
            params: {
                functionName: {
                    type: 'text',
                    defaultValue: 'function',
                    label: 'Function name',
                    group: 'name',
                    index: 1
                },
                functionArgs: {
                    type: 'list',
                    group: 'arguments',
                    label: 'argument',
                    item: {
                        type: "object",
                        properties: {
                            'arg_type': {
                                type: 'text',
                                defaultValue: 'int',
                                label: 'type',
                                index: 1
                            },
                            'arg_name': {
                                type: 'text',
                                defaultValue: 'arg',
                                label: 'name',
                                index: 2
                            }
                        }
                    },
                    index: 1
                },
                content: {
                    type: 'textarea',
                    defaultValue: '',
                    label: 'content',
                    group: 'content',
                    index: 1
                },
                functionReturn: {
                    type: 'text',
                    defaultValue: '0',
                    label: 'return',
                    group: 'return',
                    index: 1
                }
            }
        },
        groups: {
            name: {
                label: 'function name',
                tooltip: '函数名称',
                index: 1
            },
            arguments: {
                label: "arguments",
                tooltip: '参数列表',
                index: 2
            },
            content: {
                label: 'content',
                tooltip: '语句列表',
                index: 3
            },
            return: {
                label: 'return',
                tooltip: '返回值',
                index: 4
            }
        }
    },

    // 'function.define_func': {
    //     inputs: {
    //         params: {
    //             type: 'list',
    //             group: 'function',
    //             label: 'function',
    //             item: {
    //                 type: 'object',
    //                 properties: {
    //                     functionName: {
    //                         type: 'text',
    //                         defaultValue: 'func',
    //                         label: 'Function name',
    //                         group: 'name',
    //                         index: 1
    //                     },
    //                     arguments: {
    //                         type: 'list',
    //                         group: 'arguments',
    //                         label: 'argument',
    //                         item: {
    //                             type: "object",
    //                             properties: {
    //                                 'arg_type': {
    //                                     type: 'text',
    //                                     defaultValue: 'int',
    //                                     label: 'type',
    //                                     index: 1
    //                                 },
    //                                 'arg_name': {
    //                                     type: 'text',
    //                                     defaultValue: 'arg1',
    //                                     label: 'name',
    //                                     index: 2
    //                                 }
    //                             }
    //                         }
    //                     },
    //                     content: {
    //                         type: 'textarea',
    //                         defaultValue: 'var a = 0;',
    //                         label: 'content',
    //                         group: 'content',
    //                         index: 1
    //                     },
    //                     return: {
    //                         type: 'text',
    //                         defaultValue: 'return 0;',
    //                         label: 'return',
    //                         group: 'return',
    //                         index: 1
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     groups: {
    //         name: {
    //             label: 'function name',
    //             tooltip: '函数名称',
    //             index: 2
    //         },
    //         arguments: {
    //             label: "arguments",
    //             tooltip: '参数列表',
    //             index: 3
    //         },
    //         content: {
    //             label: 'content',
    //             tooltip: '语句列表',
    //             index: 4
    //         },
    //         return: {
    //             label: 'return',
    //             tooltip: '返回值',
    //             index: 5
    //         },
    //         function: {
    //             label: 'Function',
    //             tooltip: '定义一个函数',
    //             index: 1
    //         }
    //     }
    // },

    // 'camera.calpos': {
    //     inputs: {
    //         params: {
    //             'x': {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 0.1,
    //                 defaultValue: 0,
    //                 label: 'X坐标',
    //                 group: 'calpos',
    //                 index: 1
    //             },
    //             'y': {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 0.1,
    //                 defaultValue: 0,
    //                 label: 'Y坐标',
    //                 group: 'calpos',
    //                 index: 2
    //             },
    //             'res': {
    //                 type: 'text',
    //                 defaultValue: '[]',
    //                 label: 'transformed pos',
    //                 group: 'calpos',
    //                 index: 3
    //             },
    //             'num': {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 1,
    //                 defaultValue: 1,
    //                 label: 'index',
    //                 group: 'calpos',
    //                 index: 4
    //             }
    //         }
    //     },
    //     groups: {
    //         calpos: {
    //             label: "calpos",
    //             tooltip: '该函数使用一键标定的结果，将目标像素点转换成机械臂基坐标下的x、y、z位置',
    //             index: 1
    //         }
    //     }
    // },
    // 'camera.capture': {
    //     inputs: {
    //         params: {
    //             IP: {
    //                 type: 'text',
    //                 defaultValue: '127.0.0.1',
    //                 label: 'IP',
    //                 group: 'capture',
    //                 index: 1
    //             },
    //             actionnum: {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'Action number',
    //                 group: 'capture',
    //                 index: 2
    //             },
    //             arr: {
    //                 type: 'text',
    //                 defaultValue: '[]',
    //                 label: 'Data Array',
    //                 group: 'capture',
    //                 index: 5
    //             },
    //             recvsize: {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 label: 'Receive size',
    //                 group: 'capture',
    //                 index: 4
    //             },
    //             timeout: {
    //                 type: 'number',
    //                 min: 0,
    //                 step: 1,
    //                 defaultValue: 5000,
    //                 label: 'Wait time(ms)',
    //                 group: 'capture',
    //                 index: 3
    //             }
    //         }
    //     },
    //     groups: {
    //         capture: {
    //             label: "capture",
    //             tooltip: '该函数用来接收从相机返回的数据，并返回给相机机械臂末端当前位置 ',
    //             index: 1
    //         }
    //     }
    // },

    'modbus.modbus_read': {
        inputs: {
            params: {
                signal_name: {
                    type: 'text',
                    defaultValue: 'mbus1',
                    group: 'modbus_read',
                    label: 'Signal name',
                    index: 1
                }
            }
        },
        groups: {
            modbus_read: {
                label: "modbus_read",
                tooltip: '该函数可读取modbus节点的数据，返回值为int类型',
                index: 1
            }
        }
    },
    'modbus.modbus_write': {
    inputs: {
      params: {
        write_type: {
          type: 'select-box',
          options: options.Modbus_Write_Type,
          defaultValue: 1,
          group: 'modbus_write',
          label: '节点类型',
        },
        signal_name: {
          type: 'text',
          defaultValue: 'mbus1',
          group: 'parameters',
          label: 'Signal name',
          index: 1
        },
        digital_value: {
          type: 'number',
          min: 0,
          max: 1,
          step: 1,
          defaultValue: 0,
          when: {eq: {'params/write_type': '1'}},
          group: 'parameters',
          label: 'Digital value',
          index: 2
        },
        register_value: {
          type: 'number',
          min: 0,
          max: 255,
          step: 1,
          defaultValue: 0,
          when: {eq: {'params/write_type': '2'}},
          group: 'parameters',
          label: 'Register value',
          index: 2
        }
      }
    },
    groups: {
      modbus_write: {
        label: "modbus_write",
        tooltip: '该函数可对modbus节点进行写操作',
        index: 1
      },
      parameters: {
        label: "参数",
        tooltip: '设置modbus节点参数',
        index: 2
      }
    }
  },
    // 'modbus.modbus_write_d': {
    //     inputs: {
    //         params: {
    //             signal_name: {
    //                 type: 'text',
    //                 defaultValue: 'mbus1',
    //                 group: 'modbus_write_d',
    //                 label: 'Signal name',
    //                 index: 1
    //             },
    //             digital_value: {
    //                 type: 'number',
    //                 min: 0,
    //                 max: 1,
    //                 step: 1,
    //                 defaultValue: 0,
    //                 group: 'modbus_write_d',
    //                 label: 'Digital value',
    //                 index: 2
    //             }
    //         }
    //     },
    //     groups: {
    //         modbus_write_d: {
    //             label: "modbus_write_d",
    //             tooltip: '该函数可对digital类型的modbus节点进行写操作',
    //             index: 1
    //         }
    //     }
    // },
    // 'modbus.modbus_write_r': {
    //     inputs: {
    //         params: {
    //             signal_name: {
    //                 type: 'text',
    //                 defaultValue: 'mbus1',
    //                 group: 'modbus_write_r',
    //                 label: 'Signal name',
    //                 index: 1
    //             },
    //             register_value: {
    //                 type: 'number',
    //                 min: -32768,
    //                 max: 32768,
    //                 step: 1,
    //                 defaultValue: 255,
    //                 group: 'modbus_write_r',
    //                 label: 'Register value',
    //                 index: 2
    //             }
    //         }
    //     },
    //     groups: {
    //         modbus_write_r: {
    //             label: "modbus_write_r",
    //             tooltip: '该函数可对register类型的modbus节点进行写操作',
    //             index: 1
    //         }
    //     }
    // },
    'modbus.modbus_set_frequency': {
        inputs: {
            params: {
                signal_name: {
                    type: 'text',
                    defaultValue: 'mbus1',
                    group: 'modbus_set_frequency',
                    label: 'Signal name',
                    index: 1
                },
                digital_value: {
                    type: 'number',
                    min: 1,
                    max: 100,
                    step: 1,
                    defaultValue: 10,
                    group: 'modbus_set_frequency',
                    label: 'Frequency',
                    index: 2
                }
            }
        },
        groups: {
            modbus_set_frequency: {
                label: "modbus_set_frequency",
                tooltip: '该函数可修改modbus节点的刷新频率，默认频率为10Hz',
                index: 1
            }
        }
    },
    'modbus.modbus_add_signal': {
        inputs: {
            params: {
                IP: {
                    type: 'text',
                    defaultValue: '127.0.0.1',
                    group: 'modbus_add_signal',
                    label: 'IP',
                    index: 1
                },
                slave_number: {
                    type: 'number',
                    min: 0,
                    max: 1,
                    step: 1,
                    defaultValue: 0,
                    group: 'modbus_add_signal',
                    label: 'Slave no.',
                    index: 2
                },
                signal_address: {
                    type: 'number',
                    min: 0,
                    max: 1,
                    step: 1,
                    defaultValue: 0,
                    group: 'modbus_add_signal',
                    label: 'Signal address',
                    index: 3
                },
                signal_type: {
                    type: 'number',
                    min: 0,
                    max: 3,
                    step: 1,
                    defaultValue: 0,
                    group: 'modbus_add_signal',
                    label: 'Signal type',
                    index: 4
                },
                signal_name: {
                    type: 'text',
                    defaultValue: 'mbus1',
                    group: 'modbus_add_signal',
                    label: 'Signal name',
                    index: 5
                }
            }
        },
        groups: {
            modbus_add_signal: {
                label: "modbus_add_signal",
                tooltip: '该函数可添加modbus节点，也可在系统设置中手动添加',
                index: 1
            }
        }
    },
    'modbus.modbus_delete_signal': {
        inputs: {
            params: {
                signal_name: {
                    type: 'text',
                    defaultValue: 'mbus1',
                    group: 'modbus_delete_signal',
                    label: 'Signal name',
                    index: 1
                }
            }
        },
        groups: {
            modbus_delete_signal: {
                label: "modbus_delete_signal",
                tooltip: '该函数可删除modbus节点，也可在系统设置中删除modbus节点',
                index: 1
            }
        }
    },

    'state.Start': {
        // inputs: {
        //     attrs: {
        //         text: {
        //             text: {
        //                 type: 'content-editable',
        //                 label: 'Text',
        //                 group: 'text',
        //                 index: 1
        //             }
        //         }
        //     }
        // },
        groups: {
            text: {
                label: 'Text',
                index: 1
            }
        }
    },
    'logic.If': {
        inputs: {
            question: {
                type: 'content-editable',
                label: 'Condition',
                group: 'logic.If',
                index: 1
            }
        },
        groups: {
            'logic.If': {
                label: 'logic.If',
                index: 1
            }
        }
    },
    'logic.While': {
        inputs: {
            question: {
                type: 'content-editable',
                label: 'Condition',
                group: 'logic.While',
                index: 1
            }
        },
        groups: {
            'logic.If': {
                label: 'logic.While',
                index: 1
            }
        }
    }
};

export {inspector};
