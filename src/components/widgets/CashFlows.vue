<template>
  <div style="scroll: auto;">
    <div>
      <div>
        <div class="column">
          <div class="l1" v-if="dataObj">{{ dataObj.name }}</div>
          <div>Balance Sheet</div>
          <div>December 31 2021</div>
        </div>
        <div class="column" style="max-width: 200px;">
          <div>
            <span>Working capital</span>
            <span class="value">0%</span>
          </div>
          <div>
            <span>Current ratio</span>
            <span class="value">0%</span>
          </div>
          <div>
            <span>Quick ratio</span>
            <span class="value">0%</span>
          </div>
          <div>
            <span>Debt to equity ratio</span>
            <span class="value">0%</span>
          </div>
          <div>
            <span>Debt to total assets</span>
            <span class="value">0%</span>
          </div>
        </div>
      </div>

      <div>
        <div class="column">
          <div class="l1">Assests</div>
          <div class="ar-readonly-div">
            <div class="l2">Current Assets</div>
            <div>
              <span class="title">Cash and cash equivalents</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Short-term investments</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Accounts receivable -net</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Inventory</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Supplies</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Prepaid expenses</span>
              <span class="value">0</span>
            </div>
            <div class="l2">
              <span>Total Current Assets</span>
              <span class="value sum">0</span>
            </div>
          </div>
          <div class="l2 ar-readonly-div">
            <span>Investments</span>
            <span class="value">0</span>
          </div>
          <div class="ar-readonly-div">
            <div class="l2">Property Plant and Equipment -net</div>
            <div>
              <span class="title">Land</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Land Improvements</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Buildings</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Equipment</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Less: accumulated deprication</span>
              <span class="value">(0)</span>
            </div>
            <div class="l2">
              <span>Total Property Plant and Equipment</span>
              <span class="value sum">0</span>
            </div>
          </div>
          <div class="ar-readonly-div">
            <div class="l2">Intangible Assests</div>
            <div>
              <span class="title">Goodwill</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Other intangible assests</span>
              <span class="value">0</span>
            </div>
            <div class="l2">
              <span>Total Intangible Assests</span>
              <span class="value sum">0</span>
            </div>
          </div>
          <div class="l2 ar-readonly-div">
            <span>Other Assests</span>
            <span class="value">0</span>
          </div>
        </div>

        <div class="column">
          <div class="l1">Liabilities and Stockholders' Equity</div>
          <div class="ar-readonly-div">
            <div class="l2">Liabilities</div>
            <div class="ar-readonly-div">
              <div class="l3">Current Liabilities</div>
              <div>
                <span class="title">Short-term loans payable</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">current portion of long-term debt</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Accounts payable</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Accrued Compensation and benifits</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Income taxes payable</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Other accrued libilities</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Defered revenues</span>
                <span class="value">0</span>
              </div>
              <div class="l3">
                <span>Total Current Libilitie</span>
                <span class="value sum">0</span>
              </div>
            </div>
            <div class="ar-readonly-div">
              <div class="l3">Long-term Liabilities</div>
              <div>
                <span class="title">Notes payable</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Bonds payable</span>
                <span class="value">0</span>
              </div>
              <div>
                <span class="title">Defered income tax</span>
                <span class="value">0</span>
              </div>
              <div class="l3">
                <span>Total Long-term Libilities</span>
                <span class="value sum">0</span>
              </div>
            </div>
            <div class="l2">
              <span>Total Libilities</span>
              <span class="value sum">0</span>
            </div>
          </div>
          <div class="ar-readonly-div">
            <div class="l2">Stockholders' Equity</div>
            <div>
              <span class="title">Common stock</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Retained earnings</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Accum other comprehensive income</span>
              <span class="value">0</span>
            </div>
            <div>
              <span class="title">Less: treasury stock</span>
              <span class="value">(0)</span>
            </div>
            <div class="l2">
              <span>Total Stockholders' Equity</span>
              <span class="value sum">0</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="column">
          <div class="l1">
            <span>Total Assests</span>
            <span class="value sum">0</span>
          </div>
        </div>

        <div class="column">
          <div class="l1">
            <span>Total Liabilities and Stockholders' Equity</span>
            <span class="value sum">0</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="column">
        <div class="l1" v-if="dataObj">{{ dataObj.name }}</div>
        <div>Statement of Financial Position</div>
        <div>December 31 2021</div>
      </div>
      <div>
        <div class="column">
          <div class="l1">Assests</div>
          <div class="ar-readonly-div">
            <div class="l2">
              <span>Cash and cash equivalents</span>
              <span class="value">0</span>
            </div>
            <div class="l2">
              <span>Short-term investments</span>
              <span class="value">0</span>
            </div>
          </div>
        </div>

        <div class="column">
          <div class="l1">Liabilities and Net Assets</div>
          <div class="ar-readonly-div">
            <div class="l2">
              <span>Accrued expenses</span>
              <span class="value">0</span>
            </div>
            <div class="ar-readonly-div">
              <div class="l2">Net assets</div>
              <div>
                <span class="title">Without donor restrictions</span>
                <span class="value">0</span>
              </div>
              <div class="l2">
                <span>Total Assets</span>
                <span class="value sum">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="column">
          <div class="l1">
            <span>Total Assests</span>
            <span class="value sum">0</span>
          </div>
        </div>

        <div class="column">
          <div class="l1">
            <span>Total Liabilities and Net Assets</span>
            <span class="value sum">0</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-cash-flows",
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
.column {
  display: inline-block;
  width: 45%;
  padding: 10px;
  vertical-align: top;
  max-width: 500px;
}
.l1 {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 5px;
}
.l2 {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 5px;
}
.l3 {
  font-size: 1em;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 5px;
}
.title {
  padding-left: 20px;
}
.value {
  float: right;
}
.sum {
  border-top-style: solid;
}
/* Readonly div */
.ar-readonly-div {
  background-color: #ffffff08;
  padding-left: 20px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 24px;
  min-height: 24px;
}
</style>
