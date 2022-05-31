import * as linear from '../src/pools/linearPool/linearMath';
import { MathSol } from '../src/utils/basicOperations';
import { assert } from 'chai';

describe('poolsMathLinear', function () {
    // For swap outcome functions:
    // Test cases copied from smart contract tests, therefore rate is always 1.
    // But we should also test different rates.
    describe('init', () => {
        const params = {
            fee: s(0.01),
            rate: s(1),
            lowerTarget: s(0),
            upperTarget: s(200),
        };

        const mainBalance = s(0);
        const wrappedBalance = s(0);
        const bptSupply = s(0);

        it('given main in within lower and upper', async () => {
            const mainIn = s(5);
            const result = linear._calcBptOutPerMainIn(
                mainIn,
                mainBalance,
                wrappedBalance,
                bptSupply,
                params
            );
            verify(result, s(5), 0);
        });

        it('given main in over upper', async () => {
            const mainIn = s(400);
            const result = linear._calcBptOutPerMainIn(
                mainIn,
                mainBalance,
                wrappedBalance,
                bptSupply,
                params
            );
            verify(result, s(398), 0);
        });
    });

    const params = {
        fee: s(0.01),
        rate: s(1),
        lowerTarget: s(100),
        upperTarget: s(200),
    };

    context('with main below lower', () => {
        const mainBalance = s(35);
        const wrappedBalance = s(15.15);
        const bptSupply = s(49.5);

        context('swap bpt & main', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(100);
                    const result = linear._calcBptOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100.65), 0);
                });

                it('given BPT out', async () => {
                    const bptOut = s(100.65);
                    const result = linear._calcMainInPerBptOut(
                        bptOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100), 0);
                });
            });

            context('main out', () => {
                it('given BPT in', async () => {
                    const bptIn = s(10.1);
                    const result = linear._calcMainOutPerBptIn(
                        bptIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10), 0);
                });

                it('given main out', async () => {
                    const mainOut = s(10);
                    const result = linear._calcBptInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10.1), 0);
                });
            });
        });

        describe('swap main & wrapped', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(10);

                    const result = linear._calcWrappedOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10.1), 0);
                });

                it('given wrapped out', async () => {
                    const wrappedOut = s(10.1);
                    const result = linear._calcMainInPerWrappedOut(
                        wrappedOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10), 0);
                });
            });

            context('main out', () => {
                it('given main out', async () => {
                    const mainOut = s(10);
                    const result = linear._calcWrappedInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10.1), 0);
                });

                it('given wrapped in', async () => {
                    const wrappedIn = s(10.1);
                    const result = linear._calcMainOutPerWrappedIn(
                        wrappedIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(10), 0);
                });
            });
        });

        describe('swap bpt & wrapped', () => {
            it('given wrapped in', async () => {
                const wrappedIn = s(5);
                const result = linear._calcBptOutPerWrappedIn(
                    wrappedIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT out', async () => {
                const bptOut = s(5);
                const result = linear._calcWrappedInPerBptOut(
                    bptOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT in', async () => {
                const bptIn = s(5);
                const result = linear._calcWrappedOutPerBptIn(
                    bptIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given wrapped out', async () => {
                const wrappedOut = s(5);
                const result = linear._calcBptInPerWrappedOut(
                    wrappedOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });
        });
    });

    context('with main within lower and upper', () => {
        const mainBalance = s(130);
        const wrappedBalance = s(20);
        const bptSupply = s(150);

        context('swap bpt & main', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(100);
                    const result = linear._calcBptOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(99.7), 0);
                });

                it('given BPT out', async () => {
                    const bptOut = s(99.7);
                    const result = linear._calcMainInPerBptOut(
                        bptOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100), 0);
                });
            });

            context('main out', () => {
                it('given BPT in', async () => {
                    const bptIn = s(100.7);
                    const result = linear._calcMainOutPerBptIn(
                        bptIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100), 0);
                });

                it('given main out', async () => {
                    const mainOut = s(100);
                    const result = linear._calcBptInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100.7), 0);
                });
            });
        });

        describe('swap main & wrapped', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(20);
                    const result = linear._calcWrappedOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(20), 0);
                });

                it('given wrapped out', async () => {
                    const wrappedOut = s(20);
                    const result = linear._calcMainInPerWrappedOut(
                        wrappedOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(20), 0);
                });
            });

            context('main out', () => {
                it('given main out', async () => {
                    const mainOut = s(20);
                    const result = linear._calcWrappedInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(20), 0);
                });

                it('given wrapped in', async () => {
                    const wrappedIn = s(20);
                    const result = linear._calcMainOutPerWrappedIn(
                        wrappedIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(20), 0);
                });
            });
        });

        describe('swap bpt & wrapped', () => {
            it('given wrapped in', async () => {
                const wrappedIn = s(5);
                const result = linear._calcBptOutPerWrappedIn(
                    wrappedIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT out', async () => {
                const bptOut = s(5);
                const result = linear._calcWrappedInPerBptOut(
                    bptOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT in', async () => {
                const bptIn = s(5);
                const result = linear._calcWrappedOutPerBptIn(
                    bptIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given wrapped out', async () => {
                const wrappedOut = s(5);
                const result = linear._calcBptInPerWrappedOut(
                    wrappedOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });
        });
    });

    context('with main above upper', () => {
        const mainBalance = s(240);
        const wrappedBalance = s(59.4);
        const bptSupply = s(299);

        context('swap bpt & main', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(100);
                    const result = linear._calcBptOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(99), 0);
                });

                it('given BPT out', async () => {
                    const bptOut = s(99);
                    const result = linear._calcMainInPerBptOut(
                        bptOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100), 0);
                });
            });

            context('main out', () => {
                it('given BPT in', async () => {
                    const bptIn = s(99.6);
                    const result = linear._calcMainOutPerBptIn(
                        bptIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(100), 0);
                });

                it('given main out', async () => {
                    const mainOut = s(100);
                    const result = linear._calcBptInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(99.6), 0);
                });
            });
        });

        describe('swap main & wrapped', () => {
            context('main in', () => {
                it('given main in', async () => {
                    const mainIn = s(50);
                    const result = linear._calcWrappedOutPerMainIn(
                        mainIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(49.5), 0);
                });

                it('given wrapped out', async () => {
                    const wrappedOut = s(49.5);
                    const result = linear._calcMainInPerWrappedOut(
                        wrappedOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(50), 0);
                });
            });

            context('main out', () => {
                it('given main out', async () => {
                    const mainOut = s(55);
                    const result = linear._calcWrappedInPerMainOut(
                        mainOut,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(54.6), 0);
                });

                it('given wrapped in', async () => {
                    const wrappedIn = s(54.6);
                    const result = linear._calcMainOutPerWrappedIn(
                        wrappedIn,
                        mainBalance,
                        wrappedBalance,
                        bptSupply,
                        params
                    );
                    verify(result, s(55), 0);
                });
            });
        });

        describe('swap bpt & wrapped', () => {
            it('given wrapped in', async () => {
                const wrappedIn = s(5);
                const result = linear._calcBptOutPerWrappedIn(
                    wrappedIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT out', async () => {
                const bptOut = s(5);
                const result = linear._calcWrappedInPerBptOut(
                    bptOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given BPT in', async () => {
                const bptIn = s(5);
                const result = linear._calcWrappedOutPerBptIn(
                    bptIn,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });

            it('given wrapped out', async () => {
                const wrappedOut = s(5);
                const result = linear._calcBptInPerWrappedOut(
                    wrappedOut,
                    mainBalance,
                    wrappedBalance,
                    bptSupply,
                    params
                );
                verify(result, s(5), 0);
            });
        });
    });

    describe('spot prices', () => {
        const delta = 0.01;
        const error = 0.00001;
        const params = {
            fee: s(0.04),
            rate: s(1.2),
            lowerTarget: s(1000),
            upperTarget: s(2000),
        };
        const mainBalanceTest = [500, 950, 1050, 1400, 1950, 2050, 8000];
        // main<>bpt
        it('BptOutPerMainIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcBptOutPerMainIn,
                        linear._spotPriceAfterSwapBptOutPerMainIn,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('MainOutPerBptIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcMainOutPerBptIn,
                        linear._spotPriceAfterSwapMainOutPerBptIn,
                        amount,
                        mainBalance,
                        100, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('MainInPerBptOut', () => {
            // missing test case: bptSupply = 0
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    for (const bptSupply of [3500]) {
                        checkDerivative(
                            linear._calcMainInPerBptOut,
                            linear._spotPriceAfterSwapMainInPerBptOut,
                            amount,
                            mainBalance,
                            8000, // wrappedBalance
                            bptSupply,
                            params,
                            delta,
                            error,
                            false
                        );
                    }
                }
            }
        });
        it('BptInPerMainOut', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    if (amount > mainBalance) continue;
                    checkDerivative(
                        linear._calcBptInPerMainOut,
                        linear._spotPriceAfterSwapBptInPerMainOut,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        false
                    );
                }
            }
        });
        // main<>wrapped
        it('WrappedOutPerMainIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcWrappedOutPerMainIn,
                        linear._spotPriceAfterSwapWrappedOutPerMainIn,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('MainOutPerWrappedIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcMainOutPerWrappedIn,
                        linear._spotPriceAfterSwapMainOutPerWrappedIn,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('WrappedInPerMainOut', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    if (amount > mainBalance) continue;
                    checkDerivative(
                        linear._calcWrappedInPerMainOut,
                        linear._spotPriceAfterSwapWrappedInPerMainOut,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        false
                    );
                }
            }
        });
        it('MainInPerWrappedOut', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcMainInPerWrappedOut,
                        linear._spotPriceAfterSwapMainInPerWrappedOut,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        false
                    );
                }
            }
        });
        // bpt<>wrapped
        it('WrappedOutPerBptIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcWrappedOutPerBptIn,
                        linear._spotPriceAfterSwapWrappedOutPerBptIn,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('BptOutPerWrappedIn', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcBptOutPerWrappedIn,
                        linear._spotPriceAfterSwapBptOutPerWrappedIn,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        true
                    );
                }
            }
        });
        it('WrappedInPerBptOut', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    for (const bptSupply of [0, 3500]) {
                        checkDerivative(
                            linear._calcWrappedInPerBptOut,
                            linear._spotPriceAfterSwapWrappedInPerBptOut,
                            amount,
                            mainBalance,
                            8000, // wrappedBalance
                            bptSupply,
                            params,
                            delta,
                            error,
                            false
                        );
                    }
                }
            }
        });
        it('BptInPerWrappedOut', () => {
            for (const mainBalance of mainBalanceTest) {
                for (const amount of [50, 70, 150, 300, 700, 1000, 2000]) {
                    checkDerivative(
                        linear._calcBptInPerWrappedOut,
                        linear._spotPriceAfterSwapBptInPerWrappedOut,
                        amount,
                        mainBalance,
                        8000, // wrappedBalance
                        3500, // bptSupply
                        params,
                        delta,
                        error,
                        false
                    );
                }
            }
        });
    });
});

