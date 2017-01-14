function getTabWindow() {
    var curTabWin = null;
    var curTab = parent.$('#index_tabs').tabs('getSelected');
    // var curTab = $('#index_tabs').tabs('getSelected');
    if (curTab && curTab.find('iframe').length > 0) {
        curTabWin = curTab.find('iframe')[0].contentWindow;
    }
    return curTabWin;
}

//采用jquery easyui loading css效果
function showMask() {
    $("<div class=\"datagrid-mask\"></div>").css({
        display: "block",
        width: "100%",
        height: $(window).height()
    }).appendTo("body");
    $("<div class=\"datagrid-mask-msg\"></div>").html("正在处理，请稍候。。。").appendTo("body").css({
        display: "block",
        left: ($(document.body).outerWidth(true) - 190) / 2,
        top: ($(window).height() - 45) / 2
    });
}

function hideMask() {
    $(".datagrid-mask").remove();
    $(".datagrid-mask-msg").remove();
}

//在主框架内打开Tab页，如点击左边的菜单打开Tab窗口
function addTab(params) {
    var iframe = '<iframe src="' + params.url + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
    var t = $('#index_tabs');
    var opts = {
        id: Math.random(),
        title: params.text,
        closable: typeof(params.closable) != "undefined" ? params.closable : true,
        iconCls: params.iconCls ? params.iconCls : 'icon-page',
        content: iframe,
        //href: params.url,
        border: params.border || false,
        fit: true
        //cls: 'leftBottomBorder'
    };
    if (t.tabs('exists', opts.title)) {
        t.tabs('select', opts.title);
    } else {
        t.tabs('myAdd', opts);
    }
}

addParentTab = function (options) {

    var src, title;
    if (typeof options.grid == "object") {
        if (options.grid.checkboxSelect == true) {
            var rows = getCheckedRowsData(options.grid.type, options.grid.id);
            if (rows.length == 0) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    topJUI.language.message.msg.checkSelfGrid,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            if (rows[0]["UUID"]) {
                src = options.tab.href.indexOf("?") >= 0 ? options.tab.href + "&UUID=" + getMultiRowsFieldValue(rows, "UUID") : options.tab.href + "?UUID=" + getMultiRowsFieldValue(rows, "UUID");
            } else {
                src = options.tab.href.indexOf("?") >= 0 ? options.tab.href + "&uuid=" + getMultiRowsFieldValue(rows, "uuid") : options.tab.href + "?uuid=" + getMultiRowsFieldValue(rows, "uuid");
            }
        } else {
            //var unselectedMsg = options.grid.unselectedMsg;
            var row = getSelectedRowData(options.grid.type, options.grid.id);
            if (!row) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    topJUI.language.message.msg.checkSelfGrid,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            src = replaceUrlParamValueByBrace(options.tab.href, row);
        }
        title = options.tab.title;
    } else {
        src = options.href;
        title = options.title;
    }

    var iframe = '<iframe src="' + src + '" frameborder="0" style="border:0;width:100%;height:99.5%;"></iframe>';
    parent.$('#index_tabs').tabs("add", {
        title: title,
        content: iframe,
        closable: true,
        iconCls: 'icon-page'
    });

}

/**
 * 绑定按钮点击事件
 * @param options
 */
