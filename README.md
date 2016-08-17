# zeta-packer
zeta-packer 是一个前端项目管理工具，集成了雪碧图，源码混淆，组件化，依赖加载等功能，欢迎使用。

## 安装

环境需求：
```
node v4.x.x （其实低了也无妨）
npm  v2.x.x （其实低了也无妨）
python 2.7
```

没有翻墙的情况下换taobao镜像会好一些：
```
npm install cnpm -g --registry=https://registry.npm.taobao.org
```

开始安装：
```
cnpm install -g node-gyp
cnpm install -g zeta-packer 
```

安装完成后可以用一下zeta-packer来管理前端项目：
```
-h, --help              帮助指令
-v, --version           版本信息
-w, --watch             遍地debug版本（缺省）
-b, --build             编译release版本
-l, --lazy              不更新vendor
-f, --file [value]      指定配置文件名（缺省zeta.json）

执行：
zeta-packer -w -f config.json  
```


