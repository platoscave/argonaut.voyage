import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css' // include this for missing icons in nav menu, remove when fixed
import 'element-theme-dark'
import * as PouchVue from 'pouch-vue';
import PouchDB from 'pouchdb-browser'
import pouchdbFind from 'pouchdb-find'
import pouchdbLiveFind from 'pouchdb-live-find'
import pouchdbUpsert from 'pouchdb-upsert'
import vClickOutside from 'v-click-outside'; // needed for context menu

// Defined galobaly due to their recusive nature
import Layout from './components/Layout.vue';
import Page from './components/Page.vue'
Vue.component('ar-layout', Layout)
Vue.component('ar-page', Page)

Vue.use( ElementUI, { locale })
PouchDB.plugin(pouchdbFind)
PouchDB.plugin(pouchdbLiveFind)
PouchDB.plugin(pouchdbUpsert)

Vue.use( vClickOutside )


Vue.use(PouchVue, {
  pouch: PouchDB,
  defaultDB: 'argonaut',
  //debug: '*'
});
Vue.prototype.$settings= new PouchDB('settings');

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
