
let stencil = stencil || {};

stencil.groups = {
    motionControl: { index: 1, label: '运动控制' ,layout: {
        // columnWidth: 80,
        // columns: 2,
        // rowHeight: 60,
        // resizeToFit: !0,
        // dy: 8,
        // dx: 4
      }},
    socket: { index: 2, label: '网络通信 (socket)'},
    system: { index: 3, label: '系统函数'},
    IO_tool: {index: 4, label: '外设'},
    expressions: {index: 5, label: '变量&表达式'},
    logic: { index: 6, label: '逻辑语句' ,layout: {
        columnWidth: 200 - 30,
        columns: 1,
        rowHeight: 140,
        resizeToFit: !0,
        dy: 8,
        dx: 4
    }},
    function: {index: 7, label: '函数定义'},
    // camera: { index: 8, label: '相机工具' },
    Modbus: {index: 9, label: 'Modbus',layout: {
        columnWidth: 200 - 30,
        columns: 1,
        rowHeight: 45,
        resizeToFit: !0,
        dy: 4,
        dx: 4
    }},
    state: { index: 0, label: '起始状态' }
};

stencil.shapes = {};

stencil.shapes.motionControl = [
    {
        type: 'motionControl.movel',
        attrs: {
            '.': {
                'data-tooltip': '控制机械臂末端从当前状态按照直线路径移动到目标状态'
            }
        },
        params: [{
            // pose: {
            //     'x': undefined,
            //     'y': undefined,
            //     'z': undefined,
            //     'rx': undefined,
            //     'ry': undefined,
            //     'rz': undefined
            // },
            // 'speed': 200,
            // 'acc': 2000,
            // 'rad': undefined,
            // 'psi':undefined
        }]
    },
    {
        type: 'motionControl.movej',
        attrs: {
            '.': {
                'data-tooltip': '控制机械臂从当前状态，按照关节运动的方式移动到目标关节角状态'
            }
        },
        params: [{
            // axis: {
            //     'axis_1': 1.04,
            //     'axis_2': 2,
            //     'axis_3': 3,
            //     'axis_4': 4,
            //     'axis_5': 5,
            //     'axis_6': 6,
            //     'axis_7': 7
            // },
            // 'speed': 0.5,
            // 'acc': 4,
            // 'rad': 0
        }]
    },
    {
        type: 'motionControl.movej_pose',
        attrs: {
            '.': {
                'data-tooltip': '控制机械臂从当前状态，按照关节运动的方式移动到末端目标位置'
            }
        },
        params: [{
            // pose: {
            //     'x': 1.04,
            //     'y': 2,
            //     'z': 3,
            //     'rx': 4,
            //     'ry': 5,
            //     'rz': 6
            // },
            // 'speed': 0.5,
            // 'acc': 4
        }]
    },
    {
      type: 'motionControl.movec',
      attrs: {
        '.': {
          'data-tooltip': '控制机械臂做圆弧运动'
        }
      },
      params: [{
        pose: []
        // pose_1: {
        //     'x': 1.04,
        //     'y': 2,
        //     'z': 3,
        //     'rx': 4,
        //     'ry': 5,
        //     'rz': 6
        // },
        // pose_2: {
        //     'x': 1.04,
        //     'y': 2,
        //     'z': 3,
        //     'rx': 4,
        //     'ry': 5,
        //     'rz': 6
        // },
        // 'speed': 10,
        // 'acc': 4,
        // 'rad': 3,
        // 'psi':0.2
      }]
    },
    {
        type: 'motionControl.tcp_move',
        attrs: {
            '.': {
                'data-tooltip': '控制机械臂沿末端法兰面坐标系直线移动一个增量'
            }
        },
        params: [{
            // 'x': 0.0,
            // 'y': 0.0,
            // 'z': 0.0,
            // 'speed': 0.0
        }]
    }
];
stencil.shapes.socket = [
    {
        type: 'socket.open',
        attrs: {
            '.': {
                'data-tooltip': '打开一个以太网的通信链接'
            }
        }
    },
    {
        type: 'socket.close',
        attrs: {
            '.': {
                'data-tooltip': '关闭和服务器端的以太网通信链接'
            }
        }
    },
    {
      type: 'socket.send',
      attrs: {
        '.': {
          'data-tooltip': '发送数据给已连接的服务器'
        }
      }
    },
    {
      type: 'socket.read',
      attrs: {
        '.': {
          'data-tooltip': '从已连接的服务器接收数据'
        }
      }
    },
    // {
    //     type: 'socket.send_string',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '发送字符串给已连接的服务器'
    //         }
    //     }
    // },
    // {
    //     type: 'socket.send_float',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '发送浮点数数组给已连接的服务器'
    //         }
    //     }
    // },
    // {
    //     type: 'socket.read_string',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '从已连接的服务器接收一定长度的字符串'
    //         }
    //     }
    // },
    // {
    //     type: 'socket.read_float',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '从已连接的服务器接收一组浮点数'
    //         }
    //     }
    // }
];
stencil.shapes.system = [{
    type: 'system.sleep',
    attrs: {
        '.': {
            'data-tooltip': '让程序暂停一定时间'
        }
    }
}];
stencil.shapes.IO_tool = [
    {
    type: 'IO_tool.io_out',
    attrs: {
      '.': {
        'data-tooltip': '控制控制柜上的IO输出口的高低电平',
        'data-tooltip-position': 'left',
        'data-tooltip-position-selector': '.joint-stencil'
      }
    }
  },
    {
    type: 'IO_tool.io_in',
    attrs: {
      '.': {
        // 'data-tooltip': '读取控制柜上的IO输入口的高低电平'
        'data-tooltip': '读取IO输入口的高低电平'
      }
    }
  },
    // {
    //     type: 'IO_tool.io_out',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '控制控制柜上的IO输出口的高低电平',
    //             'data-tooltip-position': 'left',
    //             'data-tooltip-position-selector': '.joint-stencil'
    //         }
    //     }
    // },
    // {
    //     type: 'IO_tool.io_in',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '读取控制柜上的IO输入口的高低电平'
    //         }
    //     }
    // },
    // {
    //     type: 'IO_tool.io_v_out',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '控制系统内部虚拟IO的高低电平'
    //         }
    //     }
    // },
    // {
    //     type: 'IO_tool.io_v_in',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '读取系统内部虚拟IO的高低电平'
    //         }
    //     }
    // },
    // {
    //     type: 'IO_tool.tool_out',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '控制机械臂末端的IO输出口的高低电平'
    //         }
    //     }
    // },
    // {
    //     type: 'IO_tool.tool_in',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '读取控机械臂末端的IO输入口的高低电平'
    //         }
    //     }
    // },
    {
        type: 'IO_tool.coordinate_user',
        attrs: {
            '.': {
                'data-tooltip': '设置用户坐标系相对于基坐标系的位移，设置后，后续运动函数中的位置均使用此工具坐标系',
            }
        }
    },
    {
        type: 'IO_tool.coordinate_tool',
        attrs: {
            '.': {
                'data-tooltip': '设置工具末端相对于法兰面坐标系的位移，设置后，后续运动函数中的位置均使用此工具坐标系',
            }
        }
    },
    {
        type: 'IO_tool.coordinate_clear',
        attrs: {
            '.': {
                'data-tooltip': '取消已设定的坐标系，后续移动函数使用基坐标'
            }
        }
    },
    {
        type: 'IO_tool.get_flange_pos',
        attrs: {
            '.': {
                'data-tooltip': '获取当前状态下机械臂的末端位置'
            }
        }
    },
    {
        type: 'IO_tool.get_joint_pos',
        attrs: {
            '.': {
                'data-tooltip': '获取当前状态下机械臂各关节的角度'
            }
        }
    }
];
stencil.shapes.expressions = [
    {
        type: 'expressions.expression',
        attrs: {
            '.': {
                'data-tooltip': '表达式'
            }
        },
        params: [{
            'expression': ''
        }]
    }
];

