'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.VAULTADDR =
    exports.MULTIADDR =
    exports.WETHADDR =
    exports.EMPTY_SWAPINFO =
        void 0;
const bignumber_1 = require('./utils/bignumber');
const Zero = new bignumber_1.BigNumber(0);
exports.EMPTY_SWAPINFO = {
    tokenAddresses: [],
    swaps: [],
    swapAmount: Zero,
    swapAmountForSwaps: Zero,
    tokenIn: '',
    tokenOut: '',
    returnAmount: Zero,
    returnAmountConsideringFees: Zero,
    returnAmountFromSwaps: Zero,
    // marketSp: Zero
    marketSp: Zero,
};
exports.WETHADDR = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    5: '0x9A1000D492d40bfccbc03f413A48F5B6516Ec0Fd',
    42: '0xdFCeA9088c8A88A76FF74892C1457C17dfeef9C1',
    137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    592: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720',
};
exports.MULTIADDR = {
    1: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    5: '0x3b2A02F22fCbc872AF77674ceD303eb269a46ce3',
    42: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
    137: '0xa1B2b503959aedD81512C37e9dce48164ec6a94d',
    42161: '0x269ff446d9892c9e19082564df3f5e8741e190a1',
    592: '0xeB93D9EDDCb7476aF0c415E5a6d429454f85833A',
};
exports.VAULTADDR = {
    1: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    5: '0x65748E8287Ce4B9E6D83EE853431958851550311',
    42: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    137: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    42161: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    592: '0x7Cd0C38850A3AaBb773311AAAADA3444D31DCE03',
};
