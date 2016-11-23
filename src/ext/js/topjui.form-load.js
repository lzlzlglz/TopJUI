$(function(){
	
	var clsArray = "";
	function getClsArray(selector){
		var cls=$(selector).attr("class");
		clsArray = cls.split(" ");
	}
	
	function commonOptions(json, i){
		if(clsArray[i].indexOf("required") >= 0)
			json["required"] = true;
		if(clsArray[i].indexOf("readonly") >= 0)
			json["readonly"] = true;
		if(clsArray[i].indexOf("450") >= 0)
			json["width"] = 450;
		if(clsArray[i].indexOf("700") >= 0)
			json["width"] = 700;
	}
	
	$("input[class^='topjui-textbox']").each(function(i) {
		var json = {};
		getClsArray($(this));
		for(i=0; i<clsArray.length; i++) {
			if(clsArray[i].indexOf("topjui-textbox-") >= 0) {
				commonOptions(json, i);
			}
		}
		$(this).iTextbox(json);
	});
	
	$("input[class^='topjui-textarea']").each(function(i) {
		var json = {};
		getClsArray($(this));
		for(i=0; i<clsArray.length; i++) {
			if(clsArray[i].indexOf("topjui-textarea-") >= 0) {
				commonOptions(json, i);
			}
		}
		json["multiline"] = true;
		json["height"] = 66;
		$(this).iTextbox(json);
	});
	
	$("input[class^='topjui-datebox']").each(function(i) {
		var json = {};
		getClsArray($(this));
		var isArray = clsArray instanceof Array ? true : false;
		if(isArray) {
			for(i=0; i<clsArray.length; i++) {
				if(clsArray[i].indexOf("topjui-datebox-") >= 0) {
					commonOptions(json, i);
					if(clsArray[i].indexOf("ym") >= 0) {
						json["parser"] = function (s) {//配置parser，返回选择的日期
				            if (!s) return new Date();
				            var arr = s.split('-');
				            return new Date(parseInt(arr[0], 10), parseInt(arr[1], 10)-1, 1);
				        };
				        json["formatter"] = function(date) {
					    	var y = date.getFullYear();
					    	var m = date.getMonth()+1;
					    	var d = date.getDate();
					    	return y+'-'+m;
					    };
					}
				}
			}
		}
		$(this).iDatebox(json);
	});
	
	$("input[class^='topjui-numberspinner']").each(function(i) {
		var json = {};
		getClsArray($(this));
		for(i=0; i<clsArray.length; i++) {
			if(clsArray[i].indexOf("topjui-numberspinner-") >= 0) {
				commonOptions(json, i);
			}
		}
		$(this).iNumberspinner(json);
	});
	
	$("input[class^='topjui-numberbox']").each(function(i) {
		var json = {};
		getClsArray($(this));
		for(i=0; i<clsArray.length; i++) {
			if(clsArray[i].indexOf("topjui-numberbox-") >= 0) {
				commonOptions(json, i);
				if(clsArray[i].indexOf("money") >= 0) {
					json["groupSeparator"] = ',';
					json["prefix"] = '￥';
				}
			}
		}
		$(this).iNumberbox(json);
	});
	
	$(".topjui-validatebox").iValidatebox({
		
	});
	
	$(".topjui-yesOrNo").iCombobox({
		codeSetId   : 'ACA',
		levelId     : '1',
		panelHeight : 44
	});
	
	$(".topjui-enableOrDisable").iCombobox({
		codeSetId   : 'ACC',
		levelId     : '1',
		panelHeight : 44
	});
	
});