function bindMenuClickEvent($element, options) {
    var defaults = {};
    // 打开dialog事件
    if (options.clickEvent == "openDialog") {
        defaults = {
            iconCls: 'icon-add',
            parentGridUnselectedMsg: '请先选中一条主表数据！',
            dialog: {
                title: '数据详情',
                width: 650,
                height: 400
            }
        }
        options.dialog.width = options.dialog.width ? options.dialog.width : 650;
        options.dialog.height = options.dialog.height ? options.dialog.height : 400;
        options = $.extend(defaults, options);

        var extendDoc = "";
        // 判断是否存在父grid
        if (typeof options.parentGrid == "object") {
            extendDoc += ',parentGrid:{type:\'' + options.parentGrid.type + '\',id:\'' + options.parentGrid.id + '\',param:\'' + options.parentGrid.param + '\',unselectedMsg:\'' + options.parentGrid.unselectedMsg + '\'}';
        }
        // 判断是否存在自身grid
        if (typeof options.grid == "object") {
            extendDoc += ',grid:{type:\'' + options.grid.type + '\',id:\'' + options.grid.id + '\',pkName:\'' + options.grid.pkName + '\',parentIdField:\'' + options.grid.parentIdField + '\',unselectedMsg:\'' + options.grid.unselectedMsg + '\',uncheckedMsg:\'' + options.grid.uncheckedMsg + '\'}';
        }
        // 判断dialog中是否存在editor编辑器
        if (typeof options.dialog.editor == "object") {
            var editorStr = "";
            var dh = "";
            for (var i = 0; i < options.dialog.editor.length; i++) {
                if (i != options.dialog.editor.length - 1)
                    dh = ",";
                editorStr += '{id:\'' + options.dialog.editor[i].id + '\',type:\'' + options.dialog.editor[i].type + '\',field:\'' + options.dialog.editor[i].field + '\'}' + dh;
            }
            extendDoc += ',editor:[' + editorStr + ']';
        }

        // 如果未设置dialog标题，直接调用按钮名称
        !options.dialog.title ? options.dialog.title = $element.text().replace(/[\r\n]/g, "") : '';
        !options.dialog.url ? options.dialog.url = "" : '';
        !options.dialog.beforeOpenCheckUrl ? options.dialog.beforeOpenCheckUrl = "" : options.dialog.beforeOpenCheckUrl;

        var userDefineDialogId = true;
        if (options.dialog.id == "" || options.dialog.id == null) {
            userDefineDialogId = false;
            options.dialog.id = "dialog-" + parseInt(Math.random() * 99999999 + 1);
        }

        var dialogDom = "";
        dialogDom = '<form data-toggle="topjui-dialog2" data-options="id:\'' + options.dialog.id + '\',href:\'' + options.dialog.href + '\',url:\'' + options.dialog.url + '\',title:\'' + options.dialog.title + '\',beforeOpenCheckUrl:\'' + options.dialog.beforeOpenCheckUrl + '\'' + extendDoc + '"></form>';

        // 判断dialog是否存在linkbutton按钮组
        var buttonsDom = "";
        if (typeof options.dialog.buttonsGroup == "object") {
            var buttonsArr = options.dialog.buttonsGroup;
            var btLength = buttonsArr.length;
            if (btLength > 0) {
                for (var i = 0; i < btLength; i++) {
                    // 默认为ajaxForm提交方式
                    if (!buttonsArr[i].handler) {
                        buttonsArr[i].handler = 'ajaxForm';
                    }
                    // 传递本grid参数
                    var gridDoc = "";
                    if (typeof options.grid == "object") {
                        gridDoc = ',grid:{type:\'' + options.grid.type + '\',id:\'' + options.grid.id + '\'}';
                    }
                    // 传递其它grid参数
                    if (typeof buttonsArr[i].reload == "object") {
                        var reloadStr = "";
                        var dh2 = "";
                        for (var j = 0; j < buttonsArr[i].reload.length; j++) {
                            if (j != buttonsArr[i].reload.length - 1)
                                dh2 = ",";

                            reloadStr += '{type:\'' + buttonsArr[i].reload[j].type + '\', id:\'' + buttonsArr[i].reload[j].id + '\', clearQueryParams:\'' + buttonsArr[i].reload[j].clearQueryParams + '\'}' + dh2;
                        }
                        extendDoc += ',reload:[' + reloadStr + ']';
                    }
                    buttonsDom += '<a href="#" data-toggle="topjui-linkbutton" data-options="handlerBefore:\'' + buttonsArr[i].handlerBefore + '\',handler:\'' + buttonsArr[i].handler + '\',dialog:{id:\'' + options.dialog.id + '\'},url:\'' + buttonsArr[i].url + '\',iconCls:\'' + buttonsArr[i].iconCls + '\'' + extendDoc + '">' + buttonsArr[i].text + '</a>';
                }
            }
        }

        getTabWindow().$('body').append(
            dialogDom +
            '<div id="' + options.dialog.id + '-buttons" style="display:none">' +
            buttonsDom +
            '<a href="#" data-toggle="topjui-linkbutton" data-options="iconCls:\'icon-no\'" onclick="javascript:$(\'#' + options.dialog.id + '\').dialog(\'close\')">关闭</a>' +
            '</div>'
        )

        $element.on("click", function () {
            // 权限控制
            if (userDefineDialogId) {
                if (!authCheck(options.dialog.id)) return;
            } else {
                if (!authCheck(options.dialog.href)) return;
            }

            options.dialog.leftMargin = ($(document.body).width() * 0.5) - (options.dialog.width * 0.5);
            options.dialog.topMargin = ($(document.body).height() * 0.5) - (options.dialog.height * 0.5);

            if (typeof options.parentGrid == "object") {
                openDialogAndloadDataByParentGrid(options);
            } else if (options.dialog.url) {
                openDialogAndloadDataByUrl(options);
            } else {
                if (options.grid.uncheckedMsg) {
                    var rows = getCheckedRowsData(options.grid.type, options.grid.id);
                    if (rows.length == 0) {
                        $.messager.alert(
                            topJUI.language.message.title.operationTips,
                            options.grid.uncheckedMsg,
                            topJUI.language.message.icon.warning
                        );
                        return;
                    }
                }
                if (options.dialog.onBeforeOpen != "undefined") {
                    // 回调执行传入的自定义函数
                    executeCallBackFun(options.dialog.onBeforeOpen, options);
                }
                var dialogObj = $("#" + options.dialog.id);
                dialogObj.dialog({
                    width: options.dialog.width,
                    height: options.dialog.height,
                    left: options.dialog.leftMargin,
                    top: options.dialog.topMargin,
                    buttons: options.dialog.buttons
                });
                dialogObj.dialog('refresh', appendSourceUrlParam(options.dialog.href)); // 解决页面加载刷新延迟
                dialogObj.dialog('open');
            }
        });
    } else if (options.clickEvent == "openTab") {
        defaults = {
            iconCls: 'icon-add'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            addParentTab(options);
        });
    } else if (options.clickEvent == "doAjax") {
        defaults = {
            iconCls: 'icon-add'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            doAjaxHandler(options);
        });
    } else if (options.clickEvent == "delete") {
        defaults = {
            iconCls: 'icon-delete'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            deleteHandler(options);
        });
    } else if (options.clickEvent == "filter") {
        defaults = {
            iconCls: 'icon-filter'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            filterHandler(options);
        });
    } else if (options.clickEvent == "search") {
        defaults = {
            iconCls: 'icon-search',
            href: '/system/search/advanceSearch'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            searchHandler(options);
        });
    } else if (options.clickEvent == "export") {
        defaults = {
            iconCls: 'icon-table_go'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            exportHandler(options);
        });
    } else if (options.clickEvent == "import") {
        defaults = {
            iconCls: 'icon-table_go',
            href: '/system/excel/excelImport'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            importHandler(options);
        });
    }
    return options;
}

