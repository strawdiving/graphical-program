/**
 * 坐标系设置、牵引示教等
 */
const state = {
    coordinate: [0, 0, 0, 0, 0, 0],
    tcpData: {
        tcpBias: [0, 0, 0, 0, 0, 0],
        pcLoad: 0,
        pcLoadPos: [0, 0, 0]
    },

    handTechSmoothAll: 0,
    handTechSmoothSep: [0, 0, 0, 0, 0, 0, 0],
    handTechRecordActive: false,

    collisionDetectActive: false,
    collisionSensitive: 0,
    collisionDyThresholdActive: false,
    CollisionDyThreshold: [0, 0, 0, 0, 0, 0, 0],

    tcpCalibration: {
        type: 0,
        step: 0,
        rXYZ: [0, 0, 0],
    },
    simulationMode: false
}

const mutations = {

}

const actions = {
}

export default {
    namespaced: false,
    state,
    actions,
    mutations
}