stencil.shapes.logic = [
    {
        type: 'logic.If',
        size: { width: 40, height: 40 },
        question: 'if(?)',
        options: [
            { id: 'yes', text: 'Yes' },
            { id: 'no', text: 'No' }
        ]
    },
    {
      type: 'logic.While',
      size: { width: 40, height: 40 },
      question: 'while(?)',
      options: [{id: 'while', text: 'Loop Content'}],
      outPorts: [{id: 'end',label:'End'}]
    }
];

stencil.shapes.function = [
    {
        type: 'function.define_func',
        attrs: {
            '.': {
                'data-tooltip': '定义一个函数'
            }
        }
    }
];
// stencil.shapes.camera = [
//     {
//         type: 'camera.capture',
//         attrs: {
//             '.': {
//                 'data-tooltip': '接收从相机返回的数据，并返回给相机机械臂末端当前位置'
//             }
//         }
//     },
//     {
//         type: 'camera.calpos',
//         attrs: {
//             '.': {
//                 'data-tooltip': '使用一键标定的结果，将目标像素点转换成机械臂基坐标下的x、y、z位置'
//             }
//         }
//     }
// ];
stencil.shapes.Modbus = [
    // {
    //     type: 'modbus_read',
    //     size: { width: 3, height: 1 },
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '读取modbus节点的数据',
    //             'data-tooltip-position': 'left',
    //             'data-tooltip-position-selector': '.joint-stencil'
    //         },
    //         rect: {
    //             fill:'#feb663',
    //             width: 100,
    //             height: 35,
    //             rx: 2,
    //             ry: 2,
    //             stroke: '#3c4260',
    //             'stroke-width': 2,
    //             'stroke-dasharray': '0'
    //         },
    //         text: {
    //             text: 'modbus_read',
    //             fill: '#3c4260',
    //             'font-family': 'Arial',
    //             'font-weight': 'Normal',
    //             'font-size': 12,
    //             'stroke-width': 0
    //         }
    //     },
    //     params: {
    //         'signal_name': 'mbus1'
    //     }
    // },
    {
        type: 'modbus.modbus_read',
        attrs: {
            '.': {
                'data-tooltip': '读取modbus节点的数据'
            }
        }
    },
    {
    type: 'modbus.modbus_write',
    attrs: {
      '.': {
        'data-tooltip': '对modbus节点进行写操作'
      }
    }
  },
    // {
    //     type: 'modbus.modbus_write_d',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '对digital类型的modbus节点进行写操作'
    //         }
    //     }
    // },
    // {
    //     type: 'modbus.modbus_write_r',
    //     attrs: {
    //         '.': {
    //             'data-tooltip': '对register类型的modbus节点进行写操作'
    //         }
    //     }
    // },
    {
        type: 'modbus.modbus_set_frequency',
        attrs: {
            '.': {
                'data-tooltip': '修改modbus节点的刷新频率'
            }
        }
    },
    {
        type: 'modbus.modbus_add_signal',
        attrs: {
            '.': {
                'data-tooltip': '添加modbus节点'
            }
        }
    },
    {
        type: 'modbus.modbus_delete_signal',
        attrs: {
            '.': {
                'data-tooltip': '删除modbus节点'
            }
        }
    }
];

stencil.shapes.state = [
    {
        type: 'state.Start'
    },
  {
    type: 'state.Rectangle',
    size: { width: 5, height: 3 },
    attrs: {
      '.': {
        dataTooltip: 'Rectangle'
      }
    }
  }
];

export {stencil};
