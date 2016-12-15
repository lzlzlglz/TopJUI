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
                 "src/topjui.combotree.js",
                 "src/topjui.common.js",
                 "src/topjui.core.js",
                 "src/topjui.datagrid2.js",
                 "src/topjui.datagrid-filter.js",
                 "src/topjui.dialog.js",
                 "src/topjui.dialog2.js",
                 "src/topjui.edatagrid.js",
                 "src/topjui.extend.js",
                 "src/topjui.form.js",
                 "src/topjui.function.js",
                 "src/topjui.menu.js",
                 "src/topjui.plugins.js",
                 "src/topjui.tabs.js",
                 "src/topjui.toolbar.js",
                 "src/topjui.tree.js",
                 "src/topjui.treegrid.js",
                 "src/topjui.window.js"
             ],
             //dest: 'assets/js/topjui.js'
             dest: 'E:/wwwroot/Java/ewsdMIS/src/main/webapp/static/topjui/core/topjui.js'
         }
     },
     uglify: {
         options: {
            banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
         },
         dist: {
             files: {
                 //'assets/js/topjui.min.js': 'assets/js/topjui.js',
                 'E:/wwwroot/Java/ewsdMIS/src/main/webapp/static/topjui/core/topjui.min.js': 'E:/wwwroot/Java/ewsdMIS/src/main/webapp/static/topjui/core/topjui.js'
             }
         }
     },
     cssmin: {
         options: {
             keepSpecialComments: 0 /* 删除所有注释 */
         },
         compress: {
             files: {
                 'E:/wwwroot/Java/ewsdMIS/src/main/webapp/static/topjui/css/style.css': [
                     "themes/css/icon.css",
                     "themes/css/style.css",
                     "themes/css/bootstrap-ext.css"
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