'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const subgraph_1 = require('./subgraph');
subgraph_1
    .fetchSubgraphPools(
        'https://deoz8oth3wbp6.cloudfront.net/poolsV2.json?timestamp=1646959988936'
    )
    .then((ret) => {
        console.log(ret);
    });
