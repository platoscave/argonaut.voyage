<template>
  <div>
    <editor-menu-bar
      v-if="
        readonly === false &&
        (typeof value === 'object' || !value.startsWith('<pre><code>'))
      "
      :editor="editor"
      v-slot="{ commands, isActive }"
    >
      <div class="menubar">
        <!-- button must have type="button" since we are in a form
        See https://github.com/ueberdosis/tiptap/issues/729 -->
        <div class="toolbar">
          <!-- undo -->
          <!-- <toolbar-button 
            popup-text="Undo" 
            icon-name="undo"
            @button-clicked="false" >
          </toolbar-button> -->

          <!-- redo -->
          <!-- <toolbar-button 
            popup-text="Redo" 
            icon-name="redo"
            @button-clicked="commands.redo" >
          </toolbar-button> -->

          <!-- bold -->
          <toolbar-button 
            popup-text="Bold" 
            icon-name="bold"
            :is-active="isActive.bold()"
            @button-clicked="commands.bold" >
          </toolbar-button>

          <!-- italic -->
          <toolbar-button 
            popup-text="Italic" 
            icon-name="italic"
            :is-active="isActive.italic()"
            @button-clicked="commands.italic" >
          </toolbar-button>

          <!-- strike -->
          <toolbar-button 
            popup-text="Strike Through" 
            icon-name="strike"
            :is-active="isActive.strike()"
            @button-clicked="commands.strike" >
          </toolbar-button>

          <!-- underline -->
          <toolbar-button 
            popup-text="Underline" 
            icon-name="underline"
            :is-active="isActive.underline()"
            @button-clicked="commands.underline" >
          </toolbar-button>

          <!-- code -->
          <toolbar-button 
            popup-text="Code" 
            icon-name="code"
            :is-active="isActive.code()"
            @button-clicked="commands.code" >
          </toolbar-button>

          <!-- paragraph -->
          <toolbar-button 
            popup-text="Add Paragraph" 
            icon-name="paragraph"
            :is-active="isActive.paragraph()"
            @button-clicked="commands.paragraph" >
          </toolbar-button>

          <!-- header 1 -->
          <toolbar-button 
            popup-text="Header 1" 
            icon-name="h1"
            :is-active="isActive.heading({ level: 1 })"
            @button-clicked="commands.heading({ level: 1 })" >
          </toolbar-button>

          <!-- header 2 -->
          <toolbar-button 
            popup-text="Header 2" 
            icon-name="h2"
            :is-active="isActive.heading({ level: 2 }) "
            @button-clicked="commands.heading({ level: 2 }) " >
          </toolbar-button>

          <!-- header 3 -->
          <toolbar-button 
            popup-text="Header 3" 
            icon-name="h3"
            :is-active="isActive.heading({ level: 3 })"
            @button-clicked="commands.heading({ level: 3 })" >
          </toolbar-button>

          <!-- ul -->
          <toolbar-button 
            popup-text="Unordered List" 
            icon-name="ul"
            :is-active="isActive.bullet_list()"
            @button-clicked="commands.bullet_list" >
          </toolbar-button>

          <!-- ol -->
          <toolbar-button 
            popup-text="Ordered List" 
            icon-name="ol"
            :is-active="isActive.ordered_list() "
            @button-clicked="commands.ordered_list" >
          </toolbar-button>

          <!-- quote -->
          <toolbar-button 
            popup-text="Quote" 
            icon-name="quotes"
            :is-active="isActive.blockquote()"
            @button-clicked="commands.blockquote" >
          </toolbar-button>

          <!-- link -->
          <!-- TODO See https://github.com/ueberdosis/tiptap/blob/main/examples/Components/Routes/Links/index.vue -->
          <!-- <toolbar-button 
            popup-text="Insert a Link" 
            icon-name="link"
            :is-active="isActive.link()"
            @button-clicked="commands.link" >
          </toolbar-button> -->

          <!-- image -->
          <toolbar-button 
            popup-text="Link to Image" 
            icon-name="image"
            :is-active="isActive.image()"
            @button-clicked="commands.image" >
          </toolbar-button>

          <!-- code_block -->
          <toolbar-button 
            popup-text="Code Block" 
            icon-name="code"
            :is-active="isActive.code()"
            @button-clicked="commands.code" >
          </toolbar-button>

          <!-- table -->
          <toolbar-button 
            popup-text="Add Table" 
            icon-name="table"
            :is-active="isActive.table()"
            @button-clicked="
                commands.createTable({
                  rowsCount: 3,
                  colsCount: 3,
                  withHeaderRow: true,
                })
              " >
          </toolbar-button>

          <span v-if="isActive.table()">
            <!-- delete_table -->
            <toolbar-button 
              popup-text="Delete Table" 
              icon-name="delete_table"
              @button-clicked="commands.deleteTable" >
            </toolbar-button>

              <!-- add_col_before -->
            <toolbar-button 
              popup-text="Add Column Before" 
              icon-name="add_col_before"
              @button-clicked="commands.addColumnBefore" >
            </toolbar-button>

              <!-- add_col_after -->
            <toolbar-button 
              popup-text="Add Column After" 
              icon-name="add_col_after"
              @button-clicked="commands.addColumnAfter" >
            </toolbar-button>

              <!-- delete_col-->
            <toolbar-button 
              popup-text="Delete Column" 
              icon-name="delete_col"
              @button-clicked="commands.deleteColumn" >
            </toolbar-button>

              <!-- add_row_before-->
            <toolbar-button 
              popup-text="Add Row Before" 
              icon-name="add_row_before"
              @button-clicked="commands.addRowBefore" >
            </toolbar-button>

              <!-- add_row_after-->
            <toolbar-button 
              popup-text="Add Row After" 
              icon-name="add_row_after"
              @button-clicked="commands.addRowAfter" >
            </toolbar-button>

              <!-- delete_row-->
            <toolbar-button 
              popup-text="Delete Row" 
              icon-name="delete_row"
              @button-clicked="commands.deleteRow" >
            </toolbar-button>

              <!-- combine_cells-->
            <toolbar-button 
              popup-text="Combine Cells" 
              icon-name="combine_cells"
              @button-clicked="commands.toggleCellMerge" >
            </toolbar-button>

          </span>
        </div>
      </div>
    </editor-menu-bar>
    <editor-content
      class="editor-content"
      :editor="editor"
      v-bind:value="value"
      v-on:input="$emit('input', $event)"
      v-on:inputjson="$emit('inputjson', $event)"
    />
  </div>
