
export default {
    sandbox: { name: 'Sandbox' },
    localhost: {
        name: 'localhost',
        endpoint: 'http://psibase.127.0.0.1.sslip.io:8080'
    },
    mainnet: {
        name: 'EOS Mainnet',
        endpoint: '',
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
        dFuseRpc: 'https://eos.dfuse.eosnation.io',
        authentication: 'https://auth.eosnation.io/v1/auth/issue',
        graphQL: 'wss://eos.dfuse.eosnation.io/graphql',
        hyperion: 'https://api.eossweden.org/v2',
        firstBlock: 1
    },
}