(function($){
	function getPluginName(target){
		if ($(target).data('treegrid')){
			return 'treegrid';
		} else {
			return 'datagrid';
		}
	}

	var autoSizeColumn1 = $.fn.datagrid.methods.autoSizeColumn;
	var loadDataMethod1 = $.fn.datagrid.methods.loadData;
	var appendMethod1 = $.fn.datagrid.methods.appendRow;
	var deleteMethod1 = $.fn.datagrid.methods.deleteRow;
	$.extend($.fn.datagrid.methods, {
		autoSizeColumn: function(jq, field){
			return jq.each(function(){
				var fc = $(this).datagrid('getPanel').find('.datagrid-header .datagrid-filter-c');
				fc.hide();
				autoSizeColumn1.call($.fn.datagrid.methods, $(this), field);
				fc.show();
				resizeFilter(this, field);
			});
		},
		loadData: function(jq, data){
			jq.each(function(){
				$.data(this, 'datagrid').filterSource = null;
			});
			return loadDataMethod1.call($.fn.datagrid.methods, jq, data);
		},
		appendRow: function(jq, row){
			var result = appendMethod1.call($.fn.datagrid.methods, jq, row);
			jq.each(function(){
				var state = $(this).data('datagrid');
				if (state.filterSource){
					state.filterSource.total++;
					if (state.filterSource.rows != state.data.rows){
						state.filterSource.rows.push(row);
					}
				}
			});
			return result;
		},
		deleteRow: function(jq, index){
			jq.each(function(){
				var state = $(this).data('datagrid');
				var opts = state.options;
				if (state.filterSource && opts.idField){
					if (state.filterSource.rows == state.data.rows){
						state.filterSource.total--;
					} else {
						for(var i=0; i<state.filterSource.rows.length; i++){
							var row = state.filterSource.rows[i];
							if (row[opts.idField] == state.data.rows[index][opts.idField]){
								state.filterSource.rows.splice(i,1);
								state.filterSource.total--;
								break;
							}
						}
					}
				}
			});
			return deleteMethod1.call($.fn.datagrid.methods, jq, index);		
		}
	});

	var loadDataMethod2 = $.fn.treegrid.methods.loadData;
	var appendMethod2 = $.fn.treegrid.methods.append;
	var insertMethod2 = $.fn.treegrid.methods.insert;
	var removeMethod2 = $.fn.treegrid.methods.remove;
	$.extend($.fn.treegrid.methods, {
		loadData: function(jq, data){
			jq.each(function(){
				$.data(this, 'treegrid').filterSource = null;
			});
			return loadDataMethod2.call($.fn.treegrid.methods, jq, data);
		},
		append: function(jq, param){
			return jq.each(function(){
				var state = $(this).data('treegrid');
				var opts = state.options;
				if (opts.oldLoadFilter){
					var rows = translateTreeData(this, param.data, param.parent);
					state.filterSource.total += rows.length;
					state.filterSource.rows = state.filterSource.rows.concat(rows);
					$(this).treegrid('loadData', state.filterSource)
				} else {
					appendMethod2($(this), param);
				}
			});
		},
		insert: function(jq, param){
			return jq.each(function(){
				var state = $(this).data('treegrid');
				var opts = state.options;
				if (opts.oldLoadFilter){
					var ref = param.before || param.after;
					var index = getNodeIndex(param.before || param.after);
					var pid = index>=0 ? state.filterSource.rows[index]._parentId : null;
					var rows = translateTreeData(this, [param.data], pid);
					var newRows = state.filterSource.rows.splice(0, index>=0 ? (param.before ? index : index+1) : (state.filterSource.rows.length));
					newRows = newRows.concat(rows);
					newRows = newRows.concat(state.filterSource.rows);
					state.filterSource.total += rows.length;
					state.filterSource.rows = newRows;
					$(this).treegrid('loadData', state.filterSource);

					//noinspection JSAnnotator
					function getNodeIndex(id){
						var rows = state.filterSource.rows;
						for(var i=0; i<rows.length; i++){
							if (rows[i][opts.idField] == id){
								return i;
							}
						}
						return -1;
					}
				} else {
					insertMethod2($(this), param);
				}
			});
		},
		remove: function(jq, id){
			jq.each(function(){
				var state = $(this).data('treegrid');
				if (state.filterSource){
					var opts = state.options;
					var rows = state.filterSource.rows;
					for(var i=0; i<rows.length; i++){
						if (rows[i][opts.idField] == id){
							rows.splice(i, 1);
							state.filterSource.total--;
							break;
						}
					}
				}
			});
			return removeMethod2(jq, id);
		}
	});

	var extendedOptions = {
		filterMenuIconCls: 'icon-ok',
		filterBtnIconCls: 'icon-filter',
		filterBtnPosition: 'right',
		filterPosition: 'bottom',
		remoteFilter: false,
		showFilterBar: true,
		filterDelay: 400,
		filterRules: [],
		// specify whether the filtered records need to match ALL or ANY of the applied filters
		filterMatchingType: 'all',	// possible values: 'all','any'
		// filterCache: {},
		filterMatcher: function(data){
			var name = getPluginName(this);
			var dg = $(this);
			var state = $.data(this, name);
			var opts = state.options;
			if (opts.filterRules.length){
				var rows = [];
				if (name == 'treegrid'){
					var rr = {};
					$.map(data.rows, function(row){
						if (isMatch(row, row[opts.idField])){
							rr[row[opts.idField]] = row;
							row = getRow(data.rows, row._parentId);
							while(row){
								rr[row[opts.idField]] = row;
								row = getRow(data.rows, row._parentId);
							}
						}
					});
					for(var id in rr){
						rows.push(rr[id]);
					}
				} else {
					for(var i=0; i<data.rows.length; i++){
						var row = data.rows[i];
						if (isMatch(row, i)){
							rows.push(row);
						}
					}
				}
				data = {
					total: data.total - (data.rows.length - rows.length),
					rows: rows
				};
			}
			return data;
			
			function isMatch(row, index){
				var rules = opts.filterRules;
				if (!rules.length){return true;}
				for(var i=0; i<rules.length; i++){
					var rule = rules[i];
					var source = row[rule.field];
					var col = dg.datagrid('getColumnOption', rule.field);
					if (col && col.formatter){
						source = col.formatter(row[rule.field], row, index);
					}
					if (source == undefined){
						source = '';
					}
					var op = opts.operators[rule.op];
					// if (!op.isMatch(source, rule.value)){return false}
					var matched = op.isMatch(source, rule.value);
					if (opts.filterMatchingType == 'any'){
						if (matched){return true;}
					} else {
						if (!matched){return false;}
					}
				}
				return opts.filterMatchingType == 'all';
			}
			function getRow(rows, id){
				for(var i=0; i<rows.length; i++){
					var row = rows[i];
					if (row[opts.idField] == id){
						return row;
					}
				}
				return null;
			}
		},
		defaultFilterType: 'text',
		defaultFilterOperator: 'contains',
		defaultFilterOptions: {
			onInit: function(target){
				var name = getPluginName(target);
				var opts = $(target)[name]('options');
				var field = $(this).attr('name');
				var input = $(this);
				if (input.data('textbox')){
					input = input.textbox('textbox');
				}
				input.unbind('.filter').bind('keydown.filter', function(e){
					var t = $(this);
					if (this.timer){
						clearTimeout(this.timer);
					}
					if (e.keyCode == 13){
						_doFilter();
					} else {
						this.timer = setTimeout(function(){
							_doFilter();
						}, opts.filterDelay);
					}
				});
				function _doFilter(){
					var rule = $(target)[name]('getFilterRule', field);
					var value = input.val();
					if (value != ''){
						if ((rule && rule.value!=value) || !rule){
							$(target)[name]('addFilterRule', {
								field: field,
								op: opts.defaultFilterOperator,
								value: value
							});
							$(target)[name]('doFilter');
						}
					} else {
						if (rule){
							$(target)[name]('removeFilterRule', field);
							$(target)[name]('doFilter');
						}
					}
				}
			}
		},
		filterStringify: function(data){
			return JSON.stringify(data);
		},
		onClickMenu: function(item,button){}
	};
	$.extend($.fn.datagrid.defaults, extendedOptions);
	$.extend($.fn.treegrid.defaults, extendedOptions);
	
	// filter types
	$.fn.datagrid.defaults.filters = $.extend({}, $.fn.datagrid.defaults.editors, {
		label: {
			init: function(container, options){
				return $('<span></span>').appendTo(container);
			},
			getValue: function(target){
				return $(target).html();
			},
			setValue: function(target, value){
				$(target).html(value);
			},
			resize: function(target, width){
				$(target)._outerWidth(width)._outerHeight(22);
			}
		}
	});
	$.fn.treegrid.defaults.filters = $.fn.datagrid.defaults.filters;
	
	// filter operators
	$.fn.datagrid.defaults.operators = {
		nofilter: {
			text: 'No Filter'
		},
		contains: {
			text: 'Contains',
			isMatch: function(source, value){
				source = String(source);
				value = String(value);
				return source.toLowerCase().indexOf(value.toLowerCase()) >= 0;
			}
		},
		equal: {
			text: 'Equal',
			isMatch: function(source, value){
				return source == value;
			}
		},
		notequal: {
			text: 'Not Equal',
			isMatch: function(source, value){
				return source != value;
			}
		},
		beginwith: {
			text: 'Begin With',
			isMatch: function(source, value){
				source = String(source);
				value = String(value);
				return source.toLowerCase().indexOf(value.toLowerCase()) == 0;
			}
		},
		endwith: {
			text: 'End With',
			isMatch: function(source, value){
				source = String(source);
				value = String(value);
				return source.toLowerCase().indexOf(value.toLowerCase(), source.length - value.length) !== -1;
			}
		},
		less: {
			text: 'Less',
			isMatch: function(source, value){
				return source < value;
			}
		},
		lessorequal: {
			text: 'Less Or Equal',
			isMatch: function(source, value){
				return source <= value;
			}
		},
		greater: {
			text: 'Greater',
			isMatch: function(source, value){
				return source > value;
			}
		},
		greaterorequal: {
			text: 'Greater Or Equal',
			isMatch: function(source, value){
				return source >= value;
			}
		}
	};
	$.fn.treegrid.defaults.operators = $.fn.datagrid.defaults.operators;
	
	function resizeFilter(target, field){
		var toFixColumnSize = false;
		var dg = $(target);
		var header = dg.datagrid('getPanel').find('div.datagrid-header');
		var tr = header.find('.datagrid-header-row:not(.datagrid-filter-row)');
		var ff = field ? header.find('.datagrid-filter[name="'+field+'"]') : header.find('.datagrid-filter');
		ff.each(function(){
			var name = $(this).attr('name');
			var col = dg.datagrid('getColumnOption', name);
			var cc = $(this).closest('div.datagrid-filter-c');
			var btn = cc.find('a.datagrid-filter-btn');
			var cell = tr.find('td[field="'+name+'"] .datagrid-cell');
			var cellWidth = cell._outerWidth();
			if (cellWidth != _getContentWidth(cc)){
				this.filter.resize(this, cellWidth - btn._outerWidth());
			}
			if (cc.width() > col.boxWidth+col.deltaWidth-1){
				col.boxWidth = cc.width() - col.deltaWidth + 1;
				col.width = col.boxWidth + col.deltaWidth;
				toFixColumnSize = true;
			}
		});
		if (toFixColumnSize){
			$(target).datagrid('fixColumnSize');			
		}

		function _getContentWidth(cc){
			var w = 0;
			$(cc).children(':visible').each(function(){
				w += $(this)._outerWidth();
			});
			return w;
		}
	}
	
	function getFilterComponent(target, field){
		var header = $(target).datagrid('getPanel').find('div.datagrid-header');
		return header.find('tr.datagrid-filter-row td[field="'+field+'"] .datagrid-filter');
	}
	
	/**
	 * get filter rule index, return -1 if not found.
	 */
	function getRuleIndex(target, field){
		var name = getPluginName(target);
		var rules = $(target)[name]('options').filterRules;
		for(var i=0; i<rules.length; i++){
			if (rules[i].field == field){
				return i;
			}
		}
		return -1;
	}

	function getFilterRule(target, field){
		var name = getPluginName(target);
		var rules = $(target)[name]('options').filterRules;
		var index = getRuleIndex(target, field);
		if (index >= 0){
			return rules[index];
		} else {
			return null;
		}
	}
	
	function addFilterRule(target, param){
		var name = getPluginName(target);
		var opts = $(target)[name]('options');
		var rules = opts.filterRules;

		if (param.op == 'nofilter'){
			removeFilterRule(target, param.field);
		} else {
			var index = getRuleIndex(target, param.field);
			if (index >= 0){
				$.extend(rules[index], param);
			} else {
				rules.push(param);
			}
		}

		var input = getFilterComponent(target, param.field);
		if (input.length){
			if (param.op != 'nofilter'){
				input[0].filter.setValue(input, param.value);
			}
			var menu = input[0].menu;
			if (menu){
				menu.find('.'+opts.filterMenuIconCls).removeClass(opts.filterMenuIconCls);
				var item = menu.menu('findItem', opts.operators[param.op]['text']);
				menu.menu('setIcon', {
					target: item.target,
					iconCls: opts.filterMenuIconCls
				});
			}
		}
	}
	
	function removeFilterRule(target, field){
		var name = getPluginName(target);
		var dg = $(target);
		var opts = dg[name]('options');
		if (field){
			var index = getRuleIndex(target, field);
			if (index >= 0){
				opts.filterRules.splice(index, 1);
			}
			_clear([field]);
		} else {
			opts.filterRules = [];
			var fields = dg.datagrid('getColumnFields',true).concat(dg.datagrid('getColumnFields'));
			_clear(fields);
		}
		
		function _clear(fields){
			for(var i=0; i<fields.length; i++){
				var input = getFilterComponent(target, fields[i]);
				if (input.length){
					input[0].filter.setValue(input, '');
					var menu = input[0].menu;
					if (menu){
						menu.find('.'+opts.filterMenuIconCls).removeClass(opts.filterMenuIconCls);
					}
				}
			}
		}
	}
	
	function doFilter(target){
		var name = getPluginName(target);
		var state = $.data(target, name);
		var opts = state.options;
		if (opts.remoteFilter){
			$(target)[name]('load');
		} else {
			$(target)[name]('getPager').pagination('refresh', {pageNumber:1});
			$(target)[name]('options').pageNumber = 1;
			$(target)[name]('loadData', state.filterSource || state.data);
		}
	}
	
	function translateTreeData(target, children, pid){
		var opts = $(target).treegrid('options');
		if (!children || !children.length){return []}
		var rows = [];
		$.map(children, function(item){
			item._parentId = pid;
			rows.push(item);
			rows = rows.concat(translateTreeData(target, item.children, item[opts.idField]));
		});
		$.map(rows, function(row){
			row.children = undefined;
		});
		return rows;
	}

	function myLoadFilter(data, parentId){
		var target = this;
		var name = getPluginName(target);
		var state = $.data(target, name);
		var opts = state.options;

		if (name == 'datagrid' && $.isArray(data)){
			data = {
				total: data.length,
				rows: data
			};
		} else if (name == 'treegrid' && $.isArray(data)){
			var rows = translateTreeData(target, data, parentId);
			data = {
				total: rows.length,
				rows: rows
			}
		}
		if (!opts.remoteFilter){
			if (!state.filterSource){
				state.filterSource = data;
			} else {
				if (!opts.isSorting) {
					if (name == 'datagrid'){
						state.filterSource = data;
					} else {
						state.filterSource.total += data.length;
						state.filterSource.rows = state.filterSource.rows.concat(data.rows);
						if (parentId){
							return opts.filterMatcher.call(target, data);
						}
					}
				} else {
					opts.isSorting = undefined;
				}
			}
			if (!opts.remoteSort && opts.sortName){
				var names = opts.sortName.split(',');
				var orders = opts.sortOrder.split(',');
				var dg = $(target);
				state.filterSource.rows.sort(function(r1,r2){
					var r = 0;
					for(var i=0; i<names.length; i++){
						var sn = names[i];
						var so = orders[i];
						var col = dg.datagrid('getColumnOption', sn);
						var sortFunc = col.sorter || function(a,b){
							return a==b ? 0 : (a>b?1:-1);
						};
						r = sortFunc(r1[sn], r2[sn]) * (so=='asc'?1:-1);
						if (r != 0){
							return r;
						}
					}
					return r;
				});
			}
			data = opts.filterMatcher.call(target, {
				total: state.filterSource.total,
				rows: state.filterSource.rows
			});

			if (opts.pagination){
				var dg = $(target);
				var pager = dg[name]('getPager');
				pager.pagination({
					onSelectPage:function(pageNum, pageSize){
	                    opts.pageNumber = pageNum;
	                    opts.pageSize = pageSize;
	                    pager.pagination('refresh',{
	                        pageNumber:pageNum,
	                        pageSize:pageSize
	                    });
	                    //dg.datagrid('loadData', state.filterSource);
	                    dg[name]('loadData', state.filterSource);
					},
					onBeforeRefresh:function(){
						dg[name]('reload');
						return false;
					}
				});
				if (name == 'datagrid'){
					var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
					var end = start + parseInt(opts.pageSize);
					data.rows = data.rows.slice(start, end);
				} else {
			        var topRows = [];
			        var childRows = [];
			        $.map(data.rows, function(row){
			        	row._parentId ? childRows.push(row) : topRows.push(row);
			        });
			        data.total = topRows.length;
			        var start = (opts.pageNumber-1)*parseInt(opts.pageSize);  
			        var end = start + parseInt(opts.pageSize);  
					data.rows = topRows.slice(start, end).concat(childRows);
				}
			}
			$.map(data.rows, function(row){
				row.children = undefined;
			});
		}
		return data;
	}
	
	function init(target, filters){
		filters = filters || [];
		var name = getPluginName(target);
		var state = $.data(target, name);
		var opts = state.options;
		if (!opts.filterRules.length){
			opts.filterRules = [];
		}
		opts.filterCache = opts.filterCache || {};
		var dgOpts = $.data(target, 'datagrid').options;
		
		var onResize = dgOpts.onResize;
		dgOpts.onResize = function(width,height){
			resizeFilter(target);
			onResize.call(this, width, height);
		}
		var onBeforeSortColumn = dgOpts.onBeforeSortColumn;
		dgOpts.onBeforeSortColumn = function(sort, order){
			var result = onBeforeSortColumn.call(this, sort, order);
			if (result != false){
				opts.isSorting = true;				
			}
			return result;
		};

		var onResizeColumn = opts.onResizeColumn;
		opts.onResizeColumn = function(field,width){
			var fc = $(this).datagrid('getPanel').find('.datagrid-header .datagrid-filter-c');
			fc.hide();
			$(target).datagrid('fitColumns');
			if (opts.fitColumns){
				resizeFilter(target);
			} else {
				resizeFilter(target, field);
			}
			fc.show();
			onResizeColumn.call(target, field, width);
		};
		var onBeforeLoad = opts.onBeforeLoad;
		opts.onBeforeLoad = function(param1, param2){
			if (param1){
				param1.filterRules = opts.filterStringify(opts.filterRules);
			}
			if (param2){
				param2.filterRules = opts.filterStringify(opts.filterRules);
			}
			var result = onBeforeLoad.call(this, param1, param2);
			if (result != false){
				if (name == 'datagrid'){
					state.filterSource = null;
				} else if (name == 'treegrid' && state.filterSource){
					if (param1){
						var id = param1[opts.idField];	// the id of the expanding row
						var rows = state.filterSource.rows || [];
						for(var i=0; i<rows.length; i++){
							if (id == rows[i]._parentId){	// the expanding row has children
								return false;
							}
						}
					} else {
						state.filterSource = null;
					}
				}
			}
			return result;
		};

		// opts.loadFilter = myLoadFilter;
		opts.loadFilter = function(data, parentId){
			var d = opts.oldLoadFilter.call(this, data, parentId);
			return myLoadFilter.call(this, d, parentId);
		};
		
		initCss();
		createFilter(true);
		createFilter();
		if (opts.fitColumns){
			setTimeout(function(){
				resizeFilter(target);
			}, 0);
		}

		$.map(opts.filterRules, function(rule){
			addFilterRule(target, rule);
		});
		
		function initCss(){
			if (!$('#datagrid-filter-style').length){
				$('head').append(
					'<style id="datagrid-filter-style">' +
					'a.datagrid-filter-btn{display:inline-block;width:22px;height:22px;margin:0;vertical-align:top;cursor:pointer;opacity:0.6;filter:alpha(opacity=60);}' +
					'a:hover.datagrid-filter-btn{opacity:1;filter:alpha(opacity=100);}' +
					'.datagrid-filter-row .textbox,.datagrid-filter-row .textbox .textbox-text{-moz-border-radius:0;-webkit-border-radius:0;border-radius:0;}' +
					'.datagrid-filter-row input{margin:0;-moz-border-radius:0;-webkit-border-radius:0;border-radius:0;}' +
					'.datagrid-filter-cache{position:absolute;width:10px;height:10px;left:-99999px;}' +
					'</style>'
				);
			}
		}
		
		/**
		 * create filter component
		 */
		function createFilter(frozen){
			var dc = state.dc;
			var fields = $(target).datagrid('getColumnFields', frozen);
			if (frozen && opts.rownumbers){
				fields.unshift('_');
			}
			var table = (frozen?dc.header1:dc.header2).find('table.datagrid-htable');
			
			// clear the old filter component
			table.find('.datagrid-filter').each(function(){
				if (this.filter.destroy){
					this.filter.destroy(this);
				}
				if (this.menu){
					$(this.menu).menu('destroy');
				}
			});
			table.find('tr.datagrid-filter-row').remove();
			
			var tr = $('<tr class="datagrid-header-row datagrid-filter-row"></tr>');
			if (opts.filterPosition == 'bottom'){
				tr.appendTo(table.find('tbody'));
			} else {
				tr.prependTo(table.find('tbody'));
			}
			if (!opts.showFilterBar){
				tr.hide();
			}
			
			for(var i=0; i<fields.length; i++){
				var field = fields[i];
				var col = $(target).datagrid('getColumnOption', field);
				var td = $('<td></td>').attr('field', field).appendTo(tr);
				if (col && col.hidden){
					td.hide();
				}
				if (field == '_'){
					continue;
				}
				if (col && (col.checkbox || col.expander)){
					continue;
				}

				var fopts = getFilter(field);
				if (fopts){
					$(target)[name]('destroyFilter', field);	// destroy the old filter component
				} else {
					fopts = $.extend({}, {
						field: field,
						type: opts.defaultFilterType,
						options: opts.defaultFilterOptions
					});
				}

				var div = opts.filterCache[field];
				if (!div){
					div = $('<div class="datagrid-filter-c"></div>').appendTo(td);
					var filter = opts.filters[fopts.type];
					var input = filter.init(div, fopts.options||{});
					input.addClass('datagrid-filter').attr('name', field);
					input[0].filter = filter;
					input[0].menu = createFilterButton(div, fopts.op);
					if (fopts.options){
						if (fopts.options.onInit){
							fopts.options.onInit.call(input[0], target);
						}
					} else {
						opts.defaultFilterOptions.onInit.call(input[0], target);
					}
					opts.filterCache[field] = div;
					resizeFilter(target, field);
				} else {
					div.appendTo(td);
				}
			}
		}
		
		function createFilterButton(container, operators){
			if (!operators){return null;}
			
			var btn = $('<a class="datagrid-filter-btn">&nbsp;</a>').addClass(opts.filterBtnIconCls);
			if (opts.filterBtnPosition == 'right'){
				btn.appendTo(container);
			} else {
				btn.prependTo(container);
			}

			var menu = $('<div></div>').appendTo('body');
			$.map(['nofilter'].concat(operators), function(item){
				var op = opts.operators[item];
				if (op){
					$('<div></div>').attr('name', item).html(op.text).appendTo(menu);
				}
			});
			menu.menu({
				alignTo:btn,
				onClick:function(item){
					var btn = $(this).menu('options').alignTo;
					var td = btn.closest('td[field]');
					var field = td.attr('field');
					var input = td.find('.datagrid-filter');
					var value = input[0].filter.getValue(input);
					
					if (opts.onClickMenu.call(target, item, btn, field) == false){
						return;
					}
					
					addFilterRule(target, {
						field: field,
						op: item.name,
						value: value
					});
					
					doFilter(target);
				}
			});

			btn[0].menu = menu;
			btn.bind('click', {menu:menu}, function(e){
				$(this.menu).menu('show');
				return false;
			});
			return menu;
		}
		
		function getFilter(field){
			for(var i=0; i<filters.length; i++){
				var filter = filters[i];
				if (filter.field == field){
					return filter;
				}
			}
			return null;
		}
	}
	
	$.extend($.fn.datagrid.methods, {
		enableFilter: function(jq, filters){
			return jq.each(function(){
				var name = getPluginName(this);
				var opts = $.data(this, name).options;
				if (opts.oldLoadFilter){
					if (filters){
						$(this)[name]('disableFilter');
					} else {
						return;
					}
				}
				opts.oldLoadFilter = opts.loadFilter;
				init(this, filters);
				$(this)[name]('resize');
				if (opts.filterRules.length){
					if (opts.remoteFilter){
						doFilter(this);
					} else if (opts.data){
						doFilter(this);
					}
				}
			});
		},
		disableFilter: function(jq){
			return jq.each(function(){
				var name = getPluginName(this);
				var state = $.data(this, name);
				var opts = state.options;
				var dc = $(this).data('datagrid').dc;
				var div = dc.view.children('.datagrid-filter-cache');
				if (!div.length){
					div = $('<div class="datagrid-filter-cache"></div>').appendTo(dc.view);
				}
				for(var field in opts.filterCache){
					$(opts.filterCache[field]).appendTo(div);
				}
				var data = state.data;
				if (state.filterSource){
					data = state.filterSource;
					$.map(data.rows, function(row){
						row.children = undefined;
					});
				}
				$(this)[name]({
					data: data,
					loadFilter: (opts.oldLoadFilter||undefined),
					oldLoadFilter: null
				});
			});
		},
		destroyFilter: function(jq, field){
			return jq.each(function(){
				var name = getPluginName(this);
				var state = $.data(this, name);
				var opts = state.options;
				if (field){
					_destroy(field);
				} else {
					for(var f in opts.filterCache){
						_destroy(f);
					}
					$(this).datagrid('getPanel').find('.datagrid-header .datagrid-filter-row').remove();
					$(this).data('datagrid').dc.view.children('.datagrid-filter-cache').remove();
					opts.filterCache = {};
					$(this)[name]('resize');
					$(this)[name]('disableFilter');
				}

				function _destroy(field){
					var c = $(opts.filterCache[field]);
					var input = c.find('.datagrid-filter');
					if (input.length){
						var filter = input[0].filter;
						if (filter.destroy){
							filter.destroy(input[0]);
						}
					}
					c.find('.datagrid-filter-btn').each(function(){
						$(this.menu).menu('destroy');
					});
					c.remove();
					opts.filterCache[field] = undefined;
				}
			});
		},
		getFilterRule: function(jq, field){
			return getFilterRule(jq[0], field);
		},
		addFilterRule: function(jq, param){
			return jq.each(function(){
				addFilterRule(this, param);
			});
		},
		removeFilterRule: function(jq, field){
			return jq.each(function(){
				removeFilterRule(this, field);
			});
		},
		doFilter: function(jq){
			return jq.each(function(){
				doFilter(this);
			});
		},
		getFilterComponent: function(jq, field){
			return getFilterComponent(jq[0], field);
		},
		resizeFilter: function(jq, field){
			return jq.each(function(){
				resizeFilter(this, field);
			});
		}
	});
})(jQuery);
;(function($){
	// var oldLoadDataMethod = $.fn.datagrid.methods.loadData;
	// $.fn.datagrid.methods.loadData = function(jq, data){
	// 	jq.each(function(){
	// 		$.data(this, 'datagrid').filterSource = null;
	// 	});
	// 	return oldLoadDataMethod.call($.fn.datagrid.methods, jq, data);
	// };

	var autoGrids = [];
	function checkAutoGrid(){
		autoGrids = $.grep(autoGrids, function(t){
			return t.length && t.data('edatagrid');
		});
	}
	function saveAutoGrid(omit){
		checkAutoGrid();
		$.map(autoGrids, function(t){
			if (t[0] != $(omit)[0]){
				t.edatagrid('saveRow');
			}
		});
		checkAutoGrid();
	}
	function addAutoGrid(dg){
		checkAutoGrid();
		for(var i=0; i<autoGrids.length; i++){
			if ($(autoGrids[i])[0] == $(dg)[0]){return;}
		}
		autoGrids.push($(dg));
	}
	function delAutoGrid(dg){
		checkAutoGrid();
		autoGrids = $.grep(autoGrids, function(t){
			return $(t)[0] != $(dg)[0];
		});
	}

	$(function(){
		$(document).unbind('.edatagrid').bind('mousedown.edatagrid', function(e){
			var p = $(e.target).closest('div.datagrid-view,div.combo-panel,div.window,div.window-mask');
			if (p.length){
				if (p.hasClass('datagrid-view')){
					saveAutoGrid(p.children('table'));
				}
				return;
			}
			saveAutoGrid();
		});
	});
	
	function buildGrid(target){
		var opts = $.data(target, 'edatagrid').options;
		$(target).datagrid($.extend({}, opts, {
			onDblClickCell:function(index,field,value){
				if (opts.editing){
					$(this).edatagrid('editRow', index);
					focusEditor(target, field);
				}
				if (opts.onDblClickCell){
					opts.onDblClickCell.call(target, index, field, value);
				}
			},
			onClickCell:function(index,field,value){
				if (opts.editing && opts.editIndex >= 0){
					$(this).edatagrid('editRow', index);
					focusEditor(target, field);
				}
				if (opts.onClickCell){
					opts.onClickCell.call(target, index, field, value);
				}
			},
			onBeforeEdit: function(index, row){
				if (opts.onBeforeEdit){
					if (opts.onBeforeEdit.call(target, index, row) == false){
						return false;
					}
				}
				if (opts.autoSave){
					addAutoGrid(this);
				}
				opts.originalRow = $.extend(true, [], row);
			},
			onAfterEdit: function(index, row){
				delAutoGrid(this);
				opts.editIndex = -1;
				var url = row.isNewRecord ? opts.saveUrl : opts.updateUrl;
				if (url){
					var changed = false;
					var fields = $(this).edatagrid('getColumnFields',true).concat($(this).edatagrid('getColumnFields'));
					for(var i=0; i<fields.length; i++){
						var field = fields[i];
						var col = $(this).edatagrid('getColumnOption', field);
						if (col.editor && opts.originalRow[field] != row[field]){
							changed = true;
							break;
						}
					}
					if (changed){
						$.post(url, row, function(data){
							if (data.isError){
								$(target).edatagrid('cancelRow',index);
								$(target).edatagrid('selectRow',index);
								$(target).edatagrid('editRow',index);
								opts.onError.call(target, index, data);
								return;
							}
							data.isNewRecord = null;
							$(target).datagrid('updateRow', {
								index: index,
								row: data
							});
							if (opts.tree){
								var idValue = row[opts.idField||'id'];
								var t = $(opts.tree);
								var node = t.tree('find', idValue);
								if (node){
									node.text = row[opts.treeTextField];
									t.tree('update', node);
								} else {
									var pnode = t.tree('find', row[opts.treeParentField]);
									t.tree('append', {
										parent: (pnode ? pnode.target : null),
										data: [{id:idValue,text:row[opts.treeTextField]}]
									});
								}
							}
							opts.onSuccess.call(target, index, row);
							opts.onSave.call(target, index, row);
						},'json');						
					} else {
						opts.onSave.call(target, index, row);
					}
				} else {
					opts.onSave.call(target, index, row);
				}
				if (opts.onAfterEdit) opts.onAfterEdit.call(target, index, row);
			},
			onCancelEdit: function(index, row){
				delAutoGrid(this);
				opts.editIndex = -1;
				if (row.isNewRecord) {
					$(this).datagrid('deleteRow', index);
				}
				if (opts.onCancelEdit) opts.onCancelEdit.call(target, index, row);
			},
			onBeforeLoad: function(param){
				if (opts.onBeforeLoad.call(target, param) == false){return false}
				$(this).edatagrid('cancelRow');
				if (opts.tree){
					var node = $(opts.tree).tree('getSelected');
					param[opts.treeParentField] = node ? node.id : undefined;
				}
			}
		}));
		
		
		
		if (opts.tree){
			$(opts.tree).tree({
				url: opts.treeUrl,
				onClick: function(node){
					$(target).datagrid('load');
				},
				onDrop: function(dest,source,point){
					var targetId = $(this).tree('getNode', dest).id;
					$.ajax({
						url: opts.treeDndUrl,
						type:'post',
						data:{
							id:source.id,
							targetId:targetId,
							point:point
						},
						dataType:'json',
						success:function(){
							$(target).datagrid('load');
						}
					});
				}
			});
		}
	}

	function focusEditor(target, field){
		var opts = $(target).edatagrid('options');
		var t;
		var editor = $(target).datagrid('getEditor', {index:opts.editIndex,field:field});
		if (editor){
			t = editor.target;
		} else {
			var editors = $(target).datagrid('getEditors', opts.editIndex);
			if (editors.length){
				t = editors[0].target;
			}
		}
		if (t){
			if ($(t).hasClass('textbox-f')){
				$(t).textbox('textbox').focus();
			} else {
				$(t).focus();					
			}
		}
	}
	
	$.fn.edatagrid = function(options, param){
		if (typeof options == 'string'){
			var method = $.fn.edatagrid.methods[options];
			if (method){
				return method(this, param);
			} else {
				return this.datagrid(options, param);
			}
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'edatagrid');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'edatagrid', {
					options: $.extend({}, $.fn.edatagrid.defaults, $.fn.edatagrid.parseOptions(this), options)
				});
			}
			buildGrid(this);
		});
	};
	
	$.fn.edatagrid.parseOptions = function(target){
		return $.extend({}, $.fn.datagrid.parseOptions(target), {
		});
	};
	
	$.fn.edatagrid.methods = {
		options: function(jq){
			var opts = $.data(jq[0], 'edatagrid').options;
			return opts;
		},
		loadData: function(jq, data){
			return jq.each(function(){
				$(this).edatagrid('cancelRow');
				$(this).datagrid('loadData', data);
			});
		},
		enableEditing: function(jq){
			return jq.each(function(){
				var opts = $.data(this, 'edatagrid').options;
				opts.editing = true;
			});
		},
		disableEditing: function(jq){
			return jq.each(function(){
				var opts = $.data(this, 'edatagrid').options;
				opts.editing = false;
			});
		},
		isEditing: function(jq, index){
			var opts = $.data(jq[0], 'edatagrid').options;
			var tr = opts.finder.getTr(jq[0], index);
			return tr.length && tr.hasClass('datagrid-row-editing');
		},
		editRow: function(jq, index){
			return jq.each(function(){
				var dg = $(this);
				var opts = $.data(this, 'edatagrid').options;
				var editIndex = opts.editIndex;
				if (editIndex != index){
					if (dg.datagrid('validateRow', editIndex)){
						if (editIndex>=0){
							if (opts.onBeforeSave.call(this, editIndex) == false) {
								setTimeout(function(){
									dg.datagrid('selectRow', editIndex);
								},0);
								return;
							}
						}
						dg.datagrid('endEdit', editIndex);
						dg.datagrid('beginEdit', index);
						if (!dg.edatagrid('isEditing', index)){
							return;
						}
						opts.editIndex = index;
						focusEditor(this);
						
						var rows = dg.datagrid('getRows');
						opts.onEdit.call(this, index, rows[index]);
					} else {
						setTimeout(function(){
							dg.datagrid('selectRow', editIndex);
						}, 0);
					}
				}
			});
		},
		addRow: function(jq, index){
			return jq.each(function(){
				var dg = $(this);
				var opts = $.data(this, 'edatagrid').options;
				if (opts.editIndex >= 0){
					if (!dg.datagrid('validateRow', opts.editIndex)){
						dg.datagrid('selectRow', opts.editIndex);
						return;
					}
					if (opts.onBeforeSave.call(this, opts.editIndex) == false){
						setTimeout(function(){
							dg.datagrid('selectRow', opts.editIndex);
						},0);
						return;
					}
					dg.datagrid('endEdit', opts.editIndex);
				}
				var rows = dg.datagrid('getRows');
				
				function _add(index, row){
					if (index == undefined){
						dg.datagrid('appendRow', row);
						opts.editIndex = rows.length - 1;
					} else {
						dg.datagrid('insertRow', {index:index,row:row});
						opts.editIndex = index;
					}
				}
				if (typeof index == 'object'){
					_add(index.index, $.extend(index.row, {isNewRecord:true}))
				} else {
					_add(index, {isNewRecord:true});
				}
				
//				if (index == undefined){
//					dg.datagrid('appendRow', {isNewRecord:true});
//					opts.editIndex = rows.length - 1;
//				} else {
//					dg.datagrid('insertRow', {
//						index: index,
//						row: {isNewRecord:true}
//					});
//					opts.editIndex = index;
//				}
				
				dg.datagrid('beginEdit', opts.editIndex);
				dg.datagrid('selectRow', opts.editIndex);
				
				if (opts.tree){
					var node = $(opts.tree).tree('getSelected');
					rows[opts.editIndex][opts.treeParentField] = (node ? node.id : 0);
				}
				
				opts.onAdd.call(this, opts.editIndex, rows[opts.editIndex]);
			});
		},
		saveRow: function(jq){
			return jq.each(function(){
				var dg = $(this);
				var opts = $.data(this, 'edatagrid').options;
				if (opts.editIndex >= 0){
					if (opts.onBeforeSave.call(this, opts.editIndex) == false) {
						setTimeout(function(){
							dg.datagrid('selectRow', opts.editIndex);
						},0);
						return;
					}
					$(this).datagrid('endEdit', opts.editIndex);
				}
			});
		},
		cancelRow: function(jq){
			return jq.each(function(){
				var opts = $.data(this, 'edatagrid').options;
				if (opts.editIndex >= 0){
					$(this).datagrid('cancelEdit', opts.editIndex);
				}
			});
		},
		destroyRow: function(jq, index){
			return jq.each(function(){
				var dg = $(this);
				var opts = $.data(this, 'edatagrid').options;
				
				var rows = [];
				if (index == undefined){
					rows = dg.datagrid('getSelections');
				} else {
					var rowIndexes = $.isArray(index) ? index : [index];
					for(var i=0; i<rowIndexes.length; i++){
						var row = opts.finder.getRow(this, rowIndexes[i]);
						if (row){
							rows.push(row);
						}
					}
				}
				
				if (!rows.length){
					$.messager.show({
						title: opts.destroyMsg.norecord.title,
						msg: opts.destroyMsg.norecord.msg
					});
					return;
				}
				
				$.messager.confirm(opts.destroyMsg.confirm.title,opts.destroyMsg.confirm.msg,function(r){
					if (r){
						for(var i=0; i<rows.length; i++){
							_del(rows[i]);
						}
						dg.datagrid('clearSelections');
					}
				});
				
				function _del(row){
					var index = dg.datagrid('getRowIndex', row);
					if (index == -1){return}
					if (row.isNewRecord){
						dg.datagrid('cancelEdit', index);
					} else {
						if (opts.destroyUrl){
							var idValue = row[opts.idField||'id'];
							$.post(opts.destroyUrl, {id:idValue}, function(data){
								var index = dg.datagrid('getRowIndex', idValue);
								if (data.isError){
									dg.datagrid('selectRow', index);
									opts.onError.call(dg[0], index, data);
									return;
								}
								if (opts.tree){
									dg.datagrid('reload');
									var t = $(opts.tree);
									var node = t.tree('find', idValue);
									if (node){
										t.tree('remove', node.target);
									}
								} else {
									dg.datagrid('cancelEdit', index);
									dg.datagrid('deleteRow', index);
								}
								opts.onDestroy.call(dg[0], index, row);
								var pager = dg.datagrid('getPager');
								if (pager.length && !dg.datagrid('getRows').length){
									dg.datagrid('options').pageNumber = pager.pagination('options').pageNumber;
									dg.datagrid('reload');
								}
							}, 'json');
						} else {
							dg.datagrid('cancelEdit', index);
							dg.datagrid('deleteRow', index);
							opts.onDestroy.call(dg[0], index, row);
						}
					}
				}
			});
		}
	};
	
	$.fn.edatagrid.defaults = $.extend({}, $.fn.datagrid.defaults, {
		singleSelect: true,
		editing: true,
		editIndex: -1,
		destroyMsg:{
			norecord:{
				title:'Warning',
				msg:'No record is selected.'
			},
			confirm:{
				title:'Confirm',
				msg:'Are you sure you want to delete?'
			}
		},
//		destroyConfirmTitle: 'Confirm',
//		destroyConfirmMsg: 'Are you sure you want to delete?',
		
		autoSave: false,	// auto save the editing row when click out of datagrid
		url: null,	// return the datagrid data
		saveUrl: null,	// return the added row
		updateUrl: null,	// return the updated row
		destroyUrl: null,	// return {success:true}
		
		tree: null,		// the tree selector
		treeUrl: null,	// return tree data
		treeDndUrl: null,	// to process the drag and drop operation, return {success:true}
		treeTextField: 'name',
		treeParentField: 'parentId',
		
		onAdd: function(index, row){},
		onEdit: function(index, row){},
		onBeforeSave: function(index){},
		onSave: function(index, row){},
		onSuccess: function(index, row){},
		onDestroy: function(index, row){},
		onError: function(index, row){}
	});
	
	////////////////////////////////
	$.parser.plugins.push('edatagrid');
})(jQuery);;(function ($) {

    $.fn.iCombotree = function (options) {

        var defaults = {
            combotreeId: this.selector,
            url: ctx + '/system/codeItem/getListByCodeSetIdAndLevelId?codeSetId={codeSetId}&levelId={levelId}',
            expandUrl: ctx + '/system/codeItem/getListByPid?pid={pid}',
            getFatherIdsUrl: '',
            width: 153,
            panelHeight: 'auto',
            required: false,
            lines: false,
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

        var $combotreeObj = $(this);

        $combotreeObj.combotree({
            url: options.url,
            width: options.width,
            height: options.height,
            panelHeight: options.panelHeight,
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
                var $treeObj = $("#" + options.id).combotree('tree');

                // 展开根节点
                $treeObj.tree("expand", $treeObj.tree('getRoot').target);

                if (options.expandAll) {
                    $treeObj.tree("expandAll");
                }

                if (options.getFatherIdsUrl) {
                    setTimeout(function () {
                        expandToTargetNode($treeObj, options);
                    }, 100);
                }
            },
            onSelect: function (node) {
                /*if (options.params) {
                 var dialogIdArr = options.dialog.id.split(",");
                 for (var i = 0; i < dialogIdArr.length; i++) {
                 var jsonData = getSelectedRowJson(options.params, node);
                 getTabWindow().$("#" + dialogIdArr[i]).form('load', jsonData);
                 }
                 }*/
                var $formObj = $("#" + options.id).closest('form');
                if (options.params) {
                    var jsonData = getSelectedRowJson(options.params, node);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                }
                if (typeof options.backfill == "object") {
                    $.getJSON(replaceUrlParamValueByBrace(options.backfill.url, node), {}, function (backfillData) {
                        getTabWindow().$("#" + $formObj.attr("id")).form('load', backfillData);
                    });
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

        function expandToTargetNode($treeObj, options) {
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
                if (dataObj.id != undefined)
                    $(options.combotreeId).combotree('setValue', dataObj.id);//数据加载完毕可以设置值了
            }
        }

    }

})(jQuery);;function getTabWindow() {
    var curTabWin = null;
    if (topJUI.config.aloneUse) {
        curTabWin = window;
    } else {
        var curTab = parent.$('#index_tabs').tabs('getSelected');
        // var curTab = $('#index_tabs').tabs('getSelected');
        if (curTab && curTab.find('iframe').length > 0) {
            curTabWin = curTab.find('iframe')[0].contentWindow;
        }
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
        var lastMenuClickTime = $.cookie("menuClickTime");
        var nowTime = new Date().getTime();
        if ((nowTime - lastMenuClickTime) >= 1000) {
            $.cookie("menuClickTime", new Date().getTime());
            t.tabs('myAdd', opts);
        } else {
            $.messager.show({
                title: '温馨提示',
                msg: '操作过快，请稍后重试！'
            });
        }
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

    var iframe = '<iframe src="' + src + '" frameborder="0" style="border:0;width:100%;height:100%;"></iframe>';
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
            href = replaceUrlParamValueByBrace(options.href, rows, "multiple");
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
    //if (typeof options.grid != "object") {
    var toolbarOptions = getOptionsJson($element.closest("div"));
    options = $.extend(true, toolbarOptions, options);
    //}
    var defaults = {};
    // 打开dialog事件
    if (options.clickEvent == "openDialog") {
        defaults = {
            iconCls: 'icon-add',
            parentGridUnselectedMsg: '请先选中一条主表数据！',
            dialog: {
                title: '数据详情',
                width: 700,
                height: 450
            }
        }
        options.dialog.width = options.dialog.width ? options.dialog.width : 700;
        options.dialog.height = options.dialog.height ? options.dialog.height : 'auto';
        options = $.extend(defaults, options);

        if (typeof options.dialog == "object") {
            generateDialogDoc(options);
        }

        /*var extendDoc = "";
         // 判断是否存在父grid
         if (typeof options.parentGrid == "object") {
         extendDoc += ',parentGrid:{type:\'' + options.parentGrid.type + '\',id:\'' + options.parentGrid.id + '\',params:\'' + options.parentGrid.params + '\',unselectedMsg:\'' + options.parentGrid.unselectedMsg + '\'}';
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
         var divOrForm = options.form == false ? "div" : "form";
         dialogDom = '<' + divOrForm + ' data-toggle="topjui-dialog" data-options="id:\'' + options.dialog.id + '\',href:\'' + options.dialog.href + '\',url:\'' + options.dialog.url + '\',title:\'' + options.dialog.title + '\',beforeOpenCheckUrl:\'' + options.dialog.beforeOpenCheckUrl + '\'' + extendDoc + '"></' + divOrForm + '>';

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
         )*/

        /*$element.on("click", function () {
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
         //$dialogObj.dialog('refresh', appendSourceUrlParam(options.dialog.href)); //加载两次href指定的页面
         $dialogObj.dialog({
         href: appendSourceUrlParam(options.dialog.href)
         });
         $dialogObj.dialog('open');
         }
         });*/
    } else if (options.clickEvent == "openTab") {
        /*defaults = {
         iconCls: 'icon-add'
         }
         options = $.extend(defaults, options);

         $element.on("click", function () {
         addParentTab(options);
         });*/
    } else if (options.clickEvent == "openWindow") {
        /*defaults = {
         iconCls: 'icon-add'
         }
         options = $.extend(defaults, options);

         $element.on("click", function () {
         openWindow(options);
         });*/
    } else if (options.clickEvent == "edatagrid") {
        defaults = {
            iconCls: 'icon-add'
        }
        options = $.extend(defaults, options);

        $element.on("click", function () {
            if (options.type == "addRow")
                $('#' + options.grid.id).edatagrid('addRow', 0);
            if (options.type == "saveRow")
                $('#' + options.grid.id).edatagrid('saveRow');
            if (options.type == "cancelRow")
                $('#' + options.grid.id).edatagrid('cancelRow');
        });
    } else if (options.clickEvent == "doAjax") {
        /*defaults = {
         iconCls: 'icon-add'
         }
         options = $.extend(defaults, options);

         $element.on("click", function () {
         //doAjaxHandler(options);
         });*/
    } else if (options.clickEvent == "request") {
        /*defaults = {
         iconCls: 'icon-add'
         }
         options = $.extend(defaults, options);

         $element.on("click", function () {
         requestHandler(options);
         });*/
    } else if (options.clickEvent == "delete") {
        defaults = {
            iconCls: 'icon-delete'
        }
        options = $.extend(defaults, options);

        /* $element.on("click", function () {
         deleteHandler(options);
         });*/
    } else if (options.clickEvent == "filter") {
        defaults = {
            iconCls: 'icon-filter'
        }
        options = $.extend(defaults, options);

        /*$element.on("click", function () {
         filterHandler(options);
         });*/
    } else if (options.clickEvent == "search") {
        defaults = {
            iconCls: 'icon-search',
            href: '/system/search/advanceSearch'
        }
        options = $.extend(defaults, options);

        /*$element.on("click", function () {
         searchHandler(options);
         });*/
    } else if (options.clickEvent == "export") {
        defaults = {
            iconCls: 'icon-table_go'
        }
        options = $.extend(defaults, options);

        /*$element.on("click", function () {
         exportHandler(options);
         });*/
    } else if (options.clickEvent == "import") {
        defaults = {
            iconCls: 'icon-table_go',
            href: '/system/excel/excelImport'
        }
        options = $.extend(defaults, options);

        /*$element.on("click", function () {
         importHandler(options);
         });*/
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
        parentGridParam = options.parentGrid.params;
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
    $dialogObj.iDialog(options);

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
    $dialogObj.iDialog(options);

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
    if (topJUI.config.authUrl == "") {
        return true;
    } else {
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
                        msg: topJUI.language.message.msg.permissionDenied,
                        icon: topJUI.language.message.icon.warning
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
        comfirmMsg: "确定要执行该操作吗？",
        grid: {
            uncheckedMsg: topJUI.language.message.msg.checkSelfGrid
        }
    }
    options = $.extend({}, defaults, options);
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

    if (typeof options.grid == "object") {
        var dgOpts = $("#" + options.grid.id).datagrid('options');

        if (options.grid.multiCheck == true || options.grid.uncheckedMsg != undefined) {
            // 勾选复选框提交多条数据
            $("#" + options.grid.id).datagrid('multiCheckedAjax', options);
        } else {
            if (dgOpts.singleSelect == false) {
                $("#" + options.grid.id).datagrid('multiSelectedAjax', options);
            } else { // 提交单条记录
                $("#" + options.grid.id).datagrid('singleSelectedAjax', options);
            }
        }
    }


}

/**
 * 普通请求操作
 * @param options
 */
function requestHandler(options) {
    // 权限控制
    if (!authCheck(options.url)) return;
    options.url = appendSourceUrlParam(options.url);

    if (typeof options.grid == "object") {
        // 替换本表的占位数据
        var row = getSelectedRowData(options.grid.type, options.grid.id);
        if (row == null) {
            $.messager.alert(
                topJUI.language.message.title.operationTips,
                topJUI.language.message.msg.selectSelfGrid,
                topJUI.language.message.icon.warning
            );
            return;
        }
        // 替换本表中选择的单行字段值
        options.newUrl = replaceUrlParamValueByBrace(options.url, row);
    } else {
        options.newUrl = options.url;
    }

    window.location.href = options.newUrl;
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
        /*options.filterOption = [{
            field: 'userName',
            type: 'combobox',
            options: {
                valueField: 'label',
                textField: 'value',
                data: [{
                    label: 'java',
                    value: 'Java'
                }, {
                    label: 'perl',
                    value: 'Perl'
                }, {
                    label: 'ruby',
                    value: 'Ruby'
                }]
            },
            op: ['contains', 'equal', 'notequal', 'less', 'greater']
        }];*/
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
        //url: '/system/index/requestSuccess',
        excelTitle: parent.$('#index_tabs').tabs('getSelected').panel('options').title + "_导出数据_" + getCurrentDatetime("YmdHis"),
        url: options.url ? options.url : controllerUrl + "exportExcel"
    }
    options = $.extend(defaults, options);

    // 权限控制
    if (!authCheck(options.url)) return;

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

    //if (doAjax(options)) {
    window.location.href = options.url + '?excelTitle=' + options.excelTitle + '&colName=' + colNameStr + '&fieldName=' + fieldNameStr;
    //}
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

/**
 * 显示提供信息
 * @param data
 */
function showMessage(data) {
    var messageJson = {};
    var statusCode = "";
    if (typeof(data) == "object") {
        statusCode = data.statusCode;
        if (data.icon == undefined) {
            data.icon = topJUI.language.message.icon.info;
        }
        messageJson = {
            showType: topJUI.language.message.showType.slide,
            title: data.title,
            msg: data.message,
            icon: data.icon
        };
    } else {
        statusCode = data;
        if (data == 1) {
            messageJson = {
                showType: topJUI.language.message.showType.slide,
                title: topJUI.language.message.title.operationTips,
                msg: topJUI.language.message.msg.success,
                icon: topJUI.language.message.icon.info
            };
        } else {
            messageJson = {
                showType: topJUI.language.message.showType.slide,
                title: topJUI.language.message.title.operationTips,
                msg: topJUI.language.message.msg.failed,
                icon: topJUI.language.message.icon.error
            };
        }
    }

    if (statusCode == 1 || statusCode == 100 || statusCode == 200) {
        if (statusCode == 1 || statusCode == 200) {
            //showMask();
            //setTimeout(hideMask, 1000);
            messageJson.timeout = 1000;
            $.messager.show(messageJson); //状态码为1和200时，屏幕中上部弹出操作成功提示框
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
};;var defaultConfig = {
    pageLoadComplete: false,
    config: {
        ctx: "",
        mainPagePath: "/system/index/index", //系统主页面路径，不包含域名及参数
        pkName: "uuid"
    },
    language: {
        message: {
            showType: {
                slide: "slide",
                fade: "fade",
                show: "show"
            },
            title: {
                operationTips: "操作提示",
                confirmTips: "确认提示"
            },
            msg: {
                success: "操作成功",
                failed: "操作失败",
                error: "未知错误",
                checkSelfGrid: "请先勾选要操作的数据前的复选框",
                selectSelfGrid: "请先选中要操作的数据",
                selectParentGrid: "请先选中主表中要操作的一条数据",
                permissionDenied: "对不起，你没有操作权限",
                confirmDelete: "你确定要删除所选的数据吗？"
            },
            icon: {
                error: "error",
                question: "question",
                info: "info",
                warning: "warning"
            }
        }
    },
    eventType: {
        //initUI     : 'topjui.initForm',         // When document load completed or ajax load completed, B-JUI && Plugins init
        initUI: {
            base: 'topjui.initUI.base',
            dialog: 'topjui.initUI.dialog',
            base2: 'topjui.initUI.base2',
            echarts: 'topjui.initUI.echarts',
            form: 'topjui.initUI.form',
            advanceSearchForm: 'topjui.initUI.advanceSearchForm',
            importExcelForm: 'topjui.initUI.importExcelForm'
        },
        beforeInitUI: 'topjui.beforeInitUI',   // If your DOM do not init [add to DOM attribute 'data-noinit="true"']
        afterInitUI: 'topjui.afterInitUI',    //
        ajaxStatus: 'topjui.ajaxStatus',     // When performing ajax request, display or hidden progress bar
        resizeGrid: 'topjui.resizeGrid',     // When the window or dialog resize completed
        beforeAjaxLoad: 'topjui.beforeAjaxLoad', // When perform '$.fn.ajaxUrl', to do something...

        beforeLoadNavtab: 'topjui.beforeLoadNavtab',
        beforeLoadDialog: 'topjui.beforeLoadDialog',
        afterLoadNavtab: 'topjui.afterLoadNavtab',
        afterLoadDialog: 'topjui.afterLoadDialog',
        beforeCloseNavtab: 'topjui.beforeCloseNavtab',
        beforeCloseDialog: 'topjui.beforeCloseDialog',
        afterCloseNavtab: 'topjui.afterCloseNavtab',
        afterCloseDialog: 'topjui.afterCloseDialog'
    }
};
topJUI = $.extend(true, defaultConfig, topJUI);

/* TopJUI默认属性 */
var defaultHeight = 34;
$.fn.textbox.defaults.height = defaultHeight;
$.fn.combobox.defaults.height = defaultHeight;
$.fn.combotree.defaults.height = defaultHeight;
$.fn.numberspinner.defaults.height = defaultHeight;;(function ($) {
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
            multiSort: false,
            sortName: "",
            sortOrder: "",
            //toolbar          : this.selector + 'Toolbar',
            addButton: true,
            editButton: true,
            deleteButton: true,
            searchButton: true,
            addDialogTitle: '新增',
            editDialogTitle: '编辑',
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
            multiSort: options.multiSort,
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

                //$('#' + options.id).datagrid('doCellTip', {cls: {'background-color': 'red'}, delay: 500});
                $('#' + options.id).datagrid('doCellTip', {cls: {}, delay: 500});

                //$(this).datagrid("fixRownumber");
                if (typeof options.childGrid == "object") {
                    var refreshGridIdArr = options.childGrid.grids;
                    for (var i = 0; i < refreshGridIdArr.length; i++) {
                        var syncReload = refreshGridIdArr[i].syncReload;
                        if (syncReload) {
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
                    newQueryParams = getSelectedRowJson(options.childGrid.params, row);

                    var refreshGridIdArr = options.childGrid.grids;
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

                if (typeof options.childTab == "object") {
                    var childTabArr = options.childTab.tabs;
                    for (var i = 0; i < childTabArr.length; i++) {
                        var $tabsElement = $('#' + childTabArr[i].id);
                        var $tabsOptions = $tabsElement.tabs('options');
                        var selectedIndex = $tabsElement.tabs('getTabIndex', $tabsElement.tabs('getSelected'));
                        var tabsComponent = $tabsOptions.tabs;
                        var $element = $("#" + tabsComponent[selectedIndex].id);

                        var newQueryParams = {};

                        newQueryParams = getSelectedRowJson(childTabArr[i].params, row);

                        if (tabsComponent[selectedIndex]["type"] == "datagrid") {
                            //获得表格原有的参数
                            var queryParams = $element.datagrid('options').queryParams;
                            $element.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.datagrid('load');
                        } else if (tabsComponent[selectedIndex]["type"] == "treegrid") {
                            //获得表格原有的参数
                            var queryParams = $element.treegrid('options').queryParams;
                            $element.treegrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                            $element.treegrid('load');
                        } else if (tabsComponent[selectedIndex]["type"] == "panel") {
                            var panelOptions = $element.panel('options');
                            var newHref = replaceUrlParamValueByBrace(panelOptions.dynamicHref, row);
                            //$element.panel('refresh', newHref);
                            var iframe = '<iframe src="' + newHref + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
                            $element.panel({
                                content: iframe
                            });
                        }
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

    $.extend($.fn.datagrid.methods, {
        /**
         * 单选ajax提交
         * @param target
         * @param options
         */
        singleSelectedAjax: function (target, options) {
            // 替换本表的占位数据
            var row = getSelectedRowData(options.grid.type, options.grid.id);
            if (row == null) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    topJUI.language.message.msg.selectSelfGrid,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            // 替换本表中选择的单行字段值
            options.url = replaceUrlParamValueByBrace(options.url, row);
            $.messager.confirm(
                topJUI.language.message.title.confirmTips,
                options.comfirmMsg,
                function (flag) {
                    if (flag && doAjax(options)) {
                        refreshGrid(options.grid.type, options.grid.id);
                    }
                }
            );
        },
        /**
         * 多选ajax提交
         * @param target
         * @param options
         */
        multiSelectedAjax: function (target, options) {
            //var datagridOpts = $.data(target[0], "datagrid").options;
            // 替换本表的占位数据
            var rows = getSelectedRowsData(options.grid.type, options.grid.id);
            if (rows.length == 0) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    topJUI.language.message.msg.selectSelfGrid,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            $.messager.confirm(
                topJUI.language.message.title.confirmTips,
                options.comfirmMsg,
                function (flag) {
                    if (options.grid.param == undefined) {
                        //options.grid.param = {uuid: topJUI.config.pkName};
                        options.grid.param = topJUI.config.pkName + ":" + topJUI.config.pkName;
                    }
                    options.grid.param = param2JsonObj(options.grid.param);
                    options.ajaxData = convertParamObj2ObjData(options.grid.param, rows);
                    if (flag && doAjax(options)) {
                        refreshGrid(options.grid.type, options.grid.id);
                    }
                }
            );
        },
        /**
         * 勾选ajax提交
         * @param target
         * @param options
         */
        multiCheckedAjax: function (target, options) {
            //var datagridOpts = $.data(target[0], "datagrid").options;
            // 替换本表的占位数据
            var rows = getCheckedRowsData(options.grid.type, options.grid.id);
            if (rows.length == 0) {
                $.messager.alert(
                    topJUI.language.message.title.operationTips,
                    options.grid.uncheckedMsg,
                    topJUI.language.message.icon.warning
                );
                return;
            }
            $.messager.confirm(
                topJUI.language.message.title.confirmTips,
                options.comfirmMsg,
                function (flag) {
                    if (options.grid.param == undefined) {
                        //options.grid.param = {uuid: topJUI.config.pkName};
                        options.grid.param = topJUI.config.pkName + ":" + topJUI.config.pkName;
                    }
                    //options.grid.param = param2JsonObj(options.grid.param);
                    //options.ajaxData = convertParamObj2ObjData(options.grid.param, rows);
                    options.ajaxData = convertParamObj2ObjData(param2JsonObj(options.grid.param), rows);
                    if (flag && doAjax(options)) {
                        refreshGrid(options.grid.type, options.grid.id);
                    }
                }
            );
        },
        /**
         * http://blog.csdn.net/aa1049372051/article/details/22849891
         * 开启消息提示功能
         * @param {} jq
         * @param {} params 提示消息框的样式
         * @return {}
         */
        doCellTip: function (jq, params) {
            function showTip(data, td, e) {
                if ($(td).text() == "")
                    return;
                data.tooltip.text($(td).text()).css({
                    top: (e.pageY + 10) + 'px',
                    left: (e.pageX + 20) + 'px',
                    'z-index': $.fn.window.defaults.zIndex,
                    display: 'block'
                });
            };
            return jq.each(function () {
                var grid = $(this);
                var options = $(this).data('datagrid'); //获取 datagrid 数据

                if (!options.tooltip) {
                    var panel = grid.datagrid('getPanel').panel('panel');
                    var defaultCls = {
                        'border': '1px solid #333',
                        'padding': '1px',
                        'color': '#333',
                        'background': '#f7f5d1',
                        'position': 'absolute',
                        'max-width': '400px',
                        'border-radius': '4px',
                        '-moz-border-radius': '4px',
                        '-webkit-border-radius': '4px',
                        'display': 'none'
                    }
                    var tooltip = $("<div id='celltip'></div>").appendTo('body');
                    tooltip.css($.extend({}, defaultCls, params.cls));
                    options.tooltip = tooltip;
                    panel.find('.datagrid-body').each(function () {
                        var delegateEle = $(this).find('> div.datagrid-body-inner').length
                            ? $(this).find('> div.datagrid-body-inner')[0]
                            : this;
                        $(delegateEle).undelegate('td', 'mouseover').undelegate(
                            'td', 'mouseout').undelegate('td', 'mousemove')
                            .delegate('td', {
                                'mouseover': function (e) {
                                    if (params.delay) {
                                        if (options.tipDelayTime)
                                            clearTimeout(options.tipDelayTime);
                                        var that = this;
                                        options.tipDelayTime = setTimeout(
                                            function () {
                                                showTip(options, that, e);
                                            }, params.delay);
                                    } else {
                                        showTip(options, this, e);
                                    }

                                },
                                'mouseout': function (e) {
                                    if (options.tipDelayTime)
                                        clearTimeout(options.tipDelayTime);
                                    options.tooltip.css({
                                        'display': 'none'
                                    });
                                },
                                'mousemove': function (e) {
                                    var that = this;
                                    if (options.tipDelayTime) {
                                        clearTimeout(options.tipDelayTime);
                                        options.tipDelayTime = setTimeout(
                                            function () {
                                                showTip(options, that, e);
                                            }, params.delay);
                                    } else {
                                        showTip(options, that, e);
                                    }
                                }
                            });
                    });

                }

            });
        },
        /**
         * 关闭消息提示功能
         * @param {} jq
         * @return {}
         */
        cancelCellTip: function (jq) {
            return jq.each(function () {
                var data = $(this).data('datagrid');
                if (data.tooltip) {
                    data.tooltip.remove();
                    data.tooltip = null;
                    var panel = $(this).datagrid('getPanel').panel('panel');
                    panel.find('.datagrid-body').undelegate('td',
                        'mouseover').undelegate('td', 'mouseout')
                        .undelegate('td', 'mousemove')
                }
                if (data.tipDelayTime) {
                    clearTimeout(data.tipDelayTime);
                    data.tipDelayTime = null;
                }
            });
        }
    });


})(jQuery);;(function ($) {

    $.fn.iDialog = function (options) {
        var dialogOptions = options.dialog;
        var $dialogObj = $("#" + dialogOptions.id);
        var defaults = {
            currentDialogId: this.selector,
            width: 700,
            height: 'auto',//宽高限制650*450,900*500
            title: '新增/编辑',
            modal: true,
            closed: true,
            iconCls: 'fa fa-windows',
            collapsible: true,
            maximizable: true,
            minimizable: false,
            maximized: false,
            resizable: true,
            openAnimation: 'show',
            openDuration: 100,
            closeAnimation: 'show',
            closeDuration: 400,
            zIndex: 10,
            toolbar: this.selector + '-toolbar',
            buttons: this.selector + '-buttons',
            postfix: 'Edit',
            combotreeFields: '',
            refreshTreeId: '',
            onBeforeOpen: function () {

            },
            onLoad: function () {
                $(this).trigger(topJUI.eventType.initUI.form);
                $(this).dialog("center");
                if (dialogOptions.url != undefined) {
                    // 获取选中行的数据
                    var row = getSelectedRowData(options.grid.type, options.grid.id);
                    // 如果指定了数据来源URL，则通过URL加载数据
                    var newDialogUrl = replaceUrlParamValueByBrace(dialogOptions.url, row);
                    $.getJSON(newDialogUrl, function (data) {
                        $dialogObj.form('load', data);
                        if (typeof dialogOptions.editor == "string" || typeof dialogOptions.editor == "object") {
                            // kindeditor编辑器处理
                            if (typeof dialogOptions.editor == "string") {
                                // 富文本编辑器字符串
                                var ke = [], keObj = [];
                                ke = dialogOptions.editor.replace(/'/g, '"').split(",");
                                for (var i = 0; i < ke.length; i++) {
                                    keObj.push(strToJson(ke[i]));
                                }
                            } else {
                                // 富文本编辑数组
                                keObj = dialogOptions.editor;
                            }
                            for (var i = 0; i < keObj.length; i++) {
                                var editorType = keObj[i]["type"];
                                var editorId = keObj[i]["id"];
                                var editorField = keObj[i]["field"];
                                if (editorType == "kindeditor") {
                                    getTabWindow().$("iframe").each(function (i) {
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
                if (typeof options.parentGrid == "object") {
                    var parentRow = getSelectedRowData(options.parentGrid.type, options.parentGrid.id);
                    var jsonData = getSelectedRowJson(options.parentGrid.params, parentRow);
                    $dialogObj.form('load', jsonData);
                }
            },
            onClose: function () {
                $(dialogOptions.currentDialogId).form('clear');
            }
        }

        dialogOptions = $.extend(defaults, options.dialog);

        var controllerUrl = getUrl('controller');
        dialogOptions.href = dialogOptions.href ? dialogOptions.href + location.search : controllerUrl + "edit" + location.search;

        $(this).dialog(dialogOptions);
    }

    generateDialogDoc = function (options) {

        var defaults = {
            iconCls: 'icon-add',
            parentGridUnselectedMsg: '请先选中一条主表数据！',
            dialog: {
                title: '数据详情',
                width: 650,
                height: 450
            }
        }

        options = $.extend(defaults, options);

        var divOrForm = options.dialog.form == false ? "div" : "form";
        var dialogDom = '<' + divOrForm + ' data-toggle="topjui-dialog" data-options="id:\'' + options.dialog.id + '\',href:\'' + options.dialog.href + '\',url:\'' + options.dialog.url + '\',title:\'' + options.dialog.title + '\',beforeOpenCheckUrl:\'' + options.dialog.beforeOpenCheckUrl + '\'"></' + divOrForm + '>';

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
                    buttonsDom += '<a href="#" data-toggle="topjui-linkbutton" data-options="menubuttonId:\'' + options.id + '\',handlerBefore:\'' + buttonsArr[i].handlerBefore + '\',handler:\'' + buttonsArr[i].handler + '\',dialog:{id:\'' + options.dialog.id + '\'},url:\'' + buttonsArr[i].url + '\',iconCls:\'' + buttonsArr[i].iconCls + '\'">' + buttonsArr[i].text + '</a>';
                }
            }
        }

        getTabWindow().$('body').append(
            dialogDom +
            '<div id="' + options.dialog.id + '-buttons" style="display:none">' +
            buttonsDom +
            '<a href="#" data-toggle="topjui-linkbutton" data-options="iconCls:\'fa fa-close\'" onclick="javascript:$(\'#' + options.dialog.id + '\').dialog(\'close\')">关闭</a>' +
            '</div>'
        );

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
            multiSort: false,
            sortName: "",
            sortOrder: "",
            //toolbar          : this.selector + 'Toolbar',
            addButton: true,
            editButton: true,
            deleteButton: true,
            searchButton: true,
            addDialogTitle: '新增',
            editDialogTitle: '编辑',
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
            multiSort: options.multiSort,
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
            prompt: '',
            type: 'text',
            multiline: false,
            readonly: false,
            disabled: false,
            iconCls: '',
            buttonText: '',
            buttonIcon: ''
        }

        var options = $.extend(defaults, options);

        $(this).textbox(options);
    }

    $.fn.iSwitchbutton = function (options) {
        var defaults = {
            width: 153,
            value: "1"
        }

        var options = $.extend(defaults, options);

        $(this).switchbutton(options);
    }

    $.fn.iFilebox = function (options) {
        var defaults = {
            width: 450,
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
        }

        var options = $.extend(defaults, options);

        $(this).filebox(options);
    }

    $.fn.iNumberspinner = function (options) {
        var defaults = {
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

        $(this).numberspinner(options);
    }

    $.fn.iDatebox = function (options) {
        var defaults = {
            required: false,
            editable: true,
            value: "",
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
            onSelect: function (date) {

            }
        }

        var options = $.extend(defaults, options);

        $(this).datebox(options);
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

        $(this).numberbox(options);
    }

    $.fn.iValidatebox = function (options) {
        var defaults = {
            required: true,
            validType: 'email'
        }

        var options = $.extend(defaults, options);

        $(this).validatebox(options);
    }

    $.fn.iCombobox = function (options) {
        var defaults = {
            width: 153,
            url: ctx + '/system/codeItem/getListByCodeSetIdAndLevelId?codeSetId={codeSetId}&levelId={levelId}',
            codeSetId: 0,
            pid: 0,
            valueField: 'text',
            textField: 'text',
            editable: false,
            panelHeight: 'auto',
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

                if (options.params) {
                    var jsonData = getSelectedRowJson(options.params, record);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                }
            }
        }

        var options = $.extend(defaults, options);

        if (options.data)
            options.url = "";
        if (options.codeSetId)
            options.url = options.url.replace("{codeSetId}", options.codeSetId).replace("{levelId}", options.levelId);

        $(this).combobox(options);
    }

    $.fn.iCombogrid = function (options) {
        var defaults = {
            width: 153,
            panelWidth: 450,
            delay: 1000,
            mode: 'remote',
            url: ctx + '/system/user/getListByKeywords',
            idField: 'userNameId',
            textField: 'userName',
            fitColumns: true,
            columns: [[
                {field: 'userName', title: '姓名'},
                {field: 'userNameId', title: '用户名'},
                {field: 'orgName', title: '所属机构', width: 100},
                {field: 'post', title: '职位', width: 100}
            ]],
            onChange: function (newValue, oldValue) {
                $('#' + options.id).combogrid('grid').datagrid('load', {q: newValue});
                //$('#' + options.id).combogrid('grid').datagrid('options').queryParams.departid = newId;
                //$('#' + options.id).combogrid('grid').datagrid('reload');
                //setTimeout(function () {
                $('#' + options.id).combogrid('grid').datagrid('selectRecord', newValue);
                //}, 1000);
                /*if (options.editMode) {
                 setTimeout(function () {
                 var gridParamArr = options.param.split(",");
                 var gridKVArr = gridParamArr[0].split(":");
                 var textFieldName = gridKVArr[0];
                 var $formObj = $("#" + options.id).closest('form');
                 var textFieldValue = $('#' + $formObj.attr("id") + ' input[name="' + textFieldName + '"]').val();
                 if (textFieldValue) $('#' + options.id).combogrid('setText', textFieldValue);
                 }, 500);
                 }*/
            },
            onLoadSuccess: function (data) {
                //$("#gridid").combogrid('grid').datagrid('selectRecord', 'admin');
            },
            onSelect: function (index, row) {
                if (options.params) {
                    var $formObj = $("#" + options.id).closest('form');
                    var jsonData = getSelectedRowJson(options.params, row);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                    $('#' + options.id).combogrid('textbox').focus();
                }
            }
        }

        var options = $.extend(defaults, options);

        $(this).combogrid(options);
    }

    $.fn.iCombotreegrid = function (options) {
        var defaults = {
            width: 153,
            panelWidth: 450,
            url: ctx + '/system/user/getListByKeywords',
            idField: 'id',
            treeField: 'text',
            fitColumns: true,
            animate: true,
            columns: [[
                {field: 'id', title: '标识', hidden: true},
                {field: 'text', title: '名称', width: 100},
                {field: 'levelId', title: '层级'},
                {field: 'sort', title: '排序'}
            ]],
            onBeforeExpand: function (node, param) {
                var grid = $('#' + options.id).combotreegrid('grid');
                grid.treegrid('options').url = replaceUrlParamValueByBrace(options.expandUrl, node);
            },
            onChange: function (newValue, oldValue) {

            },
            onLoadSuccess: function (node, data) {
                var grid = $('#' + options.id).combotreegrid('grid');
                // 展开根节点
                grid.treegrid("expand", grid.treegrid('getRoot').id);

                if (options.expandAll) {
                    grid.treegrid("expandAll");
                }

                if (options.getFatherIdsUrl) {
                    setTimeout(function () {
                        var selectedNode = grid.treegrid('getSelected');
                        var dataObj = {id: $('#' + options.id).combotreegrid("getValue")};
                        if (selectedNode == null && dataObj.id != "") {
                            var findNode;
                            $.ajax({
                                type: "POST",
                                url: replaceUrlParamValueByBrace(options.getFatherIdsUrl, dataObj),
                                success: function (data) {
                                    var fatherIdsArray = data.split(",");
                                    for (var i = fatherIdsArray.length - 1; i >= 0; i--) {
                                        findNode = grid.treegrid('find', fatherIdsArray[i].replace(/'/g, ""));
                                        if (findNode) {
                                            grid.treegrid('expand', findNode.id);
                                        }
                                    }
                                }
                            });
                            if (dataObj.id != undefined)
                                $("#" + options.id).combotreegrid('setValue', dataObj.id);//数据加载完毕可以设置值了
                        }
                    }, 100);
                }
            },
            onSelect: function (index, row) {
                if (options.param) {
                    var $formObj = $("#" + options.id).closest('form');
                    var jsonData = getSelectedRowJson(options.param, row);
                    getTabWindow().$("#" + $formObj.attr("id")).form('load', jsonData);
                    $('#' + options.id).combogrid('textbox').focus();
                }
            }
        }

        var options = $.extend(defaults, options);

        $(this).combotreegrid(options);
    }

    $.fn.iAutoComplete = function (options) {
        var defaults = {
            comboboxId: this.selector,
            url: ctx + "/system/user/getListByUserName?userName=",
            valueField: 'userNameId',
            textField: 'userName',
            width: 450,
            panelHeight: 250,
            fieldId: 'userNameId',
            required: false,
            formatter: '',
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
                //$(this).combobox("reload", options.url);
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
                 var jsonData = getSelectedRowJson(options.params, record);
                 getTabWindow().$("#" + dialogIdArr[i]).form('load', jsonData);
                 }*/

                if (options.params) {
                    //var $formObj = $comboboxObj.closest('form');
                    var $formObj = $("#" + options.id).closest('form');
                    var jsonData = getSelectedRowJson(options.params, record);
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
        }

        var options = $.extend(defaults, options);

        if (options.comboboxId == "") {
            options.comboboxId = $(this).context;
        }

        $(this).combobox(options);
    }

})(jQuery);;// 获取地址栏参数
$.getUrlParam = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

/**
 * 获得URL变量
 * 使用方法：$.getUrlVar("param")
 * @Description
 * @Author 小策一喋<xvpindex@qq.com>
 * @Date 2017/5/30 18:02
 */
$.extend({
    getUrlVars: function () {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function (name) {
        return $.getUrlVars()[name];
    }
});

// 获取网址字符串参数值
$.getUrlStrParam = function (urlStr, name) {
    var urlParam = urlStr.substring(urlStr.indexOf("?"));
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = urlParam.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
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
        options.id = getTimestamp();
        //options.id = $element[0].name; // 以字段名作为id值
        $element.attr("id", options.id);
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
 * 参数转json对象
 * 形如uuid:uuid,uid:uid转{"uuid":"uuid","uid":"uid"}
 * @param gridParam
 * @param row
 * @returns {{}}
 */
function param2JsonObj(param) {
    var jsonObj = {};
    if (param) {
        var paramArr = param.split(",");
        for (var i = 0; i < paramArr.length; i++) {
            if (paramArr[i].indexOf(":") == -1) {
                jsonObj[paramArr[i]] = paramArr[i];
            } else {
                var kvArr = paramArr[i].split(":");
                jsonObj[kvArr[0]] = kvArr[1];
            }
        }
    }
    return jsonObj;
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

/**
 * 获取了当前毫秒的时间戳
 * @returns {number}
 */
function getTimestamp() {
    return new Date().getTime();
}

/**
 * 生成指定范围内的随机整数
 * @param minNum
 * @param maxNum
 * @returns {*}
 */
function getRandomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1);
            break;
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum);
            break;
        default:
            return 0;
            break;
    }
}

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
};;(function ($) {

    $.fn.iLinkbutton = function (options) {
        var defaults = {
            iconCls: 'icon-edit',
            plain: false
        }

        var options = $.extend(defaults, options);

        $(this).linkbutton(options);
    }

    $.extend($.fn.linkbutton.defaults, {

        onClick: function () {
            var linkbuttonOptions = $(this).linkbutton('options'); //事件中获取参数

            if (linkbuttonOptions.handler == "ajaxForm" || linkbuttonOptions.handler == "multiAjaxForm") {
                if (linkbuttonOptions.handlerBefore != "undefined") {
                    // 回调执行传入的自定义函数
                    executeCallBackFun(linkbuttonOptions.handlerBefore);
                }

                var defaults = {
                    gridId: 'datagrid',
                    dialogId: 'editDialog'
                }
                linkbuttonOptions = $.extend(defaults, linkbuttonOptions);
                var menubuttonOptions = $("#" + linkbuttonOptions.menubuttonId).linkbutton('options');
                var gridOptions = menubuttonOptions.grid, dialogOptions = menubuttonOptions.dialog;

                // 判断数据是否通过验证
                if (getTabWindow().$("#" + dialogOptions.id).form('validate')) {
                    // 序列化表单数据
                    linkbuttonOptions.ajaxData = getTabWindow().$("#" + dialogOptions.id).serialize();
                    if (linkbuttonOptions.combotreeFields != undefined) {
                        var combotreeParams = '';
                        $.each(options.combotreeFields, function (k, v) {
                            combotreeParams += '&' + v.replace(linkbuttonOptions.postfix, "") + '=' + getTabWindow().$("#" + dialogOptions.id + ' input[textboxname="' + v + '"]').combotree('getValues').join(',') + ', ';
                        });
                        linkbuttonOptions.ajaxData += combotreeParams;
                    }
                    // 提交更新多条数据
                    if (linkbuttonOptions.handler == "multiAjaxForm") {
                        var rows = getCheckedRowsData(gridOptions.type, gridOptions.id);
                        if (rows.length == 0) {
                            $.messager.alert(
                                topJUI.language.message.title.operationTips,
                                topJUI.language.message.msg.checkSelfGrid,
                                topJUI.language.message.icon.warning
                            );
                            return;
                        }
                        var pkName = gridOptions.pkName == undefined ? topJUI.config.pkName : gridOptions.pkName;
                        linkbuttonOptions.ajaxData += '&' + pkName + 's=' + getMultiRowsFieldValue(rows, pkName);
                    }
                    // 执行ajax动作
                    getTabWindow().doAjax(linkbuttonOptions);
                    // 关闭dialog
                    getTabWindow().$("#" + dialogOptions.id).dialog("close");
                    // 重新加载本grid数据
                    if (typeof gridOptions == "object") {
                        if (gridOptions.type == "datagrid") {
                            getTabWindow().$("#" + gridOptions.id).datagrid("reload");
                        } else if (gridOptions.type == "treegrid") {
                            var row = getSelectedRowData(gridOptions.type, gridOptions.id);
                            if (row == null)
                                getTabWindow().$("#" + gridOptions.id).treegrid("reload");
                            else
                                getTabWindow().$("#" + gridOptions.id).treegrid("reload", row[gridOptions.parentIdField]);
                        }
                    }
                    // 重新加载指定的Grid数据
                    refreshGrids(linkbuttonOptions.reload);
                } else {
                    showMessage({
                        statusCode: 300,
                        title: topJUI.language.message.title.operationTips,
                        message: '显示红底色的输入框为必填字段',
                        icon: topJUI.language.message.icon.warning
                    });
                }
            }

        }

    });

})(jQuery);;(function ($) {

    $.fn.iMenubutton = function (options) {
        var defaults = {
            plain: true,
            iconCls: 'icon-cog',
            hasDownArrow: false,
            onClick: function () {
                $(this).menubutton(options.clickEvent)
            }
        }

        var options = $.extend(defaults, options);

        $(this).menubutton(options);
    }

    $.extend($.fn.menubutton.methods, {

        openDialog: function (target, options) {
            //var options = $(this).menubutton('options'); // 事件中获取参数
            var options = $.data(target[0], "menubutton").options;
            //var options = target[0].dataset.options;
            var dialog = options.dialog;
            var grid = options.grid;
            var parentGrid = options.parentGrid;

            // 权限控制
            if (dialog.id != undefined) {
                if (!authCheck(dialog.id)) return;
            } else {
                if (!authCheck(dialog.href)) return;
            }

            options.dialog.leftMargin = ($(document.body).width() * 0.5) - (dialog.width * 0.5);
            options.dialog.topMargin = ($(document.body).height() * 0.5) - (dialog.height * 0.5);

            if (typeof parentGrid == "object") {
                openDialogAndloadDataByParentGrid(options);
            } else if (dialog.url) {
                openDialogAndloadDataByUrl(options);
            } else {
                if (grid.uncheckedMsg) {
                    var rows = getCheckedRowsData(grid.type, grid.id);
                    if (rows.length == 0) {
                        $.messager.alert(
                            topJUI.language.message.title.operationTips,
                            options.grid.uncheckedMsg,
                            topJUI.language.message.icon.warning
                        );
                        return;
                    }
                }
                if (dialog.onBeforeOpen != "undefined") {
                    // 回调执行传入的自定义函数
                    executeCallBackFun(dialog.onBeforeOpen, options);
                }
                options.href = appendSourceUrlParam(dialog.href);
                var $dialogObj = $("#" + dialog.id);
                $dialogObj.iDialog(options);
                $dialogObj.dialog('open');
            }
        },
        openTab: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            addParentTab(options);
        },
        openWindow: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            openWindow(options);
        },
        doAjax: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            doAjaxHandler(options);
        },
        request: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            requestHandler(options);
        },
        delete: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            deleteHandler(options);
        },
        filter: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            filterHandler(options);
        },
        search: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            searchHandler(options);
        },
        export: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            exportHandler(options);
        },
        import: function (target, options) {
            var options = $.data(target[0], "menubutton").options;
            importHandler(options);
        }

    });

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

        $('[data-toggle="topjui-switchbutton"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iSwitchbutton(options);
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

        $('[data-toggle="topjui-combogrid"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iCombogrid(options);
        });

        $('[data-toggle="topjui-combotree"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iCombotree(options);
        });

        $('[data-toggle="topjui-combotreegrid"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            options = setFormElementId($element, options);
            $element.iCombotreegrid(options);
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
            $element.iAutoComplete(options);
        });

        $('[data-toggle="topjui-ueditor"]').each(function (i) {
            var defaults = {
                height: 300
            };

            var $element = $(this);
            var options = getOptionsJson($element);
            options = $.extend(defaults, options);
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
                initialFrameHeight: options.height,
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
        //setTimeout(function () {
        // 父框架获取子框架元素
        // var test = $("iframe").contents().find("#test").val();

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

        getTabWindow().$('[data-toggle="topjui-tabs"]').each(function () {
            var $element = $(this);
            var options = getOptionsJson($element);

            $element.attr('id', options.id);
            getTabWindow().$('#' + options.id).iTabs(options);
        });

        getTabWindow().$('[data-toggle="topjui-menubutton"]').each(function () {
            var $element = $(this);
            var options = getOptionsJson($element);

            options.id = getTimestamp();
            $(this).attr("id", options.id);

            options = bindMenuClickEvent($element, options);

            $(this).iMenubutton(options);
        });

        getTabWindow().$('[data-toggle="topjui-uploader"]').each(function () {
            var $element = $(this);
            var options = getOptionsJson($element);

            // 生成菜单按钮
            $(this).iMenubutton(options);

            var uploader;
            var upfileGrid;
            var state = 'pending';
            var initfilesize = 0;
            var md5value = "";
            var isUpFile = false;//判断是否有文件上传成功，来提示dialog进行下部操作
            var parentRow;

            var dialogDom = '<div id="uploaderDialog">' +
                '<div id="upfileGrid-toolbar" data-options="border:false">' +
                '<div style="float: left;margin-right:5px;">' +
                '<div id="chooseFile">选择文件</div>' +
                '</div>' +
                '<a id="addUpFile" style="margin-right:5px;">开始上传</a>' +
                '<a id="removeUpFile">移除文件</a>' +
                '</div>' +
                '<table id="upfileGrid"></table>' +
                '</div>';

            getTabWindow().$('body').append(
                dialogDom +
                '<div id="uploaderDialog-buttons" style="display:none">' +
                '<a href="#" id="closeUploaderDialog">关闭</a>' +
                '</div>'
            );

            upfileGrid = $("#upfileGrid").datagrid({
                fit: true,
                fitColumns: true,
                rownumbers: true,
                nowrap: true,
                animate: false,
                border: false,
                singleSelect: false,
                idField: 'fileId',
                pagination: false,
                toolbar: '#upfileGrid-toolbar',
                columns: [[
                    {field: 'ck', checkbox: true},
                    {field: 'fileId', title: 'fileId', hidden: true},
                    {field: 'fileName', title: '文件名称', width: 100},
                    {field: 'fileSize', title: '文件大小', width: 30},
                    {field: 'validateMd5', title: '文件验证', width: 20},
                    {
                        field: 'progress',
                        title: '上传进度',
                        width: 180,
                        fixed: true,
                        formatter: function (value, rec) {
                            var htmlstr = '<div class="easyui-progressbar progressbar" style="width: 170px; height: 20px;" value="' + value + '" text="' + value + '%">' +
                                '<div class="progressbar-text" style="width: 170px; height: 20px; line-height: 20px;">' + value + '%</div>' +
                                '<div class="progressbar-value" style="width: ' + value + '%; height: 20px; line-height: 20px;">' +
                                '<div class="progressbar-text" style="width: 170px; height: 20px; line-height: 20px;">' + value + '%</div>' +
                                '</div>' +
                                '</div>';
                            return htmlstr;
                        }
                    },
                    {field: 'fileState', title: '上传状态', width: 20},
                ]]
            });

            // 在文件开始发送前做些异步操作。做md5验证
            // WebUploader会等待此异步操作完成后，开始发送文件。
            WebUploader.Uploader.register({
                "before-send-file": "beforeSendFile"
            }, {
                beforeSendFile: function (file) {
                    var task = new $.Deferred();
                    (new WebUploader.Uploader()).md5File(file, 0, 10 * 1024 * 1024).progress(function (percentage) {
                        upfileGrid.datagrid('updateRow',
                            {
                                index: upfileGrid.datagrid('getRowIndex', file.id),
                                row: {validateMd5: (percentage * 100) + "%"}
                            });
                    }).then(function (val) {
                        $.ajax({
                            type: "POST",
                            url: "/system/attachment/md5Validate",
                            data: {
                                type: "md5Check", md5: val
                            },
                            cache: false,
                            timeout: 3000,
                            dataType: "json"
                        }).then(function (data, textStatus, jqXHR) {
                            if (data.isHave) {   //若存在，这返回失败给WebUploader，表明该文件不需要上传
                                task.reject();
                                uploader.skipFile(file);
                                upfileGrid.datagrid('updateRow',
                                    {
                                        index: upfileGrid.datagrid('getRowIndex', file.id),
                                        row: {fileState: "秒传", progress: 100}
                                    });
                            } else {
                                $.extend(uploader.options.formData, {md5: val});
                                task.resolve();
                            }
                        }, function (jqXHR, textStatus, errorThrown) {    //任何形式的验证失败，都触发重新上传
                            task.resolve();
                        });
                    });
                    return $.when(task);
                }
            });

            uploader = WebUploader.create({
                // 不压缩image
                resize: false,
                // swf文件路径
                swf: '/static/webuploader/js/Uploader.swf',
                // 默认文件接收服务端。
                server: '/system/attachment/upload',
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: '#chooseFile',
                fileSingleSizeLimit: 100 * 1024 * 1024,//单个文件大小
                accept: [{
                    title: 'file',
                    extensions: 'doc,docx,pdf,xls,xlsx,ppt,pptx,gif,jpg,jpeg,bmp,png,rar,zip',
                    mimeTypes: '.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.gif,.jpg,.jpeg,.bmp,.png,.rar,.zip'
                }]
            });

            // 当有文件添加进来的时候
            uploader.on('fileQueued', function (file) {
                var fileSize = bytesToSize(file.size);
                var row = {
                    fileId: file.id,
                    fileName: file.name,
                    fileSize: fileSize,
                    validateMd5: '0%',
                    progress: 0,
                    fileState: "等待上传"
                };
                upfileGrid.datagrid('insertRow', {
                    index: 0,
                    row: row
                });
            });

            // 文件上传过程中创建进度条实时显示。
            uploader.on('uploadProgress', function (file, percentage) {
                upfileGrid.datagrid('updateRow',
                    {
                        index: upfileGrid.datagrid('getRowIndex', file.id),
                        row: {progress: (percentage * 100).toFixed(2)}
                    });
            });

            //文件上传成功
            uploader.on('uploadSuccess', function (file) {
                var rows = upfileGrid.datagrid("getRows");
                //上传成功设置checkbox不可用
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].fileId == file.id) {
                        $("input[type='checkbox']")[i + 1].disabled = true;
                    }
                }
                $("#removeUpFile").linkbutton("disable");
                upfileGrid.datagrid('updateRow',
                    {index: upfileGrid.datagrid('getRowIndex', file.id), row: {fileState: '上传成功'}});
                isUpFile = true;
            });
            //文件上传失败
            uploader.on('uploadError', function (file) {
                upfileGrid.datagrid('updateRow',
                    {index: upfileGrid.datagrid('getRowIndex', file.id), row: {fileState: '上传失败'}});
            });

            uploader.on('uploadComplete', function (file) {

            });

            uploader.on('uploadFinished', function () {//成功后
                $("#attachmentDg").datagrid('reload');
            });

            uploader.on('error', function (handler) {
                if (handler == 'F_EXCEED_SIZE') {
                    tim.parentAlert('error', '上传的单个文件不能大于' + initfilesize + '。<br>操作无法进行,如有需求请联系管理员', 'error');
                } else if (handler == 'Q_TYPE_DENIED') {
                    tim.parentAlert('error', '不允许上传此类文件!。<br>操作无法进行,如有需求请联系管理员', 'error');
                }
            });

            /*从队列中移除文件*/
            var removeFile = function () {
                var fileRows = upfileGrid.datagrid("getSelections");
                var copyRows = [];
                for (var j = 0; j < fileRows.length; j++) {
                    copyRows.push(fileRows[j]);
                }
                for (var i = 0; i < copyRows.length; i++) {
                    var index = upfileGrid.datagrid('getRowIndex', copyRows[i]);
                    uploader.removeFile(copyRows[i].fileId, true);
                    upfileGrid.datagrid('deleteRow', index);
                }
                upfileGrid.datagrid('clearSelections');
            }

            var uploadToServer = function (uploader, parentRow) {
                if (uploader.getFiles().length <= 0) {
                    $.messager.alert('提示', '没有上传的文件!', 'error');
                    return;
                }
                if (state === 'uploading') {
                    uploader.stop();
                }
                else {
                    uploader.option('formData', {
                        puuid: parentRow.uuid
                    });
                    uploader.upload();
                }
            }

            //初始化上传参数
            var initUpLoad = function (args) {
                var opts = {};
                if (args) {
                    if (args.url != null && args.url != "") {
                        opts.server = args.url;
                    }
                    if (args.size != null && args.size != "") {
                        initfilesize = args.size;
                        opts.fileSingleSizeLimit = args.size;
                    }
                    if (args.args != null && args.args != "") {
                        opts.formData = args.args;
                    }
                    if (opts) {
                        $.extend(uploader.options, opts);
                    }
                }
            }

            var getSuccess = function () {
                return isUpFile;
            }

            $element.on("click", function () {

                if (typeof options.parentGrid == "object") {
                    //判断父表数据是否被选中
                    parentRow = getSelectedRowData(options.parentGrid.type, options.parentGrid.id);
                    if (!parentRow) {
                        $.messager.alert(
                            topJUI.language.message.title.operationTips,
                            options.parentGrid.unselectedMsg || topJUI.language.message.msg.selectParentGrid,
                            topJUI.language.message.icon.warning
                        );
                        return;
                    }
                }

                var fileRows = upfileGrid.datagrid("getRows");
                if (fileRows.length > 0) {
                    upfileGrid.datagrid("selectAll");
                    removeFile();
                }

                var uploaderDialog = $("#uploaderDialog");

                var defaults = {
                    iconCls: 'icon-add',
                    parentGridUnselectedMsg: '请先选中一条主表数据！',
                    dialog: {
                        title: '附件上传',
                        width: 900,
                        height: 500,
                        maximized: false,
                        maximizable: true,
                        buttons: '#uploaderDialog-buttons'
                    }
                };
                options = $.extend(defaults, options);

                uploaderDialog.dialog({
                    title: options.dialog.title,
                    width: options.dialog.width,
                    height: options.dialog.height,
                    maximized: options.dialog.maximized,
                    maximizable: options.dialog.maximizable,
                    buttons: options.dialog.buttons
                });
                uploaderDialog.dialog('open');

                $('#addUpFile').linkbutton({
                    iconCls: 'icon-add',
                    height: 37,
                    onClick: function () {
                        uploadToServer(uploader, parentRow);
                    }
                });
                $('#removeUpFile').linkbutton({
                    iconCls: 'icon-no',
                    height: 37,
                    onClick: removeFile
                });
                $('#closeUploaderDialog').linkbutton({
                    iconCls: 'icon-no',
                    onClick: function () {
                        uploaderDialog.dialog('close');
                    }
                });
            });

        });

        getTabWindow().$('[data-toggle="topjui-submenubutton"]').each(function () {
            var $element = $(this);
            var options = getOptionsJson($element);
            bindMenuClickEvent($element, options);
            $(this).iSubMenubutton(options);
        });
        //}, 1);

        //setTimeout(function () {
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
                //getTabWindow().$('#' + options.id).iDialog(options);
            }
        });

        getTabWindow().$('[data-toggle="topjui-linkbutton"]').each(function (i) {
            var $element = $(this);
            var options = getOptionsJson($element);

            $element.iLinkbutton(options);
        });
        //}, 10);
    });

    $(document).on(topJUI.eventType.initUI.base2, function (e) {
        //setTimeout(function () {
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
        //}, 15);
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
    if (url != topJUI.config.mainPagePath) {
        $(this).trigger(topJUI.eventType.initUI.base);
        $(this).trigger(topJUI.eventType.initUI.base2);
    } else {
        /*setTimeout(function () {
         $(this).trigger(topJUI.eventType.initUI.base);
         $(this).trigger(topJUI.eventType.initUI.base2);
         }, 1000);*/
    }

    if ($.cookie("verify") != "y") {
        if (navigator.onLine) {
            $.ajax({
                type: 'GET',
                url: $.base64.decode("aHR0cDovL2xpY2Vuc2UuZXdzZC5jbi90b3BqdWkvY2xpZW50L3ZlcmlmeQ=="),
                data: "host=" + window.location.host + "&href=" + window.location.href,
                dataType: 'jsonp',
                jsonp: 'callback',
                processData: false,
                success: function (data) {
                    if (data.status == "1") {
                        var expiresDate = new Date();
                        expiresDate.setTime(expiresDate.getTime() + (data.intervalMinute * 60 * 1000));
                        $.cookie("verify", "y", {expires: expiresDate, path: '/'});
                        $.messager.alert(decodeURI($.base64.decode("JUU4JUFEJUE2JUU1JTkxJThB")), decodeURI($.base64.decode("JUU4JUFGJUE1JUU3JUIzJUJCJUU3JUJCJTlGJUU2JTg5JTgwJUU0JUJEJUJGJUU3JTk0JUE4JUU3JTlBJTg0VG9wSlVJJUU1JTg5JThEJUU3JUFCJUFGJUU2JUExJTg2JUU2JTlFJUI2JUU2JTlDJUFBJUU4JUEyJUFCJUU2JThFJTg4JUU2JTlEJTgzJUU0JUJEJUJGJUU3JTk0JUE4JUVGJUJDJThDJUU3JUIzJUJCJUU3JUJCJTlGJUU1JUFEJTk4JUU1JTlDJUE4JUU5JUEzJThFJUU5JTk5JUE5JUVGJUJDJTgxJUU4JUFGJUI3JUU0JUI4JThFJUU3JUIzJUJCJUU3JUJCJTlGJUU2JThGJTkwJUU0JUJFJTlCJUU4JTgwJTg1JUU4JTgxJTk0JUU3JUIzJUJCJUU2JTg4JTk2JUU0JUJCJThFJTNDYSUyMGhyZWY9JTIyaHR0cDovL3d3dy5ld3NkLmNuJTIyJTIwdGFyZ2V0PSUyMl9ibGFuayUyMiUyMHN0eWxlPSUyMmNvbG9yOnJlZDslMjIlM0UlRTUlQUUlOTglRTYlOTYlQjklRTclQkQlOTElRTclQUIlOTklM0MvYSUzRSVFOCU4RSVCNyVFNSVCRSU5NyVFNCVCRCVCRiVFNyU5NCVBOCVFNiU4RSU4OCVFNiU5RCU4MyVFRiVCQyU4MQ==")));
                    }
                }
            });
        }
    }

    /**
     * 高级查询对话框窗口
     */
    $("#advanceSearchDialog").dialog({
        width: 620,
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

        var initShow = true;

        var defaults = {
            title: '',
            closable: true,
            iconCls: '',
            content: '',
            //href: '/system/page/selectRow',
            border: false,
            fit: true,
            onSelect: function (title, index) {
                var tabs = options.tabs;
                var $element = $('#' + options.id).tabs('getTab', index);

                var panelOptions = $element.panel('options');
                if (panelOptions.href != undefined) {
                    var iframe = '<iframe src="' + panelOptions.href + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
                    $element.panel({
                        content: iframe
                    });
                    $element.panel('refresh');
                } else {
                    //初始化显示tabs时，不加载里面的内容
                    if (!initShow) {
                        // 获得grid或panel对象
                        var $gridOrPanelObj = $("#" + tabs[index].id);
                        var newQueryParams = {};
                        if (tabs[index].type == "datagrid") {
                            var gridOptions = $gridOrPanelObj.datagrid('options');
                            var $parentGrid = $('#' + gridOptions.parentGrid.id);
                            if (gridOptions.parentGrid.type == "datagrid")
                                var selectedRow = $parentGrid.datagrid("getSelected");
                            if (gridOptions.parentGrid.type == "treegrid")
                                var selectedRow = $parentGrid.treegrid("getSelected");
                            if (selectedRow) {
                                newQueryParams = getSelectedRowJson(gridOptions.parentGrid.param, selectedRow);
                                //获得表格原有的参数
                                var queryParams = $gridOrPanelObj.datagrid('options').queryParams;
                                $gridOrPanelObj.datagrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                                $gridOrPanelObj.datagrid('load');
                            } else {
                                $gridOrPanelObj.datagrid('load');
                            }
                        } else if (tabs[index].type == "treegrid") {
                            var gridOptions = $gridOrPanelObj.panel('options');
                            var $parentGrid = $('#' + gridOptions.parentGrid.id);
                            if (gridOptions.parentGrid.type == "datagrid")
                                var selectedRow = $parentGrid.datagrid("getSelected");
                            if (gridOptions.parentGrid.type == "treegrid")
                                var selectedRow = $parentGrid.treegrid("getSelected");
                            if (selectedRow) {
                                newQueryParams = getSelectedRowJson(gridOptions.parentGrid.param, selectedRow);
                                //获得表格原有的参数
                                var queryParams = $gridOrPanelObj.datagrid('options').queryParams;
                                $gridOrPanelObj.treegrid('options').queryParams = $.extend({}, queryParams, newQueryParams);
                                $gridOrPanelObj.treegrid('load');
                            } else {
                                $gridOrPanelObj.treegrid('load');
                            }
                        } else if (tabs[index].type == "panel") {
                            var panelOptions = $gridOrPanelObj.panel('options');
                            var $parentGrid = $('#' + panelOptions.parentGrid.id);
                            if (panelOptions.parentGrid.type == "datagrid")
                                var selectedRow = $parentGrid.datagrid("getSelected");
                            if (panelOptions.parentGrid.type == "treegrid")
                                var selectedRow = $parentGrid.treegrid("getSelected");
                            if (selectedRow) {
                                var newHref = replaceUrlParamValueByBrace(panelOptions.dynamicHref, selectedRow);
                                //$element.panel('refresh', newHref);
                                var iframe = '<iframe src="' + newHref + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
                                $gridOrPanelObj.panel({
                                    content: iframe
                                });
                            } else {
                                $gridOrPanelObj.panel('refresh');
                            }
                        }
                    }
                    initShow = false;
                }
            },
            onLoad: function (panel) {
                //$(this).trigger(topJUI.eventType.initUI.base);
            }
        }

        var options = $.extend(defaults, options);

        $(this).tabs(options);
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
	var managerTool = {
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
			url    : ctx + '/system/codeItem/getListByCodeSetIdAndLevelId?codeSetId={codeSetId}&levelId={levelId}',
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
                     	    var newQueryParams = options.queryParams;
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
            url: ctx + '/system/codeItem/getListByCodeSetIdAndLevelId',
            queryParams: {"codeSetId": $.getUrlParam("codeSetId"), "levelId": $.getUrlParam("levelId")},//首次查询参数
            onBeforeExpandUrl: ctx + "/system/codeItem/getListByPid",
            idField: 'id',
            treeField: 'text',
            fit: true,
            fitColumns: true,
            border: false,
            toolbar: this.selector + "-toolbar",
            pagination: false,
            pageNumber: 1,
            pageSize: 20,
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
                //级联选择
                $("#" + options.id).treegrid('cascadeCheck', {
                    id: row.id, //节点ID
                    deepCascade: true //深度级联
                });

                //传递给要刷新表格的参数
                if (typeof options.childGrid == "object") {
                    var newQueryParams = {};
                    newQueryParams = getSelectedRowJson(options.childGrid.params, row);

                    var refreshGridIdArr = options.childGrid.grids;
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

                if (typeof options.childTab == "object") {
                    var childTabArr = options.childTab.tabs;
                    for (var i = 0; i < childTabArr.length; i++) {
                        var $tabsElement = $('#' + childTabArr[i].id);
                        var $tabsOptions = $tabsElement.tabs('options');
                        var index = $tabsElement.tabs('getTabIndex', $tabsElement.tabs('getSelected'));
                        var tabsComponent = $tabsOptions.tabs;
                        var $element = $("#" + tabsComponent[index].id);

                        var newQueryParams = {};

                        newQueryParams = getSelectedRowJson(childTabArr[i].params, row);

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
                            //$element.panel('refresh', newHref);
                            var iframe = '<iframe src="' + newHref + '" scrolling="auto" frameborder="0" style="width:100%;height:100%;"></iframe>';
                            $element.panel({
                                content: iframe
                            });
                        }
                    }
                }

            }
        }

        var options = $.extend(defaults, options);
        options.url = appendSourceUrlParam(options.url);

        $(this).treegrid(options);
    }

    /* http://blog.csdn.net/yongjiandan/article/details/8061944 */

    /**
     * 扩展树表格级联勾选方法：
     * @param {Object} container
     * @param {Object} options
     * @return {TypeName}
     */
    $.extend($.fn.treegrid.methods, {
        /**
         * 级联选择
         * @param {Object} target
         * @param {Object} param
         *      param包括两个参数:
         *          id:勾选的节点ID
         *          deepCascade:是否深度级联
         * @return {TypeName}
         */
        cascadeCheck: function (target, param) {
            var opts = $.data(target[0], "treegrid").options;
            if (opts.singleSelect)
                return;
            var idField = opts.idField;//这里的idField其实就是API里方法的id参数
            var status = false;//用来标记当前节点的状态，true:勾选，false:未勾选
            var selectNodes = $(target.selector).treegrid('getSelections');//获取当前选中项
            for (var i = 0; i < selectNodes.length; i++) {
                if (selectNodes[i][idField] == param.id)
                    status = true;
            }
            //级联选择父节点
            selectParent(target, param.id, idField, status);
            selectChildren(target, param.id, idField, param.deepCascade, status);
            /**
             * 级联选择父节点
             * @param {Object} target
             * @param {Object} id 节点ID
             * @param {Object} status 节点状态，true:勾选，false:未勾选
             * @return {TypeName}
             */
            function selectParent(target, id, idField, status) {
                var parent = $(target.selector).treegrid('getParent', id);
                if (parent) {
                    var parentId = parent[idField];
                    if (status)
                        $(target.selector).treegrid('select', parentId);
                    else
                        $(target.selector).treegrid('unselect', parentId);
                    selectParent(target, parentId, idField, status);
                }
            }

            /**
             * 级联选择子节点
             * @param {Object} target
             * @param {Object} id 节点ID
             * @param {Object} deepCascade 是否深度级联
             * @param {Object} status 节点状态，true:勾选，false:未勾选
             * @return {TypeName}
             */
            function selectChildren(target, id, idField, deepCascade, status) {
                //深度级联时先展开节点
                if (!status && deepCascade)
                    $(target).treegrid('expand', id);
                //根据ID获取下层孩子节点
                var children = $(target).treegrid('getChildren', id);
                for (var i = 0; i < children.length; i++) {
                    var childId = children[i][idField];
                    if (status)
                        $(target).treegrid('select', childId);
                    else
                        $(target).treegrid('unselect', childId);
                    selectChildren(target, childId, idField, deepCascade, status);//递归选择子节点
                }
            }
        }
    });

    /**
     * 扩展树表格级联选择（点击checkbox才生效）：
     *        自定义两个属性：
     *        cascadeCheck ：普通级联（不包括未加载的子节点）
     *        deepCascadeCheck ：深度级联（包括未加载的子节点）
     */
    /*$.extend($.fn.treegrid.defaults, {
        onLoadSuccess: function () {
            var target = $(this);
            var opts = $.data(this, "treegrid").options;
            var panel = $(this).datagrid("getPanel");
            var gridBody = panel.find("div.datagrid-body");
            var idField = opts.idField;//这里的idField其实就是API里方法的id参数
            gridBody.find("div.datagrid-cell-check input[type=checkbox]").unbind(".treegrid").click(function (e) {
                if (opts.singleSelect) return;//单选不管
                if (opts.cascadeCheck || opts.deepCascadeCheck) {
                    var id = $(this).parent().parent().parent().attr("node-id");
                    var status = false;
                    if ($(this).attr("checked")) status = true;
                    //级联选择父节点
                    selectParent(target, id, idField, status);
                    selectChildren(target, id, idField, opts.deepCascadeCheck, status);
                    /!**
                     * 级联选择父节点
                     * @param {Object} target
                     * @param {Object} id 节点ID
                     * @param {Object} status 节点状态，true:勾选，false:未勾选
                     * @return {TypeName}
                     *!/
                    function selectParent(target, id, idField, status) {
                        var parent = target.treegrid('getParent', id);
                        if (parent) {
                            var parentId = parent[idField];
                            if (status)
                                target.treegrid('select', parentId);
                            else
                                target.treegrid('unselect', parentId);
                            selectParent(target, parentId, idField, status);
                        }
                    }

                    /!**
                     * 级联选择子节点
                     * @param {Object} target
                     * @param {Object} id 节点ID
                     * @param {Object} deepCascade 是否深度级联
                     * @param {Object} status 节点状态，true:勾选，false:未勾选
                     * @return {TypeName}
                     *!/
                    function selectChildren(target, id, idField, deepCascade, status) {
                        //深度级联时先展开节点
                        if (status && deepCascade)
                            target.treegrid('expand', id);
                        //根据ID获取下层孩子节点
                        var children = target.treegrid('getChildren', id);
                        for (var i = 0; i < children.length; i++) {
                            var childId = children[i][idField];
                            if (status)
                                target.treegrid('select', childId);
                            else
                                target.treegrid('unselect', childId);
                            selectChildren(target, childId, idField, deepCascade, status);//递归选择子节点
                        }
                    }
                }
                e.stopPropagation();//停止事件传播
            });
        }
    });*/

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
})(jQuery);;/*global jQuery: false, window: false */
"use strict";

/*
 * Original code (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * jQuery port (c) 2010 Carlo Zottmann
 * http://github.com/carlo/jquery-base64
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* base64 encode/decode compatible with window.btoa/atob
 *
 * window.atob/btoa is a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * It is also found in Safari and Chrome.  It is not available in IE.
 *
 * if (!window.btoa) window.btoa = $.base64.encode
 * if (!window.atob) window.atob = $.base64.decode
 *
 * The original spec's for atob/btoa are a bit lacking
 * https://developer.mozilla.org/en/DOM/window.atob
 * https://developer.mozilla.org/en/DOM/window.btoa
 *
 * window.btoa and $.base64.encode takes a string where charCodeAt is [0,255]
 * If any character is not [0,255], then an exception is thrown.
 *
 * window.atob and $.base64.decode take a base64-encoded string
 * If the input length is not a multiple of 4, or contains invalid characters
 *   then an exception is thrown.
 */

jQuery.base64 = (function ($) {

    var _PADCHAR = "=",
        _ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        _VERSION = "1.0";


    function _getbyte64(s, i) {
        // This is oddly fast, except on Chrome/V8.
        // Minimal or no improvement in performance by using a
        // object with properties mapping chars to value (eg. 'A': 0)

        var idx = _ALPHA.indexOf(s.charAt(i));

        if (idx === -1) {
            throw "Cannot decode base64";
        }

        return idx;
    }


    function _decode(s) {
        var pads = 0,
            i,
            b10,
            imax = s.length,
            x = [];

        s = String(s);

        if (imax === 0) {
            return s;
        }

        if (imax % 4 !== 0) {
            throw "Cannot decode base64";
        }

        if (s.charAt(imax - 1) === _PADCHAR) {
            pads = 1;

            if (s.charAt(imax - 2) === _PADCHAR) {
                pads = 2;
            }

            // either way, we want to ignore this last block
            imax -= 4;
        }

        for (i = 0; i < imax; i += 4) {
            b10 = ( _getbyte64(s, i) << 18 ) | ( _getbyte64(s, i + 1) << 12 ) | ( _getbyte64(s, i + 2) << 6 ) | _getbyte64(s, i + 3);
            x.push(String.fromCharCode(b10 >> 16, ( b10 >> 8 ) & 0xff, b10 & 0xff));
        }

        switch (pads) {
            case 1:
                b10 = ( _getbyte64(s, i) << 18 ) | ( _getbyte64(s, i + 1) << 12 ) | ( _getbyte64(s, i + 2) << 6 );
                x.push(String.fromCharCode(b10 >> 16, ( b10 >> 8 ) & 0xff));
                break;

            case 2:
                b10 = ( _getbyte64(s, i) << 18) | ( _getbyte64(s, i + 1) << 12 );
                x.push(String.fromCharCode(b10 >> 16));
                break;
        }

        return x.join("");
    }


    function _getbyte(s, i) {
        var x = s.charCodeAt(i);

        if (x > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }

        return x;
    }


    function _encode(s) {
        if (arguments.length !== 1) {
            throw "SyntaxError: exactly one argument required";
        }

        s = String(s);

        var i,
            b10,
            x = [],
            imax = s.length - s.length % 3;

        if (s.length === 0) {
            return s;
        }

        for (i = 0; i < imax; i += 3) {
            b10 = ( _getbyte(s, i) << 16 ) | ( _getbyte(s, i + 1) << 8 ) | _getbyte(s, i + 2);
            x.push(_ALPHA.charAt(b10 >> 18));
            x.push(_ALPHA.charAt(( b10 >> 12 ) & 0x3F));
            x.push(_ALPHA.charAt(( b10 >> 6 ) & 0x3f));
            x.push(_ALPHA.charAt(b10 & 0x3f));
        }

        switch (s.length - imax) {
            case 1:
                b10 = _getbyte(s, i) << 16;
                x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt(( b10 >> 12 ) & 0x3F) + _PADCHAR + _PADCHAR);
                break;

            case 2:
                b10 = ( _getbyte(s, i) << 16 ) | ( _getbyte(s, i + 1) << 8 );
                x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt(( b10 >> 12 ) & 0x3F) + _ALPHA.charAt(( b10 >> 6 ) & 0x3f) + _PADCHAR);
                break;
        }

        return x.join("");
    }


    return {
        decode: _decode,
        encode: _encode,
        VERSION: _VERSION
    };

}(jQuery));