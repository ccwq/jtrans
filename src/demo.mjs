alert();

!async function(){
    await new Promise(r => setTimeout(r, 10));

    alert();


    let vueTpls;
    vueTpls = {template:`{pug[
        div
            p
                img
            table
            b 你好
    ]pug}`}
    vueTpls = {
        template:`{pug[./xxdemo.pug]pug}`
    }


    alert(vueTpls);

}();