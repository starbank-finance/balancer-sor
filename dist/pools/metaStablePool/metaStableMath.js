'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const bmath_1 = require('../../bmath');
// All functions are adapted from the solidity ones to be found on:
// https://github.com/balancer-labs/balancer-core-v2/blob/master/contracts/pools/stable/StableMath.sol
// TODO: implement all up and down rounding variations
/**********************************************************************************************
    // invariant                                                                                 //
    // D = invariant to compute                                                                  //
    // A = amplifier                n * D^2 + A * n^n * S * (n^n * P / D^(n−1))                  //
    // S = sum of balances         ____________________________________________                  //
    // P = product of balances    (n+1) * D + ( A * n^n − 1)* (n^n * P / D^(n−1))                //
    // n = number of tokens                                                                      //
    **********************************************************************************************/
function _invariant(
    amp, // amp
    balances // balances
) {
    let sum = bmath_1.ZERO;
    let totalCoins = balances.length;
    for (let i = 0; i < totalCoins; i++) {
        sum = sum.plus(balances[i]);
    }
    if (sum.isZero()) {
        return bmath_1.ZERO;
    }
    let prevInv = bmath_1.ZERO;
    let inv = sum;
    let ampTimesNpowN = amp.times(Math.pow(totalCoins, totalCoins)); // A*n^n
    for (let i = 0; i < 255; i++) {
        let P_D = bmath_1.bnum(totalCoins).times(balances[0]);
        for (let j = 1; j < totalCoins; j++) {
            //P_D is rounded up
            P_D = P_D.times(balances[j])
                .times(totalCoins)
                .div(inv);
        }
        prevInv = inv;
        //inv is rounded up
        inv = bmath_1
            .bnum(totalCoins)
            .times(inv)
            .times(inv)
            .plus(ampTimesNpowN.times(sum).times(P_D))
            .div(
                bmath_1
                    .bnum(totalCoins + 1)
                    .times(inv)
                    .plus(ampTimesNpowN.minus(1).times(P_D))
            );
        // Equality with the precision of 1
        if (inv.gt(prevInv)) {
            if (inv.minus(prevInv).lt(bmath_1.bnum(Math.pow(10, -18)))) {
                break;
            }
        } else if (prevInv.minus(inv).lt(bmath_1.bnum(Math.pow(10, -18)))) {
            break;
        }
    }
    //Result is rounded up
    return inv;
}
exports._invariant = _invariant;
// // This function has to be zero if the invariant D was calculated correctly
// // It was only used for double checking that the invariant was correct
// export function _invariantValueFunction(
//     amp: BigNumber, // amp
//     balances: BigNumber[], // balances
//     D: BigNumber
// ): BigNumber {
//     let invariantValueFunction;
//     let prod = ONE;
//     let sum = ZERO;
//     for (let i = 0; i < balances.length; i++) {
//         prod = prod.times(balances[i]);
//         sum = sum.plus(balances[i]);
//     }
//     let n = bnum(balances.length);
//     // NOT! working based on Daniel's equation: https://www.notion.so/Analytical-for-2-tokens-1cd46debef6648dd81f2d75bae941fea
//     // invariantValueFunction = amp.times(sum)
//     //     .plus((ONE.div(n.pow(n)).minus(amp)).times(D))
//     //     .minus((ONE.div(n.pow(n.times(2)).times(prod))).times(D.pow(n.plus(ONE))));
//     invariantValueFunction = D.pow(n.plus(ONE))
//         .div(n.pow(n).times(prod))
//         .plus(D.times(amp.times(n.pow(n)).minus(ONE)))
//         .minus(amp.times(n.pow(n)).times(sum));
//     return invariantValueFunction;
// }
// Adapted from StableMath.sol, _outGivenIn()
// * Added swap fee at very first line
/**********************************************************************************************
    // outGivenIn token x for y - polynomial equation to solve                                   //
    // ay = amount out to calculate                                                              //
    // by = balance token out                                                                    //
    // y = by - ay                                                                               //
    // D = invariant                               D                     D^(n+1)                 //
    // A = amplifier               y^2 + ( S - ----------  - 1) * y -  ------------- = 0         //
    // n = number of tokens                    (A * n^n)               A * n^2n * P              //
    // S = sum of final balances but y                                                           //
    // P = product of final balances but y                                                       //
    **********************************************************************************************/
