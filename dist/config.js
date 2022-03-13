'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.INFINITESIMAL =
    exports.PRICE_ERROR_TOLERANCE =
    exports.ALLOW_ADD_REMOVE =
        void 0;
const bignumber_1 = require('./utils/bignumber');
let allowAddRemove = process.env.ALLOW_ADD_REMOVE || false;
if (typeof allowAddRemove === 'string') {
    if (allowAddRemove === 'true' || allowAddRemove === 'True')
        allowAddRemove = true;
    else allowAddRemove = false;
}
exports.ALLOW_ADD_REMOVE = allowAddRemove;
// priceErrorTolerance is how close we expect prices after swap to be in SOR
// suggested paths
const priceErrorTolerance = process.env.PRICE_ERROR_TOLERANCE || '0.00001';
exports.PRICE_ERROR_TOLERANCE = new bignumber_1.BigNumber(priceErrorTolerance);
// infinitesimal is an amount that's used to initialize swap amounts so they are
// not zero or the path's limit.
// It's also used in the calculation of derivatives in pool maths
// const infinitesimal: string = process.env.INFINITESIMAL || '0.000001';
const infinitesimal = '0.01'; // Increasing INFINITESIMAL to '0.01' to test derivative sensitivity
exports.INFINITESIMAL = new bignumber_1.BigNumber(infinitesimal);
