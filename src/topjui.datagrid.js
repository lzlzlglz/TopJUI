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

(function($){
	$.fn.iDatagrid = function(options) {
		var defaults = {
		    //datagridId       : element.get(0).id,
			datagridId       : this.selector,
			width            : '100%',
			height           : '100%',
            autoRowHeight    : false,
            nowrap           : true,
            fit              : true,
            fitColumns		 : false,
    		border           : false,
            striped          : true,
            singleSelect     : true,
            url              : "",
            columns          : [[{field:'uuid',title:'UUID',align:'center'},
                                {field:'title',title:'标题',align:'left'},
                                {field:'creator',title: '发布人',align: 'center'},
                                {field:'createTime',title: '发布时间',align: 'center'}]],
            sortName	     : "createTime",
            sortOrder        : "desc",
            //toolbar          : this.selector + 'Toolbar',
            addButton        : true,
            editButton       : true,
            deleteButton     : true,
            searchButton     : true,
            addDialogTitle   : '新增',
            editDialogTitle  : '编辑',
            loadMsg          : "数据加载中,请稍后...",
            rownumbers       : true,
            pagination       : true,
            pageNumber       : 1,
            pageSize         : 20,
            pageList         : [10, 20, 30, 40, 50],
            editable    	 : true,
            queryFormId      : "",      // search form id
            queryAction      : "",      // search from action
            infoFormId       : "",      // info form id
            infoAddAction    : "",    	// info data add action
            infoUpdateAction : "", 		// info update action
            infoDlgDivId     : "",     	// info data detail/edit dlg div id
            deleteAction     : "",     	// data delete action  from ajax
            deleteMsg        : "",      // show the message before do delete
            moveDlgDivId     : "",     	// the div id of dialog for move show
            moveFormId       : "",      // the form id for move
            moveTreeId       : "",      // the combotree id for move
            queryParams      : {},      // search params name for post, must to be {}
            queryParamsVCN   : {},   	// search params value from htmlcontrol name, must to be {}
            
            kindEditor       : [],
            addDialogId      : '#editDialog',
            editDialogId     : '#editDialog'
		}
		
		var options = $.extend(defaults, options);
		
		var indexUrl = window.location.pathname;
		var controllerUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/")+1);
		options.datagridUrl = options.datagridUrl ? options.datagridUrl : controllerUrl + "getPageSetData";
		options.getDetailUrl = options.getDetailUrl ? options.getDetailUrl : controllerUrl + "getDetailByUuid";
		options.addDialogHref = options.addDialogHref ? options.addDialogHref : controllerUrl + "add";
		options.saveUrl = options.saveUrl ? options.saveUrl : controllerUrl + "save";
		options.editDialogHref = options.editDialogHref ? options.editDialogHref : controllerUrl + "edit";
		options.updateUrl = options.updateUrl ? options.updateUrl : controllerUrl + "update";
		options.deleteUrl = options.deleteUrl ? options.deleteUrl : controllerUrl + "delete";
		
		$(this).datagrid({
			filterBtnIconCls:'icon-filter',
			remoteFilter  : true,
	        width         : options.width,
            height        : options.height,
            autoRowHeight : options.autoRowHeight,
            nowrap        : options.nowrap,
            striped       : options.striped,
            singleSelect  : options.singleSelect,
            url           : options.datagridUrl + location.search,
            //queryParams : {},
            loadMsg       : options.loadMsg,
            rownumbers    : options.rownumbers,
            pagination    : options.pagination,
            paginPosition : 'bottom',
            pageNumber    : options.pageNumber,
            pageSize      : options.pageSize,
            pageList      : options.pageList,
            columns       : options.columns,
            sortName	  : options.sortName,
            sortOrder     : options.sortOrder,
            fit           : options.fit,
    		fitColumns    : options.fitColumns,
    		border        : options.border,
    		//bodyCls : "leftBottomBorder",
    		onBeforeLoad  : function(param) {
    			$.get(ctx + "/system/authAccess/getDetailByRoleIdAndUrl",  function(data) {
    				if(data.addAuth != 1 || options.addButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "添加");
    				}
    				if(data.editAuth != 1 || options.editButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "修改");
    				}
    				if(data.deleteAuth != 1 || options.deleteButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "删除");
    				}
    				if(data.searchAuth != 1 || options.searchButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "查询");
    				}
    				if(data.importAuth != 1 || options.importButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "导入");
    				}
    				if(data.exportAuth != 1 || options.exportButton == false) {
    					$(options.datagridId).datagrid("removeToolbarItem", "导出");
    				}
                }, 'json');
    		},
            onLoadSuccess : function() {
            	$(this).datagrid("fixRownumber");
            },
            onClickRow    : function(index, row) {
            	if(options.refreshChildDatagrid) {
	            	var childDatagrid = $(options.childDatagridId);
	         	    var queryParams = childDatagrid.datagrid('options').queryParams;
	         	    queryParams2 = options.queryParams;
	         	    queryParams2.codeSetId = row.id;
	         	    childDatagrid.datagrid('options').queryParams = $.extend({}, queryParams, queryParams2);
	         	    childDatagrid.datagrid('reload');
            	}
            },
            onDblClickRow : editHandler,
            toolbar: [{
            	id: 'addButton',
                text: '添加',
                iconCls: 'icon-add',
                handler: function () {
                	
                	clearDialogHrefKeyValue(options.addDialogId, "action,uuid");
                	
        			$(options.addDialogId).dialog('open').form('reset');
        			
        			setTimeout(function() {
	        			$(options.addDialogId).dialog('setTitle', options.addDialogTitle);
						$('#addBtn').show();
						$('#saveBtn').hide();
						$('#processBtn').hide();
						
						/* kindeditor编辑器处理 */
						if(options.kindEditor.length > 0) {
							for(var i=0; i<options.kindEditor.length; i++) {  
							   for(var key in options.kindEditor[i]) {
							    	document.getElementsByTagName("iframe")[i].contentWindow.document.body.innerHTML = "";
							   }
							}
						}
        			}, 500);
					
        		}
            }, {
                text: '修改',
                iconCls: 'icon-edit',
                handler: editHandler
            }, /*'-', {
                text: '保存',
                iconCls: 'icon-save',
                handler: function () {
                    $(options.datagridId).datagrid('endEdit', editRow);
     
                    //如果调用acceptChanges(),使用getChanges()则获取不到编辑和新增的数据。
     
                    //使用JSON序列化datarow对象，发送到后台。
                    var rows = $(options.datagridId).datagrid('getChanges');
                    //console.log(rows[0]);
                    if(rows[0] == undefined) {
                    	$.messager.alert('操作失败！', '未知错误或没有任何修改，请重试！', 'warning');
                    } else {
	                    //var rowstr = JSON.stringify(rows);
	                    
                    	var url = null;
                        if(rows[0]["uuid"] == undefined) {
                        	url = options.saveUrl;
                        } else {
                        	url = options.updateUrl;
                        }
                    	
	                    $.ajax({
							url : url,
							type : 'post',
							data : rows[0],
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
									$(options.datagridId).datagrid('reload');
								} else {
									$.messager.alert('操作失败！', '未知错误或没有任何修改，请重试！', 'warning');
								}
							}
						});
                    }
                    
                    //$.post(options.saveUrl, rowstr, function (data) {
                         
                    //});
                }
            },*/ {
                text: '删除',
                iconCls: 'icon-no',
                handler: function () {
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
        								url : options.deleteUrl,
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
        		}
            }, {
                text: '查询',
                iconCls: 'icon-search',
                handler: function () {
                	//console.log($(options.datagridId + " .datagrid-filter-row").length);
                	//console.log($(".l-btn-text").index($(".l-btn-text:contains('查询')")));
                	if($(".datagrid-filter-row").length > 0) {
                		$(options.datagridId).datagrid('disableFilter', options.filterOption);
                		//$(".l-btn-text:contains('隐藏'):eq(1)").text("查询");
                	} else {
                		$(options.datagridId).datagrid('enableFilter', options.filterOption);
                		//$(".l-btn-text:contains('查询'):eq(1)").text("隐藏");
                	}
                }
            }, {
            	id: 'importButton',
                text: '导入',
                iconCls: 'icon-table-add',
                handler: function () {
                	
                	$(this).trigger(topJUI.eventType.initCombotree);
        			$("#importDialog").dialog('open');
        			
        			/*setTimeout(function() {
	        			$(options.importDialogId).dialog('setTitle', options.importDialogTitle);
						$('#addBtn').show();
        			}, 100);*/
					
        		}
            }, {
            	id: 'exportButton',
                text: '导出',
                iconCls: 'icon-table-go',
                handler: function () {
                	var date = new Date();
                	var excelTitle = parent.$('#index_tabs').tabs('getSelected').panel('options').title+"_导出数据_"+date.toLocaleString();
                	var fieldName = $(options.datagridId).datagrid('getColumnFields');
                	var colName=[];
                	for(i = 0; i < fieldName.length; i++) {
                		var col = $(options.datagridId).datagrid("getColumnOption", fieldName[i]);
                		colName.push(col.title);
                	}
                	var exportUrl = options.datagridUrl.substring(0, options.datagridUrl.lastIndexOf("/")) + '/exportExcel';
                	var colNameStr = colName.join(',').replace("UUID,","").replace(/,操作/g,"").replace(/操作,/g,"");
                	var fieldNameStr = fieldName.join(',').replace("uuid,","").replace(/,handle/g,"").replace(/handle,/g,"");
                	$.ajax({
						type : 'POST',
						url : exportUrl,
						data : {
							excelTitle : excelTitle,
							colName : colNameStr,
							fieldName : fieldNameStr
						},
						success : function (data) {
							if (data) {
								window.location.href = exportUrl+'?excelTitle='+excelTitle+'&colName='+colNameStr+'&fieldName='+fieldNameStr;
								$.messager.show({
									title : '温馨提示',
									msg : '导出请求已发出，请稍后！'
								});
							}
						}
					});
        		}
            }, {
                text: '撤销',
                iconCls: 'icon-redo',
                handler: function () {
                    editRow = undefined;
                    $(options.datagridId).datagrid('rejectChanges');
                    $(options.datagridId).datagrid('unselectAll');
                }
            }/*, '-', {
                text: '上移',
                iconCls: 'icon-up',
                handler: function () {
                    MoveUp();
                }
            }, '-', {
                text: '下移',
                iconCls: 'icon-down',
                handler: function () {
                    MoveDown();
                }
            }*/]
	    });
		
		//$(this).datagrid('disableFilter', options.filterOption);
		
		
		function editHandler() {
			if(options) {
				var rows = $(options.datagridId).datagrid('getSelections');
				if (rows.length > 1) {
					$.messager.alert('提示操作！', '编辑数据只能选择一条记录！', 'warning');
				} else if (rows.length == 1) {
					clearDialogHrefKeyValue(options.editDialogId, "uuid");
					setDialogHrefKeyValue(options.editDialogId, "action,uuid", "edit," + rows[0].uuid);
					$.ajax({
						url : options.getDetailUrl + "?uuid=" + rows[0].uuid,
						type : 'post',
						dataType: 'json',
						async : false,
						beforeSend : function () {
							/*$.messager.progress({
								text : '正在获取中...'
							});*/
						},
						success : function (data, response, status) {
							$.messager.progress('close');
							
							if (data) {
								//var params = '{';
								//$.each(options.editFields, function (k, v) {
									//params += '"' + v + '": "' + data[v.replace("Edit", "")] + '", ';
								//});
								//params += '"endStr": "1"}';
								//console.log(params);
								var newHref = $(options.editDialogId).dialog('options').href + "&abc=213";
								$(options.editDialogId).dialog('open').dialog('refresh', newHref);
								setTimeout(function() {
									$(options.editDialogId).form('load', data);
									$(options.editDialogId).dialog('setTitle', options.editDialogTitle);
									$('#addBtn').hide();
									$('#saveBtn').show();
									if(!options.processUpdateUrl){
										$('#processBtn').hide();
									}
							    }, 500);
								
								setTimeout(function(){
									
									/* kindeditor编辑器处理 */
									// 判断是一个富文本编辑器字符串还是多个富文本编辑数组
									if(typeof options.kindEditor == "string") {
										var ke = [],keObj = [];
										ke = options.kindEditor.replace(/'/g,'"').split(",");
										for(var i=0; i<ke.length; i++) {
											keObj.push(strToJson(ke[i]));
										}
									} else {
										keObj = options.kindEditor;
									}
									
									getTabWindow().$("iframe").each(function(i){
										this.contentWindow.document.body.innerHTML = html_decode(data[keObj[i]["field"]]);
							    	});
									
									
									/*if(options.kindEditor.length > 0) {
    									for(var i=0; i<options.kindEditor.length; i++) {  
										   for(var key in options.kindEditor[i]) {
										    	document.getElementsByTagName("iframe")[i].contentWindow.document.body.innerHTML = html_decode(data[options.kindEditor[i][key]]);
										   }
    									}
									}*/
									
									/* 附件处理 */
									if($(".attachTable").length > 0) {
    									$(".attachTable tr:gt(0)").remove();
    									for(var i=0; i<data.attach.length; i++) {  
    										var attach = data.attach[i];
    										$(".attachTable").append('<tr><td class="label">'+attach.fileName+'</td><td class="label">'+attach.fileSize+'</td><td class="label">'+attach.creator+'</td><td class="label">'+attach.createTime+'</td></tr>');
        								}
									}
								},500);
								
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
		
		//上移
		function MoveUp() {
		    var row = $(options.datagridId).datagrid('getSelected');
		    var index = $(options.datagridId).datagrid('getRowIndex', row);
		    mysort(index, 'up', options.datagridId);
		     
		}
		//下移
		function MoveDown() {
		    var row = $(options.datagridId).datagrid('getSelected');
		    var index = $(options.datagridId).datagrid('getRowIndex', row);
		    mysort(index, 'down', options.datagridId);
		     
		}
		 
		 
		function mysort(index, type, datagridId) {
		    if ("up" == type) {
		        if (index != 0) {
		            var toup = $(datagridId).datagrid('getData').rows[index];
		            var todown = $(datagridId).datagrid('getData').rows[index - 1];
		            $(datagridId).datagrid('getData').rows[index] = todown;
		            $(datagridId).datagrid('getData').rows[index - 1] = toup;
		            $(datagridId).datagrid('refreshRow', index);
		            $(datagridId).datagrid('refreshRow', index - 1);
		            $(datagridId).datagrid('selectRow', index - 1);
		        }
		    } else if ("down" == type) {
		        var rows = $(datagridId).datagrid('getRows').length;
		        if (index != rows - 1) {
		            var todown = $(datagridId).datagrid('getData').rows[index];
		            var toup = $(datagridId).datagrid('getData').rows[index + 1];
		            $(datagridId).datagrid('getData').rows[index + 1] = todown;
		            $(datagridId).datagrid('getData').rows[index] = toup;
		            $(datagridId).datagrid('refreshRow', index);
		            $(datagridId).datagrid('refreshRow', index + 1);
		            $(datagridId).datagrid('selectRow', index + 1);
		        }
		    }
		 
		}
	
		//重新加载datagrid的数据
		//$(this).datagrid('reload');
		
	}
	
	// 扩展datagrid方法，修复行号宽度显示问题
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
	});
	
	/*$(function() {
		var $this  = $('[data-toggle="datagrid"]'),
		    options = $this.data()
		
		//options.columns = JSON.parse(options.columns)
		
		$this.myDatagrid($this, options)
	})*/
	
})(jQuery);