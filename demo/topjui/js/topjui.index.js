var index_layout;
var index_tabs;
var index_tabsMenu;
var layout_west_tree;
var layout_west_tree_url = '';

var sessionInfo_userId = '${sessionInfo.id}';
if (sessionInfo_userId) {// 如果没有登录,直接跳转到登录页面
    layout_west_tree_url = ctx + '/System/Menu/getListByCodeSetIdAndPid?codeSetId=menu&pid=0';
} else {
    // window.location.href='${ctx}/system/login/index';
}

/**
 * 首页加载完后，取消加载中状态
 */
$(window).load(function () {
    $("#loading").fadeOut();
});

$(function () {

    //监听右键事件，创建右键菜单
    $('#index_tabs').tabs({
        onContextMenu: function (e, title, index) {
            e.preventDefault();
            if (index >= 0) {
                $('#mm').menu('show', {
                    left: e.pageX,
                    top: e.pageY
                }).data("tabTitle", title);
            }
        }
    });

    //右键菜单click
    $("#mm").menu({
        onClick: function (item) {
            tabMenuOprate(this, item.name);
        }
    });

    // 首页布局
    index_layout = $('#index_layout').layout({
        fit: true
    });

    // 首页tabs选项卡
    index_tabs = $('#index_tabs').tabs({
        fit: true,
        border: false,
        tools: [{
            iconCls: 'icon-house',
            handler: function () {
                index_tabs.tabs('select', 0);
            }
        }, {
            iconCls: 'icon-reload',
            handler: function () {
                var refresh_tab = $('#index_tabs').tabs('getSelected');
                var refresh_iframe = refresh_tab.find('iframe')[0];
                refresh_iframe.contentWindow.location.href = refresh_iframe.src;
                //$("#index_tabs").trigger(TOPJUI.eventType.initUI.base);

                //var index = index_tabs.tabs('getTabIndex', index_tabs.tabs('getSelected'));
                //console.log(index);
                //index_tabs.tabs('getTab', index).panel('refresh');
            }
        }, {
            iconCls: 'icon-no',
            handler: function () {
                var index = index_tabs.tabs('getTabIndex', index_tabs.tabs('getSelected'));
                var tab = index_tabs.tabs('getTab', index);
                if (tab.panel('options').closable) {
                    index_tabs.tabs('close', index);
                }
            }
        }]
    });

    // 首页左侧导航树
    layout_west_tree = $('#layout_west_tree').tree({
        url: layout_west_tree_url,
        parentField: 'pid',
        lines: true,
        animate: true,
        onClick: function (node) {
            if (node.attributes && node.attributes.url) {
                var url = '${ctx}' + node.attributes.url;
                addTab({
                    url: url,
                    title: node.text,
                    iconCls: node.iconCls
                });
            }
        }
    });

    // 初始化accordion
    $("#RightAccordion").accordion({
        fit: true,
        border: false
    });

    // 主页打开初始化时显示第一个系统的菜单
    //$('.systemName').eq('0').trigger('click');
    generateMenu(1325);

    // 显示系统首页
    setTimeout(function () {
        var indexTab = [];
        indexTab.iconCls = "icon-house";
        indexTab.text = "系统门户";
        var portal = $.getUrlParam("portal");
        if (portal == "system" || portal == null) portal = "system";
        indexTab.url = "html/portal/index.html";
        indexTab.closable = false;
        indexTab.border = false;
        addTab(indexTab);
    }, 1);

});

// Tab菜单操作
function tabMenuOprate(menu, type) {
    var allTabs = $("#index_tabs").tabs('tabs');
    var allTabtitle = [];
    $.each(allTabs, function (i, n) {
        var opt = $(n).panel('options');
        if (opt.closable)
            allTabtitle.push(opt.title);
    });
    var curTabTitle = $(menu).data("tabTitle");
    var curTabIndex = $("#index_tabs").tabs("getTabIndex", $("#index_tabs").tabs("getTab", curTabTitle));
    switch (type) {
        case "1"://关闭当前
            if (curTabIndex > 0) {
                $("#index_tabs").tabs("close", curTabTitle);
                return false;
                break;
            } else {
                $.messager.show({
                    title: '操作提示',
                    msg: '首页不允许关闭！'
                });
                break;
            }
        case "2"://全部关闭
            for (var i = 0; i < allTabtitle.length; i++) {
                $('#index_tabs').tabs('close', allTabtitle[i]);
            }
            break;
        case "3"://除此之外全部关闭
            for (var i = 0; i < allTabtitle.length; i++) {
                if (curTabTitle != allTabtitle[i])
                    $('#index_tabs').tabs('close', allTabtitle[i]);
            }
            $('#index_tabs').tabs('select', curTabTitle);
            break;
        case "4"://当前侧面右边
            for (var i = curTabIndex; i < allTabtitle.length; i++) {
                $('#index_tabs').tabs('close', allTabtitle[i]);
            }
            $('#index_tabs').tabs('select', curTabTitle);
            break;
        case "5": //当前侧面左边
            for (var i = 0; i < curTabIndex - 1; i++) {
                $('#index_tabs').tabs('close', allTabtitle[i]);
            }
            $('#index_tabs').tabs('select', curTabTitle);
            break;
        case "6": //刷新
            var refresh_tab = $('#index_tabs').tabs('getSelected');
            var refresh_iframe = refresh_tab.find('iframe')[0];
            refresh_iframe.contentWindow.location.href = refresh_iframe.src;
            //$("#index_tabs").trigger(TOPJUI.eventType.initUI.base);
            break;
    }

}

