(function ($) {

    $.fn.iCombotree = function (options) {

        var defaults = {
            combotreeId: this.selector,
            url: ctx + '/system/codeItem/getListByCodesetidAndLevelid?codeSetId={codeSetId}&levelId={levelId}',
            expandUrl: ctx + '/system/codeItem/getListByPid?pid={pid}',
            getFatherIdsUrl: '',
            width: 153,
            height: 30,
            required: false,
            lines: true,
            multiple: false,
            checkbox: true,
            onlyLeafCheck: false,
            editable: false,
            readonly: false,
            animate: true,
            expandAll: false,
            onBeforeSelect: function (node) {
                if (options.onlyLeafCheck) {
                    // 判断是否是叶子节点
                    var isLeaf = $(this).tree('isLeaf', node.target);
                    if (!isLeaf) {
                        $.messager.alert('提示操作！', '请展开选择子节点！', 'warning');
                        // 返回false表示取消本次选择操作
                        return false;
                    }
                }
            }
        }

        var options = $.extend(defaults, options);

        if (options.url.indexOf("codeSetId") == -1) {
            if (options.url.indexOf("?") == -1) {
                options.url = options.url + "?codeSetId=" + options.codeSetId + "&levelId=" + options.levelId;
            } else {
                options.url = options.url + "&codeSetId=" + options.codeSetId + "&levelId=" + options.levelId;
            }
        } else {
            options.url = options.url.replace("{codeSetId}", options.codeSetId).replace("{levelId}", options.levelId);
        }

        if (options.combotreeId == "") {
            options.combotreeId = $(this).context;
        }

        $combotreeObj = $(this);

        $combotreeObj.combotree({
            url: options.url,
            width: options.width,
            height: options.height,
            required: options.required,
            lines: options.lines,
            multiple: options.multiple,
            checkbox: options.checkbox,
            onlyLeafCheck: options.onlyLeafCheck,
            editable: options.editable,
            readonly: options.readonly,
            animate: options.animate,
            onBeforeExpand: function (node, param) {
                $(this).tree('options').url = replaceUrlParamValueByBrace(options.expandUrl, node);
            },
            onBeforeSelect: options.onBeforeSelect,
            onLoadSuccess: function (node, data) {
                var $treeObj = $(options.combotreeId).combotree('tree');

                // 展开根节点
                $treeObj.tree("expand", $treeObj.tree('getRoot').target);

                if (options.expandAll) {
                    $treeObj.tree("expandAll");
                }

                //setInterval(resetCombotree, 1000);
                if (options.getFatherIdsUrl) {
                    setTimeout(function () {
                        var n = $treeObj.tree('getSelected');
                        var dataObj = {id: $(options.combotreeId).combotree("getValue")};
                        if (n == undefined && dataObj.id != "") {
                            var findNode;
                            $.ajax({
                                type: "POST",
                                url: replaceUrlParamValueByBrace(options.getFatherIdsUrl, dataObj),
                                //data : {"codeSetId":options.codeSetId, "id":id, "levelId":0},
                                success: function (data) {
                                    //$(options.combotreeId).combotree('tree').tree("collapseAll");
                                    var fatherIdsArray = data.split(",");
                                    for (i = fatherIdsArray.length - 1; i >= 0; i--) {
                                        findNode = $(options.combotreeId).combotree('tree').tree('find', fatherIdsArray[i].replace(/'/g, ""));
                                        if (findNode) {
                                            $(options.combotreeId).combotree('tree').tree('expand', findNode.target);
                                        }
                                    }
                                }
                            });
                            $(options.combotreeId).combotree('setValue', dataObj.id);//数据加载完毕可以设置值了
                        }
                    }, 200);
                }
            },
            onSelect: function (node) {
                /*if (options.param) {
                 var dialogIdArr = options.dialog.id.split(",");
                 for (var i = 0; i < dialogIdArr.length; i++) {
                 var jsonData = getSelectedRowJson(options.param, node);
                 getTabWindow().$("#" + dialogIdArr[i]).form('load', jsonData);
                 }
                 }*/
                if (options.param) {
                    var $formObj = $combotreeObj.closest('form');
                    var jsonData = getSelectedRowJson(options.param, node);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                }
            },
            onShowPanel: function () {
                /*$(options.combotreeId).combotree('tree').tree("collapseAll");
                 var currentNode = $(options.combotreeId).combotree('tree').tree("getSelected");
                 if(currentNode) {
                 $(options.combotreeId).combotree('tree').tree("expandTo", currentNode.target);
                 }*/
            },
            onChange: options.onChange
        });

        function resetCombotree() {
            var t = $(options.combotreeId).combotree('tree');
            var n = t.tree('getSelected');
            var id = $(options.combotreeId).combotree("getValue");
            if (n == undefined && id != "") {
                var findNode;
                $.ajax({
                    type: "POST",
                    url: ctx + "/system/codeItem/getFatherIds",
                    data: {"codeSetId": options.codeSetId, "id": id, "levelId": 0},
                    success: function (data) {
                        $(options.combotreeId).combotree('tree').tree("collapseAll");
                        var fatherIdsArray = data.split(",");
                        for (i = 0; i < fatherIdsArray.length; i++) {
                            findNode = $(options.combotreeId).combotree('tree').tree('find', fatherIdsArray[i]);
                            if (findNode) {
                                $(options.combotreeId).combotree('tree').tree('expand', findNode.target);
                            }
                        }
                    }
                });
                $(options.combotreeId).combotree('setValue', id);//数据加载完毕可以设置值了
            }

        }

    }

})(jQuery);;function getTabWindow() {
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
                    topJUI.language.message.msg.selectSelfGrid,
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
 * 打开新窗口
 * @param options
 */
openWindow = function (options) {
    var href;
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
        } else {
            var row = getSelectedRowData(options.grid.type, options.grid.id);
            if (!row) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    topJUI.language.message.msg.selectSelfGrid,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            href = replaceUrlParamValueByBrace(options.href, row);
        }
    } else {
        href = options.href;
    }
    window.open(href);
}

/**
 * 绑定按钮点击事件
 * @param options
 */
function bindMenuClickEvent($element, options) {
    if (typeof options.grid != "object") {
        var toolbarOptions = getOptionsJson($element.closest("div"));
        options = $.extend(options, toolbarOptions);
    }
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
        dialogDom = '<form data-toggle="topjui-dialog" data-options="id:\'' + options.dialog.id + '\',href:\'' + options.dialog.href + '\',url:\'' + options.dialog.url + '\',title:\'' + options.dialog.title + '\',beforeOpenCheckUrl:\'' + options.dialog.beforeOpenCheckUrl + '\'' + extendDoc + '"></form>';

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
                    maximized: options.dialog.maximized,
                    maximizable: options.dialog.maximizable,
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
    } else if (options.clickEvent == "openWindow") {
        defaults = {
            iconCls: 'icon-add'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            openWindow(options);
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
        maximized: options.dialog.maximized,
        maximizable: options.dialog.maximizable,
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
        $dialogObj.dialog({
            href: newHref
        });
        $dialogObj.dialog('open');
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
        maximized: options.dialog.maximized,
        maximizable: options.dialog.maximizable,
        left: options.dialog.leftMargin,
        top: options.dialog.topMargin,
        buttons: options.dialog.buttons
    });

    // 保存原始url，以便在占位参数替换后还原
    var oriHref = options.dialog.href;
    if (options.dialog.href.indexOf("{") != -1) {
        // 替换本表中选中行占位值
        var newHref = replaceUrlParamValueByBrace(appendSourceUrlParam(oriHref), row);
        $dialogObj.dialog({
            href: newHref
        });
        //$dialogObj.dialog('open').dialog("refresh", newHref); //加载两次href指定的页面
        $dialogObj.dialog('open');
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
                $("#" + gridId).datagrid('disableFilter');
                //$(".l-btn-text:contains('隐藏'):eq(1)").text("查询");
            } else {
                $("#" + gridId).datagrid('enableFilter', options.filterOption);
                //$(".l-btn-text:contains('查询'):eq(1)").text("隐藏");
            }
        } else if (options.grid.type == "treegrid") {
            gridId = options.grid.id;
            if ($(".datagrid-filter-row").length > 0) {
                $("#" + gridId).treegrid('disableFilter');
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
            buttons: '#searchHandler-buttons',
            height: 250
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
};;
var topJUI = {
    eventType: {
    	//initUI     : 'topjui.initForm',         // When document load completed or ajax load completed, B-JUI && Plugins init 
        initUI         : {
        	base : 'topjui.initUI.base',
            dialog : 'topjui.initUI.dialog',
            base2 : 'topjui.initUI.base2',
            echarts : 'topjui.initUI.echarts',
        	form : 'topjui.initUI.form',
        	advanceSearchForm : 'topjui.initUI.advanceSearchForm',
            importExcelForm : 'topjui.initUI.importExcelForm'
    	},
        beforeInitUI   : 'topjui.beforeInitUI',   // If your DOM do not init [add to DOM attribute 'data-noinit="true"']
        afterInitUI    : 'topjui.afterInitUI',    // 
        ajaxStatus     : 'topjui.ajaxStatus',     // When performing ajax request, display or hidden progress bar
        resizeGrid     : 'topjui.resizeGrid',     // When the window or dialog resize completed
        beforeAjaxLoad : 'topjui.beforeAjaxLoad', // When perform '$.fn.ajaxUrl', to do something...
        
        beforeLoadNavtab  : 'topjui.beforeLoadNavtab',
        beforeLoadDialog  : 'topjui.beforeLoadDialog',
        afterLoadNavtab   : 'topjui.afterLoadNavtab',
        afterLoadDialog   : 'topjui.afterLoadDialog',
        beforeCloseNavtab : 'topjui.beforeCloseNavtab',
        beforeCloseDialog : 'topjui.beforeCloseDialog',
        afterCloseNavtab  : 'topjui.afterCloseNavtab',
        afterCloseDialog  : 'topjui.afterCloseDialog'
    },
    language: {
        message : {
            title : {
                operationTips: "操作提示",
                confirmTips: "确认提示"
            },
            msg : {
                success : "操作成功",
                failed : "操作失败",
                error : "未知错误",
                checkSelfGrid : "请先勾选中要操作的数据前的复选框",
                selectSelfGrid : "请先选中要操作的数据",
                selectParentGrid : "请先选中主表中要操作的一条数据",
                permissionDenied : "对不起，你没有操作权限",
                confirmDelete : "你确定要删除所选的数据吗？"
            },
            icon : {
                error : "error",
                question : "question",
                info : "info",
                warning : "warning"
            }
        }
    }
}

;(function ($) {
    $.fn.iDatagrid = function (options) {
        var defaults = {
            //datagridId       : element.get(0).id,
            datagridId: this.selector,
            width: '100%',
            height: '100%',
            autoRowHeight: false,
            nowrap: true,
            fit: true,
            fitColumns: false,
            border: false,
            striped: true,
            singleSelect: true,
            url: "",
            toolbar: this.selector + "-toolbar",
            columns: [[{field: 'uuid', title: 'UUID', align: 'center'},
                {field: 'title', title: '标题', align: 'left'},
                {field: 'creator', title: '发布人', align: 'center'},
                {field: 'createTime', title: '发布时间', align: 'center'}]],
            sortName: "createTime",
            sortOrder: "desc",
            //toolbar          : this.selector + 'Toolbar',
            addButton: true,
            editButton: true,
            deleteButton: true,
            searchButton: true,
            addDialogTitle: '新增',
            editDialogTitle: '编辑',
            loadMsg: "数据加载中,请稍后...",
            rownumbers: true,
            pagination: true,
            pageNumber: 1,
            pageSize: 20,
            pageList: [20, 30, 40, 50, 100, 200],
            editable: true,
            queryFormId: "",      // search form id
            queryAction: "",      // search from action
            infoFormId: "",      // info form id
            infoAddAction: "",    	// info data add action
            infoUpdateAction: "", 		// info update action
            infoDlgDivId: "",     	// info data detail/edit dlg div id
            deleteAction: "",     	// data delete action  from ajax
            deleteMsg: "",      // show the message before do delete
            moveDlgDivId: "",     	// the div id of dialog for move show
            moveFormId: "",      // the form id for move
            moveTreeId: "",      // the combotree id for move
            queryParams: {},      // search params name for post, must to be {}
            queryParamsVCN: {},   	// search params value from htmlcontrol name, must to be {}
            checkOnSelect: false,
            selectOnCheck: false,
            kindEditor: [],
            addDialogId: '#editDialog',
            editDialogId: '#editDialog',
            gridParam: 'uuid'
        }

        var options = $.extend(defaults, options);

        var controllerUrl = getUrl('controller');
        options.url = options.url ? options.url : controllerUrl + "getPageSetData";
        options.getDetailUrl = options.getDetailUrl ? options.getDetailUrl : controllerUrl + "getDetailByUuid";
        options.addDialogHref = options.addDialogHref ? options.addDialogHref : controllerUrl + "add";
        options.saveUrl = options.saveUrl ? options.saveUrl : controllerUrl + "save";
        options.editDialogHref = options.editDialogHref ? options.editDialogHref : controllerUrl + "edit";
        options.updateUrl = options.updateUrl ? options.updateUrl : controllerUrl + "update";
        options.deleteUrl = options.deleteUrl ? options.deleteUrl : controllerUrl + "delete";

        $(this).datagrid({
            filterBtnIconCls: 'icon-filter',
            remoteFilter: true,
            width: options.width,
            height: options.height,
            autoRowHeight: options.autoRowHeight,
            nowrap: options.nowrap,
            striped: options.striped,
            singleSelect: options.singleSelect,
            url: appendSourceUrlParam(options.url),
            toolbar: options.toolbar,
            //queryParams : {},
            loadMsg: options.loadMsg,
            rownumbers: options.rownumbers,
            pagination: options.pagination,
            paginPosition: 'bottom',
            pageNumber: options.pageNumber,
            pageSize: options.pageSize,
            pageList: options.pageList,
            frozenColumns: options.frozenColumns,
            columns: options.columns,
            sortName: options.sortName,
            sortOrder: options.sortOrder,
            fit: options.fit,
            fitColumns: options.fitColumns,
            border: options.border,
            checkOnSelect: options.checkOnSelect,
            selectOnCheck: options.selectOnCheck,
            //bodyCls : "leftBottomBorder",
            onBeforeLoad: function (param) {

            },
            onLoadSuccess: function () {
                //$(this).datagrid("fixRownumber");
                if (typeof options.childGrid == "object") {
                    var refreshGridIdArr = options.childGrid.grid;
                    for (var i = 0; i < refreshGridIdArr.length; i++) {
                        var syncReload =  refreshGridIdArr[i].syncReload;
                        if(syncReload){
                            var $grid = $("#" + refreshGridIdArr[i].id);
                            if (refreshGridIdArr[i]["type"] == "datagrid") {
                                $grid.datagrid('load');
                            } else if (refreshGridIdArr[i].type == "treegrid") {
                                $grid.treegrid('load');
                            }
                        }
                    }
                }
            },
            onClickRow: function (index, row) {
                //传递给要刷新表格的参数
                if (typeof options.childGrid == "object") {
                    var newQueryParams = {};
                    newQueryParams = getSelectedRowJson(options.childGrid.param, row);

                    var refreshGridIdArr = options.childGrid.grid;
                    for (var i = 0; i < refreshGridIdArr.length; i++) {
                        // 通过闭包嵌套和不同时序的执行来刷新grid
                        (function (i) {
                            setTimeout(function () {
                                var $grid = $("#" + refreshGridIdArr[i].id);
                                if (refreshGridIdArr[i]["type"] == "datagrid") {
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
                                    var href = replaceUrlParamValueByBrace(refreshGridIdArr[i].href, newQueryParams);
                                    $grid.panel('refresh', href);
                                }
                            }, i * 100);
                        })(i);
                    }
                }

                if (typeof options.childTabs == "object") {
                    var $tabsElement = $('#'+options.childTabs.id);
                    var $tabsOptions = $tabsElement.tabs('options');
                    var index = $tabsElement.tabs('getTabIndex',$tabsElement.tabs('getSelected'));
                    var tabsComponent = $tabsOptions.component;
                    var $element = $("#" + tabsComponent[index].id);

                    var newQueryParams = {};

                    newQueryParams = getSelectedRowJson(options.childTabs.param, row);

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
                        $element.panel('refresh', newHref);
                    }
                }
            }

        });

        //$(this).datagrid('disableFilter', options.filterOption);

        //重新加载datagrid的数据
        //$(this).datagrid('reload');

    }

    /**
     * @author 小策一喋
     * @requires jQuery,EasyUI
     * 为datagrid、treegrid增加表头菜单，用于显示或隐藏列，注意：冻结列不在此菜单中
     */
    var createGridHeaderContextMenu = function (e, field) {
        e.preventDefault();
        var grid = $(this);
        /* grid本身 */
        var headerContextMenu = this.headerContextMenu;
        /* grid上的列头菜单对象 */
        var okCls = 'tree-checkbox1'; // 选中
        var emptyCls = 'tree-checkbox0'; // 取消
        if (!headerContextMenu) {
            var tmenu = $('<div style="width:150px;"></div>').appendTo('body');
            var fields = grid.datagrid('getColumnFields');
            for (var i = 0; i < fields.length; i++) {
                var fieldOption = grid.datagrid('getColumnOption', fields[i]);
                if (!fieldOption.hidden) {
                    $('<div iconCls="' + okCls + '" field="' + fields[i] + '"/>').html(fieldOption.title).appendTo(tmenu);
                } else {
                    $('<div iconCls="' + emptyCls + '" field="' + fields[i] + '"/>').html(fieldOption.title).appendTo(tmenu);
                }
            }
            headerContextMenu = this.headerContextMenu = tmenu.menu({
                onClick: function (item) {
                    var field = $(item.target).attr('field');
                    if (item.iconCls == okCls) {
                        grid.datagrid('hideColumn', field);
                        $(this).menu('setIcon', {
                            target: item.target,
                            iconCls: emptyCls
                        });
                    } else {
                        grid.datagrid('showColumn', field);
                        $(this).menu('setIcon', {
                            target: item.target,
                            iconCls: okCls
                        });
                    }
                    headerContextMenu.menu('show');
                }
            });
        }
        headerContextMenu.menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    };
    $.fn.datagrid.defaults.onHeaderContextMenu = createGridHeaderContextMenu;
    $.fn.treegrid.defaults.onHeaderContextMenu = createGridHeaderContextMenu;


})(jQuery);;(function($){
	
	$.fn.iDialog = function(options) {
		var defaults = {
			currentDialogId : this.selector,
			width   : 650,
			height  : 400,
			title   : '编辑',
			modal   : true,
			closed  : true,
			iconCls : 'icon-save',
			collapsible : true,
			maximizable : true,
			minimizable : false,
			maximized : false,
			resizable : true,
			openAnimation : 'show',
			openDuration : 100,
			closeAnimation : 'show',
			closeDuration : 400,
			toolbar : this.selector+'-toolbar',
			buttons : this.selector+'-buttons',
			postfix : 'Edit',
			combotreeFields : '',
			refreshTreeId : ''
		}
		var options = $.extend(defaults, options);
		
		var controllerUrl = getUrl('controller');
		options.href = options.href ? options.href + location.search : controllerUrl + "edit" + location.search;

		var $dialogObj = $("#"+options.id);
		$(this).dialog({
			width   : options.width,
			height  : options.height,
			title   : options.title,
			modal   : options.modal,
			closed  : options.closed,
			iconCls : options.iconCls,
			href 	: options.href,
			collapsible : options.collapsible,
			maximizable : options.maximizable,
			minimizable : options.minimizable,
			maximized : options.maximized,
			resizable : options.resizable,
			openAnimation : options.openAnimation,
			openDuration : options.openDuration,
			closeAnimation : options.closeAnimation,
			closeDuration : options.closeDuration,
			zIndex : 10,
			toolbar : options.toolbar,
			buttons : options.buttons,
			onBeforeOpen : function() {

			},
			onLoad : function() {
				$(this).trigger(topJUI.eventType.initUI.form);

				if(options.url.length > 1) {
					// 获取选中行的数据
					var row = getSelectedRowData(options.grid.type, options.grid.id);
					// 如果指定了数据来源URL，则通过URL加载数据
					var newDialogUrl = replaceUrlParamValueByBrace(options.url, row);
					$.getJSON(newDialogUrl, function(data) {
						$dialogObj.form('load', data);
						if(typeof options.editor == "string" || typeof options.editor == "object") {
							// kindeditor编辑器处理
							if (typeof options.editor == "string") {
								// 富文本编辑器字符串
								var ke = [], keObj = [];
								ke = options.editor.replace(/'/g, '"').split(",");
								for (var i = 0; i < ke.length; i++) {
									keObj.push(strToJson(ke[i]));
								}
							} else {
								// 富文本编辑数组
								keObj = options.editor;
							}
							for (var i = 0; i < keObj.length; i++) {
								var editorType = keObj[i]["type"];
								var editorId = keObj[i]["id"];
								var editorField = keObj[i]["field"];
								if(editorType == "kindeditor") {
									getTabWindow().$("iframe").each(function(i){
										this.contentWindow.document.body.innerHTML = html_decode(data[editorField]);
									});
								} else {
									UE.getEditor(editorId).ready(function () {
										UE.getEditor(editorId).setContent(data[editorField]);
									});
								}
							}
						}
					});
				} else {
					// 如果没有指定数据来源URL，则直接加载选中行的数据
					// $dialogObj.form('load', row); // 防止新增时也加载选中行的数据，暂时屏蔽
				}

				// 如果存在父表，则将父表中指定的字段数据加载到本窗口中
				if(typeof options.parentGrid == "object") {
					var parentRow = getSelectedRowData(options.parentGrid.type, options.parentGrid.id);
					var jsonData = getSelectedRowJson(options.parentGrid.param, parentRow);
					$dialogObj.form('load', jsonData);
				}
			},
			onClose : function() {
				$(options.currentDialogId).form('clear');
			}
	    });
		
		function showHiddenBtn(btn1, btn2, btn3, btn4, btn5, btn6){
			$(".dialog-button > a").each(function(i){
				switch(i%6) {
					case 0:
						btn1 ? $(this).show() : $(this).hide();
						break;
					case 1:
						btn2 ? $(this).show() : $(this).hide();
						break;
					case 2:
						btn3 ? $(this).show() : $(this).hide();
						break;
					case 3:
						btn4 ? $(this).show() : $(this).hide();
						break;
					case 4:
						btn5 ? $(this).show() : $(this).hide();
						break;
					case 5:
						btn6 ? $(this).show() : $(this).hide();
						break;
				}
			});
		}
		
	}

})(jQuery);;(function ($) {
    $.fn.iEdatagrid = function (options) {
        var defaults = {
            //datagridId       : element.get(0).id,
            datagridId: this.selector,
            width: '100%',
            height: '100%',
            autoRowHeight: false,
            nowrap: true,
            fit: true,
            fitColumns: false,
            border: false,
            striped: true,
            singleSelect: true,
            url: "",
            toolbar: this.selector + "-toolbar",
            columns: [[{field: 'uuid', title: 'UUID', align: 'center'},
                {field: 'title', title: '标题', align: 'left'},
                {field: 'creator', title: '发布人', align: 'center'},
                {field: 'createTime', title: '发布时间', align: 'center'}]],
            sortName: "createTime",
            sortOrder: "desc",
            //toolbar          : this.selector + 'Toolbar',
            addButton: true,
            editButton: true,
            deleteButton: true,
            searchButton: true,
            addDialogTitle: '新增',
            editDialogTitle: '编辑',
            loadMsg: "数据加载中,请稍后...",
            rownumbers: true,
            pagination: true,
            pageNumber: 1,
            pageSize: 20,
            pageList: [10, 20, 30, 40, 50, 100, 200, 300, 400, 500],
            editable: true,
            queryFormId: "",      // search form id
            queryAction: "",      // search from action
            infoFormId: "",      // info form id
            infoAddAction: "",    	// info data add action
            infoUpdateAction: "", 		// info update action
            infoDlgDivId: "",     	// info data detail/edit dlg div id
            deleteAction: "",     	// data delete action  from ajax
            deleteMsg: "",      // show the message before do delete
            moveDlgDivId: "",     	// the div id of dialog for move show
            moveFormId: "",      // the form id for move
            moveTreeId: "",      // the combotree id for move
            queryParams: {},      // search params name for post, must to be {}
            queryParamsVCN: {},   	// search params value from htmlcontrol name, must to be {}
            checkOnSelect: false,
            selectOnCheck: false,
            kindEditor: [],
            addDialogId: '#editDialog',
            editDialogId: '#editDialog',
            gridParam: 'uuid'
        }

        var options = $.extend(defaults, options);

        var controllerUrl = getUrl('controller');
        options.url = options.url ? options.url : controllerUrl + "getPageSetData";
        options.getDetailUrl = options.getDetailUrl ? options.getDetailUrl : controllerUrl + "getDetailByUuid";
        options.addDialogHref = options.addDialogHref ? options.addDialogHref : controllerUrl + "add";
        options.saveUrl = options.saveUrl ? options.saveUrl : controllerUrl + "save";
        options.editDialogHref = options.editDialogHref ? options.editDialogHref : controllerUrl + "edit";
        options.updateUrl = options.updateUrl ? options.updateUrl : controllerUrl + "update";
        options.destroyUrl = options.destroyUrl ? options.destroyUrl : controllerUrl + "delete";

        $(this).edatagrid({
            filterBtnIconCls: 'icon-filter',
            remoteFilter: true,
            width: options.width,
            height: options.height,
            autoRowHeight: options.autoRowHeight,
            nowrap: options.nowrap,
            striped: options.striped,
            singleSelect: options.singleSelect,
            url: appendSourceUrlParam(options.url),
            toolbar: options.toolbar,
            //queryParams : {},
            loadMsg: options.loadMsg,
            rownumbers: options.rownumbers,
            pagination: options.pagination,
            paginPosition: 'bottom',
            pageNumber: options.pageNumber,
            pageSize: options.pageSize,
            pageList: options.pageList,
            frozenColumns: options.frozenColumns,
            columns: options.columns,
            sortName: options.sortName,
            sortOrder: options.sortOrder,
            fit: options.fit,
            fitColumns: options.fitColumns,
            border: options.border,
            checkOnSelect: options.checkOnSelect,
            selectOnCheck: options.selectOnCheck,
            //bodyCls : "leftBottomBorder",
            saveUrl: options.saveUrl,
            updateUrl: options.updateUrl,
            destroyUrl: options.destroyUrl,
            onBeforeLoad: function (param) {

            },
            onLoadSuccess: function () {
                //$(this).datagrid("fixRownumber");
            },
            onClickRow: function (index, row) {
                //传递给要刷新表格的参数
                if (typeof options.childGrid == "object") {
                    var newQueryParams = {};
                    newQueryParams = getSelectedRowJson(options.childGrid.param, row);

                    var refreshGridIdArr = options.childGrid.grid;
                    for (var i = 0; i < refreshGridIdArr.length; i++) {
                        // 通过闭包嵌套和不同时序的执行来刷新grid
                        (function (i) {
                            setTimeout(function () {
                                var $grid = $("#" + refreshGridIdArr[i].id);
                                if (refreshGridIdArr[i]["type"] == "datagrid") {
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
                                    var href = replaceUrlParamValueByBrace(refreshGridIdArr[i].href, newQueryParams);
                                    $grid.panel('refresh', href);
                                }
                            }, i * 100);
                        })(i);
                    }
                }
            }

        });

        //$(this).datagrid('disableFilter', options.filterOption);

        //重新加载datagrid的数据
        //$(this).datagrid('reload');

    }

    /**
     * @author 孙宇
     * @requires jQuery,EasyUI
     * 为datagrid、treegrid增加表头菜单，用于显示或隐藏列，注意：冻结列不在此菜单中
     */
    var createGridHeaderContextMenu = function (e, field) {
        e.preventDefault();
        var grid = $(this);
        /* grid本身 */
        var headerContextMenu = this.headerContextMenu;
        /* grid上的列头菜单对象 */
        var okCls = 'tree-checkbox1'; // 选中
        var emptyCls = 'tree-checkbox0'; // 取消
        if (!headerContextMenu) {
            var tmenu = $('<div style="width:150px;"></div>').appendTo('body');
            var fields = grid.datagrid('getColumnFields');
            for (var i = 0; i < fields.length; i++) {
                var fieldOption = grid.datagrid('getColumnOption', fields[i]);
                if (!fieldOption.hidden) {
                    $('<div iconCls="' + okCls + '" field="' + fields[i] + '"/>').html(fieldOption.title).appendTo(tmenu);
                } else {
                    $('<div iconCls="' + emptyCls + '" field="' + fields[i] + '"/>').html(fieldOption.title).appendTo(tmenu);
                }
            }
            headerContextMenu = this.headerContextMenu = tmenu.menu({
                onClick: function (item) {
                    var field = $(item.target).attr('field');
                    if (item.iconCls == okCls) {
                        grid.datagrid('hideColumn', field);
                        $(this).menu('setIcon', {
                            target: item.target,
                            iconCls: emptyCls
                        });
                    } else {
                        grid.datagrid('showColumn', field);
                        $(this).menu('setIcon', {
                            target: item.target,
                            iconCls: okCls
                        });
                    }
                    headerContextMenu.menu('show');
                }
            });
        }
        headerContextMenu.menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    };
    $.fn.datagrid.defaults.onHeaderContextMenu = createGridHeaderContextMenu;
    $.fn.treegrid.defaults.onHeaderContextMenu = createGridHeaderContextMenu;


})(jQuery);;// 扩展datagrid方法，修复行号宽度显示问题
$.extend($.fn.datagrid.methods, {
	fixRownumber : function (jq) {
		return jq.each(function () {
			var panel = $(this).datagrid("getPanel");
			//获取最后一行的number容器,并拷贝一份
			var clone = $(".datagrid-cell-rownumber", panel).last().clone();
			//由于在某些浏览器里面,是不支持获取隐藏元素的宽度,所以取巧一下
			clone.css({
				"position" : "absolute",
				left : -1000
			}).appendTo("body");
			var width = clone.width("auto").width();
			//默认宽度是25,所以只有大于25的时候才进行fix
			if (width > 25) {
				//多加5个像素,保持一点边距
				$(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).width(width + 5);
				//修改了宽度之后,需要对容器进行重新计算,所以调用resize
				$(this).datagrid("resize");
				//一些清理工作
				clone.remove();
				clone = null;
			} else {
				//还原成默认状态
				$(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).removeAttr("style");
			}
		});
	},
	/*
	 *	$('#tt').datagrid("addToolbarItem",[{"text":"xxx"},"-",{"text":"xxxsss","iconCls":"icon-ok"}])
	 *	$('#tt').datagrid("removeToolbarItem","GetChanges") //根据btn的text删除
	 *	$('#tt').datagrid("removeToolbarItem",0) //根据下标删除
	 */
	addToolbarItem : function (jq, items) {
		return jq.each(function () {
			var dpanel = $(this);
			var toolbar = dpanel.children("div.datagrid-toolbar");
			if (!toolbar.length) {
				toolbar = $("<div class=\"datagrid-toolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").prependTo(dpanel);
				$(this).datagrid('resize');
			}
			var tr = toolbar.find("tr");
			for (var i = 0; i < items.length; i++) {
				var btn = items[i];
				if (btn == "-") {
					$("<td><div class=\"datagrid-btn-separator\"></div></td>").appendTo(tr);
				} else {
					var td = $("<td></td>").appendTo(tr);
					var b = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
					b[0].onclick = eval(btn.handler || function () {});
					b.linkbutton($.extend({}, btn, {
							plain : true
						}));
				}
			}
		});
	},
	removeToolbarItem : function (jq, param) {
		return jq.each(function () {
			var dpanel = $(this).datagrid("getPanel");
			var toolbar = dpanel.children("div.datagrid-toolbar");
			var cbtn = null;
			if (typeof param == "number") {
				cbtn = toolbar.find("td").eq(param).find('span.l-btn-text');
				//csep = toolbar.find("td").eq(param).find('.datagrid-btn-separator');
			} else if (typeof param == "string") {
				cbtn = toolbar.find("span.l-btn-text:contains('" + param + "')");
				//csep = toolbar.find(".datagrid-btn-separator:contains('" + param + "')");
			}
			if (cbtn && cbtn.length > 0) {
				cbtn.closest('td').remove();
				//csep.closest('td').remove();
				cbtn = null;
			}
		});
	}
});;(function ($) {

    var date = new Date();
    var currentYear = date.getFullYear();
    var currentMonth = date.getMonth() + 1;
    var currentDay = date.getDate();
    var currentHour = date.getHours();
    var currentMinute = date.getMinutes();
    var currentSecond = date.getSeconds();

    $.fn.iTextbox = function (options) {

        var defaults = {
            width: 153,
            height: 30,
            prompt: '',
            type: 'text',
            multiline: false,
            readonly: false,
            disabled: false,
            iconCls: '',
            buttonText: '',
            buttonIcon: '',
            required: false,
            missingMessage: '必填'
        }

        var options = $.extend(defaults, options);

        $(this).textbox({
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            type: options.type,
            multiline: options.multiline,
            readonly: options.readonly,
            disabled: options.disabled,
            iconCls: options.iconCls,
            buttonText: options.buttonText,
            buttonIcon: options.buttonIcon,
            required: options.required,
            missingMessage: options.missingMessage,
            onChange: options.onChange,
            onClickButton: options.onClickButton
        });
    }

    $.fn.iFilebox = function (options) {

        var defaults = {
            width: 450,
            height: 30,
            prompt: '',
            type: 'text',
            multiline: false,
            readonly: false,
            disabled: false,
            iconCls: '',
            buttonText: '选择文件',
            buttonAlign: 'right',
            required: false,
            missingMessage: '必填',
            onChange: function () {
            }
        };

        var options = $.extend(defaults, options);

        $(this).filebox({
            width: options.width,
            height: options.height,
            buttonText: options.buttonText,
            buttonAlign: options.buttonAlign
        });
    }

    $.fn.iNumberspinner = function (options) {
        var defaults = {
            min: 0,
            max: 10000,
            width: 153,
            height: 30,
            editable: true,
            defaultValueType: '',
            value: '',
            min: 0,
            max: 999999999,
            required: false
        }

        var options = $.extend(defaults, options);

        if (options.defaultValueType == 'currentYear') {
            options.value = currentYear;
            options.min = 1900,
                options.max = 2200
        } else if (options.defaultValueType == 'currentSeason') {
            if (currentMonth == 1 || currentMonth == 2 || currentMonth == 3) {
                options.value = 1;
            } else if (currentMonth == 4 || currentMonth == 5 || currentMonth == 6) {
                options.value = 2;
            } else if (currentMonth == 7 || currentMonth == 8 || currentMonth == 9) {
                options.value = 3;
            } else if (currentMonth == 10 || currentMonth == 11 || currentMonth == 12) {
                options.value = 4;
            }
            options.min = 1,
                options.max = 4
        } else if (options.defaultValueType == 'currentMonth') {
            options.value = currentMonth;
            options.min = 1,
                options.max = 12
        } else if (options.defaultValueType == 'currentDay') {
            options.value = currentDay;
            options.min = 1,
                options.max = 31
        } else if (options.defaultValueType == 'currentHour') {
            options.value = currentHour;
            options.min = 0,
                options.max = 24
        }

        $(this).numberspinner({
            min: options.min,
            max: options.max,
            prompt: options.prompt,
            width: options.width,
            height: options.height,
            editable: options.editable,
            value: options.value,
            min: options.min,
            max: options.max,
            buttonText: '',
            required: options.required
        });
    }

    $.fn.iDatebox = function (options) {
        var defaults = {
            required: false,
            editable: true,
            width: 153,
            height: 30,
            formatter: function (value) {
                var y = value.getFullYear();
                var m = value.getMonth() + 1;
                var d = value.getDate();
                if (options.pattern == "YYYY")
                    return y;
                else if (options.pattern == "YYYY-mm")
                    return y + '-' + convertDateToFullDate(m);
                else
                    return y + '-' + convertDateToFullDate(m) + '-' + convertDateToFullDate(d);
            },
            parser: function (s) {
                var t = Date.parse(s);
                if (!isNaN(t)) {
                    return new Date(t);
                } else {
                    return new Date();
                }

            },
            value: ""
        }

        var options = $.extend(defaults, options);

        $(this).datebox({
            required: options.required,
            editable: options.editable,
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            formatter: options.formatter,
            parser: options.parser,
            onSelect: function (date) {

            }
        });
    }

    $.fn.iNumberbox = function (options) {
        var defaults = {
            width: 153,
            height: 30,
            min: 0,
            precision: 0,
            decimalSeparator: '.',
            groupSeparator: ',',
            required: false,
            buttonText: ''
        }

        var options = $.extend(defaults, options);

        $(this).numberbox({
            width: options.width,
            height: options.height,
            min: options.min,
            prompt: options.prompt,
            precision: options.precision,
            decimalSeparator: options.decimalSeparator,
            groupSeparator: options.groupSeparator,
            prefix: options.prefix,
            buttonText: '',
            required: options.required
        });
    }

    $.fn.iLinkbutton = function (options) {
        var defaults = {
            iconCls: 'icon-edit',
            plain: false
        }

        var options = $.extend(defaults, options);

        $(this).linkbutton(options);
    }

    $.fn.iMenubutton = function (options) {
        var defaults = {
            iconCls: 'icon-save',
            hasDownArrow: false
        }

        var options = $.extend(defaults, options);

        getTabWindow().$(this).menubutton({
            iconCls: options.iconCls,
            hasDownArrow: options.hasDownArrow,
            menu: options.menu
        });
    }

    $.fn.iValidatebox = function (options) {
        var defaults = {
            required: true,
            validType: 'email'
        }

        var options = $.extend(defaults, options);

        $(this).validatebox({
            required: options.required,
            validType: options.validType
        });
    }

    $.fn.iCombobox = function (options) {
        var defaults = {
            width: 153,
            height: 30,
            url: ctx + '/system/codeItem/getListByCodesetidAndLevelid?codeSetId={codeSetId}&levelId={levelId}',
            data: '',
            codeSetId: 0,
            pid: 0,
            valueField: 'text',
            textField: 'text',
            editable: false,
            panelHeight: 50,
            onSelect: combobox_onSelect,
            formatter: combobox_formatter,
            required: false
        }

        var options = $.extend(defaults, options);

        if (options.data)
            options.url = "";
        if (options.codeSetId)
            options.url = options.url.replace("{codeSetId}", options.codeSetId).replace("{levelId}", options.levelId);

        $(this).combobox({
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            url: options.url,
            data: options.data,
            valueField: options.valueField,
            textField: options.textField,
            editable: options.editable,
            panelHeight: options.panelHeight,
            formatter: options.combobox_formatter,
            required: options.required,
            onShowPanel: function () {
                if (options.url.indexOf("{") >= 0) {
                    //将form表单数据封装成json数据
                    var formData = $(this).closest("form").serializeObject();
                    $('#' + options.id).combobox('reload', replaceUrlParamValueByBrace(options.url, formData));
                }
            },
            onChange: function (newValue, oldValue) {
                //重载级联combobox内容
                if (typeof options.childCombobox == "object") {
                    var url = appendUrlParam(options.childCombobox.url, "parentParam=" + newValue);
                    $('#' + options.childCombobox.id).combobox('reload', url);
                }
            },
            onSelect: function (record) {
                var $formObj = $(this).closest('form');

                if (options.param) {
                    var jsonData = getSelectedRowJson(options.param, record);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                }
            }
        });

    }

    var combobox_onSelect = function (record) {
        //console.log(record);
    }

    var combobox_formatter = function (row) {
        if (value == 0) {
            //return row.text;
        } else {
            //return row.text;
        }
    }

    $.fn.iAutoComplete = function (options) {
        var defaults = {
            selector: this.selector,
            url: ctx + "/system/user/getListByUserName?userName=",
            valueField: 'userNameId',
            textField: 'userName',
            width: 450,
            height: 30,
            fieldId: 'userNameId',
            required: false
        }

        var options = $.extend(defaults, options);

        $(this).combobox({
            valueField: options.valueField,
            textField: options.textField,
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            required: options.required,
            onChange: function (newValue, oldValue) {
                if (newValue != null) {
                    $(this).combobox("reload", options.url + encodeURI(encodeURI(newValue)));
                }
            },
            onSelect: function (record) {
                $.messager.confirm('确认', '你选择的人员是：' + record.userName, function (r) {
                    if (r) {
                        var i = record.userName.indexOf('(cni23');
                        $(options.selector).combobox('setValue', record.userName.substring(0, i));
                        $(options.selector).combobox('hidePanel');
                        $(options.fieldId).val(record.userNameId);
                    } else {
                        $(options.selector).combobox('setValue', "");
                    }
                });
            },
            onHidePanel: function () {
                if ($(options.fieldId).val() == "") {
                    $(options.selector).combobox("setText", "");
                }
            }
        });
    }

    $.fn.iAutoComplete2 = function (options) {
        var defaults = {
            comboboxId: this.selector,
            url: ctx + "/system/user/getListByUserName?userName=",
            valueField: 'userNameId',
            textField: 'userName',
            width: 450,
            height: 30,
            fieldId: 'userNameId',
            required: false,
            formatter: ''
        }

        var options = $.extend(defaults, options);

        if (options.comboboxId == "") {
            options.comboboxId = $(this).context;
        }

        $comboboxObj = $(this);

        $(this).combobox({
            valueField: options.valueField,
            textField: options.textField,
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            required: options.required,
            formatter: options.formatter,
            onLoadSuccess: function (node, data) {
                setTimeout(function () {
                    var oriValue = $(options.comboboxId).combobox('getValue');
                    // 设置值为数据库中的值
                    //$(options.comboboxId).combobox('setValue', oriValue);
                    // 设置显示文本为数据库中的文本
                    //$(options.comboboxId).combobox('setText', oriValue);
                }, 400);
            },
            onShowPanel: function () {
                $(this).combobox("reload", options.url);
            },
            onChange: function (newValue, oldValue) {
                if (newValue == null) {
                    newValue = $(options.comboboxId).combobox('getValue');
                }
                var paramArr = options.url.match(/{([\s\S]*?)}/g);
                var newUrl = options.url;
                if (paramArr.length > 0) {
                    for (var i = 0; i < paramArr.length; i++) {
                        newUrl = newUrl.replace(paramArr[i], encodeURI(encodeURI(newValue)));
                    }
                }

                $(this).combobox("reload", newUrl);
            },
            onSelect: function (record) {
                $(options.comboboxId).combobox('hidePanel');

                /*var dialogIdArr = options.dialogId.split(",");
                 for (var i = 0; i < dialogIdArr.length; i++) {
                 var jsonData = getSelectedRowJson(options.param, record);
                 getTabWindow().$("#" + dialogIdArr[i]).form('load', jsonData);
                 }*/

                if (options.param) {
                    var $formObj = $comboboxObj.closest('form');
                    var jsonData = getSelectedRowJson(options.param, record);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                }

                setTimeout(function () {
                    // 设置值为数据库中的值
                    //$(options.comboboxId).combobox('setValue', record[options.valueField]);
                    // 设置显示文本为数据库中的文本
                    $(options.comboboxId).combobox('setText', record[options.textField]);
                }, 1000);

            },
            onUnselect: function (record) {
                setTimeout(function () {
                    //var oriValue = $(options.comboboxId).combobox('getValue');
                    // 设置值为数据库中的值
                    $(options.comboboxId).combobox('setValue', '');
                    // 设置显示文本为数据库中的文本
                    $(options.comboboxId).combobox('setText', '');
                }, 400);
            },
            onHidePanel: function () {
                // 没有选择的情况下清空输入框内容及值
                if (options.textField != options.valueField) {
                    var text = $(options.comboboxId).combobox('getText');
                    var value = $(options.comboboxId).combobox('getValue');
                    if (text == value) {
                        $(options.comboboxId).combobox("setText", "");
                        $(options.comboboxId).combobox("setValue", "");
                    }
                }
            }
        });
    }

})(jQuery);;// 获取地址栏参数
$.getUrlParam = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}

