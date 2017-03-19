(function($){
	
	$.fn.iDialog = function(options) {
		var defaults = {
			currentDialogId : this.selector,
			width   : 650,
			height  : 'auto',//宽高限制650*450,900*500
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
				$(this).dialog("center");
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
					var jsonData = getSelectedRowJson(options.parentGrid.params, parentRow);
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

})(jQuery);