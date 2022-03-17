'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function(resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
            );
        });
    };
var __importDefault =
    (this && this.__importDefault) ||
    function(mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const contracts_1 = require('@ethersproject/contracts');
const types_1 = require('../../types');
const pools_1 = require('../../pools');
const bmath_1 = require('../../bmath');
const index_1 = require('../../index');
const Vault_json_1 = __importDefault(require('../../abi/Vault.json'));
const wstETH_json_1 = __importDefault(require('../../abi/wstETH.json'));
exports.Lido = {
    Networks: [1, 42],
    stETH: {
        1: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        42: '0x4803bb90d18a1cb7a2187344fe4feb0e07878d05',
    },
    wstETH: {
        1: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        42: '0xa387b91e393cfb9356a460370842bc8dbb2f29af',
    },
    WETH: {
        1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        42: '0xdfcea9088c8a88a76ff74892c1457c17dfeef9c1',
    },
    DAI: {
        1: '0x6b175474e89094c44da98b954eedeac495271d0f',
        42: '0x04df6e4121c27713ed22341e7c7df330f56f289b',
    },
    USDC: {
        1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        42: '0xc2569dd7d0fd715b054fbf16e75b001e5c0c1115',
    },
    USDT: {
        1: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        42: '0xcc08220af469192c53295fdd34cfb8df29aa17ab',
    },
    StaticPools: {
        // DAI/USDC/USDT
        staBal: {
            1: '0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063',
            42: '0x45f78862bd3aa5205e63141fa7f2d35f38eb87c30000000000000000000000fd',
        },
        // WETH/DAI (WETH/USDC on Kovan)
        wethDai: {
            1: '0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a',
            42: '0x3a19030ed746bd1c3f2b0f996ff9479af04c5f0a000200000000000000000004',
        },
        // WETH/wstETH Lido Pool
        wstEthWeth: {
            1: '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080',
            42: '0xe08590bde837eb9b2d42aa1196469d6e08fe96ec000200000000000000000101',
        },
    },
};
exports.Routes = {
    1: {},
    42: {},
};
// MAINNET STATIC ROUTES FOR LIDO <> Stable
// DAI/wstETH: DAI > WETH > wstETH
exports.Routes[1][`${exports.Lido.DAI[1]}${exports.Lido.wstETH[1]}0`] = {
    name: 'DAI/wstETH-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
    ],
};
// wstETH/DAI: wstETH > WETH > DAI
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.DAI[1]}0`] = {
    name: 'wstETH/DAI-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
    ],
};
// DAI/wstETH: DAI > WETH > wstETH
exports.Routes[1][`${exports.Lido.DAI[1]}${exports.Lido.wstETH[1]}1`] = {
    name: 'DAI/wstETH-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/DAI: wstETH > WETH > DAI
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.DAI[1]}1`] = {
    name: 'wstETH/DAI-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// USDC/wstETH: USDC > DAI > WETH > wstETH
exports.Routes[1][`${exports.Lido.USDC[1]}${exports.Lido.wstETH[1]}0`] = {
    name: 'USDC/wstETH-SwapExactIn',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDC[1],
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[1][`${exports.Lido.USDC[1]}${exports.Lido.wstETH[1]}1`] = {
    name: 'USDC/wstETH-SwapExactOut',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDC[1],
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/USDC: wstETH > WETH > DAI > USDC
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.USDC[1]}0`] = {
    name: 'wstETH/USDC-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
        exports.Lido.USDC[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.USDC[1]}1`] = {
    name: 'wstETH/USDC-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
        exports.Lido.USDC[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// USDT/wstETH: USDT > DAI > WETH > wstETH
exports.Routes[1][`${exports.Lido.USDT[1]}${exports.Lido.wstETH[1]}0`] = {
    name: 'USDT/wstETH-SwapExactIn',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDT[1],
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[1][`${exports.Lido.USDT[1]}${exports.Lido.wstETH[1]}1`] = {
    name: 'USDT/wstETH-SwapExactOut',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDT[1],
        exports.Lido.DAI[1],
        exports.Lido.WETH[1],
        exports.Lido.wstETH[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/USDT: wstETH > WETH > DAI > USDT
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.USDT[1]}0`] = {
    name: 'wstETH/USDT-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
        exports.Lido.USDT[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[1][`${exports.Lido.wstETH[1]}${exports.Lido.USDT[1]}1`] = {
    name: 'wstETH/USDT-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[1],
        exports.Lido.WETH[1],
        exports.Lido.DAI[1],
        exports.Lido.USDT[1],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[1],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[1],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[1],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// KOVAN STATIC ROUTES FOR LIDO <> Stable
// USDC/wstETH: USDC > WETH > wstETH
exports.Routes[42][`${exports.Lido.USDC[42]}${exports.Lido.wstETH[42]}0`] = {
    name: 'USDC/wstETH-SwapExactIn',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
    ],
};
// wstETH/USDC: wstETH > WETH > USDC
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.USDC[42]}0`] = {
    name: 'wstETH/USDC-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
    ],
};
// USDC/wstETH: USDC > WETH > wstETH
exports.Routes[42][`${exports.Lido.USDC[42]}${exports.Lido.wstETH[42]}1`] = {
    name: 'USDC/wstETH-SwapExactOut',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/USDC: wstETH > WETH > USDC
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.USDC[42]}1`] = {
    name: 'wstETH/USDC-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// DAI/wstETH: DAI > USDC > WETH > wstETH
exports.Routes[42][`${exports.Lido.DAI[42]}${exports.Lido.wstETH[42]}0`] = {
    name: 'DAI/wstETH-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.DAI[42],
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[42][`${exports.Lido.DAI[42]}${exports.Lido.wstETH[42]}1`] = {
    name: 'DAI/wstETH-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.DAI[42],
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/DAI: wstETH > WETH > USDC > DAI
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.DAI[42]}0`] = {
    name: 'wstETH/DAI-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
        exports.Lido.DAI[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.DAI[42]}1`] = {
    name: 'wstETH/DAI-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
        exports.Lido.DAI[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// USDT/wstETH: USDT > USDC > WETH > wstETH
exports.Routes[42][`${exports.Lido.USDT[42]}${exports.Lido.wstETH[42]}0`] = {
    name: 'USDT/wstETH-SwapExactIn',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDT[42],
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[42][`${exports.Lido.USDT[42]}${exports.Lido.wstETH[42]}1`] = {
    name: 'USDT/wstETH-SwapExactOut',
    tokenInDecimals: 6,
    tokenOutDecimals: 18,
    tokenAddresses: [
        exports.Lido.USDT[42],
        exports.Lido.USDC[42],
        exports.Lido.WETH[42],
        exports.Lido.wstETH[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// wstETH/USDT: wstETH > WETH > USDC > USDT
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.USDT[42]}0`] = {
    name: 'wstETH/USDT-SwapExactIn',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
        exports.Lido.USDT[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '0',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
    ],
};
exports.Routes[42][`${exports.Lido.wstETH[42]}${exports.Lido.USDT[42]}1`] = {
    name: 'wstETH/USDT-SwapExactOut',
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    tokenAddresses: [
        exports.Lido.wstETH[42],
        exports.Lido.WETH[42],
        exports.Lido.USDC[42],
        exports.Lido.USDT[42],
    ],
    swaps: [
        {
            poolId: exports.Lido.StaticPools.staBal[42],
            amount: '',
            assetInIndex: '2',
            assetOutIndex: '3',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wethDai[42],
            amount: '0',
            assetInIndex: '1',
            assetOutIndex: '2',
            userData: '0x',
        },
        {
            poolId: exports.Lido.StaticPools.wstEthWeth[42],
            amount: '0',
            assetInIndex: '0',
            assetOutIndex: '1',
            userData: '0x',
        },
    ],
};
// Only want static routes for Lido <> Stable
function isLidoStableSwap(chainId, tokenIn, tokenOut) {
    if (!exports.Lido.Networks.includes(chainId)) return false;
    tokenIn = tokenIn.toLowerCase();
    tokenOut = tokenOut.toLowerCase();
    if (
        (tokenIn === exports.Lido.wstETH[chainId] &&
            tokenOut === exports.Lido.DAI[chainId]) ||
        (tokenIn === exports.Lido.wstETH[chainId] &&
            tokenOut === exports.Lido.USDC[chainId]) ||
        (tokenIn === exports.Lido.wstETH[chainId] &&
            tokenOut === exports.Lido.USDT[chainId]) ||
        (tokenIn === exports.Lido.DAI[chainId] &&
            tokenOut === exports.Lido.wstETH[chainId]) ||
        (tokenIn === exports.Lido.USDC[chainId] &&
            tokenOut === exports.Lido.wstETH[chainId]) ||
        (tokenIn === exports.Lido.USDT[chainId] &&
            tokenOut === exports.Lido.wstETH[chainId]) ||
        (tokenIn === exports.Lido.stETH[chainId] &&
            tokenOut === exports.Lido.DAI[chainId]) ||
        (tokenIn === exports.Lido.stETH[chainId] &&
            tokenOut === exports.Lido.USDC[chainId]) ||
        (tokenIn === exports.Lido.stETH[chainId] &&
            tokenOut === exports.Lido.USDT[chainId]) ||
        (tokenIn === exports.Lido.DAI[chainId] &&
            tokenOut === exports.Lido.stETH[chainId]) ||
        (tokenIn === exports.Lido.USDC[chainId] &&
            tokenOut === exports.Lido.stETH[chainId]) ||
        (tokenIn === exports.Lido.USDT[chainId] &&
            tokenOut === exports.Lido.stETH[chainId])
    )
        return true;
    else return false;
}
exports.isLidoStableSwap = isLidoStableSwap;
// Uses Vault queryBatchSwap to get return amount for swap
function queryBatchSwap(swapType, swaps, assets, provider) {
    return __awaiter(this, void 0, void 0, function*() {
        const vaultAddr = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
        const vaultContract = new contracts_1.Contract(
            vaultAddr,
            Vault_json_1.default,
            provider
        );
        const funds = {
            sender: index_1.ZERO_ADDRESS,
            recipient: index_1.ZERO_ADDRESS,
            fromInternalBalance: false,
            toInternalBalance: false,
        };
        try {
            const deltas = yield vaultContract.callStatic.queryBatchSwap(
                swapType,
                swaps,
                assets,
                funds
            );
            // negative amounts represent tokens (or ETH) sent by the Vault
            if (swapType === types_1.SwapTypes.SwapExactIn)
                return bmath_1
                    .bnum(deltas[assets.length - 1].toString())
                    .times(-1);
            else return bmath_1.bnum(deltas[0].toString());
        } catch (err) {
            console.error(
                `SOR - Lido Static Route QueryBatchSwap Error. No swaps.`
            );
            return bmath_1.bnum(0);
        }
    });
}
/*
Spot Price for path is product of each pools SP for relevant tokens.
(See helpersClass getSpotPriceAfterSwapForPath)
*/
function calculateMarketSp(swapType, swaps, assets, pools) {
    const spotPrices = [];
    for (let i = 0; i < swaps.length; i++) {
        const swap = swaps[i];
        // Find matching pool from list so we can use balances, etc
        const pool = pools.pools.filter(p => p.id === swap.poolId);
        if (pool.length !== 1) return bmath_1.bnum(0);
        // This will get a specific pool type so we can call parse and spot price functions
        const newPool = pools_1.parseNewPool(pool[0]);
        if (!newPool) return bmath_1.bnum(0);
        // Parses relevant balances, etc
        const poolPairData = newPool.parsePoolPairData(
            assets[swap.assetInIndex],
            assets[swap.assetOutIndex]
        );
        // Calculate current spot price
        let spotPrice;
        if (swapType === types_1.SwapTypes.SwapExactIn)
            spotPrice = newPool._spotPriceAfterSwapExactTokenInForTokenOut(
                poolPairData,
                bmath_1.ZERO
            );
        // Amount = 0 to just get current SP
        else
            spotPrice = newPool._spotPriceAfterSwapTokenInForExactTokenOut(
                poolPairData,
                bmath_1.ZERO
            ); // Amount = 0 to just get current SP
        // console.log(`${swap.poolId} ${spotPrice.toString()}`);
        spotPrices.push(spotPrice);
    }
    // SP for Path is product of all
    return spotPrices.reduce((a, b) => a.times(b));
}
function getStEthRate(provider, chainId) {
    return __awaiter(this, void 0, void 0, function*() {
        // Call stEthPerToken or tokensPerStETH to get the scaling factors in each direction.
        const wstETHContract = new contracts_1.Contract(
            exports.Lido.wstETH[chainId],
            wstETH_json_1.default,
            provider
        );
        const rate = yield wstETHContract.tokensPerStEth();
        return bmath_1.scale(bmath_1.bnum(rate.toString()), -18);
    });
}
exports.getStEthRate = getStEthRate;
/*
Used when SOR doesn't support paths with more than one hop.
Enables swapping of stables <> wstETH via WETH/DAI pool which has good liquidity.
*/
function getLidoStaticSwaps(
    pools,
    chainId,
    tokenIn,
    tokenOut,
    swapType,
    swapAmount,
    provider
) {
    return __awaiter(this, void 0, void 0, function*() {
        // Check for stETH tokens and convert to use wstETH for routing
        let isWrappingIn,
            isWrappingOut = false;
        if (tokenIn === exports.Lido.stETH[chainId]) {
            tokenIn = exports.Lido.wstETH[chainId];
            isWrappingIn = true;
        }
        if (tokenOut === exports.Lido.stETH[chainId]) {
            tokenOut = exports.Lido.wstETH[chainId];
            isWrappingOut = true;
        }
        let swapInfo = {
            tokenAddresses: [],
            swaps: [],
            swapAmount: bmath_1.ZERO,
            swapAmountForSwaps: bmath_1.ZERO,
            tokenIn: '',
            tokenOut: '',
            returnAmount: bmath_1.ZERO,
            returnAmountConsideringFees: bmath_1.ZERO,
            returnAmountFromSwaps: bmath_1.ZERO,
            marketSp: bmath_1.ZERO,
        };
        const staticRoute =
            exports.Routes[chainId][`${tokenIn}${tokenOut}${swapType}`];
        if (!staticRoute) return swapInfo;
        swapInfo.tokenAddresses = staticRoute.tokenAddresses;
        swapInfo.swaps = staticRoute.swaps;
        if (swapType === types_1.SwapTypes.SwapExactIn)
            swapInfo.swapAmount = bmath_1
                .scale(swapAmount, staticRoute.tokenInDecimals)
                .dp(0);
        else
            swapInfo.swapAmount = bmath_1
                .scale(swapAmount, staticRoute.tokenOutDecimals)
                .dp(0);
        swapInfo.swaps[0].amount = swapInfo.swapAmount.toString();
        if (isWrappingIn) swapInfo.tokenIn = exports.Lido.stETH[chainId];
        else swapInfo.tokenIn = tokenIn;
        if (isWrappingOut) swapInfo.tokenOut = exports.Lido.stETH[chainId];
        else swapInfo.tokenOut = tokenOut;
        // Calculate SP as product of all pool SP in path
        swapInfo.marketSp = calculateMarketSp(
            swapType,
            swapInfo.swaps,
            swapInfo.tokenAddresses,
            pools
        );
        // Unlike main SOR here we haven't calculated the return amount for swaps so use query call on Vault to get value.
        swapInfo.returnAmount = yield queryBatchSwap(
            swapType,
            swapInfo.swaps,
            swapInfo.tokenAddresses,
            provider
        );
        if (swapInfo.returnAmount.isZero()) {
            return {
                tokenAddresses: [],
                swaps: [],
                swapAmount: bmath_1.ZERO,
                swapAmountForSwaps: bmath_1.ZERO,
                tokenIn: '',
                tokenOut: '',
                returnAmount: bmath_1.ZERO,
                returnAmountConsideringFees: bmath_1.ZERO,
                returnAmountFromSwaps: bmath_1.ZERO,
                marketSp: bmath_1.ZERO,
            };
        }
        // Considering fees shouldn't matter as there won't be alternative options on V1
        swapInfo.returnAmountConsideringFees = swapInfo.returnAmount;
        return swapInfo;
    });
}
exports.getLidoStaticSwaps = getLidoStaticSwaps;
