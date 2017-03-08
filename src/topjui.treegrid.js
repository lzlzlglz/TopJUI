/**
 *
 一、Data属性：
 <table id="cxdm"
 data-toggle="datagrid"
 data-url="${ctx}/System/Article/getAllArticleList"
 data-columns='[{"field":"id","title":"ID","align":"center"},{"field":"title","title":"标题","align":"left"},{"field":"creator","title":"发布人","align":"center"},{"field":"createTime","title":"发布时间","align":"center"}]'
 ></table>

 二、jQuery API：
 <script type="text/javascript">
 $(function(){
		$('#cxdm').myDatagrid({
			url:${ctx} + '/System/Article/getAllArticleList',
			columns:[{field:'id',title:'ID',align:'center'},
			         {field:'title',title:'标题',align:'left',formatter:function(val,rec) {return "<a href=${ctx} + '/System/Article/edit?id="+rec.id+"'>"+val+"</a>";}},
					 {field:'creator',title: '发布人',align: 'center'},
					 {field:'createTime',title: '发布时间',align: 'center'}]
		});
	})
 </script>
 *
 */

(function ($) {
    $.fn.iTreegrid = function (options) {
        var defaults = {
            //gridId       : element.get(0).id,
            gridId: this.selector,
            treegridContextId: 'treegridContext',
            url: ctx + '/system/codeItem/getListByCodesetidAndLevelid',
            queryParams: {"codeSetId": $.getUrlParam("codeSetId"), "levelId": $.getUrlParam("levelId")},//首次查询参数
            onBeforeExpandUrl: ctx + "/system/codeItem/getListByPid",
            idField: 'id',
            treeField: 'text',
            border: false,
            loadMsg: "数据加载中,请稍后...",
            toolbar: this.selector + "-toolbar",
            pagination: false,
            pageNumber: 1,
            pageSize: 1,
            pageList: [10, 20, 30, 40, 50],
            animate: true,
            columns: [[
                {field: 'text', title: '名称'},
                {field: 'codeSetId', title: '体系代码', width: 100},
                {field: 'id', title: '编号'},
                {field: 'pid', title: '父级编号'},
                {field: 'levelId', title: '层级', width: 100},
                {field: 'sort', title: '排序', width: 100},
                {field: 'code', title: '代码', width: 100},
                {field: 'status', title: '状态', width: 100}
            ]],
            checkOnSelect: false,
            selectOnCheck: false,
            onClickRow: function (row) {

            }
        }

        var options = $.extend(defaults, options);

        $(this).treegrid({
            url: appendSourceUrlParam(options.url),
            //queryParams:options.queryParams,
            idField: options.idField,
            treeField: options.treeField,
            fit: true,
            fitColumns: true,
            toolbar: options.toolbar,
            pagination: options.pagination,
            pageNumber: 1,
            pageSize: 20,
            pageList: [10, 20, 30, 40, 50],
            animate: options.animate,
            columns: options.columns,
            border: options.border,
            loadMsg: options.loadMsg,
            checkOnSelect: options.checkOnSelect,
            selectOnCheck: options.selectOnCheck,
            onBeforeExpand: function (row) {
                $(this).treegrid('options').url = replaceUrlParamValueByBrace(options.expandUrl, row);
            },
            onLoadSuccess: function () {
                var rootNode = $(options.gridId).treegrid('getRoot');
                if (rootNode) {
                    $(options.gridId).treegrid("expand", rootNode.id);
                }
                $(this).treegrid('options').url = appendSourceUrlParam(options.url);
            },
            onContextMenu: function (e, row) {
                /*e.preventDefault();
                 // 查找节点
                 $(this).treegrid('select', row[options.idField]);
                 // 显示快捷菜单
                 $("#" + options.treegridContextId).menu('show', {
                 left: e.pageX,
                 top: e.pageY
                 });*/
            },
            onClickRow: function (row) {
                //传递给要刷新表格的参数
                if (typeof options.childGrid == "object") {
                    var newQueryParams = {};
                    newQueryParams = getSelectedRowJson(options.childGrid.param, row);

                    var refreshGridIdArr = options.childGrid.grid;
                    for (var i = 0; i < refreshGridIdArr.length; i++) {
                        var $grid = $("#" + refreshGridIdArr[i].id);

                        if (refreshGridIdArr[i].type == "datagrid") {
                            //获得表格原有的参数
                            var queryParams = $grid.datagrid('options').queryParams;
                            $grid.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $grid.datagrid('load');
                        } else if (refreshGridIdArr[i].type == "treegrid") {
                            //获得表格原有的参数
                            var queryParams = $grid.treegrid('options').queryParams;
                            $grid.treegrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $grid.treegrid('load');
                        } else if (refreshGridIdArr[i].type == "panel") {
                            var href = replaceUrlParamValueByBrace(refreshGridIdArr[i].href, row);
                            $grid.panel('refresh', href);
                        }
                    }
                }

                if (typeof options.childTab == "object") {
                    var childTabArr = options.childTab.tabs;
                    for (var i = 0; i < childTabArr.length; i++) {
                        var $tabsElement = $('#' + childTabArr[i].id);
                        var $tabsOptions = $tabsElement.tabs('options');
                        var index = $tabsElement.tabs('getTabIndex', $tabsElement.tabs('getSelected'));
                        var tabsComponent = $tabsOptions.tabs;
                        var $element = $("#" + tabsComponent[index].id);

                        var newQueryParams = {};

                        newQueryParams = getSelectedRowJson(childTabArr[i].param, row);

                        if (tabsComponent[index]["type"] == "datagrid") {
                            //获得表格原有的参数
                            var queryParams = $element.datagrid('options').queryParams;
                            $element.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.datagrid('load');
                        } else if (tabsComponent[index]["type"] == "treegrid") {
                            //获得表格原有的参数
                            var queryParams = $element.treegrid('options').queryParams;
                            $element.treegrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.treegrid('load');
                        } else if (tabsComponent[index]["type"] == "panel") {
                            var panelOptions = $element.panel('options');
                            var newHref = replaceUrlParamValueByBrace(panelOptions.dynamicHref, row);
                            //$element.panel('refresh', newHref);
                            var iframe = '<iframe src="' + newHref + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
                            $element.panel({
                                content: iframe
                            });
                        }
                    }
                }

            }
        });

    }

})(jQuery);