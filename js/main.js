;(function (){
	'use strict';

	var $form_add_task = $('.add-task'),
		$task_delete_trigger,
		$task_delete,
		$task_detail_trigger,
		$task_detail,
		$task_detail = $('.task-detail'),
		$task_detail_mask = $('.task-detail-mask'),
		task_list = [],
		current_index,
		$update_form,
		$task_detail_content,
		$task_detail_content_input,
		$checkbox_complete,
		$msg = $('.msg'),
		$msg_content = $msg.find('.msg-content'),
		$msg_confirm = $msg.find('.confirmed'),
		$alerter = $('.alerter');

	init();

	$form_add_task.on('submit',on_add_task_form_submit);
	$task_detail_mask.on('click',hide_task_detail);

	function listen_msg_evevt() {
		$msg_confirm.on('click',function() {
			hide_msg();
		})
	}

	function on_add_task_form_submit(e) {
		var new_task = {};
		/*禁用默认行为*/
		e.preventDefault();
		/*获取新Task的值*/
		var $input = $(this).find('input[name=content]');
		new_task.content = $input.val();
		/*如果新Task的值为空 则直接返回 否则继续执行*/
		if (!new_task.content) return;
		/*存入新Task*/
		if (add_task(new_task)) {
			$input.val(null);
		}
	}

	function listen_task_detail() {
		var index;
		$('.task-item').on('dblclick',function() {
			index = $(this).data('index');
			show_task_detail(index);
		})

		$task_detail_trigger.on('click',function() {
			var $this = $(this);
			var $item = $this.parent().parent();
			index = $item.data('index');
			show_task_detail(index);
		})
	}

	function listen_checkbox_complete() {
		$checkbox_complete.on('click',function() {
			var $this = $(this);
			// var is_complete = $this.is(':checked');
			var index = $this.parent().parent().data('index');
			var item = get(index);
			if(item.complete) {
				update_task(index,{complete:false});
			} else {
				update_task(index,{complete:true});
			}
			// update_task(index,{complete:is_complete});
		})
	}

	function get(index) {
		return store.get('task_list')[index];
	}

	/*查看task详情*/
	function show_task_detail(index) {
		/*生成详情模板*/
		render_task_detail(index);
		current_index = index;
		/*显示详情模板（默认隐藏）*/
		$task_detail.show();
		$task_detail_mask.show();
	}

	/*更新task*/
	function update_task(index,data) {
		if(!index === undefined || !task_list[index]) return;
		task_list[index] = $.extend({},task_list[index],data);
		refresh_task_list();
	}

	function hide_task_detail() {
		$task_detail.hide();
		$task_detail_mask.hide();
	}

	function render_task_detail(index) {
		if(index === undefined || !task_list[index]) return;
		var item = task_list[index];
		var tpl = 
			'<form>' +
	    '<div class="content">' +
	    item.content +
	    '</div>' +
			'<div class="input-item"><input style="display:none;" type="text" name="content" value="'+
			(item.content || '') +
			'"></div>' +
	    '<div>' +
	    '<div class="desc input-item">' +
			'<textarea name="desc">' +
			(item.desc || '') +
			'</textarea>' +
	    '</div>' +
	    '</div>' +
	    '<div class="remind input-item">' +
			'<label>提醒时间</label>' +
	    '<input class="datetime" name="remind_date" type="text" value="' +
			(item.remind_date || '') +
			'">' +
	    '</div>' +
			'<div class="input-item"><button type="submit">更新</button></div>' +
			'</form>';

		/*清空task详情模板*/
		$task_detail.html(null);
		/*添加新模板*/
		$task_detail.html(tpl);
		$('.datetime').datetimepicker();
		$update_form = $task_detail.find('form');
		$task_detail_content = $update_form.find('.content');
		$task_detail_content_input = $update_form.find('[name=content]');

		$task_detail_content.on('dblclick',function() {
			$task_detail_content_input.show();
			$task_detail_content.hide();
		})

		$update_form.on('submit',function(e) {
			e.preventDefault();
			var data = {};
			data.content = $(this).find('[name=content]').val();
			data.desc = $(this).find('[name=desc]').val();
			data.remind_date = $(this).find('[name=remind_date]').val();
			update_task(index,data);
			hide_task_detail();
		})

	}

	/*查找并监听所有删除按钮的点击事件*/
	function listen_task_delete() {
		$task_delete_trigger.on('click',function() {
		    var $this = $(this);
			/*找到删除按钮所在的task元素*/
		    var $item = $this.parent().parent();
		    var index = $item.data('index');
		    var tmp = confirm('确定删除？');
		    tmp ? delete_task(index) : null;
	    })
	}

	function add_task(new_task) {
		/*将新Task推入task_list*/
		task_list.push(new_task);
		/*更新localStorage*/
		refresh_task_list();
        return true;
    }

	/*刷新localstorage并渲染模板*/
	function refresh_task_list() {
    store.set('task_list',task_list);
		render_task_list();
	}

	/*删除一条task*/
	function delete_task(index) {
		/*如果没有index 或者index不存在 则直接返回*/
		if(index === undefined || !task_list[index]) return;

		delete task_list[index];
		refresh_task_list();
	}

	function init() {
		task_list = store.get('task_list') || [];
		listen_msg_evevt();
		if(task_list.length)
		  render_task_list();
		task_remind_check();
  }

	function task_remind_check() {
		var current_timestamp;
		var itl = setInterval(function() {
			for(var i=0; i < task_list.length;i++) {
				var item = get(i),task_timestamp;
				if(!item || !item.remind_date || item.informed)
					continue;	
				current_timestamp = (new Date()).getTime();
				task_timestamp = (new Date(item.remind_date)).getTime();
				if(current_timestamp - task_timestamp >=1) {
					update_task(i,{informed:true});
					show_msg(item.content);
				}
			}
		},300);
	
	}

	function show_msg(msg) {
		if(!msg) return;
		$msg_content.html(msg);
		$alerter.get(0).play();
		$msg.show();
	}

	function hide_msg() {
		$msg.hide();
	}

  /*渲染所有task模板*/ 
  function render_task_list() {
		var $task_list = $('.task-list');
		$task_list.html('');
		var complete_items = [];

		for(var i = 0;i < task_list.length;i++) {
			var item = task_list[i];
			if(item && item.complete)
				complete_items[i] = item;
			else
				var $task = render_task_item(item,i);
			$task_list.prepend($task);
		}

		for(var j = 0;j < complete_items.length;j++) {
			$task = render_task_item(complete_items[j],j);
			if(!$task) continue;
			$task.addClass('completed');
		  $task_list.append($task);
		}

		$task_delete_trigger = $('.action.delete');
		$task_detail_trigger = $('.action.detail');
		$checkbox_complete = $('.task-list .complete[type=checkbox]');
		listen_task_delete();
		listen_task_detail();
		listen_checkbox_complete();
  }
    
	/*渲染单条task模板*/
  function render_task_item(data,index) {
		
		if(!data || !index) return;
        var list_item_tpl =
          '<div class="task-item" data-index="'+index+'">' +
          '<span><input class="complete" type="checkbox"' +
					(data.complete ? ' checked' : '') +
					'></span>' +
          '<span class="task-content">' + data.content + '</span>' +
					'<span class="fr">' +
          '<span class="action delete"> 删除</span>' +
          '<span class="action detail"> 详细</span>' +
					'</span>' +
          '</div>';
        return $(list_item_tpl);
    }
})();