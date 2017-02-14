var fs = require('fs-extra'),
    path = require('path');

fs.copySync('test-robots.txt', path.join('output', 'robots.txt'));