function s(a: number): bigint {
    return BigInt(a * 10 ** 18);
}

function verify(result: bigint, expected: bigint, error: number): void {
    assert.approximately(
        Number(MathSol.divUpFixed(result, expected)) / 10 ** 18,
        1,
        error,
        'wrong result'
    );
}

function checkDerivative(
    fn: (
        mainIn: bigint,
        mainBalance: bigint,
        wrappedBalance: bigint,
        bptSupply: bigint,
        params: {
            fee: bigint;
            rate: bigint;
            lowerTarget: bigint;
            upperTarget: bigint;
        }
    ) => bigint,
    derivative: (
        mainIn: bigint,
        mainBalance: bigint,
        wrappedBalance: bigint,
        bptSupply: bigint,
        params: {
            fee: bigint;
            rate: bigint;
            lowerTarget: bigint;
            upperTarget: bigint;
        }
    ) => bigint,
    num_amount: number,
    num_mainBalance: number,
    num_wrappedBalance: number,
    num_bptSupply: number,
    params: {
        fee: bigint;
        rate: bigint;
        lowerTarget: bigint;
        upperTarget: bigint;
    },
    num_delta: number,
    num_error: number,
    inverse: boolean
) {
    const amount = s(num_amount);
    const mainBalance = s(num_mainBalance);
    const wrappedBalance = s(num_wrappedBalance);
    const bptSupply = s(num_bptSupply);
    const delta = s(num_delta);
    const error = s(num_error);
    const val1 = fn(
        amount + delta,
        mainBalance,
        wrappedBalance,
        bptSupply,
        params
    );
    const val2 = fn(amount, mainBalance, wrappedBalance, bptSupply, params);
    let incrementalQuotient = MathSol.divUpFixed(
        MathSol.sub(val1, val2),
        delta
    );
    if (inverse)
        incrementalQuotient = MathSol.divUpFixed(
            MathSol.ONE,
            incrementalQuotient
        );
    const der_ans = derivative(
        amount,
        mainBalance,
        wrappedBalance,
        bptSupply,
        params
    );
    assert.approximately(
        Number(MathSol.divUpFixed(incrementalQuotient, der_ans)),
        Number(MathSol.ONE),
        Number(error),
        'wrong result'
    );
}
