(function($){
	
	$.fn.iDialog = function(options) {
		var defaults = {
			currentDialogId : this.selector,
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
			datagridId : '#datagrid'
		}
		
		var options = $.extend(defaults, options);
		
		var indexUrl = window.location.pathname;
		var controllerUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/")+1);
		options.getDetailUrl = options.getDetailUrl ? options.getDetailUrl : controllerUrl + "getDetailByUuid";
		options.addHref = options.href ? options.href + location.search : controllerUrl + "add" + location.search;
		options.saveUrl = options.saveUrl ? options.saveUrl :  controllerUrl + "save";
		options.editHref = options.href ? options.href + location.search : controllerUrl + "edit" + location.search;
		options.updateUrl = options.updateUrl ? options.updateUrl :  controllerUrl + "update";
		options.processUpdateUrl = options.processUpdateUrl ? options.processUpdateUrl : controllerUrl + "processUpdate";
		options.processRollBackUrl = options.processRollBackUrl ? options.processRollBackUrl : controllerUrl + "processRollBackUrl";
		
		options.href = options.editHref;
		
		if(options.currentDialogId == "") {
			options.currentDialogId = options.id;
		}
		if(options.currentDialogId.indexOf('#') == -1){
			options.currentDialogId = '#'+options.currentDialogId;
		}
		if(options.datagridId == ""){
			options.datagridId = '#'+options.refreshDatagridId;
		}
		
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
			openAnimation : options.openAnimation,
			openDuration : options.openDuration,
			zIndex : 10,
			buttons : [{
				text : '新增',
				//id : 'addBtn',
				iconCls : 'icon-add',
				handler : function () {
					if ($(options.currentDialogId).form('validate')) {
						
						var formData = $(options.currentDialogId).serialize();
						if(options.combotreeFields != "") {
							var combotreeParams = '';
							$.each(options.combotreeFields, function (k, v) {
								combotreeParams += '&' + v.replace(options.postfix, "") + '='+ $(options.currentDialogId +' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
							});
							//combotreeParams += '"endStr": "1"}';
							//formData = $.extend($(options.formId).serialize(), $.parseJSON(combotreeParams));
							formData += combotreeParams;
						}
														
						$.ajax({
							url : options.saveUrl,
							type : 'post',
							cache:false,
							data : formData,
							dataType: "json",
							contentType: "application/x-www-form-urlencoded;charset=utf-8",
							beforeSend : function () {
								$.messager.progress({
									text : '正在操作...'
								});
							},
							success : function (data, response, status) {
								$.messager.progress('close');
								msgFn(data);
							}
						});


					} else {
						$.messager.show({
							title : '提示',
							msg : '显示红色的字段为必填字段'
						});
					}
				}
			},{
				text : '保存',
				//id : 'saveBtn',
				iconCls : 'icon-save',
				handler : function () {

					//var params = '{';
					//$.each(options.editFields, function (k, v) {
						//params += '"' + v.replace(options.postfix, "") + '": "' + html_encode($(options.currentDialogId +' input[name="' + v + '"]').val()) + '", ';
					//});
					//params += '"endStr": "1"}';
					
					//console.log(jsonData);
					//console.log($.parseJSON(combotreeParams));
					//console.log($.extend($.parseJSON(params), $.parseJSON(combotreeParams)));
										
					if ($(options.currentDialogId).form('validate')) {
						
						var formData = $(options.currentDialogId).serialize();
						if(options.combotreeFields != "") {
							var combotreeParams = '';
							$.each(options.combotreeFields, function (k, v) {
								combotreeParams += '&' + v.replace(options.postfix, "") + '='+ $(options.currentDialogId +' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
							});
							//combotreeParams += '"endStr": "1"}';
							//formData = $.extend($(options.formId).serialize(), $.parseJSON(combotreeParams));
							formData += combotreeParams;
						}
														
						$.ajax({
							url : options.updateUrl,
							type : 'post',
							data : formData,
							dataType: "json",
							contentType: "application/x-www-form-urlencoded;charset=utf-8",
							beforeSend : function () {
								$.messager.progress({
									text : '正在操作...'
								});
							},
							success : function (data, response, status) {
								$.messager.progress('close');
								msgFn(data);
								$(options.currentDialogId).dialog('close').form('reset');
								$(options.datagridId).datagrid('reload');
							}
						});


					} else {
						$.messager.show({
							title : '提示',
							msg : '显示红色的字段为必填字段'
						});
					}
					
				}
			},{
				text : '提交流程',
				//id : 'processBtn',
				iconCls : 'icon-redo',
				handler : function () {

					//var params = '{';
					//$.each(options.editFields, function (k, v) {
						//params += '"' + v.replace(options.postfix, "") + '": "' + html_encode($(options.currentDialogId +' input[name="' + v + '"]').val()) + '", ';
					//});
					//params += '"endStr": "1"}';
					
					//console.log(jsonData);
					//console.log($.parseJSON(combotreeParams));
					//console.log($.extend($.parseJSON(params), $.parseJSON(combotreeParams)));
										
					if ($(options.currentDialogId).form('validate')) {
						
						var formData = $(options.currentDialogId).serialize();
						if(options.combotreeFields != "") {
							var combotreeParams = '';
							$.each(options.combotreeFields, function (k, v) {
								combotreeParams += '&' + v.replace(options.postfix, "") + '='+ $(options.currentDialogId +' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
							});
							formData += combotreeParams;
						}
														
						$.ajax({
							url : options.processUpdateUrl,
							type : 'post',
							data : formData,
							dataType: "json",
							contentType: "application/x-www-form-urlencoded;charset=utf-8",
							beforeSend : function () {
								$.messager.progress({
									text : '正在操作...'
								});
							},
							success : function (data, response, status) {
								$.messager.progress('close');
								msgFn(data);
							}
						});


					} else {
						$.messager.show({
							title : '提示',
							msg : '显示红色的字段为必填字段'
						});
					}
					
				}
			},{
				text : '退回流程',
				//id : 'rollBackBtn',
				iconCls : 'icon-undo',
				handler : function () {
										
					if ($(options.currentDialogId).form('validate')) {
						
						var formData = $(options.currentDialogId).serialize();														
						$.ajax({
							url : options.processRollBackUrl,
							type : 'post',
							data : formData,
							dataType: "json",
							contentType: "application/x-www-form-urlencoded;charset=utf-8",
							beforeSend : function () {
								$.messager.progress({
									text : '正在操作...'
								});
							},
							success : function (data, response, status) {
								$.messager.progress('close');
								msgFn(data);
							}
						});


					} else {
						$.messager.show({
							title : '提示',
							msg : '显示红色的字段为必填字段'
						});
					}
					
				}
			},{
				text : '上传并导入',
				//id : 'processBtn',
				iconCls : 'icon-sys',
				handler : function () {
								
					if ($(options.currentDialogId).form('validate')) {
						
						var formData = $(options.currentDialogId).serialize();
						if(options.combotreeFields != "") {
							var combotreeParams = '';
							$.each(options.combotreeFields, function (k, v) {
								combotreeParams += '&' + v.replace(options.postfix, "") + '='+ $(options.currentDialogId +' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
							});
							formData += combotreeParams;
						}
														
						$.ajax({
							url : options.url,
							type : 'post',
							data : formData,
							dataType: "json",
							contentType: "application/x-www-form-urlencoded;charset=utf-8",
							beforeSend : function () {
								$.messager.progress({
									text : '正在操作...'
								});
							},
							success : function (data, response, status) {
								$.messager.progress('close');
								msgFn(data);
							}
						});


					} else {
						$.messager.show({
							title : '提示',
							msg : '显示红色的字段为必填字段'
						});
					}
					
				}
			},{
				text : '取消',
				iconCls : 'icon-cancel',
				handler : function () {
					$(options.currentDialogId).dialog('close').form('clear');
				}
			}],
			onLoad : function() {
				$(this).trigger(topJUI.eventType.initUI.form);
			},
			onOpen : function() {
				//$(this).dialog("refresh");
				//$("#partyBranchId").combotree("reload");
				var currentDialogHref = $(options.currentDialogId).dialog("options").href;

				//showHiddenBtn(options.button);
				
				$.get(ctx + "/system/authAccess/getDetailByRoleIdAndUrl",  function(data) {
    				if(currentDialogHref.indexOf("action=edit") > 0){
    					if(options.processDeal == true) {
    						var uuid = $.getUrlStrParam(currentDialogHref, "uuid");
							$.get(options.getDetailUrl + "?uuid=" + uuid,  function(data) {
								var userNameId = parent.$('#userNameId').val();
			    				if(data.currentUserNameId == userNameId) {
			    					showHiddenBtn(0, 1, 1, 1, 0, 1);
			    				} else {
			    					showHiddenBtn(0, 0, 0, 0, 0, 1);
			    				}
			                }, 'json');
							
    					} else {
    						showHiddenBtn(0, data.editAuth, 0, 0, 0, 1);
    					}
    				} else if(currentDialogHref.indexOf("Import") > 0) {
    					showHiddenBtn(0, 0, 0, 0, 1, 1);
    				} else {
    					showHiddenBtn(1, 0, 0, 0, 0, 1);
    				}
				
				}, 'json');
				
				
				//$(options.currentDialogId).dialog('refresh');
			},
			onClose : function() {
				$(options.currentDialogId).form('clear');
				//$(this).dialog("refresh");
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

})(jQuery);