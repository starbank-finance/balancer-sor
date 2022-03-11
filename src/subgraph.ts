import fetch from 'isomorphic-fetch';

const SUBGRAPH_URL =
    process.env.SUBGRAPH_URL ||
    // 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2';
    'https://graph-node1.starbank.finance/subgraphs/name/starbank-finance/balancer-v2';

// Returns all public pools
export async function fetchSubgraphPools(SubgraphUrl: string = '') {
    console.log(`@@fetchSubgraphPools.SubgraphUrl=`, SubgraphUrl);
    // if (SubgraphUrl.endsWith('.json')) {
    if (SubgraphUrl.indexOf('.json') != -1) {
        console.log(`@@fetchSubgraphPools.GET`);
        const response = await fetch(
            SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );

        const { data } = await response.json();

        return { pools: data.pools };
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
    const response = await fetch(
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

    const { data } = await response.json();

    return { pools: data.pools };
}
