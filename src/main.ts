import { createApp } from "vue";
import App from "./App.vue";
// context menu
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import '~/styles/vue3-context-menu-dark.css'
import ContextMenu from '@imengyu/vue3-context-menu'
// only import lowlight syntaxes that we need in our app
import {lowlight} from 'lowlight/lib/core.js'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import cpp from 'highlight.js/lib/languages/cpp'

// register lowlight syntaxes
lowlight.registerLanguage('javascript', javascript)
lowlight.registerLanguage('json', json)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('xml', xml)
lowlight.registerLanguage('cpp', cpp)


// import "~/styles/element/index.scss";

// import ElementPlus from "element-plus";
// import all element css, uncommented next line
// import "element-plus/dist/index.css";

// or use cdn, uncomment cdn link in `index.html`

import "~/styles/index.scss";
import 'uno.css'

// If you want to use ElMessage, import the css globaly. ElMessageBox
import "element-plus/theme-chalk/src/message.scss"
import "element-plus/theme-chalk/src/tooltip.scss"
import "element-plus/theme-chalk/src/message-box.scss"

const app = createApp(App);

// app.use(ElementPlus);
app.mount("#app")
// context menu
app.use(ContextMenu) ;
