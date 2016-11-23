(function($){
	
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

})(jQuery);