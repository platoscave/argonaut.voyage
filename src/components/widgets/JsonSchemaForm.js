import Tiptap from './Tiptap';
import Select from './controls/Select';
//import PoucdbServices from "../../dataServices/pouchdbServices"

export default {
  name: 'ar-jsonschema-form',
  components: {
    'tiptap': Tiptap,
    'ar-select': Select
  },
  props: {
    value: {
      type: Object,
      default: {},
    },
    schema:  {
      type: Object,
      default: {},
    },
    formReadOnly: false,
    omitEmptyFields: false,
  },
  data: function () {
    return {
      selectedObjectId: -1,
    };
  },


  render(createElement) {


    //
    // Generate the control element depending on property type in a giant if else structure
    // returns an array with the control element(s)
    //
    const generateControlElements = (propertyName, property, dataObj) => {

      // Determin the control type and create it
      if (property.type === 'string') {

        if (property.contentMediaType) {

          // HTML
          if (property.contentMediaType === 'text/html') {
            return this.createHtmlElements(createElement, property, dataObj, propertyName)
          }

          // Image
          else if (property.contentMediaType.startsWith('image/')) {
            return this.createImageElements(createElement, property, dataObj, propertyName)
          }

          // Javascript, Json
          else if (property.contentMediaType === 'text/javascript' ||
            property.contentMediaType.startsWith('application/')) {
            return this.createJsonElements(createElement, property, dataObj, propertyName)
          }

          // Unknown
          else return [createElement('div', 'Unknown contentMediaType: ' + property.contentMediaType)]

        }

        // Select
        else if (property.mongoQuery) {
          
          return [createElement('ar-select', { 
            //class: 'control-background', 
            //attrs: { readonly: this.formReadOnly || property.readonly },

            props: { 
              property: property,
              value: dataObj[propertyName],
              readOnly: this.formReadOnly || property.readOnly
            } 
          })]
        }

        // Enumeration
        else if (property.enum) {
          return this.createEnumerationElements(createElement, property, dataObj, propertyName)
        }

        // Date time
        else if (property.format === 'date-time') {
          return this.createDatetimeElements(createElement, property, dataObj, propertyName)
        }

        // Text
        else {
          return this.createTextElements(createElement, property, dataObj, propertyName)
        }
      }

      // Number
      else if (property.type === 'number') {
        return this.createNumberElements(createElement, property, dataObj, propertyName)
      }

      // Boolean
      else if (property.type === 'boolean') {
        return this.createBooleanElements(createElement, property, dataObj, propertyName)
      }

      // Object
      else if (property.type === 'object' && property.properties) {
        return this.createObjectElements(createElement, property, dataObj, propertyName, generateSubform)
      }

      // Array
      else if (property.type === 'array' && property.items) {

        // objects in a subform
        if (property.items.type === 'object' && property.items.properties) {
          return this.createObjectArrayElements(createElement, property.items.properties, dataObj, propertyName, generateSubform)
        }

        // multi select
        else if (property.items.type === 'string') {
          return this.createStringArrayElements(createElement, property, dataObj, propertyName)
        }

      }

      // unknown
      return [createElement(
        'highlight-code', 
        {
          attrs: { lang: 'json'},
          class: "highlight-code",
        },
        JSON.stringify(dataObj[propertyName], null, 4)
      )]

    }


    // Helper functions
    const isEmpty = obj => {
      if (!obj) return true
      // TODO test nested opjects
      for (let prop in obj) return false;
      return true;
    }

    // Create the validation rules array
    const createValidationRules = (property, propertyName, requiredArr = []) => {

      // no rules for readonly
      if ((this.formReadOnly || property.readonly)) return []

      let rulesArr = []
      if (requiredArr.includes(propertyName)) {
        rulesArr.push({ required: true, message: property.title + ' is required.' })
      }

      if (property.minLength) {
        rulesArr.push({ min: property.minLength, message: 'Please enter at least ' + property.minLength + ' characters.' })
      }

      // email
      if (property.format) {
        if (property.format === 'email') {
          rulesArr.push({ type: 'email', message: 'Please enter a valid email address. eg: name@provider.com' })
        }
        else if (property.format === 'uri') {
          rulesArr.push({ type: 'url', message: 'Please enter a valid url. eg: https://provider.com' })
        }
      }

      if (property.pattern) {
        rulesArr.push({ pattern: property.pattern, message: ' Input must comply with: ' + property.pattern })
      }

      return rulesArr
    }

    // The form element label. Potentially containing an info icon tooltip
    const labelElement = (property) => {

      // Make an exception for boolean type. The title will be placed next to the checkbox
      if (property.type === 'boolean') return ''

      let labelArr = []

      let label = property.title
      if (property.description) label = label + ' '
      labelArr.push(createElement('span', label))

      // add tooltip to label
      if (property.description) {
        labelArr.push(createElement('el-tooltip',
          {
            class: 'el-icon-info',
            props: {
              content: property.description,
              effect: 'dark'
            },
            // TODO cant get this to work
            /* scopedSlots: {
              content: function () {
                return createElement('span', {attrs: {'v-html': 'html'}}, property.description)
              }
            } */
          }, [createElement('i', { class: 'el-icon-info' })]
        ))
      }
      return labelArr
    }


    // Generate the subform. For each of the properties:
    //   define validation rules
    //   add form item element
    //   call generateControlElements
    // returns an array of form item elements

    const generateSubform = (properties, requiredArr, dataObj) => {
      let formItemElements = []

      // For each of the properties
      for (let propertyName in properties) {
        const property = properties[propertyName]

        // If omitEmptyFields and field is empty, skip
        if ((this.formReadOnly || property.readonly) && this.omitEmptyFields && isEmpty(dataObj[propertyName], propertyName)) continue

        // The form item element
        formItemElements.push(createElement('el-form-item', {
          props: {
            label: ' ', // dummy, required for some reason
            prop: propertyName, // needed for validation rules
            rules: createValidationRules(property, propertyName, requiredArr),
          },
          attrs: {
          },
          scopedSlots: {
            label: () => labelElement(property)
          },
        }, generateControlElements(propertyName, property, dataObj)))
      }

      return formItemElements
    }


    // START HERE
    // Create the form
    //
    let subFormElementsArr = generateSubform(this.schema.properties, this.schema.required, this.value)
    subFormElementsArr.splice(0, 0, createElement('div', {style: {'font-size': 'smaller'}}, this.schema._id))
    // insert a header title, if there is one
    if (this.schema.title) subFormElementsArr.splice(0, 0, createElement('h3', labelElement(this.schema)))

    return createElement('el-form', {
      ref: "elementUiForm",
      props: {
        model: this.value, // needed for validation rules
        labelWidth: "100px",
        labelPosition: 'left',
        size: "mini",
        //'show-message': false
      },
      class: 'form-class'
    }, subFormElementsArr)
  },



  methods: {

    // helper functions
    // see https://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript/4835406#4835406
    // for a discussion on xss valnerabilities. As long as you sanatize/validate on the server, you should be ok.
    unescapeHtml(str) {
      var map = { amp: '&', lt: '<', le: '≤', gt: '>', ge: '≥', quot: '"', '#039': "'" }
      return str.replace(/&([^;]+);/g, (m, c) => map[c] || '')
    },
    escapeHtml(text) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    },
    validate() {
      return this.$refs['elementUiForm'].validate()
    },
    resetFields() {
      this.$refs['elementUiForm'].resetFields();
    },
    getStandardElementProps(dataObj, property, propertyName) {
      let controlData = dataObj[propertyName]
      if (!controlData) controlData = property.default
      if (!controlData) controlData = ''

      // Set genneral element properties including value and response to the input event 
      // This will suit simple controls. Some controls will overwrite certain properties
      let elementProps = {
        props: {
          value: controlData
        },
        attrs: {},
        scopedSlots: {},
        on: {
          input: (newValue) => {
            this.$set(dataObj, propertyName, newValue)
          }
        }
      }

      // Copy certain properties to attrs
      if (property.attrs) {
        if (property.attrs.placeholder) elementProps.attrs.placeholder = property.attrs.placeholder
        // useful values are: date, time, datetime, textarea or checkbox
        if (property.attrs.type) elementProps.attrs.type = property.attrs.type
      }
      if (this.formReadOnly || property.readonly) {
        elementProps.attrs.readonly = true
      }
      if (property.minlength) elementProps.attrs.minlength = property.minlength
      if (property.maxlength) elementProps.attrs.maxlength = property.maxlength
      if (property.min) elementProps.attrs.min = property.min
      if (property.max) elementProps.attrs.max = property.max

      return elementProps
    },

    //************************************************************** */
    //
    // Create the Controls
    //
    //************************************************************** */

    //
    // HTML
    //
    createHtmlElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]

      if (this.formReadOnly || property.readonly) elementProps.props.readonly = true

      if (property.contentEncoding === 'json') {// non-standard contentEncoding
        elementProps.props.value = controlData ? controlData : {} // must pass an object
        elementProps.on = {
          // listen to inputjson instead of input
          inputjson: (newValue) => {
            this.$set(dataObj, propertyName, newValue)
          }
        }
      }

      return [createElement('tiptap', elementProps)]
    },

    //
    // Image
    //
    createImageElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]
      let elementsArr = []

      // display the image
      elementsArr.push(createElement('img', {
        attrs: { src: controlData }
      }))

      if (!this.formReadOnly && !property.readonly) { // read / write

        // bsae64 Icon
        if (property.contentEncoding === 'base64') {

          // SVG Icon
          if (property.contentMediaType === 'image/svg+xml') {

            let svgMarkup = ''
            if(controlData){
              const sub = controlData.slice(26) // remove data:image/svg+xml;base64,
              svgMarkup = window.atob(sub)
            }

            elementsArr.push(createElement('tiptap', {
              props: {
                value: '<pre><code>' + this.escapeHtml(svgMarkup) + '</code></pre>',
              },
              on: {
                input: (newValue) => {
                  newValue = newValue.slice(11).slice(0, -13) // remove <pre><code>, </code></pre>
                  newValue = this.unescapeHtml(newValue)
                  newValue = window.btoa(newValue) // convert to base64
                  this.$set(dataObj, propertyName, 'data:image/svg+xml;base64,' + newValue)
                }
              }
            }))

          }

          // some other type of base64 icon
          else elementsArr.push(createElement('el-input', elementProps))
        }

        // src is an ordinary url TODO: add url rule
        else elementsArr.push(createElement('el-input', elementProps))

      }

      return elementsArr
    },


    //
    // Json
    //
    createJsonElements(createElement, property, dataObj, propertyName) {
      const controlData = dataObj[propertyName]

      return [createElement('tiptap', {
        props: {
          value: '<pre><code>' + this.escapeHtml(controlData) + '</code></pre>',
          readonly: (this.formReadOnly || property.readonly)
        },
        on: {
          input: (newValue) => {
            newValue = newValue.slice(11).slice(0, -13) // remove <pre><code>, </code></pre>
            this.$set(dataObj, propertyName, this.unescapeHtml(newValue))
          }
        }
      })]
    },


    //
    // Enumeration
    //
    createEnumerationElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]
      let elementsArr = []

      if (this.formReadOnly || property.readonly) { // readonly

        // display the label
        elementsArr.push(createElement('div', { class: 'control-background', attrs: { readonly: true } }, controlData ? controlData : ''))

      }

      else { // read / write

        if (property.enum.length === 0) {
          // nothing to see here
          elementsArr.push(createElement('div', { class: 'control-background readonly-class' }))
        }

        else if (property.enum.length === 1) {

          // display the value/label
          //TODO should we be setting the value to default if there is one only one?
          //this.$set(dataObj, propertyName, property.enum[0])
          elementsArr.push(createElement('div', { class: 'control-background readonly-class' }, controlData ? controlData : ''))

        }
        else if (property.enum.length < 5) {

          // Radio Buttons
          let radioButtonsArr = []
          property.enum.forEach(option => {
            if (typeof option === 'string') radioButtonsArr.push(createElement('el-radio', {
              props: {
                value: controlData,
                label: String(option)
              },
              on: {
                input: () => {
                  this.$set(dataObj, propertyName, option)
                }
              }
            }, String(option))) // label slot
          })

          // The radiobutton group
          elementsArr.push(createElement('div', { class: 'control-background' }, radioButtonsArr))

        }
        else { // property.enum.length > 4

          // Select
          let optionsArr = property.enum.map((option) => {
            return createElement('el-option', {
              props: {
                value: String(option),
                label: String(option)
              },
            }, String(option))
          })

          elementsArr.push(createElement('el-select', elementProps, optionsArr))

        }
      }
      return elementsArr
    },


    //
    // Datetime
    //
    createDatetimeElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]

      elementProps.props.value = controlData === 'now' ? new Date() : controlData
      return [createElement('el-date-picker', elementProps)]

    },


    //
    // Text
    //
    createTextElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 

      if (elementProps.attrs.type === 'textarea') {
        elementProps.props.showWordLimit = true // <- not working
        elementProps.attrs.autosize = true
      }

      return [createElement('el-input', elementProps)]
    },


    //
    // Number
    //
    createNumberElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]

      if (this.formReadOnly || property.readonly) {

        // display the number
        return [createElement('div', {
          attrs: { readonly: true },
          style: "width: 200px; text-align: right;",
          class: 'control-background',
        }, controlData ? controlData.toLocaleString() : '')]

      }
      else {
        if (property.min) elementProps.attrs.minimum = property.minimum
        if (property.max) elementProps.attrs.maximum = property.maximum

        return [createElement('el-input-number', elementProps)]
      }

    },


    //
    // Boolean
    //
    createBooleanElements(createElement, property, dataObj, propertyName) {

      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]

      if (this.formReadOnly || property.readonly) { // readonly

        // display the label
        let label = controlData === true ? 'TRUE: ' : 'FALSE: '
        label += property.title ? property.title : ''
        return [createElement('div',
          {
            class: 'control-background',
            attrs: { readonly: true }
          },label )
        ]

      }
      else { // read / write

        return [createElement('div',
          { class: 'control-background' },
          [createElement('el-checkbox', elementProps, property.title ? property.title : '')]
        )]

      }
    },


    //
    // Object
    //
    createObjectElements(createElement, property, dataObj, propertyName, generateSubform) {

      // Create the empty object if it doesn't exist yet
      if (!dataObj[propertyName]) this.$set(dataObj, propertyName, {})
      // Create an empty required array if it doesn't exist yet
      const subRequiredArr = property.required ? property.required : []

      // Generate the subform
      const subFormArr = generateSubform(property.properties, subRequiredArr, dataObj[propertyName])

      // transparent grey background for the entire subform
      return [createElement('div', { class: 'subform-background' }, subFormArr)]

    },


    //
    // Array containing strings
    //
    createStringArrayElements(createElement, property, dataObj, propertyName) {
      let elementProps = this.getStandardElementProps(dataObj, property, propertyName) 
      const controlData = dataObj[propertyName]

      if (this.formReadOnly || property.readonly) { // readonly

        // display the labels
        return [createElement('div', {
          attrs: { readonly: true },
          class: 'control-background',
        }, controlData ? controlData.join(', ') : '')]

      }

      else { // read / write

        if(property.items.enum) {
          // Check Boxes
          if (property.items.enum.length < 5) {

            // Create the empty results array if it doesn't exist yet
            if (!dataObj[propertyName]) this.$set(dataObj, propertyName, [])

            let checkElsArr = []
            property.items.enum.forEach(option => {
              checkElsArr.push(createElement('el-checkbox', {
                props: {
                  checked: dataObj[propertyName].includes(option),
                  label: option
                },
                on: {
                  change: (newValue) => {
                    if (newValue) dataObj[propertyName].push(String(option))
                    else {
                      const index = dataObj[propertyName].indexOf(String(option));
                      if (index > -1) {
                        dataObj[propertyName].splice(index, 1);
                      }
                    }
                  }
                }
              }))
            })
            ////////////////////////////////////////
            // The check box group
            return [createElement('div', {
              attrs: {
                readonly: (this.formReadOnly || property.readonly)
              },
              class: 'control-background'
            }, checkElsArr)]
          }


          // multi select dropdown
          else { // property.items.enum.length >= 5

            elementProps.attrs.multiple = true

            // Select
            let optionsArr = property.items.enum.map((option) => {
              return createElement('el-option', {
                props: {
                  value: String(option),
                  label: String(option)
                },
              }, String(option))
            })

            return [createElement('el-select', elementProps, optionsArr)]

          }
        }
        else {
                  // display the labels
        return [createElement('div', {
          attrs: { readonly: true },
          class: 'control-background',
        }, controlData ? controlData.join(', ') : '')]
        }
      }

    },

    //
    // Array
    //
    createObjectArrayElements(createElement, properties, dataObj, propertyName, generateSubform) {
      const property = properties[propertyName]
      let elementsArr = []

      // Create the empty results array if it doesn't exist yet
      if (!dataObj[propertyName]) this.$set(dataObj, propertyName, [])
      // Create an empty required array if it doesn't exist yet
      const subRequiredArr = properties.required ? properties.required : []

      let draggingItemId



      let objectsArr = []
      // For each of the current items
      dataObj[propertyName].forEach((item, idx) => {

        // Generate the subform for this item
        const subFormArr = generateSubform(properties, subRequiredArr, item)

        objectsArr.push(createElement('div', {
          props: {
            selectedId: 1
          },
          class: {
            'subform-background': true, // transparent grey background for the entire subform
            'subform-margin-bottom': true,
            selected: idx === this.selectedObjectId
          },
          attrs: {
            id: idx,
            draggable: true
          },

          on: {
            click: () => {
              this.selectedObjectId = idx
            },
            //@dragstart="dragStart(i, $event)" @dragover.prevent @dragenter="dragEnter" @dragleave="dragLeave" @dragend="dragEnd" @drop="dragFinish(i, $event)"
            dragstart: (evt) => {
              evt.dataTransfer.setData('obj_id', evt.target.id);
              //evt.dataTransfer.dropEffect = 'move'
              this.dragging = idx;

              //console.log('evt.target.', evt.target)
              setTimeout(() => {
                evt.target.style.display = 'none'
              })
            },
            dragend: (evt) => {
              console.log('dragend')
              this.dragging = -1

              evt.target.style.display = 'block'
            },
            dragover: (evt) => {
              //console.log('over2')
              evt.preventDefault()
              return true
            },
            dragenter: (evt) => {
              //if (evt.clientY > evt.target.height / 2) console.log(true)
              //console.log('dragenterer', evt.target.id)
              /* if (evt.clientY > evt.target.height / 2) {
                evt.target.style.marginBottom = '30px'
              } else {
                evt.target.style.marginTop = '30px'
              } */
            },
            dragleave: (evt) => {

              /* evt.target.style.marginTop = '0px'
              evt.target.style.marginBottom = '10px' */

            },
            drop: (evt) => {
              if (evt === -1) {
                dataObj[propertyName].splice(index, 1);
              } else {
                dataObj[propertyName].splice(evt, 0, dataObj[propertyName].splice(idx, 1)[0]);
              }


              /* const obj_id = evt.dataTransfer.getData('obj_id')
              const obj = document.getElementById(obj_id)
              setTimeout(() => {
                obj.style.display = 'block'
              }) */

              //evt.target.style.marginTop = '2px'
              //evt.target.style.marginBottom = '2px'
            },

          },
        }, subFormArr))

        objectsArr.push(createElement('hr', {
          attrs: {
            id: 'placeholder' + idx
          },
          class: 'drop-separator',
          on: {
            dragover: (evt) => {
              //console.log('over2')
              console.log('dragover-separator', evt.target.id)

              evt.preventDefault()
              return true
            },
            dragenter: (evt) => {
              //if (evt.clientY > evt.target.height / 2) console.log(true)
              const target = evt.target
              //console.log('drop-separator', target.id)


              document.getElementById(evt.target.id).style['background-color'] = 'blue'
              console.log('dragenter-separator', evt.target.id, document.getElementById(evt.target.id))

              //obj.style.color = 'blue'

              /* if (evt.clientY > evt.target.height / 2) {
                evt.target.style.marginBottom = '30px'
              } else {
                evt.target.style.marginTop = '30px'
              } */
            },
            dragleave: (evt) => {
              document.getElementById(evt.target.id).style['background-color'] = '#1e57b866'
              //console.log('dragleave-separator', evt.target.id, document.getElementById(evt.target.id))

              /* evt.target.style.marginTop = '0px'
              evt.target.style.marginBottom = '10px' */

            },
          }
        }))
      })



      elementsArr.push(createElement('div', objectsArr))


      if (!this.formReadOnly /* && !property.readonly */) {

        // Add/remove buttons row
        let buttonsArr = []
        buttonsArr.push(createElement('el-button', {
          props: {
            type: 'success',
            icon: 'el-icon-plus',
            circle: true,
            size: 'mini'
          },
          on: {
            click: () => dataObj[propertyName].push({}) // add a new empty object
          },
          style: {
            color: 'black'
          }
        }))
        buttonsArr.push(createElement('el-button', {
          props: {
            type: 'danger',
            icon: 'el-icon-minus',
            circle: true,
            size: 'mini'
          },
          attrs: {
            disabled: this.selectedObjectId > -1 ? false : true
          },
          on: {
            click: () => {
              dataObj[propertyName].splice(this.selectedObjectId, 1); // remove the selected object
            }
          },
          style: {
            color: 'black'
          }
        }))
        elementsArr.push(createElement('el-row', {}, buttonsArr))
      }


      return elementsArr

    },
  }

}