/**
 * 打开dialog,加载选中的表格数据到dialog中
 * @param options
 */
function openDialogAndloadDataByParentGrid(options) {
    var parentGridUnselectedMsg = "";
    var parentGridParam = "";
    if (typeof options.parentGrid == "object") {
        parentGridUnselectedMsg = options.parentGrid.unselectedMsg;
        parentGridParam = options.parentGrid.param;
        if (options.parentGrid.type == "datagrid") {

        } else if (options.parentGrid.type == "treegrid") {

        }
    }

    //判断父表数据是否被选中
    var parentRow = getSelectedRowData(options.parentGrid.type, options.parentGrid.id);
    if (!parentRow) {
        $.messager.alert(
            topJUI.language.message.title.operationTips,
            options.parentGrid.unselectedMsg || topJUI.language.message.msg.selectParentGrid,
            topJUI.language.message.icon.warning
        );
        return;
    }

    //打开dialog前判断是否还有其它操作限制
    if (options.dialog.beforeOpenCheckUrl) {
        if (!beforeOpenCheck(replaceUrlParamValueByBrace(options.dialog.beforeOpenCheckUrl, parentRow))) return;
    }

    var $dialogObj = $("#" + options.dialog.id);
    $dialogObj.dialog({
        width: options.dialog.width,
        height: options.dialog.height,
        left: options.dialog.leftMargin,
        top: options.dialog.topMargin,
        buttons: options.dialog.buttons
    });

    // 保存原始href，以便在占位参数替换后还原
    var oriHref = options.dialog.href;
    var newHref = oriHref;
    if (options.dialog.href.indexOf("{") != -1) {
        if (options.dialog.href.indexOf("{parent.") != -1) {
            // 替换父表中选中行占位值
            newHref = replaceUrlParamValueByBrace(appendSourceUrlParam(oriHref), parentRow, "parent");
        }
        if (newHref.indexOf("{") != -1) {
            // 替换本表中选中行占位值
            var row = getSelectedRowData(options.grid.type, options.grid.id);
            newHref = replaceUrlParamValueByBrace(appendSourceUrlParam(newHref), row);
        }
        $dialogObj.dialog('open').dialog("refresh", newHref);
    } else {
        $dialogObj.dialog('open');
    }
}

/**
 * 通过dialog的url参数加载数据到dialog中
 * @param options
 */
function openDialogAndloadDataByUrl(options) {
    //判断本表数据是否被选中
    var row = getSelectedRowData(options.grid.type, options.grid.id);
    if (!row) {
        $.messager.alert(
            topJUI.language.message.title.operationTips,
            topJUI.language.message.msg.selectSelfGrid,
            topJUI.language.message.icon.warning
        );
        return;
    }

    //打开dialog前判断是否还有其它操作限制
    if (options.dialog.beforeOpenCheckUrl) {
        if (!beforeOpenCheck(replaceUrlParamValueByBrace(options.dialog.beforeOpenCheckUrl, row))) return;
    }

    var $dialogObj = $("#" + options.dialog.id);
    $dialogObj.dialog({
        width: options.dialog.width,
        height: options.dialog.height,
        left: options.dialog.leftMargin,
        top: options.dialog.topMargin,
        buttons: options.dialog.buttons
    });

    // 保存原始url，以便在占位参数替换后还原
    var oriHref = options.dialog.href;
    if (options.dialog.href.indexOf("{") != -1) {
        // 替换本表中选中行占位值
        var newHref = replaceUrlParamValueByBrace(appendSourceUrlParam(oriHref), row);
        $dialogObj.dialog('open').dialog("refresh", newHref);
    } else {
        $dialogObj.dialog('open');
    }

}

openDialog = function (options) {

    var defaults = {
        dialogId: 'testDialog',
        title: '新增数据',
        href: '',
        url: '',
        width: 600,
        height: 400,
        btnText: '新增'
    }

    options = $.extend(defaults, options);

    $("#" + options.dialogId).dialog({
        title: options.title,
        href: options.href,
        width: options.width,
        height: options.height,
        buttons: [{
            text: options.btnText,
            //id : 'saveBtn',
            iconCls: 'icon-add',
            handler: function () {

                if ($(this).form('validate')) {

                    var ajaxData = $("#" + options.dialogId).serialize();
                    $.ajax({
                        url: options.url,
                        type: 'post',
                        data: ajaxData,
                        beforeSend: function () {
                            $.messager.progress({
                                text: '正在操作...'
                            });
                        },
                        success: function (data, response, status) {
                            $.messager.progress('close');
                            msgFn(data);
                        }
                    });
                }
            }
        }, {
            text: '取消',
            iconCls: 'icon-cancel',
            handler: function () {
                $("#" + options.dialogId).dialog('close').form('reset');
            }
        }],
        onLoad: function () {
            $(this).trigger(topJUI.eventType.initUI.form);
        }
    });
}

