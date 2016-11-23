(function($){
	
	$.fn.iUploadify = function(options) {
		var defaults = {
			'width'    : 120,
			'height'   : 22,
			'buttonText' : '请选择上传文件',
			'button_image_url' : ctx + '/Static/topjui/plugins/uploadify/blackDot.png',
			'swf'      : ctx + '/Static/topjui/plugins/uploadify/uploadify.swf',
			'uploader' : ctx + '/system/attachment/upload;jsessionid=' + $("#jsessionid").val(),
			'formData' : {
				'module' : '没有设置',
				'category' : '没有设置',
				'pid' : '没有设置'
			},
			'auto'          : true,
			'multi'         : false,
            'removeCompleted':true,
			'fileTypeExts'  : '*.doc;*.docx;*.xls;*.ppt;*.rar;*.jpg;*.jpge;*.gif;*.png',
            'fileSizeLimit' : '20MB'
		}
		
		var options = $.extend(defaults, options);
		
		$(this).uploadify({
			'width'    : options.width,
			'height'   : options.height,
			'buttonText' : options.buttonText,
			'button_image_url' : options.button_image_url,
			'swf'      : options.swf,
			'uploader' : 	options.uploader,
			'formData' : options.formData,
			'auto'          : options.auto,
			'multi'         : options.multi,
            'removeCompleted':options.removeCompleted,
			'fileTypeExts'  : options.fileTypeExts,
            'fileSizeLimit' : options.fileSizeLimit,
            'onSelect' : uploadify_onSelect,
            'onUploadSuccess':uploadify_onUploadSuccess,
            //加上此句会重写onSelectError方法【需要重写的事件】
            'overrideEvents': ['onSelectError', 'onDialogClose'],
            //返回一个错误，选择文件的时候触发
            'onSelectError' : uploadify_onSelectError
		});
		
	}
	
	//选择文件调用的方法
	var uploadify_onSelect = function(file) {
    	this.addPostParam("fileName",encodeURI(file.name));//改变文件名的编码
    }
	
	var uploadify_onUploadSuccess = function(file,data,response){
        //$('#' + file.id).find('.data').html('');
        //$("#upload_org_code_name").val(data);
        //$("#upload_org_code_img").attr("src","${pageContext.request.contextPath}/getImg?file="+data);   
        //$("#upload_org_code_img").show();
		
		$(".attachTable").append('<tr><td class="label">'+file.name+'</td><td class="label">'+file.size+'</td><td class="label"></td><td class="label"></td></tr>');
    }
	
	var uploadify_onSelectError = function(file, errorCode, errorMsg){
        switch(errorCode) {
            case -110:
                alert("文件 ["+file.name+"] 大小超出系统限制的" + jQuery('#file_upload').uploadify('settings', 'fileSizeLimit') + "大小！");
                break;
            case -120:
                alert("文件 ["+file.name+"] 大小异常！");
                break;
            case -130:
                alert("文件 ["+file.name+"] 类型不正确！");
                break;
        }
    }

})(jQuery);