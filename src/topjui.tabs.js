(function ($) {

    $.fn.iTabs = function (options) {
        var defaults = {
            title: '',
            closable: true,
            iconCls: '',
            content: '',
            //href: '',
            border: false,
            fit: true
        }

        var options = $.extend(defaults, options);
        var $tabsElement = $('#' + options.id);
        var initShow = true;

        $(this).tabs({
            title: options.title,
            closable: options.closable,
            iconCls: options.iconCls,
            content: options.content,
            //href: options.href,
            border: options.border,
            fit: options.fit,
            onSelect: function (title, index) {
                //初始化显示tabs时，不加载里面的内容
                if (!initShow) {
                    var component = options.component;
                    var newQueryParams = {};
                    var $element = $('#' + options.id + index);
                    if (component[index]["type"] == "datagrid") {
                        var gridOptions = $element.datagrid('options');
                        var $parentGrid = $('#' + gridOptions.parentGrid.id);
                        var selectedRow = $parentGrid.datagrid("getSelected");
                        if (selectedRow) {
                            newQueryParams = getSelectedRowJson(gridOptions.parentGrid.param, selectedRow);
                            //获得表格原有的参数
                            var queryParams = $element.datagrid('options').queryParams;
                            $element.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.datagrid('load');
                        }
                    } else if (component[index]["type"] == "treegrid") {
                        var gridOptions = $element.treegrid('options');
                        var $parentGrid = $('#' + gridOptions.parentGrid.id);
                        var selectedRow = $parentGrid.datagrid("getSelected");
                        if (selectedRow) {
                            newQueryParams = getSelectedRowJson(gridOptions.parentGrid.param, selectedRow);
                            //获得表格原有的参数
                            var queryParams = $element.datagrid('options').queryParams;
                            $element.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.datagrid('load');
                        }
                    } else if (component[index]["type"] == "panel") {
                        var panelOptions = $element.panel('options');
                        var $parentGrid = $('#' + panelOptions.parentGrid.id);
                        var selectedRow = $parentGrid.datagrid("getSelected");
                        if (selectedRow) {
                            var href = replaceUrlParamValueByBrace(panelOptions.href, selectedRow);
                            $element.panel('refresh', href);
                        }
                    }
                }
                initShow = false;

            },
            onLoad: function (panel) {
                //$(this).trigger(topJUI.eventType.initUI.base);
            }
        });
    }

    // 扩展tabs方法
    $.extend($.fn.tabs.methods, {
        myAdd: function (jq, param) {
            return jq.each(function () {
                $(this).tabs('add', param);
                // 打开Tab页时触发事件
                // $(this).trigger(topJUI.eventType.initUI.base);
            });
        },
        /**
         * 绑定双击事件
         * @param {Object} jq
         * @param {Object} caller 绑定的事件处理程序
         */
        bindDblclick: function (jq, caller) {
            return jq.each(function () {
                var that = this;
                $(this).children("div.tabs-header").find("ul.tabs").undelegate('li', 'dblclick.tabs').delegate('li', 'dblclick.tabs', function (e) {
                    if (caller && typeof(caller) == 'function') {
                        var title = $(this).text();
                        var index = $(that).tabs('getTabIndex', $(that).tabs('getTab', title));
                        caller(index, title);
                    }
                });
            });
        },
        /**
         * 解除绑定双击事件
         * @param {Object} jq
         */
        unbindDblclick: function (jq) {
            return jq.each(function () {
                $(this).children("div.tabs-header").find("ul.tabs").undelegate('li', 'dblclick.tabs');
            });
        }
    });

})(jQuery);