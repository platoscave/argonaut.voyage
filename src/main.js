import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
//import 'element-ui/lib/theme-chalk/index.css'
import 'element-theme-dark'
import PouchVue from 'pouch-vue';
import PouchDB from 'pouchdb-browser'
import pouchdbFind from 'pouchdb-find'
import pouchdbLiveFind from 'pouchdb-live-find'

Vue.use( ElementUI, { locale })
PouchDB.plugin(pouchdbFind)
PouchDB.plugin(pouchdbLiveFind)

Vue.use(PouchVue, {
  pouch: PouchDB, 
  defaultDB: 'argonautDb'
});


Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
