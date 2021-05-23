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
import debugPouch from "pouchdb-debug"

// Defined galobaly due to their recusive nature
import Layout from './components/Layout.vue';
Vue.component('ar-layout', Layout)
import Page from './components/Page.vue'
Vue.component('ar-page', Page)
import SubForm from './components/widgets/controls/SubForm';
Vue.component('ar-sub-form', SubForm)
import SubTable from './components/widgets/controls/SubTable';
Vue.component('ar-sub-table', SubTable)

Vue.use( ElementUI, { locale })
PouchDB.plugin(pouchdbFind)
PouchDB.plugin(pouchdbLiveFind)
PouchDB.plugin(pouchdbUpsert)
//PouchDB.plugin(debugPouch)
debugPouch(PouchDB);


import VueHighlightJS from 'vue-highlight.js';
// Highlight.js languages (Only required languages)
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/vs2015.css';
Vue.use(VueHighlightJS, {
	// Register only languages that you want
	languages: {
    javascript,
    json,
    xml
	}
});


Vue.use(PouchVue, {
  pouch: PouchDB,
  defaultDB: 'blockprocess',
  //debug: '*'
});
Vue.prototype.$settings= new PouchDB('settings');

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
