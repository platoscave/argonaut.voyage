// See https://github.com/Novusphere/discussions-vue/blob/master/src/watcher/greymass.js
// API: https://mainnet.telos.net/v2/docs/index.html#/history/get_v2_history_get_actions
// Vue example (with UAL) https://github.com/telosnetwork/ui-template/blob/master/src/pages/Streaming.vue

import { sleep } from "@/novusphere-js/utility";
import axios from 'axios';

export default class GreymassWatcher {
    constructor(endpoint, name) {
        this.name = name || 'greymass';
        this._endpoint = endpoint || `https://eos.greymass.com`;
    }

    async getPreviousAction(chain, account, collection) {
        return await collection
            .find({ account, chain })
            .sort({ position: -1 })
            .limit(1)
            .next()
            || { block: -1, position: -1 };
    }

    async startWatch(account, previousAction, onAction) {
        try {
            for (; ;) {

                const { data } = await axios.post(`${this._endpoint}/v1/history/get_actions`,
                    JSON.stringify({
                        account_name: account,
                        pos: previousAction.position + 1,
                        offset: 100
                    }),
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000 // 10s timeout
                    });

                const actions = data.actions.map((a, i) => {
                    const { trx_id, act } = a.action_trace;

                    let block_time = a.block_time;
                    if (typeof block_time == 'string') {
                        if (!block_time.endsWith('Z'))
                            block_time = `${block_time}Z`; // UTC
                    }

                    return {
                        id: Number(a.global_action_seq),
                        position: a.account_action_seq,
                        account: act.account,
                        auth: act.authorization.map(auth => auth.actor),
                        transaction: trx_id,
                        block: a.block_num,
                        time: new Date(block_time).getTime(),
                        name: act.name,
                        hexData: act.hex_data,
                        data: act.data
                    };
                });

                for (const action of actions) {
                    if (onAction) {
                        onAction(action);
                    }
                    if (!previousAction || action.position > previousAction.position) {
                        previousAction = action;
                        //console.log(`GM position set to ${account}@${previousAction.position}`);
                    }
                }

                await sleep(2500);
            }
        }
        catch (ex) {
            console.error(`Greymass error for ${account}`, ex);
        }
    }
}