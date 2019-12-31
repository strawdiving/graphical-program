import Vue from 'vue'
import Vuex from 'vuex'
import status from './modules/status'
import setValue from './modules/setValue'
import script from './modules/script'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        status,
        setValue,
        script
    },

})