function _exactTokenInForTokenOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    let tokenAmountIn = amount;
    tokenAmountIn = tokenAmountIn.times(bmath_1.ONE.minus(swapFee));
    //Invariant is rounded up
    let inv = _invariant(amp, balances);
    let p = inv;
    let sum = bmath_1.ZERO;
    let totalCoins = bmath_1.bnum(balances.length);
    let n_pow_n = bmath_1.ONE;
    let x = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        n_pow_n = n_pow_n.times(totalCoins);
        if (i == tokenIndexIn) {
            x = balances[i].plus(tokenAmountIn);
        } else if (i != tokenIndexOut) {
            x = balances[i];
        } else {
            continue;
        }
        sum = sum.plus(x);
        //Round up p
        p = p.times(inv).div(x);
    }
    //Calculate out balance
    let y = _solveAnalyticalBalance(sum, inv, amp, n_pow_n, p);
    //Result is rounded down
    // return balances[tokenIndexOut] > y ? balances[tokenIndexOut].minus(y) : 0;
    return balances[tokenIndexOut].minus(y);
}
exports._exactTokenInForTokenOut = _exactTokenInForTokenOut;
// Adapted from StableMath.sol, _inGivenOut()
// * Added swap fee at very last line
/**********************************************************************************************
    // inGivenOut token x for y - polynomial equation to solve                                   //
    // ax = amount in to calculate                                                               //
    // bx = balance token in                                                                     //
    // x = bx + ax                                                                               //
    // D = invariant                               D                     D^(n+1)                 //
    // A = amplifier               x^2 + ( S - ----------  - 1) * x -  ------------- = 0         //
    // n = number of tokens                    (A * n^n)               A * n^2n * P              //
    // S = sum of final balances but x                                                           //
    // P = product of final balances but x                                                       //
    **********************************************************************************************/
