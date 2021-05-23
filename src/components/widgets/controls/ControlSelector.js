export default {
  functional: true,
  name: 'ar-control-selector',
  props: {
    property: Object,
    propertyName: String,
    value: [Number, String, Array, Object, Boolean],
    readonly: Boolean,
    required: Boolean
  },


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

          // Unknown
          else return [createElement('div', 'Unknown contentMediaType: ' + property.contentMediaType)]

        }

        // Select
        else if (property.mongoQuery) return 'ar-select'

        // Enumeration
        else if (property.enum) return 'ar-enum'

        // Date time
        else if (property.format === 'date-time') return 'el-date-picker'

        // Text
        else return 'el-input'
      }

      // Number
      else if (property.type === 'number') return 'el-input-number'

      // Boolean
      else if (property.type === 'boolean') return 'el-checkbox'

      // Object
      else if (property.type === 'object' && property.properties)  return 'ar-form'

      // Array
      else if (property.type === 'array' && property.items) {

        // objects in a subform
        if (property.items.type === 'object' && property.items.properties) return 'ar-object-array'

        // multi select
        else if (property.items.type === 'string')  return 'ar-string-array'

      }

      // unknown
      return 'ar-json'
    }

    // All controls get ar-control class
    context.class = 'ar-control'

    return createElement(
      getControlName( context.props.property),
      context
    )

  }
}
