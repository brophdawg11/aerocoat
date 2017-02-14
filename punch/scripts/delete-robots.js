var fs = require('fs-extra'),
    path = require('path');

fs.removeSync(path.join('output', 'robots.txt'));
