import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from './utils/bignumber';
import { ZERO } from './bmath';
import cloneDeep from 'lodash.clonedeep';
import { EMPTY_SWAPINFO } from './constants';

import {
    SwapInfo,
    DisabledOptions,
    SwapTypes,
    NewPath,
    PoolDictionary,
    SubGraphPoolsBase,
    SwapOptions,
    PoolFilter,
    WETHADDR,
    VAULTADDR,
    MULTIADDR,
    ZERO_ADDRESS,
    setWrappedInfo,
    getLidoStaticSwaps,
    isLidoStableSwap,
    getWrappedInfo,
    formatSwaps,
    calculatePathLimits,
    smartOrderRouter,
    filterPoolsOfInterest,
    filterHopPools,
    fetchSubgraphPools,
    getOnChainBalances,
    getCostOutputToken,
    bnum,
} from './index';
import { Swap, SubgraphPoolBase } from './types';
export class SOR {
    provider: BaseProvider;
    gasPrice: BigNumber;
    maxPools: number;
    chainId: number;
    // avg Balancer swap cost. Can be updated manually if required.
    swapCost: BigNumber;
    isUsingPoolsUrl: Boolean;
    poolsUrl: string;
    subgraphPools: SubGraphPoolsBase;
    tokenCost = {};
    onChainBalanceCache: SubGraphPoolsBase = { pools: [] };
    processedDataCache = {};
    finishedFetchingOnChain: boolean = false;
    disabledOptions: DisabledOptions;

    constructor(
        provider: BaseProvider,
        gasPrice: BigNumber,
        maxPools: number,
        chainId: number,
        poolsSource: string | SubGraphPoolsBase,
        swapCost: BigNumber = new BigNumber('100000'),
        disabledOptions: DisabledOptions = {
            isOverRide: false,
            disabledTokens: [],
        }
    ) {
        this.provider = provider;
        this.gasPrice = gasPrice;
        this.maxPools = maxPools;
        this.chainId = chainId;
        this.swapCost = swapCost;
        // The pools source can be a URL (e.g. pools from Subgraph) or a data set of pools
        if (typeof poolsSource === 'string') {
            this.isUsingPoolsUrl = true;
            this.poolsUrl = poolsSource;
        } else {
            this.isUsingPoolsUrl = false;
            this.subgraphPools = poolsSource;
        }
        this.disabledOptions = disabledOptions;
    }

    /*
    Find and cache cost of token.
    If cost is passed then it manually sets the value.
    */
    async setCostOutputToken(
        tokenOut: string,
        tokenDecimals: number,
        cost: BigNumber = null
    ): Promise<BigNumber> {
        tokenOut = tokenOut.toLowerCase();

        if (cost === null) {
            // Handle ETH/WETH cost
            if (
                tokenOut === ZERO_ADDRESS ||
                tokenOut.toLowerCase() === WETHADDR[this.chainId].toLowerCase()
            ) {
                this.tokenCost[tokenOut.toLowerCase()] = this.gasPrice
                    .times(this.swapCost)
                    .div(bnum(10 ** 18));
                return this.tokenCost[tokenOut.toLowerCase()];
            }
            // This calculates the cost to make a swap which is used as an input to SOR to allow it to make gas efficient recommendations
            const costOutputToken = await getCostOutputToken(
                tokenOut,
                this.gasPrice,
                this.swapCost,
                this.provider,
                this.chainId
            );

            this.tokenCost[tokenOut] = costOutputToken.div(
                bnum(10 ** tokenDecimals)
            );
            return this.tokenCost[tokenOut];
        } else {
            this.tokenCost[tokenOut] = cost;
            return cost;
        }
    }

