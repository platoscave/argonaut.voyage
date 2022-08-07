<template>
    <MainPage />
</template>

<style>
#app {
  color: var(--ep-text-color-primary);
}

.ar-full-height {
  height: 100%;
}
.ar-overflow-auto {
  overflow: auto;
}

.ar-full-page {
  overflow: auto;
  padding: 20px;
}

.ar-control {
  width: 100%;
}

.ar-lightgrey-background {
  background-color: #ffffff08;
  padding: 1px 7px;
  border-radius: 4px;
  border-style: none;
  min-height: 24px;
  line-height: 24px;
}
p {
  margin-top: 0px;
  margin-bottom: 0px;
}
code {
  padding: 0px;
}
pre {
  margin: 0px;
  line-height: 18px;
}
/* Input background and border */
.el-input__wrapper {
  background-color: #ffffff08;
  box-shadow: 0 0 0 1px #00adff42;
  height: 24px;
  border-radius: 4px;
}
.el-input__wrapper:hover {
    box-shadow: 0 0 0 1px #409eff inset;
}
/* Text area background and border */
.el-textarea__inner {
  background-color: #ffffff08;
  box-shadow: 0 0 0 1px #00adff42;
  border-radius: 4px;
}
.el-textarea__inner:hover {
  box-shadow: 0 0 0 1px #409eff inset;

}
/* allow label height to grow as needed */
.el-form-item__label {
  height: unset;
  line-height: 18px;
  align-items: baseline;
  margin-top: 4px;
}
/* align content top, incase label has more than one line*/
.el-form-item__content {
  align-items: baseline;
}
/* .el-form-item:not(:last-child) {
  margin-bottom: 10px;
} */

/* .el-form-item {
  margin-bottom: 10px;
} */
</style>
