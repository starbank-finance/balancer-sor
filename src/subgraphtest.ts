import { fetchSubgraphPools } from './subgraph';

fetchSubgraphPools(
    'https://deoz8oth3wbp6.cloudfront.net/poolsV2.json?timestamp=1646959988936'
).then(ret => {
    console.log(ret);
});
