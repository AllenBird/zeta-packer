  vendor = require('../lib/vendor')
  vendor.get('test', 
    [{
      "name": "../app/components_vendor/common",
      "version": "master",
      "url": "http://zeta.tesir.top/master/cma-zeta-component/public/components-vendor.tar.gz"
    }], function () {
    console.log('zip over')
  })