// 获取网址字符串参数值
$.getUrlStrParam = function (urlStr, name) {
    urlParam = urlStr.substring(urlStr.indexOf("?"));
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = urlParam.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}

/**
 * 测试函数
 */
test = function (str) {
    alert(str);
}

/**
 * 截取字符串
 * @param dateStr
 * @param start
 * @param end
 * @returns {*}
 */
subString = function (dateStr, start, end) {
    if (dateStr != undefined) {
        return dateStr.substring(start, end);
    } else {
        return '';
    }
}

/**
 * 回调函数，用于点击提交按钮在提交表单之前选中select输入框中的所有项
 */
function selectAllOptions(selector) {
    $(selector + ' option').attr("selected", true);
}

/**
 * 转换传入的回调函数字条串，并执行
 * @param functionStr
 */
function executeCallBackFun(functionStr, options) {
    if (functionStr != undefined) {
        var handlerBeforeArr = functionStr.split("|");
        var handlerBeforeParamsArr = handlerBeforeArr[1].split(",");
        var handlerBeforeParams = "";
        for (var h = 0; h < handlerBeforeParamsArr.length; h++) {
            if (handlerBeforeParamsArr[h].indexOf("options.") > -1)
                handlerBeforeParams += handlerBeforeParamsArr[h] + ',';
            else
                handlerBeforeParams += '"' + handlerBeforeParamsArr[h] + '",';
        }
        eval(handlerBeforeArr[0] + "(" + handlerBeforeParams.substr(0, handlerBeforeParams.length - 1) + ")");
    }
}

