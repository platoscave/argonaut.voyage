import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css' // include this for missing icons in nav menu, remove when fixed
import 'element-theme-dark'
import VueRx from "vue-rx"
import { Observable } from "rxjs"

// Defined galobaly due to their recusive nature
import Layout from './components/Layout.vue';
Vue.component('ar-layout', Layout)
import Page from './components/Page.vue'
Vue.component('ar-page', Page)
import SubForm from './components/widgets/controls/SubForm';
Vue.component('ar-sub-form', SubForm)
import SubTable from './components/widgets/controls/SubTable';
Vue.component('ar-sub-table', SubTable)

Vue.use(ElementUI, { locale })
Vue.use(VueRx, { Observable })


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

import kiContext from '@kiyoaki_w/vue-context'
Vue.use(kiContext)
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowRight, faArrowLeft, faArrowUp, faArrowDown, faPlusCircle, faMinusCircle, faClone } from '@fortawesome/free-solid-svg-icons'
library.add(faArrowRight, faArrowLeft, faArrowUp, faArrowDown, faPlusCircle, faMinusCircle, faClone)
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
