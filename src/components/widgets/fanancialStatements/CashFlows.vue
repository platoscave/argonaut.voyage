<template>
  <div name="CashFlows" class="ar-full-height ar-full-page">
    <div class="ar-lightgrey-background">
      <!-- <div class="l1" v-if="dataObj">{{ dataObj.name }}</div> -->
      <div>Statement of Cash Flows</div>
      <div>For the year ended December 31 2021</div>
    </div>

    <table>
      <tr>
        <td class="blank-row">&nbsp;</td>
      </tr>
      <tr class="l1">
        <td>Operating Activities</td>
      </tr>
      <tr>
        <td class="title">Net Income</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td class="title" style="font-style: italic;">
          Adjustments to reconcile to net cash provided by opertating activities
        </td>
      </tr>
      <tr>
        <td class="title">Deprecation and amorization</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td class="title">Loss on sale of equipment</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td class="title" style="font-style: italic;">
          Changes in current assests and libilities
        </td>
      </tr>
      <tr>
        <td class="title-indent">Increase in accounts receivable</td>
        <td class="value sub">-0</td>
      </tr>
      <tr>
        <td class="title-indent">Decrease in prepaid expenses</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td class="title-indent">Decrease in accounts payable</td>
        <td class="value sub">-0</td>
      </tr>
      <tr class="l1">
        <td>Net Cash provided by operating Activities</td>
        <td class="value"><span class="sum">0</span></td>
      </tr>

      <tr>
        <td class="blank-row">&nbsp;</td>
      </tr>
      <tr class="l1">
        <td>Investing Activities</td>
      </tr>
      <tr>
        <td class="title">Capital expenditures</td>
        <td class="value sub">-0</td>
      </tr>
      <tr>
        <td class="title">Proceeds from sale of equipment</td>
        <td class="value">0</td>
      </tr>
      <tr class="l1">
        <td>Net Cash provided by investing Activities</td>
        <td class="value sub"><span class="sum">-0</span></td>
      </tr>

      <tr>
        <td class="blank-row">&nbsp;</td>
      </tr>
      <tr class="l1">
        <td>Financing Activities</td>
      </tr>
      <tr>
        <td class="title">Proceeds from issuing debt</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td class="title">Dividends paid</td>
        <td class="value sub">-0</td>
      </tr>
      <tr class="l1">
        <td>Net Cash provided by Financing Activities</td>
        <td class="value"><span class="sum">0</span></td>
      </tr>

      <tr>
        <td class="blank-row">&nbsp;</td>
      </tr>
      <tr class="l1">
        <td>Net increase in cash durring the year</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td>Cash at the beginning of the year</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td>Cash at the end of the year</td>
        <td class="value">0</td>
      </tr>

      <tr>
        <td class="blank-row">&nbsp;</td>
      </tr>
    </table>

    <div class="l1 ar-lightgrey-background">Ratios</div>
    <table>
      <tr>
        <td>Cash flows from operating activities</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td>Cash flows from investing activities</td>
        <td class="value">0</td>
      </tr>
      <tr>
        <td>Cash flows from financing activities</td>
        <td class="value">0</td>
      </tr>
    </table>
  </div>
</template>



<style scoped>
table {
  padding: 15px;
  text-align: left;
}
.l1 {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 5px;
}
.l2 {
  font-size: 1em;
  font-weight: bold;
  margin-top: 2px;
  margin-bottom: 2px;
  padding-left: 10px;
}
.blank_row {
  height: 10px !important; /* overwrites any other rules */
}
.title {
  padding-left: 20px;
  padding-left: 20px;
}
.title-indent {
  padding-left: 40px !important;
  padding-left: 20px;
}
.value {
  text-align: right;
  padding-left: 20px;
}
.sum {
  border-top-style: solid;
}
.sub {
  color: #fa5151;
}
.sumrow {
  font-weight: bold;
}
</style>