// 常用链接树
$('#channgyongLink').tree({
    url: ctx + '/system/link/getListById?id=1',
    formatter: function (node) {
        if (node.url)
            return '<a href="' + node.url + '" target="_blank">' + node.text + '</a>';
        else
            return node.text;
    },
    onLoadSuccess: function (node, data) {
        $(this).tree("expandAll");
    },
    onBeforeExpand: function (node) {
        $(this).tree('options').url = ctx + '/system/link/getListByPid?pid=' + node.id;
    }
});

/**
 * 更换页面风格
 * @param easyuiThemeName
 */
function changeTheme(themeName) {/* 更换主题 */
    var $easyuiTheme = $('#easyuiTheme');
    var url = $easyuiTheme.attr('href');
    var href = url.substring(0, url.indexOf('themes')) + 'themes/' + themeName + '/easyui.css';
    $easyuiTheme.attr('href', href);

    var $iframe = $('iframe');
    if ($iframe.length > 0) {
        for (var i = 0; i < $iframe.length; i++) {
            var ifr = $iframe[i];
            $(ifr).contents().find('#easyuiTheme').attr('href', href);
        }
    }

    $.cookie('easyuiThemeName', themeName, {
        expires: 7,
        path: '/'
    });
};
if ($.cookie('easyuiThemeName')) {
    changeTheme($.cookie('easyuiThemeName'));
}

// 退出系统
function logout() {
    $.messager.confirm('提示', '确定要退出吗?', function (r) {
        if (r) {
            $.messager.progress({
                text: '正在退出中...'
            });
            window.location.href = ctx + '/system/login/logout' + location.search;
        }
    });
}

// 修改密码
function editUserPwd() {
    $("#modifyPassword").dialog({
        title: '修改密码',
        width: 400,
        height: 'auto',
        href: '/html/user/modifyPassword.html',
        buttons: [{
            text: '确定',
            iconCls: 'icon-save',
            handler: function () {
                if ($("#password").val().length < 6) {
                    $.messager.alert('警告', '密码长度不能小于6位');
                } else {
                    var formData = $("#modifyPassword").serialize();
                    $.ajax({
                        url: ctx + '/system/user/updateModifyPassword',
                        type: 'post',
                        cache: false,
                        data: formData,
                        beforeSend: function () {
                            $.messager.progress({
                                text: '正在操作...'
                            });
                        },
                        success: function (data, response, status) {
                            $.messager.progress('close');
                            if (data > 0) {
                                $.messager.show({
                                    title: '提示',
                                    msg: '操作成功'
                                });
                                $("#modifyPassword").dialog('close').form('reset');

                            } else {
                                $.messager.alert('操作失败！', '未知错误或没有任何修改，请重试！', 'warning');
                            }
                        }
                    });
                }
                //if($('#userPass').validatebox('isValid')){

                //}
            }
        }]
    });
}

// 生成左侧导航菜单
function generateMenu(menuId) {

    var allPanel = $("#RightAccordion").accordion('panels');
    var size = allPanel.length;
    if (size > 0) {
        for (i = 0; i < size; i++) {
            var index = $("#RightAccordion").accordion('getPanelIndex', allPanel[i]);
            $("#RightAccordion").accordion('remove', 0);
        }
    }

    var url = ctx + "json/menu/menu_" + menuId + ".json";
    $.get(
        url, {"levelId": "2"}, // 获取第一层目录
        function (data) {
            if (data == "0") {
                window.location = "/Account";
            }
            $.each(data, function (i, e) {// 循环创建手风琴的项
                var pid = e.pid;
                $('#RightAccordion').accordion('add', {
                    title: e.text,
                    content: "<ul id='tree" + e.id + "' ></ul>",
                    selected: true,
                    iconCls: e.iconCls,
                });
                $.parser.parse();
                $.get(ctx + "json/menu/menu_" + e.id + ".json", function (data) {// 循环创建树的项
                    $("#tree" + e.id).tree({
                        data: data,
                        lines: false,
                        animate: true,
                        onBeforeExpand: function (node, param) {
                            $("#tree" + e.id).tree('options').url = ctx + "json/menu/menu_" + node.id + ".json";
                        },
                        onClick: function (node) {
                            if (node.url) {
                                /*if(typeof node.attributes != "object") {
                                 node.attributes = $.parseJSON(node.attributes);
                                 }*/
                                addTab(node);
                            } else {
                                if (node.state == "closed") {
                                    $("#tree" + e.id).tree('expand', node.target);
                                } else if (node.state == 'open') {
                                    $("#tree" + e.id).tree('collapse', node.target);
                                }
                            }
                        }
                    });
                }, 'json');
            });
        }, "json"
    );

}

var _hmt = _hmt || [];
(function () {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?9bbb7536a0474a4ad060a6fdc8a678b5";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();