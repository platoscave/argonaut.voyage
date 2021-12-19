import BalanceSheet from './widgets/BalanceSheet.vue'
import Calendar from './widgets/Calendar.vue'
import ClassModel from './widgets/ClassModel.vue'
import Document from './widgets/Document.vue'
import ViewForm from './widgets/ViewForm.vue'
import MaterializedView from './widgets/simpleJson/MaterializedView.vue'
import MergedAncestorsForm from './widgets/MergedAncestorsForm.vue'
import NavigationMenu from './widgets/NavigationMenu.js'
import PageEditor from './widgets/PageEditor.vue'
import ProcessModel from './widgets/ProcessModel.vue'
import Raw from './widgets/simpleJson/Raw.vue'
import ViewTable from './widgets/ViewTable.vue'
import Tiptap from './widgets/Tiptap.vue'
import Tree from './widgets/Tree.vue'
import Validate from './widgets/simpleJson/Validate.vue'


export default {
  name: 'ar-widget-selector',
  components: {
    'ar-balance-sheet': BalanceSheet,
    'ar-calendar': Calendar,
    'ar-class-model': ClassModel,
    'ar-document': Document,
    'ar-view-form': ViewForm,
    'ar-materialized-view': MaterializedView,
    'ar-merged-ancestors-form': MergedAncestorsForm,
    'ar-naigation-menu': NavigationMenu,
    'ar-page-editor': PageEditor,
    'ar-process-model': ProcessModel,
    'ar-raw': Raw,
    'ar-view-table': ViewTable,
    'ar-tiptap': Tiptap,
    'ar-tree': Tree,
    'ar-validate': Validate
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
      else if (widget.displayType === 'Calendar') {
        return createElement('ar-calendar', elementProps)
      }
      else if (widget.displayType === 'Class Model') {
        return createElement('ar-class-model', elementProps)
      }
      else if (widget.displayType === 'Document') {
        return createElement('ar-document', elementProps)
      }
      else if (widget.displayType === 'View Form') {
        return createElement('ar-view-form', elementProps)
      }
      else if (widget.displayType === 'HTML Page') {
        return createElement('ar-tiptap', elementProps)
      }
      else if (widget.displayType === 'Materialized View') {
        return createElement('ar-materialized-view', elementProps)
      }
      else if (widget.displayType === 'Merged Ancestors Form') {
        return createElement('ar-merged-ancestors-form', elementProps)
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
      else if (widget.displayType === 'ViewTable') {
        return createElement('ar-view-table', elementProps)
      }
      else if (widget.displayType === 'Tree') {
        return createElement('ar-tree', elementProps)
      }
      else if (widget.displayType === 'Validate') {
        return createElement('ar-validate', elementProps)
      }

      else return createElement('div', 'Unknown widget type: ' + widget.displayType)

    }

    return createElement('div', { class: 'ar-full-height', style: { overflow: 'auto' } }, this.widgets.map(widget => selectCreateWidget(widget)))


  }
}