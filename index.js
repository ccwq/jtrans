const gulp = require("gulp");
const {createTask} = require("./gulpfile");


const rawArgv = process.argv.slice(2);
const args = require('minimist')(
    rawArgv,
    {
        boolean: [
            "build-clean",
            "tree-shake",

        ]
    }
)


console.log(args);


module.exports = {
    init(...rest){

        let [task] = args._;

        if (!task) {
            task = "build";
        }


        console.log("arg", ...rest);
        //console.log(process,  7789);
        console.log(process.env.INIT_CWD,  7789);
        // gulp.start("build");


        createTask(args);

        gulp.series(task)();

    }
}