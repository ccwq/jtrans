const gulp = require("gulp");
const {createTask} = require("./gulpfile");
const _ = require("lodash");


const rawArgv = process.argv.slice(2);
const args = require('minimist')(
    rawArgv,
    {
        boolean: [
            "build-clean",
            "tree-shake",
            "disabled-tree-shake",
            "disabled-treeshake",
        ]
    }
)

const cwd = process.env.INIT_CWD;

args.__cwd = cwd;

module.exports = {
    init(...rest){

        let [task] = args._;

        if (!task) {
            task = "build";
        }

        let _args = Object.keys(args).reduce((result, key) =>{
            if(/^(-|_)/.test(key)) {
                result[key] = args[key];
            }else{
                result[_.camelCase(key)] = args[key];
            }
            return result;
        }, {});

        createTask(_args);

        gulp.series(task)();
    }
}