/**
 * 打开一个对话框窗口
 * @param options
 */
function dialogHandler(options) {
    if (!authCheck(options))
        return;

    if (options.component == "loadData") {
        editHandler(options);
    } else if (options.action == "loadParentData") {
        addChildHandler(options);
    } else {
        addHandler(options);
    }
}

/**
 * 新增表格数据
 * @param options
 */
function addHandler(options) {
    var controllerUrl = getUrl("controller");
    var defaults = {
        gridId: 'datagrid'
        //dialogId      : 'addDialog',
        //dialogHref    : options.dialogHref ? options.dialogHref : controllerUrl + "edit"
    };
    options = $.extend(defaults, options);

    //clearDialogHrefKeyValue(options.addDialogId, "action,uuid");
    var dialogObj = $("#" + options.dialogId);
    dialogObj.dialog({
        //title : '新增数据',
        iconCls: 'icon-add',
        toolbar: '#' + options.dialogId + '-toolbar',
        buttons: '#' + options.dialogId + '-buttons'
    });

    if (options.dialogHref != undefined) {
        dialogObj.dialog('refresh', options.dialogHref);
    }
    dialogObj.dialog('open');


}

/**
 * 检查授权
 * @param resource 资源值，可以是url也可以是标识
 */
function authCheck(resource) {
    var isAuth = false;
    $.ajax({
        type: 'post',
        url: ctx + "/system/authAccess/getAuthByRoleIdAndUrl",
        data: {url: resource},
        async: false,
        success: function (data) {
            if (data == 0) {
                var msgJson = {
                    title: topJUI.language.message.title.operationTips,
                    msg: topJUI.language.message.msg.permissionDenied
                };
                $.messager.alert(msgJson);
                isAuth = false;
            } else {
                isAuth = true;
            }
        }
    });
    return isAuth;
}

function beforeOpenCheck($checkUrl) {
    var isAuth = false;
    $.ajax({
        type: 'get',
        url: $checkUrl,
        async: false,
        success: function (data) {
            if (data.statusCode == 300) {
                var msgJson = {
                    title: topJUI.language.message.title.operationTips,
                    msg: data.message
                };
                $.messager.alert(msgJson);
                isAuth = false;
            } else {
                isAuth = true;
            }
        }
    });
    return isAuth;
}

//新增子表数据
function addChildHandler(options) {

    var row = $("#" + options.parentGridId).treegrid('getSelected') ? $("#" + options.parentGridId).treegrid('getSelected') : $("#" + options.parentGridId).datagrid('getSelected');
    if (row) {
        var controllerUrl = getUrl("controller");
        var defaults = {
            gridId: 'datagrid',
            //dialogId      : 'addDialog',
            dialogHref: options.dialogHref ? options.dialogHref : controllerUrl + "edit"
        }
        options = $.extend(defaults, options);

        //clearDialogHrefKeyValue(options.addDialogId, "action,uuid");
        var dialogObj = $("#" + options.dialogId);
        dialogObj.dialog({
            //title : '新增数据',
            iconCls: 'icon-add',
            toolbar: '#' + options.dialogId + '-toolbar',
            buttons: '#' + options.dialogId + '-buttons'
        });

        if (options.dialogHref != undefined) {
            dialogObj.dialog('refresh', options.dialogHref);
        }
        dialogObj.dialog('open');
        setTimeout(function () {
            getTabWindow().$("#" + options.dialogId + " iframe").each(function (i) {
                this.contentWindow.document.body.innerHTML = '';
            });

            var jsonData = {};
            if (options.gridParam) {
                var gridParamArr = options.gridParam.split(",");
                //传递给dialog输入框的参数
                for (var i = 0; i < gridParamArr.length; i++) {
                    jsonData[gridParamArr[i]] = row[gridParamArr[i]];
                }
            }
            jsonData.puuid = row.uuid;

            dialogObj.form('load', jsonData);
        }, 500);
    } else {
        $.messager.alert(
            topJUI.language.message.title.operationTips,
            topJUI.language.message.msg.selectParentGrid,
            topJUI.language.message.icon.warning
        );
    }
}

//编辑表格数据
function editHandler(options) {
    var controllerUrl = getUrl("controller");
    var defaults = {
        gridId: 'datagrid',
        //dialogId      : 'editDialog',
        dialogHref: options.dialogHref ? options.dialogHref : controllerUrl + "edit",
        dialogUrl: options.dialogUrl ? options.dialogUrl : controllerUrl + "getDetailByUuid?uuid={uuid}"
    }
    options = $.extend(defaults, options);

    loadDialogData(options);
}

/**
 * 在复选框被选中的时候返回所有行
 * @param gridType
 * @param gridId
 * @returns {jQuery}
 */
function getCheckedRowsData(gridType, gridId) {
    return $("#" + gridId).treegrid('getChecked');
}

/**
 * 获得选中的datagrid或treegrid一行数据
 * @param options
 * @returns {*}
 */
function getSelectedRowData(gridType, gridId) {
    return getRowsDataBySelected(gridType, gridId, false);
}

/**
 * 获得选中的datagrid或treegrid多行数据
 * @param options
 * @returns {*}
 */
function getSelectedRowsData(gridType, gridId) {
    return getRowsDataBySelected(gridType, gridId, true);
}

/**
 * 获得选中的datagrid或treegrid一行或多行数据
 * @param options
 * @returns {*}
 */
