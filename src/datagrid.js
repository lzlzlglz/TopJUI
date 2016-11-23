(function($){
	
	$.fn.myDatagrid = function(options) {
			
		var defaults = {
		    datagridId:this.get(0).id,       // datagrid table id
		    width:"auto",
		    height:"auto",
		    autoRowHeight: false,
		    nowrap: true,
		    striped:true,
		    singleSelect:true,
		    url:"",          //datagrid data load url from ajax
		    columns:[],          //datagrid columns ,must to be []
			loadMsg:'数据加载中,请稍后...',
			rownumbers: true,
	        pagination: true,
	        pageNumber: 1,
	        pageSize: 20,
			queryFormId:"",      // search form id
			queryAction:"",      // search from action
			infoFormId:"",       // info form id
			infoAddAction:"",    // info data add action
			infoUpdateAction:"", //info update action
			infoDlgDivId:"",     // info data detail/edit dlg div id
			deleteAction:"",     //data delete action  from ajax
			deleteMsg:"",        // show the message before do delete
			moveDlgDivId:"",     // the div id of dialog for move show
			moveFormId:"",       //the form id for move
			moveTreeId:"",       // the combotree id for move
			queryParams:{},      //search params name for post, must to be {}
			queryParamsVCN:{},   //search params value from htmlcontrol name, must to be {}
		}
		
		var options = $.extend(defaults, options);
		
		$('#'+ options.datagridId).datagrid({
	        width: options.width,
	        height: options.height,
	        autoRowHeight: options.autoRowHeight,
	        nowrap: options.nowrap,
	        striped: options.striped,
	        singleSelect : options.singleSelect,
	        url: options.url,
	        //queryParams:{},
	        loadMsg: options.loadMsg,
	        rownumbers: options.rownumbers,
	        pagination: options.pagination,
	        pageNumber: options.pageNumber,
	        pageSize: options.pageSize,
	        columns: [options.columns]
	    });
	
		//重新加载datagrid的数据
		$("#"+ options.datagridId).datagrid('reload');
		
	}

})(jQuery);