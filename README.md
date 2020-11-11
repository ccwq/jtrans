##  jtrans

前端开发环境

---

-   编译es6789到es5

    -   支持async/await
    
    -   支持class属性定义
    
    -   支持可选链
    
    -   私有特性,自动编译js中{pug[...]pug}的pug代码为html
        
        ```js
        
        //foo.js
        let template;
        
        template="{pug[div: img]pug}`"
        //template="<div><img/></div>" 
        
        template="{pug[$foo.pug]pug}`"
        //foo.pug中的内容为"div: img"
        //template="<div><img/></div>" 

        
        //以上语句等价于
        template="{pug[]pug}`"
        
        //使用绝对位置置入pug
        template="{pug[/src/$foo.pug]pug}`"
        
        ```

-   编译less到css


-   pug到html


---

安装

```
npm install jtrans

```
或者
```
yarn add jtrans
```
全局安装
```
npm install -g jtrans

```

使用
```
jtrans dev

```

所有配置

```bash
jtrans dev

jtrans watch


# 所有配置

jtrans build --src=src --dist=dist --build-clean --disabled-treeshake --port=4560 --src-base=src


```