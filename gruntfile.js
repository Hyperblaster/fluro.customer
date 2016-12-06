module.exports = function(grunt) {

    "use strict";
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            js: {
                files: [
                    'lib/js/**/*.js'
                ],
                tasks: ['compile'],
            },
            html: {
                files: [
                    'lib/html/**/*.html'
                ],
                tasks: ['compile'],
            }
        },
        ngtemplates: {
            'fluro.customer': {
                cwd: './lib/html',
                src: 'fluro/**/*.html',
                dest: 'dist/fluro.customer-templates.js',
                options: {
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives! 
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            }
        },

        //Concatenate all the build js files
        concat: {
            js: {
                src: ['lib/js/**/*.js'],
                dest: 'dist/fluro.customer.js',
            }
        },

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'dist/fluro.customer.js': ['dist/fluro.customer.js'],
                }
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            build: {
                src: [
                    'dist/fluro.customer.js',
                    'dist/fluro.customer-templates.js'
                ],
                dest: 'dist/fluro.customer.min.js'
            }
        }
    });

    grunt.registerTask('default', ['watch']);
    //grunt.registerTask('build', ['copy:build', 'htmlmin:build', 'uglify:build', 'cssmin:build']);
    grunt.registerTask('compile', ['ngtemplates', 'concat','ngAnnotate', 'uglify']);

    //'autoprefixer', 'cssmin'


};