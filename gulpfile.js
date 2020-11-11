// 加载gulp
const gulp = require('gulp');
const zip = require('gulp-zip');
const gulpClean = require('gulp-clean');
const watch = require('gulp-watch');
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel')
const _ = require("lodash");

const rollupResolve = require("@rollup/plugin-node-resolve").default;
const rollupCommonjs = require("@rollup/plugin-commonjs");
const rollupPostcss = require("rollup-plugin-postcss");

const trim = function(string){
    return (string + "").replace(/(^\s+)|(\s+$)/, "");
}

//js压缩和sourcemap
var sourcemaps = require('gulp-sourcemaps');

const chalk = require('chalk');

//缓存
//https://github.com/gulp-community/gulp-cached
const cache = require('gulp-cached');

//内容替换
const replaceContent = require('./build/gulp-replace-x');


//加载gulp-load-plugins插件，并马上运行它
const plugins = require('gulp-load-plugins')();

const filterSize = require('gulp-filter-size');
const fileinfo = require('gulp-fileinfo');

const rename = require('gulp-rename');
const path = require("path");

//是否是开发模式
const isDev = process.env.NODE_ENV != "production";



module.exports = {

    /**
     * 开始创建任务
     */
    createTask(outOptions){
        const replaceContentOptions = {
            logs:{
                enabled:false
            }
        }

        const options = _.merge({}, {

            __cwd:__dirname,

            //端口
            port: 3562,


            //源
            src: "src",

            //目标
            dist: "dist",

            //build之前是否清空
            buildClean:false,

            //true会删除未引用的js，导致文件体积增大好多
            treeShake: true,


            //禁止treeShake 代替treeShake=false
            disabledTreeShake: false,

            //作用同上
            disabledTreeshake: false,


            //请查看glup的文档gulp.src(src,option)
            gulpSrcOptions:{
                base:"--"
            },

            //编译到dist的路径去除路径前缀
            //请查看glup的文档gulp.src(src,option) option.base
            srcBase:"--"

        }, outOptions);


        const resolvePath = function(_path){
            return path.join(options.__cwd, _path);
        }


        //参数矫正
        if (options.disabledTreeShake || options.disabledTreeshake) {
            options.treeShake = false;
        }

        if (options.srcBase !== "--") {
            options.gulpSrcOptions.base = srcBase;
        }

        if (options.gulpSrcOptions.base == "--") {
            options.gulpSrcOptions.base = options.src;
        }

        const SRC_DIR = (options.src + "/").replace(/\/\/$/, "/");
        const DIST_DIR = options.dist;

        //其他类型的文件范式
        const OTHER_FILE_SRC = [
            `${SRC_DIR}/**/*.!(mjs|less|pug|es|*.pug)`,
            //`public/**`,
        ]

        //目录内部文件不进行编译
        const golbForLess = [`${SRC_DIR}**/!($*).less`];
        const golbForAllLess = [`${SRC_DIR}**/*.less`];

        const golbForPug  = [`${SRC_DIR}**/!($*).pug`];
        const golbForAllPug  = [`${SRC_DIR}**/*.pug`];

        const golbForEs  =  [`${SRC_DIR}**/!($*).?(es|mjs)`];
        const golbForAllEs  =  [`${SRC_DIR}**/*.?(es|mjs|html|pug)`];


        /**
         * 全局的替换，支持两种模式
         * @param stringMode false 范围pipe的参数，true，需要传入一个 string，返回替换后的结果
         */
        const globalRepalce = function(stringMode, string){
            const dic = {
                oss:"http://srx.zgmsoft.com/wx",
                // oss:"../../..",
            }

            const reg = /\[\[(\w+)\]\]/g;
            const handler = function(match, gp1){
                return dic[gp1] || match;
            };

            if (!stringMode) {
                return replaceContent(reg, handler, replaceContentOptions)
            }else{
                return string.replace(reg, handler, replaceContentOptions);
            }
        }


        function pugChain(gulpIns){
            return gulpIns
                .pipe(cache(":pug"))


                //.pipe(fileinfo())
                .pipe(plugins.plumber())
                .pipe(plugins.pug({
                    //显示文件名
                    verbose:true,
                    pretty: true,
                    data: {
                        isDev,
                        path:path.posix,
                    }
                }))
                .pipe(replaceContent(/(href=[\"\'\w\s\/]*\.)(?:scss|less)([#?]?)/g, (__, $1, $2)=>$1 + "css" + $2), replaceContentOptions)
                .pipe(replaceContent(/(src=[\"\'\w\s\/]*\.)(?:es|mjs)([#?]?)/g, (__, $1, $2)=>$1 + "js" + $2), replaceContentOptions)
                .pipe(globalRepalce())

                //.pipe(replaceContent(/<\/?jsp>\n?/g, ""))

                .pipe(filterSize({min:1}))
                .pipe(rename(function(path){
                    if (/(\.\w+)/.test(path.basename)) {
                        path.extname = RegExp.$1;
                        path.basename = path.basename.replace(path.extname, "");
                    }else{
                        path.extname=".html";
                    }
                }))
                .pipe(gulp.dest(DIST_DIR))
                .pipe(fileinfo())
                ;
        }

        gulp.task(':pug', async function () {
            console.log(chalk.green("开始编译pug"));
            await pugChain(gulp.src(golbForPug, options.gulpSrcOptions))
            console.log(chalk.green("pug编译结束"));
        });

        const pug = require('pug');
        gulp.task(':es', async function () {
            console.log(chalk.green("开始编译es"));
            await gulp
                .src(golbForEs, options.gulpSrcOptions)
                .pipe(plugins.plumber())
                .pipe(fileinfo())


                .pipe(
                    rollup(
                        {
                            //打开此项会导致文件未被引用的变量或者函数被删除
                            treeshake: options.treeShake,

                            // There is no `input` option as rollup integrates into the gulp pipeline
                            plugins: [
                                rollupResolve(),
                                rollupCommonjs(),
                                babel({ // 添加babel插件
                                    runtimeHelpers:true,
                                    "presets": [
                                        "@babel/preset-env"
                                    ],
                                    exclude: "node_modules/**" // 排除node_modules下的文件
                                }),
                                rollupPostcss(),
                            ]
                        },
                        {
                            // Rollups `sourcemap` option is unsupported. Use `gulp-sourcemaps` plugin instead
                            format: 'es',
                        }
                    )
                )
                .pipe(

                    //  `{pug[div: img]pug}`
                    //  尽情在js使用pug语法
                    //  {[./include的简写语法 支持"/"开头的绝对路径,和相对路径]}

                    //  foo.js内如果使用空的引入表达式,则会引入"./$foo.pug"
                    //  `{pug[]pug}`

                    //  使用相对路径引入pug
                    //  `{pug[foo.pug]pug}`

                    //  绝对路径引入
                    //  `{pug[/src/foo.pug]}`
                    replaceContent(
                        /\{pug\[([\s\S]*?)\]pug\}/g,
                        function(match, pugStr){

                            //增强之后，可以获取当前文件路径
                            const {filePath, fileDirPath, file}  = this;
                            let html;
                            try {

                                //
                                let fileName = filePath.replace(fileDirPath, "");
                                fileName = fileName.split("?")[0];
                                fileName = fileName.substring(0, fileName.lastIndexOf("."));

                                //首先按照includ来解析
                                let includePath = pugStr.trim();
                                if (includePath.trim().endsWith(".pug") || !includePath) {
                                    let dirPath;

                                    //空符号,绑定默认名称
                                    if (!includePath) {
                                        includePath = "./$" + fileName + ".pug"
                                    }else{
                                        includePath = includePath.split(path.sep).join("/");
                                    }

                                    //绝对路径
                                    if (includePath.startsWith("/")) {
                                        dirPath = "";
                                        includePath = includePath.substr(1);

                                        //相对路径
                                    }else{
                                        dirPath = fileDirPath.replace(options.__cwd + path.sep, "");

                                        //转化为linux路径
                                        dirPath = dirPath.split(path.sep).join("/");
                                    }

                                    pugStr =  "include " + path.posix.join(dirPath, includePath);
                                }

                                pugStr = trim(pugStr);


                                [pugStr] = JSON.parse(`["${pugStr}"]`);


                                var fn = pug.compile(trim(pugStr), {
                                    filename: (new Date() * 1)  + ".pug",
                                    self:true,
                                });
                                html = fn({
                                    resolve_path(_path){
                                        return resolvePath(_path);
                                    }
                                });
                                html = html.replace(/&amp;/g, "&");

                            }catch (e) {
                                console.log(`js内嵌pug出错,${filePath}:`, e);
                            }

                            return html;
                            // return "`"+ html +"`"
                        },
                        replaceContentOptions
                    )
                )
                .pipe(globalRepalce())

                .pipe(rename(function(path){

                    // console.log(path);
                    path.extname=".js"
                }))
                .pipe(fileinfo())
                // .pipe(uglify({
                //     compress:{
                //         drop_debugger:false,
                //     },
                //     // mangle: {
                //     //     //toplevel: true,
                //     //     //properties: true
                //     // }
                // }))
                .pipe(gulp.dest(DIST_DIR))
            ;
            console.log(chalk.green("es编译结束"));
        })


        const LessPluginAutoPrefix = require('less-plugin-autoprefix')
        const autoprefixPlugin = new LessPluginAutoPrefix({ browsers: ['last 9 versions'] })
        const less = require('gulp-less');
        gulp.task(":less", async function(){
            console.log(chalk.green("开始编译less"));
            await gulp
                .src(golbForLess, options.gulpSrcOptions)
                //.pipe(cache(":less"))
                .pipe(sourcemaps.init())
                .pipe(fileinfo())


                //响应式单位转换
                .pipe(replaceContent(/(-?\d+(\.\d+)?)ex/g, function(match, gp1){
                    return `px2rem(${gp1})`
                }, replaceContentOptions))

                .pipe(less({
                    plugins: [autoprefixPlugin],
                    javascriptEnabled: true,
                    path:[
                        resolvePath(""),
                        resolvePath(SRC_DIR),
                        resolvePath("/node_modules"),
                    ]
                }))
                .pipe(globalRepalce())
                .pipe(plugins.plumber())
                .on("error", console.error)
                //单位bytes,{max,min} 通过文件大小过滤
                .pipe(filterSize({min:1}))
                .pipe(sourcemaps.write("./"))
                .pipe(gulp.dest(DIST_DIR))
            ;
            console.log(chalk.green("less编译结束"));
        });


        gulp.task("watch", async function () {

            await gulp.series(":pug", ":less", ":es")();

            console.log(chalk.green("开始监控pug"));
            await gulp.watch(golbForAllPug, gulp.series(":pug"));

            console.log(chalk.green("开始监控less"));
            await gulp.watch(golbForAllLess, gulp.series(":less"));

            console.log(chalk.green("开始监控es"));
            await gulp.watch(golbForAllEs, gulp.series(":es"));

            //只复制修改的文件的方式
            //并且对新建的文件有效
            await copyChain(watch(OTHER_FILE_SRC));

            //此方式不支持识别新建
            // gulp.watch(OTHER_FILE_SRC, gulp.series(":copy"));
        });



        function copyChain(glupIns){
            return glupIns
                .pipe(cache(":copy"))
                .pipe(filterSize({min:1}))
                //.pipe(fileinfo())
                .pipe(gulp.dest(`${DIST_DIR}`))
                ;
        }

//复制其他类型文件
        gulp.task(":copy", async function () {
            console.log(chalk.green("开始复制非编译文件"));
            await copyChain(gulp.src(OTHER_FILE_SRC, options.gulpSrcOptions));
            console.log(chalk.green("非编译文件复制结束"));
        });

        gulp.task(":live-server", async function(){
            const liveServer = require("live-server");


            liveServer.start({
                port: options.port || 6341, // Set the server port. Defaults to 8080.
                //host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
                root: DIST_DIR, // Set root directory that's being served. Defaults to cwd.
                open: true, // When false, it won't load your browser by default.
                ignore: '**/*.@(less|pug)', // comma-separated string for paths to ignore
                wait: 300, // Waits for all changes, before reloading. Defaults to 0 sec.
                logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
                middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
            });
        })


        gulp.task(":clean-dist", async function(){

            console.log(chalk.green("开始清空"));
            return gulp
                .src([
                    `${DIST_DIR}*`,
                ], {read: false})
                .pipe(
                    gulpClean()
                )
            ;
            console.log(chalk.green("清空完成"));
        });


        //压缩dist
        gulp.task(":zip-dist", async function(){
            gulp.src('src/**')
                .pipe(zip('template.zip'))
                .pipe(gulp.dest('./'))
        })


        /**
         * 编译文件到设置的目录
         */
        gulp.task("build",async function(){

            let taskLs = [
                ":copy",
                ":es",
                ":pug",
                ":less"
            ]


            if (options.buildClean) {
                taskLs.unshift(":clean-dist")
            }

            await gulp.series(...taskLs)();
        });


        gulp.task("build-no-clean", gulp.series(
            ":copy",
            ":es",
            ":pug",
            ":less"
        ))


        /**
         * 调试模式
         */
        gulp.task("dev", gulp.parallel("watch",":live-server"));

    }
}
