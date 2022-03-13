'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
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
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.fetchSubgraphPools = void 0;
const isomorphic_fetch_1 = __importDefault(require('isomorphic-fetch'));
const SUBGRAPH_URL =
    process.env.SUBGRAPH_URL ||
    // 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2';
    'https://graph-node1.starbank.finance/subgraphs/name/starbank-finance/balancer-v2';
// Returns all public pools
function fetchSubgraphPools(SubgraphUrl = '') {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`@@@@fetchSubgraphPools.SubgraphUrl=`, SubgraphUrl);
        // if (SubgraphUrl.endsWith('.json')) {
        if (SubgraphUrl.indexOf('.json') !== -1) {
            console.log(`@@@@fetchSubgraphPools.GET`);
            const response = yield isomorphic_fetch_1.default(
                SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        // 'Content-Type': 'application/json',
                    },
                }
            );
            console.log(`@@fetchSubgraphPools.response = `, response);
            const data = yield response.json();
            // console.log(`@@fetchSubgraphPools.data = `, data);
            return data;
            // return { pools: data.pools };
        }
        const query = `
      {
        pools: pools(first: 1000) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
            priceRate
          }
          tokensList
          totalWeight
          amp
          expiryTime
          unitSeconds
          principalToken
          baseToken
          swapEnabled
        }
      }
    `;
        console.log(
            `fetchSubgraphPools2: ${
                SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl
            }`
        );
        const response = yield isomorphic_fetch_1.default(
            SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                }),
            }
        );
        const { data } = yield response.json();
        return { pools: data.pools };
    });
}
exports.fetchSubgraphPools = fetchSubgraphPools;
