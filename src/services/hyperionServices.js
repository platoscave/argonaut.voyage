
export default class HyperionWatcher {

    //if (this.client) return;
    constructor() {
        this.client = new HyperionSocketClient('https://testnet.telos.caleos.io', {
            async: true,
            fetch: fetch
        });
    }
    async startWatch(account, previousAction, onAction) {
        this.client.onConnect = () => {
            this.client.streamActions({
                contract: "eosmechanics",
                action: "cpu",
                account: "eosmechanics",
                start_from: moment
                    .utc()
                    .subtract(2, "minutes")
                    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
                read_until: 0,
                filters: []
            });
        };

        this.client.onData = async (data, ack) => {
            this.benchmarks.unshift(data.content);
            console.log(data);
            ack();
        };

        this.client.connect(() => {
            console.log("Connected to Hyperion Stream!");
        })
    }
}