function getRowsDataBySelected(gridType, gridId, multiple) {
    var rows = multiple ? $("#" + gridId).datagrid('getSelections') : $("#" + gridId).datagrid('getSelected');
    /*
     var rows;
     if (gridType == "datagrid") {
     rows = multiple ? $("#" + gridId).datagrid('getSelections') : $("#" + gridId).datagrid('getSelected');
     } else if (gridType == "treegrid") {
     rows = multiple ? $("#" + gridId).treegrid('getSelections') : $("#" + gridId).treegrid('getSelected');
     }
     */
    return rows;
}

function getRowsDataBySelected2(options, multiple) {
    var rows;
    var gridId;

    if (typeof options.parentGrid == "object") {
        gridId = options.parentGrid.id;
        if (options.parentGrid.type == "datagrid") {
            rows = multiple ? $("#" + gridId).datagrid('getSelections') : $("#" + gridId).datagrid('getSelected');
        } else if (options.parentGrid.type == "treegrid") {
            rows = multiple ? $("#" + gridId).treegrid('getSelections') : $("#" + gridId).treegrid('getSelected');
        }
    } else if (typeof options.grid == "object") {
        gridId = options.grid.id;
        if (options.grid.type == "datagrid") {
            rows = multiple ? $("#" + gridId).datagrid('getSelections') : $("#" + gridId).datagrid('getSelected');
        } else if (options.grid.type == "treegrid") {
            rows = multiple ? $("#" + gridId).treegrid('getSelections') : $("#" + gridId).treegrid('getSelected');
        }
    }
    return rows;
}

/**
 * 刷新多个表格
 * @param gridObj
 */
function refreshGrids(gridObj) {
    // 重新加载Grid数据
    if (typeof gridObj == 'object') {
        for (var i = 0; i < gridObj.length; i++) {
            var obj = gridObj[i];
            // 通过闭包嵌套和不同时序的执行来刷新grid
            (function (i) {
                setTimeout(function () {
                    refreshGrid(obj.type, obj.id, obj.clearQueryParams);
                }, i * 100);
            })(i);
        }
    }
}

/**
 * 刷新一个datagrid或treegrid
 * @param options
 */
function refreshGrid(gridType, gridId, clearQueryParams) {
    if (gridType == "datagrid") {
        if (clearQueryParams == true) {
            $("#" + gridId).datagrid({
                queryParams: {
                    clearQueryParams: ''
                }
            });
        }
        $("#" + gridId).datagrid('reload');
        $("#" + gridId).datagrid('unselectAll');
    } else if (gridType == "treegrid") {
        // 刷新整合表格
        //$("#" + options.treegrid.id).treegrid('reload');
        // 只刷新当前节点
        $("#" + gridId).treegrid('reload');
        $("#" + gridId).treegrid('unselectAll');
    }
}

/**
 * Ajax操作
 * @param options
 */
function doAjaxHandler(options) {
    var defaults = {
        gridId: 'datagrid',
        comfirmMsg: "确定要执行该操作吗？"
    }
    options = $.extend(defaults, options);
    // 权限控制
    if (!authCheck(options.url)) return;
    options.url = appendSourceUrlParam(options.url);

    // 替换父表的占位数据
    if (options.url.indexOf("{parent") != -1) {
        var parentRow = getSelectedRowData(options.parentGrid.type, options.parentGrid.id);
        if (!parentRow) {
            $.messager.alert(
                topJUI.language.message.title.operationTips,
                topJUI.language.message.msg.selectParentGrid,
                topJUI.language.message.icon.warning
            );
            return;
        }
        options.url = replaceUrlParamValueByBrace(options.url, parentRow, "parent");
    }

    // 替换本表的占位数据
    var rows = getCheckedRowsData(options.grid.type, options.grid.id);
    if (rows.length == 0) {
        $.messager.alert(
            topJUI.language.message.title.operationTips,
            topJUI.language.message.msg.checkSelfGrid,
            topJUI.language.message.icon.warning
        );
        return;
    }
    // 替换本表中选择的单行字段值
    options.url = replaceUrlParamValueByBrace(options.url, rows);

    $.messager.confirm(
        topJUI.language.message.title.confirmTips,
        options.comfirmMsg,
        function (flag) {
            if (options.grid.param == undefined)
                options.grid.param = {uuid: 'uuid'};
            options.ajaxData = convertParamObj2ObjData(options.grid.param, rows);
            if (flag && doAjax(options)) {
                refreshGrid(options.grid.type, options.grid.id);
            }
        });
}

/**
 * 删除表格数据
 * @param options
 */
function deleteHandler(options) {
    // 权限控制
    var oriUrl = options.url ? options.url : getUrl("controller") + "delete"
    if (!authCheck(oriUrl)) return;

    var defaults = {
        gridId: 'datagrid',
        url: options.url ? appendSourceUrlParam(options.url) : getUrl("controller") + "delete" + location.search
    }
    options = $.extend(defaults, options);

    var rows = getCheckedRowsData(options.grid.type, options.grid.id);
    if (rows.length == 0) {
        $.messager.alert(
            topJUI.language.message.title.operationTips,
            topJUI.language.message.msg.checkSelfGrid,
            topJUI.language.message.icon.warning
        );
        return;
    }
    $.messager.confirm(
        topJUI.language.message.title.confirmTips,
        topJUI.language.message.msg.confirmDelete,
        function (flag) {
            if (flag) {
                options.ajaxData = {
                    uuid: getMultiRowsFieldValue(rows, "uuid"),
                    uuids: getMultiRowsFieldValue(rows, "uuid")
                };

                if (doAjax(options)) {
                    refreshGrid(options.grid.type, options.grid.id);
                }
            }
        });
}

