import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/views/Login'
import Home from '@/views/Home'
import Dashboard from '@/views/Dashboard'
import Program from '@/views/Program'
import Settings from '@/views/Settings'
import Status from '@/views/Status'
import Jog from '@/components/Jog'
import Log from '@/components/Log'
import IO from '@/components/IO'
import Pos from '@/components/Pos'
import Move from '@/components/Move'
// import Tcp from '@/components/Tcp'
import DP from '@/components/DefaultProg'
import CustomFunctions from '@/components/CustomFunctions'
import Coordinate from '@/components/Coordinate'
import JogLine from '@/components/JogLine'
import Init from '@/views/init'
// import Ctrl from '@/views/Ctrl'
// import Safety from '@/components/Safety'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        { path:'',name: 'dashboard',component: Dashboard},
        // { path: '/ctrl', name: 'ctrl', component: Ctrl },
        { path: '/program', name: 'program', component: Program },
        { path: '/status', name: 'status', component: Status},
        { path: '/settings', name: 'settings', component: Settings}
      ]
    },
    // {
    //   path: '/ctrl',
    //   name: 'ctrl',
    //   component: Ctrl
    // },
    // {
    //   path: '/program',
    //   name: 'program',
    //   component: Program
    // },
    // {
    //   path: '/run',
    //   name: 'run',
    //   component: Run
    // },
    // {
    //   path: '/settings',
    //   name: 'settings',
    //   component: Settings
    // },
    // {
    //   path: '/jog',
    //   name:'jog',
    //   component: Jog
    // }
    {
      path: '/coordinate',
      name: 'coordinate',
      component: Coordinate
    },
    {
      path: '/log',
      name:'log',
      component: Log
    },
    {
      path: '/io',
      name: 'io',
      component: IO
    },
    {
      path: '/pos',
      name: 'pos',
      component: Pos
    },
    {
      path: '/move',
      name: 'move',
      component: Move
    },
    // {
    //   path: '/tcp',
    //   name: 'tcp',
    //   component: Tcp
    // },
    {
      path: '/dp',
      name: 'dp',
      component: DP
    },
    {
      path: '/customFunctions',
      name: 'customFunctions',
      component: CustomFunctions
    },
    // {
    //   path: '/safety',
    //   name: 'safety',
    //   component: Safety
    // },
    {
      path: '/line',
      name: 'jogline',
      component:JogLine
    },
    {
      path: '/init',
      name: 'init',
      component: Init
    },
  ]
})
