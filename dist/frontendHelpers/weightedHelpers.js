'use strict';
var __importStar =
    (this && this.__importStar) ||
    function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result['default'] = mod;
        return result;
    };
Object.defineProperty(exports, '__esModule', { value: true });
const bignumber_1 = require('../utils/bignumber');
const weightedMath = __importStar(
    require('../pools/weightedPool/weightedMath')
);
/////////
/// UI Helpers
/////////
// Get BPT amount for token amounts with zero-price impact
// This function is the same regardless of whether we are considering
// an Add or Remove liquidity operation: The spot prices of BPT in tokens
// are the same regardless.
function BPTForTokensZeroPriceImpact(
    balances,
    decimals,
    normalizedWeights,
    amounts,
    bptTotalSupply
) {
    let zero = new bignumber_1.BigNumber(0);
    let amountBPTOut = new bignumber_1.BigNumber(0);
    // Calculate the amount of BPT adding this liquidity would result in
    // if there were no price impact, i.e. using the spot price of tokenIn/BPT
    for (let i = 0; i < balances.length; i++) {
        // We need to scale down all the balances and amounts
        amounts[i] = amounts[i].times(
            new bignumber_1.BigNumber(10).pow(-decimals[i])
        );
        let poolPairData = {
            balanceIn: balances[i].times(
                new bignumber_1.BigNumber(10).pow(-decimals[i])
            ),
            balanceOut: bptTotalSupply.times(
                new bignumber_1.BigNumber(10).pow(-18)
            ),
            weightIn: normalizedWeights[i].times(
                new bignumber_1.BigNumber(10).pow(-18)
            ),
            swapFee: zero,
        };
        let BPTPrice = weightedMath._spotPriceAfterSwapTokenInForExactBPTOut(
            zero,
            poolPairData
        );
        amountBPTOut = amountBPTOut.plus(amounts[i].div(BPTPrice));
    }
    // We need to scale up the amount of BPT out
    return amountBPTOut.times(new bignumber_1.BigNumber(10).pow(18));
}
exports.BPTForTokensZeroPriceImpact = BPTForTokensZeroPriceImpact;
