export default {
  props: ['value', 'editor'],
  watch: {
    editor: {
      immediate: true,
      handler(editor) {
        if (!editor || !editor.element) return;

        this.editor.setContent(this.value);
        this.editor.on("update", ({ getJSON, getHTML }) => {
          this.$emit("input", getHTML());
          this.$emit("inputjson", getJSON());
        });

        this.$nextTick(() => {
          this.$el.appendChild(editor.element.firstChild);
          editor.setParentComponent(this);
        });
      }
    },
    key: {
      // see https://github.com/ueberdosis/tiptap/issues/133
      handler() {
        if (this.editor) {
          this.editor.setContent(this.value, false)
        }
      }
    }
  },

  render(createElement) {
    return createElement("div", { class: "editor-content-class" });
  },

  beforeDestroy() {
    this.editor.element = this.$el;
  }
};