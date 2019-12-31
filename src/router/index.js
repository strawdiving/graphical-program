import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/views/Dashboard'
import Program from '@/views/Program'


Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        { path:'',name: 'dashboard',component: Dashboard},
        { path: '/program', name: 'program', component: Program },
      ]
    }
  ]
})