/**
 * 过滤表格数据
 * @param options
 */
function filterHandler(options) {
    //console.log($(".l-btn-text").index($(".l-btn-text:contains('查询')")));
    var gridId;
    if (typeof options.grid == "object") {
        options.filterOption = [];
        if (options.grid.type == "datagrid") {
            gridId = options.grid.id;
            if ($(".datagrid-filter-row").length > 0) {
                $("#" + gridId).datagrid('disableFilter', options.filterOption);
                //$(".l-btn-text:contains('隐藏'):eq(1)").text("查询");
            } else {
                $("#" + gridId).datagrid('enableFilter', options.filterOption);
                //$(".l-btn-text:contains('查询'):eq(1)").text("隐藏");
            }
        } else if (options.grid.type == "treegrid") {
            gridId = options.grid.id;
            if ($(".datagrid-filter-row").length > 0) {
                $("#" + gridId).treegrid('disableFilter', options.filterOption);
                //$(".l-btn-text:contains('隐藏'):eq(1)").text("查询");
            } else {
                $("#" + gridId).treegrid('enableFilter', options.filterOption);
                //$(".l-btn-text:contains('查询'):eq(1)").text("隐藏");
            }
        }
    }
}

/**
 * 高级查询表格数据
 * @param options
 */
function searchHandler(options) {
    if (typeof options.grid == "object") {
        getColumnsNameAndField(options.grid.type, options.grid.id);

        var dialogObj = $("#advanceSearchDialog");
        dialogObj.dialog({
            title: '高级查询',
            iconCls: 'icon-find',
            toolbar: '#searchHandler-toolbar',
            buttons: '#searchHandler-buttons'
        });

        dialogObj.dialog('open');
    }
}

/**
 * 导入表格数据
 * @param options
 */
function importHandler(options) {
    if (typeof options.grid == "object") {
        getColumnsNameAndField(options.grid.type, options.grid.id);

        var dialogObj = $("#importExcelDialog");
        dialogObj.dialog({
            title: '导入Excel数据',
            iconCls: 'icon-find',
            toolbar: '#importDialog-toolbar',
            buttons: '#importDialog-buttons'
        });

        dialogObj.dialog('open');
    }
}

/**
 * 获得grid的中文列名及字段名
 * @param gridType
 * @param gridId
 */
function getColumnsNameAndField(gridType, gridId) {
    var frozenFieldName = [];
    var liveFieldName = [];
    var fieldName = [];
    var colName = [];

    if (gridType == "datagrid") {
        frozenFieldName = $("#" + gridId).datagrid('getColumnFields', true);
        liveFieldName = $("#" + gridId).datagrid('getColumnFields');
        fieldName = frozenFieldName.concat(liveFieldName);
        for (var i = 0; i < fieldName.length; i++) {
            var col = $("#" + gridId).datagrid("getColumnOption", fieldName[i]);
            colName.push(col.title);
        }
    } else if (gridType == "treegrid") {
        frozenFieldName = $("#" + gridId).treegrid('getColumnFields', true);
        liveFieldName = $("#" + gridId).treegrid('getColumnFields');
        fieldName = frozenFieldName.concat(liveFieldName);
        for (var j = 0; j < fieldName.length; j++) {
            var col = $("#" + gridId).treegrid("getColumnOption", fieldName[j]);
            colName.push(col.title);
        }
    }

    var colNameStr = colName.join(',').replace("UUID,", "").replace(/,操作/g, "").replace(/操作,/g, "");
    var fieldNameStr = fieldName.join(',').replace("UUID,", "").replace("uuid,", "").replace(/,handle/g, "").replace(/handle,/g, "");

    $.cookie('gridId', gridId);
    $.cookie('gridType', gridType);
    $.cookie('colNameStr', colNameStr);
    $.cookie('fieldNameStr', fieldNameStr);
}

/**
 * 导出表格数据
 * @param options
 */