/**
 * 判断一个数组是否是多维数组
 * @param arr
 * @returns {boolean}
 */
function isMultiArr(arr) {
    if (arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] instanceof Array)
                return true;
            else
                return false;
        }
    } else {
        return false;
    }
}

/**
 * 判断一个对象是否是多维对象
 * @param obj
 * @returns {boolean}
 */
function isMultiObj(obj) {
    if (obj) {
        for (var i = 0; i < obj.length; i++) {
            if (typeof obj[i] == "object")
                return true;
            else
                return false;
        }
    } else {
        return false;
    }
}

/**
 * 附件大小转换
 * @param bytes
 * @returns {*}
 */
function bytesToSize(bytes, precision) {
    if (precision == null) precision = 2;
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(precision) + ' ' + sizes[i];
    // toPrecision(3) 后面保留一位小数，如1.0GB
    // return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

/**
 * 当前url后面追加来源url中的参数
 * @param url
 * @returns {*}
 */
function appendUrlParam(url, paramValue) {
    return url.indexOf("?") == -1 ? url + "?" + paramValue : url + "&" + paramValue;
}

/**
 * 当前url后面追加来源url中的参数
 * @param url
 * @returns {*}
 */
function appendSourceUrlParam(url) {
    return url.indexOf("?") == -1 ? url + location.search : url + location.search.replace("?", "&");
}

/**
 * 获得当前日期时间
 * @param formatter
 * @returns {*}
 */
function getCurrentDatetime(formatter) {
    var timeStamp = new Date();
    return timestamp2Datetime(timeStamp, formatter);
}

function timestamp2Datetime(timeStamp, formatter) {
    var d = new Date(timeStamp);
    var year = d.getFullYear();
    var month = (d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
    var day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
    var hour = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
    var minute = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    var second = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();

    var result;
    if (formatter == "YmdHis") {
        result = year + "" + month + "" + day + "" + hour + "" + minute + "" + second;
    } else if (formatter == "Y-m-d H:i:s") {
        result = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    } else if (formatter == "Y-m-d") {
        result = year + '-' + month + '-' + day;
    } else {
        result = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
    }
    return result;
}

/**
 * 获得地址栏URL
 * @param urlType
 * @returns {string|*}
 */
function getUrl(urlType) {
    var currentUrl = window.location.pathname;
    if (urlType == "controller") {
        url = currentUrl.substring(0, currentUrl.lastIndexOf("/") + 1);
    } else {
        url = currentUrl;
    }
    return url;
}

/**
 * 获得选项json数据
 * @param $element
 * @returns {*}
 */
function getOptionsJson($element) {
    var options = $element.data();

    if (options.options) {
        if (options.options.indexOf("{") == 0) {
            options = $.parseJSON(options.options.replace(/'/g, '"'));
        } else {
            options = strToJson('{' + options.options.replace(/'/g, '"') + '}');
        }
    }
    return options;
}

/**
 * 设置表单元素id属性
 * @param options
 */
function setFormElementId($element, options) {
    if (options.id == undefined) {
        options.id = $element[0].name;
        $element.attr('id', $element[0].name)
    } else {
        $element.attr('id', options.id)
    }
    return options;
}

/**
 * 将形如2015-1-1的日期转换为2015-01-01的格式
 * @param value
 * @returns {string}
 */
function convertDateToFullDate(value) {
    return (value < 10 ? '0' : '') + value;
}

/**
 * 判断是否null
 * @param data
 */
function isNull(data) {
    return (data == "" || data == undefined || data == null) ? true : false;
}

/**
 * 根据指定参数获取grid中选中行值的JSON数据
 * @param gridParam
 * @param row
 * @returns {{}}
 */
function getSelectedRowJson(gridParam, row) {
    var jsonData = {};
    if (gridParam) {
        var gridParamArr = gridParam.split(",");
        //传递给dialog输入框的参数
        for (var i = 0; i < gridParamArr.length; i++) {
            if (gridParamArr[i].indexOf(":") == -1) {
                jsonData[gridParamArr[i]] = row[gridParamArr[i]];
            } else {
                var gridKVArr = gridParamArr[i].split(":");
                jsonData[gridKVArr[0]] = row[gridKVArr[1]];
            }
        }
    }
    return jsonData;
}

/**
 * json字符串转json对象
 * @param str
 * @returns {Object}
 */
function strToJson(str) {
    var json = eval("(" + str + ")");
    return json;
}

/**
 * 获得json元素的个数
 * @param obj
 * @returns {number}
 * @constructor
 */
function jsonLength(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


/*Array.prototype.remove = function (dx) {
 if (isNaN(dx) || dx > this.length) {
 return false;
 }
 for (var i = 0, n = 0; i < this.length; i++) {
 if (this[i] != this[dx]) {
 this[n++] = this[i]
 }
 }
 this.length -= 1
 }*/

/**
 * 扩展数组方法：查找指定元素的下标
 * @param val
 * @returns {number}
 */
Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

/**
 * 扩展数组方法:删除指定元素
 * @param val
 */
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    while (index > -1) {
        this.splice(index, 1);
        index = this.indexOf(val);
    }
};;(function($){
	
	$.fn.iMenu = function(options) {
		var defaults = {
			menuId : this.selector,
			width   : 600,
			height  : 400,
			title   : '修改管理',
			modal   : false,
			closed  : true,
			iconCls : 'icon-save',
			collapsible : true,
			maximizable : true,
			minimizable : false,
			maximized : false,
			openAnimation : 'show',
			openDuration : 600,
			postfix : 'Edit',
			combotreeFields : '',
			refreshTreeId : '',
			datagridId : 'datagrid',
			treegridId : 'treegrid',
			editDialogId : 'editDialog'
		}
		
		var options = $.extend(defaults, options);
		$(options.menuId).menu({
	        onClick : function (item) {
	        	var itemOptions;
	        	var currentItemOptions;
	        	$(options.menuId+" .menu-item").each(function(i, e){
	        		itemOptions = getOptionsJson($(this));
	        		if(item.name == itemOptions.name) {
	        			currentItemOptions = itemOptions;
	        		}
	        	});

	        	treegridContextOprate(currentItemOptions, options.treegridId);
	        }
	    });
		
		function treegridContextOprate(currentItemOptions, treegridId) {
	    	var selectedRow = $("#"+treegridId).treegrid('getSelected');
	        switch (currentItemOptions.name) {
	            case "add":
	            	
	            	//clearDialogHrefKeyValue(editDialogId, "action");
	                $("#"+currentItemOptions.dialogId).dialog("open");
	                
	                var treegridParamArr = currentItemOptions.treegridParam.split(",");
	                var jsonData = {};
	         	    //传递给要刷新表格的参数
	         	    for(var i=0; i<treegridParamArr.length; i++) {
	         	    	jsonData[treegridParamArr[i]] = selectedRow[treegridParamArr[i]];
	         	    }
	                jsonData.pid = selectedRow.id;
	                
	                setTimeout(function() {
	                	$("#"+currentItemOptions.dialogId).form('load', jsonData);
	                }, 100);
					
	                return false;
	                break;
	            case "edit":
	            	//clearDialogHrefKeyValue(editDialogId, "action");
	            	//setDialogHrefKeyValue(editDialogId, "action", "edit");
	            	
	                $("#"+currentItemOptions.dialogId).dialog("open");
	                
	                //$("#"+params.editDialogId).dialog('setTitle', params.editDialogTitle);
	                
	                setTimeout(function() {
	                	$("#"+currentItemOptions.dialogId).form('load', currentItemOptions.dialogUrl.replace("{uuid}", selectedRow.uuid));
	                }, 100);
	                return false;
	                break;
	            case "refresh":
	                $("#"+treegridId).treegrid('reload', selectedRow.id);
	                break;
	            case "remove":
	            	$.messager.confirm('提示','确定要删除吗？',function(r){
	            		if (r){
	            			$.ajax({
	        					url : ctx + '/System/Menu/delete',
	        					type : 'post',
	        					data : {"uuids":"'" + selectedRow.uuid + "'"},
	        					beforeSend : function () {
	        						$.messager.progress({
	        							text : '正在操作...'
	        						});
	        					},
	        					success : function (data, response, status) {
	        						$.messager.progress('close');
	        						if (data > 0) {
	        							$.messager.show({
	        								title : '提示',
	        								msg : '操作成功'
	        							});
	        							$(treegridId).treegrid('reload', selectedRow.pid);
	        						} else {
	        							$.messager.alert('操作失败！', '未知错误或没有任何修改，请重试！', 'warning');
	        						}
	        					}
	        				});
	            		}
	            	});
	                break;
	        }
	    }

		
	}

})(jQuery);;+function ($) {
    'use strict';

    $(document).on(topJUI.eventType.initUI.form, function (e) {

        //var $box = $(e.target);

        //var $iTextbox = $box.find('[data-toggle="topjui-textbox"]');

        $('[data-toggle="topjui-textbox"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);
            if (options.readonly) {
                options.buttonText = '只读';
            } else if (options.disabled) {
                options.buttonText = '禁止';
            }

            options = setFormElementId($element, options);
            $element.iTextbox(options);
        });

        $('[data-toggle="topjui-filebox"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iFilebox(options);
        });

        $('[data-toggle="topjui-numberspinner"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iNumberspinner(options);
        });

        $('[data-toggle="topjui-numberbox"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iNumberbox(options);
        });

        $('[data-toggle="topjui-datebox"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iDatebox(options);
        });

        $('[data-toggle="topjui-combobox"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iCombobox(options);
        });

        $('[data-toggle="topjui-combotree"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iCombotree(options);
        });

        $('[data-toggle="topjui-textarea"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options.multiline = true;
            if (options.width == null)
                options.width = 450;
            if (options.height == null)
                options.height = 66;

            options = setFormElementId($element, options);
            $element.iTextbox(options);
        });

        $('[data-toggle="topjui-autocomplete"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iAutoComplete2(options);
        });

        $('[data-toggle="topjui-ueditor"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);

            UE.delEditor(options.id);
            <!-- 实例化编辑器 -->
            var toolbars = [['fullscreen', 'source', '|', 'undo', 'redo', '|',
                'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', '|',
                'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist',
                'insertunorderedlist', 'lineheight', '|',
                'horizontal', 'spechars', 'map', 'paragraph', 'fontfamily', 'fontsize', 'insertcode', '|',
                'indent', 'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
                'link', 'unlink', '|', 'emotion', 'attachment', 'simpleupload', 'insertimage', '|', 'preview']];
            var simpleToolbars = [["fullscreen", "source", "undo", "redo", "bold", "italic", "underline", "fontborder", "strikethrough", "superscript", "subscript", "insertunorderedlist", "insertorderedlist", "justifyleft", "justifycenter", "justifyright", "justifyjustify", "removeformat", "simpleupload", "snapscreen", "emotion", "attachment", "link", "unlink", "indent", "lineheight", "autotypeset"]];
            UE.getEditor(options.id, {
                toolbars: options.mode == "simple" ? simpleToolbars : toolbars,
                initialFrameWidth: 700,
                autoHeightEnabled: true,
                autoFloatEnabled: true,
                readonly: options.readonly ? true : false
            });
        });

        $('[data-toggle="topjui-ueupload"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);
            options = setFormElementId($element, options);

            var defaults = {
                width: 450,
                buttonText: '选择图片',
                uploadType: 'image',
                buttonIcon: 'icon-picture_add'
            }
            var options = $.extend(defaults, options);

            var uploaderId = options.id + "Uploader";
            $('body').append('<script type="text/plain" id="' + uploaderId + '"></script>');

            //http://www.cnblogs.com/stupage/p/3145353.html
            //重新实例化一个编辑器，上传独立使用
            var ueUpload = UE.getEditor(uploaderId, {
                toolbars: [["insertimage", "attachment"]]
            });
            ueUpload.ready(function () {
                //设置编辑器不可用
                ueUpload.setDisabled();
                //隐藏编辑器，因为不会用到这个编辑器实例，所以要隐藏
                ueUpload.hide();
                var listener = "afterConfirmUploadedFile", pathAttr = "url";
                if (options.uploadType == "image") {
                    listener = "afterConfirmUploadedImage";
                    pathAttr = "src";
                }
                //侦听上传
                ueUpload.addListener(listener, function (t, arg) {
                    //将地址赋值给相应的input
                    $("#" + options.id).textbox("setText", arg[0][pathAttr]);
                    $("#" + options.id).textbox("setValue", arg[0][pathAttr]);
                    //图片预览
                    if (pathAttr == "src")
                        $("#" + options.previewImageId).attr(pathAttr, arg[0][pathAttr]);
                });

                options.onClickButton = function () {
                    if (options.uploadType == "image") {
                        var imageUploadDialog = ueUpload.getDialog("insertimage");
                        imageUploadDialog.open();
                    } else {
                        var fileUploadDialog = ueUpload.getDialog("attachment");
                        fileUploadDialog.open();
                    }
                };
                $element.iTextbox(options);
            });

        });

        $('[data-toggle="topjui-kindeditor"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            if (options.items)
                options.items = options.items.replaceAll('\'', '').replaceAll(' ', '').split(',')
            if (options.afterUpload)
                options.afterUpload = options.afterUpload.toFunc()
            if (options.afterSelectFile)
                options.afterSelectFile = options.afterSelectFile.toFunc()
            if (options.confirmSelect)
                options.confirmSelect = options.confirmSelect.toFunc()

            var htmlTags = {
                font: [/*'color', 'size', 'face', '.background-color'*/],
                span: ['.color', '.background-color', '.font-size', '.font-family'
                    /*'.color', '.background-color', '.font-size', '.font-family', '.background',
                     '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.line-height'*/
                ],
                div: ['.margin', '.padding', '.text-align'
                    /*'align', '.border', '.margin', '.padding', '.text-align', '.color',
                     '.background-color', '.font-size', '.font-family', '.font-weight', '.background',
                     '.font-style', '.text-decoration', '.vertical-align', '.margin-left'*/
                ],
                table: ['align', 'width'
                    /*'border', 'cellspacing', 'cellpadding', 'width', 'height', 'align', 'bordercolor',
                     '.padding', '.margin', '.border', 'bgcolor', '.text-align', '.color', '.background-color',
                     '.font-size', '.font-family', '.font-weight', '.font-style', '.text-decoration', '.background',
                     '.width', '.height', '.border-collapse'*/
                ],
                'td,th': ['align', 'valign', 'width', 'height', 'colspan', 'rowspan'
                    /*'align', 'valign', 'width', 'height', 'colspan', 'rowspan', 'bgcolor',
                     '.text-align', '.color', '.background-color', '.font-size', '.font-family', '.font-weight',
                     '.font-style', '.text-decoration', '.vertical-align', '.background', '.border'*/
                ],
                a: ['href', 'target', 'name'],
                embed: ['src', 'width', 'height', 'type', 'loop', 'autostart', 'quality', '.width', '.height', 'align', 'allowscriptaccess'],
                img: ['src', 'width', 'height', 'border', 'alt', 'title', 'align', '.width', '.height', '.border'],
                'p,ol,ul,li,blockquote,h1,h2,h3,h4,h5,h6': [
                    'class', 'align', '.text-align', '.color', /*'.background-color', '.font-size', '.font-family', '.background',*/
                    '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.text-indent', '.margin-left'
                ],
                pre: ['class'],
                hr: ['class', '.page-break-after'],
                'br,tbody,tr,strong,b,sub,sup,em,i,u,strike,s,del': []
            }
            KindEditor.create($element, {
                module: options.module ? options.module : '未设置',
                category: options.category ? options.category : 'default',
                width: options.width ? options.width + 'px' : '700px',
                height: options.height ? options.height + 'px' : '600px',
                pasteType: options.pasteType,
                minHeight: options.minHeight || 150,
                autoHeightMode: options.autoHeight || true,
                afterCreate: function () {
                    //this.loadPlugin('autoheight');
                },
                items: options.model == "simple" ? ['source', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline', 'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright', 'insertorderedlist', 'insertunorderedlist', '|', 'emoticons', 'image', 'insertfile', 'link'] : KindEditor.options.items,
                uploadJson: options.uploadJson || ctx + '/system/attachment/kindeditorUpload',
                fileManagerJson: options.fileManagerJson || ctx + '/static/kindeditor/4.1.5/jsp/file_manager_json.jsp',
                allowFileManager: options.allowFileManager || true,
                fillDescAfterUploadImage: options.fillDescAfterUploadImage || true, //上传图片成功后转到属性页，为false则直接插入图片[设为true方便自定义函数(X_afterSelect)]
                afterUpload: options.afterUpload,
                afterSelectFile: options.afterSelectFile,
                X_afterSelect: options.confirmSelect,
                htmlTags: htmlTags,
                cssPath: [
                    ctx + '/static/kindeditor/4.1.5/editor-content.css',
                    ctx + '/static/kindeditor/4.1.5/plugins/code/prettify.css'
                ],
                afterBlur: function () {
                    this.sync()
                }
            });
        });

        $('[data-toggle="topjui-upload"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            setTimeout(function () {

                var oriUrl = options.url;
                var newUrl = oriUrl;
                if (options.url.indexOf("{") != -1) {
                    var row = getSelectedRowData(options.grid.type, options.grid.id);
                    // 替换本表中选中行占位值
                    newUrl = replaceUrlParamValueByBrace(oriUrl, row);
                }
                var uploadbutton = KindEditor.uploadbutton({
                    button: KindEditor($element)[0],
                    fieldName: 'imgFile',
                    url: newUrl || ctx + '/system/attachment/kindeditorUpload?dir=file&module=article&category=default&puuid=11111111111111111111111111111111',
                    afterUpload: function (data) {
                        if (data.error === 0) {
                            console.log(data);
                            var url = KindEditor.formatUrl(data.url, 'absolute');
                            //KindEditor('#'.options.fieldId).val(url);
                            $('#' + options.fieldId).textbox('setText', url);
                            $('#' + options.fieldId).textbox('setValue', url);
                            refreshGrid(options.grid.type, options.grid.id);
                            //$("#attachTable").append('<tr><td class="label"></td><td class="label" style="text-align:left;white-space:nowrap;"><a href="' + url + '" target="_blank">' + data.fileName + '</a></td><td class="label"></td><td class="label"></td><td class="label"></td></tr>');
                        } else {
                            alert(data.message);
                        }
                    },
                    afterError: function (str) {
                        alert('自定义错误信息: ' + str);
                    }
                });
                uploadbutton.fileBox.change(function (e) {
                    uploadbutton.submit();
                });
            }, 500);
        });

        /*var tab = $("#index_tabs");//假设是tab
         var iframe = $("iframe",tab);//获取tab中的iframe
         $('[data-toggle="topjui-dialog"]', iframe.context).each(function(i){
         alert("abc");
         });*/

    });

    $(document).on(topJUI.eventType.initUI.base, function (e) {
        setTimeout(function () {
            // 父框架获取子框架元素
            // var test = $("iframe").contents().find("#test").val();
            getTabWindow().$('[data-toggle="topjui-datagrid"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                var frozenColumns = $element.find("thead:first")[0];
                //console.log(frozenColumns.getAttribute("frozen"));
                if ($(frozenColumns).attr("frozen")) {
                    var frozenColumns = [];
                    $element.find("thead:first th").each(function (i) {
                        frozenColumns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                    options.frozenColumns = [frozenColumns];

                    var columns = [];
                    $element.find("thead:eq(1) th").each(function (i) {
                        columns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                } else {
                    var columns = [];
                    $element.find("thead th").each(function (i) {
                        columns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                }
                options.columns = [columns];

                var kindEditor = [];

                //console.log(op.join());

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iDatagrid(options);
            });

            getTabWindow().$('[data-toggle="topjui-edatagrid"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                var frozenColumns = $element.find("thead:first")[0];
                //console.log(frozenColumns.getAttribute("frozen"));
                if ($(frozenColumns).attr("frozen")) {
                    var frozenColumns = [];
                    $element.find("thead:first th").each(function (i) {
                        frozenColumns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                    options.frozenColumns = [frozenColumns];

                    var columns = [];
                    $element.find("thead:eq(1) th").each(function (i) {
                        columns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                } else {
                    var columns = [];
                    $element.find("thead th").each(function (i) {
                        columns.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                    });
                }
                options.columns = [columns];

                var kindEditor = [];

                //console.log(op.join());

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iEdatagrid(options);
            });

            getTabWindow().$('[data-toggle="topjui-treegrid"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                var op = [];
                $element.find("th").each(function (i) {
                    op.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                });
                options.columns = [op];

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iTreegrid(options);
            });

            getTabWindow().$('[data-toggle="topjui-tabs"]').each(function () {
                var $element = $(this);
                var options = getOptionsJson($element);

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iTabs(options);
            });

            getTabWindow().$('[data-toggle="topjui-menubutton"]').each(function () {
                var $element = $(this);
                var options = getOptionsJson($element);
                options = bindMenuClickEvent($element, options);

                $(this).iMenubutton(options);
            });

            getTabWindow().$('[data-toggle="topjui-submenubutton"]').each(function () {
                var $element = $(this);
                var options = getOptionsJson($element);
                bindMenuClickEvent($element, options);
            });
        }, 1);

        setTimeout(function () {
            getTabWindow().$('[data-toggle="topjui-dialog"]').each(function () {
                var $element = $(this);
                var options = getOptionsJson($element);

                var href = $element.attr('href');
                if (href != undefined) {
                    options.href = href;
                    getTabWindow().$('body').append('<div id="' + options.id + '"></div>');
                    getTabWindow().$('#' + options.id).iDialog(options);

                    $element.on("click", function () {
                        getTabWindow().$('#' + options.id).dialog('open');
                        return false; //阻止链接跳转
                    });

                } else {
                    $element.attr('id', options.id);
                    getTabWindow().$('#' + options.id).iDialog(options);
                }
            });

            getTabWindow().$('[data-toggle="topjui-linkbutton"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                $element.iLinkbutton(options);

                if (options.handler == "ajaxForm" || options.handler == "multiAjaxForm") {
                    $element.on("click", function () {

                        if (options.handlerBefore != "undefined") {
                            // 回调执行传入的自定义函数
                            executeCallBackFun(options.handlerBefore);
                        }

                        var defaults = {
                            gridId: 'datagrid',
                            dialogId: 'editDialog'
                        }
                        options = $.extend(defaults, options);
                        // 判断数据是否通过验证
                        if (getTabWindow().$("#" + options.dialog.id).form('validate')) {
                            // 序列化表单数据
                            options.ajaxData = getTabWindow().$("#" + options.dialog.id).serialize();
                            if (options.combotreeFields != undefined) {
                                var combotreeParams = '';
                                $.each(options.combotreeFields, function (k, v) {
                                    combotreeParams += '&' + v.replace(options.postfix, "") + '=' + getTabWindow().$("#" + options.dialogId + ' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
                                });
                                options.ajaxData += combotreeParams;
                            }
                            // 提交更新多条数据
                            if (options.handler == "multiAjaxForm") {
                                var rows = getCheckedRowsData(options.grid.type, options.grid.id);
                                if (rows.length == 0) {
                                    $.messager.alert(
                                        topJUI.language.message.title.operationTips,
                                        topJUI.language.message.msg.checkSelfGrid,
                                        topJUI.language.message.icon.warning
                                    );
                                    return;
                                }
                                var pkName = 'uuid';
                                if (options.grid.pkName)
                                    pkName = options.grid.pkName;
                                options.ajaxData += '&' + pkName + '=' + getMultiRowsFieldValue(rows, pkName) + '&' + pkName + 's=' + getMultiRowsFieldValue(rows, pkName);
                            }
                            // 执行ajax动作
                            getTabWindow().doAjax(options);
                            // 关闭dialog
                            getTabWindow().$("#" + options.dialog.id).dialog("close");
                            // 重新加载本grid数据
                            if (typeof options.grid == "object") {
                                if (options.grid.type == "datagrid") {
                                    getTabWindow().$("#" + options.grid.id).datagrid("reload");
                                } else if (options.grid.type == "treegrid") {
                                    var row = getSelectedRowData(options.grid.type, options.grid.id);
                                    if (row == null)
                                        getTabWindow().$("#" + options.grid.id).treegrid("reload");
                                    else
                                        getTabWindow().$("#" + options.grid.id).treegrid("reload", row[options.grid.parentIdField]);
                                }
                            }
                            // 重新加载指定的Grid数据
                            refreshGrids(options.reload);
                        } else {
                            showMessage({statusCode: 300, title: '温馨提示', message: '显示红色的字段为必填字段'});
                        }
                    });
                }
            });
        }, 1000);
    });

    $(document).on(topJUI.eventType.initUI.base2, function (e) {
        setTimeout(function () {
            getTabWindow().$('[data-toggle="topjui-menu"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iMenu(options);
            });

            getTabWindow().$('[data-toggle="topjui-tree"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iTree(options);
            });
        }, 1500);
    });

    $(document).on(topJUI.eventType.initUI.echarts, function (e) {
        if (getTabWindow().$('[data-toggle="topjui-echarts"]').length > 0) {
            getTabWindow().$('[data-toggle="topjui-echarts"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                // 基于准备好的dom，初始化echarts实例
                var divId = getTabWindow().document.getElementById($element[0].id);
                var myChart = echarts.init(divId);

                // 指定图表的配置项和数据
                myChart.setOption({
                    title: {
                        text: ''
                    },
                    tooltip: {},
                    legend: {
                        data: []
                    },
                    series: []
                });

                // 异步加载数据
                $.ajax({
                    url: options.url,
                    type: 'post',
                    dataType: 'json',
                    success: function (data, response, status) {
                        //console.log(data.legend);
                        if (options.type == "bar" || options.type == "line") {
                            // 填入数据
                            myChart.setOption({
                                title: {
                                    text: data.title
                                },
                                xAxis: {
                                    data: data.categories
                                },
                                yAxis: {},
                                legend: {
                                    data: data.legend
                                },
                                series: data.series
                            });
                        }
                        if (options.type == "pie") {
                            // 填入数据
                            myChart.setOption({
                                title: {
                                    text: data.title,
                                    x: 'center'
                                },
                                tooltip: {
                                    trigger: 'item',
                                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                                },
                                legend: data.legend,
                                series: data.series
                            });
                        }
                        if (options.type == "gauge") {
                            // 填入数据
                            myChart.setOption({
                                tooltip: {
                                    formatter: "{a} <br/>{b} : {c}%"
                                },
                                series: [
                                    {
                                        name: '业务指标',
                                        type: 'gauge',
                                        detail: {formatter: '{value}%'},
                                        data: [{value: 17.1, name: '党员发展率'}]
                                    }
                                ]
                            });
                        }
                    },
                    error: function (errorMsg) {
                        alert("获取图表数据失败!");
                        myChart.hideLoading();
                    }
                });

            });
        }
    });

    /**
     * 查询界面初始化打开及每新增一行查询条件时触发显示各项内容,窗口onLoad时加载
     */
    $(document).on(topJUI.eventType.initUI.advanceSearchForm, function (e) {

        var valueArr = $.cookie('fieldNameStr').split(",");
        var textArr = $.cookie('colNameStr').split(",");
        var fieldArr = [];

        for (var i = 0; i < textArr.length; i++) {
            fieldArr.push({
                value: valueArr[i],
                text: textArr[i]
            });
        }

        $(".field:last").combobox({
            textField: 'text',
            valueField: 'value',
            data: fieldArr,
            editable: false,
            width: 140
        });

        $(".op:last").combobox({
            textField: 'text',
            valueField: 'value',
            data: [
                {"text": "包含", "value": "contains", "selected": true},
                {"text": "等于", "value": "equal"},
                {"text": "不等于", "value": "notequal"},
                {"text": "大于", "value": "greater"},
                {"text": "大于或等于", "value": "greaterorequal"},
                {"text": "小于", "value": "less"},
                {"text": "小于或等于", "value": "lessorequal"},
                {"text": "以...开头", "value": "beginwith"},
                {"text": "以...结尾", "value": "endwith"}
            ],
            width: 120,
            panelHeight: 220,
            editable: false
        });

        $(".value:last").textbox({});

        $(".join:last").combobox({
            textField: 'text',
            valueField: 'value',
            data: [
                {"text": "并且", "value": "and", "selected": true},
                {"text": "或者", "value": "or"}
            ],
            width: 70,
            panelHeight: 50,
            editable: false
        });

        $("#addCondition").menubutton({
            iconCls: 'icon-add',
            hasDownArrow: false
        });

        $(".deleteCondition:last").menubutton({
            iconCls: 'icon-delete',
            hasDownArrow: false
        });

        $(".deleteCondition:last").on('click', function () {
            var index = $(".deleteCondition").index(this) + 1;
            getTabWindow().$("#advanceSearchTable tr:eq(" + index + ")").remove();
        });
    });

    /**
     * 导入Excel事件，窗口onLoad时加载
     */
    $(document).on(topJUI.eventType.initUI.importExcelForm, function (e) {
        //触发界面初始化显示样式
        //$(this).trigger(topJUI.eventType.initUI.form);

        setTimeout(function () {
            var fieldStr = $.cookie('fieldNameStr');
            var fieldArr = fieldStr.split(",");
            var v = "";
            for (var i = 0; i < fieldArr.length; i++) {
                if (i == (fieldArr.length - 1))
                    v += "'{" + i + "}'";
                else
                    v += "'{" + i + "}',";
            }
            var importExcelSql = "INSERT INTO {table} (" + fieldStr + ") VALUES (" + v + ")";
            $("#importExcelSql").textbox("setValue", importExcelSql);
        }, 1000);
    });

}(jQuery);

$(function () {

    // 页面加载完成后触发基础表格及弹窗事件
    var url = getUrl();
    if (url != TopJUI.config.mainPagePath) {
        $(this).trigger(topJUI.eventType.initUI.base);
        $(this).trigger(topJUI.eventType.initUI.base2);
    } else {
        /*setTimeout(function () {
         $(this).trigger(topJUI.eventType.initUI.base);
         $(this).trigger(topJUI.eventType.initUI.base2);
         }, 1000);*/
    }


    /**
     * 高级查询对话框窗口
     */
    $("#advanceSearchDialog").dialog({
        width: 600,
        height: 200,
        title: '高级查询',
        modal: false,
        collapsible: true,
        minimizable: false,
        maximized: false,
        resizable: true,
        closed: true,
        iconCls: 'icon-find',
        href: '/system/search/advanceSearch',
        zIndex: 10,
        buttons: '#advanceSearchDialog-buttons',
        onLoad: function () {
            //窗口打开时，触发事件
            $(this).trigger(topJUI.eventType.initUI.advanceSearchForm);
        }
    });

    function loadGrid(formDataArr) {
        if ($.cookie("gridType") == "datagrid") {
            $("#" + $.cookie("gridId")).datagrid('load', {
                advanceFilter: JSON.stringify(formDataArr)
            });
        } else if ($.cookie("gridType") == "treegrid") {
            $("#" + $.cookie("gridId")).treegrid('load', {
                advanceFilter: JSON.stringify(formDataArr)
            });
        }
    }

    $("#resetAdvanceSearchForm").on('click', function () {
        var formDataArr = [];
        loadGrid(formDataArr)
    });

    $("#submitAdvanceSearchForm").on('click', function () {
        var formDataArr = [];
        var formData = $("#advanceSearchDialog").serializeArray();
        var num = formData.length / 4;
        for (var i = 0; i < num; i++) {
            var field = formData[i * 4].name;
            var fieldValue = formData[i * 4].value;
            var op = formData[i * 4 + 1].name;
            var opValue = formData[i * 4 + 1].value;
            var value = formData[i * 4 + 2].name;
            var valValue = formData[i * 4 + 2].value;
            var join = formData[i * 4 + 3].name;
            var joinValue = formData[i * 4 + 3].value;

            formDataArr.push({field: fieldValue, op: opValue, value: valValue, join: joinValue});
        }
        // console.log(JSON.stringify(formDataArr));
        loadGrid(formDataArr)
    });


    setTimeout(function () {
        /**
         * 导入Excel对话框窗口,Common/footer.jsp中定义
         */
        $("#importExcelDialog").dialog({
            width: 650,
            height: 200,
            title: '高级查询',
            modal: false,
            collapsible: true,
            minimizable: false,
            maximized: false,
            resizable: true,
            closed: true,
            iconCls: 'icon-find',
            href: '/system/excel/excelImport',
            zIndex: 10,
            buttons: '#importExcelDialog-buttons',
            onLoad: function () {
                //窗口打开时，触发事件
                $(this).trigger(topJUI.eventType.initUI.importExcelForm);
            }
        });
    }, 1000);

    $("#submitImportExcelForm").on('click', function () {
        var ajaxData = $("#importExcelDialog").serializeArray();
        //console.log(ajaxData[0].value);
        $.ajax({
            type: "POST",
            url: getUrl("controller") + "importExcel",
            data: ajaxData,
            dataType: "json",
            success: function (data) {
                showMessage({statusCode: data.statusCode, title: data.title, message: data.message});
                $("#importExcelDialog").dialog('close').form('reset');
                refreshGrid($.cookie("gridType"), $.cookie("gridId"));
            },
            error: function (msg) {
                showMessage({statusCode: 300, title: "操作提示", message: msg});
            }
        });
    });

});;(function ($) {

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
                            var newHref = replaceUrlParamValueByBrace(panelOptions.dynamicHref, selectedRow);
                            $element.panel('refresh', newHref);
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

})(jQuery);;$(function(){
	managerTool = {
		reload : function (options) {
			$(options.datagridId).datagrid('reload');
		},
		redo : function (options) {
			$(options.datagridId).datagrid('unselectAll');
		},
		add : function (options) {
			$(options.addDialogId).dialog('open').form('reset');
		},
		remove : function (options) {
			if(options) {
				var rows = $(options.datagridId).datagrid('getSelections');
				if (rows.length > 0) {
					$.messager.confirm('确定操作', '您确定要删除所选的记录吗？', function (flag) {
						if (flag) {
							var uuids = [];
							for (var i = 0; i < rows.length; i ++) {
								uuids.push("'"+rows[i].uuid+"'");
							}
							//console.log(uuids.join(','));
							$.ajax({
								type : 'POST',
								url : options.url,
								data : {
									uuids : uuids.join(',')
								},
								beforeSend : function () {
									$(options.datagridId).datagrid('loading');
								},
								success : function (data) {
									if (data) {
										$(options.datagridId).datagrid('loaded');
										$(options.datagridId).datagrid('load');
										$(options.datagridId).datagrid('unselectAll');
										$.messager.show({
											title : '温馨提示',
											msg : '成功删除【' + data + '】条记录！'
										});
									}
								}
							});
						}
					});
				} else {
					$.messager.alert('提示操作', '请选择要删除的记录！', 'info');
				}
			}
		},
		edit : function (options) {
			if(options) {
				var rows = $(options.datagridId).datagrid('getSelections');
				if (rows.length > 1) {
					$.messager.alert('提示操作！', '编辑数据只能选择一条记录！', 'warning');
				} else if (rows.length == 1) {
					$.ajax({
						url : options.url,
						type : 'post',
						dataType: 'json',
						data : {
							uuid : rows[0].uuid
						},
						beforeSend : function () {
							$.messager.progress({
								text : '正在获取中...'
							});
						},
						success : function (data, response, status) {
							$.messager.progress('close');
								
							if (data) {
								var params = '{';
								$.each(options.transferData, function (k, v) {
									params += '"' + v + '": "' + data[v.replace("Edit", "")] + '", ';
								});
								params += '"endStr": "1"}';
								
								$(options.editDialogId).dialog('open');
								setTimeout(function() {
									$(options.editDialogId).form('load', $.parseJSON(params));
							    }, 100);
							} else {
								$.messager.alert('获取失败！', '未知错误导致失败，请重试！', 'warning');
							}
						}
					});
				} else if (rows.length == 0) {
					$.messager.alert('提示操作！', '编辑数据请至少选择一条记录！', 'warning');
				}
			}
		}
	}
});(function($){
	
	$.fn.iTree = function(options) {
		var defaults = {
			treeId : this.selector,
			url    : ctx + '/system/codeItem/getListByCodesetidAndLevelid?codeSetId={codeSetId}&levelId={levelId}',
			expandUrl : ctx + '/system/codeItem/getListByPid?pid={pid}',
	        lines : false,
	        animate : true,
	        border : false,
	        clickEvent : 'clickEventName',
	        queryParams : {
				
			},
			onContextMenu: '',
			refreshDatagridId : '#datagrid'
		}
		
		var options = $.extend(defaults, options);
		
		if(options.url.indexOf("codeSetId") == -1) {
			options.url = options.url + "?codeSetId=" + options.codeSetId + "&levelId=" + options.levelId;
		} else {
			options.url = options.url.replace("{codeSetId}", options.codeSetId).replace("{levelId}", options.levelId);
		}
		
		if(options.treeId == "") {
			options.treeId = $(this).context;
		}
		
		$(this).tree({
            url: options.url,
            lines: options.lines,
            animate: options.animate,
            border: options.border,
            onContextMenu: options.onContextMenu,
            onBeforeExpand:function(node,param) {
                $(options.treeId).tree('options').url = options.expandUrl.replace("{pid}", node.id);
            },
            onClick : function(node) {
            	
            	if(options.clickEvent == 'postCodeItemIdAndRefreshDatagrid') {
            		
            		//if(node.attributes != undefined && typeof node.attributes != "object") {
            			//console.log(node.attributes);
                		//node.attributes = $.parseJSON(node.attributes);
             	    //}
                	//if(options.clickEvent == 'postCodeItemId') {
                	//if( node.attributes.event == 'postCodeItemId') {	
                    	//if(node.attributes) {
                    		var dg = $(options.refreshDatagridId);
                     	    var queryParams = dg.datagrid('options').queryParams;
                     	    newQueryParams = options.queryParams;
                     	    newQueryParams.codeSetId = node.codesetid;
                     	    newQueryParams.codeItemId = node.id;
                     	    newQueryParams.pid = node.pid;
                     	    newQueryParams.code = node.code;
                     	    dg.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                     	    dg.datagrid('reload');
                        //}
                    //}
                	
            	}else if(options.clickEvent == 'postTreeParamsAndRefreshDatagrid') {
            		var dg = $(options.refreshDatagridId);
             	    var queryParams = dg.datagrid('options').queryParams;
             	    newQueryParams = options.queryParams;
             	    newQueryParams.codeSetId = node.codesetid;
             	    newQueryParams.codeItemId = node.id;
             	    newQueryParams.id = node.id;
             	    newQueryParams.pid = node.pid;
             	    newQueryParams.text = node.text;
             	    newQueryParams.code = node.code;
             	    dg.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
             	    dg.datagrid('reload');
            	} else {
            		
            		if (node.state == "closed") {
                        $(options.treeId).tree('expand', node.target);
                    } else {
                    	$(options.treeId).tree('collapse', node.target);
                    }
            		
            	}
            	
            },
            onLoadSuccess : function() {
            	setTimeout(function(){
            		var rootNode = $(options.treeId).tree('getRoot');
                	$(options.treeId).tree("expand", rootNode.target);
            	},1000);
            	
            }
        });
		
	}

})(jQuery);;(function ($) {
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
            }
        });

    }

})(jQuery);;(function($){
	
	$.fn.myWindow = function(options) {
	    var defaults = {
	        width: 500,             //宽度
	        height: 400,            //高度
	        iconCls: '',            //图标class
	        collapsible: false,     //折叠
	        minimizable: false,     //最小化
	        maximizable: false,     //最大化
	        resizable: false,       //改变窗口大小
	        title: '窗口标题',         //窗口标题
	        modal: true,            //模态    
	        submit: function () {
	            alert('写入执行的代码。');
	        },
	        html: ''
	    }
	    
	    var options = $.extend(defaults,options);
	    var html = options.html;
	    $('#w').window({title:options.title,width:options.width,height:options.height,content:buildWindowContent(html,options.submit),
	        collapsible:options.collapsible,minimizable:options.minimizable,maximizable:options.maximizable,
	        modal:options.modal,iconCls:options.iconCls
	    }).window('open');
	    
	    function buildWindowContent(contentHTML,fn){
	        var centerDIV = $('<div region="center" border="false" style="padding:5px;"></div>').html(contentHTML);
	
	        $('<div class="easyui-layout" fit="true"></div>')
	        .append(centerDIV)
	        .append('<div region="south" border="false" style="padding-top:5px;height:40px; overflow:hidden; text-align:center;background:#fafafa;border-top:#eee 1px solid;">  <a iconCls="icon-ok">确定</a><a iconCls="icon-cancel">取消</a></div>')
	        .appendTo($('#w').empty())
	        .layout();
	
	        $('.easyui-layout a[iconCls]').linkbutton();
	
	        $('a[iconCls="icon-cancel"]').click(function(){
	            $('#w').window('close');
	        });
	
	        $('a[iconCls="icon-ok"]').unbind('click').click(fn);
	    }
	
	}
})(jQuery);