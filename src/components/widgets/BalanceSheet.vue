<template>
  <div name="BalanceSheet" class="ar-full-height ar-full-page">
    <div>
      <div class="ar-lightgrey-background">
        <div class="l1" v-if="dataObj">{{ dataObj.name }}</div>
        <div>Balance Sheet</div>
        <div>December 31 2021</div>
      </div>
      <table>
        <tr>
          <td>
            <tr class="l1">
              <td>Assests</td>
            </tr>
            <tr class="blank-row">
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Current Assets</td>
            </tr>
            <tr>
              <td class="title-indent">Cash and cash equivalents</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Short-term investments</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Accounts receivable -net</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Inventory</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Supplies</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Prepaid expenses</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="l2">Total current Assets</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Investments</td>
              <td class="value">0</td>
            </tr>

            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Property Plant and Equipment -net</td>
            </tr>
            <tr>
              <td class="title-indent">Land</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Land Improvements</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Buildings</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Buildings</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Equipment</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Less: accumulated deprication</td>
              <td class="value sub">-0</td>
            </tr>
            <tr>
              <td class="l2">Total Property Plant and Equipment -net</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>

            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Intangible Assests</td>
            </tr>
            <tr>
              <td class="title-indent">Goodwill</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Other intangible assests</td>
              <td class="value">0</td>
            </tr>

            <tr>
              <td class="l2">Total Intangible Assests</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Other Assests</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l1">Total Assests</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
          </td>

          <td>
            <tr class="l1">
              <td>Liabilities and Stockholders' Equity</td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Liabilities</td>
            </tr>

            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l3">Current Liabilities</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Short-term loans payable</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">
                Current portion of long-term debt
              </td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Accounts payable</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">
                Accrued Compensation and benifits
              </td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Income taxes payable</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Other accrued libilities</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Defered revenues</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="l3">Total Current Liabilities</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>

            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l3">Long-term Liabilities</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Notes payable</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Bonds payable</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent-indent">Defered income tax</td>
              <td class="value">0</td>
            </tr>

            <tr>
              <td class="l3">Total Long-term Liabilities</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>

            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Total Liabilities</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l2">Stockholders' Equity</td>
            </tr>
            <tr>
              <td class="title-indent">Common stock</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Retained earnings</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Accum other comprehensive income</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Less: treasury stock</td>
              <td class="value sub">-0</td>
            </tr>

            <tr>
              <td class="l2">Total Stockholders' Equity</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
            <tr>
              <td class="blank-row">&nbsp;</td>
            </tr>
            <tr>
              <td class="l1">Total Liabilities and Stockholders' Equity</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
          </td>
        </tr>
      </table>

      <div class="l1 ar-lightgrey-background">Ratios</div>
      <table>
        <tr>
          <td>Working capital</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Current ratio</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Quick ratio</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Debt to equity ratio</td>
          <td class="value">0%</td>
        </tr>
        <tr>
          <td>Debt to total assets</td>
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
          <td>
            <tr class="l1">
              <td>Assests</td>
            </tr>
            <tr>
              <td class="title">Cash and cash equivalents</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title">Short-term investments</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="l1">Total Assests</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
          </td>

          <td>
            <tr class="l1">
              <td>Liabilities and Net Assets</td>
            </tr>
            <tr>
              <td class="l2">Accrued expenses</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="l2">Net assets</td>
            </tr>
            <tr>
              <td class="title-indent">With donor restrictions</td>
              <td class="value">0</td>
            </tr>
            <tr>
              <td class="title-indent">Without donor restrictions</td>
              <td class="value">0</td>
            </tr>

            <tr>
              <td class="l2">Total Net assets</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
            <tr>
              <td class="l1">Total Liabilities and Net Assets</td>
              <td class="value"><span class="sum">0</span></td>
            </tr>
          </td>
        </tr>
      </table>
    </div>
    <p></p>
    <p></p>
  </div>
</template>

<script>
import { db } from "../../services/dexieServices";
import networks from '../../config/networks.js'
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-balance-sheet",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },

  /* subscriptions() {
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
  },*/
  async mounted() {
    this.dataObj = db.state.get(this.selectedObjId)

    let networkUserObj = await db.settings.get('application')
    const network = networkUserObj.currentNetwork;
    const dFuseRpc = networks[network].dFuseRpc

    const ts =  new Date().toISOString()

    const block = await fetch(`${dFuseRpc}/v0/block_id/by_time?time=${ts}&comparator=lt`,
      {
        mode: 'cors',
        headers: {
          //Authorization: "Bearer 3206ae4e540cb577788a02722f497b01",
        },
      }
    )

    const balances = fetch(`${dFuseRpc}/v0/state/table/row?' +
      'account=argonautvoya&scope=b1' +
      '&table=accounts' +
      '&primary_key=EOS' +
      '&key_type=symbol_code' +
      '&block_num=${block.num}' +
      '&json=true`,
      {
        mode: 'cors',
        headers: {
          //Authorization: "Bearer eyJhbGciOiJLTVNFUzI1Ni...",
        },
      }
    )
    console.log('balances', balances)
  },
};
</script>

<style scoped>
table {
  padding: 15px;
}
th {
  max-width: 150px;
}
td {
  vertical-align: bottom !important;
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
  margin-top: 2px;
  margin-bottom: 2px;
  padding-left: 20px !important;
}
.l3 {
  font-size: 1em;
  font-weight: bold;
  margin-top: 2px;
  margin-bottom: 2px;
  padding-left: 40px !important;
}
.blank_row {
  height: 5px !important; /* overwrites any other rules */
}
.title {
  padding-left: 20px;
  padding-left: 20px;
}
.title-indent {
  padding-left: 40px !important;
  padding-left: 20px;
}
.title-indent-indent {
  padding-left: 60px !important;
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
</style>