function exportHandler(options) {
    var controllerUrl = getUrl("controller");
    var defaults = {
        gridId: 'datagrid',
        url: '/system/index/requestSuccess',
        excelTitle: parent.$('#index_tabs').tabs('getSelected').panel('options').title + "_导出数据_" + getCurrentDatetime("YmdHis"),
        exportUrl: options.exportUrl ? options.exportUrl : controllerUrl + "exportExcel"
    }
    options = $.extend(defaults, options);

    // 权限控制
    if (!authCheck(options.exportUrl)) return;

    var gridId;
    var frozenFieldName;
    var liveFieldName;
    var fieldName;
    var columnOption;
    var colName = [];
    var hiddenMark = [];

    if (typeof options.grid == "object") {
        gridId = options.grid.id;
        if (options.grid.type == "datagrid") {
            frozenFieldName = $("#" + gridId).datagrid('getColumnFields', true);
            liveFieldName = $("#" + gridId).datagrid('getColumnFields');
            fieldName = frozenFieldName.concat(liveFieldName);
            for (var i = 0; i < fieldName.length; i++) {
                columnOption = $("#" + gridId).datagrid("getColumnOption", fieldName[i]);
                colName.push(columnOption.title);
                if (columnOption.hidden == true || columnOption.checkbox == true)
                    hiddenMark.push(true);
                else
                    hiddenMark.push(false);
            }
        } else if (options.grid.type == "treegrid") {
            frozenFieldName = $("#" + gridId).treegrid('getColumnFields', true);
            liveFieldName = $("#" + gridId).treegrid('getColumnFields');
            fieldName = frozenFieldName.concat(liveFieldName);
            for (var j = 0; j < fieldName.length; j++) {
                columnOption = $("#" + gridId).treegrid("getColumnOption", fieldName[j]);
                colName.push(columnOption.title);
                if (columnOption.hidden == true || columnOption.checkbox == true)
                    hiddenMark.push(true);
                else
                    hiddenMark.push(false);
            }
        }
    }

    // 去除隐藏的列
    for (var h = 0; h < hiddenMark.length; h++) {
        if (hiddenMark[h]) {
            colName.splice(h, 1);
            fieldName.splice(h, 1);
            hiddenMark.splice(h, 1);
            h--;
        }
    }

    var colNameStr = colName.join(',').replace(/,操作/g, "").replace(/操作,/g, "");
    var fieldNameStr = fieldName.join(',').replace(/,handle/g, "").replace(/handle,/g, "");

    options.ajaxData = {
        excelTitle: options.excelTitle,
        colName: colNameStr,
        fieldName: fieldNameStr
    };

    if (doAjax(options)) {
        window.location.href = options.exportUrl + '?excelTitle=' + options.excelTitle + '&colName=' + colNameStr + '&fieldName=' + fieldNameStr;
    }
}


//撤销表格数据
function redoHandler() {
    $(options.gridId).datagrid('rejectChanges');
    $(options.gridId).datagrid('unselectAll');
}

// ajax操作
function doAjax(options) {
    var result = false;

    var defaults = {
        //confirmMsg: '确定要进行该操作吗？'
    }
    options = $.extend(defaults, options);

    $.ajax({
        //url: options.url + location.search,
        url: options.url,
        type: 'post',
        data: options.ajaxData,
        dataType: "json",
        async: false,
        contentType: "application/x-www-form-urlencoded;charset=utf-8",
        beforeSend: function () {
            $.messager.progress({text: '正在操作...'});
        },
        success: function (data, response, status) {
            $.messager.progress('close');
            showMessage(data);

            // 重新加载指定的Grid数据
            refreshGrids(options.reload);

            if (data.statusCode == 1 || data.statusCode == 100 || data.statusCode == 200) {
                result = true;
            } else {
                result = false;
            }
        }
    });

    return result;
}

/**
 * 设置对话框href附加参数及值
 * @param dialogId
 */
function setDialogHrefKeyValue(dialogId, paramStr, paramValueStr) {

    var paramArr = paramStr.split(",");
    var paramValueArr = paramValueStr.split(",");

    var dialogHref = $(dialogId).dialog('options').href;
    var keyValue = "";
    for (i = 0; i < paramArr.length; i++) {
        if (dialogHref.indexOf("?") > 0) {
            if (dialogHref.indexOf(paramArr[i] + "=" + paramValueArr[i]) == -1) {
                keyValue += "&" + paramArr[i] + "=" + paramValueArr[i];
            }
        } else {
            if (i == 0) {
                keyValue = "?" + paramArr[i] + "=" + paramValueArr[i];
            } else {
                keyValue += "&" + paramArr[i] + "=" + paramValueArr[i];
            }

        }
    }
    $(dialogId).dialog('options').href = dialogHref + keyValue;
}

function clearDialogHrefKeyValue(dialogId, paramStr) {

    var paramArr = paramStr.split(",");
    var dialogHref = $(dialogId).dialog('options').href;
    if (dialogHref.indexOf("?") > 0) {
        var newUrlParam = ""
        var urlMain = dialogHref.substring(0, dialogHref.indexOf("?") + 1);
        var urlParam = dialogHref.substring(dialogHref.indexOf("?") + 1);
        var urlParamArray = urlParam.split("&");
        for (i = 0; i < urlParamArray.length; i++) {
            for (j = 0; j < paramArr.length; j++) {
                if (urlParamArray[i].indexOf(paramArr[j] + "=") >= 0) {
                    urlParamArray.remove(i);
                }
            }
        }
        if (urlParamArray.length == 1) {
            newUrlParam = urlParamArray[0];
        } else if (urlParamArray.length > 1) {
            newUrlParam = urlParamArray.join("&");
        }

        var newUrl = "";
        newUrl = urlMain + newUrlParam;
        var lastStr = newUrl.substring(newUrl.length - 1);
        if (lastStr == "?") {
            newUrl = newUrl.substring(0, newUrl.length - 1);
        }

    } else {
        newUrl = dialogHref;
    }

    $(dialogId).dialog('options').href = newUrl;
}

