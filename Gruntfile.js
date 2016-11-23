module.exports = function(grunt) {
  //配置参数
  grunt.initConfig({
     pkg: grunt.file.readJSON('package.json'),
     concat: {
         options: {
             separator: ';',
             stripBanners: true
         },
         dist: {
             src: [
                 "src/ext/js/topjui.combotree.js",
                 "src/ext/js/topjui.common.js",
                 "src/ext/js/topjui.core.js",
                 "src/ext/js/topjui.datagrid.js",
                 "src/ext/js/topjui.datagrid2.js",
                 "src/ext/js/topjui.datagrid-filter.js",
                 "src/ext/js/topjui.dialog.js",
                 "src/ext/js/topjui.dialog2.js",
                 "src/ext/js/topjui.extend.js",
                 "src/ext/js/topjui.form.js",
                 "src/ext/js/topjui.function.js",
                 "src/ext/js/topjui.layout.js",
                 "src/ext/js/topjui.menu.js",
                 "src/ext/js/topjui.plugins.js",
                 "src/ext/js/topjui.toolbar.js",
                 "src/ext/js/topjui.tree.js",
                 "src/ext/js/topjui.treegrid.js",
                 "src/ext/js/topjui.window.js"
             ],
             dest: "assets/js/topjui.js"
         }
     },
     uglify: {
         options: {
         },
         dist: {
             files: {
                 'assets/js/topjui.min.js': 'assets/js/topjui.js'
             }
         }
     },
     cssmin: {
         options: {
             keepSpecialComments: 0
         },
         compress: {
             files: {
                 'assets/css/default.css': [
                     "css/global.css",
                     "css/pops.css",
                     "css/index.css"
                 ]
             }
         }
     }
  });

  //载入concat和uglify插件，分别对于合并和压缩
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  //注册任务
  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
}