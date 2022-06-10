// Hyperion endpoints: https://hyperion.docs.eosrio.io/endpoint/
// Telos endpoits: https://docs.telos.net/essentials
// dFuse endpoints: https://docs.dfuse.eosnation.io/eosio/public-apis/reference/network-endpoints/

module.exports = {
    sandbox: { name: 'Sandbox' },
    localhost: {
        name: 'localhost',
        endpoint: 'http://localhost:8888'
    },
    dFuseCloud: {
        name: 'dFuse Cloud',
        endpoint: 'https://eos-studio.api.dfuse.dev',
        chainId: 'bc31c358a5aaafb5f7ad73a2ef85625f67fe9dc027f8c441fc272027d53f00f6',
        authentication: '',
        graphQL: '',
        hyperion: '',
        firstBlock: 1
    },
    kylin: {
        name: 'Crypto Kylin Testnet',
        endpoint: 'https://api-kylin.eosasia.one',
        chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
        dFuseRpc: 'https://kylin.dfuse.eosnation.io',
        authentication: 'https://auth.eosnation.io/v1/auth/issue',
        graphQL: 'wss://kylin.dfuse.eosnation.io/graphql',
        hyperion: 'https://kylin.eossweden.org/v2',
        firstBlock: 1
    },
    jungle: {
        name: 'Jungle Testnet',
        endpoint: '',
        chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
        dFuseRpc: 'https://jungle.dfuse.eosnation.io',
        authentication: 'https://auth.eosnation.io/v1/auth/issue',
        graphQL: 'wss://jungle.dfuse.eosnation.io/graphql',
        hyperion: 'https://jungle3.eosrio.io/v2',
        firstBlock: 1
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
    telos: {
        name: 'Telos Mainnet',
        endpoint: 'https://api.telosgermany.io',
        chainId: '',
        dFuseRpc: '',
        authentication: '',
        graphQL: '',
        hyperion: 'https://mainnet.telos.net/v2',
        firstBlock: 1
    },
    telosTestnet: {
        name: 'Telos Testnet',
        endpoint: 'https://telos-testnet.eosphere.io',
        chainId: '',
        dFuseRpc: '',
        authentication: '',
        graphQL: '',
        hyperion: 'https://testnet.telos.net/v2',
        firstBlock: 1
    },
}