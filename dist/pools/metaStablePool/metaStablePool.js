"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaStablePool = void 0;
const types_1 = require("../../types");
const address_1 = require("@ethersproject/address");
const bmath_1 = require("../../bmath");
const SDK = __importStar(require("@georgeroman/balancer-v2-pools"));
const metaStableMath_1 = require("./metaStableMath");
class MetaStablePool {
    constructor(id, address, amp, swapFee, totalShares, tokens, tokensList) {
        this.poolType = types_1.PoolTypes.MetaStable;
        this.AMP_PRECISION = (0, bmath_1.bnum)(1000);
        this.MAX_IN_RATIO = (0, bmath_1.bnum)(0.3);
        this.MAX_OUT_RATIO = (0, bmath_1.bnum)(0.3);
        this.id = id;
        this.address = address;
        this.amp = (0, bmath_1.bnum)(amp);
        this.swapFee = (0, bmath_1.bnum)(swapFee);
        this.swapFeeScaled = (0, bmath_1.scale)(this.swapFee, 18);
        this.totalShares = totalShares;
        this.tokens = tokens;
        this.tokensList = tokensList;
        this.ampAdjusted = this.amp.times(this.AMP_PRECISION);
    }
    setTypeForSwap(type) {
        this.swapPairType = type;
    }
    parsePoolPairData(tokenIn, tokenOut) {
        let pairType;
        let tI;
        let tO;
        let balanceIn;
        let balanceOut;
        let decimalsOut;
        let decimalsIn;
        let tokenIndexIn;
        let tokenIndexOut;
        let tokenInPriceRate = (0, bmath_1.bnum)(1);
        let tokenOutPriceRate = (0, bmath_1.bnum)(1);
        // Check if tokenIn is the pool token itself (BPT)
        if (tokenIn === this.address) {
            pairType = types_1.PairTypes.BptToToken;
            balanceIn = (0, bmath_1.bnum)(this.totalShares);
            decimalsIn = '18'; // Not used but has to be defined
        }
        else if (tokenOut === this.address) {
            pairType = types_1.PairTypes.TokenToBpt;
            balanceOut = (0, bmath_1.bnum)(this.totalShares);
            decimalsOut = '18'; // Not used but has to be defined
        }
        else {
            pairType = types_1.PairTypes.TokenToToken;
        }
        if (pairType !== types_1.PairTypes.BptToToken) {
            tokenIndexIn = this.tokens.findIndex(t => (0, address_1.getAddress)(t.address) === (0, address_1.getAddress)(tokenIn));
            if (tokenIndexIn < 0)
                throw 'Pool does not contain tokenIn';
            tI = this.tokens[tokenIndexIn];
            // balanceIn = tI.balance;
            balanceIn = (0, bmath_1.bnum)(tI.balance).times((0, bmath_1.bnum)(tI.priceRate));
            decimalsIn = tI.decimals;
            tokenInPriceRate = (0, bmath_1.bnum)(tI.priceRate);
        }
        if (pairType !== types_1.PairTypes.TokenToBpt) {
            tokenIndexOut = this.tokens.findIndex(t => (0, address_1.getAddress)(t.address) === (0, address_1.getAddress)(tokenOut));
            if (tokenIndexOut < 0)
                throw 'Pool does not contain tokenOut';
            tO = this.tokens[tokenIndexOut];
            // balanceOut = tO.balance;
            balanceOut = (0, bmath_1.bnum)(tO.balance).times((0, bmath_1.bnum)(tO.priceRate));
            decimalsOut = tO.decimals;
            tokenOutPriceRate = (0, bmath_1.bnum)(tO.priceRate);
        }
        // Get all token balances
        let allBalances = [];
        let allBalancesScaled = [];
        for (let i = 0; i < this.tokens.length; i++) {
            // const balanceBn = bnum(this.tokens[i].balance);
            const balanceBn = (0, bmath_1.bnum)(this.tokens[i].balance)
                .times((0, bmath_1.bnum)(this.tokens[i].priceRate))
                .dp(Number(this.tokens[i].decimals), 1);
            allBalances.push(balanceBn);
            allBalancesScaled.push((0, bmath_1.scale)(balanceBn, 18));
        }
        let inv = (0, metaStableMath_1._invariant)(this.amp, allBalances);
        const poolPairData = {
            id: this.id,
            address: this.address,
            poolType: this.poolType,
            pairType: pairType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            balanceIn: balanceIn,
            balanceOut: balanceOut,
            invariant: inv,
            swapFee: this.swapFee,
            swapFeeScaled: this.swapFeeScaled,
            allBalances,
            allBalancesScaled,
            amp: this.amp,
            tokenIndexIn: tokenIndexIn,
            tokenIndexOut: tokenIndexOut,
            decimalsIn: Number(decimalsIn),
            decimalsOut: Number(decimalsOut),
            tokenInPriceRate,
            tokenOutPriceRate,
        };
        return poolPairData;
    }
    getNormalizedLiquidity(poolPairData) {
        // This is an approximation as the actual normalized liquidity is a lot more complicated to calculate
        return poolPairData.balanceOut.times(poolPairData.amp);
    }
    getLimitAmountSwap(poolPairData, swapType) {
        // We multiply ratios by 10**-18 because we are in normalized space
        // so 0.5 should be 0.5 and not 500000000000000000
        // TODO: update bmath to use everything normalized
        // PoolPairData is using balances that have already been exchanged so need to convert back
        if (swapType === types_1.SwapTypes.SwapExactIn) {
            return poolPairData.balanceIn
                .div(poolPairData.tokenInPriceRate)
                .times(this.MAX_IN_RATIO);
        }
        else {
            return poolPairData.balanceOut
                .div(poolPairData.tokenOutPriceRate)
                .times(this.MAX_OUT_RATIO);
        }
    }
    // Updates the balance of a given token for the pool
    updateTokenBalanceForPool(token, newBalance) {
        // token is BPT
        if (this.address == token) {
            this.totalShares = newBalance.toString();
        }
        else {
            // token is underlying in the pool
            const T = this.tokens.find(t => t.address === token);
            T.balance = newBalance.toString();
        }
    }
    _exactTokenInForTokenOut(poolPairData, amount) {
        // Using BigNumber.js decimalPlaces (dp), allows us to consider token decimal accuracy correctly,
        // i.e. when using token with 2decimals 0.002 should be returned as 0
        // Uses ROUND_DOWN mode (1)
        let amt = (0, metaStableMath_1._exactTokenInForTokenOut)(amount.times(poolPairData.tokenInPriceRate), poolPairData).dp(poolPairData.decimalsOut, 1);
        return amt.div(poolPairData.tokenOutPriceRate);
    }
    _exactTokenInForBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._exactTokenInForBPTOut)(amount, poolPairData);
    }
    _exactBPTInForTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._exactBPTInForTokenOut)(amount, poolPairData);
    }
    _tokenInForExactTokenOut(poolPairData, amount) {
        // Using BigNumber.js decimalPlaces (dp), allows us to consider token decimal accuracy correctly,
        // i.e. when using token with 2decimals 0.002 should be returned as 0
        // Uses ROUND_UP mode (0)
        let amt = (0, metaStableMath_1._tokenInForExactTokenOut)(amount.times(poolPairData.tokenOutPriceRate), poolPairData).dp(poolPairData.decimalsIn, 0);
        return amt.div(poolPairData.tokenInPriceRate);
    }
    _tokenInForExactBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._tokenInForExactBPTOut)(amount, poolPairData);
    }
    _BPTInForExactTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._BPTInForExactTokenOut)(amount, poolPairData);
    }
    _spotPriceAfterSwapExactTokenInForTokenOut(poolPairData, amount) {
        let amountConverted = amount.times(poolPairData.tokenInPriceRate);
        let result = (0, metaStableMath_1._spotPriceAfterSwapExactTokenInForTokenOut)(amountConverted, poolPairData);
        return result;
    }
    _spotPriceAfterSwapExactTokenInForBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._spotPriceAfterSwapExactTokenInForBPTOut)(amount, poolPairData);
    }
    _spotPriceAfterSwapExactBPTInForTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._spotPriceAfterSwapExactBPTInForTokenOut)(amount, poolPairData);
    }
    _spotPriceAfterSwapTokenInForExactTokenOut(poolPairData, amount) {
        let amountConverted = amount.times(poolPairData.tokenOutPriceRate);
        let result = (0, metaStableMath_1._spotPriceAfterSwapTokenInForExactTokenOut)(amountConverted, poolPairData);
        return result;
    }
    _spotPriceAfterSwapTokenInForExactBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._spotPriceAfterSwapTokenInForExactBPTOut)(amount, poolPairData);
    }
    _spotPriceAfterSwapBPTInForExactTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._spotPriceAfterSwapBPTInForExactTokenOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapExactTokenInForTokenOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapExactTokenInForBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapExactTokenInForBPTOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapExactBPTInForTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapExactBPTInForTokenOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapTokenInForExactTokenOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapTokenInForExactBPTOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapTokenInForExactBPTOut)(amount, poolPairData);
    }
    _derivativeSpotPriceAfterSwapBPTInForExactTokenOut(poolPairData, amount) {
        return (0, metaStableMath_1._derivativeSpotPriceAfterSwapBPTInForExactTokenOut)(amount, poolPairData);
    }
    _evmoutGivenIn(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            const amtScaled = (0, bmath_1.scale)(amount, 18);
            let amountConverted = amtScaled.times(poolPairData.tokenInPriceRate);
            const amt = SDK.StableMath._calcOutGivenIn(this.ampAdjusted, poolPairData.allBalancesScaled, poolPairData.tokenIndexIn, poolPairData.tokenIndexOut, amountConverted, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt.div(poolPairData.tokenOutPriceRate), -18);
        }
        catch (err) {
            console.error(`_evmoutGivenIn: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
    _evminGivenOut(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            const amtScaled = (0, bmath_1.scale)(amount, 18);
            let amountConverted = amtScaled.times(poolPairData.tokenOutPriceRate);
            const amt = SDK.StableMath._calcInGivenOut(this.ampAdjusted, poolPairData.allBalancesScaled, poolPairData.tokenIndexIn, poolPairData.tokenIndexOut, amountConverted, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt.div(poolPairData.tokenInPriceRate), -18);
        }
        catch (err) {
            console.error(`_evminGivenOut: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
    _evmexactTokenInForBPTOut(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            const bptTotalSupplyScaled = (0, bmath_1.scale)(poolPairData.balanceOut, 18);
            // amountsIn must have same length as balances. Only need value for token in.
            const amountsIn = poolPairData.allBalances.map((bal, i) => {
                if (i === poolPairData.tokenIndexIn)
                    return (0, bmath_1.scale)(amount, 18);
                else
                    return bmath_1.ZERO;
            });
            const amt = SDK.StableMath._calcBptOutGivenExactTokensIn(this.ampAdjusted, poolPairData.allBalancesScaled, amountsIn, bptTotalSupplyScaled, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt, -18);
        }
        catch (err) {
            console.error(`_evmexactTokenInForBPTOut: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
    _evmexactBPTInForTokenOut(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            const bptAmountInScaled = (0, bmath_1.scale)(amount, 18);
            const bptTotalSupplyScaled = (0, bmath_1.scale)(poolPairData.balanceIn, 18);
            const amt = SDK.StableMath._calcTokenOutGivenExactBptIn(this.ampAdjusted, poolPairData.allBalancesScaled, poolPairData.tokenIndexOut, bptAmountInScaled, bptTotalSupplyScaled, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt, -18);
        }
        catch (err) {
            console.error(`_evmexactBPTInForTokenOut: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
    _evmtokenInForExactBPTOut(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            const bptAmountOutScaled = (0, bmath_1.scale)(amount, 18);
            const bptTotalSupplyScaled = (0, bmath_1.scale)(poolPairData.balanceOut, 18);
            const amt = SDK.StableMath._calcTokenInGivenExactBptOut(this.ampAdjusted, poolPairData.allBalancesScaled, poolPairData.tokenIndexIn, bptAmountOutScaled, bptTotalSupplyScaled, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt, -18);
        }
        catch (err) {
            console.error(`_evmtokenInForExactBPTOut: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
    _evmbptInForExactTokenOut(poolPairData, amount) {
        try {
            // All values should use 1e18 fixed point
            // i.e. 1USDC => 1e18 not 1e6
            // amountsOut must have same length as balances. Only need value for token out.
            const amountsOut = poolPairData.allBalances.map((bal, i) => {
                if (i === poolPairData.tokenIndexOut)
                    return (0, bmath_1.scale)(amount, 18);
                else
                    return bmath_1.ZERO;
            });
            const bptTotalSupplyScaled = (0, bmath_1.scale)(poolPairData.balanceIn, 18);
            const amt = SDK.StableMath._calcBptInGivenExactTokensOut(this.ampAdjusted, poolPairData.allBalancesScaled, amountsOut, bptTotalSupplyScaled, poolPairData.swapFeeScaled);
            // return normalised amount
            return (0, bmath_1.scale)(amt, -18);
        }
        catch (err) {
            console.error(`_evmbptInForExactTokenOut: ${err.message}`);
            return bmath_1.ZERO;
        }
    }
}
exports.MetaStablePool = MetaStablePool;