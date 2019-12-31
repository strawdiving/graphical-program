/**
 * 图形化编程相关state
 */

const state = {
    scriptList: [],
    visualProgList: [],
    initialProgramDoc: { "cells": [{ "type": "state.Start", "size": { "width": 60, "height": 36 }, "position": { "x": 500, "y": 300 }, "angle": 0, "id": "6768f5bb-eaa9-4f23-a7a7-048224f1a2f5", "z": 1, "attrs": {} }] },
    programDoc: { "cells": [] }
};

const mutations = {
    programGraph(state, JsonDoc) {
        state.programDoc = JSON.parse(JsonDoc.jsonStr);
        state.visualProgList.push(JsonDoc);
    },
    updateScriptList(state, list) {
        for(let i = 0; i < list.length; i++){
            let info = {};
            info.name = list[i].name;
            info.mtime = list[i].mtime;
            info.size = list[i].size;

            state.scriptList[i] = info
        }
    }
};

const actions = {
};

export default {
    // 使用全局命名空间
    namespaced: false,
    state,
    actions,
    mutations
}
