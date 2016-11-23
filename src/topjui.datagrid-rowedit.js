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
	
	var datagridId = undefined;
	
	$.fn.iDatagrid = function(options) {
		var defaults = {
		    //datagridId       : element.get(0).id,
			datagridId       : this.selector,
			width            : '100%',
			height           : '100%',
            autoRowHeight    : false,
            nowrap           : true,
            fit              : true,
            fitColumns		 : true,
    		border           : false,
            striped          : true,
            singleSelect     : false,
            url              : "",
            columns          : [[{field:'id',title:'ID',align:'center'},
                                {field:'title',title:'标题',align:'left'},
                                {field:'creator',title: '发布人',align: 'center'},
                                {field:'createTime',title: '发布时间',align: 'center'}]],
            sortName	     : "createTime",
            sortOrder        : "desc",
            toolbar          : this.selector + 'Toolbar',
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
            queryParamsVCN   : {}   	// search params value from htmlcontrol name, must to be {}
		}
		
		var options = $.extend(defaults, options);
		
		var editRow = undefined;
		
		$(this).datagrid({
	        width         : options.width,
            height        : options.height,
            autoRowHeight : options.autoRowHeight,
            nowrap        : options.nowrap,
            striped       : options.striped,
            singleSelect  : options.singleSelect,
            url           : options.url,
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
            onLoadSuccess : function() {
            	$(this).datagrid("fixRownumber")
            },
            toolbar: [{
                text: '添加', iconCls: 'icon-add', handler: function () {
                    if (editRow != undefined) {
                        $(options.datagridId).datagrid('endEdit', editRow);
                    }
                    if (editRow == undefined) {
                        $(options.datagridId).datagrid('insertRow', {
                            index: 0,
                            row: {}
                        });
     
                        $(options.datagridId).datagrid('beginEdit', 0);
                        editRow = 0;
                    }
                }
            }, '-', {
                text: '修改', iconCls: 'icon-edit', handler: function () {
                    var row = $(options.datagridId).datagrid('getSelected');
                    if (row !=null) {
                        if (editRow != undefined) {
                            $(options.datagridId).datagrid('endEdit', editRow);
                        }
     
                        if (editRow == undefined) {
                            var index = $(options.datagridId).datagrid('getRowIndex', row);
                            $(options.datagridId).datagrid('beginEdit', index);
                            editRow = index;
                            $(options.datagridId).datagrid('unselectAll');
                        }
                    } else {
                         
                    }
                }
            }, '-', {
                text: '保存', iconCls: 'icon-save', handler: function () {
                    $(options.datagridId).datagrid('endEdit', editRow);
     
                    //如果调用acceptChanges(),使用getChanges()则获取不到编辑和新增的数据。
     
                    //使用JSON序列化datarow对象，发送到后台。
                    var rows = $(options.datagridId).datagrid('getChanges');
                    console.log(rows[0]);
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
            }, '-', {
                text: '删除', iconCls: 'icon-remove', handler: function () {
                    var row = $(options.datagridId).datagrid('getSelections');
                     
                }
            }, '-', {
                text: '撤销', iconCls: 'icon-redo', handler: function () {
                    editRow = undefined;
                    $(options.datagridId).datagrid('rejectChanges');
                    $(options.datagridId).datagrid('unselectAll');
                }
            }, '-', {
                text: '上移', iconCls: 'icon-up', handler: function () {
                    MoveUp();
                }
            }, '-', {
                text: '下移', iconCls: 'icon-down', handler: function () {
                    MoveDown();
                }
            }],
            onAfterEdit: function (rowIndex, rowData, changes) {
                editRow = undefined;
            },
            onDblClickRow:function (rowIndex, rowData) {
                if (editRow != undefined) {
                    $(options.datagridId).datagrid('endEdit', editRow);
                }
     
                if (editRow == undefined) {
                    $(options.datagridId).datagrid('beginEdit', rowIndex);
                    editRow = rowIndex;
                }
            },
            onClickRow:function(rowIndex,rowData){
                if (editRow != undefined) {
                    $(options.datagridId).datagrid('endEdit', editRow);
     
                }
                
            }
	    });
		
		
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
	
	$.extend($.fn.datagrid.defaults.editors, {    
	    text: {    
	        init: function(container, options){    
	            var input = $('<input type="text" class="datagrid-editable-input">').appendTo(container);    
	            return input;    
	        },    
	        getValue: function(target){    
	            return $(target).val();    
	        },    
	        setValue: function(target, value){    
	            $(target).val(value);    
	        },    
	        resize: function(target, width){    
	            var input = $(target);    
	            if ($.boxModel == true){    
	                input.width(width - (input.outerWidth() - input.width()));    
	            } else {    
	                input.width(width);    
	            }    
	        }    
	    }    
	});
	
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
		}
	});
	
	/*$(function() {
		var $this  = $('[data-toggle="datagrid"]'),
		    options = $this.data()
		
		//options.columns = JSON.parse(options.columns)
		
		$this.myDatagrid($this, options)
	})*/
	
	
})(jQuery);