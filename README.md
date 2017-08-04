# zeta-packer
zeta-packer 是一个前端项目管理工具，集成了雪碧图，源码混淆，组件化，依赖加载等功能，欢迎使用。

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
cnpm install -g zeta-packer 
```

安装完成后可以用一下zeta-packer来管理前端项目：
```
-h, --help              帮助指令
-v, --version           版本信息
-w, --watch             不混淆，监听代码修改（缺省）
-b, --build             带压缩混淆的交付件
-l, --lazy              不更新vendor
-f, --file [value]      指定配置文件名（缺省zeta.json）
-r, --renderer          启动仿真渲染进行调试
-R, --release           release版本编译

执行：
zeta-packer -w -r 
启动代码监听，仿真调试
```


