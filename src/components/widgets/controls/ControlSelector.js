export default {
  functional: true,
  name: 'ar-control-selector',

  render(createElement, context) {

    // Determin the control type
    const getControlName = (property) => {
      if (property.type === 'string') {

        if (property.contentMediaType) {

          // HTML
          if (property.contentMediaType === 'text/html') return 'ar-tiptap'

          // Image
          else if (property.contentMediaType.startsWith('image/')) return 'ar-image'

          // Javascript, Json
          else if (property.contentMediaType === 'text/javascript' ||
            property.contentMediaType.startsWith('application/')) return 'ar-json'

        }

        // Select
        else if (property.argoQuery) return 'ar-select-string-query'

        // Enumeration
        else if (property.enum) return 'ar-select-string-enum'

        // Date time
        else if (property.format === 'date-time') return 'el-date-picker'

        // Text
        else return 'el-input'
      }

      // Number
      else if (property.type === 'number') return 'ar-number'

      // Integer
      else if (property.type === 'integer') return 'ar-number'

      // Boolean
      else if (property.type === 'boolean') return 'el-checkbox'

      // Object
      else if (property.type === 'object' && property.properties) return 'ar-nested-object'

      // Array
      else if (property.type === 'array' && property.items) {

        // objects
        if (property.items.type === 'object' && property.items.properties) {

          // objects in a table
          if (property.displayAs === 'Table') return 'ar-table-array'
          // objects in a subform
          else return 'ar-form-array'

        }

        // multi select
        else if (property.items.type === 'string') {
//debugger
          if (property.items.argoQuery) return 'ar-select-array-query'

          else return 'ar-select-array-enum'
        }

      }

      // unknown
      return 'ar-json'
    }

    // Merge property attrs with context.data attrs so that control elements can use them

    // hoist things like placeholder and type: "date" "textarea" "datetime"
    let schemaAttrs = context.data.attrs.property.attrs
    Object.assign(context.data.attrs, schemaAttrs)

    // transmogrify certain attributes
    context.data.props = {}
    let propertyAttrs = context.data.attrs.property

    if (propertyAttrs.type === 'string') {
      // note lowercase l
      if (propertyAttrs.minLength) context.data.attrs.minlength = propertyAttrs.minLength
      if (propertyAttrs.maxLength) context.data.attrs.maxlength = propertyAttrs.maxLength
      if (schemaAttrs && schemaAttrs['show-word-limit']) context.data.props['show-word-limit'] = true
    }

    return createElement(
      getControlName(context.props.property),
      context.data,
      context.children
    )

  }
}