</template>

<script>

// Tiptap version 2 will improve v-model
// https://stackoverflow.com/questions/63912152/how-can-i-put-content-from-tiptap-text-editor-into-a-v-model

import ToolbarButton from "./tiptap/ToolbarButton";
import EditorContent from "./tiptap/TiptapContent";
import { Editor, EditorMenuBar } from "tiptap";

import {
  CodeBlockHighlight,
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  Image,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Strike,
  Underline,
  History,
} from "tiptap-extensions";

import javascript from "highlight.js/lib/languages/javascript";
//import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";

export default {
  name: 'ar-tiptap-editor',
  components: {
    EditorContent,
    EditorMenuBar,
    ToolbarButton
  },
  props: {
    value: [String, Object],
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      editor: new Editor({
        extensions: [
          new CodeBlockHighlight({
            languages: {
              javascript,
              json,
              xml,
            },
          }),
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new Image(),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Link(),
          new Bold(),
          new Code(),
          new Italic(),
          new Strike(),
          new Underline(),
          new History(),
          new Table({
            resizable: true,
          }),
          new TableHeader(),
          new TableCell(),
          new TableRow(),
        ],
        emptyDocument: {
          type: "doc",
          content: [
            {
              type: "paragraph",
            },
          ],
        },
      }),
    };
  },
  methods: {
    showImagePrompt(command) {
      const src = prompt("Enter the url of your image here");
      if (src !== null) {
        command({ src });
      }
    },

    readonlyHandeler() {
      this.editor.options.editable = !this.readonly;
      // also update the editor border:
      this.editor.view.update(this.editor.view.props);
    }
  },
  watch: {
    // immediate: true doesn't work. Too early. Tiptap hasn't been initialized yet
    // Thats why we need both mounted and watch
    readonly: 'readonlyHandeler'
  },
  mounted: function (){
    this.readonlyHandeler()
  },
  beforeDestroy() {
    this.editor.destroy();
  },
};
</script>
<style scoped>
.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  fill: lightgray;
}
.menubar__button {
  color: lightgray;
  font-size: 16px;
  background-color: #ffffff1a;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  padding-top: 4px;
  margin-right: 3px;
}
.menubar__button .h-button{
  padding-top: 0px;
  padding-left: 0px;
}
.menubar__button.is-active {
  background-color: #00adff42;
}
.editor-content >>> .ProseMirror {
  background-color: #ffffff08;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  border-radius: 4px;
  padding-left: 10px;
  padding-right: 10px;
  border-spacing: 0px;
}
.editor-content >>> .ProseMirror[contenteditable="false"] {
  border-width: 0px;
}
.editor-content >>> .ProseMirror > pre {
  line-height: 20px;
}
.editor-content >>> td {
  background-color: #ffffff08;
  padding: 5px;
  border-radius: 4px;
  min-width: 20px;
  vertical-align: top;
}
.editor-content >>> th {
  background-color: #ffffff10;
  padding: 5px;
  border-radius: 4px;
  min-width: 20px;
  vertical-align: top;
}
.editor-content >>> p {
  margin-top: 0px;
  margin-bottom: 0px;
}
</style>