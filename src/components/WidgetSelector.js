import BalanceSheet from './widgets/BalanceSheet.vue'
import ClassModel from './widgets/ClassModel.vue'
import Document from './widgets/Document.vue'
import Form from './widgets/Form.vue'
import NavigationMenu from './widgets/NavigationMenu.js'
import PageEditor from './widgets/PageEditor.vue'
import ProcessModel from './widgets/ProcessModel.vue'
import Raw from './widgets/Raw.vue'
import Table from './widgets/Table.vue'
import Tiptap from './widgets/Tiptap.vue'
import Tree from './widgets/Tree.vue'

export default {
  name: 'ar-widget-selector',
  components: {
    'ar-balance-sheet': BalanceSheet,
    'ar-class-model': ClassModel,
    'ar-document': Document,
    'ar-form': Form,
    'ar-naigation-menu': NavigationMenu,
    'ar-page-editor': PageEditor,
    'ar-process-model': ProcessModel,
    'ar-raw': Raw,
    'ar-table': Table,
    'ar-tiptap': Tiptap,
    'ar-tree': Tree
  },
  props: {
    hashLevel: Number,
    widgets: Array,
  },


  render(createElement) {

    const selectCreateWidget = (widget) => {
      const elementProps = {
        class: {
          'ar-full-height': this.widgets.length < 2
        },
        props: {
          'hash-level': this.hashLevel,
          'view-id': widget.viewId,
          'menu-id': widget.menuId
        }
      }

      if (widget.displayType === 'Balance Sheet') {
        return createElement('ar-balance-sheet', elementProps)
      }
      else if (widget.displayType === 'Class Model') {
        return createElement('ar-class-model', elementProps)
      }
      else if (widget.displayType === 'Document') {
        return createElement('ar-document', elementProps)
      }
      else if (widget.displayType === 'Form') {
        return createElement('ar-form', elementProps)
      }
      else if (widget.displayType === 'HTML Page') {
        return createElement('ar-tiptap', elementProps)
      }
      else if (widget.displayType === 'Navigation Menu') {
        return createElement('ar-naigation-menu', elementProps)
      }
      else if (widget.displayType === 'Page Editor') {
        return createElement('ar-page-editor', elementProps)
      }
      else if (widget.displayType === 'Process Model') {
        return createElement('ar-process-model', elementProps)
      }
      else if (widget.displayType === 'Raw') {
        return createElement('ar-raw', elementProps)
      }
      else if (widget.displayType === 'Table') {
        return createElement('ar-table', elementProps)
      }
      else if (widget.displayType === 'Tree') {
        return createElement('ar-tree', elementProps)
      }

      else return createElement('div', 'Unknown widget type: ' + widget.displayType)

    }

    return createElement('div', { class: 'ar-full-height', style: { overflow: 'auto' } }, this.widgets.map(widget => selectCreateWidget(widget)))


  }
}