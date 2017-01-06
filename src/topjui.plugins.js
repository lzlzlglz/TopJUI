+function ($) {
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
                'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat',
                'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist',
                'insertunorderedlist', 'selectall', 'cleardoc', '|',
                'rowspacingtop', 'rowspacingbottom', 'lineheight', '|', 'paragraph', 'fontfamily', 'fontsize', '|',
                'indent', '|', 'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
                'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
                'simpleupload', 'insertimage', 'emotion', 'insertvideo', 'music', 'attachment', 'map', 'insertcode', '|',
                'horizontal', 'spechars', 'wordimage', '|',
                'inserttable', 'deletetable', 'insertparagraphbeforetable', 'insertrow', 'deleterow', 'insertcol',
                'deletecol', 'mergecells', 'mergeright', 'mergedown', 'splittocells', 'splittorows', 'splittocols', '|',
                'preview', 'drafts']];
            var simpleToolbars = [["fullscreen", "source", "undo", "redo", "bold", "italic", "underline", "fontborder", "strikethrough", "superscript", "subscript", "insertunorderedlist", "insertorderedlist", "justifyleft", "justifycenter", "justifyright", "justifyjustify", "removeformat", "simpleupload", "snapscreen", "emotion", "attachment", "link", "unlink", "indent", "lineheight", "autotypeset"]];
            var ue = UE.getEditor(options.id, {
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
                uploadType: 'image'
            }
            var options = $.extend(defaults, options);

            var ueUpload;
            setTimeout(function () {
                //UE.delEditor(options.id);
                //http://www.cnblogs.com/stupage/p/3145353.html
                //重新实例化一个编辑器，上传独立使用，防止在上面的editor编辑器中显示上传的图片或者文件
                ueUpload = UE.getEditor(options.id, {
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
                });
            }, 1000);

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
            getTabWindow().$('[data-toggle="topjui-datagrid2"]').each(function (i) {
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
                getTabWindow().$('#' + options.id).iDatagrid2(options);
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
            getTabWindow().$('[data-toggle="topjui-dialog2"]').each(function () {
                var $element = $(this);
                var options = getOptionsJson($element);

                var href = $element.attr('href');
                if (href != undefined) {
                    options.href = href;
                    getTabWindow().$('body').append('<div id="' + options.id + '"></div>');
                    getTabWindow().$('#' + options.id).iDialog2(options);

                    $element.on("click", function () {
                        getTabWindow().$('#' + options.id).dialog2('open');
                        return false; //阻止链接跳转
                    });

                } else {
                    $element.attr('id', options.id);
                    getTabWindow().$('#' + options.id).iDialog2(options);
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
            getTabWindow().$('[data-toggle="topjui-datagrid"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                var op = [];
                getTabWindow().$("th").each(function (i) {
                    op.push(strToJson("{" + this.getAttribute("data-options") + "}"));
                });
                options.columns = [op];

                var kindEditor = [];


                //console.log(op.join());

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iDatagrid(options);
            });

            getTabWindow().$('[data-toggle="topjui-menu"]').each(function (i) {
                var $element = $(this);
                var options = getOptionsJson($element);

                $element.attr('id', options.id);
                getTabWindow().$('#' + options.id).iMenu(options);
            });

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
            editable: false
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
            width: 100,
            panelHeight: 198,
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
            panelHeight: 44,
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
    if (url != "/system/index/index") {
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

        if ($.cookie("gridType") == "datagrid") {
            $("#" + $.cookie("gridId")).datagrid('load', {
                filterRules: JSON.stringify(formDataArr)
            });
        } else if ($.cookie("gridType") == "treegrid") {
            $("#" + $.cookie("gridId")).treegrid('load', {
                filterRules: JSON.stringify(formDataArr)
            });
        }

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

});