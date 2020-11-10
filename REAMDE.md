##  jtrans

前端开发环境

-   编译es6789到es5
    -   自动编译js中{pug[...]pug}的pug代码为html
        
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