    /*
    Saves updated pools data to internal onChainBalanceCache.
    If isOnChain is true will retrieve all required onChain data. (false is advised to only be used for testing)
    If poolsData is passed as parameter - uses this as pools source.
    If poolsData was passed in to constructor - uses this as pools source.
    If pools url was passed in to constructor - uses this to fetch pools source.
    */
    async fetchPools(
        isOnChain: boolean = true,
        poolsData: SubGraphPoolsBase = { pools: [] }
    ): Promise<boolean> {
        console.log('@@@@wrapper.ts:fetchPools..0');
        try {
            // If poolsData has been passed to function these pools should be used
            const isExternalPoolData =
                poolsData.pools.length > 0 ? true : false;

            let subgraphPools: SubGraphPoolsBase;

            console.log('@@@@wrapper.ts:fetchPools..1');
            if (isExternalPoolData) {
                console.log('@@@@wrapper.ts:fetchPools..2');
                subgraphPools = JSON.parse(JSON.stringify(poolsData));
                console.log('@@@@wrapper.ts:fetchPools..3');
                // Store as latest pools data
                if (!this.isUsingPoolsUrl) this.subgraphPools = subgraphPools;
                console.log('@@@@wrapper.ts:fetchPools..4');
            } else {
                console.log('@@@@wrapper.ts:fetchPools..5');
                // Retrieve from URL if set otherwise use data passed in constructor
                if (this.isUsingPoolsUrl) {
                    console.log('@@wrapper.ts:fetchPools..6');
                    subgraphPools = await fetchSubgraphPools(this.poolsUrl);
                    console.log('@@@@subgraphPools= ', subgraphPools);
                } else {
                    console.log('@@@@wrapper.ts:fetchPools..7');
                    subgraphPools = this.subgraphPools;
                }

                console.log('@@@@wrapper.ts:fetchPools..8');
                console.log(
                    '@@@@wrapper.ts:fetchPools..8.1 subgraphPools = ',
                    subgraphPools
                );
            }

            console.log('@@@@wrapper.ts:fetchPools..9');
            let previousStringify = JSON.stringify(this.onChainBalanceCache); // Used for compare
            console.log(
                '@@@@wrapper.ts:fetchPools..9...previousStringify= ',
                previousStringify
            );

            console.log('@@wrapper.ts:fetchPools..10');
            // Get latest on-chain balances (returns data in string/normalized format)
            this.onChainBalanceCache = await this.fetchOnChainBalances(
                subgraphPools,
                isOnChain
            );

            console.log(
                '@@@@wrapper.ts:fetchPools..this.onChainBalanceCache = ',
                this.onChainBalanceCache
            );
            console.log(
                '@@@@wrapper.ts:fetchPools..subgraphPools = ',
                subgraphPools
            );
            console.log('@@@@wrapper.ts:fetchPools..isOnChain = ', isOnChain);
            console.log('@@@@wrapper.ts:fetchPools..11');
            // If new pools are different from previous then any previous processed data is out of date so clear
            if (
                previousStringify !== JSON.stringify(this.onChainBalanceCache)
            ) {
                console.log(
                    '@@@@wrapper.ts:fetchPools..12. previousStringify = ',
                    previousStringify
                );
                this.processedDataCache = {};
            }

            this.finishedFetchingOnChain = true;
            console.log('@@@@wrapper.ts:fetchPools..13');

            return true;
        } catch (err) {
            // On error clear all caches and return false so user knows to try again.
            this.finishedFetchingOnChain = false;
            this.onChainBalanceCache = { pools: [] };
            this.processedDataCache = {};
            console.error(`@@@@Error: fetchPools(): ${err.message}`);
            return false;
        }
    }

    /*
    Uses multicall contract to fetch all onchain balances for pools.
    */
    private async fetchOnChainBalances(
        subgraphPools: SubGraphPoolsBase,
        isOnChain: boolean = true
    ): Promise<SubGraphPoolsBase> {
        console.log('@@wrapper.ts: fetchOnChainBalances 1');
        console.log(
            '@@wrapper.ts: fetchOnChainBalances subgraphPools = ',
            subgraphPools
        );
        console.log(
            '@@wrapper.ts: fetchOnChainBalances isOnChain = ',
            isOnChain
        );
        if (subgraphPools.pools.length === 0) {
            console.log('@@wrapper.ts: fetchOnChainBalances 2 ');
            console.error('ERROR: No Pools To Fetch.');
            return { pools: [] };
        }

        console.log('@@wrapper.ts: fetchOnChainBalances 3 ');
        // Allows for testing
        if (!isOnChain) {
            console.log(
                `!!!!!!! WARNING - Not Using Real OnChain Balances !!!!!!`
            );
            return subgraphPools;
        }

        console.log('@@wrapper.ts: fetchOnChainBalances 4 ');
        // This will return in normalized/string format
        const onChainPools: SubGraphPoolsBase = await getOnChainBalances(
            subgraphPools,
            MULTIADDR[this.chainId],
            VAULTADDR[this.chainId],
            this.provider
        );
        console.log('@@wrapper.ts: fetchOnChainBalances 5');

        // Error with multicall
        if (!onChainPools) return { pools: [] };
        console.log('@@wrapper.ts: fetchOnChainBalances 6 ');
        console.log('@@wrapper.ts: fetchOnChainBalances 7 ');

        return onChainPools;
    }

