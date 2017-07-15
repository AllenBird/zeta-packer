# zeta-packer
zeta-packer-amd
js amd模式打包

## 安装

环境需求：
```
node v4.x.x 
npm  v2.x.x 
python 2.7
```

没有翻墙的情况下换taobao镜像会好一些：
```
npm install cnpm -g --registry=https://registry.npm.taobao.org
```

开始安装：
```
cnpm install -g node-gyp
cnpm install -g zeta-packer-amd 
```

安装完成后可以用一下zeta-packer来管理前端项目：
```
-h, --help              帮助指令
-v, --version           版本信息
-w, --watch             遍地debug版本（缺省）
-b, --build             编译release版本
-l, --lazy              不更新vendor
-f, --file [value]      指定配置文件名（缺省zeta.json）
-r, --renderer          启动仿真渲染进行调试


执行：
zeta-packer -w -r 
启动代码监听，仿真调试
```

```
{
  "rootPath": "public",
  "manifest": "layout.hbs",
  "styles": {
    "distDir": "assets/styles",
    "map": {
      "app.css": "app/{styles,components}/**/*.{css,scss}"
    }
  },
  "scripts": {
    "distDir": "assets/scripts",
    "map": {
      "app.js": "app/{components_vendor,scripts}/**/*.{js,jsx,es6}",
      "*": "app/components/**/*.{js,jsx,es6}",
      "vendor.js": "vendor/*.js"
    },
    "order": [
      "zetabase.js"
    ]
  },
  "views": {
    "distDir": "views",
    "src": [
      "app/views/**/*.hbs"
    ]
  },
  "components": {
    "distDir": "components",
    "src": [
      "app/components/**/*.hbs",
      "app/components_vendor/**/*.hbs"
    ]
  },
  "templates": {
    "distDir": "../vendor",
    "map": {
      "templates.js": "app/{components_vendor,components}/**/templates/**/*.hbs"
    }
  },
  "images": {
    "distDir": "assets/images",
    "escaped": "/assets/images/icons.png",
    "src": [
      "app/images/*.png",
      "app/images/other-images/*.png"
    ]
  },
  "files": {
    "copy": {
      "./": "app/files/**/*",
      "./assets/styles/fonts/": "app/images/fonts/**/*",
      "./assets/images/other-images/": "app/images/other-images/*"
    }
  },
  "renderer": {
    "port": 8080,
    "filesHome": "public",
    "index": "demo"
  },
  "vendor": [
    {
      "name": "zetabase.js",
      "version": "master",
      "url": "E:\\git-zeta\\zeta-base\\public\\assets\\scripts\\zetabase.js"
    },
    {
      "name": "xx.css",
      "version": "master",
      "url": "http://zeta.tesir.top/master/base/assets/styles/theme-geely-winterfell.css"
    }
  ]
}
```
