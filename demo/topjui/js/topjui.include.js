var dynamicLoading = {
    css: function (path, id) {
        if (!path || path.length === 0) {
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.id = id;
        link.href = path;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
    },
    js: function (path) {
        if (!path || path.length === 0) {
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        head.appendChild(script);
    }
};
dynamicLoading.js("../../topjui/plugins/jquery/jquery.min.js");
<!-- EasyUI样式 -->
dynamicLoading.css("../../topjui/themes/default/easyui.css", "easyuiTheme");
<!-- TopJUI样式 -->
dynamicLoading.css("../../topjui/css/topjui.all.min.css");
<!-- TopJUI配置 -->
dynamicLoading.js("../../topjui/js/topjui.config.js");
<!-- jQuery核心 -->

dynamicLoading.js("../../topjui/plugins/jquery/jquery.cookie.js");
<!-- EasyUI核心 -->
dynamicLoading.js("../../topjui/plugins/easyui/jquery.easyui.min.js");
dynamicLoading.js("../../topjui/plugins/easyui/easyui-lang-zh_CN.js");
<!-- TopJUI框架 -->
dynamicLoading.js("../../topjui/js/topjui.all.js");

// 百度统计代码开始
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?9bbb7536a0474a4ad060a6fdc8a678b5";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();
// 百度统计代码结束