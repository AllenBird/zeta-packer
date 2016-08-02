# zeta-packer
packer

## 安装

环境需求：
```
node v4.x.x （其实低了也无妨）
npm  v2.x.x （其实低了也无妨）
python 2.7
```

windows下根据提示装一下：
```

```

没有翻墙的情况下换taobao镜像会好一些：
```
npm config set registry https://registry.npm.taobao.org
```

开始安装：
```
npm install -g node-gyp
npm install -g zeta-packer 
```

命令行：
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


