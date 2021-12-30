<template>
  <div name="IncomeStatement" class="ar-full-height ar-full-page">
    <div>
      <div class="ar-lightgrey-background">
        <div class="l1" v-if="dataObj">{{ dataObj.name }}</div>
        <div>Income Statement</div>
        <div>December 31 2021</div>
      </div>

      <table>
        <tr>
          <th></th>
          <th class="value">2021</th>
          <th class="value">2020</th>
          <th class="value">2019</th>
        </tr>
        <tr>
          <td>Net Sales</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td>Cost of Sales</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
        </tr>
        <tr class="sum-row">
          <td>Gross profit</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>
        <tr>
          <td>Selling, general and administrative expenses</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
        </tr>
        <tr>
          <td>Operating income</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>
        <tr>
          <td>Interest expense</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
        </tr>
        <tr>
          <td>Loss on sale of equipment</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
        </tr>
        <tr>
          <td>Income before income taxes</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>
        <tr>
          <td>Income tax expense</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
          <td class="value sub">-0</td>
        </tr>
        <tr>
          <td>Net income</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>
      </table>

      <div class="l1 ar-lightgrey-background">Ratios</div>

      <table>
        <tr>
          <th></th>
          <th class="value">2021</th>
          <th class="value">2020</th>
          <th class="value">2019</th>
        </tr>
        <tr>
          <td>Gross margin (gross profit percentage)</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Profit margin</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Earnings per share</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Times interest earned (interest coverage ratio)</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
          <td class="value">0%</td>
        </tr>
      </table>
    </div>

    <div>
      <div class="ar-lightgrey-background">
        <div class="l1" v-if="dataObj">{{ dataObj.name }}</div>
        <div>Statement of Financial Position</div>
        <div>December 31 2021</div>
      </div>
      <table>
        <tr>
          <th></th>
          <th class="value">Without donor restrictions</th>
          <th class="value">With donor restrictions</th>
          <th class="value">Total</th>
        </tr>
        <tr class="l1">
          <td>Revenues</td>
        </tr>
        <tr>
          <td class="title">Contributions</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Membership dues</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Program fees</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Fundraising events</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Grants</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Investment income</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Gain on sale of investments</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Income tax expense</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title">Reclassifications/td></td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr class="l1">
          <td>Total Revenues</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>

        <tr>
          <td class="blank-row">&nbsp;</td>
        </tr>
        <tr class="l1">
          <td>Expenses</td>
        </tr>
        <tr>
          <td class="l2">Program expenses</td>
        </tr>
        <tr>
          <td class="title-indent">Program 1</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title-indent">Program 2</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="l2">Total Program expenses</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>

        <tr>
          <td class="l2">Support expenses</td>
        </tr>
        <tr>
          <td class="title-indent">Management and general</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="title-indent">Fundraising and development</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
        <tr>
          <td class="l2">Total Support expenses</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>

        <tr class="l1">
          <td>Total Expenses</td>
          <td class="value sub"><span class="sum">0</span></td>
          <td class="value sub"><span class="sum">0</span></td>
          <td class="value sub"><span class="sum">0</span></td>
        </tr>

        <tr>
          <td class="blank-row">&nbsp;</td>
        </tr>
        <tr class="l1">
          <td class="l1">Change in net assets</td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
          <td class="value"><span class="sum">0</span></td>
        </tr>

        <tr>
          <td>+ Net assets - bginning</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>

        <tr>
          <td>= Net assets - end</td>
          <td class="value">0</td>
          <td class="value">0</td>
          <td class="value">0</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-income-statement",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((selectedObjId) => selectedObjId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) =>
        liveQuery(() => db.state.where({ _id: selectedObjId }).first())
      )
    );

    return {
      dataObj: dataObj$,
    };
  },
};
</script>

<style scoped>
table {
  padding-left: 20px;
  padding-top: 20px;
  padding-bottom: 20px;
}
th {
  max-width: 150px;
}
th td {
  padding-left: 20px;
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
  padding-left: 20px !important;
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