// 表单提交返回提示信息判断
// msgCode为1或200时，右下弹出自动关闭提示
// msgCode为100时，中间弹出手动关闭提示
function msgFn(data) {
    var msgJson = {};
    var msgCode = "";
    if (typeof(data) == "object") {
        msgCode = data.code;
        msgJson = {
            title: data.title,
            msg: data.message
        };
    } else {
        msgCode = data;
        if (data == 1) {
            msgJson = {
                title: '温馨提示',
                msg: '操作成功'
            };
        } else {
            msgJson = {
                title: '温馨提示',
                msg: '操作失败！未知错误，请重试！'
            };
        }
    }
    if (msgCode == 1 || msgCode == 100 || msgCode == 200) {
        if (msgCode == 1 || msgCode == 200)
            $.messager.show(msgJson);
        else
            $.messager.alert(msgJson);
        //$(options.currentDialogId).dialog('close').form('reset');
        //$(options.gridId).datagrid('reload');

        /*if(options.refreshTreeId) {
         var node = $(options.refreshTreeId).tree('getSelected');
         var parentNode = $(options.refreshTreeId).tree('getParent', node.target);
         $(options.refreshTreeId).tree('reload', parentNode.target);
         //$(options.refreshTreeId).tree('reload', node.target);
         }*/

    } else {
        $.messager.alert(msgJson);
    }
}

function showMessage(data) {
    var messageJson = {};
    var statusCode = "";
    if (typeof(data) == "object") {
        statusCode = data.statusCode;
        messageJson = {
            title: data.title,
            msg: data.message
        };
    } else {
        statusCode = data;
        if (data == 1) {
            messageJson = {
                title: '操作提示',
                msg: '操作成功'
            };
        } else {
            messageJson = {
                title: '操作提示',
                msg: '操作失败！'
            };
        }
    }

    if (statusCode == 1 || statusCode == 100 || statusCode == 200) {
        if (statusCode == 1 || statusCode == 200) {
            //showMask();
            //setTimeout(hideMask, 1000);
            messageJson.timeout = 1000;
            $.messager.show(messageJson); //状态码为1和200时，右下角弹出操作成功提示框
        } else {
            $.messager.alert(messageJson); //状态码为100时，屏幕中央弹出操作成功提示框
        }
    } else {
        $.messager.alert(messageJson);  //状态码为300时，屏幕中央弹出操作失败提示框
    }
}

/**
 * 替换url中的{}占位符值
 * @param url
 * @param dataObj
 * @param prefix
 * @returns {*}
 */
function replaceUrlParamValueByBrace(url, dataObj, prefix) {
    var newUrl = url;
    if (url && url.indexOf("{") >= 0) {

        // 如果是多维对象，则取第一条记录，用于替换选中的单选记录值
        var newDataObj = isMultiObj(dataObj) ? dataObj[0] : dataObj;

        // var regExp = /{([\s\S]*?)}/g;
        var newPrefix = isNull(prefix) ? "" : prefix + ".";
        var regExp = new RegExp("{" + newPrefix + "(.*?)}", "g");
        var paramArr = url.match(regExp);
        if (paramArr.length > 0) {
            for (var i = 0; i < paramArr.length; i++) {
                var field = paramArr[i].replace("{" + newPrefix, "").replace("}", "");
                if (prefix == "multiple") {
                    newUrl = newUrl.replace(paramArr[i], getMultiRowsFieldValue(dataObj, field));
                } else {
                    newUrl = newUrl.replace(paramArr[i], newDataObj[field]);
                }
            }
        }
    }
    return newUrl;
}

function convertParamValue2Object(url, dataObj, prefix) {
    var newUrl = url;
    if (url && url.indexOf("{") >= 0) {
        var obj = {};
        // 如果是多维对象，则取第一条记录，用于替换选中的单选记录值
        var newDataObj = isMultiObj(dataObj) ? dataObj[0] : dataObj;

        // var regExp = /{([\s\S]*?)}/g;
        var newPrefix = isNull(prefix) ? "" : prefix + ".";
        var regExp = new RegExp("{" + newPrefix + "(.*?)}", "g");
        var paramArr = url.match(regExp);
        if (paramArr.length > 0) {
            for (var i = 0; i < paramArr.length; i++) {
                var field = paramArr[i].replace("{" + newPrefix, "").replace("}", "");
                if (prefix == "multiple") {
                    obj[field] = newUrl.replace(paramArr[i], getMultiRowsFieldValue(dataObj, field));
                } else {
                    obj[field] = newUrl.replace(paramArr[i], newDataObj[field]);
                }
            }
        }
    }
    return obj;
}

/**
 * 根据传递过来的paramObj，替换其中对应的值
 * @param paramObj
 * @param dataObj
 * @returns {{}} 返回带实际值的对象数据
 */
function convertParamObj2ObjData(paramObj, dataObj) {
    var obj = {};
    var param, field;
    for (param in paramObj) {
        field = paramObj[param];
        if (isMultiObj(dataObj)) {
            obj[param] = getMultiRowsFieldValue(dataObj, field);
        } else {
            obj[param] = "'" + dataObj[field] + "'";
        }
    }
    return obj;
}

/**
 * 根据选中的多行记录，获得多行记录的以逗号分隔的某个字段值组合
 * @param rowsData
 * @param field
 * @returns {string}
 */
function getMultiRowsFieldValue(rowsData, field) {
    var fieldArr = [];
    for (var i = 0; i < rowsData.length; i++) {
        fieldArr.push("'" + rowsData[i][field] + "'");
    }
    return fieldArr.join(',');
}

/**
 * 将表单数据序列化为json数据
 * $("#form").serializeObject();
 * @returns {{}}
 */
$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};