import Vue from 'vue'
import App from './App.vue'

new Vue({
    render: h => h(App)
}).$mount('#app')

// Vue.component('myComponent',{
//     template: '<h1>{{hhh}}</h1>',
//     data() {
//         return {
//           hhh: 'hhhhhh'
//         }
//     }
// })

// new Vue({
//     el: '#app',
//     // components: {
//     //     App
//     // },
//     // template: '<APP/>'
//     data: {
//         message: 'hello webpack'
//     }
// })