    async getSwaps(
        tokenIn: string,
        tokenOut: string,
        swapType: SwapTypes,
        swapAmt: BigNumber,
        swapOptions: SwapOptions = {
            poolTypeFilter: PoolFilter.All,
            timestamp: 0,
        }
    ): Promise<SwapInfo> {
        let swapInfo: SwapInfo = {
            tokenAddresses: [],
            swaps: [],
            swapAmount: ZERO,
            swapAmountForSwaps: ZERO,
            tokenIn: '',
            tokenOut: '',
            returnAmount: ZERO,
            returnAmountConsideringFees: ZERO,
            returnAmountFromSwaps: ZERO,
            marketSp: ZERO,
        };
        console.log('@@@@@@@@wrapper.ts: getSwaps() swapType=', swapType);
        console.log('@@@@@@@@wrapper.ts: getSwaps() swapAmt=', swapAmt);
        console.log('@@@@@@@@wrapper.ts: getSwaps() tokenIn=', tokenOut);
        console.log(
            '@@@@@@@@wrapper.ts: getSwaps() this.chainId=',
            this.chainId
        );
        const wrappedInfo = await getWrappedInfo(
            this.provider,
            swapType,
            tokenIn,
            tokenOut,
            this.chainId,
            swapAmt
        );
        console.log('@@@@@@@@wrapper.ts: getSwaps() wrappedInfo=', wrappedInfo);
        console.log(
            '@@@@@@@@wrapper.ts: getSwaps() this.finishedFetchingOnChain=',
            this.finishedFetchingOnChain
        );
        if (this.finishedFetchingOnChain) {
            let pools = JSON.parse(JSON.stringify(this.onChainBalanceCache));
            if (!(swapOptions.poolTypeFilter === PoolFilter.All))
                pools.pools = pools.pools.filter(
                    p => p.poolType === swapOptions.poolTypeFilter
                );
            console.log('@@@@@@@@wrapper.ts: getSwaps() pools=', pools);
            console.log('@@@@@@@@wrapper.ts: getSwaps() isLidoStableSwap');

            if (isLidoStableSwap(this.chainId, tokenIn, tokenOut)) {
                swapInfo = await getLidoStaticSwaps(
                    pools,
                    this.chainId,
                    wrappedInfo.tokenIn.addressForSwaps,
                    wrappedInfo.tokenOut.addressForSwaps,
                    swapType,
                    wrappedInfo.swapAmountForSwaps,
                    this.provider
                );
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() swapInfo0=',
                    swapInfo
                );
            } else {
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() processSwaps. pools=',
                    pools
                );
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() processSwaps. wrappedInfo=',
                    wrappedInfo
                );
                console.log('@@@@@@@@wrapper.ts: getSwaps() processSwaps');
                swapInfo = await this.processSwaps(
                    wrappedInfo.tokenIn.addressForSwaps,
                    wrappedInfo.tokenOut.addressForSwaps,
                    swapType,
                    wrappedInfo.swapAmountForSwaps,
                    pools,
                    // swapOptions
                    true,
                    swapOptions.timestamp
                );
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() swapInfo1=',
                    swapInfo
                );
            }

            if (swapInfo.returnAmount.isZero()) {
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() swapInfo.returnAmount.isZero()=',
                    swapInfo.returnAmount.isZero()
                );
                console.log(
                    '@@@@@@@@wrapper.ts: getSwaps() swapInfo=',
                    swapInfo
                );
                return swapInfo;
            }

            swapInfo = setWrappedInfo(
                swapInfo,
                swapType,
                wrappedInfo,
                this.chainId
            );

            console.log('@@@@@@@@wrapper.ts: getSwaps() swapInfo=', swapInfo);
        }

        return swapInfo;
    }

    // Will process swap/pools data and return best swaps
    // useProcessCache can be false to force fresh processing of paths/prices
    async processSwaps(
        tokenIn: string,
        tokenOut: string,
        swapType: SwapTypes,
        swapAmt: BigNumber,
        onChainPools: SubGraphPoolsBase,
        useProcessCache: boolean = true,
        currentBlockTimestamp: number = 0
    ): Promise<SwapInfo> {
        let swapInfo: SwapInfo = {
            tokenAddresses: [],
            swaps: [],
            swapAmount: ZERO,
            swapAmountForSwaps: ZERO,
            tokenIn: '',
            tokenOut: '',
            returnAmount: ZERO,
            returnAmountConsideringFees: ZERO,
            returnAmountFromSwaps: ZERO,
            marketSp: ZERO,
        };
        console.log('@@@@@@@@wrapper.ts:processSwaps tokenIn = ', tokenIn);
        console.log('@@@@@@@@wrapper.ts:processSwaps tokenOut = ', tokenOut);
        console.log('@@@@@@@@wrapper.ts:processSwaps swapType = ', swapType);
        console.log('@@@@@@@@wrapper.ts:processSwaps swapAmt = ', swapAmt);
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps onChainPools = ',
            onChainPools
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps useProcessCache = ',
            useProcessCache
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps currentBlockTimestamp = ',
            currentBlockTimestamp
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps onChainPools.pools.length = ',
            onChainPools.pools.length
        );

        if (onChainPools.pools.length === 0) return swapInfo;
        let pools: PoolDictionary, paths: NewPath[], marketSp: BigNumber;

        // If token pair has been processed before that info can be reused to speed up execution
        let cache = this.processedDataCache[
            `${tokenIn}${tokenOut}${swapType}${currentBlockTimestamp}`
        ];

        // useProcessCache can be false to force fresh processing of paths/prices
        if (!useProcessCache || !cache) {
            // If not previously cached we must process all paths/prices.

            console.log('@@@@@@@@wrapper.ts:processSwaps no cache');
            console.log(
                '@@@@@@@@wrapper.ts:processSwaps onChainPools=',
                onChainPools
            );
            // Always use onChain info
            // Some functions alter pools list directly but we want to keep original so make a copy to work from
            let poolsList = JSON.parse(JSON.stringify(onChainPools));
            let pathData: NewPath[];
            let hopTokens: string[];
            // // NOTE プールリストから、スワップしたい通貨ペアの関係プールと、その２通貨以外の関連通貨取得。
            [pools, hopTokens] = filterPoolsOfInterest(
                poolsList.pools,
                tokenIn,
                tokenOut,
                this.maxPools,
                this.disabledOptions,
                currentBlockTimestamp
            );

            console.log('@@@@@@@@wrapper.ts:processSwaps pools:', pools);
            console.log(
                '@@@@@@@@wrapper.ts:processSwaps hopTokens:',
                hopTokens
            );
            //パス作成
            [pools, pathData] = filterHopPools(
                tokenIn,
                tokenOut,
                hopTokens,
                pools
            );
            console.log('@@@@@@@@wrapper.ts:processSwaps pools:', pools);
            console.log('@@@@@@@@wrapper.ts:processSwaps pathData:', pathData);

            //パスリミット計算
            [paths] = calculatePathLimits(pathData, swapType);
            console.log('@@@@@@@@wrapper.ts:processSwaps paths:', paths);

            // Update cache if used
            if (useProcessCache)
                this.processedDataCache[
                    `${tokenIn}${tokenOut}${swapType}${currentBlockTimestamp}`
                ] = {
                    pools: pools,
                    paths: paths,
                    marketSp: marketSp,
                };
            console.log(
                '@@@@@@@@wrapper.ts:processSwaps this.processedDataCache:',
                this.processedDataCache
            );
            console.log(
                '@@@@@@@@wrapper.ts:processSwaps useProcessCache:',
                useProcessCache
            );
        } else {
            console.log(
                '@@@@@@@@wrapper.ts:processSwaps use cache..',
                useProcessCache
            );
            // Using pre-processed data from cache
            pools = cache.pools;
            paths = cache.paths;
            marketSp = cache.marketSp;
        }

        let costOutputToken = this.tokenCost[tokenOut];
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps costOutputToken:',
            costOutputToken
        );

        if (swapType === SwapTypes.SwapExactOut)
            costOutputToken = this.tokenCost[tokenIn];

        // Use previously stored value if exists else default to 0
        if (costOutputToken === undefined) {
            costOutputToken = new BigNumber(0);
        }

        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. pools=',
            pools
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. paths=',
            paths
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. this.maxPools=',
            this.maxPools
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. this.maxPools=',
            this.maxPools
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. this.maxPools=',
            this.maxPools
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. costOutputToken=',
            costOutputToken
        );
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees. swapType=',
            swapType
        );

        // Returns list of swaps
        // swapExactIn - total = total amount swap will return of tokenOut
        // swapExactOut - total = total amount of tokenIn required for swap
        let swaps: any, total: BigNumber, totalConsideringFees: BigNumber;

        [swaps, total, marketSp, totalConsideringFees] = smartOrderRouter(
            JSON.parse(JSON.stringify(pools)), // Need to keep original pools for cache
            paths,
            swapType,
            swapAmt,
            this.maxPools,
            costOutputToken
        );
        console.log('@@@@@@@@wrapper.ts:processSwaps paths:', paths);
        console.log('@@@@@@@@wrapper.ts:processSwaps pools:', pools);
        console.log('@@@@@@@@wrapper.ts:processSwaps swaps:', swaps);
        console.log(
            '@@@@@@@@wrapper.ts:processSwaps totalConsideringFees:',
            totalConsideringFees
        );
        console.log('@@@@@@@@wrapper.ts:processSwaps marketSp:', marketSp);
        console.log('@@@@@@@@wrapper.ts:processSwaps swaps:', swaps);

        if (useProcessCache)
            this.processedDataCache[
                `${tokenIn}${tokenOut}${swapType}${currentBlockTimestamp}`
            ].marketSp = marketSp;

        swapInfo = formatSwaps(
            swaps,
            swapType,
            swapAmt,
            tokenIn,
            tokenOut,
            total,
            totalConsideringFees,
            marketSp
        );
        console.log('@@@@@@@@wrapper.ts:processSwaps swapInfo:', swapInfo);

        return swapInfo;
    }

    // // Will process swap/pools data and return best swaps
    // private async processSwaps(
    //     tokenIn: string,
    //     tokenOut: string,
    //     swapType: SwapTypes,
    //     swapAmount: BigNumber,
    //     pools: SubgraphPoolBase[],
    //     swapOptions: SwapOptions
    // ): Promise<SwapInfo> {
    //     if (pools.length === 0) return cloneDeep(EMPTY_SWAPINFO);

    //     const paths = this.routeProposer.getCandidatePaths(
    //         tokenIn,
    //         tokenOut,
    //         swapType,
    //         pools,
    //         swapOptions
    //     );

    //     if (paths.length == 0) return cloneDeep(EMPTY_SWAPINFO);

    //     // Path is guaranteed to contain both tokenIn and tokenOut
    //     let tokenInDecimals;
    //     let tokenOutDecimals;
    //     paths[0].swaps.forEach((swap) => {
    //         // Inject token decimals to avoid having to query onchain
    //         if (isSameAddress(swap.tokenIn, tokenIn)) {
    //             tokenInDecimals = swap.tokenInDecimals;
    //         }
    //         if (isSameAddress(swap.tokenOut, tokenOut)) {
    //             tokenOutDecimals = swap.tokenOutDecimals;
    //         }
    //     });

    //     const costOutputToken = await this.getCostOfSwapInToken(
    //         swapType === SwapTypes.SwapExactIn ? tokenOut : tokenIn,
    //         swapType === SwapTypes.SwapExactIn
    //             ? tokenOutDecimals
    //             : tokenInDecimals,
    //         swapOptions.gasPrice,
    //         swapOptions.swapGas
    //     );

    //     // Returns list of swaps
    //     const [swaps, total, marketSp, totalConsideringFees] =
    //         this.getBestPaths(
    //             paths,
    //             swapAmount,
    //             swapType,
    //             tokenInDecimals,
    //             tokenOutDecimals,
    //             costOutputToken,
    //             swapOptions.maxPools
    //         );

    //     const swapInfo = formatSwaps(
    //         swaps,
    //         swapType,
    //         swapAmount,
    //         tokenIn,
    //         tokenOut,
    //         total,
    //         totalConsideringFees,
    //         marketSp
    //     );

    //     return swapInfo;
    // }
}