function _tokenInForExactTokenOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    let tokenAmountOut = amount;
    //Invariant is rounded up
    let inv = _invariant(amp, balances);
    let p = inv;
    let sum = bmath_1.ZERO;
    let totalCoins = bmath_1.bnum(balances.length);
    let n_pow_n = bmath_1.ONE;
    let x = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        n_pow_n = n_pow_n.times(totalCoins);
        if (i == tokenIndexOut) {
            x = balances[i].minus(tokenAmountOut);
        } else if (i != tokenIndexIn) {
            x = balances[i];
        } else {
            continue;
        }
        sum = sum.plus(x);
        //Round up p
        p = p.times(inv).div(x);
    }
    //Calculate in balance
    let y = _solveAnalyticalBalance(sum, inv, amp, n_pow_n, p);
    //Result is rounded up
    return y.minus(balances[tokenIndexIn]).div(bmath_1.ONE.minus(swapFee));
}
exports._tokenInForExactTokenOut = _tokenInForExactTokenOut;
//This function calculates the balance of a given token (tokenIndex)
// given all the other balances and the invariant
function _getTokenBalanceGivenInvariantAndAllOtherBalances(
    amp,
    balances,
    inv,
    tokenIndex
) {
    let p = inv;
    let sum = bmath_1.ZERO;
    let totalCoins = balances.length;
    let nPowN = bmath_1.ONE;
    let x = bmath_1.ZERO;
    for (let i = 0; i < totalCoins; i++) {
        nPowN = nPowN.times(totalCoins);
        if (i != tokenIndex) {
            x = balances[i];
        } else {
            continue;
        }
        sum = sum.plus(x);
        //Round up p
        p = p.times(inv).div(x);
    }
    // Calculate token balance
    return _solveAnalyticalBalance(sum, inv, amp, nPowN, p);
}
//This function calcuates the analytical solution to find the balance required
function _solveAnalyticalBalance(sum, inv, amp, n_pow_n, p) {
    //Round up p
    p = p.times(inv).div(amp.times(n_pow_n).times(n_pow_n));
    //Round down b
    let b = sum.plus(inv.div(amp.times(n_pow_n)));
    //Round up c
    // let c = inv >= b
    //     ? inv.minus(b).plus(Math.sqrtUp(inv.minus(b).times(inv.minus(b)).plus(p.times(4))))
    //     : Math.sqrtUp(b.minus(inv).times(b.minus(inv)).plus(p.times(4))).minus(b.minus(inv));
    let c;
    if (inv.gte(b)) {
        c = inv.minus(b).plus(
            inv
                .minus(b)
                .times(inv.minus(b))
                .plus(p.times(4))
                .sqrt()
        );
    } else {
        c = b
            .minus(inv)
            .times(b.minus(inv))
            .plus(p.times(4))
            .sqrt()
            .minus(b.minus(inv));
    }
    //Round up y
    return c.div(2);
}
exports._solveAnalyticalBalance = _solveAnalyticalBalance;
/*
Adapted from StableMath.sol _exactTokensInForBPTOut()
    * renamed it to _exactTokenInForBPTOut (i.e. just one token in)
*/
function _exactTokenInForBPTOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let tokenAmountIn = amount;
    // Get current invariant
    let currentInvariant = _invariant(amp, balances);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weights of each token relative to the sum of all balances
    let sumBalances = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = sumBalances.plus(balances[i]);
    }
    // Calculate the weighted balance ratio without considering fees
    let currentWeight = balances[tokenIndexIn].div(sumBalances);
    let tokenBalanceRatioWithoutFee = balances[tokenIndexIn]
        .plus(tokenAmountIn)
        .div(balances[tokenIndexIn]);
    let weightedBalanceRatio = bmath_1.ONE.plus(
        tokenBalanceRatioWithoutFee.minus(bmath_1.ONE).times(currentWeight)
    );
    // calculate new amountIn taking into account the fee on the % excess
    // Percentage of the amount supplied that will be implicitly swapped for other tokens in the pool
    let tokenBalancePercentageExcess = tokenBalanceRatioWithoutFee
        .minus(weightedBalanceRatio)
        .div(tokenBalanceRatioWithoutFee.minus(bmath_1.ONE));
    let amountInAfterFee = tokenAmountIn.times(
        bmath_1.ONE.minus(swapFee.times(tokenBalancePercentageExcess))
    );
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(amountInAfterFee);
    // get new invariant taking into account swap fees
    let newInvariant = _invariant(amp, balances);
    return balanceOut.times(
        newInvariant.div(currentInvariant).minus(bmath_1.ONE)
    );
}
exports._exactTokenInForBPTOut = _exactTokenInForBPTOut;
/*
Flow of calculations:
amountBPTOut -> newInvariant -> (amountInProportional, amountInAfterFee) ->
amountInPercentageExcess -> amountIn
*/
function _tokenInForExactBPTOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let bptAmountOut = amount;
    /**********************************************************************************************
    // TODO description                            //
    **********************************************************************************************/
    // Get current invariant
    let currentInvariant = _invariant(amp, balances);
    // Calculate new invariant
    let newInvariant = balanceOut
        .plus(bptAmountOut)
        .div(balanceOut)
        .times(currentInvariant);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weight of token
    let sumBalances = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = sumBalances.plus(balances[i]);
    }
    // get amountInAfterFee
    let newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amp,
        balances,
        newInvariant,
        tokenIndexIn
    );
    let amountInAfterFee = newBalanceTokenIndex.minus(balances[tokenIndexIn]);
    // Get tokenBalancePercentageExcess
    let currentWeight = balances[tokenIndexIn].div(sumBalances);
    let tokenBalancePercentageExcess = bmath_1.ONE.minus(currentWeight);
    // return amountIn
    return amountInAfterFee.div(
        bmath_1.ONE.minus(tokenBalancePercentageExcess.times(swapFee))
    );
}
exports._tokenInForExactBPTOut = _tokenInForExactBPTOut;
/*
Adapted from StableMath.sol _BPTInForExactTokensOut() to reduce it to
_BPTInForExactTokenOut (i.e. just one token out)
*/
function _BPTInForExactTokenOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let tokenAmountOut = amount;
    // Get current invariant
    let currentInvariant = _invariant(amp, balances);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weights of each token relative to the sum of all balances
    let sumBalances = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = sumBalances.plus(balances[i]);
    }
    // Calculate the weighted balance ratio without considering fees
    let currentWeight = balances[tokenIndexOut].div(sumBalances);
    let tokenBalanceRatioWithoutFee = balances[tokenIndexOut]
        .minus(tokenAmountOut)
        .div(balances[tokenIndexOut]);
    let weightedBalanceRatio = bmath_1.ONE.minus(
        bmath_1.ONE.minus(tokenBalanceRatioWithoutFee).times(currentWeight)
    );
    // calculate new amounts in taking into account the fee on the % excess
    let tokenBalancePercentageExcess = weightedBalanceRatio
        .minus(tokenBalanceRatioWithoutFee)
        .div(bmath_1.ONE.minus(tokenBalanceRatioWithoutFee));
    let amountOutBeforeFee = tokenAmountOut.div(
        bmath_1.ONE.minus(swapFee.times(tokenBalancePercentageExcess))
    );
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(amountOutBeforeFee);
    // get new invariant taking into account swap fees
    let newInvariant = _invariant(amp, balances);
    // return amountBPTIn
    return balanceIn.times(
        bmath_1.ONE.minus(newInvariant.div(currentInvariant))
    );
}
exports._BPTInForExactTokenOut = _BPTInForExactTokenOut;
/*
Flow of calculations:
amountBPTin -> newInvariant -> (amountOutProportional, amountOutBeforeFee) ->
amountOutPercentageExcess -> amountOut
*/
function _exactBPTInForTokenOut(amount, poolPairData) {
    // The formula below returns some dust (due to rounding errors) but when
    // we input zero the output should be zero
    if (amount.isZero()) return amount;
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let bptAmountIn = amount;
    /**********************************************************************************************
    // TODO description                            //
    **********************************************************************************************/
    // Get current invariant
    let currentInvariant = _invariant(amp, balances);
    // Calculate new invariant
    let newInvariant = balanceIn
        .minus(bptAmountIn)
        .div(balanceIn)
        .times(currentInvariant);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weight of token
    let sumBalances = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = sumBalances.plus(balances[i]);
    }
    // get amountOutBeforeFee
    let newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amp,
        balances,
        newInvariant,
        tokenIndexOut
    );
    let amountOutBeforeFee = balances[tokenIndexOut].minus(
        newBalanceTokenIndex
    );
    // Calculate tokenBalancePercentageExcess
    let currentWeight = balances[tokenIndexOut].div(sumBalances);
    let tokenBalancePercentageExcess = bmath_1.ONE.minus(currentWeight);
    // return amountOut
    return amountOutBeforeFee.times(
        bmath_1.ONE.minus(tokenBalancePercentageExcess.times(swapFee))
    );
}
exports._exactBPTInForTokenOut = _exactBPTInForTokenOut;
//////////////////////
////  These functions have been added exclusively for the SORv2
//////////////////////
function _poolDerivatives(
    amp,
    balances,
    tokenIndexIn,
    tokenIndexOut,
    is_first_derivative,
    wrt_out
) {
    let totalCoins = balances.length;
    let D = _invariant(amp, balances);
    let S = bmath_1.ZERO;
    for (let i = 0; i < totalCoins; i++) {
        if (i != tokenIndexIn && i != tokenIndexOut) {
            S = S.plus(balances[i]);
        }
    }
    let x = balances[tokenIndexIn];
    let y = balances[tokenIndexOut];
    let a = amp.times(Math.pow(totalCoins, totalCoins)); // = ampTimesNpowN
    let b = S.minus(D)
        .times(a)
        .plus(D);
    let twoaxy = bmath_1
        .bnum(2)
        .times(a)
        .times(x)
        .times(y);
    let partial_x = twoaxy.plus(a.times(y).times(y)).plus(b.times(y));
    let partial_y = twoaxy.plus(a.times(x).times(x)).plus(b.times(x));
    let ans;
    if (is_first_derivative) {
        ans = partial_x.div(partial_y);
    } else {
        let partial_xx = bmath_1
            .bnum(2)
            .times(a)
            .times(y);
        let partial_yy = bmath_1
            .bnum(2)
            .times(a)
            .times(x);
        let partial_xy = partial_xx.plus(partial_yy).plus(b);
        let numerator;
        numerator = bmath_1
            .bnum(2)
            .times(partial_x)
            .times(partial_y)
            .times(partial_xy)
            .minus(partial_xx.times(partial_y.pow(2)))
            .minus(partial_yy.times(partial_x.pow(2)));
        let denominator = partial_x.pow(2).times(partial_y);
        ans = numerator.div(denominator);
        if (wrt_out) {
            ans = ans.times(partial_y).div(partial_x);
        }
    }
    return ans;
}
exports._poolDerivatives = _poolDerivatives;
function _poolDerivativesBPT(
    amp,
    balances,
    bptSupply,
    tokenIndexIn,
    is_first_derivative,
    is_BPT_out,
    wrt_out
) {
    let totalCoins = balances.length;
    let D = _invariant(amp, balances);
    let S = bmath_1.ZERO;
    let D_P = D.div(totalCoins);
    for (let i = 0; i < totalCoins; i++) {
        if (i != tokenIndexIn) {
            S = S.plus(balances[i]);
            D_P = D_P.times(D).div(totalCoins * balances[i]);
        }
    }
    let x = balances[tokenIndexIn];
    let alpha = amp.times(Math.pow(totalCoins, totalCoins)); // = ampTimesNpowN
    let beta = alpha.times(S);
    let gamma = bmath_1.ONE.minus(alpha);
    let partial_x = bmath_1
        .bnum(2)
        .times(alpha)
        .times(x)
        .plus(beta)
        .plus(gamma.times(D));
    let minus_partial_D = D_P.times(totalCoins + 1).minus(gamma.times(x));
    let partial_D = bmath_1.ZERO.minus(minus_partial_D);
    let ans;
    if (is_first_derivative) {
        ans = partial_x
            .div(minus_partial_D)
            .times(bptSupply)
            .div(D);
    } else {
        let partial_xx = bmath_1.bnum(2).times(alpha);
        let partial_xD = gamma;
        let n_times_nplusone = totalCoins * (totalCoins + 1);
        let partial_DD = bmath_1.ZERO.minus(D_P.times(n_times_nplusone).div(D));
        if (is_BPT_out) {
            let term1 = partial_xx.times(partial_D).div(partial_x.pow(2));
            let term2 = bmath_1
                .bnum(2)
                .times(partial_xD)
                .div(partial_x);
            let term3 = partial_DD.div(partial_D);
            ans = term1
                .minus(term2)
                .plus(term3)
                .times(D)
                .div(bptSupply);
            if (wrt_out) {
                let D_prime = bmath_1.ZERO.minus(partial_x.div(partial_D));
                ans = ans
                    .div(D_prime)
                    .times(D)
                    .div(bptSupply);
            }
        } else {
            ans = bmath_1
                .bnum(2)
                .times(partial_xD)
                .div(partial_D)
                .minus(partial_DD.times(partial_x).div(partial_D.pow(2)))
                .minus(partial_xx.div(partial_x));
            if (wrt_out) {
                ans = ans
                    .times(partial_x)
                    .div(minus_partial_D)
                    .times(bptSupply)
                    .div(D);
            }
        }
    }
    return ans;
}
exports._poolDerivativesBPT = _poolDerivativesBPT;
/////////
/// SpotPriceAfterSwap
/////////
// PairType = 'token->token'
// SwapType = 'swapExactIn'
function _spotPriceAfterSwapExactTokenInForTokenOut(amount, poolPairData) {
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(
        amount.times(bmath_1.ONE.minus(swapFee))
    );
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        _exactTokenInForTokenOut(amount, poolPairData)
    );
    let ans = _poolDerivatives(
        amp,
        balances,
        tokenIndexIn,
        tokenIndexOut,
        true,
        false
    );
    ans = bmath_1.ONE.div(ans.times(bmath_1.ONE.minus(swapFee)));
    return ans;
}
exports._spotPriceAfterSwapExactTokenInForTokenOut = _spotPriceAfterSwapExactTokenInForTokenOut;
// PairType = 'token->token'
// SwapType = 'swapExactOut'
function _spotPriceAfterSwapTokenInForExactTokenOut(amount, poolPairData) {
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    let _in = _tokenInForExactTokenOut(amount, poolPairData).times(
        bmath_1.ONE.minus(swapFee)
    );
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(_in);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(amount);
    let ans = _poolDerivatives(
        amp,
        balances,
        tokenIndexIn,
        tokenIndexOut,
        true,
        true
    );
    ans = bmath_1.ONE.div(ans.times(bmath_1.ONE.minus(swapFee)));
    return ans;
}
exports._spotPriceAfterSwapTokenInForExactTokenOut = _spotPriceAfterSwapTokenInForExactTokenOut;
function _feeFactor(balances, tokenIndex, swapFee) {
    let sumBalances = bmath_1.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = sumBalances.plus(balances[i]);
    }
    let currentWeight = balances[tokenIndex].div(sumBalances);
    let tokenBalancePercentageExcess = bmath_1.ONE.minus(currentWeight);
    return bmath_1.ONE.minus(tokenBalancePercentageExcess.times(swapFee));
}
// PairType = 'token->BPT'
// SwapType = 'swapExactIn'
function _spotPriceAfterSwapExactTokenInForBPTOut(amount, poolPairData) {
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let feeFactor = _feeFactor(balances, tokenIndexIn, swapFee);
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(
        amount.times(feeFactor)
    );
    balanceOut = balanceOut.plus(_exactTokenInForBPTOut(amount, poolPairData));
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceOut,
        tokenIndexIn,
        true,
        true,
        false
    );
    ans = bmath_1.ONE.div(ans.times(feeFactor));
    return ans;
}
exports._spotPriceAfterSwapExactTokenInForBPTOut = _spotPriceAfterSwapExactTokenInForBPTOut;
// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
function _spotPriceAfterSwapTokenInForExactBPTOut(amount, poolPairData) {
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let _in = _tokenInForExactBPTOut(amount, poolPairData);
    let feeFactor = _feeFactor(balances, tokenIndexIn, swapFee);
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(_in.times(feeFactor));
    balanceOut = balanceOut.plus(amount);
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceOut,
        tokenIndexIn,
        true,
        true,
        true
    );
    ans = bmath_1.ONE.div(ans.times(feeFactor));
    return ans;
}
exports._spotPriceAfterSwapTokenInForExactBPTOut = _spotPriceAfterSwapTokenInForExactBPTOut;
// PairType = 'BPT->token'
// SwapType = 'swapExactIn'
function _spotPriceAfterSwapExactBPTInForTokenOut(amount, poolPairData) {
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let _out = _exactBPTInForTokenOut(amount, poolPairData);
    let feeFactor = _feeFactor(balances, tokenIndexOut, swapFee);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        _out.div(feeFactor)
    );
    balanceIn = balanceIn.minus(amount);
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceIn,
        tokenIndexOut,
        true,
        false,
        false
    ).div(feeFactor);
    return ans;
}
exports._spotPriceAfterSwapExactBPTInForTokenOut = _spotPriceAfterSwapExactBPTInForTokenOut;
// PairType = 'BPT->token'
// SwapType = 'swapExactOut'
function _spotPriceAfterSwapBPTInForExactTokenOut(amount, poolPairData) {
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let feeFactor = _feeFactor(balances, tokenIndexOut, swapFee);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        amount.div(feeFactor)
    );
    balanceIn = balanceIn.minus(_BPTInForExactTokenOut(amount, poolPairData));
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceIn,
        tokenIndexOut,
        true,
        false,
        true
    ).div(feeFactor);
    return ans;
}
exports._spotPriceAfterSwapBPTInForExactTokenOut = _spotPriceAfterSwapBPTInForExactTokenOut;
/////////
///  Derivatives of spotPriceAfterSwap
/////////
// PairType = 'token->token'
// SwapType = 'swapExactIn'
function _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(
    amount,
    poolPairData
) {
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(
        amount.times(bmath_1.ONE.minus(swapFee))
    );
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        _exactTokenInForTokenOut(amount, poolPairData)
    );
    return _poolDerivatives(
        amp,
        balances,
        tokenIndexIn,
        tokenIndexOut,
        false,
        false
    );
}
exports._derivativeSpotPriceAfterSwapExactTokenInForTokenOut = _derivativeSpotPriceAfterSwapExactTokenInForTokenOut;
// PairType = 'token->token'
// SwapType = 'swapExactOut'
function _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(
    amount,
    poolPairData
) {
    let {
        amp,
        allBalances,
        tokenIndexIn,
        tokenIndexOut,
        swapFee,
    } = poolPairData;
    let balances = [...allBalances];
    let _in = _tokenInForExactTokenOut(amount, poolPairData).times(
        bmath_1.ONE.minus(swapFee)
    );
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(_in);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(amount);
    let feeFactor = bmath_1.ONE.minus(swapFee);
    return _poolDerivatives(
        amp,
        balances,
        tokenIndexIn,
        tokenIndexOut,
        false,
        true
    ).div(feeFactor);
}
exports._derivativeSpotPriceAfterSwapTokenInForExactTokenOut = _derivativeSpotPriceAfterSwapTokenInForExactTokenOut;
// PairType = 'token->BPT'
// SwapType = 'swapExactIn'
function _derivativeSpotPriceAfterSwapExactTokenInForBPTOut(
    amount,
    poolPairData
) {
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let feeFactor = _feeFactor(balances, tokenIndexIn, swapFee);
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(
        amount.times(feeFactor)
    );
    balanceOut = balanceOut.plus(_exactTokenInForBPTOut(amount, poolPairData));
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceOut,
        tokenIndexIn,
        false,
        true,
        false
    );
    return ans;
}
exports._derivativeSpotPriceAfterSwapExactTokenInForBPTOut = _derivativeSpotPriceAfterSwapExactTokenInForBPTOut;
// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
function _derivativeSpotPriceAfterSwapTokenInForExactBPTOut(
    amount,
    poolPairData
) {
    let { amp, allBalances, balanceOut, tokenIndexIn, swapFee } = poolPairData;
    let balances = [...allBalances];
    let _in = _tokenInForExactBPTOut(amount, poolPairData);
    let feeFactor = _feeFactor(balances, tokenIndexIn, swapFee);
    balances[tokenIndexIn] = balances[tokenIndexIn].plus(_in.times(feeFactor));
    balanceOut = balanceOut.plus(amount);
    return _poolDerivativesBPT(
        amp,
        balances,
        balanceOut,
        tokenIndexIn,
        false,
        true,
        true
    ).div(feeFactor);
}
exports._derivativeSpotPriceAfterSwapTokenInForExactBPTOut = _derivativeSpotPriceAfterSwapTokenInForExactBPTOut;
// PairType = 'BPT->token'
// SwapType = 'swapExactIn'
function _derivativeSpotPriceAfterSwapExactBPTInForTokenOut(
    amount,
    poolPairData
) {
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let _out = _exactBPTInForTokenOut(amount, poolPairData);
    let feeFactor = _feeFactor(balances, tokenIndexOut, swapFee);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        _out.div(feeFactor)
    );
    balanceIn = balanceIn.minus(amount);
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceIn,
        tokenIndexOut,
        false,
        false,
        false
    );
    return ans.div(feeFactor);
}
exports._derivativeSpotPriceAfterSwapExactBPTInForTokenOut = _derivativeSpotPriceAfterSwapExactBPTInForTokenOut;
// PairType = 'BPT->token'
// SwapType = 'swapExactOut'
function _derivativeSpotPriceAfterSwapBPTInForExactTokenOut(
    amount,
    poolPairData
) {
    let { amp, allBalances, balanceIn, tokenIndexOut, swapFee } = poolPairData;
    let balances = [...allBalances];
    let _in = _BPTInForExactTokenOut(amount, poolPairData);
    let feeFactor = _feeFactor(balances, tokenIndexOut, swapFee);
    balances[tokenIndexOut] = balances[tokenIndexOut].minus(
        amount.div(feeFactor)
    );
    balanceIn = balanceIn.minus(_in);
    let ans = _poolDerivativesBPT(
        amp,
        balances,
        balanceIn,
        tokenIndexOut,
        false,
        false,
        true
    );
    return ans.div(feeFactor.pow(2));
}
exports._derivativeSpotPriceAfterSwapBPTInForExactTokenOut = _derivativeSpotPriceAfterSwapBPTInForExactTokenOut;
