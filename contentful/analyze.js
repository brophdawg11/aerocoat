const utils = require('./utils'),
    globalData = utils.getGlobalData(),
    _ = require('lodash');

console.log('Got products', globalData.products.length);
console.log('Got components', globalData.components.length);
console.log('Got sub groups', globalData.subGroups.length);
console.log('Got page groupings', globalData.pageGroupings.length);
console.log('Got piFiles', globalData.piFiles.length);
console.log('Got msdsFiles', globalData.msdsFiles.length);

const fileSizes = _([ globalData.piFiles, globalData.msdsFiles ])
             .flatten()
             .map(utils.getFileSize)
             .reduce(utils.sum, 0);

console.log('Total file sizes', fileSizes);
