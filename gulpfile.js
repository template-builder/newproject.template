'use strict';

const projectName = 'project';
const cms = ''; // || wordpress || bitrix

const gulp = require('gulp'),
    rename = require('gulp-rename'),
    // code
    rigger = require('gulp-rigger'),
    // sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    // style
    sass = require('gulp-sass'),
    // prefixer = require('gulp-autoprefixer'),
    cssmin = require('gulp-clean-css'),
    // image
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    // watch changes
    watch = require('gulp-watch'),
    // server
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    // clear images
    rimraf = require('rimraf'),
    combiner = require('stream-combiner2').obj;

if( 'wordpress' == cms ) {
    const dir = {
        build: '../../wordpress.cms/wp-content/themes/'+projectName+'/',
        src: 'source/',
        base: './../../wordpress.cms/wp-content/themes/'+projectName
    }
}
else if( 'bitrix' == cms ) {
    const dir = {
        build: '../../bitrix.cms/local/templates/'+projectName+'/',
        src: 'source/',
        base: './../../bitrix.cms/local/templates/'+projectName
    }
}
else {
    const dir = {
        // dont change project name for the .gitignore
        build: 'project/',
        src: 'source/',
        base: './project'
    }
}

const path = {
    build: {
        code: dir.build,
        js: dir.build + 'assets/',
        // css: dir.build + 'assets/css/',
        img: dir.build + 'img/',
        font: dir.build + 'assets/fonts/'
    },
    src: {
        code: [
            dir.src + '*.html',
            dir.src + '*.php'
        ],
        js: dir.src + 'js/*.js',
        style: dir.src + 'template_styles.scss',
        img: dir.src + 'img/*.*',
        font: dir.src + 'fonts/**/*.*'
    },
    watch: {
        code: [
            dir.src + '**/*.html'
            ,dir.src + '**/*.php'
        ],
        js: dir.src + 'js/**/*.js',
        style: [
            dir.src + 'template_styles.scss'
            ,dir.src + 'styles/**/*.scss'
        ],
        img: dir.src + 'img/**/*.*',
        font: dir.src + 'fonts/**/*.*'
    },
};

const srvConfig = {
    server: {
        baseDir: dir.base
    },
    tunnel: false,
    host: 'localhost',
    port: 8080,
    logPrefix: projectName
};

// for pretty code
const r = {stream: true};

gulp.task('build::code', function () {
    return combiner(
        gulp.src(path.src.code)
            ,rigger()
        ,gulp.dest(path.build.code)
            ,reload(r)
    );
});

gulp.task('build::style', function () {
    return combiner(
        gulp.src(path.src.style)
            // ,sourcemaps.init()
            ,sass().on('error', sass.logError)
            // ,prefixer()
            ,cssmin()
            // ,sourcemaps.write()
        ,gulp.dest(path.build.code)
            ,reload(r)
    );
});

gulp.task('build::js', function () {
    return combiner(
        gulp.src(path.src.js)
            ,rigger()
            // ,sourcemaps.init()
            // ,uglify()
            // ,sourcemaps.write()
        ,gulp.dest(path.build.js)
            ,reload(r)
    );
});

gulp.task('build::image', function () {
    return combiner(
        gulp.src(path.src.img)
            ,imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()],
                interlaced: true
            })
        ,gulp.dest(path.build.img)
            ,reload(r)
    );
});

// move only
gulp.task('build::font', function() {
    return combiner(
        gulp.src(path.src.font)
        ,gulp.dest(path.build.font)
    );
});

gulp.task('watch', function() {
    watch(path.watch.code, function(event, cb) {
        gulp.start('build::code');
    });

    watch(path.watch.style, function(event, cb) {
        gulp.start('build::style');
    });

    watch([path.watch.js], function(event, cb) {
        gulp.start('build::js');
    });

    watch([path.watch.img], function(event, cb) {
        gulp.start('build::image');
    });

    watch([path.watch.font], function(event, cb) {
        gulp.start('build::font');
    });

    watch([dir.src + 'styles/bootstrap/**/*.scss', dir.src + 'styles/_site-settings.scss'], function(event, cb) {
        gulp.start('vbuild::bootstrap');
    });
});


/**
 * build vendor packages (use after bower)
 */
gulp.task('vbuild::bootstrap-style', function () {
    return combiner(
        gulp.src(dir.src + 'styles/bootstrap/bootstrap.scss')
            // ,sourcemaps.init()
            ,sass().on('error', sass.logError)
            ,cssmin() // minify/uglify
            // ,sourcemaps.write()
        ,gulp.dest(dir.build + 'assets/')
            ,reload(r)
    );
});

gulp.task('vbuild::bootstrap-script', function () {
    return combiner(
        gulp.src(dir.src + 'js/bootstrap.js')
            ,rigger()
            // ,sourcemaps.init()
            ,uglify()
            // ,sourcemaps.write()
            ,rename({
                suffix: '.min'
            })
        ,gulp.dest(dir.build + 'assets/')
            ,reload(r)
    );
});

// move only
gulp.task('vbuild::jquery', function () {
    return combiner(
        gulp.src('bower_components/jquery/dist/jquery.min.js')
        ,gulp.dest(path.build.js)
    );
});

// move only
gulp.task('vbuild::fancybox', function () {
    return combiner(
        gulp.src('bower_components/fancybox/dist/*.*')
        ,gulp.dest(path.build.js + 'fancybox/')
    );
});

// // move only
gulp.task('vbuild::slick', function () {
    return combiner(
        gulp.src('bower_components/slick-carousel/slick/**/*.*')
        ,gulp.dest(path.build.js + 'slick/')
    );
});

// // move only
gulp.task('vbuild::masonry', function () {
    return combiner(
        gulp.src('bower_components/masonry-layout/dist/**/*.*')
        ,gulp.dest(path.build.js + 'masonry/')
    );
});

gulp.task('moveSource', function () {
    return combiner(
        gulp.src( dir.src + '**/*.*' )
        ,gulp.dest(dir.build + 'source/')
    );
});

gulp.task('moveSource::styles', function () {
    return combiner(
        gulp.src( [dir.src + '**/*.scss', dir.src + '**/*.css'] )
        ,gulp.dest(dir.build)
    );
});

gulp.task('webserver', function () {
    browserSync(srvConfig);
});

gulp.task('clean', function (cb) {
    rimraf(dir.base, cb);
});

// build project
gulp.task('build', [
    'build::code',
    'build::js',
    'build::style',
    'build::font',
    'build::image'
]);

// build bootstrap
gulp.task('vbuild::bootstrap', [
    'vbuild::bootstrap-style',
    'vbuild::bootstrap-script',
]);

// build vendor packages
gulp.task('vbuild', [
    'vbuild::jquery',
    'vbuild::bootstrap',
    'vbuild::fancybox',
    'vbuild::slick',
    'vbuild::masonry',
]);

// init project
gulp.task('install', ['vbuild', 'build']);

// start development
gulp.task('default', ['build', 'webserver', 'watch']);

// complete project (build + move source)
gulp.task('complete', ['install', 'moveSource', 'moveSource::styles' ]);