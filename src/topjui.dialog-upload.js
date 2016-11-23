(function($){
	
	$.fn.iDialogUpload = function(options) {
		var defaults = {
			width   : 800,
			height  : 600,
			title   : '修改管理',
			modal   : true,
			closed  : true,
			iconCls : 'icon-save',
			postfix : 'Edit',
			combotreeFields : '',
			refreshTreeId : '',
			formId : '#editForm'
		}
		
		var options = $.extend(defaults, options);

		$(this).dialog({
			width   : options.width,
			height  : options.height,
			title   : options.title,
			modal   : options.modal,
			closed  : options.closed,
			iconCls : options.iconCls,
			href 	: options.href,
			buttons : [{
				text : '上传',
				iconCls : 'icon-save',
				handler : function () {

					//var params = '{';
					//$.each(options.editFields, function (k, v) {
						//params += '"' + v.replace(options.postfix, "") + '": "' + html_encode($(options.currentDialogId +' input[name="' + v + '"]').val()) + '", ';
					//});
					//params += '"endStr": "1"}';
					
					var jsonData = null;
					if(options.combotreeFields != "") {
						var combotreeParams = '{';
						$.each(options.combotreeFields, function (k, v) {
							combotreeParams += '"' + v.replace(options.postfix, "") + '": "' + $(options.currentDialogId +' input[textboxname="' + v + '"]').combotree('getValues').join(',') + '", ';
						});
						combotreeParams += '"endStr": "1"}';
						jsonData = $.extend($.parseJSON(params), $.parseJSON(combotreeParams));
					} else {
						//jsonData = $.parseJSON(params);
					}
					
					//console.log(jsonData);
					//console.log($.parseJSON(combotreeParams));
					//console.log($.extend($.parseJSON(params), $.parseJSON(combotreeParams)));
					
					if($("form input[name='uuid']").val() == "") {
						options.url = options.saveUrl;
					} else {
						options.url = options.updateUrl;
					}
					
					if ($(this).form('validate')) {
														
								$.ajax({
									url : options.url,
									type : 'post',
									data : $(options.formId).serialize(),
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
											$(options.currentDialogId).dialog('close').form('reset');
											$(options.datagridId).datagrid('reload');
											
											if(options.refreshTreeId) {
												var node = $(options.refreshTreeId).tree('getSelected');									
												var parentNode = $(options.refreshTreeId).tree('getParent', node.target);
												$(options.refreshTreeId).tree('reload', parentNode.target);
												//$(options.refreshTreeId).tree('reload', node.target);
											}
											
										} else {
											$.messager.alert('操作失败！', '未知错误或没有任何修改，请重试！', 'warning');
										}
									}
								});


					}
					
				}
			},{
				text : '取消',
				iconCls : 'icon-cancel',
				handler : function () {
					$(this).dialog('close').form('reset');
				}
			}],
			onOpen : function() {
				$(options.currentDialogId).dialog('refresh');
			},
			onClose : function() {
				$(options.currentDialogId).dialog('clear');
			}
	    });
		
	}

})(jQuery);