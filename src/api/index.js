import axios from 'axios'

let base = 'http://192.168.12.250:3000/api'

export const requestLogin = params => { return axios.post('http://192.168.12.250:3000/login', params)}

export const getStatus = params => { return axios.get(`${base}/status?api-key=siasun`, { params: params })}

export const jogTask = params => { return axios.post(`${base}/task?api-key=siasun`, params)}

export const moveTask = params => { return axios.post(`${base}/task?api-key=siasun`, params)}

export const moveInit = () => {
    let para = {
        deviceId: 1,
        cmd: "move",
        data: {
            type: 0,
            pose: [0,0,0,0,0,0,0],
            pose2: [],
            speed: 70,
            acc: 0,
            rad: -1,
            psi: 999
        }
    }
    return axios.post(`${base}/task?api-key=siasun`, para)
}

export const moveTo = (type, pose, jogSpeed) => {
    let para = {
        deviceId: 1,
        cmd: "move",
        data: {
            type: type,
            pose: [],
            pose2: [],
            speed: 70,
            acc: 0,
            rad: -1,
            psi: 999
        }
    }

    if (type == 0) {
        //movej
        for (let i = 0; i < 7; i++) para.data.pose[i] = pose[i]
        para.data.speed = jogSpeed * 0.3
    } else if (type == 1) {
        //movel
        for (let i = 0; i < 6; i++) para.data.pose[i] = pose[i]
        para.data.speed = 500 * jogSpeed/100
    } else if (type == 3) {
        // cartesian movej
        for (let i = 0; i < 6; i++) para.data.pose[i] = pose[i]
        para.data.speed = jogSpeed * 0.3
    }
    
    return axios.post(`${base}/task?api-key=siasun`, para)
}

export const switch2Teach = () => {
    return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "teach" })
}

export const ioTask = params => { return axios.post(`${base}/task?api-key=siasun`, params)}

export const scriptTask = params => { return axios.post(`${base}/task?api-key=siasun`, params)}

export const powerOn = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "powerOn" }) }

export const powerOff = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "powerOff" }) }

export const enable = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "enable" }) }

export const disable = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "disable" }) }

export const start = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "start" }) }

export const stopTask = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "stop" })}

export const pauseTask = () => {return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd:"pause"})}

export const resumeTask = () => { return axios.post(`${base}/task?api-key=siasun`, { deviceId: 1, cmd: "resume" }) }

export const getParams = params => { return axios.get(`${base}/param?api-key=siasun`, { params: params })}

export const postParams = params => { return axios.post(`${base}/param?api-key=siasun`, params)}

export const getScripts = params => { return axios.get(`${base}/scripts?api-key=siasun`, { params: params })}

export const readScript = params => { return axios.get(`${base}/scripts/${params.name}?api-key=siasun`, { params: params }) }

export const getLogs = params => { return axios.get(`${base}/logs?api-key=siasun`, { params: params })}

export const readLog = params => { return axios.get(`${base}/logs/${params.name}?api-key=siasun`, { params: params }) }

export const setTcp = params => {return axios.post(`${base}/config/tcp?api-key=siasun`, params)}

export const getConfigs = params => { return axios.get(`${base}/config/init?api-key=siasun`, { params: params })}

export const editConfig = params => { return axios.post(`${base}/config/init?api-key=siasun`, params)}

export const getUserCoords = params => { return axios.get(`${base}/config/usercoords?api-key=siasun`, { params: params }) }
export const addUserCoord = params => { return axios.put(`${base}/config/usercoords?api-key=siasun`, params) }
export const updateUserCoord = params => { return axios.post(`${base}/config/usercoords?api-key=siasun`, params) }
export const deleteUserCoord = params => { return axios.delete(`${base}/config/usercoords?api-key=siasun`, params) }

export const getTcpCoords = params => { return axios.get(`${base}/config/toolcoords?api-key=siasun`, { params: params }) }
export const getToolCoords = params => { return axios.get(`${base}/config/toolcoords?api-key=siasun`, { params: params }) }
export const sendProgram = params => { return axios.post(`${base}/program?api-key=siasun`, params) }
