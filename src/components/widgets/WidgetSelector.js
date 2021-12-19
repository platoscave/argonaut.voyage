export default {
  functional: true,
  name: 'ar-widget-selector',

  render(createElement, context) {

    // Determin the widget type
    const getControlName = (displayType) => {
      if (displayType === 'Balance Sheet') return 'ar-balance-sheet'
      else if (displayType === 'Calendar') return 'ar-calendar'
      else if (displayType === 'Class Model') return 'ar-class-model'
      else if (displayType === 'Document') return 'ar-document'
      else if (displayType === 'View Form') return 'ar-view-form'
      else if (displayType === 'HTML Page') return 'ar-tiptap'
      else if (displayType === 'Materialized View') return 'ar-materialized-view'
      else if (displayType === 'Merged Ancestors Form') return 'ar-merged-ancestors-form'
      else if (displayType === 'Navigation Menu') return 'ar-naigation-menu'
      else if (displayType === 'Page Editor') return 'ar-page-editor'
      else if (displayType === 'Process Model') return 'ar-process-model'
      else if (displayType === 'Raw') return 'ar-raw'
      else if (displayType === 'ViewTable') return 'ar-view-table'
      else if (displayType === 'Tree') return 'ar-tree'
      else if (displayType === 'Validate') return 'ar-validate'
    }

    return createElement(
      getControlName(context.props.property),
      context.data,
      context.children
    )

  }
}
