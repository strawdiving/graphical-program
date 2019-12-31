/**
 * 机械臂状态，从中间层接收
 */
var joint = {
    axisNum: 0,
    actualPos: 0,
    setPos: 0,
    actualVel: 0,
    actualAcc: 0,
    actualCurrent: 0,
    actualVoltage: 0,
    actualTemp: 0,
    jointMode: 0,
    connected: false,
    enabled: false
}

const state = {
    //error info
    errorInfo: {
        errorIndex: 0,
        errorType: 0,
        errorMsg: '',
    },

    //program info
    progInfo: {
        programLine: 0,
        progRunning: false,
        printIndex: 0,
        printMsg: '',
    },

    //remote control info
    remoteInfo: {
        port2000: false,
        port2001: false,
        remoteRun: false,
        progPath: '',
        remoteStop: false,
        remoteLogin: false,
        remoteDisconnect: false,
        remoteShutdown: false,
    },

    //feedback from plc
    fromPLC: {
        taskID: 0,
        jointInfo: [joint, joint, joint, joint, joint, joint, joint],
        cartesianInfo: {
            actPos: [],
            setFeedbackPos: [],
            actVel: [],
            actAcc: [],
            tcpExternalForce: []
        },
        fbRobotData: {
            analogIn: 0,
            analogOut: 0,
            digitalIn: [],
            digitalOut: [],
            ioLinkStatus: [],
            controllerTemp: 0,
            robotVoltage: 0,
            robotCurrent: 0,
            toolIoIn: [],
            toolIoOut: [],
            toolButton: [],
            toolReceiveData: [],
            toolSendData: [],
            collision: false,
            collisionAxis: 0,
            exceedJointLimit: false,
            exceedWorkingLimit: false,
            emcStopSignal: false,
            slaveReady: [],
            errorID: [],
            controllerVersion: 0,
            robotLibVersion: 0,
            reserve: [],
            operationMode: 0,
            taskState: 0,
            taskType: 0,
            safetyMode: 0,
            robotState: 0,
        },
        virtualIO: [],
    },
    //modbus
    modbusConnection: [],

    terminalCount: 0
}

const mutations = {
    updateState(state, params) {
        function deepCopy(newobj, obj) {
            if (typeof obj != 'object') {
                return
            }
            for (var attr in obj) {
                if (typeof attr != 'object') {
                    newobj[attr] = obj[attr]
                } else {
                    deepCopy(newobj[attr], obj[attr])
                }

            }
        }
        deepCopy(state, params)
    }
}

const actions = {
}

export default {
    namespaced: false,
    state,
    actions,
    mutations
}