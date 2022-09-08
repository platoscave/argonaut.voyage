<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent, VueNodeViewRenderer } from "@tiptap/vue-3";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/core.js";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: "" },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
});

const emit = defineEmits(["update:modelValue"]);

const editor = new Editor({
  extensions: [
    StarterKit,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({
      lowlight,
    }),
    // CodeBlockLowlight
    //     .extend({
    //       addNodeView() {
    //         return VueNodeViewRenderer(CodeBlockComponent)
    //       },
    //     })
    //     .configure({ lowlight }),
  ],
  content: props.modelValue,
  onBlur({ editor, event }) {
    // The editor isn’t focused anymore.
    emit("update:modelValue", editor.getHTML());
    //emit("update:modelValue", editor.getJSON()[0][0].text);
  },
});

watch(
  () => props.modelValue,
  (value: string) => {
    const isSame = editor.getHTML() === value;

    // JSON
    // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

    if (isSame) {
      return;
    }

    editor.commands.setContent(value, false);
  }
);

onBeforeUnmount(() => {
  editor.destroy();
});
</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background" v-html="modelValue" />
  <div v-else>
    <div v-if="editor">
      <ToolbarButton
        popup-text="Bold"
        icon-name="bold"
        :is-active="editor.isActive('bold')"
        @button-clicked="editor.chain().focus().toggleBold().run()"
      />

      <ToolbarButton
        popup-text="Italic"
        icon-name="italic"
        :is-active="editor.isActive('italic')"
        @button-clicked="editor.chain().focus().toggleItalic().run()"
      />

      <ToolbarButton
        popup-text="Strike Through"
        icon-name="strike"
        :is-active="editor.isActive('strike')"
        @button-clicked="editor.chain().focus().toggleUnderline().run()"
      />

      <ToolbarButton
        popup-text="Code"
        icon-name="code"
        :is-active="editor.isActive('code')"
        @button-clicked="editor.chain().focus().toggleCode().run()"
      />

      <!-- <ToolbarButton
        popup-text="Clear Marks"
        icon-name="clear-marks"
        @button-clicked="editor.chain().focus().unsetAllMarks().run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Clear Nodes"
        icon-name="clear-nodes"
        @button-clicked="editor.chain().focus().clearNodes().run()"
      /> -->

      <ToolbarButton
        popup-text="Paragraph"
        icon-name="paragraph"
        :is-active="editor.isActive('paragraph')"
        @button-clicked="editor.chain().focus().setParagraph().run()"
      />

      <ToolbarButton
        popup-text="Hedding Level 1"
        icon-name="h1"
        :is-active="editor.isActive('heading', { level: 1 })"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      />

      <ToolbarButton
        popup-text="Hedding Level 2"
        icon-name="h2"
        :is-active="editor.isActive('heading', { level: 2 })"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      />

      <ToolbarButton
        popup-text="Hedding Level 3"
        icon-name="h3"
        :is-active="editor.isActive('heading', { level: 3 })"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      />

      <!-- <ToolbarButton
        popup-text="Hedding Level 4"
        icon-name="h4"
        :is-active="editor.isActive('heading', { level: 4 })"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 4 }).run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Hedding Level 5"
        icon-name="h5"
        :is-active="editor.isActive('heading', { level: 5 })"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 5 }).run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Hedding Level 6"
        icon-name="h6"
        :is-active="editor.isActive('bold')"
        @button-clicked="editor.chain().focus().toggleHeading({ level: 6 }).run()"
      /> -->

      <ToolbarButton
        popup-text="Bullet List"
        icon-name="ul"
        :is-active="editor.isActive('heading', { level: 6 })"
        @button-clicked="editor.chain().focus().toggleBulletList().run()"
      />

      <ToolbarButton
        popup-text="Ordered List"
        icon-name="ol"
        :is-active="editor.isActive('orderedList')"
        @button-clicked="editor.chain().focus().toggleOrderedList().run()"
      />

      <ToolbarButton
        popup-text="Code Block"
        icon-name="code"
        :is-active="editor.isActive('codeBlock')"
        @button-clicked="editor.chain().focus().toggleCodeBlock().run()"
      />

      <!-- <ToolbarButton
        popup-text="Blockquote"
        icon-name="quotes"
        :is-active="editor.isActive('blockquote')"
        @button-clicked="editor.chain().focus().toggleBlockquote().run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Horizontal Rule"
        icon-name="hr"
        @button-clicked="editor.chain().focus().setHorizontalRule().run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Hard Break"
        icon-name="hard-break"
        @button-clicked="editor.chain().focus().setHardBreak().run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Undo"
        icon-name="undo"
        @button-clicked="editor.chain().focus().undo().run()"
      /> -->

      <!-- <ToolbarButton
        popup-text="Redo"
        icon-name="redo"
        @button-clicked="editor.chain().focus().redo().run()"
      /> -->

      <!-- table -->
      <ToolbarButton
        popup-text="Add Table"
        icon-name="table"
        :is-active="editor.isActive('table')"
        @button-clicked="
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        "
      />

      <span v-if="editor.isActive('table')">
        <!-- delete_table -->
        <ToolbarButton
          popup-text="Delete Table"
          icon-name="delete_table"
          @button-clicked="editor.chain().focus().deleteTable().run()"
          :disabled="!editor.can().deleteTable()"
        />

        <!-- add_col_before -->
        <ToolbarButton
          popup-text="Add Column Before"
          icon-name="add_col_before"
          @button-clicked="editor.chain().focus().addColumnBefore().run()"
          :disabled="!editor.can().addColumnBefore()"
        />

        <!-- add_col_after -->
        <ToolbarButton
          popup-text="Add Column After"
          icon-name="add_col_after"
          @button-clicked="editor.chain().focus().addColumnAfter().run()"
          :disabled="!editor.can().addColumnAfter()"
        />

        <!-- delete_col-->
        <ToolbarButton
          popup-text="Delete Column"
          icon-name="delete_col"
          @button-clicked="editor.chain().focus().deleteColumn().run()"
          :disabled="!editor.can().deleteColumn()"
        />

        <!-- add_row_before-->
        <ToolbarButton
          popup-text="Add Row Before"
          icon-name="add_row_before"
          @button-clicked="editor.chain().focus().addRowBefore().run()"
          :disabled="!editor.can().addRowBefore()"
        />

        <!-- add_row_after-->
        <ToolbarButton
          popup-text="Add Row After"
          icon-name="add_row_after"
          @button-clicked="editor.chain().focus().addRowAfter().run()"
          :disabled="!editor.can().addRowAfter()"
        />

        <!-- delete_row-->
        <ToolbarButton
          popup-text="Delete Row"
          icon-name="delete_row"
          @button-clicked="editor.chain().focus().deleteRow().run()"
          :disabled="!editor.can().deleteRow()"
        />

        <!-- combine_cells-->
        <ToolbarButton
          popup-text="Merge or Splt Cells"
          icon-name="combine_cells"
          @button-clicked="editor.chain().focus().mergeOrSplit().run()"
          :disabled="!editor.can().mergeOrSplit()"
        />
      </span>
    </div>
    <editor-content class="editor-content" :editor="editor" />
  </div>
</template>
<style scoped>
.editor-content >>> .ProseMirror {
  background-color: #ffffff08;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  border-radius: 4px;
  padding-left: 10px;
  padding-right: 10px;
  border-spacing: 0px;
  min-height: 24px;
  line-height: 24px;
  margin-top: 5px;
}
.editor-content >>> .ProseMirror.ProseMirror-focused {
  outline: 0;
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
</style>
<!--
<style lang="scss">
/* Basic editor styles */
.ProseMirror {
  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: #0d0d0d;
    color: #fff;
    font-family: "JetBrainsMono", monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  img {
    max-width: 100%;
    height: auto;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0d0d0d, 0.1);
  }

  hr {
    border: none;
    border-top: 2px solid rgba(#0d0d0d, 0.1);
    margin: 2rem 0;
  }
}
</style>
-->
