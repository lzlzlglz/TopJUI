(function ($) {

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
            height: 22,
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
            height: 22,
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
            buttonText: options.buttonText,
            buttonAlign: options.buttonAlign
        });
    }

    $.fn.iNumberspinner = function (options) {
        var defaults = {
            min: 0,
            max: 10000,
            width: 153,
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
            height: 22,
            url: ctx + '/system/codeItem/getListByCodesetidAndLevelid?codeSetId={codeSetId}&levelId={levelId}',
            data: '',
            codeSetId: 0,
            pid: 0,
            valueField: 'text',
            textField: 'text',
            editable: false,
            panelHeight: 44,
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
            formatter: options.formatter,
            required: options.required,
            onChange: function(newValue, oldValue) {
                //重载级联combobox内容
                if (typeof options.childCombobox == "object") {
                    var url = appendUrlParam(options.childCombobox.url , "newValue=" + newValue);
                    $('#' + options.childCombobox.id).combobox('reload', url);
                }
            },
            onSelect: function(record) {
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

    var combobox_formatter = function (value, row) {
        if (value == 0) {
            return value.text;
        } else {
            return value.text;
        }
    }

    $.fn.iAutoComplete = function (options) {
        var defaults = {
            selector: this.selector,
            url: ctx + "/system/user/getListByUserName?userName=",
            valueField: 'userNameId',
            textField: 'userName',
            width: 450,
            fieldId: 'userNameId',
            required: false
        }

        var options = $.extend(defaults, options);

        $(this).combobox({
            valueField: options.valueField,
            textField: options.textField,
            width: options.width,
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

})(jQuery);