/* eslint-disable no-debugger */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import BalanceSheet from './BalanceSheet.vue'
import ClassModel from './ClassModel.vue'
import Document from './Document.vue'
import Form from './Form.vue'
import HTMLPage from './HtmlPage.vue'
import NavigationMenu from './NavigationMenu.vue'
import PageEditor from './PageEditor.vue'
import ProcessModel from './ProcessModel.vue'
import Table from './Table.vue'
import Tree from './Tree.vue'

export default {
  name: 'ar-widget',
  components: {
    'ar-balance-sheet': BalanceSheet,
    'ar-class-model': ClassModel,
    'ar-document': Document,
    'ar-form': Form,
    'ar-html-page': HTMLPage,
    'ar-naigation-menu': NavigationMenu,
    'ar-page-editor': PageEditor,
    'ar-process-model': ProcessModel,
    'ar-table': Table,
    'ar-tree': Tree
  },
  props: {
    hashLevel: Number,
    widgets: {
      type: Array,
      default: () => []
    }
  },


  render(createElement) {

    const selectCreateWidget = (widget) => {
      if (widget.displayType === 'Balance Sheet') {
        return createElement('ar-balance-sheet', {})
      }
      else if (widget.displayType === 'Class Model') {
        return createElement('ar-class-model', {})
      }
      else if (widget.displayType === 'Document') {
        return createElement('ar-document', {})
      }
      else if (widget.displayType === 'Form') {
        return createElement('ar-form', {})
      }
      else if (widget.displayType === 'HTML Page') {
        return createElement('ar-html-page', {})
      }
      else if (widget.displayType === 'Navigation Menu') {
        return createElement('ar-naigation-menu', {})
      }
      else if (widget.displayType === 'Page Editor') {
        return createElement('ar-page-editor', {})
      }
      else if (widget.displayType === 'Process Model') {
        return createElement('ar-process-model', {})
      }
      else if (widget.displayType === 'Table') {
        return createElement('ar-table', {})
      }
      else if (widget.displayType === 'Tree') {
        return createElement('ar-tree', {})
      }

      else return createElement('div', 'Unknown widget type: ' + widget.displayType)

    }

    return createElement('div', {
      props: {
        size: "small",
      },
      class: 'form-class'
    }, this.widgets.map( widget => selectCreateWidget(widget)))


  }
}